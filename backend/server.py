from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import requests
import logging
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import json
import csv
from pathlib import Path

# Meta Ads API imports
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.adset import AdSet
from facebook_business.adobjects.ad import Ad
from facebook_business.adobjects.targeting import Targeting
from facebook_business.adobjects.targetinggeolocation import TargetingGeoLocation

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.geo_testing_db

# FastAPI app
app = FastAPI(title="Geographic Testing API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Demographics(BaseModel):
    population: Optional[int] = None
    medianAge: Optional[float] = None
    medianHouseholdIncome: Optional[int] = None
    medianPropertyValue: Optional[int] = None
    medianRent: Optional[int] = None
    ownerOccupied: Optional[int] = None
    renterOccupied: Optional[int] = None
    bachelorsDegreeOrHigher: Optional[float] = None
    unemploymentRate: Optional[float] = None
    laborForce: Optional[int] = None

class GeographicRegion(BaseModel):
    id: str
    name: str
    source: str
    demographics: Demographics
    lastUpdated: str

class LiftTestRequest(BaseModel):
    test_name: str
    test_regions: List[str]
    control_regions: List[str]
    start_date: str
    end_date: str
    platform: str  # meta, google, pinterest, tiktok
    test_type: str  # brand_lift, conversion_lift, sales_lift
    budget: Optional[float] = None
    metrics: List[str]  # impressions, clicks, conversions, sales

class LiftTestAnalysisRequest(BaseModel):
    test_id: str
    data: List[Dict[str, Any]]  # Historical performance data

class LiftTestExperiment(BaseModel):
    id: str
    test_name: str
    test_regions: List[str]
    control_regions: List[str]
    start_date: str
    end_date: str
    platform: str
    test_type: str
    budget: Optional[float]
    metrics: List[str]
    status: str  # draft, active, completed, cancelled
    created_at: str
    results: Optional[Dict[str, Any]] = None

class MetaAdsCampaignRequest(BaseModel):
    test_id: str
    campaign_name: str
    daily_budget: float
    targeting_type: str  # "geographic", "audience", "custom"
    test_regions: List[str]
    control_regions: List[str]
    start_date: str
    end_date: str
    creative_id: Optional[str] = None
    optimization_goal: str = "IMPRESSIONS"  # IMPRESSIONS, REACH, CLICKS, CONVERSIONS

class MetaCampaignResponse(BaseModel):
    campaign_id: str
    campaign_name: str
    status: str
    daily_budget: float
    targeting_summary: Dict[str, Any]
    created_time: str

class CensusService:
    """Service for fetching demographic data from U.S. Census Bureau API"""
    
    @classmethod
    async def get_zip_demographics(cls, zip_code: str) -> Optional[Dict[str, Any]]:
        """Fetch demographic data from Census Bureau API for a ZIP code"""
        try:
            # Get API key from environment
            api_key = os.environ.get('CENSUS_API_KEY')
            if not api_key:
                logger.warning("Census API key not found in environment variables")
                return None
            
            # Convert ZIP to ZCTA format
            zcta = zip_code.zfill(5)
            
            # Define variables to fetch from American Community Survey 5-year estimates
            variables = [
                'B01003_001E',  # Total Population
                'B25064_001E',  # Median Gross Rent
                'B19013_001E',  # Median Household Income
                'B25077_001E',  # Median Property Value
                'B08303_001E',  # Total Commuters
                'B15003_022E',  # Bachelor's Degree
                'B15003_001E',  # Total Education Population
                'B01002_001E',  # Median Age
                'B25003_002E',  # Owner Occupied Housing
                'B25003_003E',  # Renter Occupied Housing
                'B23025_005E',  # Unemployed
                'B23025_002E'   # Labor Force
            ]
            
            # Use Census API for ACS 5-year estimates (most recent available)
            url = f"https://api.census.gov/data/2022/acs/acs5?get={','.join(variables)}&for=zip%20code%20tabulation%20area:{zcta}&key={api_key}"
            
            logger.info(f"Fetching Census data for ZIP {zip_code}")
            
            # Make async request
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: requests.get(url, timeout=15)
            )
            
            if response.status_code != 200:
                logger.error(f"Census API error: {response.status_code} - {response.text}")
                return None
                
            data = response.json()
            logger.info(f"Census API response for {zip_code}: {len(data)} rows")
            
            # Check if we have valid data (should have header row + data row)
            if not data or len(data) < 2:
                logger.warning(f"No data returned from Census API for ZIP {zip_code}")
                return None
                
            # Parse the response - first row is headers, second row is data
            headers = data[0]
            values = data[1]
            
            # Create a dictionary mapping headers to values
            result = dict(zip(headers, values))
            logger.info(f"Successfully parsed Census data for ZIP {zip_code}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching Census data for ZIP {zip_code}: {e}")
            return None

