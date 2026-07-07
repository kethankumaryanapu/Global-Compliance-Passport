import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // Query user and load details depending on role
    const user = await db.user.findUnique({
      where: { email },
      include: {
        company: true,
        institution: true,
      },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // Build JWT payload
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      companyId: user.company?.id || null,
      companyName: user.company?.name || null,
      complianceScore: user.company?.complianceScore || 0,
      institutionId: user.institution?.id || null,
    };

    const token = await signToken(payload);

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        companyId: user.company?.id,
        companyName: user.company?.name,
        complianceScore: user.company?.complianceScore,
        institutionId: user.institution?.id,
      },
    });

    // Save token as a secure cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error occurred.' }, { status: 500 });
  }
}
