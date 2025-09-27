import { NextRequest, NextResponse } from 'next/server';
import { lighthouseService } from '@/lib/lighthouse';
import { PostMetadata } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metadata } = body;

    const metaHash = lighthouseService.computeMetaHash(metadata as PostMetadata);

    return NextResponse.json({
      success: true,
      metadata,
      metaHash,
    });

  } catch (error) {
    console.error('Metadata hash error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to compute metadata hash' 
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