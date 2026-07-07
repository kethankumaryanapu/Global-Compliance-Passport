import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'STARTUP' || !payload.companyId) {
      return NextResponse.json({ message: 'Unauthorized: Startup context required' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientEmail, accessDays } = body;

    if (!recipientEmail || !accessDays) {
      return NextResponse.json(
        { message: 'Recipient email and access expiry duration are required.' },
        { status: 400 }
      );
    }

    // Check if recipient institution user exists
    let instUser = await db.user.findFirst({
      where: {
        email: recipientEmail,
        role: 'INSTITUTION',
      },
      include: {
        institution: true,
      },
    });

    // For frictionless testing, auto-create a mock institution if it doesn't exist
    if (!instUser) {
      const parts = recipientEmail.split('@')[0];
      const instName = parts.charAt(0).toUpperCase() + parts.slice(1) + ' Bank';
      
      const newUser = await db.user.create({
        data: {
          email: recipientEmail,
          name: instName,
          passwordHash: '$2a$10$xyzMockPasswordHashForSeedingFrictionlessSharing12345',
          role: 'INSTITUTION',
        },
      });

      const newInst = await db.institution.create({
        data: {
          name: instName,
          description: 'Automatically provisioned financial partner for credential verification',
          userId: newUser.id,
        },
      });

      instUser = { ...newUser, institution: newInst } as any;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(accessDays));

    // Get startup's verified documents to share
    const verifiedDocs = await db.document.findMany({
      where: {
        companyId: payload.companyId,
        status: { in: ['VERIFIED', 'AI_VALIDATED', 'Verified'] },
      },
    });

    const docIds = verifiedDocs.map((d) => d.id);
    const docTypes = verifiedDocs.map((d) => d.type);

    // Create approved sharing request representing voluntary disclosure
    const shareRequest = await db.request.create({
      data: {
        institutionId: instUser!.institution!.id,
        companyId: payload.companyId,
        documentTypes: JSON.stringify(docTypes),
        status: 'APPROVED',
        sharedDocuments: JSON.stringify(docIds),
        accessExpiry: expiryDate,
      },
    });

    // Write audit log trail
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        companyId: payload.companyId,
        action: 'SHARE',
        details: `Voluntarily shared compliance passport and verified documents with ${
          instUser!.name
        } (${recipientEmail}). Access expires on ${expiryDate.toLocaleDateString()}`,
      },
    });

    // Notify institution
    await db.notification.create({
      data: {
        userId: instUser!.id,
        title: 'Compliance Passport Shared',
        message: `${payload.companyName || 'A Startup'} has shared their Compliance Passport with you.`,
        type: 'SHARED',
      },
    });

    return NextResponse.json({
      message: 'Compliance Passport successfully shared!',
      requestId: shareRequest.id,
    });
  } catch (error: any) {
    console.error('Share passport error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
