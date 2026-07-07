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
      return NextResponse.json({ message: 'Unauthorized: Invalid session context' }, { status: 401 });
    }

    const passport = await db.compliancePassport.findUnique({
      where: { companyId: payload.companyId },
      include: {
        company: {
          include: {
            documents: {
              where: { status: { in: ['VERIFIED', 'AI_VALIDATED', 'Verified'] } },
            },
          },
        },
      },
    });

    if (!passport) {
      return NextResponse.json({ message: 'Compliance Passport not found.' }, { status: 404 });
    }

    return NextResponse.json({
      passport: {
        id: passport.id,
        passportId: passport.passportId,
        companyName: passport.company.name,
        regNumber: passport.company.regNumber,
        complianceScore: passport.complianceScore,
        status: passport.status,
        qrCode: passport.qrCode,
        digitalSignature: passport.digitalSignature,
        generatedAt: passport.generatedAt,
        expiresAt: passport.expiresAt,
        verifiedDocs: passport.company.documents.map((d) => d.type),
      },
    });
  } catch (error) {
    console.error('Fetch passport error:', error);
    return NextResponse.json({ message: 'Internal server error occurred.' }, { status: 500 });
  }
}
