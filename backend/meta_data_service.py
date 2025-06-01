import random
import json
import numpy as np
from typing import Dict, List, Any
from models import MetaAccountData, GeographicUnit
from datetime import datetime, timedelta

class MetaDataService:
    """
    Service layer for Meta API data - currently using realistic dummy data
    Structured to easily swap in real Meta API calls
    """
    
    def __init__(self):
        self.dummy_account_data = self._generate_dummy_account_data()
        self.zip_conversion_data = self._generate_zip_conversion_data()
        
    def get_account_data(self, account_id: str = None) -> MetaAccountData:
        """
        Get Meta account data - currently returns dummy data
        TODO: Replace with real Meta API call
        """
        return self.dummy_account_data
    
    def get_geographic_insights(self, account_id: str, date_range: int = 90) -> List[Dict[str, Any]]:
        """
        Get geographic performance insights
        TODO: Replace with Meta Ads Insights API call
        """
        insights = []
        
        # Generate insights for major ZIP codes
        zip_codes = self._get_sample_zip_codes()
        
        for zip_code in zip_codes:
            base_conversions = random.randint(50, 500)
            base_spend = random.uniform(1000, 10000)
            
            insight = {
                'location_type': 'zip',
                'location_id': zip_code,
                'location_name': f"ZIP {zip_code}",
                'date_range': f"{date_range} days",
                'metrics': {
                    'impressions': random.randint(10000, 100000),
                    'clicks': random.randint(500, 5000),
                    'conversions': base_conversions,
                    'spend': base_spend,
                    'revenue': base_conversions * random.uniform(25, 150),
                    'cpm': random.uniform(5, 25),
                    'ctr': random.uniform(0.5, 5.0),
                    'conversion_rate': random.uniform(1, 8),
                    'roas': random.uniform(2, 8)
                },
                'demographic_data': {
                    'age_groups': {
                        '18-24': random.uniform(0.1, 0.3),
                        '25-34': random.uniform(0.2, 0.4),
                        '35-44': random.uniform(0.15, 0.35),
                        '45-54': random.uniform(0.1, 0.25),
                        '55+': random.uniform(0.1, 0.2)
                    },
                    'gender': {
                        'male': random.uniform(0.4, 0.6),
                        'female': random.uniform(0.4, 0.6)
                    }
                }
            }
            insights.append(insight)
        
        return insights
    
    def get_conversion_data_by_zip(self, account_id: str, zip_codes: List[str] = None) -> Dict[str, Dict[str, float]]:
        """
        Get historical conversion data by ZIP code
        TODO: Replace with Meta API call to Ads Insights API
        """
        if zip_codes is None:
            zip_codes = self._get_sample_zip_codes()
        
        conversion_data = {}
        
        for zip_code in zip_codes:
            if zip_code in self.zip_conversion_data:
                conversion_data[zip_code] = self.zip_conversion_data[zip_code]
            else:
                # Generate new data for this ZIP
                conversion_data[zip_code] = self._generate_zip_metrics()
        
        return conversion_data
    
    def identify_similar_zip_codes(self, target_zip: str, similarity_threshold: float = 0.8) -> List[str]:
        """
        Identify ZIP codes similar to target based on Meta performance data
        TODO: Use real Meta API data for similarity matching
        """
        if target_zip not in self.zip_conversion_data:
            return []
        
        target_metrics = self.zip_conversion_data[target_zip]
        similar_zips = []
        
        for zip_code, metrics in self.zip_conversion_data.items():
            if zip_code == target_zip:
                continue
            
            # Calculate similarity score based on key metrics
            similarity = self._calculate_similarity(target_metrics, metrics)
            
            if similarity >= similarity_threshold:
                similar_zips.append(zip_code)
        
        return similar_zips[:50]  # Return top 50 similar ZIPs
    
    def get_geographic_units_from_meta_data(self, account_id: str) -> List[GeographicUnit]:
        """
        Convert Meta API data to GeographicUnit objects for statistical analysis
        """
        insights = self.get_geographic_insights(account_id)
        geographic_units = []
        
        for insight in insights:
            unit = GeographicUnit(
                id=insight['location_id'],
                name=insight['location_name'],
                type=insight['location_type'],
                population=random.randint(10000, 100000),  # TODO: Get from Census API
                historical_conversions=insight['metrics']['conversions'],
                historical_spend=insight['metrics']['spend'],
                historical_revenue=insight['metrics']['revenue'],
                conversion_rate=insight['metrics']['conversion_rate'],
                cpm=insight['metrics']['cpm'],
                ctr=insight['metrics']['ctr']
            )
            geographic_units.append(unit)
        
        return geographic_units
    
    def _generate_dummy_account_data(self) -> MetaAccountData:
        """Generate realistic dummy Meta account data"""
        return MetaAccountData(
            account_id="act_123456789",
            account_name="BCM Test Account",
            business_id="123456789",
            geographic_insights=[],
            conversion_data={},
            performance_metrics={
                'total_spend_90d': random.uniform(50000, 200000),
                'total_conversions_90d': random.randint(1000, 5000),
                'average_cpm': random.uniform(8, 20),
                'average_ctr': random.uniform(1.2, 3.8),
                'average_conversion_rate': random.uniform(2.1, 6.5)
            }
        )
    
    def _generate_zip_conversion_data(self) -> Dict[str, Dict[str, float]]:
        """Generate realistic conversion data for ZIP codes"""
        zip_codes = self._get_sample_zip_codes()
        data = {}
        
        for zip_code in zip_codes:
            data[zip_code] = self._generate_zip_metrics()
        
        return data
    
    def _generate_zip_metrics(self) -> Dict[str, float]:
        """Generate realistic metrics for a ZIP code"""
        base_performance = random.choice(['high', 'medium', 'low'])
        
        if base_performance == 'high':
            conversion_rate = random.uniform(4, 8)
            spend = random.uniform(5000, 15000)
            conversions = int(spend * conversion_rate / 100)
        elif base_performance == 'medium':
            conversion_rate = random.uniform(2, 4)
            spend = random.uniform(2000, 8000)
            conversions = int(spend * conversion_rate / 100)
        else:  # low
            conversion_rate = random.uniform(0.5, 2)
            spend = random.uniform(500, 3000)
            conversions = int(spend * conversion_rate / 100)
        
        return {
            'conversions': conversions,
            'spend': spend,
            'revenue': conversions * random.uniform(30, 120),
            'conversion_rate': conversion_rate,
            'cpm': random.uniform(5, 25),
            'ctr': random.uniform(0.8, 4.2),
            'roas': random.uniform(1.5, 6.0)
        }
    
    def _get_sample_zip_codes(self) -> List[str]:
        """Get sample ZIP codes for testing"""
        return [
            '10001', '10002', '10003', '10004', '10005',  # NYC
            '90210', '90211', '90212', '90213', '90214',  # Beverly Hills
            '94102', '94103', '94104', '94105', '94106',  # San Francisco
            '60601', '60602', '60603', '60604', '60605',  # Chicago
            '02101', '02102', '02103', '02104', '02105',  # Boston
            '33101', '33102', '33103', '33104', '33105',  # Miami
            '30301', '30302', '30303', '30304', '30305',  # Atlanta
            '78701', '78702', '78703', '78704', '78705',  # Austin
            '98101', '98102', '98103', '98104', '98105',  # Seattle
            '80201', '80202', '80203', '80204', '80205'   # Denver
        ]
    
    def _calculate_similarity(self, metrics1: Dict[str, float], metrics2: Dict[str, float]) -> float:
        """Calculate similarity score between two sets of metrics"""
        key_metrics = ['conversion_rate', 'cpm', 'ctr', 'roas']
        
        similarities = []
        for metric in key_metrics:
            if metric in metrics1 and metric in metrics2:
                val1, val2 = metrics1[metric], metrics2[metric]
                if val1 > 0 and val2 > 0:
                    # Calculate percentage similarity
                    similarity = 1 - abs(val1 - val2) / max(val1, val2)
                    similarities.append(max(0, similarity))
        
        return np.mean(similarities) if similarities else 0
    
    # TODO: Real Meta API integration methods
    def _make_meta_api_call(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Template for real Meta API calls
        TODO: Implement with facebook_business SDK
        """
        # Placeholder for real implementation
        # from facebook_business.adobjects.adaccount import AdAccount
        # from facebook_business.adobjects.adsinsights import AdsInsights
        # 
        # account = AdAccount(f'act_{account_id}')
        # insights = account.get_insights(params=params)
        # return insights
        
        return {}
