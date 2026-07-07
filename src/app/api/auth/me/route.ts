import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.json({ user: null });
      response.cookies.delete('session');
      return response;
    }

    // Fetch fresh database values in case company score or roles updated
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        company: true,
        institution: true,
      },
    });

    if (!user) {
      const response = NextResponse.json({ user: null });
      response.cookies.delete('session');
      return response;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.company?.id || null,
        companyName: user.company?.name || null,
        complianceScore: user.company?.complianceScore || 0,
        institutionId: user.institution?.id || null,
      },
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ user: null });
  }
}
