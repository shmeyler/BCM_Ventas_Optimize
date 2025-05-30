/**
 * BCM VentasAI Optimize - Demographic Matching Model
 * Advanced similarity matching for geo-incrementality testing
 * 
 * This model finds statistically similar ZIP codes or DMAs based on:
 * - Demographics (age, income, education, household size)
 * - Economic indicators (employment, housing costs, spending power)
 * - Behavioral data (digital adoption, shopping patterns, lifestyle)
 * - Geographic factors (urbanization, climate, accessibility)
 * - Market characteristics (competition, retail density, media consumption)
 */

// Comprehensive demographic variables for matching
const DEMOGRAPHIC_VARIABLES = {
  // Core Demographics
  medianAge: { weight: 0.15, type: 'continuous', range: [18, 85] },
  medianIncome: { weight: 0.20, type: 'continuous', range: [20000, 200000] },
  populationDensity: { weight: 0.12, type: 'continuous', range: [0, 50000] },
  householdSize: { weight: 0.08, type: 'continuous', range: [1.5, 4.5] },
  
  // Education & Employment
  collegeEducated: { weight: 0.10, type: 'percentage', range: [0, 100] },
  unemploymentRate: { weight: 0.08, type: 'percentage', range: [0, 25] },
  whiteCollarJobs: { weight: 0.07, type: 'percentage', range: [0, 100] },
  
  // Housing & Economic
  homeOwnership: { weight: 0.06, type: 'percentage', range: [0, 100] },
  medianHomeValue: { weight: 0.12, type: 'continuous', range: [50000, 2000000] },
  rentBurden: { weight: 0.05, type: 'percentage', range: [0, 70] },
  
  // Lifestyle & Behavior
  internetPenetration: { weight: 0.08, type: 'percentage', range: [0, 100] },
  mobileUsage: { weight: 0.06, type: 'percentage', range: [0, 100] },
  socialMediaUsage: { weight: 0.05, type: 'percentage', range: [0, 100] },
  onlineShoppingIndex: { weight: 0.07, type: 'continuous', range: [0, 200] },
  
  // Geographic & Market
  urbanizationLevel: { weight: 0.10, type: 'categorical', categories: ['Rural', 'Suburban', 'Urban'] },
  retailDensity: { weight: 0.06, type: 'continuous', range: [0, 500] },
  competitionIndex: { weight: 0.08, type: 'continuous', range: [0, 100] },
  
  // Media & Marketing
  tvConsumption: { weight: 0.04, type: 'continuous', range: [0, 8] },
  digitalAdReceptivity: { weight: 0.05, type: 'continuous', range: [0, 100] },
  brandLoyalty: { weight: 0.03, type: 'continuous', range: [0, 100] }
};

