# Contexto del Login con Google en el Proyecto BVI Frontend

## **Estado Actual de la Implementación**

### **1. Configuración Básica ✅**
- **Librería**: Se usa `@react-oauth/google` versión `^0.12.2`
- **Provider**: Configurado en `src/main.jsx` con `GoogleOAuthProvider`
- **Client ID**: Actualmente hardcodeado como `"1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"` (placeholder)

### **2. Componente de Login ✅**
- **Ubicación**: `src/sections/login-register/Login.jsx`
- **Componente**: Usa `GoogleLogin` de `@react-oauth/google`
- **Configuración del botón**:
  ```jsx
  <GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={handleGoogleError}
    theme="outline"
    size="large"
    text="continue_with"
    width="100%"
  />
  ```

### **3. Manejo de Autenticación ⚠️**
- **Función**: `loginWithGoogle()` en `src/context/AuthContext.jsx` (líneas 132-166)
- **Estado**: **IMPLEMENTACIÓN MOCK/SIMULADA**
- **Problema**: No procesa realmente el token de Google, solo simula el login

## **Lo que Falta para Funcionar Correctamente**

### **1. Configuración de Google Cloud Console**
```bash
# Necesitas crear un proyecto en Google Cloud Console y obtener:
- Client ID real
- Client Secret (para backend)
- Configurar dominios autorizados (localhost:5173 para dev)
```

### **2. Variables de Entorno**
```bash
# Crear archivo .env.local
VITE_GOOGLE_CLIENT_ID=tu_client_id_real_aqui
```

### **3. Implementación Real del Backend**
```javascript
// En AuthContext.jsx línea 137-138, cambiar:
// TODO BACKEND: POST /api/auth/google { credential }
// MOCK: email "googleuser@user.com" → resolve role; set session

// Por implementación real que:
// 1. Reciba el credential del componente GoogleLogin
// 2. Verifique el token con Google
// 3. Extraiga datos reales del usuario
// 4. Cree/actualice usuario en base de datos
```

### **4. Procesamiento del Token de Google**
```javascript
// El handleGoogleSuccess actual NO recibe el credential:
const handleGoogleSuccess = async () => {
  // Debería ser:
  const handleGoogleSuccess = async (credentialResponse) => {
    const { credential } = credentialResponse
    // Enviar credential al backend para verificación
  }
}
```

## **Configuración para Desarrollo**

### **1. Obtener Client ID de Google**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear nuevo proyecto o seleccionar existente
3. Habilitar Google+ API
4. Ir a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
5. Tipo: "Aplicación web"
6. Orígenes autorizados: `http://localhost:5173`
7. URIs de redirección: `http://localhost:5173`

### **2. Configurar Variables de Entorno**
```bash
# Crear .env.local en la raíz del proyecto
VITE_GOOGLE_CLIENT_ID=tu_client_id_real_de_google
```

### **3. Actualizar main.jsx**
```javascript
// Cambiar línea 9 en src/main.jsx:
<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
```

### **4. Implementar Verificación Real (Opcional para Dev)**
```javascript
// Para desarrollo rápido, puedes usar una librería como jwt-decode
// npm install jwt-decode
import jwt_decode from 'jwt_decode'

const handleGoogleSuccess = async (credentialResponse) => {
  const { credential } = credentialResponse
  const decoded = jwt_decode(credential)
  
  // Usar datos reales del usuario
  const sessionUser = {
    id: decoded.sub,
    firstName: decoded.given_name,
    lastName: decoded.family_name,
    email: decoded.email,
    phoneNumber: '',
    role: deriveRoleFromEmail(decoded.email),
    permissions: getPermissions(deriveRoleFromEmail(decoded.email))
  }
  
  // Resto de la lógica de sesión...
}
```

## **Estructura del Proyecto**
```
src/
├── context/
│   ├── AuthContext.jsx      # Contexto principal de auth
│   ├── authHelpers.js       # Funciones helper (roles, permisos)
│   └── useAuth.js          # Hook para usar el contexto
├── sections/login-register/
│   └── Login.jsx           # Componente de login con Google
└── main.jsx               # Configuración del GoogleOAuthProvider
```

## **Archivos Clave**

### **src/main.jsx**
```javascript
import { GoogleOAuthProvider } from '@react-oauth/google'

<GoogleOAuthProvider clientId="1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com">
  <AuthProvider>
    <App />
  </AuthProvider>
</GoogleOAuthProvider>
```

### **src/context/AuthContext.jsx**
```javascript
const loginWithGoogle = async () => {
  setLoading(true)
  setError(null)

  try {
    // TODO BACKEND: POST /api/auth/google { credential }
    // MOCK: email "googleuser@user.com" → resolve role; set session
    const mockEmail = 'googleuser@user.com'
    const role = deriveRoleFromEmail(mockEmail)
    const permissions = getPermissions(role)
    
    const sessionUser = {
      id: Date.now().toString(),
      firstName: 'Google',
      lastName: 'User',
      email: mockEmail,
      phoneNumber: '',
      role,
      permissions
    }

    saveSession(sessionUser)
    setUser(sessionUser)
    setIsAuthenticated(true)
    
    console.log('Mock Google login successful:', sessionUser)
    return true
  } catch (err) {
    setError('Google login failed')
    console.error('Google login error:', err)
    return false
  } finally {
    setLoading(false)
  }
}
```

### **src/sections/login-register/Login.jsx**
```javascript
const handleGoogleSuccess = async () => {
  console.log('Google login success')
  setIsSubmitting(true)
  try {
    const success = await loginWithGoogle()
    if (success) {
      navigate('/dashboard')
    }
  } catch (error) {
    console.error('Google login error:', error)
  } finally {
    setIsSubmitting(false)
  }
}

// En el JSX:
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  theme="outline"
  size="large"
  text="continue_with"
  width="100%"
/>
```

## **Notas Importantes**
- **Solo para desarrollo**: La implementación actual funciona como mock
- **No usar en producción**: Sin verificación real del token de Google
- **Sistema de roles**: Funciona con emails que contengan "@admin" o "@user"
- **Almacenamiento**: Usa localStorage para simular sesiones
- **Funciones de debug**: Incluye funciones temporales para testing (toggleRole, clearAllUsers)

## **Próximos Pasos Recomendados**
1. Configurar Google Cloud Console
2. Obtener Client ID real
3. Crear archivo .env.local
4. Actualizar main.jsx con variable de entorno
5. Implementar verificación real del token (opcional para dev)
6. Remover funciones de debug antes de producción

## **Dependencias Necesarias**
```json
{
  "dependencies": {
    "@react-oauth/google": "^0.12.2"
  }
}
```

## **Comandos Útiles**
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Verificar configuración
# El proyecto debería ejecutarse en http://localhost:5173
```

---

**Fecha de creación**: $(date)  
**Proyecto**: BVI Frontend  
**Versión**: Desarrollo  
**Estado**: Mock implementado, necesita configuración real para funcionar
