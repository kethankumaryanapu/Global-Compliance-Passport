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
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let requests: any[] = [];

    if (payload.role === 'STARTUP' && payload.companyId) {
      // Startups fetch requests sent by their company
      requests = await db.request.findMany({
        where: { companyId: payload.companyId },
        include: {
          institution: true,
        },
        orderBy: { requestedAt: 'desc' },
      });
    } else if (payload.role === 'INSTITUTION' && payload.institutionId) {
      // Institutions fetch requests/applications they received
      requests = await db.request.findMany({
        where: { institutionId: payload.institutionId },
        include: {
          company: {
            include: {
              passport: true,
              documents: true,
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      });
    } else if (payload.role === 'ADMIN') {
      // Admins load all requests
      requests = await db.request.findMany({
        include: {
          company: {
            include: {
              passport: true,
              documents: true,
            },
          },
          institution: true,
        },
        orderBy: { requestedAt: 'desc' },
      });
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Fetch requests error:', error);
    return NextResponse.json({ message: 'Internal server error occurred.' }, { status: 500 });
  }
}

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
    const { institutionId, purpose, documentTypes, sharedDocumentIds, sharePassport, additionalNotes } = body;

    if (!institutionId || !purpose || !documentTypes || !Array.isArray(documentTypes)) {
      return NextResponse.json(
        { message: 'Institution ID, purpose and list of requested document types are required.' },
        { status: 400 }
      );
    }

    // Create application request
    const shareRequest = await db.request.create({
      data: {
        institutionId,
        companyId: payload.companyId,
        documentTypes: JSON.stringify(documentTypes),
        status: 'SUBMITTED',
        sharedDocuments: JSON.stringify(sharedDocumentIds || []),
        purpose,
        additionalNotes: additionalNotes || '',
        sharePassport: sharePassport !== false,
      },
    });

    // Notify startup owner of successful submission
    await db.notification.create({
      data: {
        userId: payload.userId,
        title: 'Application Submitted',
        message: `Your application for ${purpose} has been successfully submitted.`,
        type: 'VERIFIED',
      },
    });

    // Notify institution owner
    const inst = await db.institution.findUnique({
      where: { id: institutionId },
      include: { user: true },
    });

    if (inst && inst.user) {
      // 1. New Application Alert
      await db.notification.create({
        data: {
          userId: inst.user.id,
          title: 'New Application',
          message: `${payload.companyName || 'A Startup'} has submitted a new application for ${purpose}.`,
          type: 'REQUEST',
        },
      });

      // 2. Shared Passport Alert
      if (sharePassport !== false) {
        await db.notification.create({
          data: {
            userId: inst.user.id,
            title: 'Startup Shared Passport',
            message: `${payload.companyName || 'A Startup'} has shared their Compliance Passport.`,
            type: 'SHARED',
          },
        });
      }

      // 3. Shared Documents Alert
      if (sharedDocumentIds && sharedDocumentIds.length > 0) {
        await db.notification.create({
          data: {
            userId: inst.user.id,
            title: 'Startup Shared Documents',
            message: `${payload.companyName || 'A Startup'} has shared ${sharedDocumentIds.length} verified documents.`,
            type: 'SHARED',
          },
        });
      }
    }

    // Write audit log trail
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        companyId: payload.companyId,
        action: 'SHARE',
        details: `Submitted application to institution ${inst?.name || 'Partner'} for purpose: ${purpose}. Shared passport: ${sharePassport !== false ? 'Yes' : 'No'}.`,
      },
    });

    return NextResponse.json({
      message: 'Application Submitted Successfully.',
      request: shareRequest,
    });
  } catch (error: any) {
    console.error('Create application error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error occurred.' },
      { status: 500 }
    );
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
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, status, action } = body;

    if (!requestId) {
      return NextResponse.json({ message: 'Request ID is required.' }, { status: 400 });
    }

    // Handle "view" action
    if (action === 'view') {
      const shareRequest = await db.request.findUnique({
        where: { id: requestId },
        include: {
          company: true,
          institution: true,
        },
      });

      if (!shareRequest) {
        return NextResponse.json({ message: 'Request not found.' }, { status: 404 });
      }

      // Verify that this institution is the receiver
      if (payload.role === 'INSTITUTION' && shareRequest.institutionId !== payload.institutionId) {
        return NextResponse.json({ message: 'Unauthorized view context.' }, { status: 403 });
      }

      // Check if "Application Viewed" notification has already been sent to avoid duplicates
      const existingNotif = await db.notification.findFirst({
        where: {
          userId: shareRequest.company.userId,
          title: 'Application Viewed',
          message: { contains: shareRequest.institution.name },
        },
      });

      if (!existingNotif) {
        await db.notification.create({
          data: {
            userId: shareRequest.company.userId,
            title: 'Application Viewed',
            message: `Your application has been viewed by ${shareRequest.institution.name}.`,
            type: 'VERIFIED',
          },
        });
      }

      return NextResponse.json({ message: 'Application view recorded.' });
    }

    // Standard status update
    if (!status) {
      return NextResponse.json({ message: 'Decision status is required.' }, { status: 400 });
    }

    // Fetch the request
    const shareRequest = await db.request.findUnique({
      where: { id: requestId },
      include: {
        company: true,
        institution: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!shareRequest) {
      return NextResponse.json({ message: 'Consent request not found.' }, { status: 404 });
    }

    // Verification check based on role
    if (payload.role === 'STARTUP') {
      if (shareRequest.companyId !== payload.companyId) {
        return NextResponse.json({ message: 'Unauthorized.' }, { status: 403 });
      }
      
      const { sharedDocumentIds, accessDays } = body;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (parseInt(accessDays) || 7));

      const updatedRequest = await db.request.update({
        where: { id: requestId },
        data: {
          status,
          sharedDocuments: JSON.stringify(sharedDocumentIds || []),
          respondedAt: new Date(),
          accessExpiry: status === 'APPROVED' || status === 'PARTIAL' ? expiryDate : null,
        },
      });

      await db.auditLog.create({
        data: {
          userId: payload.userId,
          companyId: payload.companyId,
          action: status === 'REJECTED' ? 'REVOKE' : 'SHARE',
          details: `Startup responded to ${shareRequest.institution.name} access request with status: ${status}.`,
        },
      });

      return NextResponse.json({
        message: 'Decision saved successfully!',
        request: updatedRequest,
      });
    }

    if (payload.role === 'INSTITUTION') {
      if (shareRequest.institutionId !== payload.institutionId) {
        return NextResponse.json({ message: 'Unauthorized.' }, { status: 403 });
      }

      if (action === 'request_additional') {
        const { additionalDocsRequest } = body;
        const updatedRequest = await db.request.update({
          where: { id: requestId },
          data: {
            status: 'ADDITIONAL_DOCUMENTS_REQUESTED',
            additionalDocsRequest: typeof additionalDocsRequest === 'string' ? additionalDocsRequest : JSON.stringify(additionalDocsRequest),
            respondedAt: new Date(),
          },
        });

        // Notify startup
        await db.notification.create({
          data: {
            userId: shareRequest.company.userId,
            title: 'Institution Requested Additional Documents',
            message: `${payload.name} has requested additional documents for your application.`,
            type: 'REQUEST',
          },
        });

        // Audit log
        await db.auditLog.create({
          data: {
            userId: payload.userId,
            companyId: shareRequest.companyId,
            action: 'VERIFY',
            details: `Institution ${payload.name} requested additional documents from ${shareRequest.company.name}.`,
          },
        });

        return NextResponse.json({
          message: 'Additional documents request sent successfully!',
          request: updatedRequest,
        });
      }

      const updatedRequest = await db.request.update({
        where: { id: requestId },
        data: {
          status,
          respondedAt: new Date(),
        },
      });

      // Generate notifications for the startup owner
      let title = 'Application Status Updated';
      let message = `Your application to ${payload.name} is now ${status.toLowerCase().replace('_', ' ')}.`;

      if (status === 'UNDER_REVIEW') {
        title = 'Application Under Review';
        message = `Your application to ${payload.name} is now under review.`;
      } else if (status === 'APPROVED') {
        title = 'Application Approved';
        message = `Congratulations! Your application to ${payload.name} has been approved.`;
      } else if (status === 'REJECTED') {
        title = 'Application Rejected';
        message = `Your application to ${payload.name} has been rejected.`;
      } else if (status === 'ADDITIONAL_DOCUMENTS_REQUESTED') {
        title = 'Institution Requested Additional Documents';
        message = `${payload.name} has requested additional documents for your application.`;
      } else if (status === 'COMPLETED') {
        title = 'Application Completed';
        message = `Your application review with ${payload.name} has been completed successfully.`;
      }

      await db.notification.create({
        data: {
          userId: shareRequest.company.userId,
          title,
          message,
          type: 'VERIFIED',
        },
      });

      // Write audit log
      await db.auditLog.create({
        data: {
          userId: payload.userId,
          companyId: shareRequest.companyId,
          action: status === 'APPROVED' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : 'VERIFY',
          details: `Institution ${payload.name} updated application status for ${shareRequest.company.name} to ${status}.`,
        },
      });

      return NextResponse.json({
        message: 'Application status updated successfully!',
        request: updatedRequest,
      });
    }

    return NextResponse.json({ message: 'Unauthorized role context.' }, { status: 403 });
  } catch (error: any) {
    console.error('Update request decision error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
