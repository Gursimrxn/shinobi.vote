import { NextRequest, NextResponse } from 'next/server';
import { lighthouseService } from '@/lib/lighthouse';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid } = await params;

    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      );
    }

    // Validate CID format (basic check)
    if (!/^[a-zA-Z0-9]+$/.test(cid)) {
      return NextResponse.json(
        { error: 'Invalid CID format' },
        { status: 400 }
      );
    }

    console.log(`Asset request for CID: ${cid}`);

    // Get file from Lighthouse
    const { data, contentType } = await lighthouseService.getFile(cid);

    // Return the file with proper headers
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Length': data.length.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Asset fetch error:', error);
    
    // Check if it's a 404 error
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch asset' },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}