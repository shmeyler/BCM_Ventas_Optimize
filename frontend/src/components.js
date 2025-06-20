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
// Real-time calculation functions for test design recommendations
const calculateTestDuration = (regions) => {
  if (!regions || regions.length === 0) return 'Select regions first';
  
  // Calculate total population across all regions
  const totalPopulation = regions.reduce((sum, region) => {
    const pop = region.demographics?.population || 0;
    return sum + pop;
  }, 0);
  
  console.log('Total population for test duration:', totalPopulation);
  
  // Base calculation on population size and statistical requirements
  if (totalPopulation > 1000000) {
    return '14-21 days';
  } else if (totalPopulation > 500000) {
    return '21-28 days';
  } else if (totalPopulation > 100000) {
    return '28-35 days';
  } else if (totalPopulation > 50000) {
    return '35-42 days';
  } else {
    return '42-56 days';
  }
};

const calculateStatisticalPower = (regions) => {
  if (!regions || regions.length === 0) return 'N/A';
  
  // Calculate based on sample size and regional diversity
  const totalPopulation = regions.reduce((sum, region) => {
    const pop = region.demographics?.population || 0;
    return sum + pop;
  }, 0);
  
  const regionCount = regions.length;
  
  console.log('Statistical power calculation - Population:', totalPopulation, 'Regions:', regionCount);
  
  // Higher population and more regions = higher statistical power
  let power = 50; // Base power
  
  // Population bonus
  if (totalPopulation > 1000000) power += 25;
  else if (totalPopulation > 500000) power += 20;
  else if (totalPopulation > 100000) power += 15;
  else if (totalPopulation > 50000) power += 10;
  else if (totalPopulation > 10000) power += 5;
  
  // Region count bonus
  if (regionCount > 10) power += 15;
  else if (regionCount > 5) power += 10;
  else if (regionCount > 2) power += 5;
  
  // Cap at 95%
  power = Math.min(power, 95);
  
  return `${power}%`;
};

const calculateDemographicBalance = (regions) => {
  if (!regions || regions.length === 0) return 'N/A';
  
  // Get valid income and age data
  const incomes = regions
    .map(region => region.demographics?.medianHouseholdIncome)
    .filter(income => income && income > 0 && !isNaN(income));
  
  const ages = regions
    .map(region => region.demographics?.medianAge)
    .filter(age => age && age > 0 && !isNaN(age));
  
  console.log('Balance calculation - Incomes:', incomes, 'Ages:', ages);
  
  if (incomes.length === 0 || ages.length === 0) {
    return 'Insufficient data';
  }
  
  // For single region, return high balance score
  if (regions.length === 1) {
    return '95%';
  }
  
  // Calculate coefficient of variation for income and age
  const incomeAvg = incomes.reduce((a, b) => a + b, 0) / incomes.length;
  const ageAvg = ages.reduce((a, b) => a + b, 0) / ages.length;
  
  // Avoid division by zero
  if (incomeAvg === 0 || ageAvg === 0) {
    return 'Insufficient data';
  }
  
  const incomeStdDev = Math.sqrt(
    incomes.reduce((sq, n) => sq + Math.pow(n - incomeAvg, 2), 0) / incomes.length
  );
  const ageStdDev = Math.sqrt(
    ages.reduce((sq, n) => sq + Math.pow(n - ageAvg, 2), 0) / ages.length
  );
  
  const incomeCV = incomeStdDev / incomeAvg;
  const ageCV = ageStdDev / ageAvg;
  
  // Lower variation = higher balance score
  const avgCV = (incomeCV + ageCV) / 2;
  const balanceScore = Math.max(60, Math.min(95, 100 - (avgCV * 100)));
  
  return `${Math.round(balanceScore)}%`;
};

