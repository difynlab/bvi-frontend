## 1. Saving login token to localStorage

- **File**: `src/context/AuthContext.jsx`
- **On init (restore session)**:

```85:98:src/context/AuthContext.jsx
  useEffect(() => {
    try {
      const session = getSession()
      if (session) {
        if (session.token) {
          localStorage.setItem('token', session.token)
          if (session.email) {
            localStorage.setItem('user', JSON.stringify({
              email: session.email,
              role: session.role,
              first_name: session.first_name,
              last_name: session.last_name
            }))
          }
        }
        
        setIsAuthenticated(true)
        setUser(session)
        mergeBackendProfile(session)
      }
```

- **On successful login**:

```179:197:src/context/AuthContext.jsx
      const sessionUser = composeSessionUser(authUser)

      if (response.data?.token) {
        sessionUser.token = response.data.token
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      saveSession(sessionUser)
      setUser(sessionUser)
      mergeBackendProfile(sessionUser)
      setIsAuthenticated(true)
```

- **Session storage helper**:

```31:37:src/helpers/authStorage.js
export function saveSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true
  } catch (error) {
    return false
  }
}
```

## 2. Login API call and flow

- **API call**:
  - **File**: `src/api/authApi.js`

```35:61:src/api/authApi.js
export async function loginUser(credentials) {
  try {
    const backendData = {
      email: credentials.email,
      password: credentials.password
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Communication with server failed, please try again.')
    }
    throw error
  }
}
```

- **Login flow**:
  - **File**: `src/context/AuthContext.jsx`

```165:197:src/context/AuthContext.jsx
  const login = async ({ email, password }) => {
    setLoading(true)
    setError(null)

    try {
      if (!API_BASE) {
        setError({ type: 'general', message: 'API not configured. Login unavailable.' })
        return false
      }

      const response = await loginUser({ email, password })
      
      const authUser = {
        id: response.data?.user?.id || Date.now().toString(),
        first_name: response.data?.user?.first_name || '',
        last_name: response.data?.user?.last_name || '',
        userName: `${response.data?.user?.first_name || ''} ${response.data?.user?.last_name || ''}`.trim(),
        email: response.data?.user?.email || email.toLowerCase().trim(),
        phone: response.data?.user?.phone || '',
        role: response.data?.user?.role || 'member',
        permissions: response.data?.user?.permissions || getPermissions('member')
      }
      
      const sessionUser = composeSessionUser(authUser)

      if (response.data?.token) {
        sessionUser.token = response.data.token
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      saveSession(sessionUser)
      setUser(sessionUser)
      mergeBackendProfile(sessionUser)
      setIsAuthenticated(true)
```

## 3. Logout: behavior and storage cleanup

- **Logout implementation**:
  - **File**: `src/context/AuthContext.jsx`

```264:276:src/context/AuthContext.jsx
  const logout = () => {
    if (API_BASE && user?.token) {
      logoutUser(user.token).catch(error => {
      })
    }

    clearSession()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
  }
```

- **Server-side logout call**:
  - **File**: `src/api/authApi.js`

```63:83:src/api/authApi.js
export async function logoutUser(token) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}
```

- **Where logout is triggered (examples)**:
  - **File**: `src/components/SideNav.jsx`

```187:201:src/components/SideNav.jsx
  const handleConfirmLogout = () => {
    try {
      if (logout) {
        logout();
      } else {
        try { localStorage.removeItem('user'); } catch {}
        try { localStorage.removeItem('auth'); } catch {}
        try { localStorage.removeItem('token'); } catch {}
        try { localStorage.removeItem('session'); } catch {}
      }
    } finally {
      closeLogoutModal();
      navigate('/login');
    }
  };
```

  - **File**: `src/components/modals/MoreModal.jsx`

```70:84:src/components/modals/MoreModal.jsx
  const handleConfirmLogout = () => {
    try {
      if (logout) {
        logout()
      } else {
        try { localStorage.removeItem('user') } catch {}
        try { localStorage.removeItem('auth') } catch {}
        try { localStorage.removeItem('token') } catch {}
        try { localStorage.removeItem('session') } catch {}
      }
    } finally {
      setIsLogoutModalOpen(false)
      onClose()
      navigate('/login')
    }
  }
```

