import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== 'admin@123' || password !== 'admin123') {
      return NextResponse.json({ message: 'Invalid administrative email or password.' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Access denied: Administrative account not found.' }, { status: 401 });
    }

    // Sign Administrative JWT Cookie
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      message: 'Administrative authorization success.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Admin authentication exception:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
