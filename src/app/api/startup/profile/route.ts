import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.companyId) {
      return NextResponse.json({ message: 'Unauthorized: Startup context required' }, { status: 401 });
    }

    const company = await db.company.findUnique({
      where: { id: payload.companyId },
    });

    if (!company) {
      return NextResponse.json({ message: 'Company registry not found.' }, { status: 404 });
    }

    // Extract GST and PAN numbers from verified documents in the database
    const gstDoc = await db.document.findFirst({
      where: { companyId: company.id, type: 'GST' },
      orderBy: { createdAt: 'desc' }
    });
    const panDoc = await db.document.findFirst({
      where: { companyId: company.id, type: 'PAN' },
      orderBy: { createdAt: 'desc' }
    });

    let gstin = 'Not Uploaded';
    let pan = 'Not Uploaded';

    if (gstDoc && gstDoc.ocrData) {
      try {
        const ocr = JSON.parse(gstDoc.ocrData);
        gstin = ocr.gstin || ocr.gstNumber || 'Processing...';
      } catch (e) {
        gstin = 'Verification Pending';
      }
    }

    if (panDoc && panDoc.ocrData) {
      try {
        const ocr = JSON.parse(panDoc.ocrData);
        pan = ocr.pan || ocr.panNumber || 'Processing...';
      } catch (e) {
        pan = 'Verification Pending';
      }
    }

    return NextResponse.json({
      profile: {
        id: company.id,
        name: company.name,
        regNumber: company.regNumber,
        complianceScore: company.complianceScore,
        logo: company.logo || '',
        address: company.address || '',
        industry: company.industry || 'Tech & SaaS',
        country: company.country || 'India',
        gstin,
        pan,
        contactInfo: {
          email: payload.email,
          phone: '+91 98765 43210',
          supportEmail: 'contact@' + company.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
        }
      }
    });
  } catch (error) {
    console.error('Fetch profile API error:', error);
    return NextResponse.json({ message: 'Internal server error occurred.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.companyId) {
      return NextResponse.json({ message: 'Unauthorized: Startup context required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, industry, country, address, logo } = body;

    const updatedCompany = await db.company.update({
      where: { id: payload.companyId },
      data: {
        name: name || undefined,
        industry: industry || undefined,
        country: country || undefined,
        address: address || undefined,
        logo: logo || undefined,
      },
    });

    // Write audit log entry
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        companyId: payload.companyId,
        action: 'APPROVE',
        details: `Updated company profile registry settings. Country: ${updatedCompany.country}, Industry: ${updatedCompany.industry}.`,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully!',
      profile: updatedCompany,
    });
  } catch (error: any) {
    console.error('Update profile API error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
