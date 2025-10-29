/**
 * Test script to check which profile endpoints are available
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function testProfileEndpoints() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found. Please log in first.');
    return;
  }

  const endpoints = [
    '/api/me',
    '/api/user', 
    '/api/profile',
    '/api/auth/user',
    '/user',
    '/me',
    '/profile',
    '/auth/user'
  ];

  console.log('=== TESTING PROFILE ENDPOINTS ===');
  console.log('Base URL:', BASE_URL);
  console.log('Token preview:', token.substring(0, 20) + '...');
  console.log('');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ SUCCESS:`, data);
        console.log('');
        return endpoint; // Return the first working endpoint
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`  ❌ Error:`, errorData.message || 'Unknown error');
      }
    } catch (error) {
      console.log(`  ❌ Network Error:`, error.message);
    }
    console.log('');
  }

  console.log('No working profile endpoints found.');
  return null;
}

// Auto-run if called directly
if (import.meta.hot) {
  testProfileEndpoints();
}
