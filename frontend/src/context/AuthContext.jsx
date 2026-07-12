import React, { createContext, useContext, useState } from 'react';
import { loginRequest } from '../services/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('fs_token') || null);
  const [role,  setRole]  = useState(localStorage.getItem('fs_role')  || null);
  const [email, setEmail] = useState(localStorage.getItem('fs_email') || null);

  /**
   * Calls POST /auth/login.
   * On success: stores token + role + email, returns true.
   * On failure: throws an Error with the backend's detail string.
   */
  async function login(userEmail, password, userRole) {
    const data = await loginRequest(userEmail, password, userRole);
    // data = { access_token, token_type }
    setToken(data.access_token);
    setRole(userRole);
    setEmail(userEmail);
    localStorage.setItem('fs_token', data.access_token);
    localStorage.setItem('fs_role',  userRole);
    localStorage.setItem('fs_email', userEmail);
    return true;
  }

  function logout() {
    setToken(null);
    setRole(null);
    setEmail(null);
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_role');
    localStorage.removeItem('fs_email');
  }

  return (
    <AuthContext.Provider value={{ token, role, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
