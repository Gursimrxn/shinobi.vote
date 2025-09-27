import axios from 'axios';
import { createHash } from 'crypto';
import { PostMetadata, ContractEvent, Post, PostAsset } from '@/types';

// In-memory storage for posts (replace with database in production)
export const postsStorage = new Map<string, Post>();
let postIdCounter = 1;

export class LighthouseService {
  private apiKey: string;
  private gatewayUrl = 'https://gateway.lighthouse.storage/ipfs/';

  constructor() {
    this.apiKey = process.env.LIGHTHOUSE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('LIGHTHOUSE_API_KEY not found in environment variables');
    }
  }

  /**
   * Upload files to Lighthouse IPFS
   */
  async uploadFiles(files: Buffer[], filenames: string[], mimeTypes: string[]): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('Lighthouse API key not configured');
    }

    const cids: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = filenames[i] || `file_${i}`;
        const mimeType = mimeTypes[i] || 'application/octet-stream';
        
        // Create FormData for upload
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(file)], { type: mimeType });
        formData.append('file', blob, filename);
        
        const uploadResponse = await axios.post(
          'https://node.lighthouse.storage/api/v0/add',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          }
        );

        const cid = uploadResponse.data?.Hash || uploadResponse.data?.cid;
        if (cid) {
          cids.push(cid);
        } else {
          throw new Error(`Failed to get CID for file: ${filename}`);
        }
      }

      return cids;
    } catch (error) {
      console.error('Error uploading to Lighthouse:', error);
      throw new Error(`Upload failed: ${error}`);
    }
  }

  /**
   * Get file from Lighthouse using CID
   */
  async getFile(cid: string): Promise<{ data: Buffer; contentType: string }> {
    try {
      const response = await axios.get(`${this.gatewayUrl}${cid}`, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const data = Buffer.from(response.data);

      return { data, contentType };
    } catch (error) {
      console.error(`Error fetching file with CID ${cid}:`, error);
      throw new Error(`Failed to fetch file: ${cid}`);
    }
  }

  /**
   * Compute hash for CID (for smart contract integration)
   */
  computeCidHash(cid: string): string {
    return '0x' + createHash('sha256').update(cid).digest('hex');
  }

  /**
   * Compute metadata hash
   */
  computeMetaHash(metadata: PostMetadata): string {
    if (!metadata || Object.keys(metadata).length === 0) {
      return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
    const metadataString = JSON.stringify(metadata, Object.keys(metadata).sort());
    return '0x' + createHash('sha256').update(metadataString).digest('hex');
  }

  /**
   * Get file type from mime type (enhanced version)
   */
  getFileTypeFromMimeType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  /**
   * Enhanced file validation
   */
  validateFile(mimeType: string, size: number): { valid: boolean; error?: string } {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos  
      'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/avi',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp3',
      // Documents
      'application/pdf', 'text/plain', 'application/json'
    ];

    if (!allowedTypes.includes(mimeType)) {
      return { valid: false, error: `Unsupported file type: ${mimeType}` };
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (size > maxSize) {
      return { valid: false, error: `File too large. Max size is 100MB, got ${Math.round(size / 1024 / 1024)}MB` };
    }

    return { valid: true };
  }

  /**
   * Create a new post and store it
   */
  createPost(
    author: string,
    cids: string[],
    metadata: PostMetadata,
    text?: string,
    mimeTypes?: string[]
  ): string {
    const postId = postIdCounter.toString();
    postIdCounter++;

    const timestamp = Math.floor(Date.now() / 1000);
    const metaHash = this.computeMetaHash(metadata);

    const assets: PostAsset[] = cids.map((cid, index) => ({
      type: mimeTypes ? this.getFileTypeFromMimeType(mimeTypes[index]) : 'document',
      cid,
      filename: `asset_${index}`,
      mimeType: mimeTypes?.[index],
    }));

    const post: Post = {
      postId,
      author,
      timestamp,
      assets,
      text,
      metaHash,
      metadata,
    };

    postsStorage.set(postId, post);

    // Log the contract event data (in production, call actual contract)
    const contractEvent: ContractEvent = {
      author,
      cidHash: this.computeCidHash(cids[0]), // Use first CID for contract
      timestamp,
      metaHash,
    };

    console.log('PostAnchor Contract Event:', contractEvent);

    return postId;
  }

  /**
   * Get all posts from storage
   */
  getAllPosts(): Post[] {
    return Array.from(postsStorage.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get a specific post by ID
   */
  getPost(postId: string): Post | null {
    return postsStorage.get(postId) || null;
  }



  /**
   * Get file URLs for a CID (both IPFS and gateway)
   */
  getFileUrls(cid: string): { ipfs: string; gateway: string } {
    return {
      ipfs: `ipfs://${cid}`,
      gateway: `${this.gatewayUrl}${cid}`,
    };
  }

  /**
   * Initialize with some mock data for testing
   */
  initializeMockData(): void {
    if (postsStorage.size === 0) {
      // Add some mock posts for testing
      const mockPost1: Post = {
        postId: '1',
        author: '0x742d35Cc6635C0532925a3b8D9c1C63e3e7B8dE6',
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        assets: [
          {
            type: 'image',
            cid: 'QmYourMockCID1',
            filename: 'sample-image.jpg',
            mimeType: 'image/jpeg',
          },
        ],
        text: 'Welcome to GhostApp! This is a sample post.',
        metaHash: '0xabcdef123456789',
        metadata: {
          title: 'Welcome Post',
          description: 'A sample welcome post',
          author: '0x742d35Cc6635C0532925a3b8D9c1C63e3e7B8dE6',
          tags: ['welcome', 'sample'],
        },
      };

      postsStorage.set('1', mockPost1);
      postIdCounter = 2;
    }
  }
}

// Export singleton instance
export const lighthouseService = new LighthouseService();