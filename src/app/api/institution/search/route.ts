import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'INSTITUTION') {
      return NextResponse.json({ message: 'Unauthorized: Institution context required' }, { status: 401 });
    }

    const industry = searchParams.get('industry') || undefined;
    const country = searchParams.get('country') || undefined;
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : undefined;
    const passportStatus = searchParams.get('passportStatus') || undefined;

    // Build the query filter
    const whereClause: any = {
      AND: [
        {
          OR: [
            { name: { contains: q } },
            { regNumber: { contains: q } },
            { passport: { passportId: { contains: q } } },
          ],
        },
      ],
    };

    if (industry) {
      whereClause.AND.push({ industry });
    }
    if (country) {
      whereClause.AND.push({ country });
    }
    if (minScore !== undefined) {
      whereClause.AND.push({ complianceScore: { gte: minScore } });
    }
    if (passportStatus) {
      whereClause.AND.push({ passport: { status: passportStatus } });
    }

    const companies = await db.company.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        regNumber: true,
        complianceScore: true,
        logo: true,
        address: true,
        industry: true,
        country: true,
        passport: {
          select: {
            passportId: true,
            status: true,
            generatedAt: true,
            expiresAt: true,
            digitalSignature: true,
            qrCode: true,
          },
        },
      },
      take: 15,
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Institution search error:', error);
    return NextResponse.json({ message: 'Internal server error occurred.' }, { status: 500 });
  }
}