// Enhanced demographic dataset with realistic variation
const ENHANCED_DEMOGRAPHIC_DATA = {
  zipCodes: [
    {
      id: '10001',
      name: 'New York, NY 10001',
      demographics: {
        medianAge: 34.2,
        medianIncome: 67000,
        populationDensity: 74000,
        householdSize: 1.9,
        collegeEducated: 78,
        unemploymentRate: 4.2,
        whiteCollarJobs: 85,
        homeOwnership: 23,
        medianHomeValue: 850000,
        rentBurden: 45,
        internetPenetration: 95,
        mobileUsage: 92,
        socialMediaUsage: 78,
        onlineShoppingIndex: 145,
        urbanizationLevel: 'Urban',
        retailDensity: 450,
        competitionIndex: 92,
        tvConsumption: 3.2,
        digitalAdReceptivity: 85,
        brandLoyalty: 45
      }
    },
    {
      id: '90210',
      name: 'Beverly Hills, CA 90210',
      demographics: {
        medianAge: 45.1,
        medianIncome: 125000,
        populationDensity: 5500,
        householdSize: 2.4,
        collegeEducated: 85,
        unemploymentRate: 3.1,
        whiteCollarJobs: 78,
        homeOwnership: 68,
        medianHomeValue: 1250000,
        rentBurden: 35,
        internetPenetration: 98,
        mobileUsage: 89,
        socialMediaUsage: 72,
        onlineShoppingIndex: 175,
        urbanizationLevel: 'Suburban',
        retailDensity: 380,
        competitionIndex: 88,
        tvConsumption: 4.1,
        digitalAdReceptivity: 78,
        brandLoyalty: 62
      }
    },
    {
      id: '60601',
      name: 'Chicago, IL 60601',
      demographics: {
        medianAge: 32.8,
        medianIncome: 72000,
        populationDensity: 45000,
        householdSize: 2.1,
        collegeEducated: 82,
        unemploymentRate: 5.1,
        whiteCollarJobs: 87,
        homeOwnership: 35,
        medianHomeValue: 425000,
        rentBurden: 42,
        internetPenetration: 94,
        mobileUsage: 91,
        socialMediaUsage: 76,
        onlineShoppingIndex: 138,
        urbanizationLevel: 'Urban',
        retailDensity: 420,
        competitionIndex: 85,
        tvConsumption: 3.8,
        digitalAdReceptivity: 83,
        brandLoyalty: 48
      }
    },
    {
      id: '33101',
      name: 'Miami Beach, FL 33101',
      demographics: {
        medianAge: 38.5,
        medianIncome: 58000,
        populationDensity: 15000,
        householdSize: 2.0,
        collegeEducated: 65,
        unemploymentRate: 6.2,
        whiteCollarJobs: 72,
        homeOwnership: 45,
        medianHomeValue: 485000,
        rentBurden: 48,
        internetPenetration: 89,
        mobileUsage: 93,
        socialMediaUsage: 82,
        onlineShoppingIndex: 125,
        urbanizationLevel: 'Urban',
        retailDensity: 320,
        competitionIndex: 75,
        tvConsumption: 4.5,
        digitalAdReceptivity: 79,
        brandLoyalty: 52
      }
    },
    {
      id: '75201',
      name: 'Dallas, TX 75201',
      demographics: {
        medianAge: 31.2,
        medianIncome: 65000,
        populationDensity: 8500,
        householdSize: 2.3,
        collegeEducated: 74,
        unemploymentRate: 4.8,
        whiteCollarJobs: 79,
        homeOwnership: 52,
        medianHomeValue: 320000,
        rentBurden: 38,
        internetPenetration: 91,
        mobileUsage: 88,
        socialMediaUsage: 74,
        onlineShoppingIndex: 132,
        urbanizationLevel: 'Suburban',
        retailDensity: 285,
        competitionIndex: 78,
        tvConsumption: 4.2,
        digitalAdReceptivity: 81,
        brandLoyalty: 55
      }
    },
    {
      id: '19101',
      name: 'Philadelphia, PA 19101',
      demographics: {
        medianAge: 33.7,
        medianIncome: 61000,
        populationDensity: 35000,
        householdSize: 2.2,
        collegeEducated: 71,
        unemploymentRate: 5.5,
        whiteCollarJobs: 76,
        homeOwnership: 42,
        medianHomeValue: 285000,
        rentBurden: 41,
        internetPenetration: 92,
        mobileUsage: 89,
        socialMediaUsage: 73,
        onlineShoppingIndex: 128,
        urbanizationLevel: 'Urban',
        retailDensity: 365,
        competitionIndex: 82,
        tvConsumption: 3.9,
        digitalAdReceptivity: 80,
        brandLoyalty: 49
      }
    }
  ],
  
  dmas: [
    {
      id: 'dma-501',
      name: 'New York, NY DMA',
      demographics: {
        medianAge: 36.8,
        medianIncome: 73000,
        populationDensity: 2800,
        householdSize: 2.5,
        collegeEducated: 72,
        unemploymentRate: 4.5,
        whiteCollarJobs: 82,
        homeOwnership: 54,
        medianHomeValue: 485000,
        rentBurden: 43,
        internetPenetration: 94,
        mobileUsage: 90,
        socialMediaUsage: 75,
        onlineShoppingIndex: 142,
        urbanizationLevel: 'Urban',
        retailDensity: 395,
        competitionIndex: 90,
        tvConsumption: 3.6,
        digitalAdReceptivity: 83,
        brandLoyalty: 47
      }
    },
    {
      id: 'dma-803',
      name: 'Los Angeles, CA DMA',
      demographics: {
        medianAge: 35.2,
        medianIncome: 68000,
        populationDensity: 2400,
        householdSize: 2.8,
        collegeEducated: 69,
        unemploymentRate: 5.2,
        whiteCollarJobs: 75,
        homeOwnership: 49,
        medianHomeValue: 625000,
        rentBurden: 46,
        internetPenetration: 92,
        mobileUsage: 91,
        socialMediaUsage: 79,
        onlineShoppingIndex: 155,
        urbanizationLevel: 'Urban',
        retailDensity: 340,
        competitionIndex: 91,
        tvConsumption: 4.1,
        digitalAdReceptivity: 86,
        brandLoyalty: 44
      }
    },
    {
      id: 'dma-602',
      name: 'Chicago, IL DMA',
      demographics: {
        medianAge: 34.5,
        medianIncome: 64000,
        populationDensity: 1200,
        householdSize: 2.6,
        collegeEducated: 70,
        unemploymentRate: 5.8,
        whiteCollarJobs: 78,
        homeOwnership: 58,
        medianHomeValue: 265000,
        rentBurden: 39,
        internetPenetration: 93,
        mobileUsage: 89,
        socialMediaUsage: 74,
        onlineShoppingIndex: 135,
        urbanizationLevel: 'Suburban',
        retailDensity: 310,
        competitionIndex: 84,
        tvConsumption: 4.0,
        digitalAdReceptivity: 81,
        brandLoyalty: 51
      }
    }
  ]
};

