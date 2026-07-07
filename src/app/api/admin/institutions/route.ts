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

    const institutions = await db.institution.findMany({
      include: {
        user: { select: { email: true } },
        requests: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ institutions });
  } catch (error) {
    console.error('Fetch institutions admin error:', error);
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
    const { institutionId, action } = body; // action: "SUSPEND" | "ACTIVATE"

    const inst = await db.institution.findUnique({
      where: { id: institutionId },
    });

    if (!inst) {
      return NextResponse.json({ message: 'Institution not found' }, { status: 404 });
    }

    // Toggle description prefix metadata representing suspension
    let newDesc = inst.description || '';
    if (action === 'SUSPEND' && !newDesc.startsWith('[SUSPENDED]')) {
      newDesc = `[SUSPENDED] ${newDesc}`;
    } else if (action === 'ACTIVATE' && newDesc.startsWith('[SUSPENDED]')) {
      newDesc = newDesc.replace('[SUSPENDED] ', '');
    }

    await db.institution.update({
      where: { id: institutionId },
      data: { description: newDesc },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: action === 'SUSPEND' ? 'REJECT' : 'APPROVE',
        details: `Admin ${action.toLowerCase()}ed institution permissions: ${inst.name}`,
      },
    });

    return NextResponse.json({ message: `Institution successfully ${action.toLowerCase()}ed` });
  } catch (error: any) {
    console.error('Update institution error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('id');

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    if (!institutionId) return NextResponse.json({ message: 'Missing institutionId' }, { status: 400 });

    const inst = await db.institution.findUnique({
      where: { id: institutionId },
    });

    if (!inst) {
      return NextResponse.json({ message: 'Institution not found' }, { status: 404 });
    }

    // Delete matching institution and user inside a transaction
    await db.$transaction(async (tx) => {
      await tx.institution.delete({ where: { id: institutionId } });
      await tx.user.delete({ where: { id: inst.userId } });
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: payload.userId,
        action: 'REVOKE',
        details: `Deleted institution account and corporate profiles: ${inst.name}`,
      },
    });

    return NextResponse.json({ message: 'Institution deleted successfully' });
  } catch (error: any) {
    console.error('Delete institution admin error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
