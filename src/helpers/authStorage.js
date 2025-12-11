const USERS_KEY = 'bvi.auth.users'
const SESSION_KEY = 'bvi.auth.session'

export function getUsers() {
  try {
    const users = localStorage.getItem(USERS_KEY)
    return users ? JSON.parse(users) : []
  } catch (error) {
    return []
  }
}

export function setUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return true
  } catch (error) {
    return false
  }
}

export function findUserByEmail(email) {
  if (!email) return null
  
  const users = getUsers()
  const normalizedEmail = email.toLowerCase().trim()
  
  return users.find(user => user.email === normalizedEmail) || null
}

export function saveSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return true
  } catch (error) {
    return false
  }
}

export function getSession() {
  try { 
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); 
  } catch { 
    return null; 
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
    return true
  } catch (error) {
    return false
  }
}

export function clearAllAuthData() {
  try {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USERS_KEY)
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('bvi.profile.')) {
        localStorage.removeItem(key)
      }
    })
    return true
  } catch (error) {
    return false
  }
}

export function getCurrentUserFromStorage() {
  try {
    const session = getSession()
    if (session) {
      return {
        name: `${session.firstName || session.first_name || ''} ${session.lastName || session.last_name || ''}`.trim() || '',
        email: session.email || '',
        phone: session.phone || ''
      }
    }
    
    const candidates = ['session', 'auth', 'user', 'currentUser'];
    
    for (const key of candidates) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      
      const parsed = JSON.parse(raw);
      const u = parsed?.user ?? parsed?.profile ?? parsed;
      const name = typeof u?.name === 'string' ? u.name : '';
      const email = typeof u?.email === 'string' ? u.email : '';
      const phone = typeof u?.phone === 'string' ? u.phone : '';
      
      if (name || email) {
        return { name, email, phone };
      }
    }
  } catch (_e) {
  }
  
  return { name: '', email: '', phone: '' };
}
