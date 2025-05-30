
import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional

# Base URL from frontend/.env
BASE_URL = "https://2e6a8e6e-d1d4-4773-8628-eee77b08df7f.preview.emergentagent.com"
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

def test_status_endpoint_get():
    """Test the GET /api/status endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/status")
        print(f"\n2. Testing GET /api/status endpoint")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing GET /api/status: {str(e)}")
        return False

def test_status_endpoint_post():
    """Test the POST /api/status endpoint"""
    try:
        data = {"client_name": f"Test Client {datetime.now().isoformat()}"}
        response = requests.post(f"{API_BASE_URL}/status", json=data)
        print(f"\n3. Testing POST /api/status endpoint")
        print(f"Request Data: {data}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing POST /api/status: {str(e)}")
        return False

def test_states_endpoint():
    """Test the /api/geographic/states endpoint."""
    print_separator("Testing /api/geographic/states endpoint")
    
    try:
        response = requests.get(f"{API_BASE_URL}/geographic/states")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)[:500]}...")  # Print first 500 chars
        
        # Validate response structure
        if "regions" not in data or "count" not in data or "source" not in data:
            print("❌ Test failed: Response missing required fields")
            return False
        
        # Validate regions data
        regions = data.get("regions", [])
        if not regions or len(regions) == 0:
            print("❌ Test failed: No regions returned")
            return False
        
        # Check if count matches actual number of regions
        if data["count"] != len(regions):
            print(f"❌ Test failed: Count ({data['count']}) doesn't match number of regions ({len(regions)})")
            return False
        
        # Validate first region structure
        first_region = regions[0]
        required_fields = ["id", "name", "source", "demographics", "lastUpdated"]
        for field in required_fields:
            if field not in first_region:
                print(f"❌ Test failed: Region missing required field '{field}'")
                return False
        
        # Validate demographics structure
        demographics = first_region.get("demographics", {})
        demo_fields = [
            "medianAge", "medianIncome", "populationDensity", "householdSize",
            "collegeEducated", "unemploymentRate", "whiteCollarJobs", "homeOwnership",
            "medianHomeValue", "rentBurden", "internetPenetration", "mobileUsage",
            "socialMediaUsage", "onlineShoppingIndex", "urbanizationLevel", "retailDensity",
            "competitionIndex", "tvConsumption", "digitalAdReceptivity", "brandLoyalty"
        ]
        for field in demo_fields:
            if field not in demographics:
                print(f"❌ Test failed: Demographics missing required field '{field}'")
                return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_dmas_endpoint():
    """Test the /api/geographic/dmas endpoint."""
    print_separator("Testing /api/geographic/dmas endpoint")
    
    try:
        response = requests.get(f"{API_BASE_URL}/geographic/dmas")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)[:500]}...")  # Print first 500 chars
        
        # Validate response structure
        if "regions" not in data or "count" not in data or "source" not in data:
            print("❌ Test failed: Response missing required fields")
            return False
        
        # Validate regions data
        regions = data.get("regions", [])
        if not regions or len(regions) == 0:
            print("❌ Test failed: No regions returned")
            return False
        
        # Check if count matches actual number of regions
        if data["count"] != len(regions):
            print(f"❌ Test failed: Count ({data['count']}) doesn't match number of regions ({len(regions)})")
            return False
        
        # Validate first region structure
        first_region = regions[0]
        required_fields = ["id", "name", "source", "demographics", "lastUpdated"]
        for field in required_fields:
            if field not in first_region:
                print(f"❌ Test failed: Region missing required field '{field}'")
                return False
        
        # Validate demographics structure (same as states)
        demographics = first_region.get("demographics", {})
        demo_fields = [
            "medianAge", "medianIncome", "populationDensity", "householdSize",
            "collegeEducated", "unemploymentRate", "whiteCollarJobs", "homeOwnership",
            "medianHomeValue", "rentBurden", "internetPenetration", "mobileUsage",
            "socialMediaUsage", "onlineShoppingIndex", "urbanizationLevel", "retailDensity",
            "competitionIndex", "tvConsumption", "digitalAdReceptivity", "brandLoyalty"
        ]
        for field in demo_fields:
            if field not in demographics:
                print(f"❌ Test failed: Demographics missing required field '{field}'")
                return False
        
        print("✅ Test passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_zip_endpoint():
    """Test the /api/geographic/zip/{zip_code} endpoint with improved DataUSA.io integration and fallback."""
    print_separator("Testing /api/geographic/zip/{zip_code} endpoint")
    
    results = {
        "valid_zip": False,
        "valid_zip_2": False,
        "invalid_zip": False,
        "nonexistent_zip": False
    }
    
    # Test with valid ZIP code (Manhattan, NY)
    print("\n--- Testing with valid ZIP code (10001) ---")
    try:
        response = requests.get(f"{API_BASE_URL}/geographic/zip/10001")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
        else:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response structure
            required_fields = ["id", "name", "source", "demographics", "lastUpdated"]
            valid_structure = True
            for field in required_fields:
                if field not in data:
                    print(f"❌ Test failed: Response missing required field '{field}'")
                    valid_structure = False
                    break
            
            if valid_structure:
                # Validate demographics structure
                demographics = data.get("demographics", {})
                demo_fields = [
                    "medianAge", "medianIncome", "populationDensity", "householdSize",
                    "collegeEducated", "unemploymentRate", "whiteCollarJobs", "homeOwnership",
                    "medianHomeValue", "rentBurden", "internetPenetration", "mobileUsage",
                    "socialMediaUsage", "onlineShoppingIndex", "urbanizationLevel", "retailDensity",
                    "competitionIndex", "tvConsumption", "digitalAdReceptivity", "brandLoyalty"
                ]
                for field in demo_fields:
                    if field not in demographics:
                        print(f"❌ Test failed: Demographics missing required field '{field}'")
                        valid_structure = False
                        break
                
                # Check source field - should be either "DATAUSA_IO" or "FALLBACK_REALISTIC"
                source = data.get("source", "")
                if source not in ["DATAUSA_IO", "FALLBACK_REALISTIC"]:
                    print(f"❌ Test failed: Invalid source value: {source}")
                    valid_structure = False
                
                # Check name field format based on source
                name = data.get("name", "")
                if source == "DATAUSA_IO" and "(DataUSA.io)" not in name:
                    print(f"❌ Test failed: Name should include '(DataUSA.io)' for DATAUSA_IO source")
                    valid_structure = False
                elif source == "FALLBACK_REALISTIC" and "(Fallback Data)" not in name:
                    print(f"❌ Test failed: Name should include '(Fallback Data)' for FALLBACK_REALISTIC source")
                    valid_structure = False
            
            if valid_structure:
                print(f"✅ Test passed for valid ZIP code 10001 (Source: {data.get('source')})")
                results["valid_zip"] = True
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
    
    # Test with another valid ZIP code (Beverly Hills, CA)
    print("\n--- Testing with valid ZIP code (90210) ---")
    try:
        response = requests.get(f"{API_BASE_URL}/geographic/zip/90210")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
        else:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check source field - should be either "DATAUSA_IO" or "FALLBACK_REALISTIC"
            source = data.get("source", "")
            if source not in ["DATAUSA_IO", "FALLBACK_REALISTIC"]:
                print(f"❌ Test failed: Invalid source value: {source}")
            else:
                print(f"✅ Test passed for valid ZIP code 90210 (Source: {source})")
                results["valid_zip_2"] = True
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
    
    # Test with invalid ZIP code format
    print("\n--- Testing with invalid ZIP code format (abc) ---")
    try:
        response = requests.get(f"{API_BASE_URL}/geographic/zip/abc")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            print("✅ Test passed for invalid ZIP code format (received 400 as expected)")
            results["invalid_zip"] = True
        else:
            print(f"❌ Test failed: Expected status code 400, got {response.status_code}")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
    
    # Test with non-existent ZIP code (should now return fallback data instead of 404)
    print("\n--- Testing with non-existent ZIP code (00000) ---")
    try:
        response = requests.get(f"{API_BASE_URL}/geographic/zip/00000")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Expected status code 200 (with fallback data), got {response.status_code}")
            print(f"Response: {response.text}")
        else:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Should be using fallback data
            source = data.get("source", "")
            if source != "FALLBACK_REALISTIC":
                print(f"❌ Test failed: Expected source to be FALLBACK_REALISTIC, got {source}")
            else:
                print("✅ Test passed for non-existent ZIP code (received fallback data as expected)")
                results["nonexistent_zip"] = True
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
    
    # Overall result
    all_passed = all(results.values())
    if all_passed:
        print("\n✅ All ZIP code tests passed")
    else:
        print("\n❌ Some ZIP code tests failed")
        for test, result in results.items():
            print(f"  - {test}: {'✅' if result else '❌'}")
    
    return all_passed

def test_zips_endpoint():
    """Test the /api/geographic/zips endpoint with improved DataUSA.io integration and fallback."""
    print_separator("Testing /api/geographic/zips endpoint")
    
    results = {
        "valid_zips": False,
        "mixed_zips": False,
        "too_many_zips": False
    }
    
    # Test with multiple valid ZIP codes
    print("\n--- Testing with multiple valid ZIP codes (10001,90210,12345) ---")
    try:
        response = requests.get(f"{API_BASE_URL}/geographic/zips", params={"zip_codes": "10001,90210,12345"})
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
        else:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)[:500]}...")  # Print first 500 chars
            
            # Validate response structure
            if "regions" not in data or "count" not in data or "source" not in data:
                print("❌ Test failed: Response missing required fields")
            else:
                # Validate regions data
                regions = data.get("regions", [])
                if not regions or len(regions) == 0:
                    print("❌ Test failed: No regions returned")
                else:
                    # Check if count matches actual number of regions
                    if data["count"] != len(regions):
                        print(f"❌ Test failed: Count ({data['count']}) doesn't match number of regions ({len(regions)})")
                    else:
                        # Check if we got all three ZIP codes
                        zip_codes = [region.get("id") for region in regions]
                        if not all(zip_code in zip_codes for zip_code in ["10001", "90210", "12345"]):
                            print(f"❌ Test failed: Not all requested ZIP codes were returned. Got: {zip_codes}")
                        else:
                            # Check source field for each region
                            valid_sources = True
                            for region in regions:
                                source = region.get("source", "")
                                if source not in ["DATAUSA_IO", "FALLBACK_REALISTIC"]:
                                    print(f"❌ Test failed: Invalid source value for {region.get('id')}: {source}")
                                    valid_sources = False
                                    break
                                
                                # Check name field format based on source
                                name = region.get("name", "")
                                if source == "DATAUSA_IO" and "(DataUSA.io)" not in name:
                                    print(f"❌ Test failed: Name should include '(DataUSA.io)' for DATAUSA_IO source")
                                    valid_sources = False
                                    break
                                elif source == "FALLBACK_REALISTIC" and "(Fallback Data)" not in name:
                                    print(f"❌ Test failed: Name should include '(Fallback Data)' for FALLBACK_REALISTIC source")
                                    valid_sources = False
                                    break
                            
                            if valid_sources:
                                print("✅ Test passed for multiple valid ZIP codes")
                                results["valid_zips"] = True
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
    
    # Test with mix of valid and invalid ZIP codes
    print("\n--- Testing with mix of valid and invalid ZIP codes (10001,invalid,90210) ---")
    try:
        response = requests.get(f"{API_BASE_URL}/geographic/zips", params={"zip_codes": "10001,invalid,90210"})
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Test failed: Unexpected status code {response.status_code}")
            print(f"Response: {response.text}")
        else:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)[:500]}...")  # Print first 500 chars
            
            # We should still get results for the valid ZIP codes
            regions = data.get("regions", [])
            if not regions or len(regions) == 0:
                print("❌ Test failed: No regions returned")
            else:
                # Check if we got the valid ZIP codes
                zip_codes = [region.get("id") for region in regions]
                if not all(zip_code in zip_codes for zip_code in ["10001", "90210"]):
                    print(f"❌ Test failed: Not all valid ZIP codes were returned. Got: {zip_codes}")
                else:
                    print("✅ Test passed for mix of valid and invalid ZIP codes")
                    results["mixed_zips"] = True
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
    
    # Test with too many ZIP codes
    print("\n--- Testing with too many ZIP codes (51 codes) ---")
    try:
        too_many_zips = ",".join([str(i).zfill(5) for i in range(1, 52)])
        response = requests.get(f"{API_BASE_URL}/geographic/zips", params={"zip_codes": too_many_zips})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            print("✅ Test passed for too many ZIP codes (received 400 as expected)")
            results["too_many_zips"] = True
        else:
            print(f"❌ Test failed: Expected status code 400, got {response.status_code}")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
    
    # Overall result
    all_passed = all(results.values())
    if all_passed:
        print("\n✅ All multiple ZIP codes tests passed")
    else:
        print("\n❌ Some multiple ZIP codes tests failed")
        for test, result in results.items():
            print(f"  - {test}: {'✅' if result else '❌'}")
    
    return all_passed

def run_all_tests():
    """Run all tests and return results"""
    results = {
        "backend_responding": False,
        "status_get_working": False,
        "status_post_working": False,
        "states_endpoint_working": False,
        "dmas_endpoint_working": False,
        "zip_endpoint_working": False,
        "zips_endpoint_working": False
    }
    
    print("=== Starting Backend API Tests ===")
    print(f"Testing API at: {API_BASE_URL}")
    
    # Test 1: Backend responding
    results["backend_responding"] = test_backend_root()
    
    # Test 2: GET /api/status
    results["status_get_working"] = test_status_endpoint_get()
    
    # Test 3: POST /api/status
    results["status_post_working"] = test_status_endpoint_post()
    
    # Test 4: Geographic States Endpoint
    results["states_endpoint_working"] = test_states_endpoint()
    
    # Test 5: Geographic DMAs Endpoint
    results["dmas_endpoint_working"] = test_dmas_endpoint()
    
    # Test 6: Geographic ZIP Endpoint
    results["zip_endpoint_working"] = test_zip_endpoint()
    
    # Test 7: Geographic Multiple ZIPs Endpoint
    results["zips_endpoint_working"] = test_zips_endpoint()
    
    # Print summary
    print("\n=== Test Results Summary ===")
    print(f"Backend responding: {'✅' if results['backend_responding'] else '❌'}")
    print(f"GET /api/status working: {'✅' if results['status_get_working'] else '❌'}")
    print(f"POST /api/status working: {'✅' if results['status_post_working'] else '❌'}")
    print(f"GET /api/geographic/states working: {'✅' if results['states_endpoint_working'] else '❌'}")
    print(f"GET /api/geographic/dmas working: {'✅' if results['dmas_endpoint_working'] else '❌'}")
    print(f"GET /api/geographic/zip/{'{zip_code}'} working: {'✅' if results['zip_endpoint_working'] else '❌'}")
    print(f"GET /api/geographic/zips working: {'✅' if results['zips_endpoint_working'] else '❌'}")
    
    return results

if __name__ == "__main__":
    run_all_tests()