/**
 * Advanced Demographic Matching Model
 */
class DemographicMatchingModel {
  constructor(options = {}) {
    this.variables = DEMOGRAPHIC_VARIABLES;
    this.data = ENHANCED_DEMOGRAPHIC_DATA;
    this.similarityThreshold = options.threshold || 0.7;
    this.maxResults = options.maxResults || 10;
    this.customWeights = options.customWeights || {};
  }

  /**
   * Normalize a value based on its variable definition
   */
  normalizeValue(value, variable) {
    if (variable.type === 'categorical') {
      return variable.categories.indexOf(value) / (variable.categories.length - 1);
    } else if (variable.type === 'percentage') {
      return value / 100;
    } else {
      // Continuous variables - min-max normalization
      const [min, max] = variable.range;
      return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }
  }

  /**
   * Calculate weighted Euclidean distance between two regions
   */
  calculateSimilarity(region1, region2, customWeights = {}) {
    let totalDistance = 0;
    let totalWeight = 0;

    for (const [varName, varConfig] of Object.entries(this.variables)) {
      const weight = customWeights[varName] || varConfig.weight;
      
      if (region1.demographics[varName] !== undefined && 
          region2.demographics[varName] !== undefined) {
        
        const val1 = this.normalizeValue(region1.demographics[varName], varConfig);
        const val2 = this.normalizeValue(region2.demographics[varName], varConfig);
        
        const distance = Math.pow(val1 - val2, 2);
        totalDistance += weight * distance;
        totalWeight += weight;
      }
    }

    // Convert distance to similarity score (0-1, higher is more similar)
    const normalizedDistance = Math.sqrt(totalDistance / totalWeight);
    return Math.max(0, 1 - normalizedDistance);
  }

  /**
   * Find similar regions using real API data and multiple algorithms
   */
  async findSimilarRegionsWithRealData(targetRegion, regionType = 'zipCodes', options = {}) {
    const {
      algorithm = 'weighted_euclidean',
      customWeights = {},
      minSimilarity = this.similarityThreshold,
      maxResults = this.maxResults,
      excludeIds = []
    } = options;

    let candidates = [];

    try {
      // Fetch real candidate regions from backend API
      if (regionType === 'zipCodes') {
        // Get a diverse set of ZIP codes for comparison
        const testZips = ['10001', '90210', '60601', '33101', '75201', '19101', '02101', '30309', '78701', '94102'];
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/geographic/zips?zip_codes=${testZips.join(',')}`);
        if (response.ok) {
          const data = await response.json();
          candidates = data.regions;
          console.log(`✅ Using real demographic data for ${candidates.length} ZIP codes`);
        }
      } else if (regionType === 'dmas') {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/geographic/dmas`);
        if (response.ok) {
          const data = await response.json();
          candidates = data.regions;
          console.log(`✅ Using real demographic data for ${candidates.length} DMAs`);
        }
      }
    } catch (error) {
      console.error('Error fetching real demographic data for matching:', error);
    }

    // Fallback to mock data if API fails
    if (candidates.length === 0) {
      console.warn('🔄 Falling back to mock data for demographic matching');
      candidates = this.data[regionType] || [];
    }

