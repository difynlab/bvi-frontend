/**
 * Test script to check how to update user profile with different data formats
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function testUserUpdate() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found. Please log in first.');
    return;
  }

  console.log('=== TESTING USER UPDATE FORMATS ===');
  console.log('Base URL:', BASE_URL);
  console.log('Token preview:', token.substring(0, 20) + '...');
  console.log('');

  // Test 1: JSON format
  try {
    console.log('Testing JSON format...');
    const jsonData = {
      first_name: 'Manuel',
      last_name: 'Rodriguez',
      email: 'manuel@admin.com',
      phone: '+5491138899722'
    };

    const response = await fetch(`${BASE_URL}/user`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jsonData)
    });

    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ JSON SUCCESS:`, data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`  ❌ JSON Error:`, errorData.message || 'Unknown error');
    }
  } catch (error) {
    console.log(`  ❌ JSON Network Error:`, error.message);
  }

  console.log('');

  // Test 2: FormData format
  try {
    console.log('Testing FormData format...');
    const formData = new FormData();
    formData.append('first_name', 'Manuel');
    formData.append('last_name', 'Rodriguez');
    formData.append('email', 'manuel@admin.com');
    formData.append('phone', '+5491138899722');

    const response = await fetch(`${BASE_URL}/user`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ FormData SUCCESS:`, data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`  ❌ FormData Error:`, errorData.message || 'Unknown error');
    }
  } catch (error) {
    console.log(`  ❌ FormData Network Error:`, error.message);
  }

  console.log('');

  // Test 3: PATCH method
  try {
    console.log('Testing PATCH method...');
    const patchData = {
      first_name: 'Manuel',
      last_name: 'Rodriguez'
    };

    const response = await fetch(`${BASE_URL}/user`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(patchData)
    });

    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ PATCH SUCCESS:`, data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`  ❌ PATCH Error:`, errorData.message || 'Unknown error');
    }
  } catch (error) {
    console.log(`  ❌ PATCH Network Error:`, error.message);
  }
}

// Auto-run if called directly
if (import.meta.hot) {
  testUserUpdate();
}
