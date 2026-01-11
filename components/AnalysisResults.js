import { useState } from 'react';
import CVPreview from './CVPreview';

export default function AnalysisResults({ analysis, jobData, onReset, onRewrite, onImprove }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPreview, setShowPreview] = useState(false);
  const [cvText, setCvText] = useState('');

  const handleDownloadCV = async (format) => {
    try {
      // Use the original extracted CV text from analysis
      const cvTextToDownload = analysis?.extractedCvText || cvText || 'CV text not available';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/download-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cvText: cvTextToDownload,
          format,
          jobDescription: jobData?.description || '',
          analysis: analysis
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analyzed_cv_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setShowPreview(false);
      } else {
        console.error('Download failed:', response.statusText);
        alert('Download failed. Please try again.');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const showCVPreview = (text) => {
    // Try multiple sources for CV text
    const cvTextToShow = analysis?.extractedCvText || analysis?.originalCV || analysis?.cvText || text || 'CV text not available';
    console.log('CV text sources:', {
      extractedCvText: analysis?.extractedCvText?.substring(0, 100),
      originalCV: analysis?.originalCV?.substring(0, 100),
      cvText: analysis?.cvText?.substring(0, 100),
      passedText: text?.substring(0, 100)
    });
    setCvText(cvTextToShow);
    setShowPreview(true);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4">
      {/* Header with Main Score */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-8">
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-4">
            <div className={`text-4xl sm:text-6xl font-bold ${getScoreColor(analysis.overallScore)} mb-2 sm:mb-0`}>
              {analysis.overallScore}%
            </div>
            <div className="sm:ml-4 text-center sm:text-left">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">Match Score</div>
              <div className="text-sm sm:text-base text-gray-600">
                for <span className="font-semibold">{jobData.role}</span>
                {jobData.company && <span> at {jobData.company}</span>}
              </div>
            </div>
          </div>
          
          <div className={`inline-block px-3 sm:px-6 py-1 sm:py-2 rounded-full text-sm sm:text-lg font-medium ${getScoreBg(analysis.overallScore)} ${getScoreColor(analysis.overallScore)}`}>
            {analysis.summary?.verdict || 'Analysis Complete'}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 mt-4 sm:mt-8">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {analysis.atsAnalysis?.rankingScore || 0}%
              </div>
              <div className="text-xs sm:text-sm text-gray-600">ATS Compatibility</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {analysis.recruiterAnalysis?.scanScore || 0}%
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Recruiter Appeal</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">
                {analysis.matchPercentage || 0}%
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Keyword Match</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex items-start">
            <div className="text-red-600 mr-2 sm:mr-3 flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
                ⚠️ Critical Issues Found
              </h3>
              <p className="text-sm sm:text-base text-red-700 mb-3 sm:mb-4">
                These issues will likely prevent your CV from getting shortlisted. Fix these first!
              </p>
              <div className="space-y-2 sm:space-y-3">
                {analysis.criticalIssues.map((issue, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 sm:p-4 border border-red-200">
                    <div className="font-medium text-sm sm:text-base text-red-800">{issue.title}</div>
                    <div className="text-xs sm:text-sm text-red-700 mt-1">{issue.description}</div>
                    <div className="text-xs text-red-600 mt-1 sm:mt-2">
                      Impact: {issue.impact} • Fix time: {issue.fixTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'ats', label: 'ATS', icon: '🤖' },
              { id: 'recruiter', label: 'Recruiter', icon: '👩💼' },
              { id: 'bullets', label: 'Bullets', icon: '🎯' },
              { id: 'recommendations', label: 'Tips', icon: '💡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Strengths</h4>
                    <ul className="space-y-2">
                      {analysis.summary?.keyStrengths?.map((strength, index) => (
                        <li key={index} className="flex items-center text-green-700">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {strength}
                        </li>
                      )) || <li className="text-gray-500">No major strengths identified</li>}
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Areas for Improvement</h4>
                    <ul className="space-y-2">
                      {analysis.summary?.majorWeaknesses?.map((weakness, index) => (
                        <li key={index} className="flex items-center text-red-700">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          {weakness}
                        </li>
                      )) || <li className="text-gray-500">No major weaknesses identified</li>}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Quick Wins</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-2">
                    Estimated improvement time: <strong>{analysis.summary?.timeToImprove || 'Unknown'}</strong>
                  </p>
                  <ul className="space-y-1">
                    {analysis.summary?.quickWins?.map((win, index) => (
                      <li key={index} className="text-sm text-green-700">• {win}</li>
                    )) || <li className="text-sm text-green-700">No quick wins identified</li>}
                  </ul>
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center mt-4 sm:mt-8 space-y-2 sm:space-y-0 sm:space-x-4 px-2">
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Analyze Another CV
        </button>
        <button
          onClick={onImprove}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-orange-600 text-white rounded-lg text-sm sm:text-base hover:bg-orange-700 transition-colors"
        >
          Apply Improvements
        </button>
        <button
          onClick={onRewrite}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg text-sm sm:text-base hover:bg-green-700 transition-colors"
        >
          Auto-Rewrite CV
        </button>
        <button
          onClick={() => showCVPreview(analysis.extractedCvText || analysis.originalCV || 'CV text not available')}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg text-sm sm:text-base hover:bg-blue-700 transition-colors"
        >
          Preview & Download CV
        </button>
      </div>

      {/* CV Preview Modal */}
      {showPreview && (
        <CVPreview
          cvText={cvText}
          analysis={analysis}
          onDownload={handleDownloadCV}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}