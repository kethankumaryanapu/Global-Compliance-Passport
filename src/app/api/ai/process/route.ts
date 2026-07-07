import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { processDocumentAI } from '@/lib/aiService';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Unauthorized: Invalid session context' }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, ocrText } = body;

    if (!documentId || !ocrText) {
      return NextResponse.json(
        { message: 'Missing documentId or ocrText in request body.' },
        { status: 400 }
      );
    }

    const result = await processDocumentAI(documentId, ocrText);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API AI process error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error occurred during AI processing.' },
      { status: 500 }
    );
  }
}
