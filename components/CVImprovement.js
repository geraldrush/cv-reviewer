import { useState } from 'react';
import CVPreview from './CVPreview';

export default function CVImprovement({ analysis, jobData, originalCV, onComplete, onBack }) {
  const [improvements, setImprovements] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [improvedCV, setImprovedCV] = useState('');
  

  const handleDownloadCV = async (format) => {
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseURL}/api/download-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, format })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `optimized_cv_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setShowPreview(false);
      } else {
        console.error('Download failed:', response.statusText);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleInputChange = (key, value) => {
    setImprovements(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyImprovements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apply-improvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalCV,
          improvements,
          jobDescription: jobData.description
        })
      });

      const result = await response.json();
      if (result.success) {
        setImprovedCV(result.improvedCV);
        onComplete(result.improvedCV);
      } else {
        alert('Failed to apply improvements: ' + result.message);
      }
    } catch (error) {
      console.error('Improvement error:', error);
      alert('Failed to apply improvements');
    } finally {
      setLoading(false);
    }
  };

  const getImprovementFields = () => {
    const fields = [];

    // Missing keywords
    if (analysis.atsAnalysis?.keywordMatch?.mandatory?.missing?.length > 0) {
      fields.push({
        key: 'missingKeywords',
        title: 'Add Missing Keywords',
        description: `Missing: ${analysis.atsAnalysis.keywordMatch.mandatory.missing.slice(0, 5).join(', ')}`,
        placeholder: 'Where would you like to add these keywords? (e.g., in skills section, work experience, etc.)',
        type: 'textarea'
      });
    }

    // Weak bullets
    const weakBullets = analysis.intelligenceAnalysis?.bullets?.bulletAnalysis?.filter(b => b.score < 60) || [];
    if (weakBullets.length > 0) {
      weakBullets.slice(0, 3).forEach((bullet, index) => {
        fields.push({
          key: `bulletImprovement_${index}`,
          title: `Improve Bullet Point ${index + 1}`,
          description: `Original: "${bullet.original}"`,
          placeholder: 'Rewrite with metrics and strong action verbs (e.g., "Led team of 5 developers, delivering 3 projects 20% ahead of schedule")',
          type: 'textarea'
        });
      });
    }

    // First impression
    if (analysis.recruiterAnalysis?.firstImpressionScore < 70) {
      fields.push({
        key: 'professionalSummary',
        title: 'Improve Professional Summary',
        description: 'Your opening section needs to be more impactful for recruiters',
        placeholder: 'Write a compelling 2-3 line summary highlighting your key skills and experience',
        type: 'textarea'
      });
    }

    // Contact info issues
    if (analysis.atsAnalysis?.filteringIssues?.some(issue => issue.type === 'critical')) {
      fields.push({
        key: 'contactInfo',
        title: 'Fix Contact Information',
        description: 'Missing or incomplete contact details',
        placeholder: 'Provide complete contact info: Full Name | Email | Phone | Location | LinkedIn',
        type: 'text'
      });
    }

    // Skills section
    if (analysis.atsAnalysis?.keywordMatch?.niceToHave?.percentage < 50) {
      fields.push({
        key: 'skillsSection',
        title: 'Enhance Skills Section',
        description: 'Add more relevant technical skills',
        placeholder: 'List additional skills relevant to the job (e.g., programming languages, tools, frameworks)',
        type: 'textarea'
      });
    }

    return fields;
  };

  const improvementFields = getImprovementFields();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Apply Recommended Improvements
          </h2>
          <p className="text-gray-600">
            Provide specific improvements for your CV based on the analysis
          </p>
        </div>

        {/* Current Score */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analysis.overallScore}%
            </div>
            <div className="text-gray-600">Current Match Score</div>
          </div>
        </div>

        {/* Improvement Fields */}
        <div className="space-y-8">
          {improvementFields.map((field) => (
            <div key={field.key} className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {field.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {field.description}
              </p>
              
              {field.type === 'textarea' ? (
                <textarea
                  value={improvements[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  rows={4}
                />
              ) : (
                <input
                  type="text"
                  value={improvements[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              )}
            </div>
          ))}

          {improvementFields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Your CV looks good! No major improvements needed.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Back to Analysis
          </button>

          {improvementFields.length > 0 && (
            <div className="flex space-x-3">
              <button
                onClick={handleApplyImprovements}
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Applying Improvements...' : 'Apply Improvements'}
              </button>
              
              {improvedCV && (
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Preview & Download
                </button>
              )}
            </div>
          )}
        </div>

        {/* CV Preview Modal */}
        {showPreview && improvedCV && (
          <CVPreview
            cvText={improvedCV}
            onDownload={handleDownloadCV}
            onClose={() => setShowPreview(false)}
          />
        )}

        {/* Tips */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Tips for Better Results:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>• Be specific with metrics and numbers</div>
            <div>• Use strong action verbs (built, led, delivered)</div>
            <div>• Include relevant keywords naturally</div>
            <div>• Focus on achievements, not responsibilities</div>
          </div>
        </div>
      </div>
    </div>
  );
}