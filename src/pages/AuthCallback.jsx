import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api/client';
import { useAppContext } from '../context/AppContext';
import { Loader2 } from 'lucide-react';

/**
 * AuthCallback — handles the redirect from Google OAuth.
 * URL: /auth/callback?token=<jwt>
 * Reads the token, validates it via /api/auth/me, and logs the user in.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAppContext();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      console.error('[AuthCallback] Error or missing token:', error);
      navigate('/?auth_error=' + (error || 'missing_token'), { replace: true });
      return;
    }

    // Store token first so the interceptor picks it up
    localStorage.setItem('veronica_auth_token', token);

    // Validate token by fetching user profile
    authAPI.getMe()
      .then((res) => {
        login(res.data, token);
        navigate('/', { replace: true });
      })
      .catch((err) => {
        console.error('[AuthCallback] Token validation failed:', err.message);
        localStorage.removeItem('veronica_auth_token');
        navigate('/?auth_error=invalid_token', { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-screen h-screen bg-[#0e0e10] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      </div>
      <Loader2 className="text-blue-500 animate-spin" size={36} />
      <p className="text-white/60 text-sm">Signing you in with Google...</p>
    </div>
  );
}
