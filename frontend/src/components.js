import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  MapPinIcon, 
  ChartBarIcon, 
  CogIcon, 
  PlayIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  PresentationChartLineIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';

// Mock data for various components
const mockRegions = [
  { id: 'ca', name: 'California', population: '39.5M', selected: false, type: null },
  { id: 'ny', name: 'New York', population: '19.5M', selected: false, type: null },
  { id: 'tx', name: 'Texas', population: '29.7M', selected: false, type: null },
  { id: 'fl', name: 'Florida', population: '21.8M', selected: false, type: null },
  { id: 'il', name: 'Illinois', population: '12.6M', selected: false, type: null },
  { id: 'pa', name: 'Pennsylvania', population: '12.8M', selected: false, type: null }
];

const mockTestResults = [
  { date: '2024-01-01', testGroup: 4200, controlGroup: 3800, lift: 10.5 },
  { date: '2024-01-02', testGroup: 4400, controlGroup: 3750, lift: 17.3 },
  { date: '2024-01-03', testGroup: 4600, controlGroup: 3900, lift: 17.9 },
  { date: '2024-01-04', testGroup: 4800, controlGroup: 4000, lift: 20.0 },
  { date: '2024-01-05', testGroup: 5200, controlGroup: 4100, lift: 26.8 },
  { date: '2024-01-06', testGroup: 5400, controlGroup: 4200, lift: 28.6 },
  { date: '2024-01-07', testGroup: 5600, controlGroup: 4300, lift: 30.2 }
];

const mockAttributionData = [
  { channel: 'Meta Ads', attribution: 35, incrementality: 28, difference: -7 },
  { channel: 'Google Ads', attribution: 25, incrementality: 32, difference: 7 },
  { channel: 'TikTok Ads', attribution: 15, incrementality: 18, difference: 3 },
  { channel: 'YouTube Ads', attribution: 12, incrementality: 15, difference: 3 },
  { channel: 'Email', attribution: 8, incrementality: 5, difference: -3 },
  { channel: 'Organic', attribution: 5, incrementality: 2, difference: -3 }
];

