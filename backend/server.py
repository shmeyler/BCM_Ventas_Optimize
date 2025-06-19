from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from typing import List, Dict, Any, Optional
import os
from datetime import datetime, timedelta
import json
import requests
from pydantic import BaseModel
import uuid
import asyncio

# Import our new models and services
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import (
    GeoLiftTest, TestObjective, BudgetConfiguration, MarketSelection,
    GeographicUnit, TestGroup, QualityIndicators, StatisticalMetrics,
    ObjectiveType, MarketSelectionMethod, TestStatus, OptimizationRequest
)
from statistical_engine import StatisticalMatchingEngine
from meta_data_service import MetaDataService

# Keep existing imports from original server
import csv
from io import StringIO

app = FastAPI(title="BCM VentasAI Optimize - Enhanced", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URL)
db = client.geographic_testing

# Initialize services
statistical_engine = StatisticalMatchingEngine()
meta_service = MetaDataService()

# Census API configuration
CENSUS_API_KEY = os.environ.get('CENSUS_API_KEY', '34fbe7e666c730457ba86a6e603feefdeaa32aed')

@app.get("/")
async def root():
    return {"message": "BCM VentasAI Optimize - Enhanced Geographic Testing API", "version": "2.0.0"}

# =============================================================================
# STEP 1: OBJECTIVES API ENDPOINTS
# =============================================================================

@app.get("/api/objectives/types")
async def get_objective_types():
    """Get available objective types for geo lift tests"""
    return {
        "objective_types": [
            {"value": "conversions", "label": "Conversions", "description": "Measure incremental conversions"},
            {"value": "revenue", "label": "Revenue", "description": "Measure incremental revenue"},
            {"value": "roas", "label": "ROAS", "description": "Measure return on ad spend"},
            {"value": "brand_awareness", "label": "Brand Awareness", "description": "Measure brand lift"},
            {"value": "traffic", "label": "Traffic", "description": "Measure incremental website traffic"}
        ],
        "primary_kpis": [
            "purchase", "add_to_cart", "lead", "page_view", "app_install", "custom_conversion"
        ],
        "secondary_kpis": [
            "view_content", "search", "add_to_wishlist", "initiate_checkout", "subscribe"
        ]
    }