    const similarities = [];

    for (const candidate of candidates) {
      // Skip the target region itself and excluded regions
      if (candidate.id === targetRegion.id || excludeIds.includes(candidate.id)) {
        continue;
      }

      let similarity;
      
      switch (algorithm) {
        case 'weighted_euclidean':
          similarity = this.calculateSimilarity(targetRegion, candidate, customWeights);
          break;
        case 'mahalanobis':
          similarity = this.calculateMahalanobisSimilarity(targetRegion, candidate);
          break;
        case 'cosine':
          similarity = this.calculateCosineSimilarity(targetRegion, candidate);
          break;
        default:
          similarity = this.calculateSimilarity(targetRegion, candidate, customWeights);
      }

      if (similarity >= minSimilarity) {
        similarities.push({
          ...candidate,
          similarity,
          matchReasons: this.generateMatchReasons(targetRegion, candidate),
          demographicComparison: this.generateDemographicComparison(targetRegion, candidate)
        });
      }
    }

    // Sort by similarity and return top results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  /**
   * Calculate Mahalanobis distance for better statistical matching
   */
  calculateMahalanobisSimilarity(region1, region2) {
    // Simplified Mahalanobis-inspired calculation
    // In production, this would use covariance matrix from historical data
    const differences = [];
    const weights = [];

    for (const [varName, varConfig] of Object.entries(this.variables)) {
      if (region1.demographics[varName] !== undefined && 
          region2.demographics[varName] !== undefined) {
        
        const val1 = this.normalizeValue(region1.demographics[varName], varConfig);
        const val2 = this.normalizeValue(region2.demographics[varName], varConfig);
        
        differences.push(Math.abs(val1 - val2));
        weights.push(varConfig.weight);
      }
    }

    const weightedMean = differences.reduce((sum, diff, i) => sum + diff * weights[i], 0) / 
                        weights.reduce((sum, w) => sum + w, 0);
    
    return Math.max(0, 1 - weightedMean);
  }

