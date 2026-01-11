import { useState } from 'react';
import Head from 'next/head';
import JobInput from '../components/JobInput';
import CVUpload from '../components/CVUpload';
import AnalysisResults from '../components/AnalysisResults';
import CVRewriter from '../components/CVRewriter';
import CVBuilder from '../components/CVBuilder';
import CVImprovement from '../components/CVImprovement';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [step, setStep] = useState(0); // Start at 0 for menu
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [originalCV, setOriginalCV] = useState(null);
  const [structuredCV, setStructuredCV] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze-cv`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error || 'Analysis failed');
      }

      // Use extracted text from backend instead of reading file directly
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
    setStep(0);
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

      <div className="min-h-screen bg-white" style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.02) 24px, rgba(0,0,0,0.02) 25px)'}}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <header className="text-center mb-4 sm:mb-8 relative">
            <div className="absolute inset-0 border-b border-gray-100"></div>
            <div className="relative bg-white pb-4 sm:pb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mb-3 sm:mb-6">
                <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                CV Reviewer
              </h1>
              <p className="text-xs sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                The only CV tool that thinks like both <span className="font-semibold text-orange-600">ATS systems</span> and <span className="font-semibold text-orange-600">human recruiters</span>
              </p>
              <div className="flex flex-col sm:flex-row justify-center mt-3 sm:mt-6 space-y-1 sm:space-y-0 sm:space-x-8 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full mr-2"></div>
                  Dual-Brain Analysis
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full mr-2"></div>
                  85%+ Success Rate
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full mr-2"></div>
                  AI-Powered Insights
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
                  Home
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
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-6 sm:mb-12 relative">
                    <div className="absolute inset-0 border-b border-gray-100"></div>
                    <div className="relative bg-white pb-6">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4">Choose Your Path</h2>
                      <p className="text-gray-600 text-lg">Select how you'd like to get started</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-16 px-4">
                    <div 
                      onClick={() => setStep(1)}
                      className="group relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-3 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-orange-300"
                      style={{borderTop: '3px solid #ea580c'}}
                    >
                      <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-orange-600">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-3">Analyze Existing CV</h3>
                        <div className="w-12 h-0.5 bg-orange-300 mb-4"></div>
                        <p className="text-gray-600 leading-relaxed mb-6 text-xs sm:text-sm">Upload your current CV and get detailed feedback from our dual-brain AI system</p>
                        <div className="flex items-center text-orange-600 font-medium">
                          <span>Get started</span>
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setStep(6)}
                      className="group relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-3 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-orange-300"
                      style={{borderTop: '3px solid #ea580c'}}
                    >
                      <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-orange-600">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                        </div>
                        <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-3">Create New CV</h3>
                        <div className="w-12 h-0.5 bg-orange-300 mb-4"></div>
                        <p className="text-gray-600 leading-relaxed mb-6 text-xs sm:text-sm">Choose from professional templates and build your CV with guided assistance</p>
                        <div className="flex items-center text-orange-600 font-medium">
                          <span>Choose template</span>
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Features Section */}
                  <div className="relative">
                    <div className="absolute inset-0 border-t border-gray-100"></div>
                    <div className="relative bg-white pt-4 sm:pt-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                        <div className="text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">ATS Brain</h4>
                          <div className="w-8 h-0.5 bg-orange-300 mx-auto mb-3"></div>
                          <p className="text-gray-600 text-xs">Simulates how ATS systems parse and rank your CV</p>
                        </div>
                        
                        <div className="text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Recruiter Brain</h4>
                          <div className="w-8 h-0.5 bg-orange-300 mx-auto mb-3"></div>
                          <p className="text-gray-600 text-xs">Mimics human recruiter scanning patterns and decisions</p>
                        </div>
                        
                        <div className="text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">AI Intelligence</h4>
                          <div className="w-8 h-0.5 bg-orange-300 mx-auto mb-3"></div>
                          <p className="text-gray-600 text-xs">Advanced analysis with actionable improvement suggestions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
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
                  onReset={resetAnalysis}
                  onRewrite={() => setStep(4)}
                  onImprove={() => setStep(5)}
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
                    setStep(3); // Go back to analysis with improved CV
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
          <footer className="text-center mt-8 sm:mt-20 pb-4 sm:pb-8 relative">
            <div className="absolute inset-0 border-t border-gray-100"></div>
            <div className="relative bg-white pt-4 sm:pt-8">
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-center items-center space-x-1 sm:space-x-2 mb-2 sm:mb-4">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm">Built with dual-brain AI technology • ATS + Recruiter simulation</p>
                <div className="w-12 sm:w-16 h-0.5 bg-orange-300 mx-auto mt-2 sm:mt-3 mb-1 sm:mb-2"></div>
                <p className="text-gray-400 text-xs">Helping job seekers win interviews since 2024</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}