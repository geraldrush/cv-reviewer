import { useState, useEffect } from 'react';

// Normalize API URL by removing trailing slashes
const getApiUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return baseUrl.replace(/\/$/, '');
};

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: 300 }
        );
      };
    }
  }, [isOpen]);

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiUrl()}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600">Please sign in with Google to access CV rewriting</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div id="google-signin-button"></div>
        </div>

        {loading && (
          <div className="text-center text-gray-600 mb-4">
            Signing in...
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AuthModal;