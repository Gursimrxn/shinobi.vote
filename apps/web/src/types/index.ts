export interface PostAsset {
  type: 'image' | 'video' | 'audio' | 'document';
  cid: string;
  filename?: string;
  size?: number;
  mimeType?: string;
}

export interface PostMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  author: string; // wallet address
}

export interface Post {
  postId: string;
  author: string;
  timestamp: number;
  assets: PostAsset[];
  text?: string;
  metaHash: string;
  metadata?: PostMetadata;
}

export interface UploadResponse {
  success: boolean;
  cids: string[];
  postId?: string;
  metaHash?: string;
  error?: string;
}

export interface FeedResponse {
  posts: Post[];
  total: number;
  page?: number;
  limit?: number;
}

export interface AssetResponse {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  error?: string;
}

export interface ContractEvent {
  author: string;
  cidHash: string;
  timestamp: number;
  metaHash: string;
}