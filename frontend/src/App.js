import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Components from './components';

const {
  Header,
  HeroSection,
  GeoTestingDashboard,
  TestSetupWizard,
  LiveAnalytics,
  AttributionModeling,
  ResultsAnalysis,
  ProcessSection,
  CaseStudies,
  FinalCTA
} = Components;

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [testData, setTestData] = useState({
    selectedRegions: [],
    testConfiguration: {},
    liveResults: {}
  });

  return (
    <div className="App bg-gray-50 min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Header currentView={currentView} setCurrentView={setCurrentView} />
                <HeroSection />
                
                {currentView === 'dashboard' && (
                  <GeoTestingDashboard 
                    testData={testData}
                    setTestData={setTestData}
                    setCurrentView={setCurrentView}
                  />
                )}
                
                {currentView === 'setup' && (
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
                
                {currentView === 'attribution' && (
                  <AttributionModeling 
                    testData={testData}
                  />
                )}
                
                {currentView === 'results' && (
                  <ResultsAnalysis 
                    testData={testData}
                  />
                )}
                
                <ProcessSection />
                <CaseStudies />
                <FinalCTA />
              </motion.div>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;