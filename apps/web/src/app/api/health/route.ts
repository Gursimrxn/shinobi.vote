import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Shinobi Next.js Backend',
    version: '1.0.0',
    lighthouse: process.env.LIGHTHOUSE_API_KEY ? '✅ Configured' : '❌ Missing API Key',
    endpoints: {
      upload: '/api/upload',
      feed: '/api/feed',
      post: '/api/post/:postId',
      asset: '/api/asset/:cid',
      hashCid: '/api/utils/hash-cid',
      hashMetadata: '/api/utils/hash-metadata',
      health: '/api/health'
    }
  });
}

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