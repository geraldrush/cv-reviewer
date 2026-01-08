import { useState } from 'react';

export default function CVRewriter({ analysis, jobData, originalCV, onBack }) {
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenCV, setRewrittenCV] = useState(null);
  const [improvements, setImprovements] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState('pdf');

  const handleRewrite = async () => {
    setRewriting(true);
    try {
      const formData = new FormData();
      
      // Create a blob from the original CV text
      const cvBlob = new Blob([originalCV], { type: 'text/plain' });
      formData.append('cv', cvBlob, 'original_cv.txt');
      formData.append('jobDescription', jobData.description);
      formData.append('targetRole', jobData.role);
      formData.append('companyName', jobData.company);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rewrite-cv`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
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

  const handleDownload = async (cvText, format) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/download-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvText: cvText,
          format: format
        }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Original CV</h3>
                <div className="bg-gray-50 border rounded-lg p-4 h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{originalCV}</pre>
                </div>
                <button
                  onClick={() => handleDownload(originalCV, downloadFormat)}
                  className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Download Original
                </button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Improved CV</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{rewrittenCV}</pre>
                </div>
                <div className="mt-4 flex items-center space-x-4">
                  <select
                    value={downloadFormat}
                    onChange={(e) => setDownloadFormat(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pdf">PDF (ATS Optimized)</option>
                    <option value="txt">TXT Format</option>
                    <option value="md">Markdown</option>
                  </select>
                  <button
                    onClick={() => handleDownload(rewrittenCV, downloadFormat)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download Improved CV
                  </button>
                </div>
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
    </div>
  );
}