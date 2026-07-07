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

    const rules = await db.countryComplianceRules.findMany({
      orderBy: { country: 'asc' },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Fetch rules admin error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { country, rules } = body;

    if (!country || !rules) {
      return NextResponse.json({ message: 'Country name and rules definitions are required.' }, { status: 400 });
    }

    // Verify unique country record
    const existingRule = await db.countryComplianceRules.findUnique({
      where: { country },
    });

    if (existingRule) {
      return NextResponse.json({ message: `Rules definitions for ${country} already exist.` }, { status: 400 });
    }

    const newRule = await db.countryComplianceRules.create({
      data: {
        country,
        rules: typeof rules === 'string' ? rules : JSON.stringify(rules),
      },
    });

    return NextResponse.json({ message: 'Compliance rules successfully created', rule: newRule });
  } catch (error: any) {
    console.error('Create rule error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
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
    const { ruleId, country, rules } = body;

    if (!ruleId || !country || !rules) {
      return NextResponse.json({ message: 'Missing required update properties.' }, { status: 400 });
    }

    const updatedRule = await db.countryComplianceRules.update({
      where: { id: ruleId },
      data: {
        country,
        rules: typeof rules === 'string' ? rules : JSON.stringify(rules),
      },
    });

    return NextResponse.json({ message: 'Compliance rules successfully saved.', rule: updatedRule });
  } catch (error: any) {
    console.error('Update rule error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('id');

    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    if (!ruleId) return NextResponse.json({ message: 'Missing ruleId parameter.' }, { status: 400 });

    await db.countryComplianceRules.delete({
      where: { id: ruleId },
    });

    return NextResponse.json({ message: 'Compliance rules successfully deleted.' });
  } catch (error: any) {
    console.error('Delete rule error:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}
