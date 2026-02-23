import React from 'react'

const RightSidebar: React.FC = () => {
  return (
    <div className="w-80 bg-gradient-to-b from-orange-50 to-pink-50 h-screen sticky top-0 overflow-y-auto border-l border-orange-100">
      <div className="p-6">
        
        {/* Reading Progress */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">📖</span>
            Reading Progress
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl border border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-800">The Great Gatsby</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">75%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-100 to-green-50 rounded-xl border border-green-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-800">1984</span>
                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">45%</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">⭐</span>
            Recent Reviews
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="flex items-center mb-2">
                <span className="text-yellow-500 text-lg">★★★★★</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">To Kill a Mockingbird</p>
              <p className="text-xs text-gray-600 mt-2 italic">"Amazing story about justice..."</p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="flex items-center mb-2">
                <span className="text-yellow-500 text-lg">★★★★☆</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">Pride and Prejudice</p>
              <p className="text-xs text-gray-600 mt-2 italic">"Classic romance, well written..."</p>
            </div>
          </div>
        </div>

        {/* Top Picks */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">🔥</span>
            Top Picks
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-100 to-yellow-50 rounded-xl border border-orange-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="text-3xl">📚</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Atomic Habits</p>
                <p className="text-xs text-gray-600">Self-help</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-100 to-pink-50 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="text-3xl">📖</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">The Alchemist</p>
                <p className="text-xs text-gray-600">Fiction</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-100 to-blue-50 rounded-xl border border-green-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="text-3xl">📘</div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Sapiens</p>
                <p className="text-xs text-gray-600">History</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default RightSidebar
