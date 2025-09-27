import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Self backend is working!',
    timestamp: new Date().toISOString(),
    endpoint: '/api/self/verify'
  });
}

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: 'Self backend POST is working!',
    timestamp: new Date().toISOString()
  });
}