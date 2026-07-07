import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { queryComplianceAdvisor } from '@/lib/rag';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.companyId) {
      return NextResponse.json({ message: 'Unauthorized: Startup context required' }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ message: 'Query string is required.' }, { status: 400 });
    }

    const response = await queryComplianceAdvisor(query, payload.companyId);

    // If query does not map to active countries, provide helpful prompt
    if (!response) {
      return NextResponse.json({
        answer: `I couldn't match a specific country in your query: "${query}". \n\nI can advise you on compliance guidelines and gap analysis for expansion to: **India, USA, Germany, Singapore, and UAE**. \n\nTry asking: *"I want to expand my startup to Germany"* or *"What are the compliance requirements for Singapore?"*`,
      });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Advisor API error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
