import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, status, comments } = body;

    if (!documentId || !status) {
      return NextResponse.json(
        { message: 'Missing documentId or target verification status.' },
        { status: 400 }
      );
    }

    // Find document with related company user context
    const doc = await db.document.findUnique({
      where: { id: documentId },
      include: {
        company: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ message: 'Document not found.' }, { status: 404 });
    }

    // Update document status
    await db.document.update({
      where: { id: documentId },
      data: {
        status,
        comments: comments || null,
      },
    });

    // Resolve PENDING verification queue entries or create audit trace
    const pendingVerification = await db.verification.findFirst({
      where: { documentId, status: 'PENDING' },
    });

    if (pendingVerification) {
      await db.verification.update({
        where: { id: pendingVerification.id },
        data: {
          status,
          adminId: payload.userId,
          comments: comments || null,
          reviewedAt: new Date(),
        },
      });
    } else {
      await db.verification.create({
        data: {
          documentId,
          status,
          adminId: payload.userId,
          comments: comments || null,
          reviewedAt: new Date(),
        },
      });
    }

    // Write audit log trail
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        companyId: doc.companyId,
        action: status === 'VERIFIED' ? 'APPROVE' : 'REJECT',
        details: `Admin reviewed ${doc.name} of type ${
          doc.type
        }. Action set to: ${status}. Comments: ${comments || 'No comments left.'}`,
      },
    });

    // Send notifications to the startup account owner
    await db.notification.create({
      data: {
        userId: doc.company.userId,
        title: `Verification Update: ${status === 'VERIFIED' ? 'Approved ✅' : 'Action Required ❌'}`,
        message: `Your document ${doc.name} was marked ${status.toLowerCase()} by the Compliance Admin. Comments: ${
          comments || 'None.'
        }`,
        type: status === 'VERIFIED' ? 'VERIFIED' : 'COMMENT',
      },
    });

    // Recompute compliance score
    await recalculateComplianceScore(doc.companyId);

    return NextResponse.json({ message: `Verification status successfully saved as: ${status}` });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}

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

  const updatedCompany = await db.company.update({
    where: { id: companyId },
    data: { complianceScore: score },
  });

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
