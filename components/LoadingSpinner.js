export default function LoadingSpinner() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Analyzing Your CV...
        </h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
            Running ATS simulation
          </div>
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse animation-delay-200"></div>
            Simulating recruiter behavior
          </div>
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 bg-purple-600 rounded-full mr-2 animate-pulse animation-delay-400"></div>
            Analyzing bullet points
          </div>
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 bg-orange-600 rounded-full mr-2 animate-pulse animation-delay-600"></div>
            Generating recommendations
          </div>
        </div>
        
        <p className="text-gray-500 mt-6">
          This usually takes 30-60 seconds...
        </p>
      </div>
    </div>
  );
}