import { useState } from 'react';

export default function AnalysisResults({ analysis, jobData, onReset, onRewrite, onImprove, user, userTier, onUpgrade }) {
  const [activeTab, setActiveTab] = useState('overview');

  const isPremium = userTier === 'premium' || user?.isPaid || false;
  const isFreeUser = !isPremium;

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-500';
  };

  const getScoreBg = (score) => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreGradient = (score) => {
    if (score >= 85) return 'from-green-500 to-green-600';
    if (score >= 70) return 'from-yellow-500 to-yellow-600';
    if (score >= 50) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-50 text-red-800 border-red-200';
      case 'high': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'medium': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-orange-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Tier Badge */}
        <div className="mb-8 flex justify-center">
          <div className={`inline-flex items-center px-6 py-2 rounded-full text-sm font-bold ${
            isPremium 
              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
              : 'bg-orange-100 text-orange-700 border border-orange-300'
          }`}>
            {isPremium ? '⭐ Premium Analysis' : '🚀 Free Analysis'}
          </div>
        </div>

        {/* ========================
            FREE TIER - SIMPLE VIEW
            ======================== */}
        {isFreeUser && (
          <>
            {/* Hero Score Section */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-orange-200 mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-black/5"></div>
              <div className="relative p-8 lg:p-12">
                <div className="text-center">
                  <div className="flex flex-col items-center justify-center gap-8">
                    {/* Big Score Circle */}
                    <div className="relative">
                      <div className={`w-48 h-48 rounded-full bg-gradient-to-r ${getScoreGradient(analysis.overallScore)} flex items-center justify-center shadow-2xl`}>
                        <div className="text-6xl font-bold text-white">
                          {typeof analysis.overallScore === 'number' ? analysis.overallScore.toFixed(1) : analysis.overallScore}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        CV Analysis Complete
                      </h1>
                      <p className="text-lg text-gray-600 mb-6">
                        for <span className="font-semibold text-orange-600">{jobData.role}</span>
                        {jobData.company && <span className="text-gray-500"> at {jobData.company}</span>}
                      </p>
                      <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-medium border-2 ${getScoreBg(analysis.overallScore)} ${getScoreColor(analysis.overallScore)}`}>
                        <div className="w-2 h-2 rounded-full bg-current mr-3 animate-pulse"></div>
                        {analysis.summary?.verdict || 'Analysis Complete'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary & Reason */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why This Score?</h2>
              
              {/* Score Reasoning */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="text-lg mr-2">📊</span> Score Breakdown
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {analysis.summary?.reasoning || 
                   `Your CV score is ${analysis.overallScore?.toFixed(1)}%. ${
                    analysis.overallScore >= 80 
                      ? 'This is an excellent score! Your CV is well-structured and matches the job requirements.'
                      : analysis.overallScore >= 60
                      ? 'This is a good baseline. Your CV has the basics but could be improved.'
                      : 'Your CV needs significant improvements to be competitive.'
                   } Focus on the improvement areas below to increase your chances.`}
                </p>
              </div>

              {/* Strengths */}
              <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                <h3 className="font-semibold text-emerald-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">✅</span> What's Working Well
                </h3>
                <div className="space-y-2">
                  {analysis.summary?.keyStrengths?.map((strength, index) => (
                    <div key={index} className="flex items-start bg-white/60 rounded-lg p-3">
                      <span className="text-emerald-600 mr-3 font-bold">✓</span>
                      <span className="text-emerald-800">{strength}</span>
                    </div>
                  )) || (
                    <p className="text-emerald-700">Well-structured CV with relevant content</p>
                  )}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                <h3 className="font-semibold text-red-900 mb-4 flex items-center">
                  <span className="text-lg mr-2">⚠️</span> Areas to Improve
                </h3>
                <div className="space-y-2">
                  {analysis.summary?.majorWeaknesses?.map((weakness, index) => (
                    <div key={index} className="flex items-start bg-white/60 rounded-lg p-3">
                      <span className="text-red-600 mr-3 font-bold">→</span>
                      <span className="text-red-800">{weakness}</span>
                    </div>
                  )) || (
                    <p className="text-red-700">No specific weaknesses identified</p>
                  )}
                </div>
              </div>
            </div>



            {/* Premium Upgrade CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
              <div className="flex items-start gap-6">
                <div className="text-2xl">⭐</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">Want More Insights?</h3>
                  <p className="text-blue-100 mb-6 leading-relaxed">
                    Unlock Premium to see detailed analysis including ATS Compatibility Score, Recruiter Appeal, Keyword Matching, CV Format Scoring, and AI-powered CV rewriting.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-sm">
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="font-bold">ATS Score</div>
                      <div className="text-xs text-blue-100">35% weight</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="font-bold">Recruiter Score</div>
                      <div className="text-xs text-blue-100">35% weight</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="font-bold">Keyword Match</div>
                      <div className="text-xs text-blue-100">20% weight</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 bg-white/20 rounded-lg p-3">
                      <div className="font-bold">Format Score</div>
                      <div className="text-xs text-blue-100">10% weight</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Prompt user to sign in and pay for premium
                      alert('Sign in with Google and pay R130 to unlock premium analysis');
                    }}
                    className="bg-white text-blue-600 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg"
                  >
                    Unlock Premium Analysis →
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Next Steps</h3>
              <div className="grid grid-cols-1 md:grid-1 gap-4">
                <button
                  onClick={onReset}
                  className="p-6 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
                >
                  <div className="text-2xl mb-2">📤</div>
                  Analyze Another CV
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========================
            PREMIUM TIER - FULL ANALYSIS
            ======================== */}
        {isPremium && (
          <>
            {/* Hero Score Section */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-blue-200 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
              <div className="relative p-8 lg:p-12">
                <div className="text-center mb-8">
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                    <div className="relative">
                      <div className={`w-40 h-40 rounded-full bg-gradient-to-r ${getScoreGradient(analysis.overallScore)} flex items-center justify-center shadow-2xl`}>
                        <div className="text-6xl font-bold text-white">
                          {typeof analysis.overallScore === 'number' ? analysis.overallScore.toFixed(1) : analysis.overallScore}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center lg:text-left">
                      <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-2">
                        Premium CV Analysis
                      </h1>
                      <p className="text-lg text-gray-600 mb-4">
                        for <span className="font-semibold text-blue-600">{jobData.role}</span>
                        {jobData.company && <span className="text-gray-500"> at {jobData.company}</span>}
                      </p>
                      <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-medium border-2 ${getScoreBg(analysis.overallScore)} ${getScoreColor(analysis.overallScore)}`}>
                        <div className="w-2 h-2 rounded-full bg-current mr-3 animate-pulse"></div>
                        {analysis.summary?.verdict || 'Analysis Complete'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">
                        {typeof analysis.atsAnalysis?.rankingScore === 'number' ? analysis.atsAnalysis.rankingScore.toFixed(1) : 0}%
                      </div>
                    </div>
                    <h3 className="font-semibold text-blue-900 mb-1">ATS Score (35%)</h3>
                    <p className="text-sm text-blue-700">How ATS systems parse your CV</p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-emerald-600">
                        {typeof analysis.recruiterAnalysis?.scanScore === 'number' ? analysis.recruiterAnalysis.scanScore.toFixed(1) : 0}%
                      </div>
                    </div>
                    <h3 className="font-semibold text-emerald-900 mb-1">Recruiter (35%)</h3>
                    <p className="text-sm text-emerald-700">6-second scan appeal</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold text-purple-600">
                        {typeof analysis.matchPercentage === 'number' ? analysis.matchPercentage.toFixed(1) : 0}%
                      </div>
                    </div>
                    <h3 className="font-semibold text-purple-900 mb-1">Keywords (20%)</h3>
                    <p className="text-sm text-purple-700">Job description match</p>
                  </div>

                  <div className={`bg-gradient-to-br ${analysis.formatScore >= 85 ? 'from-green-50 to-green-100' : analysis.formatScore >= 70 ? 'from-yellow-50 to-yellow-100' : 'from-orange-50 to-orange-100'} rounded-2xl p-6 border ${analysis.formatScore >= 85 ? 'border-green-200' : analysis.formatScore >= 70 ? 'border-yellow-200' : 'border-orange-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${analysis.formatScore >= 85 ? 'bg-green-500' : analysis.formatScore >= 70 ? 'bg-yellow-500' : 'bg-orange-500'} rounded-xl flex items-center justify-center`}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className={`text-3xl font-bold ${analysis.formatScore >= 85 ? 'text-green-600' : analysis.formatScore >= 70 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {typeof analysis.formatScore === 'number' ? analysis.formatScore.toFixed(1) : 0}%
                      </div>
                    </div>
                    <h3 className={`font-semibold ${analysis.formatScore >= 85 ? 'text-green-900' : analysis.formatScore >= 70 ? 'text-yellow-900' : 'text-orange-900'} mb-1`}>Format (10%)</h3>
                    <p className={`text-sm ${analysis.formatScore >= 85 ? 'text-green-700' : analysis.formatScore >= 70 ? 'text-yellow-700' : 'text-orange-700'}`}>Structure & design</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Issues */}
            {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 mb-8 shadow-lg">
                <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                  <span className="mr-2">⚠️</span> Critical Issues
                </h3>
                <div className="space-y-3">
                  {analysis.criticalIssues.map((issue, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur rounded-xl p-4 border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-1">{issue.title}</h4>
                      <p className="text-red-800 text-sm">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs for Detailed Analysis */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-8">
              <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 overflow-x-auto flex gap-2">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'ats', label: 'ATS Details', icon: '🤖' },
                  { id: 'recruiter', label: 'Recruiter View', icon: '👩‍💼' },
                  { id: 'bullets', label: 'Bullets', icon: '🎯' },
                  { id: 'recommendations', label: 'Actions', icon: '💡' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-8">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                        <h4 className="text-lg font-bold text-emerald-900 mb-4">✅ Strengths</h4>
                        <div className="space-y-2">
                          {analysis.summary?.keyStrengths?.map((s, i) => (
                            <div key={i} className="text-emerald-800 text-sm">• {s}</div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                        <h4 className="text-lg font-bold text-red-900 mb-4">⚠️ Weaknesses</h4>
                        <div className="space-y-2">
                          {analysis.summary?.majorWeaknesses?.map((w, i) => (
                            <div key={i} className="text-red-800 text-sm">• {w}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ats' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">ATS Compatibility Analysis</h4>
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {analysis.atsAnalysis?.summary || 'Your CV is optimized for ATS systems. Key words and formatting are properly detected.'}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'recruiter' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">Recruiter Appeal Analysis</h4>
                    <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {analysis.recruiterAnalysis?.summary || 'Your CV presents well to human recruiters. The layout and content are engaging.'}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'bullets' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">Bullet Point Quality</h4>
                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                      <p className="text-gray-700 text-sm">
                        {analysis.intelligenceAnalysis?.bullets?.bulletAnalysis?.length || 0} bullet points analyzed.
                        {analysis.intelligenceAnalysis?.bullets?.overallScore && (
                          <span> Overall quality score: {analysis.intelligenceAnalysis.bullets.overallScore}%</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold">Actionable Recommendations</h4>
                    {analysis.recommendations?.slice(0, 5).map((rec, i) => (
                      <div key={i} className={`p-4 rounded-lg ${getPriorityColor(rec.priority)}`}>
                        <p className="font-semibold text-sm">{rec.title}</p>
                        <p className="text-xs mt-1">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={onRewrite}
                className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="text-2xl mb-2">✨</div>
                AI Auto-Rewrite
              </button>
              <button
                onClick={onImprove}
                className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="text-2xl mb-2">🚀</div>
                Apply Improvements
              </button>
              <button
                onClick={onReset}
                className="p-6 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="text-2xl mb-2">📤</div>
                Analyze Another
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
