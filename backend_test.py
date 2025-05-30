
import requests
import json
import sys
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://2e6a8e6e-d1d4-4773-8628-eee77b08df7f.preview.emergentagent.com"
API_BASE_URL = f"{BASE_URL}/api"

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

def check_geographic_endpoints():
    """Check if there are any geographic data endpoints available"""
    potential_endpoints = [
        "/api/geo",
        "/api/geographic",
        "/api/locations",
        "/api/maps",
        "/api/coordinates"
    ]
    
    print("\n4. Checking for geographic data endpoints")
    found_endpoints = []
    
    for endpoint in potential_endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            print(f"Testing {endpoint}: Status Code {response.status_code}")
            if response.status_code != 404:
                found_endpoints.append(endpoint)
                print(f"Response: {response.text[:200]}...")  # Print first 200 chars
        except Exception as e:
            print(f"Error testing {endpoint}: {str(e)}")
    
    if found_endpoints:
        print(f"Found geographic endpoints: {found_endpoints}")
    else:
        print("No geographic endpoints found")
    
    return found_endpoints

def run_all_tests():
    """Run all tests and return results"""
    results = {
        "backend_responding": False,
        "status_get_working": False,
        "status_post_working": False,
        "geographic_endpoints": []
    }
    
    print("=== Starting Backend API Tests ===")
    print(f"Testing API at: {API_BASE_URL}")
    
    # Test 1: Backend responding
    results["backend_responding"] = test_backend_root()
    
    # Test 2: GET /api/status
    results["status_get_working"] = test_status_endpoint_get()
    
    # Test 3: POST /api/status
    results["status_post_working"] = test_status_endpoint_post()
    
    # Test 4: Check for geographic endpoints
    results["geographic_endpoints"] = check_geographic_endpoints()
    
    # Print summary
    print("\n=== Test Results Summary ===")
    print(f"Backend responding: {'✅' if results['backend_responding'] else '❌'}")
    print(f"GET /api/status working: {'✅' if results['status_get_working'] else '❌'}")
    print(f"POST /api/status working: {'✅' if results['status_post_working'] else '❌'}")
    print(f"Geographic endpoints found: {len(results['geographic_endpoints'])}")
    if results['geographic_endpoints']:
        for endpoint in results['geographic_endpoints']:
            print(f"  - {endpoint}")
    else:
        print("  - None found")
    
    return results

if __name__ == "__main__":
    run_all_tests()
