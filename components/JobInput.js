import { useState } from 'react';

export default function JobInput({ onSubmit }) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.description.trim().length < 50) {
      alert('Please provide a more detailed job description (at least 50 characters)');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isValid = formData.description.trim().length >= 50;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 1: Tell us about the job
          </h2>
          <p className="text-gray-600">
            We'll analyze your CV specifically for this role
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g., Google, Microsoft, Startup Inc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role Title
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g., Senior Frontend Engineer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={12}
              placeholder="Paste the full job description here. Include requirements, responsibilities, and preferred qualifications..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {formData.description.length} characters
              </p>
              {formData.description.length > 0 && formData.description.length < 50 && (
                <p className="text-sm text-red-500">
                  Need at least 50 characters for accurate analysis
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-blue-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Pro Tip</h3>
                <p className="text-sm text-blue-700 mt-1">
                  The more detailed the job description, the more accurate our analysis will be. Include requirements, nice-to-haves, and company info.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={!isValid}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                isValid
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Analyze Job Requirements
            </button>
          </div>
        </form>

        {/* Sample Job Descriptions */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Need inspiration? Try these sample job descriptions:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Frontend Engineer',
                company: 'Tech Startup',
                preview: 'React, TypeScript, 3+ years experience...'
              },
              {
                title: 'Data Scientist',
                company: 'Fortune 500',
                preview: 'Python, ML, PhD preferred...'
              },
              {
                title: 'Product Manager',
                company: 'SaaS Company',
                preview: 'B2B experience, roadmap planning...'
              }
            ].map((sample, index) => (
              <button
                key={index}
                onClick={() => setFormData({
                  company: sample.company,
                  role: sample.title,
                  description: `Sample job description for ${sample.title} at ${sample.company}. This would include detailed requirements, responsibilities, and qualifications needed for the role.`
                })}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{sample.title}</div>
                <div className="text-sm text-gray-600">{sample.company}</div>
                <div className="text-xs text-gray-500 mt-1">{sample.preview}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}