// Header Component
const Header = ({ currentView, setCurrentView }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-xl font-bold text-gray-900">WorkMagic</span>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'dashboard' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Platform
              </button>
              <button 
                onClick={() => setCurrentView('analytics')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'analytics' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Analytics
              </button>
              <span className="text-gray-600 text-sm font-medium">Success Stories</span>
              <span className="text-gray-600 text-sm font-medium">Resources</span>
              <span className="text-gray-600 text-sm font-medium">About Us</span>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Login
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Request a demo
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Hero Section Component
const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Geo Incrementality Testing
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
          >
            WorkMagic's Geo Incrementality Testing empowers brands to launch regional holdout tests 
            automatically within the platform, revealing the actual lift generated by every marketing effort.
          </motion.p>
          
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            Start Free Test
          </motion.button>
          
          <div className="mt-16">
            <img 
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx3b3JsZCUyMG1hcCUyMGFuYWx5dGljc3xlbnwwfHx8fDE3NDg2MTE5MjB8MA&ixlib=rb-4.1.0&q=85"
              alt="Global Analytics"
              className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Geo Testing Dashboard Component
const GeoTestingDashboard = ({ testData, setTestData, setCurrentView }) => {
  const [regions, setRegions] = useState(mockRegions);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const selectRegion = (regionId, type) => {
    setRegions(prev => prev.map(region => 
      region.id === regionId 
        ? { ...region, selected: true, type }
        : region
    ));
  };

  const startTest = () => {
    setIsTestRunning(true);
    setCurrentView('analytics');
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Interactive Geo-Testing Dashboard
          </h2>
          <p className="text-xl text-gray-600">
            Select test and control regions to configure your incrementality experiment
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Region Selection */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Test Regions</h3>
            
            <div className="space-y-4 mb-8">
              {regions.map((region) => (
                <div key={region.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <h4 className="font-semibold text-gray-900">{region.name}</h4>
                    <p className="text-sm text-gray-600">Population: {region.population}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => selectRegion(region.id, 'test')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        region.type === 'test'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
                      }`}
                    >
                      Test
                    </button>
                    <button
                      onClick={() => selectRegion(region.id, 'control')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        region.type === 'control'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                      }`}
                    >
                      Control
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('setup')}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Configure Test
              </button>
              <button
                onClick={startTest}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Test
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Test Configuration Preview</h3>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Test Regions</h4>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {regions.filter(r => r.type === 'test').length} selected
                  </span>
                </div>
                <div className="space-y-2">
                  {regions.filter(r => r.type === 'test').map(region => (
                    <div key={region.id} className="flex justify-between text-sm">
                      <span>{region.name}</span>
                      <span className="text-gray-600">{region.population}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Control Regions</h4>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {regions.filter(r => r.type === 'control').length} selected
                  </span>
                </div>
                <div className="space-y-2">
                  {regions.filter(r => r.type === 'control').map(region => (
                    <div key={region.id} className="flex justify-between text-sm">
                      <span>{region.name}</span>
                      <span className="text-gray-600">{region.population}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Estimated Test Power</h4>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">85% statistical power detected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Test Setup Wizard Component
const TestSetupWizard = ({ testData, setTestData, setCurrentView }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    testName: '',
    duration: '14',
    budget: '10000',
    channels: [],
    objective: 'sales'
  });

  const steps = [
    { id: 1, title: 'Test Configuration', icon: CogIcon },
    { id: 2, title: 'Channel Selection', icon: ChartBarIcon },
    { id: 3, title: 'Budget Allocation', icon: DocumentChartBarIcon },
    { id: 4, title: 'Review & Launch', icon: PlayIcon }
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentView('analytics');
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Test Setup Wizard</h2>
          <p className="text-xl text-gray-600">Configure your geo-incrementality test in 4 simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                currentStep >= step.id ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <step.icon className="w-6 h-6" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700">{step.title}</span>
              {index < steps.length - 1 && (
                <div className={`w-24 h-1 mt-4 ${
                  currentStep > step.id ? 'bg-purple-600' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Test Configuration</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Name</label>
                  <input
                    type="text"
                    value={formData.testName}
                    onChange={(e) => setFormData({...formData, testName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Q1 2024 Meta Ads Test"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="21">21 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Channel Selection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['Meta Ads', 'Google Ads', 'TikTok Ads', 'YouTube Ads', 'Email', 'SMS'].map((channel) => (
                  <label key={channel} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, channels: [...formData.channels, channel]});
                        } else {
                          setFormData({...formData, channels: formData.channels.filter(c => c !== channel)});
                        }
                      }}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">{channel}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Budget Allocation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Test Budget</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="10000"
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Budget will be automatically allocated across selected channels based on historical performance.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Review & Launch</h3>
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Test Name:</span>
                  <span>{formData.testName || 'Q1 2024 Meta Ads Test'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Duration:</span>
                  <span>{formData.duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Budget:</span>
                  <span>${parseInt(formData.budget).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Channels:</span>
                  <span>{formData.channels.length} selected</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setCurrentView('dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {currentStep === 1 ? 'Back to Dashboard' : 'Previous'}
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              {currentStep === 4 ? 'Launch Test' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Live Analytics Component
const LiveAnalytics = ({ testData, setCurrentView }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        // Simulate live data updates
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Live Analytics Dashboard</h2>
            <p className="text-xl text-gray-600">Real-time incrementality test performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">{isLive ? 'Live' : 'Paused'}</span>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="1d">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-600">Incremental Lift</h3>
              <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">+28.6%</p>
            <p className="text-sm text-blue-700">vs control group</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-600">Test ROAS</h3>
              <ChartBarIcon className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">4.2x</p>
            <p className="text-sm text-green-700">return on ad spend</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-purple-600">Statistical Confidence</h3>
              <CheckCircleIcon className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">95%</p>
            <p className="text-sm text-purple-700">confidence level</p>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-orange-600">Incremental Revenue</h3>
              <PresentationChartLineIcon className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900">$124K</p>
            <p className="text-sm text-orange-700">additional revenue</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Incrementality Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTestResults}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="testGroup" stroke="#3B82F6" strokeWidth={3} name="Test Group" />
                <Line type="monotone" dataKey="controlGroup" stroke="#10B981" strokeWidth={3} name="Control Group" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Lift Percentage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockTestResults}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="lift" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setCurrentView('attribution')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            View Attribution Analysis
          </button>
          <button
            onClick={() => setCurrentView('results')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>
    </section>
  );
};

// Attribution Modeling Component
const AttributionModeling = ({ testData }) => {
  return (
    <section className="py-16 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Smart Attribution Analysis</h2>
          <p className="text-xl text-purple-200">Compare last-click attribution vs. incrementality-based attribution</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">Attribution Comparison</h3>
            <div className="space-y-4">
              {mockAttributionData.map((channel, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{channel.channel}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      channel.difference > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {channel.difference > 0 ? '+' : ''}{channel.difference}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-purple-300">Last-click: {channel.attribution}%</p>
                      <div className="w-full bg-purple-800 rounded-full h-2 mt-1">
                        <div className="bg-purple-400 h-2 rounded-full" style={{width: `${channel.attribution}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-blue-300">Incrementality: {channel.incrementality}%</p>
                      <div className="w-full bg-blue-800 rounded-full h-2 mt-1">
                        <div className="bg-blue-400 h-2 rounded-full" style={{width: `${channel.incrementality}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">Attribution Insights</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={mockAttributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                <XAxis dataKey="channel" stroke="white" />
                <YAxis stroke="white" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="attribution" fill="#A855F7" name="Last-click Attribution" />
                <Bar dataKey="incrementality" fill="#3B82F6" name="Incrementality-based" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Key Findings</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-green-400">+$89K</p>
                <p className="text-purple-200">Incremental revenue identified</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-400">23%</p>
                <p className="text-purple-200">Attribution adjustment</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-400">$2.1M</p>
                <p className="text-purple-200">Annual revenue impact</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Results Analysis Component
const ResultsAnalysis = ({ testData }) => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Test Results & Recommendations</h2>
          <p className="text-xl text-gray-600">Comprehensive analysis and actionable insights</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Executive Summary</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Test Successful</p>
                    <p className="text-gray-600">Achieved 95% statistical confidence with 28.6% incremental lift</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Strong Performance</p>
                    <p className="text-gray-600">Test group outperformed control by $124K in additional revenue</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <PresentationChartLineIcon className="w-6 h-6 text-purple-500 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Attribution Insights</p>
                    <p className="text-gray-600">Significant differences found between last-click and incrementality attribution</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxkYXRhJTIwZGFzaGJvYXJkfGVufDB8fHx8MTc0ODYxMTkyNHww&ixlib=rb-4.1.0&q=85"
                alt="Results Dashboard"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800">Scale Successful Channels</h4>
                <p className="text-sm text-green-700">Increase budget for Google Ads and TikTok Ads based on strong incrementality</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800">Optimize Meta Ads</h4>
                <p className="text-sm text-yellow-700">Attribution shows overvaluation. Implement incremental bidding strategies</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800">Expand Testing</h4>
                <p className="text-sm text-blue-700">Run follow-up tests in additional regions to validate findings</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h3>
            <div className="space-y-3">
              {[
                'Implement recommended budget changes',
                'Set up continuous incrementality monitoring',
                'Schedule monthly attribution recalibration',
                'Expand testing to new geographic markets',
                'Integrate findings with MMM model'
              ].map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Export Options</h3>
            <div className="space-y-3">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors">
                Download Full Report
              </button>
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors">
                Export to CSV
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors">
                Share with Team
              </button>
              <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Schedule Presentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Process Section Component
const ProcessSection = () => {
  const steps = [
    {
      title: 'Connect accounts',
      description: 'Link your advertising accounts and data sources',
      time: '10-20 minutes',
      icon: '🔗'
    },
    {
      title: 'Schedule incrementality test',
      description: 'Configure test parameters and select regions',
      time: '24-48 hours',
      icon: '📅'
    },
    {
      title: 'Run and monitor',
      description: 'Track test performance in real-time',
      time: 'Test duration',
      icon: '📊'
    },
    {
      title: 'Review results',
      description: 'Analyze insights and calibrate attribution',
      time: 'Ongoing',
      icon: '✅'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How does WorkMagic work</h2>
          <p className="text-xl text-gray-600">Get started with geo-incrementality testing in minutes</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 mb-2">{step.description}</p>
              <span className="text-sm text-purple-600 font-medium">{step.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Case Studies Component
const CaseStudies = () => {
  const caseStudies = [
    {
      title: 'True Classic achieved 45% ROAS improvement',
      description: 'Using geo-incrementality testing to optimize TikTok ad spend',
      image: 'https://images.pexels.com/photos/6772077/pexels-photo-6772077.jpeg',
      metric: '+45% ROAS',
      channel: 'TikTok Ads'
    },
    {
      title: 'Branch Furniture increased revenue by 113%',
      description: 'Incrementality-based attribution revealed Meta ads true impact',
      image: 'https://images.pexels.com/photos/590045/pexels-photo-590045.jpeg',
      metric: '+113% Revenue',
      channel: 'Meta Ads'
    },
    {
      title: 'YouTube ads cross-platform measurement',
      description: 'Measuring YouTube impact across Shopify and Amazon',
      image: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxkYXRhJTIwdmlzdWFsaXphdGlvbiUyMGNoYXJ0c3xlbnwwfHx8fDE3NDg2MTE5Mjh8MA&ixlib=rb-4.1.0&q=85',
      metric: '+28% Lift',
      channel: 'YouTube Ads'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
          <p className="text-xl text-gray-600">See how brands are winning with incrementality testing</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {caseStudies.map((study, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <img 
                src={study.image}
                alt={study.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {study.channel}
                  </span>
                  <span className="text-2xl font-bold text-green-600">{study.metric}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{study.title}</h3>
                <p className="text-gray-600">{study.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Final CTA Component
const FinalCTA = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-600 to-purple-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Upgrade your measurement with WorkMagic
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Start your first geo-incrementality test today and discover your true marketing impact
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Book a Demo
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors">
              Start Free Trial
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Export all components
const Components = {
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
};

export default Components;