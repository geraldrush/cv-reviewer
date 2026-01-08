import { useState } from 'react';

export default function CVPreview({ cvText, onDownload, onClose }) {
  const [format, setFormat] = useState('pdf');

  const formatCVForDisplay = (text) => {
    // If no text provided, show complete template
    if (!text || text.trim().length < 50) {
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b-2 border-blue-500 pb-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">FULL NAME</h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p>(555) 123-4567    your.email@example.com</p>
              <p>linkedin.com/in/yourname    github.com/yourusername</p>
              <p>City, Country</p>
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">PROFESSIONAL SUMMARY</h2>
            <p className="text-gray-700 leading-relaxed">
              Self-taught Full-Stack Developer with hands-on experience building and deploying scalable web applications using Next.js, Prisma, and PostgreSQL. Passionate about performance optimization and secure authentication systems.
            </p>
          </div>

          {/* Core Skills */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">CORE SKILLS</h2>
            <div className="text-gray-700 space-y-1">
              <p>• Languages: JavaScript, TypeScript, SQL</p>
              <p>• Frameworks: Next.js, React, Express</p>
              <p>• Databases: PostgreSQL, Prisma, Supabase</p>
              <p>• Cloud & DevOps: Vercel, Oracle Cloud, Docker</p>
              <p>• Tools: Git, GitHub, REST APIs</p>
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">WORK EXPERIENCE</h2>
            <div className="mb-4">
              <h3 className="font-bold text-blue-600">Full-Stack Developer</h3>
              <p className="text-sm text-gray-600 mb-2">Freelance / Personal Projects • 2023 - Present</p>
              <ul className="text-gray-700 space-y-1 ml-4">
                <li>▸ Developed a full-stack web application using Next.js and PostgreSQL, deployed on Vercel</li>
                <li>▸ Optimized database queries, improving API response time by 35%</li>
                <li>▸ Integrated Google OAuth and role-based access control for secure authentication</li>
              </ul>
            </div>
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">PROJECTS</h2>
            <div className="mb-4">
              <h3 className="font-bold text-purple-600">ATS-Compliant CV Review Platform | Next.js, Prisma, PostgreSQL</h3>
              <p className="text-sm text-gray-600 mb-2">github.com/username/cv-reviewer</p>
              <p className="text-gray-700 mb-2 ml-4">Built an ATS-compliant CV review platform using Next.js and Prisma</p>
              <ul className="text-gray-700 space-y-1 ml-4">
                <li>▸ Implemented resume parsing and keyword scoring logic</li>
                <li>▸ Deployed using Cloudflare and Supabase (free tier)</li>
              </ul>
            </div>
          </div>

          {/* Education */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">EDUCATION</h2>
            <div className="space-y-2">
              <div>
                <h3 className="font-bold text-green-600">Diploma in Information Technology</h3>
                <p className="text-sm text-gray-600">XYZ College • In Progress</p>
              </div>
              <div>
                <h3 className="font-bold text-green-600">Self-taught Software Development</h3>
                <p className="text-sm text-gray-600">Online courses & real-world projects • 2022-2024</p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">CERTIFICATIONS</h2>
            <div className="text-gray-700 space-y-1">
              <p>• Google IT Support Certificate</p>
              <p>• AWS Cloud Practitioner</p>
              <p>• Meta Front-End Developer Certificate</p>
              <p>• FreeCodeCamp Responsive Web Design</p>
            </div>
          </div>
        </div>
      );
    }

    // Parse existing CV text
    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.match(/^[A-Z\s]{3,}$/) && trimmed.length < 30) {
        return (
          <h2 key={index} className="text-lg font-bold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-1">
            {trimmed}
          </h2>
        );
      }
      
      if (index === 0 && trimmed.length > 0) {
        return (
          <h1 key={index} className="text-2xl font-bold text-gray-900 mb-2">
            {trimmed}
          </h1>
        );
      }
      
      if (trimmed.includes('@') || trimmed.includes('|')) {
        return (
          <p key={index} className="text-gray-600 mb-4">
            {trimmed}
          </p>
        );
      }
      
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('▸')) {
        return (
          <li key={index} className="text-gray-700 ml-4 mb-1">
            {trimmed.replace(/^[•\-▸]\s*/, '')}
          </li>
        );
      }
      
      if (trimmed.includes('|') && (trimmed.includes('20') || trimmed.includes('Present'))) {
        return (
          <p key={index} className="font-medium text-gray-800 mt-3 mb-1">
            {trimmed}
          </p>
        );
      }
      
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