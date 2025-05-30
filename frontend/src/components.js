import React, { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import DemographicMatchingModel from './demographic-matching-model';
import RealAPIService from './real-api-service';
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
  DocumentChartBarIcon,
  XMarkIcon,
  UserIcon,
  LockClosedIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  MapIcon,
  BuildingOfficeIcon,
  HomeIcon,
  KeyIcon,
  CloudIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
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

// Mock ZIP code data with demographics
const mockZipCodes = [
  { 
    id: '10001', 
    name: 'New York, NY 10001', 
    population: '21,102', 
    medianIncome: '$67,000',
    avgAge: '34.2',
    density: 'High',
    selected: false, 
    type: null,
    demographics: { urban: 95, suburban: 5, rural: 0 },
    similarity: 0.95
  },
  { 
    id: '90210', 
    name: 'Beverly Hills, CA 90210', 
    population: '23,040', 
    medianIncome: '$125,000',
    avgAge: '45.1',
    density: 'High',
    selected: false, 
    type: null,
    demographics: { urban: 85, suburban: 15, rural: 0 },
    similarity: 0.92
  },
  { 
    id: '60601', 
    name: 'Chicago, IL 60601', 
    population: '18,500', 
    medianIncome: '$72,000',
    avgAge: '32.8',
    density: 'High',
    selected: false, 
    type: null,
    demographics: { urban: 90, suburban: 10, rural: 0 },
    similarity: 0.88
  },
  { 
    id: '33101', 
    name: 'Miami Beach, FL 33101', 
    population: '12,900', 
    medianIncome: '$58,000',
    avgAge: '38.5',
    density: 'High',
    selected: false, 
    type: null,
    demographics: { urban: 80, suburban: 20, rural: 0 },
    similarity: 0.85
  },
  { 
    id: '75201', 
    name: 'Dallas, TX 75201', 
    population: '15,600', 
    medianIncome: '$65,000',
    avgAge: '31.2',
    density: 'High',
    selected: false, 
    type: null,
    demographics: { urban: 88, suburban: 12, rural: 0 },
    similarity: 0.90
  },
  { 
    id: '19101', 
    name: 'Philadelphia, PA 19101', 
    population: '17,800', 
    medianIncome: '$61,000',
    avgAge: '33.7',
    density: 'High',
    selected: false, 
    type: null,
    demographics: { urban: 92, suburban: 8, rural: 0 },
    similarity: 0.87
  }
];

// Mock DMA data with market characteristics
const mockDMAs = [
  { 
    id: 'dma-501', 
    name: 'New York, NY DMA', 
    population: '7.4M', 
    households: '2.8M',
    medianIncome: '$73,000',
    tvHouseholds: '2.6M',
    selected: false, 
    type: null,
    characteristics: { 
      competitiveness: 'High', 
      digitalAdoption: 'Very High',
      retailDensity: 'High'
    },
    similarity: 0.94
  },
  { 
    id: 'dma-803', 
    name: 'Los Angeles, CA DMA', 
    population: '5.2M', 
    households: '1.9M',
    medianIncome: '$68,000',
    tvHouseholds: '1.8M',
    selected: false, 
    type: null,
    characteristics: { 
      competitiveness: 'Very High', 
      digitalAdoption: 'High',
      retailDensity: 'High'
    },
    similarity: 0.91
  },
  { 
    id: 'dma-602', 
    name: 'Chicago, IL DMA', 
    population: '3.5M', 
    households: '1.3M',
    medianIncome: '$64,000',
    tvHouseholds: '1.2M',
    selected: false, 
    type: null,
    characteristics: { 
      competitiveness: 'High', 
      digitalAdoption: 'High',
      retailDensity: 'Medium'
    },
    similarity: 0.88
  },
  { 
    id: 'dma-528', 
    name: 'Miami-Ft. Lauderdale, FL DMA', 
    population: '2.8M', 
    households: '1.1M',
    medianIncome: '$56,000',
    tvHouseholds: '1.0M',
    selected: false, 
    type: null,
    characteristics: { 
      competitiveness: 'Medium', 
      digitalAdoption: 'Medium',
      retailDensity: 'Medium'
    },
    similarity: 0.82
  },
  { 
    id: 'dma-623', 
    name: 'Dallas-Ft. Worth, TX DMA', 
    population: '2.9M', 
    households: '1.1M',
    medianIncome: '$61,000',
    tvHouseholds: '1.0M',
    selected: false, 
    type: null,
    characteristics: { 
      competitiveness: 'Medium', 
      digitalAdoption: 'High',
      retailDensity: 'Medium'
    },
    similarity: 0.86
  },
  { 
    id: 'dma-504', 
    name: 'Philadelphia, PA DMA', 
    population: '2.2M', 
    households: '900K',
    medianIncome: '$59,000',
    tvHouseholds: '850K',
    selected: false, 
    type: null,
    characteristics: { 
      competitiveness: 'Medium', 
      digitalAdoption: 'Medium',
      retailDensity: 'Medium'
    },
    similarity: 0.84
  }
];

// Initialize the demographic matching model and real API service
const matchingModel = new DemographicMatchingModel({
  threshold: 0.7,
  maxResults: 10
});

const realAPIService = new RealAPIService();

// Enhanced Geographic API Service with real data integration
const GeographicAPI = {
  // Get ZIP code data from real APIs with fallback
  async getZipCodeData(zipCode) {
    try {
      console.log(`📍 Fetching real data for ZIP code: ${zipCode}`);
      
      // Try real Census API first
      const realData = await realAPIService.getRealZipCodeData(zipCode);
      
      if (realData && realData.source !== 'MOCK_FALLBACK') {
        console.log(`✅ Real Census data retrieved for ${zipCode}`);
        return {
          ...realData,
          selected: false,
          type: null
        };
      }
      
      // Fallback to enhanced mock data
      console.log(`🔄 Using enhanced mock data for ${zipCode}`);
      return this.getEnhancedMockZipData(zipCode);
      
    } catch (error) {
      console.error('Error fetching ZIP code data:', error);
      return this.getEnhancedMockZipData(zipCode);
    }
  },

  // Get DMA data from real APIs with fallback
  async getDMAData(dmaId) {
    try {
      console.log(`📺 Fetching real data for DMA: ${dmaId}`);
      
      // Try premium Nielsen API if available
      const realData = await realAPIService.getPremiumDMAData(dmaId);
      
      if (realData && realData.source !== 'MOCK_FALLBACK') {
        console.log(`✅ Real Nielsen data retrieved for ${dmaId}`);
        return {
          ...realData,
          selected: false,
          type: null
        };
      }
      
      // Fallback to enhanced mock data
      console.log(`🔄 Using enhanced mock data for ${dmaId}`);
      return this.getEnhancedMockDMAData(dmaId);
      
    } catch (error) {
      console.error('Error fetching DMA data:', error);
      return this.getEnhancedMockDMAData(dmaId);
    }
  },

  // Enhanced similar regions finding with real data
  async findSimilarRegions(selectedRegion, regionType, criteria = {}) {
    try {
      console.log(`🔍 Finding similar regions for: ${selectedRegion.name}`);
      
      const {
        algorithm = 'weighted_euclidean',
        customWeights = {},
        minSimilarity = 0.7,
        maxResults = 5,
        includeValidation = true
      } = criteria;
      
      // Get enhanced demographic data if we have real APIs
      let enhancedRegion = selectedRegion;
      if (regionType === 'zip') {
        try {
          const realData = await realAPIService.getEnhancedDemographics(selectedRegion.id, 'zip');
          if (realData.source !== 'MOCK_FALLBACK') {
            enhancedRegion = realData;
            console.log(`📊 Enhanced demographic data loaded for ${selectedRegion.name}`);
          }
        } catch (error) {
          console.log('Using standard demographic data');
        }
      }
      
      // Map region type to data source
      const dataSource = regionType === 'zip' ? 'zipCodes' : 
                        regionType === 'dma' ? 'dmas' : 'zipCodes';
      
      // Use the advanced matching model
      const similarRegions = matchingModel.findSimilarRegions(enhancedRegion, dataSource, {
        algorithm,
        customWeights,
        minSimilarity,
        maxResults
      });
      
      // Enhance similar regions with real data if available
      const enhancedSimilarRegions = await Promise.all(
        similarRegions.map(async (region) => {
          try {
            let enhancedData = region;
            if (regionType === 'zip') {
              const realRegionData = await realAPIService.getEnhancedDemographics(region.id, 'zip');
              if (realRegionData.source !== 'MOCK_FALLBACK') {
                enhancedData = { ...region, ...realRegionData };
              }
            }
            return enhancedData;
          } catch (error) {
            return region;
          }
        })
      );
      
      // Add statistical validation if requested
      if (includeValidation && enhancedSimilarRegions.length > 0) {
        const validatedRegions = matchingModel.validateMatchSignificance(
          enhancedRegion, 
          enhancedSimilarRegions,
          {
            expectedLift: 0.15, // 15% expected lift
            alpha: 0.05,
            beta: 0.2,
            baselineConversionRate: 0.03
          }
        );
        
        console.log(`✅ Found ${validatedRegions.length} statistically validated matches`);
        return validatedRegions;
      }
      
      return enhancedSimilarRegions;
    } catch (error) {
      console.error('Error finding similar regions:', error);
      return [];
    }
  },

  // Get detailed demographic analysis
  async getDetailedAnalysis(region1, region2) {
    try {
      console.log(`📈 Generating detailed analysis for: ${region1.name} vs ${region2.name}`);
      
      const similarity = matchingModel.calculateSimilarity(region1, region2);
      const comparison = matchingModel.generateDemographicComparison(region1, region2);
      const reasons = matchingModel.generateMatchReasons(region1, region2);
      
      // Add data source quality indicators
      const dataQuality = {
        region1Source: region1.source || 'MOCK',
        region2Source: region2.source || 'MOCK',
        reliability: region1.reliability?.dataQuality || 'ESTIMATED'
      };
      
      return {
        overallSimilarity: similarity,
        detailedComparison: comparison,
        matchReasons: reasons,
        recommendationStrength: similarity > 0.8 ? 'Strong' : similarity > 0.6 ? 'Moderate' : 'Weak',
        dataQuality,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating detailed analysis:', error);
      return null;
    }
  },

  // Enhanced mock data for fallback
  getEnhancedMockZipData(zipCode) {
    const areaTypes = ['urban', 'suburban', 'rural'];
    const areaType = areaTypes[zipCode.length % 3];
    
    return {
      id: zipCode,
      name: `${zipCode} (Enhanced Mock Data)`,
      source: 'ENHANCED_MOCK',
      lastUpdated: new Date().toISOString(),
      demographics: realAPIService.generateRealisticDemographics(areaType),
      selected: false,
      type: null,
      reliability: {
        dataQuality: 'ESTIMATED',
        sourceReliability: 'MODELED',
        note: 'Enhanced mock data with realistic variations'
      }
    };
  },

  getEnhancedMockDMAData(dmaId) {
    return {
      id: dmaId,
      name: `DMA ${dmaId} (Enhanced Mock Data)`,
      source: 'ENHANCED_MOCK',
      lastUpdated: new Date().toISOString(),
      demographics: realAPIService.generateRealisticDemographics('suburban'),
      selected: false,
      type: null,
      reliability: {
        dataQuality: 'ESTIMATED',
        sourceReliability: 'MODELED',
        note: 'Enhanced mock data - premium APIs not configured'
      }
    };
  },

  // Check API status and availability
  async checkAPIStatus() {
    try {
      const status = {
        census: { available: true, type: 'FREE', status: 'Active' },
        usps: { available: true, type: 'FREE', status: 'Active' },
        nielsen: { 
          available: !!realAPIService.apiKeys.nielsen, 
          type: 'PREMIUM', 
          status: realAPIService.apiKeys.nielsen ? 'Configured' : 'Not Configured' 
        },
        statista: { 
          available: !!realAPIService.apiKeys.statista, 
          type: 'PREMIUM', 
          status: realAPIService.apiKeys.statista ? 'Configured' : 'Not Configured' 
        },
        comscore: { 
          available: !!realAPIService.apiKeys.comscore, 
          type: 'PREMIUM', 
          status: realAPIService.apiKeys.comscore ? 'Configured' : 'Not Configured' 
        }
      };
      
      return status;
    } catch (error) {
      console.error('Error checking API status:', error);
      return {};
    }
  },

  // Get usage statistics
  getUsageStatistics() {
    return realAPIService.getUsageStatistics();
  }
};

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

// Knowledge Base FAQ Data
const knowledgeBaseData = [
  {
    category: "Incrementality Testing",
    questions: [
      {
        question: "What is incrementality testing?",
        answer: "Incrementality testing is an experimental methodology that measures the true causal impact of marketing activities by comparing test groups (exposed to marketing) against control groups (not exposed). It reveals the additional conversions, revenue, or actions that occur specifically because of your marketing efforts."
      },
      {
        question: "How does geo-incrementality testing work?",
        answer: "Geo-incrementality testing divides geographic regions into test and control groups. Marketing campaigns run in test regions while control regions receive no exposure. By comparing performance between these regions, we can isolate the true incremental impact of marketing activities."
      },
      {
        question: "What are the benefits of incrementality testing?",
        answer: "Incrementality testing provides unbiased measurement of marketing effectiveness, accounts for baseline performance, eliminates correlation bias, measures cross-channel effects, and helps optimize budget allocation based on true causal impact rather than attribution models."
      },
      {
        question: "How long should an incrementality test run?",
        answer: "Test duration depends on business factors like purchase cycles, seasonal patterns, and statistical power requirements. Most tests run 2-8 weeks, with e-commerce typically requiring 14-21 days and longer consideration purchases needing 4-6 weeks."
      }
    ]
  },
  {
    category: "Data-Driven Attribution (DDA)",
    questions: [
      {
        question: "What is Data-Driven Attribution?",
        answer: "Data-Driven Attribution uses machine learning algorithms to analyze all touchpoints in customer journeys and assign credit based on their actual contribution to conversions. Unlike rule-based models, DDA adapts to your specific business and customer behavior patterns."
      },
      {
        question: "How does DDA differ from other attribution models?",
        answer: "Unlike last-click, first-click, or linear attribution models that use fixed rules, DDA analyzes conversion and non-conversion paths to determine which touchpoints actually drive conversions. It's customized to your data and updates as customer behavior changes."
      },
      {
        question: "What are the limitations of DDA?",
        answer: "DDA requires significant data volume, doesn't account for external factors, can show correlation rather than causation, and may struggle with long attribution windows or complex customer journeys. It also requires ongoing model training and validation."
      }
    ]
  },
  {
    category: "Multi-Touch Attribution (MTA)",
    questions: [
      {
        question: "What is Multi-Touch Attribution?",
        answer: "Multi-Touch Attribution assigns conversion credit across multiple touchpoints in a customer journey. It recognizes that customers typically interact with multiple channels before converting and attempts to fairly distribute credit among these interactions."
      },
      {
        question: "What are common MTA models?",
        answer: "Common MTA models include: Linear (equal credit to all touchpoints), Time-decay (more credit to recent touchpoints), Position-based (more credit to first and last touch), and Algorithmic (data-driven credit assignment based on statistical analysis)."
      },
      {
        question: "What challenges does MTA face?",
        answer: "MTA faces challenges with cross-device tracking, privacy regulations limiting data collection, view-through attribution complexity, and the inability to measure true causality. It often shows correlation rather than causal impact."
      }
    ]
  },
  {
    category: "Digital Measurement Best Practices",
    questions: [
      {
        question: "How should I combine different measurement approaches?",
        answer: "A robust measurement strategy combines multiple approaches: Use incrementality testing for unbiased causal measurement, MTA/DDA for tactical optimization, MMM for strategic planning, and A/B testing for creative and landing page optimization. Each method serves different purposes and time horizons."
      },
      {
        question: "What is Marketing Mix Modeling (MMM)?",
        answer: "Marketing Mix Modeling uses statistical analysis to measure the impact of various marketing activities on sales/conversions. It accounts for external factors like seasonality, economic conditions, and competitive activities while measuring the contribution of each marketing channel over time."
      },
      {
        question: "How do I measure cross-channel effects?",
        answer: "Cross-channel effects are best measured through incrementality testing and MMM. These approaches can capture halo effects where one channel influences performance in another, synergy effects where channels work better together, and cannibalization where channels compete for the same conversions."
      },
      {
        question: "What metrics should I focus on for measurement?",
        answer: "Focus on incremental metrics that show true business impact: Incremental ROAS, Incremental conversions, Incremental revenue, Statistical confidence levels, and Cost per incremental conversion. Avoid vanity metrics that don't reflect true marketing effectiveness."
      }
    ]
  }
];

// Header Component with BCM branding and API management
const Header = ({ currentView, setCurrentView, setShowLoginModal, isLoggedIn }) => {
  const [showAPIManager, setShowAPIManager] = useState(false);

  const handleDataSourcesClick = () => {
    console.log('Data Sources button clicked!');
    setShowAPIManager(true);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <img 
                  src="https://www.beebyclarkmeyler.com/hs-fs/hubfs/BCM_2024_Logo_Update_White.png?width=2550&height=3300&name=BCM_2024_Logo_Update_White.png"
                  alt="BCM Logo"
                  className="h-8 w-auto bg-bcm-orange p-1 rounded"
                />
                <div>
                  <div className="text-lg font-bold text-gray-900">BCM VentasAI</div>
                  <div className="text-xs text-bcm-orange font-semibold">Optimize</div>
                </div>
              </div>
              
              {isLoggedIn && (
                <nav className="hidden md:flex space-x-6">
                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'dashboard' 
                        ? 'bg-bcm-orange bg-opacity-10 text-bcm-orange' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Platform
                  </button>
                  <button 
                    onClick={() => setCurrentView('analytics')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'analytics' 
                        ? 'bg-bcm-orange bg-opacity-10 text-bcm-orange' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Analytics
                  </button>
                  <button 
                    onClick={() => setCurrentView('resources')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentView === 'resources' 
                        ? 'bg-bcm-orange bg-opacity-10 text-bcm-orange' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Resources
                  </button>
                </nav>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {isLoggedIn && (
                <button
                  onClick={handleDataSourcesClick}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 text-sm font-medium border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  <KeyIcon className="h-4 w-4" />
                  <span>Data Sources</span>
                </button>
              )}
              
              {!isLoggedIn ? (
                <>
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Login
                  </button>
                  <button className="bg-bcm-orange hover:bg-bcm-orange-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Request a demo
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Welcome back</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAPIManager && (
        <APIKeyManager 
          isOpen={showAPIManager}
          onClose={() => setShowAPIManager(false)}
        />
      )}
    </>
  );
};

// Login Modal Component
const LoginModal = ({ showModal, setShowModal, onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(credentials);
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Login to BCM VentasAI</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bcm-orange focus:border-transparent"
                  placeholder="Enter any email"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bcm-orange focus:border-transparent"
                  placeholder="Enter any password"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-bcm-orange hover:bg-bcm-orange-dark text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Login
              </button>
            </form>
            
            <p className="text-sm text-gray-500 text-center mt-4">
              For demo purposes, any email/password combination will work
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hero Section Component
const HeroSection = ({ setCurrentView }) => {
  return (
    <section className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            BCM VentasAI Optimize
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
          >
            BCM VentasAI Optimize empowers brands to launch regional holdout tests 
            automatically within the platform, revealing the actual lift generated by every marketing effort.
          </motion.p>
          
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onClick={() => setCurrentView('dashboard')}
            className="bg-bcm-orange hover:bg-bcm-orange-dark text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            Start Free Test
          </motion.button>
          
          <div className="mt-16">
            <img 
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx8fDE3NDg2MTE5MjB8MA&ixlib=rb-4.1.0&q=85"
              alt="Global Analytics"
              className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Knowledge Base Component
const KnowledgeBase = () => {
  const [selectedCategory, setSelectedCategory] = useState("Incrementality Testing");
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  return (
    <section className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Knowledge Base
          </h1>
          <p className="text-xl text-gray-600">
            Learn about incrementality testing, attribution, and digital measurement best practices
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Category Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2 text-bcm-orange" />
                Topics
              </h3>
              <nav className="space-y-2">
                {knowledgeBaseData.map((category) => (
                  <button
                    key={category.category}
                    onClick={() => setSelectedCategory(category.category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.category
                        ? 'bg-bcm-orange bg-opacity-10 text-bcm-orange'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {category.category}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <QuestionMarkCircleIcon className="h-6 w-6 mr-3 text-bcm-orange" />
                {selectedCategory}
              </h2>

              <div className="space-y-4">
                {knowledgeBaseData
                  .find(cat => cat.category === selectedCategory)
                  ?.questions.map((qa, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedQuestion(
                          expandedQuestion === `${selectedCategory}-${index}` 
                            ? null 
                            : `${selectedCategory}-${index}`
                        )}
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900">
                          {qa.question}
                        </span>
                        <span className={`transform transition-transform ${
                          expandedQuestion === `${selectedCategory}-${index}` ? 'rotate-180' : ''
                        }`}>
                          ▼
                        </span>
                      </button>
                      
                      <AnimatePresence>
                        {expandedQuestion === `${selectedCategory}-${index}` && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-4 text-gray-600 leading-relaxed border-t border-gray-200 pt-4">
                              {qa.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// API Key Management Component (inline to fix import issues)
const APIKeyManager = ({ isOpen, onClose }) => {
  const [apiService] = useState(() => new RealAPIService());
  const [apiKeys, setApiKeys] = useState({});
  const [validationStatus, setValidationStatus] = useState({});
  const [usageStats, setUsageStats] = useState(null);
  const [isValidating, setIsValidating] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadCurrentKeys();
      loadUsageStats();
    }
  }, [isOpen]);

  const loadCurrentKeys = () => {
    const keys = apiService.loadAPIKeys();
    setApiKeys(keys);
    
    // Check which keys are already validated
    Object.keys(keys).forEach(service => {
      if (keys[service]) {
        setValidationStatus(prev => ({
          ...prev,
          [service]: { valid: true, message: 'Stored key (not re-validated)' }
        }));
      }
    });
  };

  const loadUsageStats = () => {
    const stats = apiService.getUsageStatistics();
    setUsageStats(stats);
  };

  const handleKeyUpdate = (service, value) => {
    setApiKeys(prev => ({
      ...prev,
      [service]: value
    }));
  };

  const validateAPIKey = async (service) => {
    if (!apiKeys[service] || apiKeys[service].trim() === '') {
      setValidationStatus(prev => ({
        ...prev,
        [service]: { valid: false, message: 'API key is required' }
      }));
      return;
    }

    setIsValidating(prev => ({ ...prev, [service]: true }));

    try {
      const result = await apiService.validateAPIKey(service, apiKeys[service]);
      setValidationStatus(prev => ({
        ...prev,
        [service]: result
      }));

      if (result.valid) {
        await apiService.saveAPIKey(service, apiKeys[service]);
      }
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        [service]: { 
          valid: false, 
          message: 'Validation failed: ' + error.message 
        }
      }));
    }

    setIsValidating(prev => ({ ...prev, [service]: false }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <KeyIcon className="h-8 w-8 mr-3 text-bcm-orange" />
            Data Source Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Free Government Sources */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-green-600">✅</span>
            <span className="ml-2">Free Government Sources</span>
          </h3>
          <div className="grid gap-4">
            {['census', 'datausa', 'usps'].map(service => (
              <div key={service} className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {service === 'census' ? '🏛️' : service === 'datausa' ? '🇺🇸' : '📮'}
                    </span>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 capitalize">
                        {service === 'census' ? 'US Census Bureau' : 
                         service === 'datausa' ? 'DataUSA.io' :
                         'USPS ZIP Code API'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {service === 'census' 
                          ? 'Comprehensive demographic and economic data' 
                          : service === 'datausa'
                          ? 'Government data aggregation from Census, BLS, and federal sources'
                          : 'ZIP code validation and geographic data'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      FREE
                    </span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-green-700">
                    <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    Active and ready to use - No API key required
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Enhanced Geo Testing Dashboard Component with States, ZIP codes, and DMAs
const GeoTestingDashboard = ({ testData, setTestData, setCurrentView }) => {
  const [regionType, setRegionType] = useState('state'); // 'state', 'zip', 'dma'
  const [dataSource, setDataSource] = useState('datausa'); // 'census', 'datausa', 'enhanced_mock'
  const [regions, setRegions] = useState(mockRegions);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [similarRegions, setSimilarRegions] = useState([]);
  const [showSimilarityAnalysis, setShowSimilarityAnalysis] = useState(false);
  const [selectedRegionForAnalysis, setSelectedRegionForAnalysis] = useState(null);
  const [showCSVUpload, setShowCSVUpload] = useState(false);

  // CSV upload handling
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const newRegions = [];
        
        lines.forEach((line, index) => {
          if (index === 0) return; // Skip header
          const code = line.trim();
          if (code && /^\d{5}$/.test(code)) {
            newRegions.push({
              id: code,
              name: `${code} (Uploaded)`,
              source: 'CSV_UPLOAD',
              selected: false,
              type: null,
              demographics: {
                medianAge: 35 + Math.random() * 10,
                medianIncome: 50000 + Math.random() * 30000,
                populationDensity: Math.floor(Math.random() * 5000),
                householdSize: 2.2 + Math.random() * 0.6
              }
            });
          }
        });
        
        setRegions(prev => [...newRegions, ...prev]);
        setShowCSVUpload(false);
        alert(`Uploaded ${newRegions.length} ZIP codes successfully!`);
      };
      reader.readAsText(file);
    }
  };

  // Data source options
  const dataSourceOptions = [
    { 
      value: 'datausa', 
      label: 'DataUSA.io', 
      description: 'Comprehensive government data aggregation',
      type: 'FREE',
      icon: '🇺🇸'
    },
    { 
      value: 'census', 
      label: 'US Census Bureau', 
      description: 'Direct Census ACS data',
      type: 'FREE',
      icon: '🏛️'
    },
    { 
      value: 'enhanced_mock', 
      label: 'Enhanced Mock Data', 
      description: 'Realistic synthetic demographics',
      type: 'DEMO',
      icon: '🎭'
    }
  ];

  // Update regions when region type changes
  useEffect(() => {
    switch (regionType) {
      case 'zip':
        setRegions(mockZipCodes);
        break;
      case 'dma':
        setRegions(mockDMAs);
        break;
      default:
        setRegions(mockRegions);
    }
  }, [regionType]);

  // Handle region selection
  const selectRegion = async (regionId, type) => {
    const updatedRegions = regions.map(region => {
      if (region.id === regionId) {
        // Toggle selection: if same type clicked, deselect; otherwise select new type
        if (region.type === type) {
          return { ...region, selected: false, type: null };
        } else {
          return { ...region, selected: true, type };
        }
      }
      return region;
    });
    
    setRegions(updatedRegions);

    // Find similar regions for control group suggestions
    const selectedRegion = updatedRegions.find(r => r.id === regionId);
    if (selectedRegion && selectedRegion.selected && type === 'test') {
      setSelectedRegionForAnalysis(selectedRegion);
      setIsLoading(true);
      
      try {
        const similar = await GeographicAPI.findSimilarRegions(selectedRegion, regionType);
        setSimilarRegions(similar);
        setShowSimilarityAnalysis(true);
      } catch (error) {
        console.error('Error finding similar regions:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle search for ZIP codes or DMAs with selected data source
  const handleSearch = async (searchValue) => {
    setSearchTerm(searchValue);
    
    if (searchValue.length >= 3 && (regionType === 'zip' || regionType === 'dma')) {
      setIsLoading(true);
      
      try {
        let newRegion;
        if (regionType === 'zip' && /^\d{5}$/.test(searchValue)) {
          // Use selected data source for ZIP code lookup
          switch (dataSource) {
            case 'datausa':
              newRegion = await realAPIService.getDataUSAZipCodeData(searchValue);
              break;
            case 'census':
              newRegion = await realAPIService.getRealZipCodeData(searchValue);
              break;
            default:
              newRegion = await GeographicAPI.getEnhancedMockZipData(searchValue);
          }
        } else if (regionType === 'dma') {
          newRegion = await GeographicAPI.getDMAData(searchValue);
        }
        
        if (newRegion && !regions.find(r => r.id === newRegion.id)) {
          setRegions(prev => [newRegion, ...prev]);
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDetailedAnalysis = async (region1, region2) => {
    try {
      const analysis = await GeographicAPI.getDetailedAnalysis(region1, region2);
      if (analysis) {
        // You could show this in a modal or expanded view
        console.log('Detailed Analysis:', analysis);
        alert(`Detailed Analysis: ${analysis.recommendationStrength} match with ${(analysis.overallSimilarity * 100).toFixed(1)}% similarity`);
      }
    } catch (error) {
      console.error('Error getting detailed analysis:', error);
    }
  };

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const testRegions = regions.filter(r => r.type === 'test');
  const controlRegions = regions.filter(r => r.type === 'control');

  return (
    <>
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Enhanced Geo-Testing Dashboard
          </h2>
          <p className="text-xl text-gray-600">
            Select States, ZIP codes, or DMAs for advanced geo-incrementality testing
          </p>
        </div>

        {/* Region Type Selector */}
        <div className="mb-8">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setRegionType('state')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                regionType === 'state'
                  ? 'bg-white text-bcm-orange shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="w-4 h-4 mr-2" />
              States
            </button>
            <button
              onClick={() => setRegionType('zip')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                regionType === 'zip'
                  ? 'bg-white text-bcm-orange shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              ZIP Codes
            </button>
            <button
              onClick={() => setRegionType('dma')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                regionType === 'dma'
                  ? 'bg-white text-bcm-orange shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BuildingOfficeIcon className="w-4 h-4 mr-2" />
              DMAs
            </button>
          </div>
        </div>

        {/* Data Source Selector */}
        {(regionType === 'zip' || regionType === 'dma') && (
          <div className="mb-8">
            <label className="block text-lg font-bold text-gray-900 mb-4">
              Select Data Source
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dataSourceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDataSource(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    dataSource === option.value
                      ? 'border-bcm-orange bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{option.icon}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      option.type === 'FREE' ? 'bg-green-100 text-green-800' :
                      option.type === 'PAID' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {option.type}
                    </span>
                  </div>
                  <h3 className={`font-semibold mb-1 ${
                    dataSource === option.value ? 'text-bcm-orange' : 'text-gray-900'
                  }`}>
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Region Selection Panel */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Select {regionType === 'state' ? 'States' : regionType === 'zip' ? 'ZIP Codes' : 'DMAs'}
                </h3>
                
                {/* Search Bar and CSV Upload */}
                <div className="relative w-64 flex space-x-2">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bcm-orange focus:border-transparent"
                      placeholder={
                        regionType === 'zip' ? 'Search ZIP codes...' :
                        regionType === 'dma' ? 'Search DMAs...' :
                        'Search states...'
                      }
                    />
                  </div>
                  
                  {regionType === 'zip' && (
                    <button
                      onClick={() => setShowCSVUpload(true)}
                      className="px-3 py-2 bg-bcm-orange text-white rounded-lg hover:bg-bcm-orange-dark transition-colors text-sm"
                      title="Upload CSV of ZIP codes"
                    >
                      📄 CSV
                    </button>
                  )}
                </div>
              </div>
              
              {isLoading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-bcm-orange"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading geographic data...</p>
                </div>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredRegions.map((region) => (
                  <motion.div 
                    key={region.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{region.name}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {regionType === 'state' && (
                          <span>Population: {region.population}</span>
                        )}
                        {regionType === 'zip' && (
                          <div className="grid grid-cols-2 gap-4">
                            <span>Population: {region.population}</span>
                            <span>Median Income: {region.medianIncome}</span>
                            <span>Avg Age: {region.avgAge}</span>
                            <span>Density: {region.density}</span>
                          </div>
                        )}
                        {regionType === 'dma' && (
                          <div className="grid grid-cols-2 gap-4">
                            <span>Population: {region.population}</span>
                            <span>Households: {region.households}</span>
                            <span>Median Income: {region.medianIncome}</span>
                            <span>TV HH: {region.tvHouseholds}</span>
                          </div>
                        )}
                      </div>
                      
                      {region.similarity && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Similarity Score:</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-bcm-orange h-2 rounded-full" 
                                style={{ width: `${region.similarity * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-bcm-orange">
                              {(region.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => selectRegion(region.id, 'test')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          region.type === 'test'
                            ? 'bg-bcm-orange text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-orange-100'
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
                  </motion.div>
                ))}
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setCurrentView('setup')}
                  className="flex-1 bg-bcm-orange hover:bg-bcm-orange-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Configure Test
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Start Test
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Preview & Similarity Analysis */}
          <div className="space-y-6">
            {/* Test Configuration Preview */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Test Configuration</h3>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Test Regions</h4>
                    <span className="bg-orange-100 text-bcm-orange px-2 py-1 rounded-full text-sm">
                      {testRegions.length} selected
                    </span>
                  </div>
                  <div className="space-y-1">
                    {testRegions.map(region => (
                      <div key={region.id} className="text-sm">
                        <span className="font-medium">{region.name}</span>
                        {regionType !== 'state' && region.similarity && (
                          <span className="ml-2 text-bcm-orange">
                            ({(region.similarity * 100).toFixed(0)}% match)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Control Regions</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                      {controlRegions.length} selected
                    </span>
                  </div>
                  <div className="space-y-1">
                    {controlRegions.map(region => (
                      <div key={region.id} className="text-sm">
                        <span className="font-medium">{region.name}</span>
                        {regionType !== 'state' && region.similarity && (
                          <span className="ml-2 text-green-600">
                            ({(region.similarity * 100).toFixed(0)}% match)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Statistical Power</h4>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-bcm-orange h-2 rounded-full" 
                      style={{ width: `${Math.min(85 + (testRegions.length + controlRegions.length) * 2, 95)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {Math.min(85 + (testRegions.length + controlRegions.length) * 2, 95)}% statistical power
                  </p>
                </div>
              </div>
            </div>

            {/* Similarity Analysis Panel */}
            {showSimilarityAnalysis && selectedRegionForAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  AI-Powered Control Recommendations
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Based on advanced demographic matching for: <strong>{selectedRegionForAnalysis.name}</strong>
                </p>
                
                <div className="space-y-3">
                  {similarRegions.map((region, index) => (
                    <div key={region.id} className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{region.name}</h4>
                          {region.validation && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded ${
                                region.validation.confidenceLevel === 'High' ? 'bg-green-100 text-green-800' :
                                region.validation.confidenceLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {region.validation.confidenceLevel} Confidence
                              </span>
                              <span className="text-xs text-gray-600">
                                {(region.validation.statisticalPower * 100).toFixed(0)}% Power
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-blue-600">
                            {(region.similarity * 100).toFixed(0)}% match
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full" 
                              style={{ width: `${region.similarity * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Advanced demographic comparison */}
                      {regionType === 'zip' && region.demographicComparison && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                          <div>Income: ${region.demographics?.medianIncome?.toLocaleString()}</div>
                          <div>Age: {region.demographics?.medianAge?.toFixed(1)}</div>
                          <div>Education: {region.demographics?.collegeEducated?.toFixed(0)}%</div>
                          <div>Density: {region.demographics?.populationDensity?.toLocaleString()}/sq mi</div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-600 mb-3">
                        <strong>Match Factors:</strong>
                        {region.matchReasons && region.matchReasons.slice(0, 3).map((reason, idx) => (
                          <div key={idx} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 mt-1">
                            {reason}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => selectRegion(region.id, 'control')}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        >
                          Add as Control
                        </button>
                        <button
                          onClick={() => handleDetailedAnalysis(selectedRegionForAnalysis, region)}
                          className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                        >
                          Detailed Analysis
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Test Design Optimization */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Test Design Recommendations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Recommended Test Duration:</span>
                      <span className="font-medium">21-28 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Statistical Power:</span>
                      <span className="font-medium text-green-600">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Demographic Balance Score:</span>
                      <span className="font-medium text-blue-600">92%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>

    <CSVUploadModal
      isOpen={showCSVUpload}
      onClose={() => setShowCSVUpload(false)}
      onUpload={handleCSVUpload}
    />
  </>
  );
};

// CSV Upload Modal
const CSVUploadModal = ({ isOpen, onClose, onUpload }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upload ZIP Codes CSV</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a CSV file with ZIP codes (one per row, first row should be header).
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={onUpload}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        />
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Test Setup Wizard Component (updated colors)
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
                currentStep >= step.id ? 'bg-bcm-orange text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <step.icon className="w-6 h-6" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700">{step.title}</span>
              {index < steps.length - 1 && (
                <div className={`w-24 h-1 mt-4 ${
                  currentStep > step.id ? 'bg-bcm-orange' : 'bg-gray-300'
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bcm-orange"
                    placeholder="Q1 2024 Meta Ads Test"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bcm-orange"
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
                      className="w-4 h-4 text-bcm-orange border-gray-300 rounded focus:ring-bcm-orange"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bcm-orange"
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
              className="px-6 py-3 bg-bcm-orange hover:bg-bcm-orange-dark text-white rounded-lg transition-colors"
            >
              {currentStep === 4 ? 'Launch Test' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Live Analytics Component (updated colors)
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
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-bcm-orange">Statistical Confidence</h3>
              <CheckCircleIcon className="w-5 h-5 text-bcm-orange" />
            </div>
            <p className="text-3xl font-bold text-gray-900">95%</p>
            <p className="text-sm text-bcm-orange">confidence level</p>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-yellow-600">Incremental Revenue</h3>
              <PresentationChartLineIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-900">$124K</p>
            <p className="text-sm text-yellow-700">additional revenue</p>
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
                <Area type="monotone" dataKey="lift" stroke="rgb(227, 128, 68)" fill="rgb(227, 128, 68)" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setCurrentView('attribution')}
            className="bg-bcm-orange hover:bg-bcm-orange-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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

// Attribution Modeling Component (updated colors)
const AttributionModeling = ({ testData }) => {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Smart Attribution Analysis</h2>
          <p className="text-xl text-gray-300">Compare last-click attribution vs. incrementality-based attribution</p>
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
                      <p className="text-gray-300">Last-click: {channel.attribution}%</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div className="bg-gray-400 h-2 rounded-full" style={{width: `${channel.attribution}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-orange-300">Incrementality: {channel.incrementality}%</p>
                      <div className="w-full bg-orange-900 rounded-full h-2 mt-1">
                        <div className="h-2 rounded-full" style={{width: `${channel.incrementality}%`, backgroundColor: 'rgb(227, 128, 68)'}}></div>
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
                <Bar dataKey="attribution" fill="#9CA3AF" name="Last-click Attribution" />
                <Bar dataKey="incrementality" fill="rgb(227, 128, 68)" name="Incrementality-based" />
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
                <p className="text-gray-300">Incremental revenue identified</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{color: 'rgb(227, 128, 68)'}}>23%</p>
                <p className="text-gray-300">Attribution adjustment</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-400">$2.1M</p>
                <p className="text-gray-300">Annual revenue impact</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Results Analysis Component (updated colors)
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
                  <ArrowTrendingUpIcon className="w-6 h-6 text-bcm-orange mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Strong Performance</p>
                    <p className="text-gray-600">Test group outperformed control by $124K in additional revenue</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <PresentationChartLineIcon className="w-6 h-6 text-bcm-orange mt-1" />
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
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-bcm-orange">Expand Testing</h4>
                <p className="text-sm" style={{color: 'rgb(180, 100, 50)'}}>Run follow-up tests in additional regions to validate findings</p>
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
                  <div className="w-6 h-6 text-white rounded-full flex items-center justify-center text-sm font-bold" style={{backgroundColor: 'rgb(227, 128, 68)'}}>
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
              <button className="w-full text-white py-3 rounded-lg font-semibold transition-colors hover:opacity-90" style={{backgroundColor: 'rgb(227, 128, 68)'}}>
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

// Process Section Component (updated colors)
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
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How does BCM VentasAI work</h2>
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
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 mb-2">{step.description}</p>
              <span className="text-sm font-medium" style={{color: 'rgb(227, 128, 68)'}}>{step.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Case Studies Component (updated colors)
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
                  <span className="bg-orange-100 px-3 py-1 rounded-full text-sm font-medium" style={{color: 'rgb(227, 128, 68)'}}>
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

// Final CTA Component (updated colors)
const FinalCTA = () => {
  return (
    <section className="py-16" style={{background: 'linear-gradient(to right, rgb(227, 128, 68), rgb(200, 100, 50))'}}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-white mb-6">
            Upgrade your measurement with BCM VentasAI
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Start your first geo-incrementality test today and discover your true marketing impact
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Book a Demo
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-700 transition-colors">
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
  LoginModal,
  HeroSection,
  GeoTestingDashboard,
  CSVUploadModal,
  TestSetupWizard,
  LiveAnalytics,
  AttributionModeling,
  ResultsAnalysis,
  KnowledgeBase,
  ProcessSection,
  CaseStudies,
  FinalCTA
};

export default Components;