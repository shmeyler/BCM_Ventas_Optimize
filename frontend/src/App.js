import React, { useState } from 'react';
import './App.css';
import { motion } from 'framer-motion';
import Components from './components';
import EnhancedComponents from './enhanced_components';

const {
  Header,
  LoginModal,
  HeroSection,
  GeoTestingDashboard,
  TestSetupWizard,
  LiveAnalytics,
  AttributionModeling,
  ResultsAnalysis,
  KnowledgeBase,
  ProcessSection,
  CaseStudies,
  FinalCTA
} = Components;

const {
  Enhanced5StepWorkflow,
  EnhancedGeoTestingDashboard
} = EnhancedComponents;

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // Start on dashboard for testing
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Start logged in for testing
  const [useEnhancedMode, setUseEnhancedMode] = useState(true); // Default to enhanced mode
  const [selectedCampaignData, setSelectedCampaignData] = useState(null); // Meta campaign data for enhanced mode
  const [testData, setTestData] = useState({
    selectedRegions: [],
    testConfiguration: {},
    liveResults: {}
  });

  const handleLogin = (credentials) => {
    // Accept any credentials for now
    setIsLoggedIn(true);
    setShowLoginModal(false);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('home');
  };

  const toggleEnhancedMode = () => {
    setUseEnhancedMode(!useEnhancedMode);
  };

  return (
    <div className="App bg-gray-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Header 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          setShowLoginModal={setShowLoginModal}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          selectedCampaignData={selectedCampaignData}
          setSelectedCampaignData={setSelectedCampaignData}
        />
        
        <LoginModal 
          showModal={showLoginModal}
          setShowModal={setShowLoginModal}
          onLogin={handleLogin}
        />
        
        {/* Enhanced Mode Toggle (for demo purposes) */}
        {isLoggedIn && currentView === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    🚀 Enhanced Mode {useEnhancedMode ? 'Active' : 'Available'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {useEnhancedMode 
                      ? 'Enterprise-level 5-step workflow with statistical matching and Meta integration'
                      : 'Switch to enhanced mode for advanced geo-incrementality testing features'
                    }
                  </p>
                </div>
                <button
                  onClick={toggleEnhancedMode}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    useEnhancedMode
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {useEnhancedMode ? 'Switch to Classic' : 'Try Enhanced Mode'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {currentView === 'home' && !isLoggedIn && (
          <>
            <HeroSection setCurrentView={setCurrentView} />
            <ProcessSection />
            <CaseStudies />
            <FinalCTA />
          </>
        )}
        
        {currentView === 'dashboard' && isLoggedIn && (
          useEnhancedMode ? (
            <EnhancedGeoTestingDashboard 
              testData={testData}
              setTestData={setTestData}
              setCurrentView={setCurrentView}
              selectedCampaignData={selectedCampaignData}
              setSelectedCampaignData={setSelectedCampaignData}
            />
          ) : (
            <GeoTestingDashboard 
              testData={testData}
              setTestData={setTestData}
              setCurrentView={setCurrentView}
            />
          )
        )}
        
        {currentView === 'setup' && isLoggedIn && (
          <TestSetupWizard 
            testData={testData}
            setTestData={setTestData}
            setCurrentView={setCurrentView}
          />
        )}
        
        {currentView === 'analytics' && (
          <LiveAnalytics 
            testData={testData}
            setCurrentView={setCurrentView}
          />
        )}
        
        {currentView === 'attribution' && isLoggedIn && (
          <AttributionModeling 
            testData={testData}
          />
        )}
        
        {currentView === 'results' && isLoggedIn && (
          <ResultsAnalysis 
            testData={testData}
          />
        )}
        
        {currentView === 'resources' && (
          <KnowledgeBase />
        )}
      </motion.div>
    </div>
  );
}

export default App;