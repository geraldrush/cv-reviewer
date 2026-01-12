import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { tier, amount } = router.query;

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      if (!user) {
        setError('Please sign in first');
        return;
      }

      // Call backend to initiate PayFast payment
      const response = await fetch('/api/payfast/init-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          tier: tier,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.full_name || user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initialization failed');
      }

      const data = await response.json();
      
      // Redirect to PayFast
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError('Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💳</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
          <p className="text-gray-600">Secure payment powered by PayFast</p>
        </div>

        {/* Payment Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Plan</p>
            <p className="text-xl font-bold text-gray-900 capitalize">{tier} Tier</p>
          </div>
          <div className="border-t border-blue-200 pt-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-blue-600">R{amount}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Payment for:</p>
            <p className="font-semibold text-gray-900">{user.email}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={loading || !user}
          className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all duration-300 mb-4 ${
            loading || !user
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? 'Processing...' : `Pay R${amount} with PayFast`}
        </button>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-xs text-blue-700 mb-2">🔒 Secure Payment</p>
          <p className="text-xs text-gray-600">
            You will be redirected to PayFast for secure payment processing. No card details stored on our servers.
          </p>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
