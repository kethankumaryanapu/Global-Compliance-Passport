import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  
  // Set expired session cookie to erase client session
  response.cookies.set('session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  
  return response;
}
