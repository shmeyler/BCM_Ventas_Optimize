import requests
import sys
from datetime import datetime
import uuid
import json

class BCMVentasAIDemographicTester:
    def __init__(self, base_url="https://2e6a8e6e-d1d4-4773-8628-eee77b08df7f.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        print(f"Response: {response.json()}")
                    except:
                        print(f"Response: {response.text}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    try:
                        print(f"Error: {response.json()}")
                    except:
                        print(f"Error: {response.text}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "api",
            200
        )
        return success

    def test_create_status_check(self):
        """Test creating a status check"""
        client_name = f"test_client_{uuid.uuid4()}"
        success, response = self.run_test(
            "Create Status Check",
            "POST",
            "api/status",
            200,
            data={"client_name": client_name}
        )
        return success, response.get('id') if success else None

    def test_get_status_checks(self):
        """Test getting status checks"""
        success, response = self.run_test(
            "Get Status Checks",
            "GET",
            "api/status",
            200
        )
        return success

    def test_demographic_matching_api(self):
        """
        Test the demographic matching API endpoints
        
        Note: This test is based on the expected API endpoints for the demographic matching model.
        If the actual API endpoints are different, this test will fail.
        """
        # Test getting demographic variables
        success, response = self.run_test(
            "Get Demographic Variables",
            "GET",
            "api/demographic-variables",
            200
        )
        if not success:
            print("❌ Failed to get demographic variables")
            return False
        
        # Test ZIP code matching
        test_zip = "10001"
        success, response = self.run_test(
            "ZIP Code Matching",
            "POST",
            "api/match-regions",
            200,
            data={
                "region_id": test_zip,
                "region_type": "zip",
                "algorithm": "euclidean",
                "limit": 5
            }
        )
        if not success:
            print("❌ Failed to match ZIP codes")
            return False
        
        # Test DMA matching
        test_dma = "dma-501"  # New York DMA
        success, response = self.run_test(
            "DMA Matching",
            "POST",
            "api/match-regions",
            200,
            data={
                "region_id": test_dma,
                "region_type": "dma",
                "algorithm": "similarity",
                "limit": 5
            }
        )
        if not success:
            print("❌ Failed to match DMAs")
            return False
        
        # Test detailed analysis
        success, response = self.run_test(
            "Detailed Analysis",
            "POST",
            "api/detailed-analysis",
            200,
            data={
                "region1_id": test_zip,
                "region2_id": "90210",
                "region_type": "zip"
            }
        )
        if not success:
            print("❌ Failed to get detailed analysis")
            return False
        
        return True

def main():
    # Setup
    tester = BCMVentasAIDemographicTester()
    
    # Run tests
    print("🚀 Starting BCM VentasAI Demographic Matching API Tests...")
    
    root_success = tester.test_root_endpoint()
    if not root_success:
        print("❌ Root API endpoint test failed, but continuing with other tests")
    
    create_success, status_id = tester.test_create_status_check()
    if not create_success:
        print("❌ Status check creation failed, but continuing with other tests")
    
    get_success = tester.test_get_status_checks()
    if not get_success:
        print("❌ Status check retrieval failed, but continuing with other tests")
    
    demographic_success = tester.test_demographic_matching_api()
    if not demographic_success:
        print("❌ Demographic matching API tests failed")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())