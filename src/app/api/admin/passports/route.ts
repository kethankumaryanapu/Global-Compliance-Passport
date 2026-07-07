import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const passports = await db.compliancePassport.findMany({
      include: {
        company: true,
      },
      orderBy: { generatedAt: 'desc' },
    });

    return NextResponse.json({ passports });
  } catch (error) {
    console.error('Fetch passports admin error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { passportId, action } = body; // action: "REVOKE" | "RENEW"

    const passport = await db.compliancePassport.findUnique({
      where: { id: passportId },
      include: { company: true },
    });

    if (!passport) {
      return NextResponse.json({ message: 'Passport not found' }, { status: 404 });
    }

    if (action === 'REVOKE') {
      await db.compliancePassport.update({
        where: { id: passportId },
        data: { status: 'UNTRUSTED' },
      });
    } else if (action === 'RENEW') {
      await db.compliancePassport.update({
        where: { id: passportId },
        data: {
          status: 'TRUSTED',
          expiresAt: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
        },
      });
    }

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        companyId: passport.companyId,
        action: action === 'REVOKE' ? 'REVOKE' : 'APPROVE',
        details: `Admin ${action.toLowerCase()}ed Compliance Passport: ${passport.passportId} for ${passport.company.name}`,
      },
    });

    return NextResponse.json({ message: `Passport successfully ${action.toLowerCase()}ed` });
  } catch (error: any) {
    console.error('Update passport admin error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
