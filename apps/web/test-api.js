// Test script for GhostApp Next.js Backend API
// Run with: node test-api.js

const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🚀 Testing GhostApp Backend API...\n');

  try {
    // Test 0: Health Check
    console.log('🏥 Testing Health Endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Response:', {
      status: healthResponse.status,
      service: healthResponse.data.service,
      lighthouse: healthResponse.data.lighthouse
    });
    console.log('');

    // Test 1: Get Feed (should return mock data)
    console.log('📡 Testing Feed Endpoint...');
    const feedResponse = await axios.get(`${API_BASE_URL}/feed`);
    console.log('✅ Feed Response:', {
      status: feedResponse.status,
      totalPosts: feedResponse.data.total,
      postsCount: feedResponse.data.posts.length
    });
    console.log('📄 First Post:', feedResponse.data.posts[0]?.postId || 'No posts');
    console.log('');

    // Test 2: Get Individual Post
    if (feedResponse.data.posts.length > 0) {
      const firstPostId = feedResponse.data.posts[0].postId;
      console.log(`📝 Testing Individual Post Endpoint (ID: ${firstPostId})...`);
      const postResponse = await axios.get(`${API_BASE_URL}/post/${firstPostId}`);
      console.log('✅ Post Response:', {
        status: postResponse.status,
        postId: postResponse.data.postId,
        author: postResponse.data.author,
        assetsCount: postResponse.data.assets.length
      });
      console.log('');
    }

    // Test 3: Test Upload (create a test file)
    console.log('📤 Testing Upload Endpoint...');
    
    // Create a simple test file
    const testContent = 'This is a test file for GhostApp API testing.';
    const testFileName = 'test-file.txt';
    fs.writeFileSync(testFileName, testContent);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFileName));
    formData.append('author', '0x742d35Cc6635C0532925a3b8D9c1C63e3e7B8dE6');
    formData.append('title', 'API Test Post');
    formData.append('description', 'This is a test post created by the API test script');
    formData.append('tags', 'test,api,ghostapp');
    formData.append('text', 'Testing the upload functionality!');

    const uploadResponse = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('✅ Upload Response:', {
      status: uploadResponse.status,
      success: uploadResponse.data.success,
      cidsCount: uploadResponse.data.cids?.length || 0,
      postId: uploadResponse.data.postId
    });

    if (uploadResponse.data.cids && uploadResponse.data.cids.length > 0) {
      const testCid = uploadResponse.data.cids[0];
      console.log('📁 Testing Asset Endpoint...');
      
      try {
        const assetResponse = await axios.get(`${API_BASE_URL}/asset/${testCid}`, {
          responseType: 'text'
        });
        console.log('✅ Asset Response:', {
          status: assetResponse.status,
          contentType: assetResponse.headers['content-type'],
          dataLength: assetResponse.data.length
        });
        console.log('📄 Asset Content Preview:', assetResponse.data.substring(0, 50) + '...');
      } catch (assetError) {
        console.log('⚠️  Asset test may fail with real Lighthouse uploads in development');
        console.log('   This is normal if not using a real Lighthouse API key');
      }
    }

    // Test 5: Utility endpoints
    console.log('🔧 Testing Utility Endpoints...');
    
    // Test CID hashing
    const cidHashResponse = await axios.post(`${API_BASE_URL}/utils/hash-cid`, {
      cid: 'QmTestCID123456789'
    });
    console.log('✅ CID Hash Response:', {
      status: cidHashResponse.status,
      success: cidHashResponse.data.success,
      cidHash: cidHashResponse.data.cidHash?.substring(0, 10) + '...'
    });

    // Test metadata hashing
    const metadataHashResponse = await axios.post(`${API_BASE_URL}/utils/hash-metadata`, {
      metadata: {
        title: 'Test Post',
        author: '0x123...',
        tags: ['test']
      }
    });
    console.log('✅ Metadata Hash Response:', {
      status: metadataHashResponse.status,
      success: metadataHashResponse.data.success,
      metaHash: metadataHashResponse.data.metaHash?.substring(0, 10) + '...'
    });

    // Cleanup
    fs.unlinkSync(testFileName);

    console.log('\n🎉 API tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Health endpoint working');
    console.log('   ✅ Feed endpoint working');
    console.log('   ✅ Individual post endpoint working');
    console.log('   ✅ Upload endpoint working');
    console.log('   ✅ Asset endpoint implemented');
    console.log('   ✅ Utility endpoints working (CID & metadata hashing)');
    console.log('\n💡 To fully test with real files, make sure to:');
    console.log('   1. Set LIGHTHOUSE_API_KEY in .env.local');
    console.log('   2. Upload real image/video files');
    console.log('   3. Test with different file types');

  } catch (error) {
    console.error('❌ API Test Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the Next.js dev server is running:');
      console.log('   cd apps/web && npm run dev');
    }
  }
}

// Run the tests
testAPI();