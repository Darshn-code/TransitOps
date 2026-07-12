import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_MODULES = {
  "fleet_manager": "Fleet · Maintenance",
  "dispatcher": "Dashboard · Trips",
  "safety_officer": "Drivers · Compliance",
  "financial_analyst": "Fuel & Expenses · Analytics"
};

const ROLE_DISPLAY_NAMES = {
  "fleet_manager": "Fleet Manager",
  "dispatcher": "Dispatcher",
  "safety_officer": "Safety Officer",
  "financial_analyst": "Financial Analyst"
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('raven.k@transitops.in');
  const [password, setPassword] = useState('demo1234');
  const [role, setRole] = useState('dispatcher'); // Default from HTML was Dispatcher
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const MAX_ATTEMPTS = 5;


  const handleRoleTagClick = (roleKey) => {
    if (locked) return;
    setRole(roleKey);
  };

  const validateEmail = (v) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;

    setEmailError(false);
    setPasswordError(false);
    setErrorMsg(null);

    let hasError = false;
    if (!validateEmail(email)) {
      setEmailError(true);
      hasError = true;
    }
    if (!password) {
      setPasswordError(true);
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);

    try {
      // Login via context - will throw or set error in context on failure
      const success = await login(email, password, role);
      
      setLoading(false);
      
      if (success) {
        setFailedAttempts(0);
        const landing = { fleet_manager: '/fleet', dispatcher: '/trips', safety_officer: '/drivers', financial_analyst: '/fuel' }[role] || '/dashboard';
        navigate(landing, { replace: true });
      } else {
        // Fallback for mock/local checks if Context returns false instead of throwing
        handleFailedAttempt();
      }
    } catch (err) {
      setLoading(false);
      handleFailedAttempt(err.message || 'Incorrect email or password');
    }
  };

  const handleFailedAttempt = (customMsg) => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    
    setEmailError(true);
    setPasswordError(true);
    
    const remaining = MAX_ATTEMPTS - nextAttempts;
    
    if (remaining > 0) {
      setErrorMsg(customMsg || `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.`);
    } else {
      setLocked(true);
      setErrorMsg('Account locked after 5 failed attempts. Contact your administrator or reset your password.');
    }
  };

  return (
    <div className="login-page" id="login-root">
      {/* LEFT BRAND PANEL */}
      <div className="brand-panel">
        <div className="brand-top">
          <div className="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16.5V7.5C4 6.12 5.12 5 6.5 5H17.5C18.88 5 20 6.12 20 7.5V16.5" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4 13H20" stroke="#1A1A1A" strokeWidth="2"/>
              <circle cx="7.5" cy="18.5" r="1.5" fill="#1A1A1A"/>
              <circle cx="16.5" cy="18.5" r="1.5" fill="#1A1A1A"/>
            </svg>
          </div>
          <span className="wordmark">TransitOps</span>
        </div>

        <div className="brand-hero">
          <h1>Run your fleet with total clarity.</h1>
          <p className="tagline">Smart Transport Operations Platform</p>
        </div>

        <div className="role-map" id="roleMap">
          {Object.keys(ROLE_MODULES).map((roleKey) => (
            <div 
              key={roleKey}
              className={`role-tag ${role === roleKey ? 'active' : ''}`}
              onClick={() => handleRoleTagClick(roleKey)}
            >
              <span className="role-name">{ROLE_DISPLAY_NAMES[roleKey]}</span>
              <span className="role-modules">{ROLE_MODULES[roleKey]}</span>
            </div>
          ))}
        </div>

        <div className="brand-footer">TransitOps © 2026 · RBAC Enabled</div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="form-panel">
        <div className="form-wrap">
          <div className="form-heading">
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to continue</p>
          </div>

          <div className={`login-form-alert ${errorMsg ? 'show' : ''}`} id="formAlert">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#C92B21" strokeWidth="1.6"/>
              <path d="M10 6V10.5" stroke="#C92B21" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="10" cy="13.5" r="1" fill="#C92B21"/>
            </svg>
            <span id="formAlertText">{errorMsg}</span>
          </div>

          <form id="loginForm" onSubmit={handleSubmit} noValidate>
            <div className={`login-field ${emailError ? 'has-error' : ''}`} id="emailField">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="raven.k@transitops.in" 
                autoComplete="username" 
                disabled={locked || loading}
                required 
              />
              <div className="login-field-error">Enter a valid email address</div>
            </div>

            <div className={`login-field ${passwordError ? 'has-error' : ''}`} id="passwordField">
              <label htmlFor="password">Password</label>
              <div className="pw-wrap">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  name="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••" 
                  autoComplete="current-password" 
                  disabled={locked || loading}
                  required 
                />
                <button 
                  type="button" 
                  className="pw-toggle" 
                  id="pwToggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={locked}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              <div className="login-field-error">Password is required</div>
            </div>

            <div className="login-field">
              <label htmlFor="role">Role (RBAC)</label>
              <select 
                id="role" 
                name="role" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={locked || loading}
              >
                <option value="fleet_manager">Fleet Manager</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="safety_officer">Safety Officer</option>
                <option value="financial_analyst">Financial Analyst</option>
              </select>
              <div className="role-hint">You'll land on: <strong id="roleHintText">{ROLE_MODULES[role]}</strong></div>
            </div>

            <div className="row-between">
              <label className="remember">
                <input type="checkbox" id="rememberMe" defaultChecked disabled={locked} />
                Remember me
              </label>
              <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>

            <button 
              type="submit" 
              className={`login-btn-signin ${loading ? 'loading' : ''}`} 
              id="signInBtn"
              disabled={locked || loading}
            >
              <span className="login-spinner"></span>
              <span className="login-btn-label" id="signInLabel">
                {locked ? "Account Locked" : loading ? "Signing in..." : "Sign In"}
              </span>
            </button>

            <div 
              className="login-lockout-note" 
              id="lockoutNote"
              style={locked ? { color: '#C92B21', fontWeight: '700' } : {}}
            >
              {locked 
                ? 'This account is locked. Use "Forgot password?" to recover access.'
                : '5 failed attempts locks this account for security.'}
            </div>
          </form>

          <div className="login-access-note">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 5.5V9.5C3 13.6 5.9 17.4 10 18.5C14.1 17.4 17 13.6 17 9.5V5.5L10 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
            <span>Access is scoped by role after login. Your view will only show modules assigned to your selected role.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export { ROLE_DISPLAY_NAMES };