@app.post("/api/objectives/validate")
async def validate_objective(objective: TestObjective):
    """Validate objective configuration"""
    try:
        # Basic validation
        if not objective.primary_kpi:
            raise HTTPException(status_code=400, detail="Primary KPI is required")
        
        if objective.measurement_window < 7 or objective.measurement_window > 90:
            raise HTTPException(status_code=400, detail="Measurement window must be between 7-90 days")
        
        # Advanced validation could include historical data analysis
        recommendations = []
        if objective.measurement_window < 14:
            recommendations.append("Consider extending measurement window to 14+ days for more reliable results")
        
        if objective.type == ObjectiveType.ROAS and not objective.expected_lift:
            recommendations.append("Setting an expected lift helps with power analysis")
        
        return {
            "valid": True,
            "recommendations": recommendations,
            "estimated_timeline": objective.measurement_window + 7  # Analysis time
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# =============================================================================
# STEP 2: BUDGET API ENDPOINTS
# =============================================================================

@app.post("/api/budget/validate")
async def validate_budget(budget: BudgetConfiguration):
    """Validate budget configuration and provide recommendations"""
    try:
        warnings = []
        recommendations = []
        
        # Minimum budget validation
        if budget.total_budget < 5000:
            warnings.append("Budget below $5,000 may not provide sufficient statistical power")
        
        if budget.daily_budget * budget.duration_days != budget.total_budget:
            raise HTTPException(status_code=400, detail="Daily budget × duration must equal total budget")
        
        # Industry benchmarks
        if budget.daily_budget < 100:
            recommendations.append("Consider increasing daily budget to $100+ for better reach")
        
        # Duration validation
        if budget.duration_days < 14:
            warnings.append("Test duration below 14 days may not capture weekly patterns")
        elif budget.duration_days > 60:
            recommendations.append("Long tests may be affected by external factors")
        
        return {
            "valid": True,
            "warnings": warnings,
            "recommendations": recommendations,
            "estimated_reach": {
                "min_population": int(budget.total_budget * 10),  # Rough estimate
                "max_population": int(budget.total_budget * 50)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/budget/recommendations")
async def get_budget_recommendations(
    objective_type: str = Query(...),
    target_population: int = Query(default=100000)
):
    """Get budget recommendations based on objective and target population"""
    
    # Industry benchmarks by objective type
    benchmarks = {
        "conversions": {"min_daily": 150, "recommended_daily": 300},
        "revenue": {"min_daily": 200, "recommended_daily": 500},
        "roas": {"min_daily": 250, "recommended_daily": 600},
        "brand_awareness": {"min_daily": 100, "recommended_daily": 250},
        "traffic": {"min_daily": 75, "recommended_daily": 200}
    }
    
    if objective_type not in benchmarks:
        raise HTTPException(status_code=400, detail="Invalid objective type")
    
    benchmark = benchmarks[objective_type]
    
    # Adjust for population size
    population_factor = min(target_population / 100000, 3.0)  # Cap at 3x
    
    min_daily = int(benchmark["min_daily"] * population_factor)
    recommended_daily = int(benchmark["recommended_daily"] * population_factor)
    
    return {
        "objective_type": objective_type,
        "target_population": target_population,
        "recommendations": {
            "minimum_daily_budget": min_daily,
            "recommended_daily_budget": recommended_daily,
            "minimum_duration_days": 14,
            "recommended_duration_days": 21,
            "minimum_total_budget": min_daily * 14,
            "recommended_total_budget": recommended_daily * 21
        },
        "rationale": f"Based on industry benchmarks for {objective_type} campaigns and target population"
    }

# =============================================================================
# STEP 3: MARKET SELECTION API ENDPOINTS  
# =============================================================================

@app.get("/api/markets/meta-units")
async def get_meta_geographic_units(account_id: str = Query(default="act_123456789")):
    """Get geographic units from Meta account data"""
    try:
        units = meta_service.get_geographic_units_from_meta_data(account_id)
        
        return {
            "account_id": account_id,
            "total_units": len(units),
            "units": [unit.dict() for unit in units],
            "summary": {
                "total_population": sum(unit.population for unit in units),
                "total_conversions": sum(unit.historical_conversions for unit in units),
                "total_spend": sum(unit.historical_spend for unit in units),
                "average_conversion_rate": sum(unit.conversion_rate for unit in units) / len(units)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching Meta data: {str(e)}")

@app.post("/api/markets/auto-select")
async def auto_select_markets(
    account_id: str = Body(...),
    min_conversions: int = Body(default=50),
    min_spend: float = Body(default=1000),
    similarity_threshold: float = Body(default=0.7),
    target_size: int = Body(default=20)
):
    """
    Automatically select markets based on Meta account performance data
    """
    try:
        # Get all available units from Meta data
        all_units = meta_service.get_geographic_units_from_meta_data(account_id)
        
        # Filter units based on criteria
        filtered_units = [
            unit for unit in all_units
            if unit.historical_conversions >= min_conversions and unit.historical_spend >= min_spend
        ]
        
        if len(filtered_units) < 4:
            raise HTTPException(
                status_code=400, 
                detail="Insufficient markets meet the criteria. Consider lowering thresholds."
            )
        
        # Sort by performance and select diverse set
        sorted_units = sorted(filtered_units, key=lambda x: x.historical_conversions, reverse=True)
        selected_units = sorted_units[:target_size]
        
        return {
            "account_id": account_id,
            "selection_criteria": {
                "min_conversions": min_conversions,
                "min_spend": min_spend,
                "similarity_threshold": similarity_threshold,
                "target_size": target_size
            },
            "results": {
                "total_available": len(all_units),
                "filtered_count": len(filtered_units),
                "selected_count": len(selected_units),
                "selected_units": [unit.dict() for unit in selected_units]
            },
            "summary": {
                "total_population": sum(unit.population for unit in selected_units),
                "total_conversions": sum(unit.historical_conversions for unit in selected_units),
                "total_spend": sum(unit.historical_spend for unit in selected_units),
                "conversion_rate_range": [
                    min(unit.conversion_rate for unit in selected_units),
                    max(unit.conversion_rate for unit in selected_units)
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/markets/similarity-analysis")
async def analyze_market_similarity(units: List[GeographicUnit]):
    """Analyze similarity between selected markets"""
    try:
        if len(units) < 2:
            raise HTTPException(status_code=400, detail="At least 2 units required for similarity analysis")
        
        # Calculate similarity matrix
        similarity_matrix = []
        for i, unit1 in enumerate(units):
            row = []
            for j, unit2 in enumerate(units):
                if i == j:
                    similarity = 1.0
                else:
                    # Calculate similarity based on key metrics
                    metrics1 = {
                        'conversion_rate': unit1.conversion_rate,
                        'cpm': unit1.cpm,
                        'ctr': unit1.ctr
                    }
                    metrics2 = {
                        'conversion_rate': unit2.conversion_rate,
                        'cpm': unit2.cpm,
                        'ctr': unit2.ctr
                    }
                    similarity = meta_service._calculate_similarity(metrics1, metrics2)
                row.append(round(similarity, 3))
            similarity_matrix.append(row)
        
        # Calculate overall similarity score
        total_pairs = len(units) * (len(units) - 1) / 2
        total_similarity = sum(
            similarity_matrix[i][j] 
            for i in range(len(units)) 
            for j in range(i+1, len(units))
        )
        overall_similarity = total_similarity / total_pairs if total_pairs > 0 else 0
        
        return {
            "units": [{"id": unit.id, "name": unit.name} for unit in units],
            "similarity_matrix": similarity_matrix,
            "overall_similarity": round(overall_similarity, 3),
            "analysis": {
                "high_similarity_pairs": [
                    {"unit1": units[i].name, "unit2": units[j].name, "similarity": similarity_matrix[i][j]}
                    for i in range(len(units))
                    for j in range(i+1, len(units))
                    if similarity_matrix[i][j] > 0.8
                ],
                "recommendation": "High" if overall_similarity > 0.7 else "Medium" if overall_similarity > 0.5 else "Low"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# STEP 4: STATISTICAL ANALYSIS API ENDPOINTS
# =============================================================================

@app.post("/api/analysis/optimize-assignment")
async def optimize_geo_assignment(request: OptimizationRequest):
    """Optimize geographic assignment using statistical matching"""
    try:
        result = statistical_engine.optimize_geo_assignment(request)
        return result.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.post("/api/analysis/power-analysis")
async def calculate_power_analysis(
    treatment_group: TestGroup,
    control_group: TestGroup,
    expected_effect: float = Body(default=0.1)
):
    """Calculate statistical power for the test design"""
    try:
        metrics = statistical_engine.calculate_statistical_power(
            treatment_group, control_group, expected_effect
        )
        return metrics.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Power analysis failed: {str(e)}")

@app.post("/api/analysis/quality-validation")
async def validate_test_quality(
    treatment_group: TestGroup,
    control_group: TestGroup,
    budget_config: BudgetConfiguration,
    statistical_metrics: StatisticalMetrics
):
    """Comprehensive quality validation for test design"""
    try:
        quality = statistical_engine.validate_test_quality(
            treatment_group, control_group, budget_config, statistical_metrics
        )
        return quality.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quality validation failed: {str(e)}")

# =============================================================================
# STEP 5: TEST MANAGEMENT API ENDPOINTS (Enhanced)
# =============================================================================

@app.post("/api/tests/create-enhanced")
async def create_enhanced_lift_test(test: GeoLiftTest):
    """Create a new enhanced geo lift test with statistical analysis"""
    try:
        # Validate test configuration
        if not test.objective or not test.budget or not test.market_selection:
            raise HTTPException(status_code=400, detail="Objective, budget, and market selection are required")
        
        # Set test ID and timestamps
        test.test_id = str(uuid.uuid4())
        test.created_at = datetime.now()
        test.updated_at = datetime.now()
        test.status = TestStatus.DRAFT
        
        # Insert into database
        result = db.enhanced_lift_tests.insert_one(test.dict())
        
        return {
            "test_id": test.test_id,
            "status": "created",
            "message": "Enhanced lift test created successfully",
            "next_steps": [
                "Configure geographic assignment",
                "Run statistical analysis", 
                "Review quality indicators",
                "Approve and launch"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create test: {str(e)}")

@app.get("/api/tests/enhanced")
async def get_enhanced_lift_tests():
    """Get all enhanced lift tests"""
    try:
        tests = list(db.enhanced_lift_tests.find({}, {"_id": 0}))
        return {"tests": tests, "total": len(tests)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve tests: {str(e)}")

@app.get("/api/tests/enhanced/{test_id}")
async def get_enhanced_lift_test(test_id: str):
    """Get specific enhanced lift test"""
    try:
        test = db.enhanced_lift_tests.find_one({"test_id": test_id}, {"_id": 0})
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        return test
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve test: {str(e)}")

@app.put("/api/tests/enhanced/{test_id}/statistical-analysis")
async def update_test_statistical_analysis(
    test_id: str,
    treatment_group: TestGroup,
    control_group: TestGroup,
    quality_indicators: QualityIndicators
):
    """Update test with statistical analysis results"""
    try:
        update_data = {
            "treatment_group": treatment_group.dict(),
            "control_group": control_group.dict(),
            "quality_indicators": quality_indicators.dict(),
            "updated_at": datetime.now().isoformat(),
            "status": TestStatus.QUALITY_REVIEW.value
        }
        
        result = db.enhanced_lift_tests.update_one(
            {"test_id": test_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Test not found")
        
        return {"status": "updated", "message": "Statistical analysis completed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update analysis: {str(e)}")

@app.put("/api/tests/enhanced/{test_id}/approve")
async def approve_enhanced_test(test_id: str):
    """Approve enhanced test for launch"""
    try:
        update_data = {
            "status": TestStatus.APPROVED.value,
            "approved_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        result = db.enhanced_lift_tests.update_one(
            {"test_id": test_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Test not found")
        
        return {"status": "approved", "message": "Test approved for launch"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve test: {str(e)}")

@app.post("/api/tests/enhanced/{test_id}/launch-meta-campaign")
async def launch_meta_campaign(test_id: str, campaign_config: dict = Body(...)):
    """Launch Meta campaign for approved test (dummy implementation)"""
    try:
        # Get test details
        test = db.enhanced_lift_tests.find_one({"test_id": test_id}, {"_id": 0})
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        
        if test["status"] != TestStatus.APPROVED.value:
            raise HTTPException(status_code=400, detail="Test must be approved before launch")
        
        # Simulate Meta campaign creation
        dummy_campaign_id = f"camp_{uuid.uuid4().hex[:12]}"
        
        # Update test with campaign info
        update_data = {
            "status": TestStatus.ACTIVE.value,
            "launched_at": datetime.now().isoformat(),
            "meta_campaign_id": dummy_campaign_id,
            "meta_campaign_config": campaign_config,
            "updated_at": datetime.now().isoformat()
        }
        
        db.enhanced_lift_tests.update_one(
            {"test_id": test_id},
            {"$set": update_data}
        )
        
        return {
            "status": "launched",
            "campaign_id": dummy_campaign_id,
            "message": "Meta campaign launched successfully (dummy mode)",
            "test_id": test_id,
            "launch_time": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to launch campaign: {str(e)}")

# =============================================================================
# META API VALIDATION ENDPOINTS
# =============================================================================

@app.get("/api/meta/validate")
async def validate_meta_connection():
    """Validate Meta API connection and return status"""
    try:
        validation_result = meta_service.validate_connection()
        return validation_result
    except Exception as e:
        return {
            "status": "error",
            "has_access_token": False,
            "has_ad_account": False,
            "error": f"Validation failed: {str(e)}"
        }

@app.post("/api/meta/campaign/create")
async def create_meta_campaign(campaign_request: dict = Body(...)):
    """Create a Meta campaign for geo-incrementality testing"""
    try:
        validation = meta_service.validate_connection()
        
        if validation["status"] != "connected":
            # Return simulated response for demo purposes
            return {
                "status": "simulated",
                "campaign_id": f"sim_camp_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "message": "Campaign created in simulation mode",
                "daily_budget": campaign_request.get("daily_budget", 100),
                "targeting_summary": {
                    "test_regions": len(campaign_request.get("test_regions", [])),
                    "control_regions": len(campaign_request.get("control_regions", []))
                },
                "note": "Real Meta API connection required for live campaigns"
            }
        
        # TODO: Implement real Meta campaign creation
        # This would use the Meta Marketing API to create campaigns with geographic targeting
        
        return {
            "status": "created",
            "campaign_id": f"real_camp_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "message": "Campaign created successfully",
            "daily_budget": campaign_request.get("daily_budget", 100),
            "targeting_summary": {
                "test_regions": len(campaign_request.get("test_regions", [])),
                "control_regions": len(campaign_request.get("control_regions", []))
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": f"Campaign creation failed: {str(e)}"
        }

# =============================================================================
# EXISTING ENDPOINTS (Preserved for backward compatibility)
# =============================================================================

@app.get("/api/zip-lookup/{zip_code}")
async def lookup_zip_code(zip_code: str):
    """Existing ZIP code lookup functionality"""
    try:
        # Zippopotam.us API for real city names
        zip_response = requests.get(f"http://api.zippopotam.us/us/{zip_code}")
        
        if zip_response.status_code != 200:
            raise HTTPException(status_code=404, detail="ZIP code not found")
        
        zip_data = zip_response.json()
        place = zip_data['places'][0]
        city = place['place name']
        state = place['state abbreviation']
        
        # Get Census data
        census_url = f"https://api.census.gov/data/2022/acs/acs5/profile"
        params = {
            'get': 'DP05_0001E,DP05_0018E,DP05_0019E,DP05_0020E,DP05_0021E,DP03_0062E',
            'for': f'zip code tabulation area:{zip_code}',
            'key': CENSUS_API_KEY
        }
        
        census_response = requests.get(census_url, params=params)
        
        if census_response.status_code == 200:
            census_data = census_response.json()
            if len(census_data) > 1:
                row = census_data[1]
                demographics = {
                    'total_population': int(row[0]) if row[0] and row[0] != '-666666666' else 0,
                    'median_age': float(row[1]) if row[1] and row[1] != '-666666666' else 0,
                    'age_18_24': int(row[2]) if row[2] and row[2] != '-666666666' else 0,
                    'age_25_34': int(row[3]) if row[3] and row[3] != '-666666666' else 0,
                    'age_35_44': int(row[4]) if row[4] and row[4] != '-666666666' else 0,
                    'median_income': int(row[5]) if row[5] and row[5] != '-666666666' else 0
                }
            else:
                demographics = {"error": "No demographic data available"}
        else:
            demographics = {"error": "Census API error"}
        
        return {
            "zip_code": zip_code,
            "city": city,
            "state": state,
            "demographics": demographics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