## 4. Settings API: get and update user details

- **Token and headers helper**:
  - **File**: `src/services/profileService.js`

```13:34:src/services/profileService.js
function getToken() {
  return localStorage.getItem('token');
}

function getHeaders(includeContentType = false, isFormData = false) {
  const token = getToken();
  const headers = {
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (includeContentType && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}
```

- **Get user profile (settings load)**:
  - **File**: `src/services/profileService.js`

```194:223:src/services/profileService.js
export async function getProfile(token = null) {
  try {
    const url = `${BASE_URL}/profile`;

    const headers = token
      ? {
          ...getHeaders(false),
          Authorization: `Bearer ${token}`,
        }
      : getHeaders(true);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await handleResponse(response);

    if (data && data.data) {
      return normalizeProfileData(data.data);
    }

    return normalizeProfileData(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}
```

- **Update user profile (details + optional image)**:
  - **File**: `src/services/profileService.js`

```264:343:src/services/profileService.js
export async function updateProfile(
  token = null,
  settingsData,
  currentProfilePicture = null
) {
  try {
    const hasPasswordFields =
      settingsData.currentPassword &&
      settingsData.newPassword &&
      settingsData.passwordChangeConfirmPassword;

    const profilePictureChanged =
      settingsData.profilePicture &&
      settingsData.profilePicture !== currentProfilePicture &&
      settingsData.profilePicture.startsWith('data:');

    const backendData = {
      first_name: settingsData.first_name || settingsData.firstName || '',
      last_name: settingsData.last_name || settingsData.lastName || '',
      email: settingsData.email || '',
      phone: (settingsData.phoneE164 && settingsData.phoneE164.trim())
        ? settingsData.phoneE164.trim()
        : combinePhoneNumber(
            settingsData.countryCode || '',
            settingsData.phoneNumber || ''
          ),
    };

    if (settingsData.confirmPassword) {
      backendData.password = settingsData.confirmPassword;
    }

    if (hasPasswordFields) {
      backendData.new_password = settingsData.newPassword;
      backendData.password_confirm = settingsData.passwordChangeConfirmPassword;
    }

    const url = `${BASE_URL}/profile`;
    let response;

    if (profilePictureChanged) {
      const formData = new FormData();
      Object.keys(backendData).forEach((key) => {
        formData.append(key, backendData[key]);
      });

      const imageFile = base64ToFile(
        settingsData.profilePicture,
        `profile-${Date.now()}.jpg`
      );
      formData.append('image', imageFile);

      const headers = token
        ? {
            ...getHeaders(false, true),
            Authorization: `Bearer ${token}`,
          }
        : getHeaders(false, true);

      response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      const headers = token
        ? {
            ...getHeaders(true),
            Authorization: `Bearer ${token}`,
          }
        : getHeaders(true);

      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(backendData),
      });
    }
```

- **Settings form calling the update API**:
  - **File**: `src/hooks/useSettingsForm.js`

```247:276:src/hooks/useSettingsForm.js
      const settingsData = {
        first_name: form.firstName?.trim() || '',
        last_name: form.lastName?.trim() || '',
        email: form.email?.toLowerCase().trim() || '',
        countryCode: form.countryCode || '+1',
        phoneNumber: form.phoneNumber?.trim() || '',
        phoneE164: form.phoneE164 || '',
        profilePicture: form.profilePicture || null,
        dateFormat: form.dateFormat || 'MM/DD/YYYY',
        timeZone: form.timeZone || 'EST',
        country: form.country || 'Virgin Islands, British',
        language: form.language || 'English (Default)',
        confirmPassword: modalPassword,
      };
      
      if (currentPassword && newPassword && confirmPassword) {
        settingsData.currentPassword = currentPassword;
        settingsData.newPassword = newPassword;
        settingsData.passwordChangeConfirmPassword = confirmPassword;
      }
      
      const currentProfilePicture = baseUser.profilePicture || '';
      
      const updatedProfileData = await updateProfile(null, settingsData, currentProfilePicture);
```

