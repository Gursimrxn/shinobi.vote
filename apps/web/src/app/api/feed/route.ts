import { NextRequest, NextResponse } from 'next/server';
import { lighthouseService } from '@/lib/lighthouse';
import { FeedResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Initialize mock data if empty
    lighthouseService.initializeMockData();

    // Get all posts
    const allPosts = lighthouseService.getAllPosts();

    // Apply pagination
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paginatedPosts = allPosts.slice(startIdx, endIdx);

    // Add gateway URLs to assets
    const postsWithUrls = paginatedPosts.map(post => ({
      ...post,
      assets: post.assets.map((asset: any) => ({
        ...asset,
        urls: lighthouseService.getFileUrls(asset.cid),
      })),
    }));

    const response: FeedResponse = {
      posts: postsWithUrls,
      total: allPosts.length,
      page,
      limit,
    };

    console.log(`Feed request: page ${page}, limit ${limit}, total posts: ${allPosts.length}`);

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Feed error:', error);
    
    const response: FeedResponse = {
      posts: [],
      total: 0,
    };

    return NextResponse.json(response, { status: 500 });
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