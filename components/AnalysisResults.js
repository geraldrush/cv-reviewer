import { useState } from 'react';

export default function AnalysisResults({ analysis, jobData, onReset, onRewrite, onImprove, user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPremium = user?.isPaid || false;
  const isFreeUser = !isPremium;

  const handlePremiumFeatureClick = (tabId) => {
    if (isFreeUser && ['ats', 'recruiter', 'bullets'].includes(tabId)) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveTab(tabId);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-500';
  };

  const getScoreBg = (score) => {
    if (score >= 85) return 'bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreGradient = (score) => {
    if (score >= 85) return 'from-emerald-500 to-emerald-600';
    if (score >= 70) return 'from-amber-500 to-amber-600';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Score Section */}
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-blue-500/5"></div>
          <div className="relative p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                <div className="relative">
                  <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-r ${getScoreGradient(analysis.overallScore)} flex items-center justify-center shadow-2xl`}>
                    <div className="text-4xl lg:text-6xl font-bold text-white">
                      {analysis.overallScore}%
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
                  </div>
                </div>
                
                <div className="text-center lg:text-left">
                  <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-2">
                    CV Analysis Complete
                  </h1>
                  <p className="text-lg lg:text-xl text-gray-600 mb-4">
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

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {analysis.atsAnalysis?.rankingScore || 0}%
                  </div>
                </div>
                <h3 className="font-semibold text-blue-900 mb-1">ATS Compatibility</h3>
                <p className="text-sm text-blue-700">How well ATS systems can parse your CV</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-emerald-600">
                    {analysis.recruiterAnalysis?.scanScore || 0}%
                  </div>
                </div>
                <h3 className="font-semibold text-emerald-900 mb-1">Recruiter Appeal</h3>
                <p className="text-sm text-emerald-700">6-second scan attractiveness</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {analysis.matchPercentage || 0}%
                  </div>
                </div>
                <h3 className="font-semibold text-purple-900 mb-1">Keyword Match</h3>
                <p className="text-sm text-purple-700">Job description alignment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Issues Alert */}
        {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-3 flex items-center">
                  <span className="mr-2">⚠️</span> Critical Issues Detected
                </h3>
                <p className="text-red-800 mb-4 text-lg">
                  These issues will likely prevent your CV from getting shortlisted. Address these immediately!
                </p>
                <div className="grid gap-4">
                  {analysis.criticalIssues.map((issue, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur rounded-xl p-4 border border-red-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 text-lg mb-2">{issue.title}</h4>
                          <p className="text-red-800 mb-3">{issue.description}</p>
                          <div className="flex items-center text-sm text-red-700">
                            <span className="bg-red-100 px-3 py-1 rounded-full mr-3">Impact: {issue.impact}</span>
                            <span className="bg-red-100 px-3 py-1 rounded-full">Fix time: {issue.fixTime}</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center ml-4">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Tabs */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <nav className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: '📊', color: 'blue' },
                { id: 'ats', label: 'ATS Analysis', icon: '🤖', color: 'indigo' },
                { id: 'recruiter', label: 'Recruiter View', icon: '👩‍💼', color: 'emerald' },
                { id: 'bullets', label: 'Bullet Points', icon: '🎯', color: 'orange' },
                { id: 'recommendations', label: 'Action Items', icon: '💡', color: 'purple' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handlePremiumFeatureClick(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-3 transition-all duration-300 whitespace-nowrap flex items-center space-x-2 relative ${
                    activeTab === tab.id
                      ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  } ${
                    isFreeUser && ['ats', 'recruiter', 'bullets'].includes(tab.id) ? 'opacity-60' : ''
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {isFreeUser && ['ats', 'recruiter', 'bullets'].includes(tab.id) && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🔒</span>
                    </div>
                  )}
                  {activeTab === tab.id && (
                    <div className={`w-2 h-2 rounded-full bg-${tab.color}-500 animate-pulse`}></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-emerald-900">Key Strengths</h4>
                    </div>
                    <div className="space-y-3">
                      {analysis.summary?.keyStrengths?.map((strength, index) => (
                        <div key={index} className="flex items-start bg-white/60 rounded-lg p-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-emerald-800 font-medium">{strength}</span>
                        </div>
                      )) || (
                        <div className="text-emerald-700 italic bg-white/60 rounded-lg p-3">
                          No major strengths identified in current analysis
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-red-900">Areas for Improvement</h4>
                    </div>
                    <div className="space-y-3">
                      {analysis.summary?.majorWeaknesses?.map((weakness, index) => (
                        <div key={index} className="flex items-start bg-white/60 rounded-lg p-3">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-red-800 font-medium">{weakness}</span>
                        </div>
                      )) || (
                        <div className="text-red-700 italic bg-white/60 rounded-lg p-3">
                          No major weaknesses identified in current analysis
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-blue-900">Quick Wins</h4>
                    <div className="ml-auto bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {analysis.summary?.timeToImprove || 'Est. time unknown'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.summary?.quickWins?.map((win, index) => (
                      <div key={index} className="flex items-center bg-white/60 rounded-lg p-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <span className="text-blue-800 font-medium">{win}</span>
                      </div>
                    )) || (
                      <div className="col-span-2 text-blue-700 italic bg-white/60 rounded-lg p-3">
                        No quick wins identified - consider comprehensive CV rewrite
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* ATS Analysis Tab */}
          {activeTab === 'ats' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">ATS Compatibility Analysis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Parsing Score</h4>
                    <div className="text-3xl font-bold text-blue-600">
                      {analysis.atsAnalysis?.parsingScore?.score || 0}%
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      How well ATS systems can read your CV
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-2">Ranking Score</h4>
                    <div className="text-3xl font-bold text-purple-600">
                      {analysis.atsAnalysis?.rankingScore || 0}%
                    </div>
                    <p className="text-sm text-purple-700 mt-2">
                      Your ranking against other candidates
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Keyword Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Mandatory Keywords</h5>
                      <div className="flex items-center mb-2">
                        <div className="text-2xl font-bold text-red-600">
                          {analysis.atsAnalysis?.keywordMatch?.mandatory?.percentage?.toFixed(0) || 0}%
                        </div>
                        <div className="ml-2 text-sm text-gray-600">
                          ({analysis.atsAnalysis?.keywordMatch?.mandatory?.matched || 0} of {analysis.atsAnalysis?.keywordMatch?.mandatory?.total || 0})
                        </div>
                      </div>
                      {analysis.atsAnalysis?.keywordMatch?.mandatory?.missing?.length > 0 && (
                        <div>
                          <p className="text-sm text-red-700 mb-1">Missing:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.atsAnalysis.keywordMatch.mandatory.missing.slice(0, 5).map((keyword, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Nice-to-Have Keywords</h5>
                      <div className="flex items-center mb-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysis.atsAnalysis?.keywordMatch?.niceToHave?.percentage?.toFixed(0) || 0}%
                        </div>
                        <div className="ml-2 text-sm text-gray-600">
                          ({analysis.atsAnalysis?.keywordMatch?.niceToHave?.matched || 0} of {analysis.atsAnalysis?.keywordMatch?.niceToHave?.total || 0})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recruiter Analysis Tab */}
          {activeTab === 'recruiter' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recruiter Simulation</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-2">Scan Score</h4>
                    <div className="text-3xl font-bold text-green-600">
                      {analysis.recruiterAnalysis?.scanScore || 0}%
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      6-second scan appeal
                    </p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-6">
                    <h4 className="font-semibold text-yellow-900 mb-2">First Impression</h4>
                    <div className="text-3xl font-bold text-yellow-600">
                      {analysis.recruiterAnalysis?.firstImpressionScore || 0}%
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      Top section impact
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-2">Bullets with Metrics</h4>
                    <div className="text-3xl font-bold text-purple-600">
                      {analysis.recruiterAnalysis?.bulletAnalysis?.withMetrics || 0}
                    </div>
                    <p className="text-sm text-purple-700 mt-2">
                      of {analysis.recruiterAnalysis?.bulletAnalysis?.total || 0} total
                    </p>
                  </div>
                </div>

                {analysis.recruiterAnalysis?.stopReadingPoint && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h4 className="font-semibold text-red-900 mb-2">⚠️ Recruiter Stop Point</h4>
                    <p className="text-red-800">
                      A recruiter is likely to stop reading at line {analysis.recruiterAnalysis.stopReadingPoint.line}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      Reason: {analysis.recruiterAnalysis.stopReadingPoint.reason}
                    </p>
                  </div>
                )}

                {analysis.recruiterAnalysis?.recruiterFeedback && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Recruiter Feedback</h4>
                    {analysis.recruiterAnalysis.recruiterFeedback.map((feedback, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${
                        feedback.type === 'critical' ? 'bg-red-50 border-red-200' :
                        feedback.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <p className="font-medium">{feedback.message}</p>
                        <p className="text-sm mt-1 opacity-75">{feedback.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bullets Analysis Tab */}
          {activeTab === 'bullets' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Bullet Point Analysis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysis.intelligenceAnalysis?.bullets?.totalBullets || 0}
                    </div>
                    <div className="text-sm text-blue-700">Total Bullets</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.intelligenceAnalysis?.bullets?.bulletAnalysis?.filter(b => b.hasMetric).length || 0}
                    </div>
                    <div className="text-sm text-green-700">With Metrics</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysis.intelligenceAnalysis?.bullets?.bulletAnalysis?.filter(b => b.hasActionVerb).length || 0}
                    </div>
                    <div className="text-sm text-purple-700">Strong Verbs</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {analysis.intelligenceAnalysis?.bullets?.overallScore || 0}%
                    </div>
                    <div className="text-sm text-orange-700">Overall Score</div>
                  </div>
                </div>

                {analysis.intelligenceAnalysis?.bullets?.bulletAnalysis && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Individual Bullet Analysis</h4>
                    {analysis.intelligenceAnalysis.bullets.bulletAnalysis.slice(0, 10).map((bullet, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-gray-800 flex-1">{bullet.original}</p>
                          <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                            bullet.score >= 80 ? 'bg-green-100 text-green-800' :
                            bullet.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {bullet.score}%
                          </div>
                        </div>
                        
                        {bullet.issues && bullet.issues.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-red-600 mb-1">Issues:</p>
                            <ul className="text-xs text-red-600 space-y-1">
                              {bullet.issues.map((issue, issueIndex) => (
                                <li key={issueIndex}>• {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {bullet.rewrittenVersion && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm text-green-800 font-medium mb-1">Suggested improvement:</p>
                            <p className="text-sm text-green-700">{bullet.rewrittenVersion}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Actionable Recommendations</h3>
                
                {analysis.recommendations && analysis.recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className={`border rounded-lg p-6 ${getPriorityColor(rec.priority)}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg">{rec.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="mb-3">{rec.description}</p>
                        {rec.impact && (
                          <p className="text-sm font-medium">Expected Impact: {rec.impact}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No specific recommendations available.</p>
                  </div>
                )}

                {analysis.improvements && analysis.improvements.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-900 mb-4">Detailed Improvements</h4>
                    <div className="space-y-6">
                      {analysis.improvements.map((improvement, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-6">
                          <h5 className="font-semibold text-gray-900 mb-2">{improvement.title}</h5>
                          <ul className="space-y-2 mb-3">
                            {improvement.actions?.map((action, actionIndex) => (
                              <li key={actionIndex} className="flex items-start text-sm text-gray-700">
                                <span className="text-blue-500 mr-2">•</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                          {improvement.expectedImpact && (
                            <p className="text-sm font-medium text-green-700">
                              Expected Impact: {improvement.expectedImpact}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Action Buttons - Moved to Bottom */}
        <div className="mt-12 bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Improve Your CV?</h3>
            <p className="text-gray-600">Choose your next step to enhance your job application success</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={onImprove}
              className="group relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2">Manual Improvements</h4>
                <p className="text-sm opacity-90">Apply specific suggestions step by step</p>
              </div>
            </button>

            <button
              onClick={onRewrite}
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2">AI Auto-Rewrite</h4>
                <p className="text-sm opacity-90">Let AI optimize your entire CV</p>
                <div className="mt-2 bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
                  Premium Feature
                </div>
              </div>
            </button>

            <button
              onClick={onReset}
              className="group relative overflow-hidden bg-gradient-to-r from-gray-500 to-gray-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2">Upload New CV</h4>
                <p className="text-sm opacity-90">Analyze a different CV document</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}