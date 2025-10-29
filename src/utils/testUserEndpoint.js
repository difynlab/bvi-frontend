/**
 * Test script to check what methods the /user endpoint supports
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function testUserEndpoint() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found. Please log in first.');
    return;
  }

  const methods = ['GET', 'PUT', 'POST', 'PATCH'];
  const testData = {
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '+5491123456789'
  };

  console.log('=== TESTING /user ENDPOINT METHODS ===');
  console.log('Base URL:', BASE_URL);
  console.log('Token preview:', token.substring(0, 20) + '...');
  console.log('');

  for (const method of methods) {
    try {
      console.log(`Testing ${method} /user...`);
      
      const options = {
        method,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      // Add body for non-GET requests
      if (method !== 'GET') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(testData);
      }

      const response = await fetch(`${BASE_URL}/user`, options);

      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ SUCCESS (${method}):`, data);
        console.log('');
        return { method, data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`  ❌ Error (${method}):`, errorData.message || 'Unknown error');
      }
    } catch (error) {
      console.log(`  ❌ Network Error (${method}):`, error.message);
    }
    console.log('');
  }

  console.log('No working methods found for /user endpoint.');
  return null;
}

// Auto-run if called directly
if (import.meta.hot) {
  testUserEndpoint();
}
