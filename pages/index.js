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
  const [jobData, setJobData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [originalCV, setOriginalCV] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cvTemplates = [
    {
      id: 'ats-standard',
      name: 'ATS Standard',
      description: 'Clean, centered layout optimized for ATS systems',
      preview: (
        <div className="bg-white w-full h-full p-3 text-xs overflow-hidden border rounded">
          <div className="text-center">
            <div className="font-bold text-sm mb-1">JOHN SMITH</div>
            <div className="text-gray-600 mb-2">email@example.com | (555) 123-4567 | linkedin.com/in/johnsmith</div>
            <div className="border-t border-gray-400 my-3"></div>
            <div className="font-medium mb-2">PROFESSIONAL SUMMARY</div>
            <div className="text-gray-700 mb-3 text-xs">Experienced professional with proven track record...</div>
            <div className="border-t border-gray-400 my-3"></div>
            <div className="font-medium mb-2">SKILLS</div>
            <div className="text-gray-700 mb-3">JavaScript, Python, React, Node.js, SQL</div>
            <div className="border-t border-gray-400 my-3"></div>
            <div className="font-medium mb-2">EXPERIENCE</div>
            <div className="text-gray-700 mb-1">Senior Developer</div>
            <div className="text-gray-600 mb-2">Tech Company | 2020-Present</div>
            <div className="text-gray-700">• Led development of web applications</div>
            <div className="text-gray-700">• Improved system performance by 40%</div>
          </div>
        </div>
      ),
      icon: '📄'
    },
    {
      id: 'tech-professional',
      name: 'Tech Professional',
      description: 'Technical roles with skills-first approach',
      preview: (
        <div className="bg-white w-full h-full p-3 text-xs overflow-hidden border rounded">
          <div className="text-left">
            <div className="font-bold text-lg mb-1">JANE DOE</div>
            <div className="text-gray-600 mb-3">jane@example.com | github.com/jane | portfolio.com</div>
            <div className="bg-gray-100 p-2 mb-3 rounded">
              <div className="font-medium mb-1">TECHNICAL SKILLS</div>
              <div className="text-gray-700">React, Node.js, Python, AWS, Docker, MongoDB</div>
            </div>
            <div className="font-medium mb-1 text-blue-600">FEATURED PROJECTS</div>
            <div className="border-l-2 border-blue-600 pl-2 mb-3">
              <div className="text-gray-700 mb-1">• E-commerce Platform - React/Node.js</div>
              <div className="text-gray-700 mb-1">• API Gateway - Python/FastAPI</div>
              <div className="text-gray-700">• Mobile App - React Native</div>
            </div>
            <div className="font-medium mb-1">EXPERIENCE</div>
            <div className="text-gray-700">Full Stack Developer</div>
          </div>
        </div>
      ),
      icon: '💻'
    },
    {
      id: 'executive-modern',
      name: 'Executive Modern',
      description: 'Senior roles with leadership focus',
      preview: (
        <div className="bg-white w-full h-full p-3 text-xs overflow-hidden border rounded">
          <div className="text-left">
            <div className="bg-gray-900 text-white p-2 mb-3 rounded">
              <div className="font-bold text-lg">ALEX JOHNSON</div>
              <div className="text-gray-300">VP of Engineering</div>
            </div>
            <div className="text-gray-600 mb-3">alex@example.com | (555) 987-6543 | linkedin.com/in/alex</div>
            <div className="font-medium mb-1 text-orange-600">EXECUTIVE SUMMARY</div>
            <div className="text-gray-700 mb-3 text-xs">Strategic leader with 15+ years driving growth...</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-orange-50 p-2 rounded text-center">
                <div className="font-bold text-orange-600">50+</div>
                <div className="text-xs">Team Size</div>
              </div>
              <div className="bg-orange-50 p-2 rounded text-center">
                <div className="font-bold text-orange-600">$2M</div>
                <div className="text-xs">Revenue Growth</div>
              </div>
            </div>
            <div className="font-medium mb-1">LEADERSHIP EXPERIENCE</div>
            <div className="text-gray-700">VP of Engineering</div>
          </div>
        </div>
      ),
      icon: '👔'
    },
    {
      id: 'creative-minimal',
      name: 'Creative Minimal',
      description: 'Creative roles with portfolio emphasis',
      preview: (
        <div className="bg-white w-full h-full p-3 text-xs overflow-hidden border rounded">
          <div className="text-left">
            <div className="border-l-4 border-purple-500 pl-3 mb-3">
              <div className="font-bold text-lg">SARAH WILSON</div>
              <div className="text-purple-600 font-medium">Creative Designer</div>
            </div>
            <div className="text-gray-600 mb-3">sarah@example.com | portfolio.com | behance.net/sarah</div>
            <div className="font-medium mb-1 text-purple-600">CREATIVE VISION</div>
            <div className="text-gray-700 mb-3 text-xs italic">Award-winning designer with passion for innovation...</div>
            <div className="font-medium mb-1">PORTFOLIO HIGHLIGHTS</div>
            <div className="space-y-1 mb-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <div className="text-gray-700">Brand Identity - Fortune 500 Client</div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <div className="text-gray-700">UI/UX Design - Mobile App (1M+ users)</div>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <div className="text-gray-700">Web Design - E-commerce Platform</div>
              </div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="font-medium text-purple-600">CREATIVE TOOLS</div>
              <div className="text-gray-700">Figma, Adobe Creative Suite, Sketch</div>
            </div>
          </div>
        </div>
      ),
      icon: '🎨'
    },
    {
      id: 'entry-level',
      name: 'Entry Level',
      description: 'New graduates and career changers',
      preview: (
        <div className="bg-white w-full h-full p-3 text-xs overflow-hidden border rounded">
          <div className="text-center">
            <div className="font-bold text-lg mb-1">MIKE CHEN</div>
            <div className="text-gray-600 mb-3">mike@example.com | (555) 456-7890 | linkedin.com/in/mike</div>
            <div className="bg-green-50 p-2 mb-3 rounded">
              <div className="font-medium text-green-600 mb-1">CAREER OBJECTIVE</div>
              <div className="text-gray-700 text-xs">Recent CS graduate seeking software development role...</div>
            </div>
            <div className="font-medium mb-1 text-green-600">EDUCATION</div>
            <div className="border border-green-200 p-2 mb-3 rounded">
              <div className="text-gray-700 mb-1 font-medium">Bachelor of Science in Computer Science</div>
              <div className="text-gray-600">State University | May 2024</div>
              <div className="text-green-600 font-medium">GPA: 3.8/4.0</div>
            </div>
            <div className="font-medium mb-1">EXPERIENCE & PROJECTS</div>
            <div className="text-left space-y-1">
              <div className="text-gray-700">• Software Engineering Intern - TechCorp</div>
              <div className="text-gray-700">• Capstone Project - Web Application</div>
              <div className="text-gray-700">• Hackathon Winner - Mobile App</div>
            </div>
          </div>
        </div>
      ),
      icon: '🎓'
    },
    {
      id: 'consulting-finance',
      name: 'Consulting & Finance',
      description: 'Business roles with quantified results',
      preview: (
        <div className="bg-white w-full h-full p-3 text-xs overflow-hidden border rounded">
          <div className="text-left">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <div className="text-white font-bold">ED</div>
              </div>
              <div>
                <div className="font-bold text-lg">EMMA DAVIS</div>
                <div className="text-blue-600 font-medium">Senior Business Analyst</div>
              </div>
            </div>
            <div className="text-gray-600 mb-3">emma@example.com | (555) 321-0987 | linkedin.com/in/emma</div>
            <div className="font-medium mb-1">PROFESSIONAL SUMMARY</div>
            <div className="text-gray-700 mb-3 text-xs">Results-driven consultant with expertise in process optimization...</div>
            <div className="bg-blue-50 p-2 mb-3 rounded">
              <div className="font-medium text-blue-600 mb-1">KEY IMPACT METRICS</div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="font-bold text-blue-600">25%</div>
                  <div className="text-xs">Cost Reduction</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600">$5M</div>
                  <div className="text-xs">Annual Savings</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600">40%</div>
                  <div className="text-xs">Efficiency Gain</div>
                </div>
              </div>
            </div>
            <div className="font-medium mb-1">CONSULTING EXPERIENCE</div>
            <div className="text-gray-700">Senior Business Analyst</div>
          </div>
        </div>
      ),
      icon: '📊'
    }
  ];

  const handleJobSubmit = (data) => {
    setJobData(data);
    setStep(2);
  };

  const handleCVBuilt = (cvText, responses) => {
    setOriginalCV(cvText);
    // Auto-analyze the built CV
    const cvBlob = new Blob([cvText], { type: 'text/plain' });
    const cvFile = new File([cvBlob], 'built_cv.txt', { type: 'text/plain' });
    
    // Set default job data if none exists
    if (!jobData) {
      setJobData({
        role: responses.targetRole || 'Professional Role',
        company: 'Target Company',
        description: `Looking for a ${responses.targetRole || 'professional'} with skills in ${responses.keySkills || 'relevant technologies'}.`
      });
    }
    
    handleCVAnalysis(cvFile);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setStep(6); // Go to CV builder with selected template
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

      // Store original CV text
      const cvText = await cvFile.text();
      setOriginalCV(cvText);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze-cv`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error || 'Analysis failed');
      }

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <header className="text-center mb-8 sm:mb-12 relative">
            <div className="absolute inset-0 border-b border-gray-100"></div>
            <div className="relative bg-white pb-6 sm:pb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                CV Reviewer
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                The only CV tool that thinks like both <span className="font-semibold text-orange-600">ATS systems</span> and <span className="font-semibold text-orange-600">human recruiters</span>
              </p>
              <div className="flex flex-col sm:flex-row justify-center mt-4 sm:mt-6 space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Dual-Brain Analysis
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  85%+ Success Rate
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  AI-Powered Insights
                </div>
              </div>
            </div>
          </header>

          {/* Progress Indicator */}
          {step > 0 && (
            <div className="flex justify-center mb-6 sm:mb-8 px-4">
              <div className="flex items-center space-x-2 sm:space-x-4 bg-white rounded-full px-4 sm:px-6 py-3 border border-gray-200 shadow-sm">
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                  step >= 1 ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className="font-semibold text-sm sm:text-base">1</span>
                </div>
                <div className={`w-12 sm:w-20 h-0.5 transition-all duration-300 ${
                  step >= 2 ? 'bg-orange-500' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                  step >= 2 ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className="font-semibold text-sm sm:text-base">2</span>
                </div>
                <div className={`w-12 sm:w-20 h-0.5 transition-all duration-300 ${
                  step >= 3 ? 'bg-orange-500' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                  step >= 3 ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <span className="font-semibold text-sm sm:text-base">3</span>
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
                  <h3 className="text-lg font-semibold text-red-800">Analysis Error</h3>
                  <p className="text-red-700 mt-1 leading-relaxed">{error}</p>
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
                  <div className="text-center mb-12 relative">
                    <div className="absolute inset-0 border-b border-gray-100"></div>
                    <div className="relative bg-white pb-6">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Path</h2>
                      <p className="text-gray-600 text-lg">Select how you'd like to get started</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 px-4">
                    <div 
                      onClick={() => setStep(1)}
                      className="group relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-orange-300"
                      style={{borderTop: '3px solid #ea580c'}}
                    >
                      <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-orange-600">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Analyze Existing CV</h3>
                        <div className="w-12 h-0.5 bg-orange-300 mb-4"></div>
                        <p className="text-gray-600 leading-relaxed mb-6">Upload your current CV and get detailed feedback from our dual-brain AI system</p>
                        <div className="flex items-center text-orange-600 font-medium">
                          <span>Get started</span>
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setStep(7)}
                      className="group relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-orange-300"
                      style={{borderTop: '3px solid #ea580c'}}
                    >
                      <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-orange-600">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Create New CV</h3>
                        <div className="w-12 h-0.5 bg-orange-300 mb-4"></div>
                        <p className="text-gray-600 leading-relaxed mb-6">Choose from professional templates and build your CV with guided assistance</p>
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
                    <div className="relative bg-white pt-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">ATS Brain</h4>
                          <div className="w-8 h-0.5 bg-orange-300 mx-auto mb-3"></div>
                          <p className="text-gray-600 text-sm">Simulates how ATS systems parse and rank your CV</p>
                        </div>
                        
                        <div className="text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Recruiter Brain</h4>
                          <div className="w-8 h-0.5 bg-orange-300 mx-auto mb-3"></div>
                          <p className="text-gray-600 text-sm">Mimics human recruiter scanning patterns and decisions</p>
                        </div>
                        
                        <div className="text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Intelligence</h4>
                          <div className="w-8 h-0.5 bg-orange-300 mx-auto mb-3"></div>
                          <p className="text-gray-600 text-sm">Advanced analysis with actionable improvement suggestions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <JobInput onSubmit={handleJobSubmit} />
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
                  selectedTemplate={selectedTemplate}
                  onComplete={handleCVBuilt}
                  onBack={() => setStep(7)}
                />
              )}

              {step === 7 && (
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your CV Template</h2>
                    <p className="text-gray-600 text-lg">Select a template optimized for your industry and role</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 px-4">
                    {cvTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-orange-300"
                      >
                        {/* Template Preview */}
                        <div className="bg-gray-50 p-2 sm:p-4 h-48 sm:h-64 flex items-center justify-center border-b">
                          <div className="w-full h-full">
                            {template.preview}
                          </div>
                        </div>
                        
                        {/* Template Info */}
                        <div className="p-4 sm:p-6">
                          <div className="flex items-center mb-3">
                            <div className="text-2xl mr-3">{template.icon}</div>
                            <h3 className="text-lg font-bold text-gray-900">{template.name}</h3>
                          </div>
                          <div className="w-8 h-0.5 bg-orange-300 mb-3"></div>
                          <p className="text-gray-600 text-sm mb-3">{template.description}</p>
                          <div className="flex items-center text-orange-600 font-medium text-sm">
                            <span>Select template</span>
                            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => setStep(0)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      ← Back to main menu
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <footer className="text-center mt-20 pb-8 relative">
            <div className="absolute inset-0 border-t border-gray-100"></div>
            <div className="relative bg-white pt-8">
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-center items-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <p className="text-gray-500 text-sm">Built with dual-brain AI technology • ATS + Recruiter simulation</p>
                <div className="w-16 h-0.5 bg-orange-300 mx-auto mt-3 mb-2"></div>
                <p className="text-gray-400 text-xs">Helping job seekers win interviews since 2024</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}