  /**
   * Calculate cosine similarity for behavioral matching
   */
  calculateCosineSimilarity(region1, region2) {
    const vector1 = [];
    const vector2 = [];

    for (const [varName, varConfig] of Object.entries(this.variables)) {
      if (region1.demographics[varName] !== undefined && 
          region2.demographics[varName] !== undefined) {
        
        vector1.push(this.normalizeValue(region1.demographics[varName], varConfig));
        vector2.push(this.normalizeValue(region2.demographics[varName], varConfig));
      }
    }

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Generate human-readable match reasons
   */
  generateMatchReasons(target, candidate) {
    const reasons = [];
    const threshold = 0.1; // 10% difference threshold

    for (const [varName, varConfig] of Object.entries(this.variables)) {
      if (target.demographics[varName] !== undefined && 
          candidate.demographics[varName] !== undefined) {
        
        const val1 = this.normalizeValue(target.demographics[varName], varConfig);
        const val2 = this.normalizeValue(candidate.demographics[varName], varConfig);
        
        if (Math.abs(val1 - val2) < threshold && varConfig.weight > 0.08) {
          const readableName = this.getReadableVariableName(varName);
          reasons.push(`Similar ${readableName}`);
        }
      }
    }

    return reasons.slice(0, 4); // Return top 4 reasons
  }

  /**
   * Generate detailed demographic comparison
   */
  generateDemographicComparison(target, candidate) {
    const comparison = {};

    for (const [varName, varConfig] of Object.entries(this.variables)) {
      if (target.demographics[varName] !== undefined && 
          candidate.demographics[varName] !== undefined) {
        
        const targetVal = target.demographics[varName];
        const candidateVal = candidate.demographics[varName];
        const difference = Math.abs(targetVal - candidateVal);
        const percentDiff = targetVal !== 0 ? (difference / targetVal) * 100 : 0;

        comparison[varName] = {
          target: targetVal,
          candidate: candidateVal,
          difference,
          percentDifference: percentDiff,
          isClose: percentDiff < 15 // Within 15%
        };
      }
    }

    return comparison;
  }

  /**
   * Get readable variable names for display
   */
  getReadableVariableName(varName) {
    const readableNames = {
      medianAge: 'age demographics',
      medianIncome: 'income level',
      populationDensity: 'population density',
      householdSize: 'household composition',
      collegeEducated: 'education level',
      unemploymentRate: 'employment status',
      whiteCollarJobs: 'job market',
      homeOwnership: 'housing ownership',
      medianHomeValue: 'property values',
      rentBurden: 'housing costs',
      internetPenetration: 'digital connectivity',
      mobileUsage: 'mobile adoption',
      socialMediaUsage: 'social media behavior',
      onlineShoppingIndex: 'e-commerce activity',
      urbanizationLevel: 'urbanization',
      retailDensity: 'retail environment',
      competitionIndex: 'market competition',
      tvConsumption: 'media consumption',
      digitalAdReceptivity: 'advertising receptivity',
      brandLoyalty: 'brand affinity'
    };

    return readableNames[varName] || varName;
  }

  /**
   * Validate statistical significance of match
   */
  validateMatchSignificance(targetRegion, candidateRegions, testMetrics = {}) {
    // Statistical power calculation for geo-incrementality test
    const { 
      expectedLift = 0.1, 
      alpha = 0.05, 
      beta = 0.2,
      baselineConversionRate = 0.05 
    } = testMetrics;

    const results = candidateRegions.map(candidate => {
      // Calculate sample size requirements
      const populationTarget = this.extractPopulation(targetRegion);
      const populationCandidate = this.extractPopulation(candidate);
      
      // Simplified power calculation
      const minSampleSize = this.calculateMinSampleSize(
        baselineConversionRate, 
        expectedLift, 
        alpha, 
        beta
      );

      const targetSampleAdequate = populationTarget >= minSampleSize;
      const candidateSampleAdequate = populationCandidate >= minSampleSize;
      
      const statisticalPower = this.calculateStatisticalPower(
        populationTarget, 
        populationCandidate, 
        baselineConversionRate, 
        expectedLift
      );

      return {
        ...candidate,
        validation: {
          targetSampleAdequate,
          candidateSampleAdequate,
          statisticalPower,
          recommendedTestDuration: this.calculateTestDuration(minSampleSize, populationTarget),
          confidenceLevel: statisticalPower >= 0.8 ? 'High' : statisticalPower >= 0.6 ? 'Medium' : 'Low'
        }
      };
    });

    return results;
  }

  /**
   * Helper methods for statistical calculations
   */
  extractPopulation(region) {
    // Extract population from region name or demographics
    if (region.demographics && region.demographics.populationDensity) {
      return region.demographics.populationDensity * 10; // Rough estimate
    }
    return 50000; // Default population estimate
  }

  calculateMinSampleSize(baseRate, lift, alpha, beta) {
    // Simplified sample size calculation for proportions
    const p1 = baseRate;
    const p2 = baseRate * (1 + lift);
    const pooled = (p1 + p2) / 2;
    
    // Approximate formula
    const z_alpha = 1.96; // 95% confidence
    const z_beta = 0.84;  // 80% power
    
    const numerator = Math.pow(z_alpha + z_beta, 2) * 2 * pooled * (1 - pooled);
    const denominator = Math.pow(p2 - p1, 2);
    
    return Math.ceil(numerator / denominator);
  }

  calculateStatisticalPower(n1, n2, baseRate, lift) {
    // Simplified power calculation
    const effectSize = lift / Math.sqrt(baseRate * (1 - baseRate));
    const harmonicMean = 2 / (1/n1 + 1/n2);
    const power = Math.min(0.99, Math.max(0.05, effectSize * Math.sqrt(harmonicMean) / 4));
    return power;
  }

  calculateTestDuration(minSampleSize, population) {
    // Estimate test duration based on sample size and population
    const weeks = Math.ceil((minSampleSize / population) * 52); // Assuming yearly cycle
    return Math.max(2, Math.min(12, weeks)); // Between 2-12 weeks
  }

  /**
   * Export matching model for API integration
   */
  exportModel() {
    return {
      variables: this.variables,
      data: this.data,
      methods: {
        findSimilarRegions: this.findSimilarRegions.bind(this),
        validateMatchSignificance: this.validateMatchSignificance.bind(this),
        calculateSimilarity: this.calculateSimilarity.bind(this)
      }
    };
  }
}

// Export for use in the main application
export default DemographicMatchingModel;
export { DEMOGRAPHIC_VARIABLES, ENHANCED_DEMOGRAPHIC_DATA };