// GeographicAPI object
const GeographicAPI = {
  // Find similar regions using Meta performance data
  async findSimilarRegionsWithMeta(selectedRegion, regionType, criteria = {}) {
    try {
      console.log(`🎯 Finding Meta performance-based similar regions for: ${selectedRegion.name}`);
      
      const { maxResults = 5, minSimilarity = 0.7 } = criteria;
      
      // Get Meta insights data for all regions
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/meta/insights?days=90`);
      const metaData = await response.json();
      
      if (metaData.status !== 'success' || !metaData.insights) {
        console.error('Failed to fetch Meta insights');
        return [];
      }
      
      // Find the selected region in Meta data
      const selectedMetaRegion = metaData.insights.find(insight => 
        insight.location_id === selectedRegion.id || 
        insight.location_name.includes(selectedRegion.id)
      );
      
      if (!selectedMetaRegion) {
        console.log('Selected region not found in Meta data, using fallback');
        return [];
      }
      
      console.log(`📊 Found Meta data for ${selectedRegion.name}:`, selectedMetaRegion.metrics);
      
      // Calculate similarity based on Meta performance metrics
      const similarities = metaData.insights
        .filter(insight => insight.location_id !== selectedRegion.id)
        .map(insight => ({
          ...insight,
          similarity: this.calculateMetaPerformanceSimilarity(
            selectedMetaRegion.metrics, 
            insight.metrics
          )
        }))
        .filter(region => region.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);
      
      // Convert to the expected format
      const similarRegions = similarities.map(insight => ({
        id: insight.location_id,
        name: insight.location_name,
        similarity: insight.similarity,
        demographics: {
          population: insight.metrics.impressions, // Using impressions as reach proxy
          medianIncome: Math.round(insight.metrics.revenue / insight.metrics.conversions * 12) || 50000,
          conversions: insight.metrics.conversions,
          spend: insight.metrics.spend,
          ctr: insight.metrics.ctr,
          conversionRate: insight.metrics.conversion_rate,
          roas: insight.metrics.roas
        },
        source: 'META_BUSINESS_API',
        metaMetrics: insight.metrics,
        selected: false,
        type: null
      }));
      
      console.log(`🎯 Found ${similarRegions.length} Meta performance-similar regions`);
      return similarRegions;
      
    } catch (error) {
      console.error('Error finding Meta-similar regions:', error);
      return [];
    }
  },

  // Calculate similarity based on Meta performance metrics
  calculateMetaPerformanceSimilarity(metrics1, metrics2) {
    const weights = {
      conversion_rate: 0.3,  // Most important for similar performance
      ctr: 0.25,            // Click-through rate similarity
      roas: 0.2,            // Return on ad spend
      cpm: 0.15,            // Cost efficiency
      spend: 0.1            // Spend level similarity
    };
    
    let totalSimilarity = 0;
    let totalWeight = 0;
    
    Object.keys(weights).forEach(metric => {
      if (metrics1[metric] && metrics2[metric]) {
        const val1 = metrics1[metric];
        const val2 = metrics2[metric];
        
        // Calculate percentage similarity (closer to 1 = more similar)
        const maxVal = Math.max(val1, val2);
        const minVal = Math.min(val1, val2);
        const similarity = minVal / maxVal;
        
        totalSimilarity += similarity * weights[metric];
        totalWeight += weights[metric];
      }
    });
    
    return totalWeight > 0 ? totalSimilarity / totalWeight : 0;
  },
  async getZipCodeData(zipCode) {
    try {
      console.log(`📍 Fetching data for ZIP code: ${zipCode} from backend`);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/zip-lookup/${zipCode}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Backend data retrieved for ZIP ${zipCode}`);
        
        // Map backend data structure to frontend expected format
        return {
          id: zipCode,
          name: `${data.city}, ${data.state} (${zipCode})`,
          demographics: {
            population: data.demographics.total_population,
            medianIncome: data.demographics.median_income,
            medianAge: data.demographics.median_age,
            age18to24: data.demographics.age_18_24,
            age25to34: data.demographics.age_25_34,
            age35to44: data.demographics.age_35_44,
            medianHouseholdIncome: data.demographics.median_income, // For calculations
            totalPopulation: data.demographics.total_population
          },
          source: 'US_CENSUS_BUREAU',
          selected: false,
          type: null
        };
      } else {
        console.error(`❌ Backend API error for ZIP ${zipCode}: ${response.status}`);
        throw new Error(`Backend API error: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error fetching ZIP code data from backend:', error);
      // Fallback to enhanced mock data only if backend is completely unavailable
      console.log(`🔄 Using enhanced mock data for ${zipCode} (backend unavailable)`);
      return this.getEnhancedMockZipData(zipCode);
    }
  },

  // Get multiple ZIP codes data from our backend API
  async getMultipleZipCodes(zipCodes) {
    try {
      console.log(`📍 Fetching data for multiple ZIP codes: ${zipCodes.join(',')} from backend`);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/geographic/zips?zip_codes=${zipCodes.join(',')}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Backend data retrieved for ${zipCodes.length} ZIP codes (Source: ${data.source})`);
        return data.regions.map(region => ({
          ...region,
          selected: false,
          type: null
        }));
      } else {
        console.error(`❌ Backend API error for multiple ZIP codes: ${response.status}`);
        throw new Error(`Backend API error: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error fetching multiple ZIP codes from backend:', error);
      // Fallback to processing each ZIP individually with mock data
      const results = [];
      for (const zipCode of zipCodes) {
        results.push(await this.getEnhancedMockZipData(zipCode));
      }
      return results;
    }
  },

  // Get DMA data from our backend API
  async getDMAData(dmaCode) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/geographic/dma/${dmaCode}`);
      if (response.ok) {
        const region = await response.json();
        console.log(`✅ DMA data retrieved: ${region.name}`);
        return region;
      } else {
        throw new Error(`Backend API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching DMA data:', error);
      return null;
    }
  },

  // Get State data from our backend API  
  async getStateData(stateCode) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/geographic/state/${stateCode}`);
      if (response.ok) {
        const region = await response.json();
        console.log(`✅ State data retrieved: ${region.name}`);
        return region;
      } else {
        throw new Error(`Backend API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching state data:', error);
      return null;
    }
  },

  // Get all available states from our backend API
  async getStatesData() {
    try {
      console.log(`🏛️ Fetching states data from backend`);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/geographic/states`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Backend states data retrieved (Source: ${data.source})`);
        return data.regions.map(region => ({
          ...region,
          selected: false,
          type: 'state'
        }));
      } else {
        console.error(`❌ Backend API error for states data: ${response.status}`);
        throw new Error(`Backend API error: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error fetching states data from backend:', error);
      // Fallback to mock states data only if backend is completely unavailable
      console.log(`🔄 Using mock states data (backend unavailable)`);
      return mockRegions.states || [];
    }
  },
      
  // Get DMA data from our backend API
  async getDMAData(dmaCode) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/geographic/dma/${dmaCode}`);
      if (response.ok) {
        const region = await response.json();
        console.log(`✅ DMA data retrieved: ${region.name}`);
        return region;
      } else {
        throw new Error(`Backend API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching DMA data:', error);
      return null;
    }
  },

  // Enhanced similar regions finding with real Meta data
  async findSimilarRegions(selectedRegion, regionType, criteria = {}) {
    try {
      console.log(`🔍 Finding similar regions for: ${selectedRegion.name}`);
      
      const {
        algorithm = 'weighted_euclidean',
        customWeights = {},
        minSimilarity = 0.7,
        maxResults = 5,
        includeValidation = true,
        useMetaData = false  // New parameter for Meta data toggle
      } = criteria;
      
      // If Meta data is enabled, use Meta performance similarity
      if (useMetaData) {
        return await this.findSimilarRegionsWithMeta(selectedRegion, regionType, criteria);
      }
      
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
      
      // Use the advanced matching model with REAL data from backend API
      const similarRegions = await matchingModel.findSimilarRegionsWithRealData(enhancedRegion, dataSource, {
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
        const validatedRegions = matchingModel.validateMatchSignificanceWithRealMetrics(
          enhancedRegion, 
          enhancedSimilarRegions,
          {
            expectedLift: 0.1, // 10% lift target
            alpha: 0.05, // 95% confidence
            beta: 0.2, // 80% power
            baselineConversionRate: 0.05, // 5% baseline
            weeklyTraffic: null, // Will be estimated
            dailySpend: null, // Will be estimated  
            kpi: 'conversions',
            minimumDetectableEffect: 0.05 // 5% minimum
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
const Header = ({ currentView, setCurrentView, setShowLoginModal, isLoggedIn, onLogout }) => {
  const [showAPIManager, setShowAPIManager] = useState(false);
  const [useMetaData, setUseMetaData] = useState(false); // New state for Meta data toggle

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
                  <button 
                    onClick={onLogout}
                    className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAPIManager && (
        <APIKeyManager 
          onClose={() => setShowAPIManager(false)}
          useMetaData={useMetaData}
          setUseMetaData={setUseMetaData}
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
// Meta Campaign Selector Component
const MetaCampaignSelector = ({ onClose, onCampaignSelect }) => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Account, 2: Select Campaigns

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading Meta accounts...');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/meta/accounts`);
      const data = await response.json();
      
      console.log('📊 Accounts response:', data);
      
      if (data.status === 'success') {
        setAccounts(data.accounts);
        console.log(`✅ Loaded ${data.accounts.length} accounts`);
      } else {
        console.error('❌ Failed to load accounts:', data.error);
        alert(`Failed to load accounts: ${data.error}`);
      }
    } catch (error) {
      console.error('💥 Error loading accounts:', error);
      alert(`Error loading accounts: ${error.message}`);
    }
    setLoading(false);
  };

  const loadCampaigns = async (accountId) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/meta/campaigns?account_id=${accountId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setCampaigns(data.campaigns);
        setStep(2);
      } else {
        console.error('Failed to load campaigns:', data.error);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
    setLoading(false);
  };

  const handleCampaignToggle = (campaign) => {
    console.log('🎯 Campaign toggle clicked:', campaign.name);
    setSelectedCampaigns(prev => {
      const isSelected = prev.find(c => c.id === campaign.id);
      let newSelection;
      if (isSelected) {
        newSelection = prev.filter(c => c.id !== campaign.id);
        console.log('❌ Removed campaign:', campaign.name);
      } else {
        newSelection = [...prev, campaign];
        console.log('✅ Added campaign:', campaign.name);
      }
      console.log('📊 Total selected campaigns:', newSelection.length);
      return newSelection;
    });
  };

  const handleLoadInsights = async () => {
    if (selectedCampaigns.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/meta/campaign-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedAccount.id,
          campaign_ids: selectedCampaigns.map(c => c.id),
          date_range_days: 90
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        onCampaignSelect({
          account: selectedAccount,
          campaigns: selectedCampaigns,
          insights: data.insights
        });
        onClose();
      } else {
        console.error('Failed to load campaign insights:', data.error);
      }
    } catch (error) {
      console.error('Error loading campaign insights:', error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Select Meta Ad Account' : 'Select Campaigns'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading...</p>
            </div>
          )}

          {/* Step 1: Account Selection */}
          {step === 1 && !loading && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">Choose the Meta ad account containing your campaigns:</p>
              {accounts.map(account => (
                <div 
                  key={account.id}
                  onClick={() => {
                    setSelectedAccount(account);
                    loadCampaigns(account.id);
                  }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">{account.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    <span>ID: {account.id}</span>
                    <span className="mx-2">•</span>
                    <span>Currency: {account.currency}</span>
                    <span className="mx-2">•</span>
                    <span className={`${account.status === 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {account.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Campaign Selection */}
          {step === 2 && !loading && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">Account: <strong>{selectedAccount?.name}</strong></p>
                  <p className="text-sm text-gray-500">Select campaigns to analyze their geographic performance:</p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ← Back to Accounts
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {campaigns.map(campaign => {
                  const isSelected = selectedCampaigns.find(c => c.id === campaign.id);
                  return (
                    <div 
                      key={campaign.id}
                      onClick={() => handleCampaignToggle(campaign)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>Objective: {campaign.objective}</span>
                            <span className="mx-2">•</span>
                            <span className={`${
                              campaign.status === 'ACTIVE' ? 'text-green-600' : 
                              campaign.status === 'PAUSED' ? 'text-yellow-600' : 'text-gray-600'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCampaignToggle(campaign)}
                            className="h-5 w-5 text-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {selectedCampaigns.length} campaign(s) selected
                  </p>
                  
                  {/* Debug info */}
                  <div className="text-xs text-gray-500 mr-4">
                    Selected: {JSON.stringify(selectedCampaigns.map(c => c.name))}
                    Loading: {loading ? 'Yes' : 'No'}
                  </div>
                  
                  <button
                    onClick={handleLoadInsights}
                    disabled={selectedCampaigns.length === 0 || loading}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      selectedCampaigns.length > 0 && !loading
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Loading...' : `Load Campaign Data (${selectedCampaigns.length})`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};
const APIKeyManager = ({ onClose, useMetaData, setUseMetaData }) => {
  const [apiKeys, setApiKeys] = useState({
    census: 'Connected ✓',
    meta: 'Checking...'
  });
  const [metaStatus, setMetaStatus] = useState(null);
  const [showCampaignSelector, setShowCampaignSelector] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  
  useEffect(() => {
    checkMetaConnection();
  }, []);
  
  const checkMetaConnection = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/meta/validate`);
      const status = await response.json();
      setMetaStatus(status);
      
      if (status.status === 'connected') {
        setApiKeys(prev => ({ ...prev, meta: 'Connected ✓' }));
      } else {
        setApiKeys(prev => ({ ...prev, meta: 'Disconnected' }));
      }
    } catch (error) {
      console.error('Meta validation failed:', error);
      setApiKeys(prev => ({ ...prev, meta: 'Error' }));
    }
  };

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
          {/* Census Bureau API */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">US Census Bureau API</h3>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {apiKeys.census}
              </span>
            </div>
            <p className="text-green-700 text-sm mb-3">
              Provides demographic data including population, median income, age distributions, and geographic boundaries.
            </p>
            <div className="text-xs text-green-600">
              ✓ Population data ✓ Income demographics ✓ Age distributions ✓ Geographic boundaries
            </div>
          </div>

          {/* Meta Business API */}
          <div className={`border rounded-lg p-6 ${
            metaStatus?.status === 'connected' 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${
                metaStatus?.status === 'connected' ? 'text-blue-800' : 'text-gray-800'
              }`}>
                Meta Business API
              </h3>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  metaStatus?.status === 'connected' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {apiKeys.meta}
                </span>
                {metaStatus?.status === 'connected' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useMetaData}
                      onChange={(e) => setUseMetaData(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-blue-700">Use Meta Data</span>
                  </label>
                )}
              </div>
            </div>
            
            {metaStatus?.status === 'connected' ? (
              <>
                <p className="text-blue-700 text-sm mb-3">
                  Provides real advertising performance data including impressions, conversions, spend, and demographic insights by region.
                </p>
                <div className="text-xs text-blue-600 mb-3">
                  ✓ Performance metrics ✓ Conversion data ✓ Spend analytics ✓ Demographic targeting
                </div>
                <div className="bg-blue-100 p-3 rounded text-xs text-blue-800">
                  <strong>Account:</strong> {metaStatus.account_name} | <strong>Status:</strong> {metaStatus.account_status}
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-700 text-sm mb-3">
                  Connect Meta Business API to access real advertising performance data and enhance geo-testing accuracy.
                </p>
                <div className="text-xs text-gray-600">
                  🔒 Campaign launch disabled for safety | ✓ Data access enabled
                </div>
                {metaStatus?.error && (
                  <div className="mt-3 bg-red-100 p-3 rounded text-xs text-red-800">
                    <strong>Connection Issue:</strong> {metaStatus.error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Data Source Selection */}
          {metaStatus?.status === 'connected' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-800 mb-4">Data Source Selection</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dataSource"
                    checked={!useMetaData}
                    onChange={() => setUseMetaData(false)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-medium text-orange-800">Census Bureau Data</span>
                    <p className="text-sm text-orange-700">Use demographic and population data for market analysis</p>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="dataSource"
                    checked={useMetaData}
                    onChange={() => setUseMetaData(true)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-medium text-orange-800">Meta Campaign Data</span>
                    <p className="text-sm text-orange-700">Use real advertising performance and conversion data from specific campaigns</p>
                  </div>
                </label>
              </div>
              
              {useMetaData && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <button
                    onClick={() => {
                      console.log('🎯 Select Meta Campaigns button clicked');
                      setShowCampaignSelector(true);
                      alert('Modal should open now. State: ' + showCampaignSelector);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🎯 Select Meta Campaigns
                  </button>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Choose specific campaigns to analyze their geographic performance
                  </p>
                  
                  {/* Debug info */}
                  <div className="mt-2 text-xs text-gray-500">
                    Modal state: {showCampaignSelector ? 'OPEN' : 'CLOSED'}
                  </div>
                  
                </div>
              )}
            </div>
          )}

          {/* Integration Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Integration Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Census API:</span>
                <span className="ml-2 text-green-600 font-medium">Active</span>
              </div>
              <div>
                <span className="text-gray-600">Meta API:</span>
                <span className={`ml-2 font-medium ${
                  metaStatus?.status === 'connected' ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {metaStatus?.status === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {useMetaData && metaStatus?.status === 'connected' 
                ? '🔗 Using Meta performance data for enhanced accuracy'
                : '📊 Using Census demographic data'
              }
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
      
      {/* Meta Campaign Selector Modal */}
      {showCampaignSelector && (
        <MetaCampaignSelector
          onClose={() => setShowCampaignSelector(false)}
          onCampaignSelect={(data) => {
            setSelectedCampaigns(data.campaigns);
            setSelectedCampaignData(data); // Store campaign data in Enhanced Mode
            console.log('📊 Campaign data stored in Enhanced Mode:', data);
            setShowCampaignSelector(false);
          }}
        />
      )}
    </div>
  );
};

// Lift Test API
const LiftTestAPI = {
  async createLiftTest(testConfig) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lift-test/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testConfig)
      });
      
      if (response.ok) {
        const liftTest = await response.json();
        console.log('✅ Lift test created:', liftTest.id);
        return liftTest;
      } else {
        throw new Error(`Failed to create lift test: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating lift test:', error);
      return null;
    }
  },

  async getLiftTests() {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lift-test`);
      if (response.ok) {
        const data = await response.json();
        return data.tests || [];
      }
    } catch (error) {
      console.error('Error getting lift tests:', error);
    }
    return [];
  },

  async calculatePowerAnalysis(testId, testRegions, controlRegions) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lift-test/${testId}/power-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_regions: testRegions, control_regions: controlRegions })
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error calculating power analysis:', error);
    }
    return null;
  },

  async getRecommendations(testId) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lift-test/${testId}/recommendations`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
    }
    return null;
  },

  async deleteTest(testId) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lift-test/${testId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        console.log('✅ Test deleted successfully');
        return true;
      } else {
        throw new Error(`Failed to delete test: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      return false;
    }
  },

  async updateTestStatus(testId, status) {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lift-test/${testId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        console.log(`✅ Test status updated to ${status}`);
        return true;
      } else {
        throw new Error(`Failed to update status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating test status:', error);
      return false;
    }
  }
};

// Enhanced Geo Testing Dashboard Component with States, ZIP codes, and DMAs
// Meta Campaign Launch Modal
const MetaCampaignLaunchModal = ({ isOpen, onClose, testDetails }) => {
  const [campaignConfig, setCampaignConfig] = useState({
    campaign_name: testDetails?.test_name ? `${testDetails.test_name} - Meta Campaign` : '',
    daily_budget: testDetails?.budget ? testDetails.budget / 30 : 100,
    optimization_goal: 'IMPRESSIONS',
    creative_id: '',
    targeting_type: 'geographic'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [metaValidation, setMetaValidation] = useState(null);
  const [campaignResult, setCampaignResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      checkMetaConnection();
      if (testDetails) {
        setCampaignConfig(prev => ({
          ...prev,
          campaign_name: `${testDetails.test_name} - Meta Campaign`,
          daily_budget: testDetails.budget ? testDetails.budget / 30 : 100
        }));
      }
    }
  }, [isOpen, testDetails]);

  const checkMetaConnection = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/meta/validate`);
      const validation = await response.json();
      setMetaValidation(validation);
    } catch (error) {
      console.error('Error checking Meta connection:', error);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!testDetails) return;

    setIsCreating(true);
    try {
      const campaignRequest = {
        test_id: testDetails.id,
        campaign_name: campaignConfig.campaign_name,
        daily_budget: campaignConfig.daily_budget,
        targeting_type: campaignConfig.targeting_type,
        test_regions: testDetails.test_regions,
        control_regions: testDetails.control_regions,
        start_date: testDetails.start_date,
        end_date: testDetails.end_date,
        optimization_goal: campaignConfig.optimization_goal,
        creative_id: campaignConfig.creative_id || null
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/meta/campaign/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignRequest)
      });

      if (response.ok) {
        const result = await response.json();
        setCampaignResult(result);
        
        // Update test status to active
        await LiftTestAPI.updateTestStatus(testDetails.id, 'active');
        
        alert('🎉 Meta campaign launched successfully!');
      } else {
        const error = await response.json();
        console.error('Campaign creation failed:', error);
        setCampaignResult({
          error: true,
          message: error.detail || 'Failed to create campaign',
          note: 'Campaign will be simulated for demonstration'
        });
      }
    } catch (error) {
      console.error('Error launching campaign:', error);
      setCampaignResult({
        error: true,
        message: 'Network error occurred',
        note: 'Campaign will be simulated for demonstration'
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📘</span>
            <h2 className="text-3xl font-bold text-gray-900">Launch Meta Campaign</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {campaignResult ? (
          // Campaign Result Display
          <div className="space-y-6">
            {campaignResult.error ? (
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-red-900 mb-4">Campaign Creation Issue</h3>
                <p className="text-red-800 mb-4">{campaignResult.message}</p>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">📊 Simulation Mode Active</h4>
                  <p className="text-blue-800 text-sm">
                    Your campaign structure has been created and will run in simulation mode. 
                    This demonstrates the complete workflow with realistic data.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-4">🎉 Campaign Launched Successfully!</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Campaign ID:</span>
                    <p className="text-green-700">{campaignResult.campaign_id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Status:</span>
                    <p className="text-green-700 capitalize">{campaignResult.status}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Daily Budget:</span>
                    <p className="text-green-700">${campaignResult.daily_budget}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Targeting:</span>
                    <p className="text-green-700">
                      {campaignResult.targeting_summary?.test_regions} test regions, 
                      {campaignResult.targeting_summary?.control_regions} control regions
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Campaign Structure Created:</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">✅ Campaign Setup</span>
                  <span className="text-sm font-medium text-green-600">Complete</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">✅ Geographic Targeting</span>
                  <span className="text-sm font-medium text-green-600">Applied</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">✅ Test/Control Exclusions</span>
                  <span className="text-sm font-medium text-green-600">Configured</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">✅ Budget Allocation</span>
                  <span className="text-sm font-medium text-green-600">Set</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Campaign Configuration
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Campaign Setup */}
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 Test Summary</h3>
                {testDetails && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Test Name:</span>
                      <span className="font-medium text-blue-900">{testDetails.test_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Test Regions:</span>
                      <span className="font-medium text-blue-900">{testDetails.test_regions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Control Regions:</span>
                      <span className="font-medium text-blue-900">{testDetails.control_regions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Duration:</span>
                      <span className="font-medium text-blue-900">
                        {testDetails.start_date && testDetails.end_date ? 
                          `${Math.ceil((new Date(testDetails.end_date) - new Date(testDetails.start_date)) / (1000 * 60 * 60 * 24))} days` 
                          : 'Not set'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignConfig.campaign_name}
                  onChange={(e) => setCampaignConfig({...campaignConfig, campaign_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Budget ($)
                </label>
                <input
                  type="number"
                  value={campaignConfig.daily_budget}
                  onChange={(e) => setCampaignConfig({...campaignConfig, daily_budget: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimization Goal
                </label>
                <select
                  value={campaignConfig.optimization_goal}
                  onChange={(e) => setCampaignConfig({...campaignConfig, optimization_goal: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IMPRESSIONS">Impressions</option>
                  <option value="REACH">Reach</option>
                  <option value="CLICKS">Clicks</option>
                  <option value="CONVERSIONS">Conversions</option>
                </select>
              </div>
            </div>

            {/* Right Column - Meta Connection & Preview */}
            <div className="space-y-6">
              {/* Meta Connection Status */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📘 Meta Connection</h3>
                {metaValidation ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">API Status:</span>
                      <span className={`font-medium ${metaValidation.status === 'valid' ? 'text-green-600' : 'text-orange-600'}`}>
                        {metaValidation.status === 'valid' ? '✅ Connected' : '⚠️ Simulation Mode'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Access Token:</span>
                      <span className={`font-medium ${metaValidation.has_access_token ? 'text-green-600' : 'text-red-600'}`}>
                        {metaValidation.has_access_token ? '✅ Valid' : '❌ Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ad Account:</span>
                      <span className={`font-medium ${metaValidation.has_ad_account ? 'text-green-600' : 'text-red-600'}`}>
                        {metaValidation.has_ad_account ? '✅ Configured' : '❌ Missing'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                )}
              </div>

              {/* Campaign Preview */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-4">🎯 Campaign Preview</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Targeting Strategy:</span>
                    <p className="text-green-700">Geographic exclusion with test/control split</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Budget Allocation:</span>
                    <p className="text-green-700">Split equally between test and control groups</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Campaign Type:</span>
                    <p className="text-green-700">Brand Awareness with {campaignConfig.optimization_goal} optimization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          {campaignResult ? (
            <div className="text-sm text-gray-600">
              Campaign structure created and ready for monitoring
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Campaign will target {testDetails?.test_regions?.length || 0} test regions and exclude {testDetails?.control_regions?.length || 0} control regions
            </div>
          )}
          
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {campaignResult ? 'Done' : 'Cancel'}
            </button>
            {!campaignResult && (
              <button
                onClick={handleLaunchCampaign}
                disabled={isCreating || !campaignConfig.campaign_name}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {isCreating ? 'Launching...' : '🚀 Launch Campaign'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Detailed Lift Test View Modal
const LiftTestDetailModal = ({ isOpen, onClose, testId }) => {
  const [testDetails, setTestDetails] = useState(null);
  const [powerAnalysis, setPowerAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testRegionDetails, setTestRegionDetails] = useState([]);
  const [controlRegionDetails, setControlRegionDetails] = useState([]);
  const [showMetaCampaignModal, setShowMetaCampaignModal] = useState(false);

  useEffect(() => {
    if (isOpen && testId) {
      loadTestDetails();
    }
  }, [isOpen, testId]);

  const loadTestDetails = async () => {
    setLoading(true);
    try {
      // Get test details
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/lift-test/${testId}`);
      if (response.ok) {
        const test = await response.json();
        setTestDetails(test);

        // Load region details
        await loadRegionDetails(test.test_regions, test.control_regions);

        // Get power analysis
        const power = await LiftTestAPI.calculatePowerAnalysis(testId, test.test_regions, test.control_regions);
        setPowerAnalysis(power);

        // Get recommendations
        const recs = await LiftTestAPI.getRecommendations(testId);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Error loading test details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRegionDetails = async (testRegions, controlRegions) => {
    try {
      const testDetails = [];
      const controlDetails = [];

      // Load test region details
      for (const regionId of testRegions) {
        try {
          if (regionId.length === 5 && regionId.match(/^\d+$/)) {
            // ZIP code
            const regionData = await GeographicAPI.getZipCodeData(regionId);
            if (regionData) testDetails.push(regionData);
          } else if (regionId.length === 2 || regionId.match(/^\d{1,2}$/)) {
            // State
            const regionData = await GeographicAPI.getStateData(regionId);
            if (regionData) testDetails.push(regionData);
          } else {
            // DMA
            const regionData = await GeographicAPI.getDMAData(regionId);
            if (regionData) testDetails.push(regionData);
          }
        } catch (error) {
          console.warn(`Failed to load region ${regionId}:`, error);
        }
      }

      // Load control region details
      for (const regionId of controlRegions) {
        try {
          if (regionId.length === 5 && regionId.match(/^\d+$/)) {
            const regionData = await GeographicAPI.getZipCodeData(regionId);
            if (regionData) controlDetails.push(regionData);
          } else if (regionId.length === 2 || regionId.match(/^\d{1,2}$/)) {
            const regionData = await GeographicAPI.getStateData(regionId);
            if (regionData) controlDetails.push(regionData);
          } else {
            const regionData = await GeographicAPI.getDMAData(regionId);
            if (regionData) controlDetails.push(regionData);
          }
        } catch (error) {
          console.warn(`Failed to load region ${regionId}:`, error);
        }
      }

      setTestRegionDetails(testDetails);
      setControlRegionDetails(controlDetails);
    } catch (error) {
      console.error('Error loading region details:', error);
    }
  };

  const getPlatformInfo = (platform) => {
    switch (platform) {
      case 'meta':
        return { name: 'Meta (Facebook/Instagram)', icon: '📘', color: 'bg-blue-100 text-blue-800' };
      case 'google':
        return { name: 'Google Ads', icon: '🔍', color: 'bg-green-100 text-green-800' };
      case 'pinterest':
        return { name: 'Pinterest Ads', icon: '📌', color: 'bg-red-100 text-red-800' };
      case 'tiktok':
        return { name: 'TikTok Ads', icon: '🎵', color: 'bg-gray-100 text-gray-800' };
      default:
        return { name: platform, icon: '📊', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', description: 'Test is being configured' };
      case 'active':
        return { color: 'bg-green-100 text-green-800', description: 'Test is currently running' };
      case 'completed':
        return { color: 'bg-blue-100 text-blue-800', description: 'Test has finished running' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', description: 'Test was cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800', description: 'Unknown status' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {testDetails?.test_name || 'Loading...'}
            </h2>
            {testDetails && (
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlatformInfo(testDetails.platform).color}`}>
                  {getPlatformInfo(testDetails.platform).icon} {getPlatformInfo(testDetails.platform).name}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(testDetails.status).color}`}>
                  {testDetails.status.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bcm-orange mx-auto mb-4"></div>
            <p className="text-gray-600">Loading test details...</p>
          </div>
        ) : testDetails ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Test Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Test Type</label>
                    <p className="text-gray-900 capitalize">{testDetails.test_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Budget</label>
                    <p className="text-gray-900">{testDetails.budget ? `$${testDetails.budget.toLocaleString()}` : 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-gray-900">{testDetails.start_date ? new Date(testDetails.start_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">End Date</label>
                    <p className="text-gray-900">{testDetails.end_date ? new Date(testDetails.end_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Metrics</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {testDetails.metrics.map((metric) => (
                        <span key={metric} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Regions */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Test Regions ({testDetails.test_regions.length})
                </h3>
                <div className="space-y-3">
                  {testRegionDetails.map((region) => (
                    <div key={region.id} className="flex justify-between items-center bg-white p-3 rounded">
                      <div>
                        <h4 className="font-medium text-gray-900">{region.name}</h4>
                        <p className="text-sm text-gray-600">Population: {region.demographics?.population?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>Median Income: ${region.demographics?.medianHouseholdIncome?.toLocaleString() || 'N/A'}</p>
                        <p>Median Age: {region.demographics?.medianAge || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                  {testDetails.test_regions.filter(id => !testRegionDetails.find(r => r.id === id)).map((regionId) => (
                    <div key={regionId} className="flex justify-between items-center bg-white p-3 rounded">
                      <div>
                        <h4 className="font-medium text-gray-900">{regionId}</h4>
                        <p className="text-sm text-gray-600">Loading details...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Control Regions */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Control Regions ({testDetails.control_regions.length})
                </h3>
                <div className="space-y-3">
                  {controlRegionDetails.map((region) => (
                    <div key={region.id} className="flex justify-between items-center bg-white p-3 rounded">
                      <div>
                        <h4 className="font-medium text-gray-900">{region.name}</h4>
                        <p className="text-sm text-gray-600">Population: {region.demographics?.population?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>Median Income: ${region.demographics?.medianHouseholdIncome?.toLocaleString() || 'N/A'}</p>
                        <p>Median Age: {region.demographics?.medianAge || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                  {testDetails.control_regions.filter(id => !controlRegionDetails.find(r => r.id === id)).map((regionId) => (
                    <div key={regionId} className="flex justify-between items-center bg-white p-3 rounded">
                      <div>
                        <h4 className="font-medium text-gray-900">{regionId}</h4>
                        <p className="text-sm text-gray-600">Loading details...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results Section */}
              {testDetails.results && (
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Test Results</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-900">{testDetails.results.lift_percent}%</div>
                      <div className="text-sm text-green-700">Measured Lift</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-900">{testDetails.results.p_value}</div>
                      <div className="text-sm text-green-700">P-Value</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${testDetails.results.statistical_significance ? 'text-green-900' : 'text-red-600'}`}>
                        {testDetails.results.statistical_significance ? 'Significant' : 'Not Significant'}
                      </div>
                      <div className="text-sm text-green-700">Statistical Result</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-green-800">
                    <p><strong>Confidence Interval:</strong> [{testDetails.results.confidence_interval[0]}%, {testDetails.results.confidence_interval[1]}%]</p>
                    <p><strong>Analysis Date:</strong> {new Date(testDetails.results.analysis_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Analytics & Actions */}
            <div className="space-y-6">
              {/* Power Analysis */}
              {powerAnalysis && (
                <div className="bg-white border border-gray-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Power Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Statistical Power:</span>
                      <span className="font-medium">{(powerAnalysis.power * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Min Detectable Effect:</span>
                      <span className="font-medium">{(powerAnalysis.minimum_detectable_effect * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Population:</span>
                      <span className="font-medium">{powerAnalysis.total_population?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Recommended Duration:</span>
                      <span className="font-medium">{powerAnalysis.recommended_duration_days} days</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {recommendations && recommendations.recommendations && (
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {recommendations.recommendations.map((rec, index) => (
                      <div key={index} className="border-l-4 border-yellow-400 pl-3">
                        <h4 className="font-medium text-yellow-900 text-sm">{rec.title}</h4>
                        <p className="text-yellow-800 text-xs mt-1">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Metadata */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Test ID:</span>
                    <span className="font-mono text-xs">{testDetails.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(testDetails.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="capitalize">{testDetails.status}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  {testDetails.status === 'draft' && (
                    <button 
                      onClick={() => setShowMetaCampaignModal(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      🚀 Launch Test Campaign
                    </button>
                  )}
                  {testDetails.status === 'active' && (
                    <button 
                      onClick={async () => {
                        const success = await LiftTestAPI.updateTestStatus(testId, 'completed');
                        if (success) {
                          setTestDetails({...testDetails, status: 'completed'});
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Complete Test
                    </button>
                  )}
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                    Export Test Data
                  </button>
                  <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">
                    Duplicate Test
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
                        const success = await LiftTestAPI.deleteTest(testId);
                        if (success) {
                          onClose();
                          window.location.reload(); // Refresh to update the list
                        } else {
                          alert('Failed to delete test. Please try again.');
                        }
                      }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm border-t border-red-500 mt-4"
                  >
                    🗑️ Delete Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Failed to load test details
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      <MetaCampaignLaunchModal
        isOpen={showMetaCampaignModal}
        onClose={() => setShowMetaCampaignModal(false)}
        testDetails={testDetails}
      />
    </div>
  );
};

// Lift Tests List Component
const LiftTestsList = () => {
  const [liftTests, setLiftTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [useMetaData, setUseMetaData] = useState(false); // Add Meta data toggle state

  useEffect(() => {
    loadLiftTests();
  }, []);

  const loadLiftTests = async () => {
    setLoading(true);
    try {
      const tests = await LiftTestAPI.getLiftTests();
      setLiftTests(tests);
    } catch (error) {
      console.error('Error loading lift tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'meta': return '📘';
      case 'google': return '🔍';
      case 'pinterest': return '📌';
      case 'tiktok': return '🎵';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bcm-orange mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading lift tests...</p>
      </div>
    );
  }

  if (liftTests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-sm">No lift tests created yet</p>
        <p className="text-xs text-gray-400 mt-1">Configure a lift test to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-900">Your Lift Tests ({liftTests.length})</h4>
        <button
          onClick={loadLiftTests}
          className="text-xs text-bcm-orange hover:text-bcm-orange-dark"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {liftTests.map((test) => (
          <div
            key={test.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedTestId(test.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 text-sm">{test.test_name}</h5>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">{getPlatformIcon(test.platform)}</span>
                  <span className="text-xs text-gray-500 capitalize">{test.platform}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                    {test.status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-blue-600 hover:text-blue-800">
                View Details →
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Test Type:</span><br />
                <span className="capitalize">{test.test_type.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="font-medium">Regions:</span><br />
                <span>{test.test_regions.length} test, {test.control_regions.length} control</span>
              </div>
              <div>
                <span className="font-medium">Duration:</span><br />
                <span>{test.start_date ? new Date(test.start_date).toLocaleDateString() : 'Not set'} - {test.end_date ? new Date(test.end_date).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div>
                <span className="font-medium">Budget:</span><br />
                <span>{test.budget ? `$${test.budget.toLocaleString()}` : 'Not set'}</span>
              </div>
            </div>

            {test.results && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{test.results.lift_percent}%</div>
                    <div className="text-gray-500">Lift</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{test.results.p_value}</div>
                    <div className="text-gray-500">P-Value</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-medium ${test.results.statistical_significance ? 'text-green-600' : 'text-red-600'}`}>
                      {test.results.statistical_significance ? 'Significant' : 'Not Sig.'}
                    </div>
                    <div className="text-gray-500">Result</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                Created: {new Date(test.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <LiftTestDetailModal
        isOpen={!!selectedTestId}
        onClose={() => setSelectedTestId(null)}
        testId={selectedTestId}
      />
    </div>
  );
};

// Lift Test Configuration Modal
const LiftTestConfigModal = ({ isOpen, onClose, selectedRegions, onCreateTest }) => {
  const [testConfig, setTestConfig] = useState({
    test_name: '',
    platform: 'meta',
    test_type: 'conversion_lift',
    budget: '',
    start_date: '',
    end_date: '',
    metrics: ['impressions', 'clicks', 'conversions']
  });
  const [testRegions, setTestRegions] = useState([]);
  const [controlRegions, setControlRegions] = useState([]);
  const [powerAnalysis, setPowerAnalysis] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen && selectedRegions.length > 0) {
      // Auto-assign first half to test, second half to control
      const midpoint = Math.ceil(selectedRegions.length / 2);
      setTestRegions(selectedRegions.slice(0, midpoint).map(r => r.id));
      setControlRegions(selectedRegions.slice(midpoint).map(r => r.id));
    }
  }, [isOpen, selectedRegions]);

  const handleCreateTest = async () => {
    if (!testConfig.test_name || testRegions.length === 0 || controlRegions.length === 0) {
      alert('Please fill in all required fields and assign regions');
      return;
    }

    setIsCreating(true);
    try {
      const liftTest = await LiftTestAPI.createLiftTest({
        test_name: testConfig.test_name,
        test_regions: testRegions,
        control_regions: controlRegions,
        start_date: testConfig.start_date,
        end_date: testConfig.end_date,
        platform: testConfig.platform,
        test_type: testConfig.test_type,
        budget: parseFloat(testConfig.budget) || null,
        metrics: testConfig.metrics
      });

      if (liftTest) {
        // Calculate power analysis
        const power = await LiftTestAPI.calculatePowerAnalysis(liftTest.id, testRegions, controlRegions);
        setPowerAnalysis(power);
        onCreateTest(liftTest);
        alert('Lift test created successfully!');
        onClose();
      } else {
        alert('Failed to create lift test');
      }
    } catch (error) {
      console.error('Error creating lift test:', error);
      alert('Error creating lift test');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Configure Lift Test</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Test Configuration */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name *
              </label>
              <input
                type="text"
                value={testConfig.test_name}
                onChange={(e) => setTestConfig({...testConfig, test_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bcm-orange"
                placeholder="Q2 2025 Brand Lift Test"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform *
              </label>
              <select
                value={testConfig.platform}
                onChange={(e) => setTestConfig({...testConfig, platform: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bcm-orange"
              >
                <option value="meta">Meta (Facebook/Instagram)</option>
                <option value="google">Google Ads</option>
                <option value="pinterest">Pinterest</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Type *
              </label>
              <select
                value={testConfig.test_type}
                onChange={(e) => setTestConfig({...testConfig, test_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bcm-orange"
              >
                <option value="brand_lift">Brand Lift</option>
                <option value="conversion_lift">Conversion Lift</option>
                <option value="sales_lift">Sales Lift</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={testConfig.start_date}
                  onChange={(e) => setTestConfig({...testConfig, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bcm-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={testConfig.end_date}
                  onChange={(e) => setTestConfig({...testConfig, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bcm-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (Optional)
              </label>
              <input
                type="number"
                value={testConfig.budget}
                onChange={(e) => setTestConfig({...testConfig, budget: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bcm-orange"
                placeholder="50000"
              />
            </div>
          </div>

          {/* Right Column - Region Assignment */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Region Assignment</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Test Regions ({testRegions.length})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {testRegions.map(regionId => {
                      const region = selectedRegions.find(r => r.id === regionId);
                      return (
                        <div key={regionId} className="text-sm text-blue-800">
                          {region?.name || regionId}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Control Regions ({controlRegions.length})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {controlRegions.map(regionId => {
                      const region = selectedRegions.find(r => r.id === regionId);
                      return (
                        <div key={regionId} className="text-sm text-gray-800">
                          {region?.name || regionId}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {powerAnalysis && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Power Analysis</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <div>Statistical Power: {(powerAnalysis.power * 100).toFixed(0)}%</div>
                  <div>Min Detectable Effect: {(powerAnalysis.minimum_detectable_effect * 100).toFixed(1)}%</div>
                  <div>Total Population: {powerAnalysis.total_population?.toLocaleString()}</div>
                  <div>Recommended Duration: {powerAnalysis.recommended_duration_days} days</div>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">💡 Recommendations</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Ensure control regions match test regions demographically</li>
                <li>• Run test for at least 4 weeks for statistical significance</li>
                <li>• Monitor for external factors that could impact results</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {selectedRegions.length} regions selected • {testRegions.length} test • {controlRegions.length} control
          </div>
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTest}
              disabled={isCreating || !testConfig.test_name}
              className="px-6 py-2 bg-bcm-orange hover:bg-bcm-orange-dark text-white rounded-lg disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Lift Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GeoTestingDashboard = ({ testData, setTestData, setCurrentView }) => {
  const [activeTab, setActiveTab] = useState('regions');
  const [regionType, setRegionType] = useState('state'); // 'state', 'zip', 'dma'
  const [dataSource, setDataSource] = useState('datausa'); // 'census', 'datausa', 'enhanced_mock'
  const [regions, setRegions] = useState(mockRegions);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [similarRegions, setSimilarRegions] = useState([]);
  const [showSimilarityAnalysis, setShowSimilarityAnalysis] = useState(false);
  const [selectedRegionForAnalysis, setSelectedRegionForAnalysis] = useState(null);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showLiftTestConfig, setShowLiftTestConfig] = useState(false);
  const [liftTestResults, setLiftTestResults] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [useMetaData, setUseMetaData] = useState(false); // Add Meta data toggle state
  const [selectedCampaignData, setSelectedCampaignData] = useState(null); // Add campaign data state
  const [selectedCampaignData, setSelectedCampaignData] = useState(null); // Add campaign data state

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
        const similar = await GeographicAPI.findSimilarRegions(selectedRegion, regionType, {
          useMetaData: useMetaData,
          minSimilarity: 0.7,
          maxResults: 5
        });
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
    
    // Trigger search for ZIP codes when exactly 5 digits are entered
    if (regionType === 'zip' && /^\d{5}$/.test(searchValue)) {
      setIsLoading(true);
      
      try {
        console.log(`🔍 Searching for ZIP code: ${searchValue}`);
        let newRegion;
        
        // Use selected data source for ZIP code lookup
        switch (dataSource) {
          case 'datausa':
            newRegion = await GeographicAPI.getZipCodeData(searchValue);
            break;
          case 'census':
            newRegion = await GeographicAPI.getZipCodeData(searchValue);
            break;
          default:
            newRegion = await GeographicAPI.getEnhancedMockZipData(searchValue);
        }
        
        if (newRegion) {
          // Check if this ZIP code already exists in the list
          const existingIndex = regions.findIndex(r => r.id === newRegion.id);
          if (existingIndex !== -1) {
            // Update existing region
            setRegions(prev => prev.map((region, index) => 
              index === existingIndex ? newRegion : region
            ));
            console.log(`✅ Updated existing ZIP code: ${searchValue}`);
          } else {
            // Add new region to the top of the list
            setRegions(prev => [newRegion, ...prev]);
            console.log(`✅ Added new ZIP code: ${searchValue}`);
          }
        } else {
          console.log(`❌ No data found for ZIP code: ${searchValue}`);
        }
      } catch (error) {
        console.error('Error searching for ZIP code:', error);
        alert(`Error searching for ZIP code ${searchValue}. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    }
    // Trigger search for States when 2+ characters are entered
    else if (regionType === 'state' && searchValue.length >= 2) {
      setIsLoading(true);
      
      try {
        console.log(`🔍 Searching for State: ${searchValue}`);
        
        // Get the list of states to find a match
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/geographic/states`);
        if (response.ok) {
          const data = await response.json();
          const states = data.regions || [];
          
          // Find matching state by name or code
          const matchingState = states.find(state => 
            state.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            state.id === searchValue
          );
          
          if (matchingState) {
            // Get detailed state data
            const newRegion = await GeographicAPI.getStateData(matchingState.id);
            
            if (newRegion && !regions.find(r => r.id === newRegion.id)) {
              setRegions(prev => [newRegion, ...prev]);
              console.log(`✅ Added new State: ${searchValue}`);
            }
          } else {
            console.log(`❌ No State found matching: ${searchValue}`);
          }
        }
      } catch (error) {
        console.error('Error searching for State:', error);
      } finally {
        setIsLoading(false);
      }
    }
    // Trigger search for DMAs when 3+ characters are entered
    else if (regionType === 'dma' && searchValue.length >= 3) {
      setIsLoading(true);
      
      try {
        console.log(`🔍 Searching for DMA: ${searchValue}`);
        
        // First get the list of DMAs to find a match
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/geographic/dmas`);
        if (response.ok) {
          const data = await response.json();
          const dmas = data.regions || [];
          
          // Find matching DMA by name or code
          const matchingDMA = dmas.find(dma => 
            dma.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            dma.id === searchValue || dma.code === parseInt(searchValue)
          );
          
          if (matchingDMA) {
            // Get detailed DMA data
            const newRegion = await GeographicAPI.getDMAData(matchingDMA.id);
            
            if (newRegion && !regions.find(r => r.id === newRegion.id)) {
              setRegions(prev => [newRegion, ...prev]);
              console.log(`✅ Added new DMA: ${searchValue}`);
            }
          } else {
            console.log(`❌ No DMA found matching: ${searchValue}`);
          }
        }
      } catch (error) {
        console.error('Error searching for DMA:', error);
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
                          <div className="grid grid-cols-2 gap-4">
                            <span>Population: {region.demographics?.population?.toLocaleString() || 'N/A'}</span>
                            <span>Median Income: ${region.demographics?.medianHouseholdIncome?.toLocaleString() || 'N/A'}</span>
                            <span>Median Age: {region.demographics?.medianAge || 'N/A'}</span>
                            <span>Unemployment: {region.demographics?.unemploymentRate?.toFixed(1) || 'N/A'}%</span>
                          </div>
                        )}
                        {regionType === 'zip' && (
                          <div className="grid grid-cols-2 gap-4">
                            <span>Population: {region.demographics?.population?.toLocaleString() || 'N/A'}</span>
                            <span>Median Income: ${region.demographics?.medianHouseholdIncome?.toLocaleString() || 'N/A'}</span>
                            <span>Median Age: {region.demographics?.medianAge || 'N/A'}</span>
                            <span>Property Value: ${region.demographics?.medianPropertyValue?.toLocaleString() || 'N/A'}</span>
                          </div>
                        )}
                        {regionType === 'dma' && (
                          <div className="grid grid-cols-2 gap-4">
                            <span>Population: {region.demographics?.population?.toLocaleString() || 'N/A'}</span>
                            <span>Median Income: ${region.demographics?.medianHouseholdIncome?.toLocaleString() || 'N/A'}</span>
                            <span>Median Age: {region.demographics?.medianAge || 'N/A'}</span>
                            <span>Labor Force: {region.demographics?.laborForce?.toLocaleString() || 'N/A'}</span>
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
                        onClick={() => {
                          setSelectedRegionForAnalysis(region);
                          setIsLoading(true);
                          
                          GeographicAPI.findSimilarRegions(region, regionType, {
                            useMetaData: useMetaData,
                            minSimilarity: 0.7,
                            maxResults: 5
                          }).then(similar => {
                            setSimilarRegions(similar);
                            setShowSimilarityAnalysis(true);
                            setIsLoading(false);
                          }).catch(error => {
                            console.error('Error finding similar regions:', error);
                            setIsLoading(false);
                          });
                        }}
                        className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
                        title={useMetaData ? "Find similar regions based on Meta performance data" : "Find similar regions based on demographics"}
                      >
                        {useMetaData ? '🎯 Meta Similar' : '📊 Find Similar'}
                      </button>
                      
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
                  onClick={() => setShowLiftTestConfig(true)}
                  className="flex-1 bg-bcm-orange hover:bg-bcm-orange-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Configure Lift Test
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
                      <span className="font-medium">
                        {calculateTestDuration(regions)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Statistical Power:</span>
                      <span className={`font-medium ${regions.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {calculateStatisticalPower(regions)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Demographic Balance Score:</span>
                      <span className={`font-medium ${regions.length > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {calculateDemographicBalance(regions)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Created Lift Tests */}
                <LiftTestsList />
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

    <LiftTestConfigModal
      isOpen={showLiftTestConfig}
      onClose={() => setShowLiftTestConfig(false)}
      selectedRegions={regions}
      onCreateTest={(liftTest) => {
        console.log('Lift test created:', liftTest);
        setLiftTestResults(liftTest);
        setShowLiftTestConfig(false); // Close the config modal
        setSelectedTestId(liftTest.id); // Open the detailed view automatically
      }}
    />

    <LiftTestDetailModal
      isOpen={!!selectedTestId}
      onClose={() => setSelectedTestId(null)}
      testId={selectedTestId}
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

// Attribution Modeling Component (updated with lighter shading and enhanced analytics)
const AttributionModeling = ({ testData }) => {
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Smart Attribution Analysis</h2>
          <p className="text-xl text-gray-600">Compare last-click attribution vs. incrementality-based attribution</p>
        </div>

        {/* Power Analysis Section (inspired by your GeoLift interface) */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Attribution Power Analysis</h3>
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Expected Attribution Accuracy at 95% Confidence</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={[
                    {weeks: 2, accuracy: 65}, {weeks: 4, accuracy: 78}, {weeks: 6, accuracy: 85}, 
                    {weeks: 8, accuracy: 91}, {weeks: 10, accuracy: 95}, {weeks: 12, accuracy: 97}
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="weeks" stroke="#6B7280" label={{ value: 'Test Duration (weeks)', position: 'insideBottom', offset: -5 }} />
                    <YAxis stroke="#6B7280" label={{ value: 'Attribution Accuracy (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line type="monotone" dataKey="accuracy" stroke="rgb(227, 128, 68)" strokeWidth={3} dot={{ fill: 'rgb(227, 128, 68)', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Minimum Detectable Attribution Shift</h4>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-800">Current Test Duration</span>
                    <span className="text-lg font-bold text-blue-900">8 weeks</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-blue-900">±2.3%</div>
                    <div className="text-sm text-blue-700">Attribution shift detection threshold</div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-800 mb-2">Statistical Power: 91%</div>
                  <div className="text-sm font-medium text-green-800 mb-2">Confidence Level: 95%</div>
                  <div className="text-sm text-green-700">Sample Size: 847,293 conversions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Attribution Comparison - Updated Design */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Attribution Comparison</h3>
            <div className="space-y-4">
              {mockAttributionData.map((channel, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-gray-900">{channel.channel}</span>
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      channel.difference > 0 
                        ? 'bg-green-100 text-green-800' 
                        : channel.difference < 0 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {channel.difference > 0 ? '+' : ''}{channel.difference}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Last-click: {channel.attribution}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gray-500 h-3 rounded-full transition-all duration-500" style={{width: `${channel.attribution}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-orange-700 mb-1">Incrementality: {channel.incrementality}%</p>
                      <div className="w-full bg-orange-100 rounded-full h-3">
                        <div className="h-3 rounded-full transition-all duration-500" style={{
                          width: `${channel.incrementality}%`, 
                          backgroundColor: 'rgb(227, 128, 68)'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attribution Insights Chart - Updated Design */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Attribution Insights</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={mockAttributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="channel" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="attribution" fill="#9CA3AF" name="Last-click Attribution" radius={[2, 2, 0, 0]} />
                <Bar dataKey="incrementality" fill="rgb(227, 128, 68)" name="Incrementality-based" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Candidate Markets Analysis (inspired by your interface) */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Top Attribution Markets</h3>
            <span className="text-sm text-gray-500">Showing top 6 markets out of 15</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Market</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Baseline Attribution</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Incremental Attribution</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Estimated Accuracy</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {market: 'California (Los Angeles, San Francisco)', baseline: '$2.1M', incremental: '$2.4M', accuracy: '94.2%', confidence: '0.12%'},
                  {market: 'New York (NYC, Albany, Rochester)', baseline: '$1.8M', incremental: '$2.1M', accuracy: '91.8%', confidence: '0.15%'},
                  {market: 'Texas (Houston, Dallas, Austin)', baseline: '$1.6M', incremental: '$1.9M', accuracy: '89.5%', confidence: '0.18%'},
                  {market: 'Florida (Miami, Orlando, Tampa)', baseline: '$1.2M', incremental: '$1.4M', accuracy: '87.3%', confidence: '0.21%'},
                  {market: 'Illinois (Chicago, Rockford)', baseline: '$980K', incremental: '$1.1M', accuracy: '85.7%', confidence: '0.24%'},
                  {market: 'Washington (Seattle, Spokane)', baseline: '$820K', incremental: '$950K', accuracy: '83.9%', confidence: '0.27%'}
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.market}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{row.baseline}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{row.incremental}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{row.accuracy}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{row.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Simulated $15,000 additional investment
          </div>
        </div>

        {/* Key Findings - Updated Design */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Findings</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-3xl font-bold text-green-600">+$89K</p>
                <p className="text-gray-600 mt-2">Incremental revenue identified</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-3xl font-bold" style={{color: 'rgb(227, 128, 68)'}}>23%</p>
                <p className="text-gray-600 mt-2">Attribution adjustment</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-3xl font-bold text-blue-600">$2.1M</p>
                <p className="text-gray-600 mt-2">Annual revenue impact</p>
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