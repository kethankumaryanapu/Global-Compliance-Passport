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
      return NextResponse.json({ message: 'Unauthorized: Session invalid' }, { status: 401 });
    }

    let logs: any[] = [];

    if (payload.role === 'STARTUP' && payload.companyId) {
      // Startups fetch audit trails specific to their company
      logs = await db.auditLog.findMany({
        where: { companyId: payload.companyId },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (payload.role === 'ADMIN') {
      // Admins load all audit events
      logs = await db.auditLog.findMany({
        include: {
          user: {
            select: { name: true, email: true },
          },
          company: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Fetch logs error:', error);
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
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized: Session invalid' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, action, details } = body;

    if (!action || !details) {
      return NextResponse.json({ message: 'Action and details are required' }, { status: 400 });
    }

    const log = await db.auditLog.create({
      data: {
        userId: payload.userId,
        companyId: companyId || null,
        action,
        details,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({ log });
  } catch (error) {
    console.error('Create log error:', error);
    return NextResponse.json({ message: 'Internal server error occurred.' }, { status: 500 });
  }
}
