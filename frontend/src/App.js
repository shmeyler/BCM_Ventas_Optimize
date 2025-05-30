import React, { useState } from 'react';
import './App.css';
import { motion } from 'framer-motion';
import Components from './components';

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

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // Start on dashboard for testing
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Start logged in for testing
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
        />
        
        <LoginModal 
          showModal={showLoginModal}
          setShowModal={setShowLoginModal}
          onLogin={handleLogin}
        />
        
        {currentView === 'home' && !isLoggedIn && (
          <>
            <HeroSection setCurrentView={setCurrentView} />
            <ProcessSection />
            <CaseStudies />
            <FinalCTA />
          </>
        )}
        
        {currentView === 'dashboard' && isLoggedIn && (
          <GeoTestingDashboard 
            testData={testData}
            setTestData={setTestData}
            setCurrentView={setCurrentView}
          />
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