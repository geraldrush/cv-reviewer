import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function GoogleSignInButton({ onSuccess, onTierSelect }) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Supabase will redirect to callback, no need to call onSuccess here
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="px-8 py-3 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
      >
        {loading ? 'Signing in...' : '🔵 Sign in with Google'}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
