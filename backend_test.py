
import requests
import json
import sys
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
import uuid

# Base URL from frontend/.env
BASE_URL = "http://localhost:8001"
API_BASE_URL = f"{BASE_URL}/api"

def print_separator(title: str):
    """Print a separator with a title."""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80 + "\n")

def test_backend_root():
    """Test if the backend root endpoint is responding"""
    try:
        response = requests.get(f"{API_BASE_URL}/")
        print(f"\n1. Testing backend root endpoint: {API_BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing backend root: {str(e)}")
        return False

# =============================================================================
# STEP 1: OBJECTIVES API TESTS
# =============================================================================

def test_objective_types():
    """Test GET /api/objectives/types endpoint"""
    print_separator("Testing GET /api/objectives/types endpoint")
    
    try:
        response = requests.get(f"{API_BASE_URL}/objectives/types")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        if "objective_types" not in data or "primary_kpis" not in data or "secondary_kpis" not in data:
            print("❌ Test failed: Response missing required fields")
            return False
        
        # Validate objective types
        objective_types = data.get("objective_types", [])
        if not objective_types or len(objective_types) == 0:
            print("❌ Test failed: No objective types returned")
            return False
        
        # Check if objective types have required fields
        first_objective = objective_types[0]
        required_fields = ["value", "label", "description"]
        for field in required_fields:
            if field not in first_objective:
                print(f"❌ Test failed: Objective type missing required field '{field}'")
                return False
        
        # Validate KPIs
        primary_kpis = data.get("primary_kpis", [])
        secondary_kpis = data.get("secondary_kpis", [])
        
        if not primary_kpis or len(primary_kpis) == 0:
            print("❌ Test failed: No primary KPIs returned")
            return False
        
        if not secondary_kpis or len(secondary_kpis) == 0:
            print("❌ Test failed: No secondary KPIs returned")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_objective_validation():
    """Test POST /api/objectives/validate endpoint"""
    print_separator("Testing POST /api/objectives/validate endpoint")
    
    try:
        # Test with valid objective
        valid_objective = {
            "type": "conversions",
            "primary_kpi": "purchase",
            "secondary_kpis": ["view_content", "add_to_cart"],
            "measurement_window": 14,
            "expected_lift": 0.1
        }
        
        print("\n--- Testing with valid objective ---")
        response = requests.post(f"{API_BASE_URL}/objectives/validate", json=valid_objective)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["valid", "recommendations", "estimated_timeline"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Test with invalid objective (missing primary KPI)
        invalid_objective = {
            "type": "conversions",
            "primary_kpi": "",
            "secondary_kpis": ["view_content"],
            "measurement_window": 14
        }
        
        print("\n--- Testing with invalid objective (missing primary KPI) ---")
        response = requests.post(f"{API_BASE_URL}/objectives/validate", json=invalid_objective)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            print(f"❌ Test failed: Expected status code 400, got {response.status_code}")
            return False
        
        # Test with invalid measurement window
        invalid_window_objective = {
            "type": "conversions",
            "primary_kpi": "purchase",
            "secondary_kpis": ["view_content"],
            "measurement_window": 100,  # Too long
            "expected_lift": 0.1
        }
        
        print("\n--- Testing with invalid measurement window (too long) ---")
        response = requests.post(f"{API_BASE_URL}/objectives/validate", json=invalid_window_objective)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            print(f"❌ Test failed: Expected status code 400, got {response.status_code}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

# =============================================================================
# STEP 2: BUDGET API TESTS
# =============================================================================

def test_budget_validation():
    """Test POST /api/budget/validate endpoint"""
    print_separator("Testing POST /api/budget/validate endpoint")
    
    try:
        # Test with valid budget
        valid_budget = {
            "total_budget": 10000,
            "daily_budget": 500,
            "duration_days": 20,
            "min_spend_threshold": 1000,
            "allocation_method": "equal"
        }
        
        print("\n--- Testing with valid budget ---")
        response = requests.post(f"{API_BASE_URL}/budget/validate", json=valid_budget)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["valid", "warnings", "recommendations", "estimated_reach"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Test with invalid budget (daily_budget * duration_days != total_budget)
        invalid_budget = {
            "total_budget": 10000,
            "daily_budget": 400,  # Should be 500 for 20 days
            "duration_days": 20,
            "min_spend_threshold": 1000,
            "allocation_method": "equal"
        }
        
        print("\n--- Testing with invalid budget (inconsistent values) ---")
        response = requests.post(f"{API_BASE_URL}/budget/validate", json=invalid_budget)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            print(f"❌ Test failed: Expected status code 400, got {response.status_code}")
            return False
        
        # Test with low budget (should give warnings)
        low_budget = {
            "total_budget": 4000,
            "daily_budget": 80,
            "duration_days": 50,
            "min_spend_threshold": 1000,
            "allocation_method": "equal"
        }
        
        print("\n--- Testing with low budget (should give warnings) ---")
        response = requests.post(f"{API_BASE_URL}/budget/validate", json=low_budget)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Should have warnings
        if not data.get("warnings", []):
            print("❌ Test failed: Expected warnings for low budget")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_budget_recommendations():
    """Test GET /api/budget/recommendations endpoint"""
    print_separator("Testing GET /api/budget/recommendations endpoint")
    
    try:
        # Test with valid parameters
        print("\n--- Testing with valid parameters ---")
        params = {
            "objective_type": "conversions",
            "target_population": 200000
        }
        
        response = requests.get(f"{API_BASE_URL}/budget/recommendations", params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["objective_type", "target_population", "recommendations", "rationale"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Validate recommendations structure
        recommendations = data.get("recommendations", {})
        recommendation_fields = [
            "minimum_daily_budget", "recommended_daily_budget", 
            "minimum_duration_days", "recommended_duration_days",
            "minimum_total_budget", "recommended_total_budget"
        ]
        
        for field in recommendation_fields:
            if field not in recommendations:
                print(f"❌ Test failed: Recommendations missing required field '{field}'")
                return False
        
        # Test with invalid objective type
        print("\n--- Testing with invalid objective type ---")
        params = {
            "objective_type": "invalid_type",
            "target_population": 100000
        }
        
        response = requests.get(f"{API_BASE_URL}/budget/recommendations", params=params)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            print(f"❌ Test failed: Expected status code 400, got {response.status_code}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

# =============================================================================
# STEP 3: MARKET SELECTION API TESTS
# =============================================================================

def test_meta_geographic_units():
    """Test GET /api/markets/meta-units endpoint"""
    print_separator("Testing GET /api/markets/meta-units endpoint")
    
    try:
        # Test with default account ID
        print("\n--- Testing with default account ID ---")
        response = requests.get(f"{API_BASE_URL}/markets/meta-units")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)[:500]}...")  # Print first 500 chars
        
        # Validate response structure
        required_fields = ["account_id", "total_units", "units", "summary"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Validate units data
        units = data.get("units", [])
        if not units or len(units) == 0:
            print("❌ Test failed: No units returned")
            return False
        
        # Validate first unit structure
        first_unit = units[0]
        unit_fields = [
            "id", "name", "type", "population", "historical_conversions", 
            "historical_spend", "historical_revenue", "conversion_rate", 
            "cpm", "ctr"
        ]
        
        for field in unit_fields:
            if field not in first_unit:
                print(f"❌ Test failed: Unit missing required field '{field}'")
                return False
        
        # Validate summary structure
        summary = data.get("summary", {})
        summary_fields = ["total_population", "total_conversions", "total_spend", "average_conversion_rate"]
        
        for field in summary_fields:
            if field not in summary:
                print(f"❌ Test failed: Summary missing required field '{field}'")
                return False
        
        # Test with specific account ID
        print("\n--- Testing with specific account ID ---")
        params = {"account_id": "act_987654321"}
        
        response = requests.get(f"{API_BASE_URL}/markets/meta-units", params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response account_id: {data.get('account_id')}")
        
        if data.get("account_id") != "act_987654321":
            print(f"❌ Test failed: Expected account_id 'act_987654321', got '{data.get('account_id')}'")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_auto_select_markets():
    """Test POST /api/markets/auto-select endpoint"""
    print_separator("Testing POST /api/markets/auto-select endpoint")
    
    try:
        # Test with valid parameters
        valid_params = {
            "account_id": "act_123456789",
            "min_conversions": 50,
            "min_spend": 1000,
            "similarity_threshold": 0.7,
            "target_size": 20
        }
        
        print("\n--- Testing with valid parameters ---")
        response = requests.post(f"{API_BASE_URL}/markets/auto-select", json=valid_params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)[:500]}...")  # Print first 500 chars
        
        # Validate response structure
        required_fields = ["account_id", "selection_criteria", "results", "summary"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Validate results structure
        results = data.get("results", {})
        results_fields = ["total_available", "filtered_count", "selected_count", "selected_units"]
        
        for field in results_fields:
            if field not in results:
                print(f"❌ Test failed: Results missing required field '{field}'")
                return False
        
        # Validate summary structure
        summary = data.get("summary", {})
        summary_fields = ["total_population", "total_conversions", "total_spend", "conversion_rate_range"]
        
        for field in summary_fields:
            if field not in summary:
                print(f"❌ Test failed: Summary missing required field '{field}'")
                return False
        
        # Test with high thresholds (should return error)
        high_threshold_params = {
            "account_id": "act_123456789",
            "min_conversions": 5000,  # Very high
            "min_spend": 100000,      # Very high
            "similarity_threshold": 0.7,
            "target_size": 20
        }
        
        print("\n--- Testing with high thresholds (should return error) ---")
        response = requests.post(f"{API_BASE_URL}/markets/auto-select", json=high_threshold_params)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            print(f"❌ Test failed: Expected status code 400, got {response.status_code}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_market_similarity_analysis():
    """Test POST /api/markets/similarity-analysis endpoint"""
    print_separator("Testing POST /api/markets/similarity-analysis endpoint")
    
    try:
        # First get some geographic units to use in the test
        response = requests.get(f"{API_BASE_URL}/markets/meta-units")
        if response.status_code != 200:
            print(f"❌ Test failed: Could not get geographic units for testing")
            return False
        
        units_data = response.json()
        units = units_data.get("units", [])[:5]  # Get first 5 units
        
        if not units or len(units) < 2:
            print("❌ Test failed: Not enough units for similarity analysis test")
            return False
        
        # Test with valid units
        print("\n--- Testing with valid units ---")
        response = requests.post(f"{API_BASE_URL}/markets/similarity-analysis", json=units)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["units", "similarity_matrix", "overall_similarity", "analysis"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Validate similarity matrix dimensions
        similarity_matrix = data.get("similarity_matrix", [])
        if len(similarity_matrix) != len(units):
            print(f"❌ Test failed: Similarity matrix rows ({len(similarity_matrix)}) don't match number of units ({len(units)})")
            return False
        
        if len(similarity_matrix[0]) != len(units):
            print(f"❌ Test failed: Similarity matrix columns ({len(similarity_matrix[0])}) don't match number of units ({len(units)})")
            return False
        
        # Validate analysis structure
        analysis = data.get("analysis", {})
        analysis_fields = ["high_similarity_pairs", "recommendation"]
        
        for field in analysis_fields:
            if field not in analysis:
                print(f"❌ Test failed: Analysis missing required field '{field}'")
                return False
        
        # Test with only one unit (should return error)
        print("\n--- Testing with only one unit (should return error) ---")
        response = requests.post(f"{API_BASE_URL}/markets/similarity-analysis", json=[units[0]])
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            print(f"❌ Test failed: Expected status code 400, got {response.status_code}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

# =============================================================================
# STEP 4: STATISTICAL ANALYSIS API TESTS
# =============================================================================

def test_optimize_geo_assignment():
    """Test POST /api/analysis/optimize-assignment endpoint"""
    print_separator("Testing POST /api/analysis/optimize-assignment endpoint")
    
    try:
        # First get some geographic units to use in the test
        response = requests.get(f"{API_BASE_URL}/markets/meta-units")
        if response.status_code != 200:
            print(f"❌ Test failed: Could not get geographic units for testing")
            return False
        
        units_data = response.json()
        units = units_data.get("units", [])[:10]  # Get first 10 units
        
        if not units or len(units) < 4:
            print("❌ Test failed: Not enough units for optimization test")
            return False
        
        # Test with valid optimization request
        optimization_request = {
            "available_units": units,
            "objectives": ["conversion_rate", "population"],
            "constraints": {"min_units_per_group": 2},
            "treatment_percentage": 0.5
        }
        
        print("\n--- Testing with valid optimization request ---")
        response = requests.post(f"{API_BASE_URL}/analysis/optimize-assignment", json=optimization_request)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["treatment_units", "control_units", "balance_metrics", "optimization_score", "iterations", "convergence_achieved"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Validate treatment and control units
        treatment_units = data.get("treatment_units", [])
        control_units = data.get("control_units", [])
        
        if not treatment_units or len(treatment_units) == 0:
            print("❌ Test failed: No treatment units returned")
            return False
        
        if not control_units or len(control_units) == 0:
            print("❌ Test failed: No control units returned")
            return False
        
        # Validate balance metrics
        balance_metrics = data.get("balance_metrics", {})
        if not balance_metrics:
            print("❌ Test failed: No balance metrics returned")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_power_analysis():
    """Test POST /api/analysis/power-analysis endpoint"""
    print_separator("Testing POST /api/analysis/power-analysis endpoint")
    
    try:
        # First get some geographic units to use in the test
        response = requests.get(f"{API_BASE_URL}/markets/meta-units")
        if response.status_code != 200:
            print(f"❌ Test failed: Could not get geographic units for testing")
            return False
        
        units_data = response.json()
        all_units = units_data.get("units", [])
        
        if not all_units or len(all_units) < 4:
            print("❌ Test failed: Not enough units for power analysis test")
            return False
        
        # Create test and control groups
        treatment_units = all_units[:5]  # First 5 units
        control_units = all_units[5:10]  # Next 5 units
        
        treatment_group = {
            "group_id": str(uuid.uuid4()),
            "group_type": "treatment",
            "units": treatment_units,
            "total_population": sum(unit["population"] for unit in treatment_units),
            "historical_metrics": {
                "conversions": sum(unit["historical_conversions"] for unit in treatment_units),
                "spend": sum(unit["historical_spend"] for unit in treatment_units),
                "revenue": sum(unit["historical_revenue"] for unit in treatment_units)
            },
            "allocation_percentage": 0.5
        }
        
        control_group = {
            "group_id": str(uuid.uuid4()),
            "group_type": "control",
            "units": control_units,
            "total_population": sum(unit["population"] for unit in control_units),
            "historical_metrics": {
                "conversions": sum(unit["historical_conversions"] for unit in control_units),
                "spend": sum(unit["historical_spend"] for unit in control_units),
                "revenue": sum(unit["historical_revenue"] for unit in control_units)
            },
            "allocation_percentage": 0.5
        }
        
        # Test with valid power analysis request
        power_request = {
            "treatment_group": treatment_group,
            "control_group": control_group,
            "expected_effect": 0.1
        }
        
        print("\n--- Testing with valid power analysis request ---")
        response = requests.post(f"{API_BASE_URL}/analysis/power-analysis", json=power_request)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["mse", "variance", "bias", "coverage", "power", "significance_level", "minimum_detectable_effect"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Validate power value
        power = data.get("power", 0)
        if not isinstance(power, (int, float)) or power < 0 or power > 1:
            print(f"❌ Test failed: Invalid power value: {power}")
            return False
        
        # Validate minimum detectable effect
        mde = data.get("minimum_detectable_effect", 0)
        if not isinstance(mde, (int, float)) or mde <= 0:
            print(f"❌ Test failed: Invalid minimum detectable effect value: {mde}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_quality_validation():
    """Test POST /api/analysis/quality-validation endpoint"""
    print_separator("Testing POST /api/analysis/quality-validation endpoint")
    
    try:
        # First get some geographic units to use in the test
        response = requests.get(f"{API_BASE_URL}/markets/meta-units")
        if response.status_code != 200:
            print(f"❌ Test failed: Could not get geographic units for testing")
            return False
        
        units_data = response.json()
        all_units = units_data.get("units", [])
        
        if not all_units or len(all_units) < 4:
            print("❌ Test failed: Not enough units for quality validation test")
            return False
        
        # Create test and control groups
        treatment_units = all_units[:5]  # First 5 units
        control_units = all_units[5:10]  # Next 5 units
        
        treatment_group = {
            "group_id": str(uuid.uuid4()),
            "group_type": "treatment",
            "units": treatment_units,
            "total_population": sum(unit["population"] for unit in treatment_units),
            "historical_metrics": {
                "conversions": sum(unit["historical_conversions"] for unit in treatment_units),
                "spend": sum(unit["historical_spend"] for unit in treatment_units),
                "revenue": sum(unit["historical_revenue"] for unit in treatment_units)
            },
            "allocation_percentage": 0.5
        }
        
        control_group = {
            "group_id": str(uuid.uuid4()),
            "group_type": "control",
            "units": control_units,
            "total_population": sum(unit["population"] for unit in control_units),
            "historical_metrics": {
                "conversions": sum(unit["historical_conversions"] for unit in control_units),
                "spend": sum(unit["historical_spend"] for unit in control_units),
                "revenue": sum(unit["historical_revenue"] for unit in control_units)
            },
            "allocation_percentage": 0.5
        }
        
        # Create budget configuration
        budget_config = {
            "total_budget": 10000,
            "daily_budget": 500,
            "duration_days": 20,
            "min_spend_threshold": 1000,
            "allocation_method": "equal"
        }
        
        # Get statistical metrics
        power_request = {
            "treatment_group": treatment_group,
            "control_group": control_group,
            "expected_effect": 0.1
        }
        
        power_response = requests.post(f"{API_BASE_URL}/analysis/power-analysis", json=power_request)
        if power_response.status_code != 200:
            print(f"❌ Test failed: Could not get statistical metrics for testing")
            return False
        
        statistical_metrics = power_response.json()
        
        # Test with valid quality validation request
        quality_request = {
            "treatment_group": treatment_group,
            "control_group": control_group,
            "budget_config": budget_config,
            "statistical_metrics": statistical_metrics
        }
        
        print("\n--- Testing with valid quality validation request ---")
        response = requests.post(f"{API_BASE_URL}/analysis/quality-validation", json=quality_request)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = [
            "statistical_metrics", "balance_score", "sample_size_adequacy", 
            "spend_adequacy", "conversion_volume_adequacy", 
            "overall_quality_score", "recommendations", "warnings"
        ]
        
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Validate quality score
        quality_score = data.get("overall_quality_score", 0)
        if not isinstance(quality_score, (int, float)) or quality_score < 0 or quality_score > 100:
            print(f"❌ Test failed: Invalid quality score value: {quality_score}")
            return False
        
        # Validate recommendations and warnings
        recommendations = data.get("recommendations", [])
        warnings = data.get("warnings", [])
        
        if not isinstance(recommendations, list):
            print(f"❌ Test failed: Recommendations should be a list")
            return False
        
        if not isinstance(warnings, list):
            print(f"❌ Test failed: Warnings should be a list")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

# =============================================================================
# STEP 5: ENHANCED TEST MANAGEMENT API TESTS
# =============================================================================

def test_create_enhanced_test():
    """Test POST /api/tests/create-enhanced endpoint"""
    print_separator("Testing POST /api/tests/create-enhanced endpoint")
    
    try:
        # First get some geographic units to use in the test
        response = requests.get(f"{API_BASE_URL}/markets/meta-units")
        if response.status_code != 200:
            print(f"❌ Test failed: Could not get geographic units for testing")
            return (False, None)
        
        units_data = response.json()
        all_units = units_data.get("units", [])
        
        if not all_units or len(all_units) < 4:
            print("❌ Test failed: Not enough units for test creation")
            return (False, None)
        
        # Create test data
        test_data = {
            "name": f"Test Geo Lift {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "description": "Test description for enhanced geo lift test",
            "objective": {
                "type": "conversions",
                "primary_kpi": "purchase",
                "secondary_kpis": ["view_content", "add_to_cart"],
                "measurement_window": 14,
                "expected_lift": 0.1
            },
            "budget": {
                "total_budget": 10000,
                "daily_budget": 500,
                "duration_days": 20,
                "min_spend_threshold": 1000,
                "allocation_method": "equal"
            },
            "market_selection": {
                "method": "manual",
                "selected_units": [unit["id"] for unit in all_units[:10]],
                "criteria": {"min_population": 10000}
            }
        }
        
        print("\n--- Testing with valid test data ---")
        response = requests.post(f"{API_BASE_URL}/tests/create-enhanced", json=test_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return (False, None)
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["test_id", "status", "message", "next_steps"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return (False, None)
        
        # Save test ID for other tests
        test_id = data.get("test_id")
        
        # Test with invalid test data (missing required fields)
        invalid_test_data = {
            "name": "Invalid Test",
            "description": "Missing required fields"
            # Missing objective, budget, and market_selection
        }
        
        print("\n--- Testing with invalid test data (missing required fields) ---")
        response = requests.post(f"{API_BASE_URL}/tests/create-enhanced", json=invalid_test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 400:
            print(f"❌ Test failed: Expected status code 400, got {response.status_code}")
            return (False, None)
        
        print("✅ Test passed")
        return (True, test_id)
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return (False, None)

def test_get_enhanced_tests():
    """Test GET /api/tests/enhanced endpoint"""
    print_separator("Testing GET /api/tests/enhanced endpoint")
    
    try:
        response = requests.get(f"{API_BASE_URL}/tests/enhanced")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)[:500]}...")  # Print first 500 chars
        
        # Validate response structure
        if "tests" not in data or "total" not in data:
            print("❌ Test failed: Response missing required fields")
            return False
        
        # Validate tests data
        tests = data.get("tests", [])
        if not isinstance(tests, list):
            print("❌ Test failed: Tests should be a list")
            return False
        
        # Check if total matches actual number of tests
        if data["total"] != len(tests):
            print(f"❌ Test failed: Total count ({data['total']}) doesn't match number of tests ({len(tests)})")
            return False
        
        print(f"✅ Test passed. Found {len(tests)} tests.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_get_specific_enhanced_test(test_id):
    """Test GET /api/tests/enhanced/{test_id} endpoint"""
    print_separator(f"Testing GET /api/tests/enhanced/{test_id} endpoint")
    
    if not test_id:
        print("❌ Test skipped: No test ID provided")
        return False
    
    try:
        response = requests.get(f"{API_BASE_URL}/tests/enhanced/{test_id}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["test_id", "name", "description", "objective", "budget", "market_selection", "status"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Validate test ID
        if data.get("test_id") != test_id:
            print(f"❌ Test failed: Retrieved test ID ({data.get('test_id')}) doesn't match requested ID ({test_id})")
            return False
        
        # Test with non-existent test ID
        non_existent_id = str(uuid.uuid4())
        print(f"\n--- Testing with non-existent test ID: {non_existent_id} ---")
        response = requests.get(f"{API_BASE_URL}/tests/enhanced/{non_existent_id}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 404:
            print(f"❌ Test failed: Expected status code 404, got {response.status_code}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_update_statistical_analysis(test_id):
    """Test PUT /api/tests/enhanced/{test_id}/statistical-analysis endpoint"""
    print_separator(f"Testing PUT /api/tests/enhanced/{test_id}/statistical-analysis endpoint")
    
    if not test_id:
        print("❌ Test skipped: No test ID provided")
        return False
    
    try:
        # First get some geographic units to use in the test
        response = requests.get(f"{API_BASE_URL}/markets/meta-units")
        if response.status_code != 200:
            print(f"❌ Test failed: Could not get geographic units for testing")
            return False
        
        units_data = response.json()
        all_units = units_data.get("units", [])
        
        if not all_units or len(all_units) < 4:
            print("❌ Test failed: Not enough units for statistical analysis update")
            return False
        
        # Create test and control groups
        treatment_units = all_units[:5]  # First 5 units
        control_units = all_units[5:10]  # Next 5 units
        
        treatment_group = {
            "group_id": str(uuid.uuid4()),
            "group_type": "treatment",
            "units": treatment_units,
            "total_population": sum(unit["population"] for unit in treatment_units),
            "historical_metrics": {
                "conversions": sum(unit["historical_conversions"] for unit in treatment_units),
                "spend": sum(unit["historical_spend"] for unit in treatment_units),
                "revenue": sum(unit["historical_revenue"] for unit in treatment_units)
            },
            "allocation_percentage": 0.5
        }
        
        control_group = {
            "group_id": str(uuid.uuid4()),
            "group_type": "control",
            "units": control_units,
            "total_population": sum(unit["population"] for unit in control_units),
            "historical_metrics": {
                "conversions": sum(unit["historical_conversions"] for unit in control_units),
                "spend": sum(unit["historical_spend"] for unit in control_units),
                "revenue": sum(unit["historical_revenue"] for unit in control_units)
            },
            "allocation_percentage": 0.5
        }
        
        # Create quality indicators
        quality_indicators = {
            "statistical_metrics": {
                "mse": 0.001,
                "variance": 0.002,
                "bias": 0.0,
                "coverage": 0.95,
                "power": 0.85,
                "significance_level": 0.05,
                "minimum_detectable_effect": 0.03
            },
            "balance_score": 85.5,
            "sample_size_adequacy": True,
            "spend_adequacy": True,
            "conversion_volume_adequacy": True,
            "overall_quality_score": 87.2,
            "recommendations": ["Consider extending test duration for higher power"],
            "warnings": []
        }
        
        # Test with valid update data
        update_data = {
            "treatment_group": treatment_group,
            "control_group": control_group,
            "quality_indicators": quality_indicators
        }
        
        print("\n--- Testing with valid update data ---")
        response = requests.put(f"{API_BASE_URL}/tests/enhanced/{test_id}/statistical-analysis", json=update_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["status", "message"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Test with non-existent test ID
        non_existent_id = str(uuid.uuid4())
        print(f"\n--- Testing with non-existent test ID: {non_existent_id} ---")
        response = requests.put(f"{API_BASE_URL}/tests/enhanced/{non_existent_id}/statistical-analysis", json=update_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 404:
            print(f"❌ Test failed: Expected status code 404, got {response.status_code}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_approve_enhanced_test(test_id):
    """Test PUT /api/tests/enhanced/{test_id}/approve endpoint"""
    print_separator(f"Testing PUT /api/tests/enhanced/{test_id}/approve endpoint")
    
    if not test_id:
        print("❌ Test skipped: No test ID provided")
        return False
    
    try:
        print("\n--- Testing with valid test ID ---")
        response = requests.put(f"{API_BASE_URL}/tests/enhanced/{test_id}/approve")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["status", "message"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Test with non-existent test ID
        non_existent_id = str(uuid.uuid4())
        print(f"\n--- Testing with non-existent test ID: {non_existent_id} ---")
        response = requests.put(f"{API_BASE_URL}/tests/enhanced/{non_existent_id}/approve")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 404:
            print(f"❌ Test failed: Expected status code 404, got {response.status_code}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_launch_meta_campaign(test_id):
    """Test POST /api/tests/enhanced/{test_id}/launch-meta-campaign endpoint"""
    print_separator(f"Testing POST /api/tests/enhanced/{test_id}/launch-meta-campaign endpoint")
    
    if not test_id:
        print("❌ Test skipped: No test ID provided")
        return False
    
    try:
        # Create campaign configuration
        campaign_config = {
            "campaign_name": f"Meta Campaign {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "campaign_objective": "CONVERSIONS",
            "special_ad_categories": [],
            "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
            "daily_budget": 500,
            "start_time": (datetime.now() + timedelta(days=1)).isoformat(),
            "end_time": (datetime.now() + timedelta(days=21)).isoformat(),
            "targeting": {
                "geo_locations": {
                    "countries": ["US"],
                    "regions": [{"key": "4081"}],
                    "cities": [{"key": "777934", "radius": 10, "distance_unit": "mile"}],
                    "zips": [{"key": "US:90210"}]
                },
                "age_min": 18,
                "age_max": 65,
                "genders": [1, 2],
                "interests": ["6003232518672"]
            }
        }
        
        print("\n--- Testing with valid campaign configuration ---")
        response = requests.post(f"{API_BASE_URL}/tests/enhanced/{test_id}/launch-meta-campaign", json=campaign_config)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["status", "campaign_id", "message", "test_id", "launch_time"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Test with non-existent test ID
        non_existent_id = str(uuid.uuid4())
        print(f"\n--- Testing with non-existent test ID: {non_existent_id} ---")
        response = requests.post(f"{API_BASE_URL}/tests/enhanced/{non_existent_id}/launch-meta-campaign", json=campaign_config)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 404:
            print(f"❌ Test failed: Expected status code 404, got {response.status_code}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

# =============================================================================
# LEGACY ENDPOINTS TESTS
# =============================================================================

def test_zip_lookup_endpoint():
    """Test the legacy /api/zip-lookup/{zip_code} endpoint"""
    print_separator("Testing Legacy /api/zip-lookup/{zip_code} endpoint")
    
    try:
        # Test with valid ZIP code
        zip_code = "10001"  # New York
        print(f"\n--- Testing with valid ZIP code: {zip_code} ---")
        response = requests.get(f"{API_BASE_URL}/zip-lookup/{zip_code}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ["zip_code", "city", "state", "demographics"]
        for field in required_fields:
            if field not in data:
                print(f"❌ Test failed: Response missing required field '{field}'")
                return False
        
        # Validate demographics structure
        demographics = data.get("demographics", {})
        demo_fields = ["total_population", "median_age", "median_income"]
        
        for field in demo_fields:
            if field not in demographics:
                print(f"❌ Test failed: Demographics missing required field '{field}'")
                return False
        
        # Test with invalid ZIP code
        invalid_zip = "abcde"
        print(f"\n--- Testing with invalid ZIP code: {invalid_zip} ---")
        response = requests.get(f"{API_BASE_URL}/zip-lookup/{invalid_zip}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code != 404:
            print(f"❌ Test failed: Expected status code 404, got {response.status_code}")
            return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

# =============================================================================
# MAIN TEST RUNNER
# =============================================================================

def run_all_tests():
    """Run all tests and return results"""
    results = {
        "backend_root": False,
        
        # Step 1: Objectives API
        "objective_types": False,
        "objective_validation": False,
        
        # Step 2: Budget API
        "budget_validation": False,
        "budget_recommendations": False,
        
        # Step 3: Market Selection API
        "meta_geographic_units": False,
        "auto_select_markets": False,
        "market_similarity_analysis": False,
        
        # Step 4: Statistical Analysis API
        "optimize_geo_assignment": False,
        "power_analysis": False,
        "quality_validation": False,
        
        # Step 5: Enhanced Test Management
        "create_enhanced_test": False,
        "get_enhanced_tests": False,
        "get_specific_enhanced_test": False,
        "update_statistical_analysis": False,
        "approve_enhanced_test": False,
        "launch_meta_campaign": False,
        
        # Legacy Endpoints
        "zip_lookup_endpoint": False
    }
    
    print("=== Starting Enhanced BCM VentasAI Optimize Backend API Tests ===")
    print(f"Testing API at: {API_BASE_URL}")
    
    # Test backend root
    results["backend_root"] = test_backend_root()
    
    # Step 1: Objectives API Tests
    results["objective_types"] = test_objective_types()
    results["objective_validation"] = test_objective_validation()
    
    # Step 2: Budget API Tests
    results["budget_validation"] = test_budget_validation()
    results["budget_recommendations"] = test_budget_recommendations()
    
    # Step 3: Market Selection API Tests
    results["meta_geographic_units"] = test_meta_geographic_units()
    results["auto_select_markets"] = test_auto_select_markets()
    results["market_similarity_analysis"] = test_market_similarity_analysis()
    
    # Step 4: Statistical Analysis API Tests
    results["optimize_geo_assignment"] = test_optimize_geo_assignment()
    results["power_analysis"] = test_power_analysis()
    results["quality_validation"] = test_quality_validation()
    
    # Step 5: Enhanced Test Management Tests
    create_test_result, test_id = test_create_enhanced_test()
    results["create_enhanced_test"] = create_test_result
    
    results["get_enhanced_tests"] = test_get_enhanced_tests()
    
    if test_id:
        results["get_specific_enhanced_test"] = test_get_specific_enhanced_test(test_id)
        results["update_statistical_analysis"] = test_update_statistical_analysis(test_id)
        results["approve_enhanced_test"] = test_approve_enhanced_test(test_id)
        results["launch_meta_campaign"] = test_launch_meta_campaign(test_id)
    
    # Legacy Endpoints Tests
    results["zip_lookup_endpoint"] = test_zip_lookup_endpoint()
    
    # Print summary
    print("\n=== Test Results Summary ===")
    
    print("\nStep 1: Objectives API")
    print(f"GET /api/objectives/types: {'✅' if results['objective_types'] else '❌'}")
    print(f"POST /api/objectives/validate: {'✅' if results['objective_validation'] else '❌'}")
    
    print("\nStep 2: Budget API")
    print(f"POST /api/budget/validate: {'✅' if results['budget_validation'] else '❌'}")
    print(f"GET /api/budget/recommendations: {'✅' if results['budget_recommendations'] else '❌'}")
    
    print("\nStep 3: Market Selection API")
    print(f"GET /api/markets/meta-units: {'✅' if results['meta_geographic_units'] else '❌'}")
    print(f"POST /api/markets/auto-select: {'✅' if results['auto_select_markets'] else '❌'}")
    print(f"POST /api/markets/similarity-analysis: {'✅' if results['market_similarity_analysis'] else '❌'}")
    
    print("\nStep 4: Statistical Analysis API")
    print(f"POST /api/analysis/optimize-assignment: {'✅' if results['optimize_geo_assignment'] else '❌'}")
    print(f"POST /api/analysis/power-analysis: {'✅' if results['power_analysis'] else '❌'}")
    print(f"POST /api/analysis/quality-validation: {'✅' if results['quality_validation'] else '❌'}")
    
    print("\nStep 5: Enhanced Test Management")
    print(f"POST /api/tests/create-enhanced: {'✅' if results['create_enhanced_test'] else '❌'}")
    print(f"GET /api/tests/enhanced: {'✅' if results['get_enhanced_tests'] else '❌'}")
    print(f"GET /api/tests/enhanced/{'{test_id}'}: {'✅' if results['get_specific_enhanced_test'] else '❌'}")
    print(f"PUT /api/tests/enhanced/{'{test_id}'}/statistical-analysis: {'✅' if results['update_statistical_analysis'] else '❌'}")
    print(f"PUT /api/tests/enhanced/{'{test_id}'}/approve: {'✅' if results['approve_enhanced_test'] else '❌'}")
    print(f"POST /api/tests/enhanced/{'{test_id}'}/launch-meta-campaign: {'✅' if results['launch_meta_campaign'] else '❌'}")
    
    print("\nLegacy Endpoints")
    print(f"GET /api/zip-lookup/{'{zip_code}'}: {'✅' if results['zip_lookup_endpoint'] else '❌'}")
    
    # Overall result
    all_passed = all(results.values())
    print(f"\nOverall Result: {'✅ All tests passed!' if all_passed else '❌ Some tests failed.'}")
    
    return results

if __name__ == "__main__":
    run_all_tests()
