import { useState } from 'react';
import GoogleSignInButton from './GoogleSignInButton';

export default function TierSelection({ onSelectTier, onBack }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [showPremiumFlow, setShowPremiumFlow] = useState(false);

  const tiers = {
    free: {
      name: 'Free Tier',
      price: '$0',
      description: 'Perfect for getting started',
      color: 'orange',
      icon: '🚀',
      benefits: [
        '✓ Overall CV Score',
        '✓ Key Strengths & Weaknesses',
        '✓ Areas for Improvement (3-5 suggestions)',
        '✓ Score breakdown reasoning',
        '✓ Unlimited Free Analyses',
        '✓ Download CV (TXT)',
      ],
      unavailable: [
        '✗ ATS Compatibility Breakdown',
        '✗ Recruiter Appeal Analysis',
        '✗ Keyword Match Details',
        '✗ CV Format Scoring',
        '✗ AI Auto-Rewrite',
        '✗ Full Detailed Report',
      ],
      cta: 'Start Free Analysis',
      highlight: false,
    },
    premium: {
      name: 'Premium Tier',
      price: 'R130',
      currency: 'ZAR',
      description: 'Complete professional CV review',
      color: 'blue',
      icon: '⭐',
      benefits: [
        '✓ Everything in Free +',
        '✓ ATS Compatibility Score (35%)',
        '✓ Recruiter Appeal Score (35%)',
        '✓ Keyword Match Analysis (Detailed)',
        '✓ CV Format & Structure Scoring (10%)',
        '✓ Industry-Standard CV Generation',
        '✓ AI Auto-Rewrite with Best Practices',
        '✓ Full Detailed 6+ Metric Report',
        '✓ Actionable Recommendations',
        '✓ PDF Download (ATS-Optimized)',
        '✓ CV Building Assistant',
        '✓ Priority Support',
      ],
      unavailable: [],
      cta: 'Unlock Premium Analysis',
      highlight: true,
    },
  };

  const handlePremiumClick = () => {
    setShowPremiumFlow(true);
  };

  const handleTierSelect = (tier) => {
    if (tier === 'premium') {
      handlePremiumClick();
      return;
    }
    setSelectedTier(tier);
    onSelectTier(tier);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Analysis Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Whether you're just getting started or want comprehensive professional review, we have the right plan for you.
          </p>
          
          {/* Quick comparison */}
          <div className="inline-flex items-center bg-white rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-600 mb-12">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Free → Premium: Unlock 6+ detailed metrics and AI-powered improvements
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {Object.entries(tiers).map(([tierKey, tier]) => (
            <div
              key={tierKey}
              onClick={() => handleTierSelect(tierKey)}
              className={`relative group cursor-pointer transition-all duration-300 ${
                tier.highlight ? 'lg:scale-105' : ''
              }`}
            >
              {/* Card Background */}
              <div
                className={`relative rounded-3xl p-8 sm:p-10 border-2 transition-all duration-300 ${
                  tier.highlight
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-2xl hover:shadow-3xl'
                    : 'bg-white border-gray-200 shadow-lg hover:shadow-xl group-hover:border-orange-300'
                }`}
              >
                {/* Premium Badge */}
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular ⭐
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="mb-8">
                  <div className="text-5xl mb-3">{tier.icon}</div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h2>
                  <p className="text-gray-600 mb-4">{tier.description}</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    {tierKey === 'premium' && (
                      <span className="text-gray-600 text-sm">one-time payment</span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleTierSelect(tierKey)}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 mb-8 shadow-md hover:shadow-lg ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                  }`}
                >
                  {tier.cta}
                </button>

                {/* Benefits List */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                    What's Included:
                  </h3>
                  <ul className="space-y-3">
                    {tier.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start text-gray-700">
                        <span className={`mr-3 mt-0.5 ${
                          tier.color === 'blue' ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {benefit.startsWith('✓') ? '✓' : benefit.startsWith('✗') ? '✗' : '•'}
                        </span>
                        <span className={benefit.startsWith('✗') ? 'text-gray-400' : ''}>
                          {benefit.replace('✓ ', '').replace('✗ ', '')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Metric for Premium */}
                {tier.highlight && (
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                    <p className="text-sm text-blue-900 font-semibold mb-3">
                      📊 Your Complete CV Score Breakdown:
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/60 rounded-lg p-2 text-center">
                        <div className="font-bold text-blue-600">ATS (35%)</div>
                        <div className="text-xs text-gray-600">Parsing Score</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 text-center">
                        <div className="font-bold text-emerald-600">Recruiter (35%)</div>
                        <div className="text-xs text-gray-600">Appeal Score</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 text-center">
                        <div className="font-bold text-purple-600">Keywords (20%)</div>
                        <div className="text-xs text-gray-600">Match Score</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-2 text-center">
                        <div className="font-bold text-blue-600">Format (10%)</div>
                        <div className="text-xs text-gray-600">Structure Score</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-12">
          <div className="px-8 py-8 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900">
              Detailed Feature Comparison
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-8 py-4 text-left font-semibold text-gray-900">Feature</th>
                  <th className="px-8 py-4 text-center font-semibold text-orange-600">Free</th>
                  <th className="px-8 py-4 text-center font-semibold text-blue-600">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Overall CV Score', free: true, premium: true },
                  { feature: 'Key Strengths & Weaknesses', free: true, premium: true },
                  { feature: 'Improvement Suggestions', free: '3-5 Basic', premium: '10+ Detailed' },
                  { feature: 'ATS Compatibility Score', free: false, premium: true },
                  { feature: 'Recruiter Appeal Score', free: false, premium: true },
                  { feature: 'Keyword Match Analysis', free: false, premium: true },
                  { feature: 'CV Format Scoring', free: false, premium: true },
                  { feature: 'Industry-Standard CV Fields', free: false, premium: true },
                  { feature: 'AI Auto-Rewrite', free: false, premium: true },
                  { feature: 'Full Detailed Report', free: false, premium: true },
                  { feature: 'PDF Download (ATS-Optimized)', free: false, premium: true },
                  { feature: 'CV Building Assistant', free: false, premium: true },
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-8 py-4 font-medium text-gray-900">{row.feature}</td>
                    <td className="px-8 py-4 text-center">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <span className="text-green-600 font-bold">✓</span>
                        ) : (
                          <span className="text-gray-300 font-bold">✗</span>
                        )
                      ) : (
                        <span className="text-orange-600 font-medium text-sm">{row.free}</span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-center">
                      {typeof row.premium === 'boolean' ? (
                        row.premium ? (
                          <span className="text-blue-600 font-bold">✓</span>
                        ) : (
                          <span className="text-gray-300 font-bold">✗</span>
                        )
                      ) : (
                        <span className="text-blue-600 font-medium text-sm">{row.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Optimize Your CV?
          </h3>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Start with Free for a quick analysis, or go Premium for comprehensive insights and AI-powered improvements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleTierSelect('free')}
              className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300"
            >
              Start Free Analysis
            </button>
            <button
              onClick={() => handleTierSelect('premium')}
              className="px-8 py-4 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-xl transition-all duration-300"
            >
              Go Premium Now
            </button>
          </div>
        </div>

        {/* Back Button */}
        {onBack && (
          <div className="mt-8 text-center">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        )}

        {/* Premium Sign-Up & Payment Modal */}
        {showPremiumFlow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">⭐</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Premium Access</h2>
                <p className="text-gray-600 mb-6">Unlock complete CV analysis for just R130</p>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
                  <div className="text-4xl font-bold text-blue-600 mb-2">R130</div>
                  <p className="text-sm text-gray-600 mb-4">One-time payment</p>
                  <ul className="text-sm text-left space-y-2 text-gray-700">
                    <li>✓ ATS & Recruiter Scores</li>
                    <li>✓ Keyword Analysis</li>
                    <li>✓ AI CV Rewrite</li>
                    <li>✓ PDF Download</li>
                  </ul>
                </div>

                <p className="text-sm text-gray-600 mb-6">Sign in to continue to payment:</p>

                <GoogleSignInButton 
                  onSuccess={(user) => {
                    // User signed in, now redirect to payment
                    window.location.href = '/payment/checkout?tier=premium&amount=130&user=' + encodeURIComponent(JSON.stringify({
                      id: user.id,
                      email: user.email,
                      name: user.user_metadata?.full_name || user.email
                    }));
                  }}
                  label="Sign In with Google"
                />

                <button
                  onClick={() => setShowPremiumFlow(false)}
                  className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
