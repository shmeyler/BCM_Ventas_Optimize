/**
 * API Key Management Component
 * Allows users to configure premium data source API keys
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RealAPIService, { API_CONFIG } from './real-api-service';
import {
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

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
        // Save the key if validation succeeds
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getServiceIcon = (service) => {
    const icons = {
      nielsen: '📺',
      statista: '📊',
      comscore: '🌐',
      census: '🏛️',
      datausa: '🇺🇸',
      usps: '📮'
    };
    return icons[service] || '🔑';
  };

  const premiumServices = ['nielsen', 'statista', 'comscore'];
  const freeServices = ['census', 'datausa', 'usps'];

  return (
    <AnimatePresence>
      {isOpen && (
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

            {/* Usage Statistics */}
            {usageStats && (
              <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2 text-bcm-orange" />
                  Current Usage Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {usageStats.total.requests.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(usageStats.total.cost)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Object.keys(usageStats.monthly).length} days active
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Free Data Sources */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-green-600">✅</span>
                <span className="ml-2">Free Government Sources</span>
              </h3>
              <div className="grid gap-4">
                {freeServices.map(service => {
                  const config = API_CONFIG[service];
                  return (
                    <div key={service} className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getServiceIcon(service)}</span>
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
                            {config.cost}
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            {config.rateLimit.requestsPerDay.toLocaleString()} requests/day
                          </p>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-green-700">
                          <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                          Active and ready to use - No API key required
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Premium Data Sources */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 mr-2 text-bcm-orange" />
                Premium Data Sources
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold">Premium APIs provide enhanced demographic data including:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>TV household statistics and media consumption patterns</li>
                      <li>Digital behavior and online engagement metrics</li>
                      <li>Consumer spending and brand affinity data</li>
                      <li>Real-time market research and trend analysis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {premiumServices.map(service => {
                  const config = API_CONFIG[service];
                  const status = validationStatus[service];
                  const isValidating = isValidating[service];

                  return (
                    <div key={service} className="bg-white border border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getServiceIcon(service)}</span>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 capitalize">
                              {service} API
                            </h4>
                            <p className="text-sm text-gray-600">
                              {service === 'nielsen' && 'TV households, DMA data, media consumption'}
                              {service === 'statista' && 'Consumer behavior, market research, demographics'}
                              {service === 'comscore' && 'Digital audience measurement, web analytics'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-orange-100 text-bcm-orange px-3 py-1 rounded-full text-sm font-medium">
                            {config.cost}
                          </span>
                          <p className="text-xs text-gray-600 mt-1">
                            {config.estimatedCost} • {config.monthlyMinimum} minimum
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key
                          </label>
                          <div className="flex space-x-3">
                            <input
                              type="password"
                              value={apiKeys[service] || ''}
                              onChange={(e) => handleKeyUpdate(service, e.target.value)}
                              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bcm-orange focus:border-transparent"
                              placeholder={`Enter ${service} API key`}
                            />
                            <button
                              onClick={() => validateAPIKey(service)}
                              disabled={isValidating}
                              className="bg-bcm-orange hover:bg-bcm-orange-dark text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {isValidating ? 'Validating...' : 'Validate'}
                            </button>
                          </div>
                        </div>

                        {status && (
                          <div className={`p-3 rounded-lg flex items-center ${
                            status.valid 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-red-50 border border-red-200'
                          }`}>
                            {status.valid ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                            )}
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                status.valid ? 'text-green-800' : 'text-red-800'
                              }`}>
                                {status.message}
                              </p>
                              {status.valid && status.remainingQuota && (
                                <p className="text-xs text-green-600 mt-1">
                                  Remaining quota: {status.remainingQuota}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">Rate Limits & Pricing</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Requests per second:</span> {config.rateLimit.requestsPerSecond}
                            </div>
                            <div>
                              <span className="font-medium">Monthly limit:</span> {config.rateLimit.requestsPerMonth?.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Cost per request:</span> {config.estimatedCost}
                            </div>
                            <div>
                              <span className="font-medium">Monthly minimum:</span> {config.monthlyMinimum}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost Estimation */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-blue-600" />
                Cost Estimation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-medium text-gray-900">Light Usage</p>
                  <p className="text-gray-600">~100 requests/month</p>
                  <p className="text-lg font-bold text-green-600">$25-50/month</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-medium text-gray-900">Medium Usage</p>
                  <p className="text-gray-600">~500 requests/month</p>
                  <p className="text-lg font-bold text-blue-600">$100-200/month</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-medium text-gray-900">Heavy Usage</p>
                  <p className="text-gray-600">~2000+ requests/month</p>
                  <p className="text-lg font-bold text-orange-600">$500+/month</p>
                </div>
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
      )}
    </AnimatePresence>
  );
};

export default APIKeyManager;