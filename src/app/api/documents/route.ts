import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { processDocumentOCR } from '@/lib/ocr';
import { runDocumentVerificationFlow, getExpectedCategoryName } from '@/lib/validationEngine';
import { processDocumentAI } from '@/lib/aiService';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'STARTUP' || !payload.companyId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid permissions' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const name = formData.get('name') as string;

    if (!file || !type) {
      return NextResponse.json({ message: 'File object and document type are required.' }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.resolve('public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileSuffix = `${Date.now()}-${name || file.name}`;
    const relativeUrl = `/uploads/${fileSuffix}`;
    const absoluteFilePath = path.join(uploadsDir, fileSuffix);

    // Write file buffer to local disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(absoluteFilePath, fileBuffer);

    // 1. Create a document record in state Uploading
    const doc = await db.document.create({
      data: {
        name: name || file.name,
        type,
        url: relativeUrl,
        status: 'Uploading',
        ocrData: '{}',
        companyId: payload.companyId,
      },
    });

    // Write audit log entry
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        companyId: payload.companyId,
        action: 'UPLOAD',
        details: `Uploaded document ${doc.name} (type: ${type}). Initializing AI Automated Verification.`,
      },
    });

    // 2. Perform mock AI/OCR field extraction
    const ocrResult = await processDocumentOCR(absoluteFilePath, type, payload.companyId, doc.id);

    // AI Pipeline Extension: Run LLM structured extraction post-OCR
    try {
      await processDocumentAI(doc.id, ocrResult.ocrText || '');
    } catch (aiErr) {
      console.error('LLM post-OCR structuring failed, continuing anyway:', aiErr);
    }

    // Run new document verification flow
    const verificationReport = await runDocumentVerificationFlow(
      doc.id,
      type, // Expected category code from select
      ocrResult.documentType, // Friendly classified name
      ocrResult.extractedFields,
      ocrResult.ocrText || '',
      ocrResult.confidenceScore,
      payload.companyId
    );

    // Map UI and DB status strings cleanly
    let finalStatus = 'Verification Failed';
    if (verificationReport.status === 'VERIFIED') {
      finalStatus = 'Verified';
    } else if (verificationReport.status === 'LOW_CONFIDENCE') {
      finalStatus = 'Low Confidence';
    }

    const aiDecisionComments = JSON.stringify(verificationReport);

    // Update document status to final decision and store extracted keys
    const updatedDoc = await db.document.update({
      where: { id: doc.id },
      data: {
        status: finalStatus,
        type: finalStatus === 'Verified' ? ocrResult.documentType : (getExpectedCategoryName(type) || type),
        ocrData: JSON.stringify(ocrResult.extractedFields),
        expiryDate: ocrResult.expiryDate,
        comments: aiDecisionComments,
      },
    });

    // Add entry to the verification queue marked as SYSTEM_AI auto-verification
    await db.verification.create({
      data: {
        documentId: doc.id,
        status: finalStatus === 'Verified' ? 'VERIFIED' : 'REJECTED',
        adminId: 'SYSTEM_AI',
        comments: aiDecisionComments,
        reviewedAt: new Date(),
      },
    });

    // Recompute compliance score immediately
    await recalculateComplianceScore(payload.companyId);

    const isSuccess = finalStatus === 'Verified';
    // Notify the startup of the immediate decision
    await db.notification.create({
      data: {
        userId: payload.userId,
        title: isSuccess ? 'AI Successfully Verified Your Document ✅' : 'AI Detected Issues In Your Document ⚠️',
        message: isSuccess 
          ? `Your document ${updatedDoc.name} (type: ${updatedDoc.type}) was successfully verified by the AI automated system with ${verificationReport.confidence}% confidence.` 
          : `The AI validation engine detected issues in your document ${updatedDoc.name}. Status: ${finalStatus}. Reason: ${verificationReport.reason}`,
        type: isSuccess ? 'VERIFIED' : 'COMMENT',
      },
    });

    // Write audit log entry for decision
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        companyId: payload.companyId,
        action: isSuccess ? 'APPROVE' : 'REJECT',
        details: `AI Automated Verification complete for ${updatedDoc.name}. Decision: ${finalStatus}. Score: ${verificationReport.confidence}%. Reason: ${verificationReport.reason}.`,
      },
    });

    return NextResponse.json(verificationReport);
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let documents: any[] = [];

    if (payload.role === 'STARTUP' && payload.companyId) {
      documents = await db.document.findMany({
        where: { companyId: payload.companyId },
        include: {
          aiExtraction: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'ADMIN') {
      documents = await db.document.findMany({
        include: {
          company: true,
          verifications: {
            orderBy: { reviewedAt: 'desc' },
            take: 1,
          },
          aiExtraction: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'INSTITUTION' && payload.institutionId) {
      if (companyId) {
        // Verify this institution is authorized to view this company's documents
        const consentRequest = await db.request.findFirst({
          where: {
            companyId,
            institutionId: payload.institutionId,
            status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED', 'PARTIAL'] },
          },
        });

        if (consentRequest) {
          documents = await db.document.findMany({
            where: { companyId },
            include: {
              aiExtraction: true,
            },
            orderBy: { createdAt: 'desc' },
          });
        }
      }
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Fetch documents error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Global utility helper to compute and update the compliance score of a startup
function getBaseCategory(type: string): string {
  const t = (type || '').toUpperCase();
  if (t === 'INCORPORATION' || t.includes('INCORPORATION') || t === 'COI') {
    return 'INCORPORATION';
  }
  if (t === 'PAN' || t.includes('PAN CARD') || t === 'PAN CARD') {
    return 'PAN';
  }
  if (t === 'GST' || t.includes('GST CERTIFICATE') || t === 'GST Certificate') {
    return 'GST';
  }
  if (t === 'FSSAI' || t.includes('FSSAI')) {
    return 'FSSAI';
  }
  if (t === 'PASSPORT' || t.includes('PASSPORT')) {
    return 'PASSPORT';
  }
  if (t === 'BANK_PROOF' || t.includes('BANK STATEMENT') || t.includes('BANK_PROOF')) {
    return 'BANK_PROOF';
  }
  if (t === 'KYC' || t.includes('DIR-3') || t.includes('DIRECTOR')) {
    return 'KYC';
  }
  if (t === 'TAX_CERTIFICATE' || t.includes('TAX CERTIFICATE')) {
    return 'TAX_CERTIFICATE';
  }
  if (t === 'BUSINESS_LICENSE' || t.includes('BUSINESS')) {
    return 'BUSINESS_LICENSE';
  }
  if (t === 'FINANCIALS' || t.includes('FINANCIAL')) {
    return 'FINANCIALS';
  }
  return t;
}

async function recalculateComplianceScore(companyId: string) {
  // Load all documents of this company ordered by creation date descending
  const allDocs = await db.document.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });

  // Get the latest document for each base category
  const latestDocsByBaseCategory = new Map<string, any>();
  for (const doc of allDocs) {
    const baseCat = getBaseCategory(doc.type);
    if (!latestDocsByBaseCategory.has(baseCat)) {
      latestDocsByBaseCategory.set(baseCat, doc);
    }
  }

  // Count total categories uploaded (excluding 'OTHER' if it represents generic spam)
  const uploadedCategories = Array.from(latestDocsByBaseCategory.keys()).filter(cat => cat !== 'OTHER' && cat !== 'Other');
  const totalUploaded = uploadedCategories.length;

  // Collect verified categories
  const verifiedBaseCategories = new Set<string>();
  for (const [baseCat, doc] of latestDocsByBaseCategory.entries()) {
    if (baseCat !== 'OTHER' && baseCat !== 'Other' && ['VERIFIED', 'AI_VALIDATED', 'Verified'].includes(doc.status)) {
      verifiedBaseCategories.add(baseCat);
    }
  }

  const totalVerified = verifiedBaseCategories.size;

  // Score = (Verified / max(3, Total Uploaded)) * 100
  const divider = Math.max(3, totalUploaded);
  let score = divider > 0 ? Math.round((totalVerified / divider) * 100) : 0;
  if (score > 100) score = 100;

  // Update Company score
  const updatedCompany = await db.company.update({
    where: { id: companyId },
    data: { complianceScore: score },
  });

  // Update active passport score
  await db.compliancePassport.updateMany({
    where: { companyId },
    data: {
      complianceScore: score,
      status: score >= 80 ? 'TRUSTED' : 'UNTRUSTED',
      digitalSignature: `SHA256:VERIFIED_HASH_${companyId.slice(0, 8)}_${score}_${Date.now()}`,
    },
  });

  // Send "Passport Updated" notification to institutions that have active applications
  const activeApplications = await db.request.findMany({
    where: {
      companyId,
      status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUESTED', 'PENDING'] }
    },
    include: {
      institution: {
        include: {
          user: true
        }
      }
    }
  });

  for (const app of activeApplications) {
    if (app.institution?.user) {
      await db.notification.create({
        data: {
          userId: app.institution.user.id,
          title: 'Passport Updated',
          message: `${updatedCompany.name} has updated their Compliance Passport (New Score: ${score}%).`,
          type: 'SHARED',
        }
      });
    }
  }

  return score;
}
