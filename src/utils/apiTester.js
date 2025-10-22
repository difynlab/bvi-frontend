// Test helper para verificar qué endpoints funcionan con el token
export const testApiEndpoints = async (token, baseURL) => {
  const endpoints = [
    // Endpoints que sabemos que existen
    { name: 'Login Test', url: '/login', method: 'POST', body: { email: 'test@test.com', password: 'test' } },
    
    // Endpoints comunes de Laravel
    { name: 'Events', url: '/events', method: 'GET' },
    { name: 'Events with pagination', url: '/events?pagination=1&page=1', method: 'GET' },
    
    // Endpoints alternativos comunes
    { name: 'Auth User', url: '/auth/user', method: 'GET' },
    { name: 'User', url: '/user', method: 'GET' },
    { name: 'Me', url: '/me', method: 'GET' },
    { name: 'Profile', url: '/profile', method: 'GET' },
    { name: 'Dashboard', url: '/dashboard', method: 'GET' },
    
    // Endpoints de Laravel Passport
    { name: 'Passport User', url: '/oauth/user', method: 'GET' },
    { name: 'Passport Me', url: '/oauth/me', method: 'GET' },
    
    // Endpoints de API Resource
    { name: 'API User', url: '/api/user', method: 'GET' },
    { name: 'API Me', url: '/api/me', method: 'GET' },
    
    // Endpoints de verificación
    { name: 'Health Check', url: '/health', method: 'GET' },
    { name: 'Status', url: '/status', method: 'GET' },
    { name: 'Ping', url: '/ping', method: 'GET' }
  ]

  console.log('=== TESTING API ENDPOINTS ===')
  console.log('Base URL:', baseURL)
  console.log('Token preview:', token.substring(0, 20) + '...')
  console.log('')

  for (const endpoint of endpoints) {
    try {
      const url = `${baseURL}${endpoint.url}`
      console.log(`Testing ${endpoint.name}: ${endpoint.method} ${url}`)
      
      const options = {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }

      // Add body for POST requests
      if (endpoint.body) {
        options.headers['Content-Type'] = 'application/json'
        options.body = JSON.stringify(endpoint.body)
      }

      const response = await fetch(url, options)

      const status = response.status
      const statusText = response.statusText
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: ${status} ${statusText}`)
        try {
          const data = await response.json()
          console.log(`   Response preview:`, Object.keys(data))
          if (data.data) {
            console.log(`   Data preview:`, typeof data.data === 'object' ? Object.keys(data.data) : data.data)
          }
        } catch (e) {
          console.log(`   Response: Non-JSON response`)
        }
      } else {
        console.log(`❌ ${endpoint.name}: ${status} ${statusText}`)
        try {
          const errorData = await response.json()
          console.log(`   Error:`, errorData.message || errorData.error || 'No message')
          if (errorData.errors) {
            console.log(`   Validation errors:`, errorData.errors)
          }
        } catch (e) {
          console.log(`   Error: Non-JSON error response`)
        }
      }
    } catch (error) {
      console.log(`💥 ${endpoint.name}: Network error - ${error.message}`)
    }
    console.log('')
  }
  
  console.log('=== END TESTING ===')
}
