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

    const companies = await db.company.findMany({
      include: {
        user: { select: { email: true, name: true } },
        documents: true,
        passport: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Fetch companies admin error:', error);
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
    const { companyId, action } = body; // action: "SUSPEND" | "ACTIVATE"

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { passport: true },
    });

    if (!company) {
      return NextResponse.json({ message: 'Company not found' }, { status: 404 });
    }

    if (company.passport) {
      await db.compliancePassport.update({
        where: { id: company.passport.id },
        data: {
          status: action === 'SUSPEND' ? 'UNTRUSTED' : 'TRUSTED',
        },
      });
    }

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        companyId,
        action: action === 'SUSPEND' ? 'REJECT' : 'APPROVE',
        details: `Admin ${action.toLowerCase()}ed company compliance passport: ${company.name}`,
      },
    });

    return NextResponse.json({ message: `Company successfully ${action.toLowerCase()}ed` });
  } catch (error) {
    const err = error as any;
    console.error('Update company error:', err);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('id');

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    if (!companyId) return NextResponse.json({ message: 'Missing companyId' }, { status: 400 });

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: { user: true },
    });

    if (!company) {
      return NextResponse.json({ message: 'Company not found' }, { status: 404 });
    }

    // Delete company and associated user account sequentially
    await db.company.delete({ where: { id: companyId } });
    await db.user.delete({ where: { id: company.userId } });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'REVOKE',
        details: `Deleted company registry and associated user account: ${company.name}`,
      },
    });

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    const err = error as any;
    console.error('Delete company admin error:', err);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
