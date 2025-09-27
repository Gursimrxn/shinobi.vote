import { NextRequest, NextResponse } from 'next/server';
import { lighthouseService } from '@/lib/lighthouse';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cid } = body;

    if (!cid) {
      return NextResponse.json(
        { success: false, error: 'CID is required' },
        { status: 400 }
      );
    }

    const cidHash = lighthouseService.computeCidHash(cid);

    return NextResponse.json({
      success: true,
      cid,
      cidHash,
    });

  } catch (error) {
    console.error('CID hash error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to compute CID hash' 
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}