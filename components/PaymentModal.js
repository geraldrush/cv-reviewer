import { useState } from 'react';

// Normalize API URL by removing trailing slashes
const getApiUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return baseUrl.replace(/\/$/, '');
};

const PaymentModal = ({ isOpen, onClose, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/payment/create`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentUrl;
        form.target = '_blank';

        Object.keys(data.paymentData).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = data.paymentData[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        onClose();
      } else {
        setError(data.message || 'Payment setup failed');
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
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</h2>
          <p className="text-gray-600">Unlock AI-powered CV rewriting</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">CV Rewriter Premium</span>
            <span className="text-2xl font-bold text-gray-900">R99</span>
          </div>
          <div className="text-sm text-gray-600">
            ✓ Unlimited CV rewrites<br/>
            ✓ AI-powered improvements<br/>
            ✓ ATS optimization<br/>
            ✓ Lifetime access
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting up payment...' : 'Pay with PayFast'}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center mt-4">
          Secure payment powered by PayFast
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;