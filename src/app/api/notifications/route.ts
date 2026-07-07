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

    const notifications = await db.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ message: 'Internal server error occurred.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (id) {
      await db.notification.update({
        where: { id, userId: payload.userId },
        data: { read: true },
      });
      return NextResponse.json({ message: 'Notification marked as read.' });
    }

    return NextResponse.json({ message: 'Missing notification ID.' }, { status: 400 });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ message: 'Internal server error occurred.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clear = searchParams.get('clear');

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (clear === 'true') {
      await db.notification.deleteMany({
        where: { userId: payload.userId },
      });
      return NextResponse.json({ message: 'All notifications cleared.' });
    }

    return NextResponse.json({ message: 'Invalid clear operation.' }, { status: 400 });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json({ message: 'Internal server error occurred.' }, { status: 500 });
  }
}
