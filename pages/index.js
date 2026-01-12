import { useState } from 'react';
import Head from 'next/head';
import JobInput from '../components/JobInput';
import CVUpload from '../components/CVUpload';
import AnalysisResults from '../components/AnalysisResults';
import CVRewriter from '../components/CVRewriter';
import CVBuilder from '../components/CVBuilder';
import CVImprovement from '../components/CVImprovement';
import LoadingSpinner from '../components/LoadingSpinner';
import TierSelection from '../components/TierSelection';

// Normalize API URL by removing trailing slashes
const getApiUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return baseUrl.replace(/\/$/, '');
};

export default function Home() {
  const [step, setStep] = useState(0); // 0: Tier Selection, 1: Job Input, 2: CV Upload, 3: Results
  const [userTier, setUserTier] = useState(null); // 'free' or 'premium'
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [originalCV, setOriginalCV] = useState(null);
  const [structuredCV, setStructuredCV] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTierSelect = (tier) => {
    setUserTier(tier);
    setStep(1); // Go to job input after tier selection
  };

  const handleUpgradeToPremium = () => {
    setUserTier('premium');
    // In real app, this would show payment modal
  };



  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    if (plan.id === 'basic') {
      setStep(1); // Go to job input for basic analysis
    } else {
      setStep(8); // Go to payment/premium flow
    }
  };

  const handleJobSubmit = (data) => {
    setJobData(data);
    setStep(2);
  };

  const handleCVBuilt = (cvText, structuredData) => {
    setOriginalCV(cvText);
    setStructuredCV(structuredData);
    // Auto-analyze the built CV
    const cvBlob = new Blob([cvText], { type: 'text/plain' });
    const cvFile = new File([cvBlob], 'built_cv.txt', { type: 'text/plain' });
    
    // Set default job data if none exists
    if (!jobData) {
      setJobData({
        role: structuredData.targetRole || 'Professional Role',
        company: 'Target Company',
        description: `Looking for a ${structuredData.targetRole || 'professional'} with skills in ${structuredData.keySkills || 'relevant technologies'}.`
      });
    }
    
    handleCVAnalysis(cvFile);
  };



  const handleCVAnalysis = async (cvFile) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('cv', cvFile);
      formData.append('jobDescription', jobData?.description || 'General professional role seeking qualified candidates.');
      formData.append('targetRole', jobData?.role || 'Professional');
      formData.append('companyName', jobData?.company || 'Target Company');
      formData.append('userTier', userTier || 'free'); // Include tier in request

      const response = await fetch(`${getApiUrl()}/api/analyze-cv`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error || 'Analysis failed');
      }

      setOriginalCV(result.extractedCvText);
      setAnalysis(result.analysis);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setStep(0); // Back to tier selection
    setUserTier(null);
    setSelectedTemplate(null);
    setJobData(null);
    setAnalysis(null);
    setOriginalCV(null);
    setStructuredCV(null);
    setError(null);
  };

  return (
    <>
      <Head>
        <title>CV Reviewer - Best-in-Class CV Analysis</title>
        <meta name="description" content="Get your CV reviewed by AI that thinks like both ATS systems and human recruiters" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <header className="text-center mb-8 sm:mb-12 relative">
            <div className="relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg sm:shadow-2xl border border-gray-100">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-black/5 rounded-2xl sm:rounded-3xl"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-lg">
                  <svg className="w-8 sm:w-10 h-8 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-2 sm:mb-3">
                  CV Reviewer
                </h1>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-4 sm:mb-5">
                  Dual-brain analysis: <span className="font-semibold text-orange-600">ATS systems</span> + <span className="font-semibold text-orange-600">human recruiters</span>
                </p>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1">✓ ATS-Optimized</div>
                  <div className="bg-black/5 border border-black/10 rounded-full px-3 py-1">✓ AI-Powered</div>
                  <div className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1">✓ Free</div>
                </div>
              </div>
            </div>
          </header>

          {/* Breadcrumbs */}
          {step > 0 && (
            <div className="flex justify-center mb-3 sm:mb-4 px-4">
              <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500">
                <button 
                  onClick={() => setStep(0)}
                  className="hover:text-orange-600 transition-colors"
                >
                  Tier
                </button>
                {step >= 1 && (
                  <>
                    <span>/</span>
                    <button 
                      onClick={() => setStep(1)}
                      className={`hover:text-orange-600 transition-colors ${
                        step === 1 ? 'text-orange-600 font-medium' : ''
                      }`}
                    >
                      Job Details
                    </button>
                  </>
                )}
                {step >= 2 && (
                  <>
                    <span>/</span>
                    <button 
                      onClick={() => setStep(2)}
                      className={`hover:text-orange-600 transition-colors ${
                        step === 2 ? 'text-orange-600 font-medium' : ''
                      }`}
                    >
                      Upload CV
                    </button>
                  </>
                )}
                {step >= 3 && (
                  <>
                    <span>/</span>
                    <span className={`${
                      step === 3 ? 'text-orange-600 font-medium' : ''
                    }`}>
                      {step === 3 ? 'Results' : step === 4 ? 'Rewriter' : step === 5 ? 'Improvement' : step === 6 ? 'CV Builder' : 'Analysis'}
                    </span>
                  </>
                )}
              </nav>
            </div>
          )}

          {/* Progress Indicator */}
          {step > 0 && (
            <div className="flex justify-center mb-4 sm:mb-8 px-4">
              <div className="flex items-center space-x-2 sm:space-x-4 bg-white rounded-full px-3 sm:px-6 py-2 sm:py-3 border border-gray-200 shadow-sm">
                <div className={`flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                  step >= 1 ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className="font-semibold text-xs sm:text-base">1</span>
                </div>
                <div className={`w-8 sm:w-20 h-0.5 transition-all duration-300 ${
                  step >= 2 ? 'bg-orange-500' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                  step >= 2 ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className="font-semibold text-xs sm:text-base">2</span>
                </div>
                <div className={`w-8 sm:w-20 h-0.5 transition-all duration-300 ${
                  step >= 3 ? 'bg-orange-500' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-6 h-6 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                  step >= 3 ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className="font-semibold text-xs sm:text-base">3</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="max-w-2xl mx-auto mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm sm:text-base font-semibold text-red-800">Analysis Error</h3>
                  <p className="text-red-700 mt-1 leading-relaxed text-xs sm:text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && <LoadingSpinner />}

          {/* Step Content */}
          {!loading && (
            <>
              {step === 0 && (
                <TierSelection 
                  onSelectTier={handleTierSelect}
                  onBack={null}
                />
              )}

              {step === 1 && userTier && (
                <JobInput onSubmit={handleJobSubmit} onBack={() => setStep(0)} />
              )}

              {step === 2 && jobData && (
                <CVUpload 
                  jobData={jobData} 
                  onAnalyze={handleCVAnalysis}
                  onBack={() => setStep(1)}
                />
              )}

              {step === 3 && analysis && (
                <AnalysisResults 
                  analysis={analysis}
                  jobData={jobData}
                  userTier={userTier}
                  onReset={resetAnalysis}
                  onRewrite={() => setStep(4)}
                  onImprove={() => setStep(5)}
                  onUpgrade={handleUpgradeToPremium}
                />
              )}

              {step === 4 && analysis && originalCV && (
                <CVRewriter
                  analysis={analysis}
                  jobData={jobData}
                  originalCV={originalCV}
                  structuredCV={structuredCV}
                  onBack={() => setStep(3)}
                />
              )}

              {step === 5 && analysis && originalCV && (
                <CVImprovement
                  analysis={analysis}
                  jobData={jobData}
                  originalCV={originalCV}
                  onComplete={(improvedCV) => {
                    setOriginalCV(improvedCV);
                    setStep(3);
                  }}
                  onBack={() => setStep(3)}
                />
              )}

              {step === 6 && (
                <CVBuilder
                  jobData={jobData}
                  onComplete={handleCVBuilt}
                  onBack={() => setStep(0)}
                />
              )}
            </>
          )}

          {/* Footer */}
          <footer className="text-center mt-12 sm:mt-16 pb-6 sm:pb-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-orange-200">
              <div className="max-w-2xl mx-auto">
                <p className="text-gray-700 font-semibold text-sm sm:text-base mb-2">Dual-Brain AI Technology</p>
                <p className="text-gray-600 text-xs sm:text-sm mb-3">ATS-Optimized + Recruiter-Friendly Analysis</p>
                <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-black mx-auto rounded-full"></div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}