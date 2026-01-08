import { useState, useEffect } from 'react';

export default function CVBuilder({ jobData, onComplete, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState({});
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cv-questions`);
      const result = await response.json();
      if (result.success) {
        setQuestions(result.questions);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleInputChange = (key, value) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    // Validate current section before proceeding
    const currentQuestions = questions[currentSection];
    const requiredFields = currentQuestions.questions.filter(q => q.required);
    const missingFields = requiredFields.filter(q => !responses[q.key] || responses[q.key].trim() === '');
    
    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    if (currentSection < questions.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      generateCV();
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const generateCV = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/build-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          jobDescription: jobData?.description || ''
        })
      });

      const result = await response.json();
      if (result.success) {
        onComplete(result.cv, result.structured);
      } else {
        alert('Failed to generate CV: ' + result.message);
      }
    } catch (error) {
      console.error('CV generation error:', error);
      alert('Failed to generate CV');
    } finally {
      setGenerating(false);
    }
  };

  if (questions.length === 0) {
    return <div className="text-center py-8">Loading questions...</div>;
  }

  const currentQuestions = questions[currentSection];
  const progress = ((currentSection + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Build Your CV from Scratch
          </h2>
          <p className="text-gray-600">
            {jobData ? `Optimized for: ${jobData.role}` : 'Professional CV Builder'}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentSection + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestions.title}
          </h3>

          <div className="space-y-6">
            {currentQuestions.questions.map((question) => (
              <div key={question.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {question.label}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {question.type === 'textarea' ? (
                  <textarea
                    value={responses[question.key] || ''}
                    onChange={(e) => handleInputChange(question.key, e.target.value)}
                    placeholder={question.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    rows={4}
                    required={question.required}
                  />
                ) : (
                  <input
                    type={question.type}
                    value={responses[question.key] || ''}
                    onChange={(e) => handleInputChange(question.key, e.target.value)}
                    placeholder={question.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    required={question.required}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={currentSection === 0 ? onBack : handlePrevious}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {currentSection === 0 ? 'Back to Menu' : 'Previous'}
          </button>

          <button
            onClick={handleNext}
            disabled={generating}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              generating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {generating
              ? 'Generating CV...'
              : currentSection === questions.length - 1
              ? 'Generate CV'
              : 'Next'
            }
          </button>
        </div>
      </div>
    </div>
  );
}