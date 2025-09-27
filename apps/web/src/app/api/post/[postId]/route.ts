import { NextRequest, NextResponse } from 'next/server';
import { lighthouseService } from '@/lib/lighthouse';
import { PostAsset } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Initialize mock data if empty
    lighthouseService.initializeMockData();

    // Get the specific post
    const post = lighthouseService.getPost(postId);

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Add gateway URLs to assets
    type AugmentedAsset = PostAsset & { urls: { ipfs: string; gateway: string } };

    const postWithUrls = {
      ...post,
      assets: post.assets.map<AugmentedAsset>((asset) => ({
        ...asset,
        urls: lighthouseService.getFileUrls(asset.cid),
      })),
    };

    console.log(`Post request for ID: ${postId}`);

    return NextResponse.json(postWithUrls, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Post fetch error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch post' },
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