class MetaAdsService:
    """Service for managing Meta (Facebook/Instagram) ad campaigns"""
    
    def __init__(self):
        self.app_id = os.environ.get('META_APP_ID')
        self.app_secret = os.environ.get('META_APP_SECRET')
        self.access_token = os.environ.get('META_ACCESS_TOKEN')
        self.ad_account_id = os.environ.get('META_AD_ACCOUNT_ID')
        self.business_id = os.environ.get('META_BUSINESS_ID')
        
        # Initialize API only if we have required credentials
        if self.app_id and self.app_secret and self.access_token:
            try:
                FacebookAdsApi.init(self.app_id, self.app_secret, self.access_token)
                self.api = FacebookAdsApi.get_default_api()
                logger.info("Meta Ads API initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Meta Ads API: {e}")
                self.api = None
        else:
            logger.warning("Meta Ads API credentials not found - campaigns will be simulated")
            self.api = None
    
    async def validate_credentials(self) -> bool:
        """Validate Meta API credentials"""
        if not self.api:
            return False
        
        try:
            # Test API access by getting ad account info
            if self.ad_account_id:
                ad_account = AdAccount(self.ad_account_id)
                ad_account.api_get(fields=[AdAccount.Field.name, AdAccount.Field.account_status])
                logger.info("Meta API credentials validated successfully")
                return True
        except Exception as e:
            logger.error(f"Meta API credential validation failed: {e}")
            return False
        
        return False
    
    def create_geographic_targeting(self, regions: List[str], region_type: str = "zip") -> Dict:
        """Create geographic targeting configuration for Meta campaigns"""
        geo_locations = []
        
        for region in regions:
            if region_type == "zip":
                # ZIP code targeting
                geo_locations.append({
                    'location_types': ['home'],
                    'zips': [{'key': region, 'name': region}]
                })
            elif region_type == "state":
                # State targeting - need to map state codes to Meta's format
                state_mapping = {
                    '06': 'California', '36': 'New York', '48': 'Texas', 
                    '12': 'Florida', '17': 'Illinois', '42': 'Pennsylvania'
                    # Add more state mappings as needed
                }
                if region in state_mapping:
                    geo_locations.append({
                        'location_types': ['home'],
                        'regions': [{'key': region, 'name': state_mapping[region]}]
                    })
            elif region_type == "dma":
                # DMA targeting
                geo_locations.append({
                    'location_types': ['home'],
                    'dmas': [{'key': region, 'name': f"DMA {region}"}]
                })
        
        return {
            'geo_locations': geo_locations,
            'location_types': ['home'],
            'excluded_geo_locations': []  # Control regions will be added here
        }
    
    async def create_campaign(self, request: MetaAdsCampaignRequest) -> MetaCampaignResponse:
        """Create a Meta Ads campaign for lift testing"""
        
        if not self.api or not self.ad_account_id:
            # Simulate campaign creation for testing
            return self._simulate_campaign_creation(request)
        
        try:
            # Create campaign
            campaign_data = {
                Campaign.Field.name: request.campaign_name,
                Campaign.Field.objective: Campaign.Objective.brand_awareness,
                Campaign.Field.status: Campaign.Status.paused,  # Start paused for review
                Campaign.Field.daily_budget: int(request.daily_budget * 100),  # Convert to cents
            }
            
            ad_account = AdAccount(self.ad_account_id)
            campaign = ad_account.create_campaign(params=campaign_data)
            
            # Create geographic targeting
            test_targeting = self.create_geographic_targeting(request.test_regions, "zip")
            control_targeting = self.create_geographic_targeting(request.control_regions, "zip")
            
            # Create ad sets for test and control groups
            test_adset = await self._create_adset(
                campaign.get_id(), 
                f"{request.campaign_name} - Test Group",
                test_targeting,
                request.daily_budget / 2
            )
            
            control_adset = await self._create_adset(
                campaign.get_id(),
                f"{request.campaign_name} - Control Group", 
                control_targeting,
                request.daily_budget / 2
            )
            
            # Store campaign info in database
            campaign_info = {
                "test_id": request.test_id,
                "meta_campaign_id": campaign.get_id(),
                "test_adset_id": test_adset.get_id() if test_adset else None,
                "control_adset_id": control_adset.get_id() if control_adset else None,
                "status": "created",
                "created_at": datetime.utcnow().isoformat()
            }
            
            await db.meta_campaigns.insert_one(campaign_info)
            
            return MetaCampaignResponse(
                campaign_id=campaign.get_id(),
                campaign_name=request.campaign_name,
                status="created",
                daily_budget=request.daily_budget,
                targeting_summary={
                    "test_regions": len(request.test_regions),
                    "control_regions": len(request.control_regions)
                },
                created_time=datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error creating Meta campaign: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create Meta campaign: {str(e)}")
    
    async def _create_adset(self, campaign_id: str, name: str, targeting: Dict, daily_budget: float):
        """Create an ad set with geographic targeting"""
        try:
            adset_data = {
                AdSet.Field.name: name,
                AdSet.Field.campaign_id: campaign_id,
                AdSet.Field.daily_budget: int(daily_budget * 100),  # Convert to cents
                AdSet.Field.billing_event: AdSet.BillingEvent.impressions,
                AdSet.Field.optimization_goal: AdSet.OptimizationGoal.impressions,
                AdSet.Field.targeting: targeting,
                AdSet.Field.status: AdSet.Status.paused,
            }
            
            campaign = Campaign(campaign_id)
            adset = campaign.create_ad_set(params=adset_data)
            return adset
            
        except Exception as e:
            logger.error(f"Error creating ad set: {e}")
            return None
    
    def _simulate_campaign_creation(self, request: MetaAdsCampaignRequest) -> MetaCampaignResponse:
        """Simulate campaign creation when API is not available"""
        logger.info(f"Simulating Meta campaign creation for: {request.campaign_name}")
        
        # Generate mock campaign ID
        campaign_id = f"mock_campaign_{int(datetime.utcnow().timestamp())}"
        
        return MetaCampaignResponse(
            campaign_id=campaign_id,
            campaign_name=request.campaign_name,
            status="simulated",
            daily_budget=request.daily_budget,
            targeting_summary={
                "test_regions": len(request.test_regions),
                "control_regions": len(request.control_regions),
                "note": "Campaign simulated - provide API credentials for real campaigns"
            },
            created_time=datetime.utcnow().isoformat()
        )
    
    async def get_campaign_performance(self, campaign_id: str) -> Dict[str, Any]:
        """Get campaign performance metrics"""
        if not self.api:
            # Return mock performance data
            return {
                "campaign_id": campaign_id,
                "impressions": 125000,
                "reach": 85000,
                "clicks": 3200,
                "spend": 2450.50,
                "cpm": 19.60,
                "ctr": 2.56,
                "status": "simulated",
                "note": "Mock data - provide API credentials for real metrics"
            }
        
        try:
            campaign = Campaign(campaign_id)
            insights = campaign.get_insights(fields=[
                'impressions', 'reach', 'clicks', 'spend', 'cpm', 'ctr'
            ])
            
            if insights:
                return dict(insights[0])
            else:
                return {"error": "No performance data available"}
                
        except Exception as e:
            logger.error(f"Error getting campaign performance: {e}")
            return {"error": str(e)}

def transform_census_to_demographics(zip_code: str, census_data: Dict[str, Any]) -> GeographicRegion:
    """Transform Census Bureau API response to our standard format"""
    try:
        # Helper function to safely convert values
        def safe_int(value):
            try:
                return int(value) if value and value != '-999999999' and value != 'null' else None
            except (ValueError, TypeError):
                return None
        
        def safe_float(value):
            try:
                return float(value) if value and value != '-999999999' and value != 'null' else None
            except (ValueError, TypeError):
                return None
        
        # Extract demographic data
        population = safe_int(census_data.get('B01003_001E'))
        median_age = safe_float(census_data.get('B01002_001E'))
        median_income = safe_int(census_data.get('B19013_001E'))
        median_rent = safe_int(census_data.get('B25064_001E'))
        median_property_value = safe_int(census_data.get('B25077_001E'))
        owner_occupied = safe_int(census_data.get('B25003_002E'))
        renter_occupied = safe_int(census_data.get('B25003_003E'))
        
        # Calculate education percentage
        bachelors = safe_int(census_data.get('B15003_022E'))
        total_education_pop = safe_int(census_data.get('B15003_001E'))
        bachelors_percent = (bachelors / total_education_pop * 100) if bachelors and total_education_pop else None
        
        # Calculate unemployment rate
        unemployed = safe_int(census_data.get('B23025_005E'))
        labor_force = safe_int(census_data.get('B23025_002E'))
        unemployment_rate = (unemployed / labor_force * 100) if unemployed and labor_force else None
        
        # Get city name from ZIP code patterns
        location_name = get_zip_location_name(zip_code)
        
        demographics = Demographics(
            population=population,
            medianAge=median_age,
            medianHouseholdIncome=median_income,
            medianPropertyValue=median_property_value,
            medianRent=median_rent,
            ownerOccupied=owner_occupied,
            renterOccupied=renter_occupied,
            bachelorsDegreeOrHigher=bachelors_percent,
            unemploymentRate=unemployment_rate,
            laborForce=labor_force
        )
        
        return GeographicRegion(
            id=zip_code,
            name=f"{location_name} ({zip_code})",
            source="US_CENSUS_BUREAU",
            demographics=demographics,
            lastUpdated=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error(f"Error transforming Census data for ZIP {zip_code}: {e}")
        raise

def get_zip_location_name(zip_code: str) -> str:
    """Get city and state name for a ZIP code using Zippopotam.us API"""
    try:
        # Try to get city name from free Zippopotam.us API
        import requests
        response = requests.get(f"http://api.zippopotam.us/us/{zip_code}", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('places') and len(data['places']) > 0:
                place = data['places'][0]
                city = place.get('place name', '')
                state = place.get('state abbreviation', '')
                if city and state:
                    return f"{city}, {state}"
    
    except Exception as e:
        logger.warning(f"Failed to get city name for ZIP {zip_code} from Zippopotam.us: {e}")
    
    # Fall back to state-level mapping if API fails
    first_two = zip_code[:2] if len(zip_code) >= 2 else zip_code[0]
    
    if first_two == '06':
        return f"Connecticut"
    elif first_two in ['01', '02']:
        if first_two == '02' and zip_code.startswith('028'):
            return f"Rhode Island"
        return f"Massachusetts"  
    elif first_two == '03':
        return f"New Hampshire"
    elif first_two == '04':
        return f"Maine"
    elif first_two == '05':
        return f"Vermont"
    elif zip_code[0] == '1':
        return f"New York"
    elif zip_code[0] == '2':
        return f"Washington DC area"
    elif zip_code[0] == '3':
        return f"Florida"
    elif zip_code[0] == '4':
        return f"Georgia"
    elif zip_code[0] == '5':
        return f"Alabama"
    elif zip_code[0] == '6':
        return f"Illinois"
    elif zip_code[0] == '7':
        return f"Texas"
    elif zip_code[0] == '8':
        return f"Colorado"
    elif zip_code[0] == '9':
        return f"California"
    else:
        return f"US"

# API Routes
@app.get("/")
async def root():
    return {"message": "Geographic Testing API", "version": "1.0.0"}

@app.get("/api/geographic/zip/{zip_code}", response_model=GeographicRegion)
async def get_zip_data(zip_code: str):
    """Get demographic data for a specific ZIP code"""
    try:
        logger.info(f"🔍 Fetching data for ZIP code: {zip_code}")
        
        # Validate ZIP code format
        if not zip_code.isdigit() or len(zip_code) != 5:
            raise HTTPException(status_code=400, detail="Invalid ZIP code format. Must be 5 digits.")
        
        # Try to get data from Census Bureau API
        census_data = await CensusService.get_zip_demographics(zip_code)
        
        if census_data:
            logger.info(f"✅ Successfully retrieved Census data for ZIP {zip_code}")
            result = transform_census_to_demographics(zip_code, census_data)
            
            # Store in database for caching
            try:
                await db.zip_data.update_one(
                    {"_id": zip_code},
                    {"$set": result.dict()},
                    upsert=True
                )
                logger.info(f"💾 Cached Census data for ZIP {zip_code}")
            except Exception as e:
                logger.warning(f"Failed to cache data for ZIP {zip_code}: {e}")
            
            return result
        else:
            logger.warning(f"❌ No Census data available for ZIP {zip_code}")
            raise HTTPException(status_code=404, detail=f"No demographic data found for ZIP code {zip_code}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error processing ZIP {zip_code}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/geographic/zips")
async def get_multiple_zip_demographics(zip_codes: str = Query(..., description="Comma-separated ZIP codes")):
    """Get demographic data for multiple ZIP codes (comma-separated)"""
    try:
        zip_list = [zip_code.strip() for zip_code in zip_codes.split(',') if zip_code.strip()]
        
        if not zip_list:
            raise HTTPException(status_code=400, detail="No ZIP codes provided")
        
        if len(zip_list) > 50:
            raise HTTPException(status_code=400, detail="Too many ZIP codes. Maximum 50 allowed.")
        
        results = []
        for zip_code in zip_list:
            try:
                if zip_code.isdigit() and len(zip_code) == 5:
                    census_data = await CensusService.get_zip_demographics(zip_code)
                    if census_data:
                        result = transform_census_to_demographics(zip_code, census_data)
                        results.append(result)
            except Exception as e:
                logger.warning(f"Failed to get data for ZIP {zip_code}: {e}")
                continue
        
        logger.info(f"📊 Retrieved data for {len(results)} out of {len(zip_list)} ZIP codes")
        
        return {
            "regions": results,
            "source": "US_CENSUS_BUREAU",
            "message": f"Data retrieved for {len(results)} ZIP codes (Source: US Census Bureau)"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing multiple ZIP codes: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/geographic/state/{state_code}")
async def get_state_data(state_code: str):
    """Get demographic data for a specific state using Census API"""
    try:
        # Get API key from environment
        api_key = os.environ.get('CENSUS_API_KEY')
        if not api_key:
            logger.warning("Census API key not found in environment variables")
            raise HTTPException(status_code=500, detail="Census API key not configured")
        
        # Define variables to fetch from American Community Survey 5-year estimates
        variables = [
            'B01003_001E',  # Total Population
            'B25064_001E',  # Median Gross Rent
            'B19013_001E',  # Median Household Income
            'B25077_001E',  # Median Property Value
            'B15003_022E',  # Bachelor's Degree
            'B15003_001E',  # Total Education Population
            'B01002_001E',  # Median Age
            'B25003_002E',  # Owner Occupied Housing
            'B25003_003E',  # Renter Occupied Housing
            'B23025_005E',  # Unemployed
            'B23025_002E'   # Labor Force
        ]
        
        # Use Census API for ACS 5-year estimates for states
        url = f"https://api.census.gov/data/2022/acs/acs5?get={','.join(variables)}&for=state:{state_code}&key={api_key}"
        
        logger.info(f"Fetching Census data for state {state_code}")
        
        # Make async request
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: requests.get(url, timeout=15)
        )
        
        if response.status_code != 200:
            logger.error(f"Census API error for state {state_code}: {response.status_code}")
            raise HTTPException(status_code=404, detail=f"No data found for state {state_code}")
            
        data = response.json()
        
        # Check if we have valid data
        if not data or len(data) < 2:
            raise HTTPException(status_code=404, detail=f"No demographic data found for state {state_code}")
            
        # Parse the response - first row is headers, second row is data
        headers = data[0]
        values = data[1]
        census_data = dict(zip(headers, values))
        
        # Transform Census data to our format
        def safe_int(value):
            try:
                return int(value) if value and value != '-999999999' and value != 'null' else None
            except (ValueError, TypeError):
                return None
        
        def safe_float(value):
            try:
                return float(value) if value and value != '-999999999' and value != 'null' else None
            except (ValueError, TypeError):
                return None
        
        # Extract demographic data
        population = safe_int(census_data.get('B01003_001E'))
        median_age = safe_float(census_data.get('B01002_001E'))
        median_income = safe_int(census_data.get('B19013_001E'))
        median_rent = safe_int(census_data.get('B25064_001E'))
        median_property_value = safe_int(census_data.get('B25077_001E'))
        owner_occupied = safe_int(census_data.get('B25003_002E'))
        renter_occupied = safe_int(census_data.get('B25003_003E'))
        
        # Calculate education percentage
        bachelors = safe_int(census_data.get('B15003_022E'))
        total_education_pop = safe_int(census_data.get('B15003_001E'))
        bachelors_percent = (bachelors / total_education_pop * 100) if bachelors and total_education_pop else None
        
        # Calculate unemployment rate
        unemployed = safe_int(census_data.get('B23025_005E'))
        labor_force = safe_int(census_data.get('B23025_002E'))
        unemployment_rate = (unemployed / labor_force * 100) if unemployed and labor_force else None
        
        # Get state name
        state_names = {
            "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas", "06": "California",
            "08": "Colorado", "09": "Connecticut", "10": "Delaware", "11": "District of Columbia",
            "12": "Florida", "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois",
            "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky", "22": "Louisiana",
            "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
            "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada",
            "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico", "36": "New York",
            "37": "North Carolina", "38": "North Dakota", "39": "Ohio", "40": "Oklahoma",
            "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island", "45": "South Carolina",
            "46": "South Dakota", "47": "Tennessee", "48": "Texas", "49": "Utah", "50": "Vermont",
            "51": "Virginia", "53": "Washington", "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"
        }
        
        state_name = state_names.get(state_code, f"State {state_code}")
        
        demographics = Demographics(
            population=population,
            medianAge=median_age,
            medianHouseholdIncome=median_income,
            medianPropertyValue=median_property_value,
            medianRent=median_rent,
            ownerOccupied=owner_occupied,
            renterOccupied=renter_occupied,
            bachelorsDegreeOrHigher=bachelors_percent,
            unemploymentRate=unemployment_rate,
            laborForce=labor_force
        )
        
        region = GeographicRegion(
            id=state_code,
            name=state_name,
            source="US_CENSUS_BUREAU",
            demographics=demographics,
            lastUpdated=datetime.utcnow().isoformat()
        )
        
        return region
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing state {state_code}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/geographic/states")
async def get_us_states():
    """Get list of US states for region selection"""
    states = [
        {"id": "01", "name": "Alabama"},
        {"id": "02", "name": "Alaska"},
        {"id": "04", "name": "Arizona"},
        {"id": "05", "name": "Arkansas"},
        {"id": "06", "name": "California"},
        {"id": "08", "name": "Colorado"},
        {"id": "09", "name": "Connecticut"},
        {"id": "10", "name": "Delaware"},
        {"id": "12", "name": "Florida"},
        {"id": "13", "name": "Georgia"},
        {"id": "15", "name": "Hawaii"},
        {"id": "16", "name": "Idaho"},
        {"id": "17", "name": "Illinois"},
        {"id": "18", "name": "Indiana"},
        {"id": "19", "name": "Iowa"},
        {"id": "20", "name": "Kansas"},
        {"id": "21", "name": "Kentucky"},
        {"id": "22", "name": "Louisiana"},
        {"id": "23", "name": "Maine"},
        {"id": "24", "name": "Maryland"},
        {"id": "25", "name": "Massachusetts"},
        {"id": "26", "name": "Michigan"},
        {"id": "27", "name": "Minnesota"},
        {"id": "28", "name": "Mississippi"},
        {"id": "29", "name": "Missouri"},
        {"id": "30", "name": "Montana"},
        {"id": "31", "name": "Nebraska"},
        {"id": "32", "name": "Nevada"},
        {"id": "33", "name": "New Hampshire"},
        {"id": "34", "name": "New Jersey"},
        {"id": "35", "name": "New Mexico"},
        {"id": "36", "name": "New York"},
        {"id": "37", "name": "North Carolina"},
        {"id": "38", "name": "North Dakota"},
        {"id": "39", "name": "Ohio"},
        {"id": "40", "name": "Oklahoma"},
        {"id": "41", "name": "Oregon"},
        {"id": "42", "name": "Pennsylvania"},
        {"id": "44", "name": "Rhode Island"},
        {"id": "45", "name": "South Carolina"},
        {"id": "46", "name": "South Dakota"},
        {"id": "47", "name": "Tennessee"},
        {"id": "48", "name": "Texas"},
        {"id": "49", "name": "Utah"},
        {"id": "50", "name": "Vermont"},
        {"id": "51", "name": "Virginia"},
        {"id": "53", "name": "Washington"},
        {"id": "54", "name": "West Virginia"},
        {"id": "55", "name": "Wisconsin"},
        {"id": "56", "name": "Wyoming"}
    ]
    
    return {"regions": states, "source": "US_CENSUS_BUREAU"}


def load_dma_data():
    """Load DMA data from CSV file"""
    dma_data = []
    csv_path = Path(__file__).parent / "dma_names.csv"
    
    try:
        with open(csv_path, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                dma_data.append({
                    "id": str(row['dma_code']),
                    "name": row['geo_dma'],
                    "code": int(row['dma_code'])
                })
    except Exception as e:
        logger.error(f"Error loading DMA data: {e}")
        return []
    
    return dma_data

@app.get("/api/geographic/dma/{dma_code}")
async def get_dma_data(dma_code: str):
    """Get demographic data for a specific DMA"""
    try:
        # Load DMA data to find the name
        dma_data = load_dma_data()
        dma_info = next((dma for dma in dma_data if dma['id'] == dma_code), None)
        
        if not dma_info:
            raise HTTPException(status_code=404, detail=f"DMA {dma_code} not found")
        
        # For now, return mock demographic data for DMAs
        # In a real implementation, this would come from Nielsen or other data sources
        demographics = Demographics(
            population=int(dma_code) * 1000 + 50000,  # Mock based on DMA code
            medianAge=35.0 + (int(dma_code) % 20),
            medianHouseholdIncome=45000 + (int(dma_code) * 100),
            medianPropertyValue=250000 + (int(dma_code) * 1000),
            medianRent=1200 + (int(dma_code) % 800),
            ownerOccupied=int((int(dma_code) * 1000 + 50000) * 0.65),
            renterOccupied=int((int(dma_code) * 1000 + 50000) * 0.35),
            bachelorsDegreeOrHigher=25.0 + (int(dma_code) % 30),
            unemploymentRate=3.5 + (int(dma_code) % 10),
            laborForce=int((int(dma_code) * 1000 + 50000) * 0.6)
        )
        
        region = GeographicRegion(
            id=dma_code,
            name=f"{dma_info['name']} (DMA {dma_code})",
            source="NIELSEN_DMA_MOCK",
            demographics=demographics,
            lastUpdated=datetime.utcnow().isoformat()
        )
        
        return region
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing DMA {dma_code}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/geographic/dmas")
async def get_dmas():
    """Get list of Designated Market Areas (DMAs) from Nielsen data"""
    try:
        dma_data = load_dma_data()
        
        if not dma_data:
            # Fallback data if CSV fails to load
            dma_data = [
                {"id": "501", "name": "New York", "code": 501},
                {"id": "803", "name": "Los Angeles", "code": 803},
                {"id": "602", "name": "Chicago", "code": 602},
                {"id": "504", "name": "Philadelphia", "code": 504},
                {"id": "623", "name": "Dallas-Ft. Worth", "code": 623},
                {"id": "506", "name": "Boston (Manchester)", "code": 506},
                {"id": "511", "name": "Washington, DC (Hagrstwn)", "code": 511},
                {"id": "539", "name": "Tampa-St. Pete (Sarasota)", "code": 539},
                {"id": "618", "name": "Houston", "code": 618},
                {"id": "505", "name": "Detroit", "code": 505}
            ]
        
        return {
            "regions": dma_data, 
            "source": "NIELSEN_DMA_RESEARCH",
            "total": len(dma_data)
        }
    
    except Exception as e:
        logger.error(f"Error getting DMA data: {e}")
        raise HTTPException(status_code=500, detail="Error loading DMA data")

# Lift Test API Endpoints
@app.post("/api/lift-test/create", response_model=LiftTestExperiment)
async def create_lift_test(request: LiftTestRequest):
    """Create a new lift test experiment"""
    try:
        # Generate unique test ID
        test_id = f"test_{int(datetime.utcnow().timestamp())}"
        
        # Create experiment object
        experiment = LiftTestExperiment(
            id=test_id,
            test_name=request.test_name,
            test_regions=request.test_regions,
            control_regions=request.control_regions,
            start_date=request.start_date,
            end_date=request.end_date,
            platform=request.platform,
            test_type=request.test_type,
            budget=request.budget,
            metrics=request.metrics,
            status="draft",
            created_at=datetime.utcnow().isoformat(),
            results=None
        )
        
        # Save to database
        await db.lift_tests.insert_one(experiment.dict())
        
        logger.info(f"Created lift test: {test_id}")
        return experiment
        
    except Exception as e:
        logger.error(f"Error creating lift test: {e}")
        raise HTTPException(status_code=500, detail="Error creating lift test")

@app.get("/api/lift-test/{test_id}", response_model=LiftTestExperiment)
async def get_lift_test(test_id: str):
    """Get lift test by ID"""
    try:
        test = await db.lift_tests.find_one({"id": test_id})
        if not test:
            raise HTTPException(status_code=404, detail="Lift test not found")
        
        return LiftTestExperiment(**test)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lift test {test_id}: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving lift test")

@app.get("/api/lift-test")
async def list_lift_tests():
    """List all lift tests"""
    try:
        tests = []
        async for test in db.lift_tests.find():
            tests.append(LiftTestExperiment(**test))
        
        return {"tests": tests, "total": len(tests)}
        
    except Exception as e:
        logger.error(f"Error listing lift tests: {e}")
        raise HTTPException(status_code=500, detail="Error listing lift tests")

@app.post("/api/lift-test/{test_id}/power-analysis")
async def calculate_power_analysis(test_id: str, test_regions: List[str], control_regions: List[str]):
    """Calculate power analysis for a lift test using existing geographic data"""
    try:
        # Get demographic data for test and control regions
        test_populations = []
        control_populations = []
        
        for region in test_regions:
            # Try to get region data from our geographic endpoints
            try:
                if len(region) == 5 and region.isdigit():  # ZIP code
                    zip_data = await CensusService.get_zip_demographics(region)
                    if zip_data:
                        pop = int(zip_data.get('B01003_001E', 0)) if zip_data.get('B01003_001E') != '-999999999' else 0
                        if pop > 0:
                            test_populations.append(pop)
                elif len(region) == 2:  # State code
                    # Use mock data for now
                    test_populations.append(2000000)
                else:  # DMA
                    test_populations.append(1500000)
            except:
                test_populations.append(1000000)  # Fallback
        
        for region in control_regions:
            try:
                if len(region) == 5 and region.isdigit():  # ZIP code
                    zip_data = await CensusService.get_zip_demographics(region)
                    if zip_data:
                        pop = int(zip_data.get('B01003_001E', 0)) if zip_data.get('B01003_001E') != '-999999999' else 0
                        if pop > 0:
                            control_populations.append(pop)
                elif len(region) == 2:  # State code
                    control_populations.append(2000000)
                else:  # DMA
                    control_populations.append(1500000)
            except:
                control_populations.append(1000000)  # Fallback
        
        # Calculate power analysis
        total_test_pop = sum(test_populations)
        total_control_pop = sum(control_populations)
        total_population = total_test_pop + total_control_pop
        
        # Simplified power calculation
        # Real implementation would use statistical formulas
        if total_population > 10000000:
            power = 0.95
            mde = 0.02  # 2% minimum detectable effect
        elif total_population > 5000000:
            power = 0.85
            mde = 0.03
        elif total_population > 1000000:
            power = 0.75
            mde = 0.05
        else:
            power = 0.65
            mde = 0.08
        
        results = {
            "test_id": test_id,
            "power": power,
            "minimum_detectable_effect": mde,
            "test_population": total_test_pop,
            "control_population": total_control_pop,
            "total_population": total_population,
            "recommended_duration_days": min(42, max(14, int(50000000 / total_population)))
        }
        
        # Update test with power analysis
        await db.lift_tests.update_one(
            {"id": test_id},
            {"$set": {"power_analysis": results}}
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Error calculating power analysis for {test_id}: {e}")
        raise HTTPException(status_code=500, detail="Error calculating power analysis")

@app.post("/api/lift-test/{test_id}/analyze")
async def analyze_lift_test(test_id: str, request: LiftTestAnalysisRequest):
    """Analyze lift test results using simplified statistical methods"""
    try:
        # Get test configuration
        test = await db.lift_tests.find_one({"id": test_id})
        if not test:
            raise HTTPException(status_code=404, detail="Lift test not found")
        
        # Process the data (simplified analysis)
        # In real implementation, this would use GeoLift or similar statistical methods
        test_data = [d for d in request.data if d.get('region') in test['test_regions']]
        control_data = [d for d in request.data if d.get('region') in test['control_regions']]
        
        if not test_data or not control_data:
            raise HTTPException(status_code=400, detail="Insufficient data for analysis")
        
        # Calculate simple lift metrics
        test_avg = sum(d.get('metric_value', 0) for d in test_data) / len(test_data)
        control_avg = sum(d.get('metric_value', 0) for d in control_data) / len(control_data)
        
        lift = (test_avg - control_avg) / control_avg if control_avg > 0 else 0
        lift_percent = lift * 100
        
        # Mock statistical significance (would use proper statistical tests in real implementation)
        statistical_significance = abs(lift_percent) > 5  # Simplified
        p_value = 0.03 if statistical_significance else 0.15
        
        results = {
            "lift_percent": round(lift_percent, 2),
            "test_average": round(test_avg, 2),
            "control_average": round(control_avg, 2),
            "statistical_significance": statistical_significance,
            "p_value": p_value,
            "confidence_interval": [
                round(lift_percent - 2, 2),
                round(lift_percent + 2, 2)
            ],
            "analysis_date": datetime.utcnow().isoformat()
        }
        
        # Update test with results
        await db.lift_tests.update_one(
            {"id": test_id},
            {"$set": {"results": results, "status": "completed"}}
        )
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing lift test {test_id}: {e}")
        raise HTTPException(status_code=500, detail="Error analyzing lift test")

@app.get("/api/lift-test/{test_id}/recommendations")
async def get_test_recommendations(test_id: str):
    """Get smart recommendations for test regions based on demographic matching"""
    try:
        test = await db.lift_tests.find_one({"id": test_id})
        if not test:
            raise HTTPException(status_code=404, detail="Lift test not found")
        
        # Get demographic data for test regions to find similar control regions
        test_regions_data = []
        for region in test.get('test_regions', []):
            try:
                if len(region) == 5 and region.isdigit():  # ZIP code
                    zip_data = await CensusService.get_zip_demographics(region)
                    if zip_data:
                        region_data = transform_census_to_demographics(region, zip_data)
                        test_regions_data.append(region_data)
            except:
                continue
        
        if not test_regions_data:
            return {"recommendations": [], "message": "No demographic data available for matching"}
        
        # Simple matching algorithm (would be more sophisticated in real implementation)
        avg_income = sum(r.demographics.medianHouseholdIncome for r in test_regions_data if r.demographics.medianHouseholdIncome) / len(test_regions_data)
        avg_age = sum(r.demographics.medianAge for r in test_regions_data if r.demographics.medianAge) / len(test_regions_data)
        
        recommendations = [
            {
                "type": "control_region_selection",
                "title": "Recommended Control Regions",
                "description": f"Look for regions with median income around ${avg_income:,.0f} and median age around {avg_age:.1f}",
                "priority": "high"
            },
            {
                "type": "test_duration",
                "title": "Recommended Test Duration",
                "description": "Run test for 4-6 weeks to capture weekly patterns and ensure statistical significance",
                "priority": "medium"
            },
            {
                "type": "metrics_tracking",
                "title": "Key Metrics to Track",
                "description": "Monitor both primary KPIs and secondary metrics like brand awareness and consideration",
                "priority": "medium"
            }
        ]
        
        return {"recommendations": recommendations}
        
    except Exception as e:
        logger.error(f"Error getting recommendations for {test_id}: {e}")
        raise HTTPException(status_code=500, detail="Error getting recommendations")

@app.delete("/api/lift-test/{test_id}")
async def delete_lift_test(test_id: str):
    """Delete a lift test"""
    try:
        result = await db.lift_tests.delete_one({"id": test_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Lift test not found")
        
        logger.info(f"Deleted lift test: {test_id}")
        return {"message": f"Lift test {test_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lift test {test_id}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting lift test")

@app.put("/api/lift-test/{test_id}/status")
async def update_test_status(test_id: str, status: str):
    """Update lift test status"""
    try:
        valid_statuses = ["draft", "active", "completed", "cancelled"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        result = await db.lift_tests.update_one(
            {"id": test_id},
            {"$set": {"status": status}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Lift test not found or status unchanged")
        
        return {"message": f"Test status updated to {status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating test status {test_id}: {e}")
        raise HTTPException(status_code=500, detail="Error updating test status")

# Initialize Meta Ads Service
meta_ads_service = MetaAdsService()

# Meta Ads API Endpoints
@app.get("/api/meta/validate")
async def validate_meta_credentials():
    """Validate Meta API credentials and get account info"""
    try:
        is_valid = await meta_ads_service.validate_credentials()
        
        if is_valid:
            return {
                "status": "valid",
                "message": "Meta API credentials are valid",
                "has_access_token": bool(meta_ads_service.access_token),
                "has_ad_account": bool(meta_ads_service.ad_account_id)
            }
        else:
            return {
                "status": "invalid",
                "message": "Meta API credentials validation failed",
                "has_access_token": bool(meta_ads_service.access_token),
                "has_ad_account": bool(meta_ads_service.ad_account_id),
                "note": "Business Manager ID and Ad Account ID may be needed"
            }
    except Exception as e:
        logger.error(f"Error validating Meta credentials: {e}")
        return {
            "status": "error",
            "message": str(e),
            "has_access_token": bool(meta_ads_service.access_token)
        }

@app.post("/api/meta/campaign/create", response_model=MetaCampaignResponse)
async def create_meta_campaign(request: MetaAdsCampaignRequest):
    """Create a Meta Ads campaign for lift testing"""
    try:
        logger.info(f"Creating Meta campaign: {request.campaign_name}")
        
        campaign = await meta_ads_service.create_campaign(request)
        
        # Update the lift test with Meta campaign info
        await db.lift_tests.update_one(
            {"id": request.test_id},
            {"$set": {
                "meta_campaign_id": campaign.campaign_id,
                "meta_campaign_status": campaign.status
            }}
        )
        
        return campaign
        
    except Exception as e:
        logger.error(f"Error creating Meta campaign: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/meta/campaign/{campaign_id}/performance")
async def get_campaign_performance(campaign_id: str):
    """Get Meta campaign performance metrics"""
    try:
        performance = await meta_ads_service.get_campaign_performance(campaign_id)
        return performance
        
    except Exception as e:
        logger.error(f"Error getting campaign performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/meta/accounts")
async def get_meta_ad_accounts():
    """Get available Meta Ad Accounts for the user"""
    try:
        if not meta_ads_service.api:
            return {
                "error": "Meta API not initialized",
                "accounts": [],
                "note": "Provide complete credentials to access ad accounts"
            }
        
        # Try to fetch ad accounts from Business Manager
        if meta_ads_service.business_id:
            try:
                from facebook_business.adobjects.business import Business
                
                business = Business(meta_ads_service.business_id)
                ad_accounts = business.get_owned_ad_accounts(fields=[
                    AdAccount.Field.account_id,
                    AdAccount.Field.name,
                    AdAccount.Field.account_status,
                    AdAccount.Field.currency,
                    AdAccount.Field.timezone_name
                ])
                
                accounts_list = []
                for account in ad_accounts:
                    accounts_list.append({
                        "id": account.get(AdAccount.Field.account_id),
                        "name": account.get(AdAccount.Field.name),
                        "status": account.get(AdAccount.Field.account_status),
                        "currency": account.get(AdAccount.Field.currency),
                        "timezone": account.get(AdAccount.Field.timezone_name)
                    })
                
                return {
                    "accounts": accounts_list,
                    "business_id": meta_ads_service.business_id,
                    "message": f"Found {len(accounts_list)} ad accounts",
                    "status": "success"
                }
                
            except Exception as e:
                logger.error(f"Error fetching ad accounts from Business Manager: {e}")
                
                # Try alternative method - get accounts associated with the user
                try:
                    from facebook_business.adobjects.user import User
                    
                    user = User(fbid='me')
                    ad_accounts = user.get_ad_accounts(fields=[
                        AdAccount.Field.account_id,
                        AdAccount.Field.name,
                        AdAccount.Field.account_status,
                        AdAccount.Field.currency
                    ])
                    
                    accounts_list = []
                    for account in ad_accounts:
                        accounts_list.append({
                            "id": account.get(AdAccount.Field.account_id),
                            "name": account.get(AdAccount.Field.name),
                            "status": account.get(AdAccount.Field.account_status),
                            "currency": account.get(AdAccount.Field.currency),
                            "source": "user_accounts"
                        })
                    
                    return {
                        "accounts": accounts_list,
                        "business_id": meta_ads_service.business_id,
                        "message": f"Found {len(accounts_list)} ad accounts via user method",
                        "status": "success"
                    }
                    
                except Exception as e2:
                    logger.error(f"Error with alternative method: {e2}")
                    return {
                        "error": f"Failed to fetch ad accounts: {str(e)} | Alternative: {str(e2)}",
                        "accounts": [],
                        "business_id": meta_ads_service.business_id,
                        "note": "Provide specific Ad Account ID to proceed with campaign creation"
                    }
        else:
            return {
                "accounts": [],
                "message": "Business Manager ID needed to fetch ad accounts",
                "status": "needs_business_id"
            }
        
    except Exception as e:
        logger.error(f"Error getting ad accounts: {e}")
        return {"error": str(e), "accounts": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)