import { NextRequest, NextResponse } from 'next/server';
import { lighthouseService } from '@/lib/lighthouse';
import { parseFormData } from '@/lib/utils';
import { PostMetadata, UploadResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const { files, fields } = await parseFormData(request);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' } as UploadResponse,
        { status: 400 }
      );
    }

    // Validate files using enhanced validation
    for (const file of files) {
      const validation = lighthouseService.validateFile(file.mimeType, file.size);
      if (!validation.valid) {
        return NextResponse.json(
          { 
            success: false, 
            error: validation.error || 'File validation failed'
          } as UploadResponse,
          { status: 400 }
        );
      }
    }

    // Extract metadata from fields
    const metadata: PostMetadata = {
      title: fields.title || undefined,
      description: fields.description || undefined,
      tags: fields.tags ? fields.tags.split(',').map(tag => tag.trim()) : undefined,
      author: fields.author || '0x0000000000000000000000000000000000000000',
    };

    if (!metadata.author || metadata.author === '0x0000000000000000000000000000000000000000') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Author wallet address is required' 
        } as UploadResponse,
        { status: 400 }
      );
    }

    // Upload files to Lighthouse
    const buffers = files.map(f => f.buffer);
    const filenames = files.map(f => f.filename);
    const mimeTypes = files.map(f => f.mimeType);

    const cids = await lighthouseService.uploadFiles(buffers, filenames, mimeTypes);

    // Create post with metadata
    const postId = lighthouseService.createPost(
      metadata.author,
      cids,
      metadata,
      fields.text || undefined,
      mimeTypes
    );

    const metaHash = lighthouseService.computeMetaHash(metadata);

    // Log upload success
    console.log(`Successfully uploaded ${files.length} files for post ${postId}:`, cids);

    const response: UploadResponse = {
      success: true,
      cids,
      postId,
      metaHash,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    
    const response: UploadResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      cids: [],
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}