import { useState } from 'react';

export default function CVPreview({ cvText, analysis, onDownload, onClose }) {
  const [format, setFormat] = useState('pdf');

  const formatCVForDisplay = (text) => {
    // Use actual CV text if available
    if (!text || text.trim().length < 10) {
      return <p className="text-gray-500 text-center py-8">No CV content available</p>;
    }

    // Parse and format the actual CV text
    const lines = text.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const trimmed = line.trim();
      
      // Section headers (all caps)
      if (trimmed.match(/^[A-Z\s&]{3,}$/) && trimmed.length < 50) {
        return (
          <h2 key={index} className="text-lg font-bold text-gray-900 mt-6 mb-3 border-b border-gray-300 pb-1">
            {trimmed}
          </h2>
        );
      }
      
      // Name (first line, likely the longest single word/name)
      if (index === 0 || (index < 3 && trimmed.length > 10 && !trimmed.includes('@') && !trimmed.includes('|'))) {
        return (
          <h1 key={index} className="text-2xl font-bold text-gray-900 mb-2">
            {trimmed}
          </h1>
        );
      }
      
      // Contact info (contains @ or phone patterns)
      if (trimmed.includes('@') || trimmed.match(/\d{3}[\-\s]?\d{3}[\-\s]?\d{4}/) || trimmed.includes('linkedin') || trimmed.includes('github')) {
        return (
          <p key={index} className="text-gray-600 mb-2">
            {trimmed}
          </p>
        );
      }
      
      // Bullet points
      if (trimmed.match(/^[•\-▸*]\s/) || trimmed.startsWith('- ')) {
        return (
          <li key={index} className="text-gray-700 ml-4 mb-1 list-disc">
            {trimmed.replace(/^[•\-▸*]\s*/, '')}
          </li>
        );
      }
      
      // Job titles/dates (contains years or 'Present')
      if (trimmed.match(/20\d{2}/) || trimmed.includes('Present') || trimmed.includes('Current')) {
        return (
          <p key={index} className="font-medium text-blue-600 mt-3 mb-1">
            {trimmed}
          </p>
        );
      }
      
      // Regular paragraphs
      if (trimmed.length > 0) {
        return (
          <p key={index} className="text-gray-700 mb-2 leading-relaxed">
            {trimmed}
          </p>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">CV Preview</h2>
          <div className="flex items-center space-x-4">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="pdf">PDF</option>
              <option value="txt">Text</option>
            </select>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm max-w-2xl mx-auto">
            <div className="space-y-2 text-sm leading-relaxed">
              {formatCVForDisplay(cvText)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Preview shows ATS-optimized formatting
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onDownload(format)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Download {format.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}