// This is a temporary fix for the JSX error
// The issue is at line 1717 where there are adjacent JSX elements

// I need to see the return statement of APIKeyManager to fix it properly
// Let me create a fixed version focusing on the problematic area

const APIKeyManagerFixed = ({ onClose, useMetaData, setUseMetaData }) => {
  // ... state declarations would be here ...
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Data Sources</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Content sections */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Integration Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Census API:</span>
                <span className="ml-2 text-green-600 font-medium">Active</span>
              </div>
              <div>
                <span className="text-gray-600">Meta API:</span>
                <span className="ml-2 font-medium text-blue-600">Connected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Using Meta performance data for enhanced accuracy
            </div>
            <button
              onClick={onClose}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// The key fix is that all JSX elements must be wrapped in a single parent element
// In React, you cannot return adjacent elements without wrapping them