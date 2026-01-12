import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

// Normalize API URL by removing trailing slashes
const getApiUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return baseUrl.replace(/\/$/, '');
};

export default function CVRewriter({ analysis, jobData, originalCV, structuredCV, onBack }) {
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenCV, setRewrittenCV] = useState(null);
  const [improvements, setImprovements] = useState(null);
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/user`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setUserTier(data.user?.tier || 'free');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    setRewriting(true);
    try {
      const formData = new FormData();
      
      const cvBlob = new Blob([originalCV], { type: 'text/plain' });
      formData.append('cv', cvBlob, 'original_cv.txt');
      formData.append('jobDescription', jobData.description);
      formData.append('targetRole', jobData.role);
      formData.append('companyName', jobData.company);

      const response = await fetch(`${getApiUrl()}/api/rewrite-cv`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        if (result.requiresAuth) {
          setShowAuthModal(true);
          return;
        }
        throw new Error(result.message || 'Rewrite failed');
      }

      setRewrittenCV(result.rewritten);
      setImprovements(result.improvements);
    } catch (error) {
      console.error('Rewrite error:', error);
      alert('Failed to rewrite CV: ' + error.message);
    } finally {
      setRewriting(false);
    }
  };

  const handleDownload = async (cvText, format, structured = null) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/download-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvText: cvText,
          structured: structured,
          format: format
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `improved_cv_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download CV: ' + error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            CV Rewriter & Optimizer
          </h2>
          <p className="text-gray-600">
            Generate an improved version optimized for: <span className="font-semibold text-blue-600">{jobData.role}</span>
            {jobData.company && <span> at {jobData.company}</span>}
          </p>
        </div>

        {/* Current Analysis Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Current CV Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.overallScore}%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analysis.atsAnalysis?.keywordMatch?.mandatory?.missing?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Missing Keywords</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analysis.intelligenceAnalysis?.bullets?.bulletAnalysis?.filter(b => b.score < 60).length || 0}
              </div>
              <div className="text-sm text-gray-600">Weak Bullets</div>
            </div>
          </div>
        </div>

        {/* Rewrite Section */}
        {!rewrittenCV ? (
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">What we'll improve:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="space-y-2">
                  <div>✓ Add missing mandatory keywords naturally</div>
                  <div>✓ Rewrite weak bullets with metrics</div>
                    <div>✓ Strengthen action verbs</div>
                  </div>
                  <div className="space-y-2">
                    <div>✓ Optimize for ATS parsing</div>
                    <div>✓ Improve recruiter scanning</div>
                  <div>✓ Strengthen action verbs</div>
                </div>
                <div className="space-y-2">
                  <div>✓ Optimize for ATS parsing</div>
                  <div>✓ Improve recruiter scanning</div>
                  <div>✓ Enhance first impression</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleRewrite}
              disabled={rewriting}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                rewriting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {rewriting ? 'Rewriting CV...' : 'Generate Improved CV'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Improvements Summary */}
            {improvements && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-900 mb-3">Improvements Made:</h3>
                <div className="space-y-2">
                  {improvements.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-center text-green-800">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {improvement.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CV Comparison */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Improved CV Generated</h3>
              <p className="text-green-800 mb-4">
                Your CV has been successfully rewritten and optimized for the target role.
              </p>
              <div className="text-sm text-green-700">
                ✓ Keywords optimized for ATS systems<br/>
                ✓ Bullet points strengthened with metrics<br/>
                ✓ Action verbs enhanced<br/>
                ✓ Business impact highlighted
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setRewrittenCV(null);
                  setImprovements(null);
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Generate Another Version
              </button>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Back to Analysis
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(userData) => {
          setUser(userData);
          setUserTier(userData?.tier || 'free');
          setShowAuthModal(false);
        }}
      />

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⭐</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h2>
              <p className="text-gray-600">CV Rewriting is only available for Premium members</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-semibold mb-2">Premium includes:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✓ AI-Powered CV Rewriting</li>
                <li>✓ ATS Compatibility Score</li>
                <li>✓ Recruiter Appeal Analysis</li>
                <li>✓ Detailed Keyword Matching</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowUpgradePrompt(false);
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}    <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}