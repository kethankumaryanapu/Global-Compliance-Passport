import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, companyName, regNumber, institutionName, description } =
      body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ message: 'Missing required credentials' }, { status: 400 });
    }

    // Verify unique user email
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Email address already in use' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Register User within a database transaction
    const user = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
        },
      });

      if (role === 'STARTUP') {
        if (!companyName || !regNumber) {
          throw new Error('Company name and registration number are required.');
        }

        const existingCompany = await tx.company.findUnique({
          where: { regNumber },
        });
        if (existingCompany) {
          throw new Error('This registration number is already registered.');
        }

        // Initialize company entry
        const company = await tx.company.create({
          data: {
            name: companyName,
            regNumber,
            userId: u.id,
            complianceScore: 0,
          },
        });

        // Initialize empty CompliancePassport record
        await tx.compliancePassport.create({
          data: {
            passportId: `GCP-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
              1000 + Math.random() * 9000
            )}`,
            companyId: company.id,
            complianceScore: 0,
            status: 'UNTRUSTED',
            qrCode: 'MOCK_QR_CODE_DATA',
            digitalSignature: 'SHA256:INITIAL_NOT_VERIFIED',
            expiresAt: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()),
          },
        });
      } else if (role === 'INSTITUTION') {
        await tx.institution.create({
          data: {
            name: institutionName || name,
            description: description || '',
            userId: u.id,
          },
        });
      }

      return u;
    });

    return NextResponse.json(
      { message: 'User registered successfully!', userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred during signup.' },
      { status: 500 }
    );
  }
}
