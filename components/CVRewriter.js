import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

// Normalize API URL by removing trailing slashes
const getApiUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return baseUrl.replace(/\/$/, '');
};

// Identify missing critical fields from CV text
const identifyMissingFields = (cvText, analysis) => {
  const missing = [];
  const cvLower = cvText.toLowerCase();

  // Check for phone number
  if (!cvText.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/) && !cvText.match(/\+\d{1,3}\s?\d{1,14}/)) {
    missing.push({
      field: 'phone',
      label: 'Phone Number',
      type: 'tel',
      priority: 'critical',
      impact: 'Recruiters need contact info'
    });
  }

  // Check for email
  if (!cvText.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)) {
    missing.push({
      field: 'email',
      label: 'Email Address',
      type: 'email',
      priority: 'critical',
      impact: 'Essential for recruiter communication'
    });
  }

  // Check for LinkedIn
  if (!cvLower.includes('linkedin') && !cvLower.includes('linkedin.com')) {
    missing.push({
      field: 'linkedin',
      label: 'LinkedIn Profile URL',
      type: 'url',
      priority: 'high',
      impact: 'Recruiters verify professional history'
    });
  }

  // Check for location
  if (!cvLower.includes('location') && !cvLower.includes('based in') && !cvLower.includes('city') && !cvLower.includes(',')) {
    missing.push({
      field: 'location',
      label: 'Location/City',
      type: 'text',
      priority: 'high',
      impact: 'Remote vs. on-site job matching'
    });
  }

  // Check for weak bullets (low quality experience descriptions)
  const weakBullets = analysis?.intelligenceAnalysis?.bullets?.bulletAnalysis?.filter(b => b.score < 60) || [];
  if (weakBullets.length > 0) {
    missing.push({
      field: 'bulletEnhancements',
      label: `Enhance ${weakBullets.length} Bullet Points`,
      type: 'textarea',
      priority: 'critical',
      impact: `Weak bullets reduce score by ~${weakBullets.length * 15}%`
    });
  }

  // Check for missing keywords
  const missingKeywords = analysis?.atsAnalysis?.keywordMatch?.mandatory?.missing || [];
  if (missingKeywords.length > 5) {
    missing.push({
      field: 'keywordAdditions',
      label: `Add Missing Keywords (${missingKeywords.length} found)`,
      type: 'textarea',
      priority: 'critical',
      impact: `Missing keywords reduce ATS score by ~${Math.min(missingKeywords.length * 5, 40)}%`
    });
  }

  return missing;
};

export default function CVRewriter({ analysis, jobData, originalCV, structuredCV, onBack, userTier = 'free' }) {
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenCV, setRewrittenCV] = useState(null);
  const [improvements, setImprovements] = useState(null);
  const [user, setUser] = useState(null);
  const [currentUserTier, setCurrentUserTier] = useState(userTier || 'free');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [missingFields, setMissingFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});

  useEffect(() => {
    // Identify missing fields from analysis
    const missing = identifyMissingFields(originalCV, analysis);
    setMissingFields(missing);
    setLoading(false);
  }, [originalCV, analysis]);

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

      if (!response.ok || !result.success) {
        const errorMsg = result.details || result.message || 'Rewrite failed';
        console.error('Server error response:', result);
        throw new Error(errorMsg);
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

        {/* Premium Feature Paywall */}
        {currentUserTier !== 'premium' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-8 mb-8 text-center">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Premium Feature</h3>
            <p className="text-gray-600 mb-6">CV Rewriting is a premium feature. Upgrade to unlock AI-powered rewriting with:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left max-w-md mx-auto">
              <div className="flex items-start">
                <span className="text-2xl mr-3">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">AI Rewrite</p>
                  <p className="text-sm text-gray-600">Auto-optimize your CV</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">ATS Metrics</p>
                  <p className="text-sm text-gray-600">Full scoring breakdown</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Full Analysis</p>
                  <p className="text-sm text-gray-600">6+ detailed metrics</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">PDF Download</p>
                  <p className="text-sm text-gray-600">ATS-optimized format</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-6 inline-block">
              <p className="text-3xl font-bold text-blue-600">R130</p>
              <p className="text-sm text-gray-600">One-time payment</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  // Redirect to premium tier selection
                  window.location.href = '/?upgrade=true';
                }}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
              >
                Upgrade to Premium - R130
              </button>
              <button
                onClick={onBack}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                Back to Analysis
              </button>
            </div>
          </div>
        )}

        {currentUserTier === 'premium' && (
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
                  {(Array.isArray(improvements) ? improvements : improvements.improvements || []).map((improvement, index) => (
                    <div key={index} className="flex items-center text-green-800">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {improvement.description || improvement.title}
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
              <div className="text-sm text-green-700 mb-6">
                ✓ Keywords optimized for ATS systems<br/>
                ✓ Bullet points strengthened with metrics<br/>
                ✓ Action verbs enhanced<br/>
                ✓ Business impact highlighted
              </div>
            </div>

            {/* Rewritten CV Display */}
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Your Rewritten CV</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(rewrittenCV);
                      alert('CV copied to clipboard!');
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => handleDownload(rewrittenCV, 'pdf')}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    📥 Download PDF
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{rewrittenCV}</pre>
              </div>
            </div>

            {/* Missing Fields Enhancement Section */}
            {missingFields.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="font-semibold text-orange-900 mb-4">📋 Fill Missing Information to Boost Your Score</h3>
                <p className="text-sm text-orange-700 mb-6">These fields are affecting your CV score. Adding them will improve your chances:</p>
                
                <div className="space-y-4">
                  {missingFields.map((field) => (
                    <div key={field.field} className="bg-white rounded-lg p-4 border border-orange-100">
                      <div className="flex justify-between items-start mb-2">
                        <label className="font-semibold text-gray-900">{field.label}</label>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          field.priority === 'critical' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {field.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">Impact: {field.impact}</p>
                      
                      {field.type === 'textarea' ? (
                        <textarea
                          value={fieldValues[field.field] || ''}
                          onChange={(e) => setFieldValues({...fieldValues, [field.field]: e.target.value})}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows="3"
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={fieldValues[field.field] || ''}
                          onChange={(e) => setFieldValues({...fieldValues, [field.field]: e.target.value})}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const filledData = Object.entries(fieldValues)
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('\n\n');
                    
                    if (filledData) {
                      navigator.clipboard.writeText(filledData);
                      alert('Information copied! You can now integrate it into your CV.');
                    } else {
                      alert('Please fill in at least one field.');
                    }
                  }}
                  className="mt-4 w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-medium"
                >
                  ✅ Copy Information to Add to CV
                </button>
              </div>
            )}
        )}

        {/* Back Button */}
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
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}