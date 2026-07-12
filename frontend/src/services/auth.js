// POST /auth/login → { access_token, token_type }
// LoginIn: { email, password, role }

export async function loginRequest(email, password, role) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Login failed');
  return data; // { access_token, token_type }
}
