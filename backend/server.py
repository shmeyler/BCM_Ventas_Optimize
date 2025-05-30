from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import requests
import asyncio
from functools import lru_cache


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Geographic Data Models
class Demographics(BaseModel):
    medianAge: float
    medianIncome: int
    populationDensity: int
    householdSize: float
    collegeEducated: float
    unemploymentRate: float
    whiteCollarJobs: float
    homeOwnership: float
    medianHomeValue: int
    rentBurden: float
    internetPenetration: float
    mobileUsage: float
    socialMediaUsage: float
    onlineShoppingIndex: float
    urbanizationLevel: str
    retailDensity: int
    competitionIndex: float
    tvConsumption: float
    digitalAdReceptivity: float
    brandLoyalty: float

class GeographicRegion(BaseModel):
    id: str
    name: str
    source: str
    selected: bool = False
    type: Optional[str] = None
    demographics: Demographics
    lastUpdated: str

class GeographicResponse(BaseModel):
    regions: List[GeographicRegion]
    count: int
    source: str

# DataUSA.io API Integration
class DataUSAService:
    BASE_URL = "https://datausa.io/api/data"
    
    @classmethod
    async def get_zip_demographics(cls, zip_code: str) -> Optional[Dict[str, Any]]:
        """Fetch demographic data from DataUSA.io for a ZIP code"""
        try:
            # Convert ZIP to ZCTA (ZIP Code Tabulation Area)
            zcta = zip_code.zfill(5)
            
            # Define measures to fetch
            measures = [
                'Population',
                'Median Age',
                'Median Household Income',
                'Total Population 25 Years And Over',
                'Bachelor Degree Or Higher',
                'Unemployment Rate',
                'Median Property Value',
                'Owner Occupied',
                'Renter Occupied',
                'Labor Force'
            ]
            
            # Try different years starting with the most recent available
            years_to_try = ['2022', '2021', '2020', '2019']
            
            for year in years_to_try:
                url = f"{cls.BASE_URL}?drilldowns=ZCTA&measures={','.join(measures)}&year={year}&geo={zcta}"
                
                logger.info(f"Trying DataUSA.io for ZIP {zip_code} with year {year}: {url}")
                
                # Make async request using requests in thread pool
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None, 
                    lambda: requests.get(url, timeout=10)
                )
                
                if response.status_code != 200:
                    logger.error(f"DataUSA API error: {response.status_code}")
                    continue
                    
                data = response.json()
                
                if data.get('data') and len(data['data']) > 0:
                    logger.info(f"Successfully got DataUSA data for ZIP {zip_code} using year {year}")
                    return data['data'][0]
                else:
                    logger.warning(f"No DataUSA data found for ZIP {zip_code} in year {year}")
                    continue
            
            # If no data found for any year, log the issue
            logger.error(f"No DataUSA data found for ZIP {zip_code} in any available year")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching DataUSA data for ZIP {zip_code}: {e}")
            return None
    
    @classmethod
    def transform_datausa_to_demographics(cls, datausa_data: Dict[str, Any], zip_code: str) -> GeographicRegion:
        """Transform DataUSA.io response to our Demographics model"""
        population = int(datausa_data.get('Population', 0))
        labor_force = int(datausa_data.get('Labor Force', 1))
        owner_occupied = int(datausa_data.get('Owner Occupied', 0))
        renter_occupied = int(datausa_data.get('Renter Occupied', 0))
        total_housing = max(owner_occupied + renter_occupied, 1)
        population_25_plus = int(datausa_data.get('Total Population 25 Years And Over', 1))
        bachelors_plus = int(datausa_data.get('Bachelor Degree Or Higher', 0))
        
        # Determine urbanization level based on population
        if population > 50000:
            urbanization = "URBAN"
        elif population > 10000:
            urbanization = "SUBURBAN"
        else:
            urbanization = "RURAL"
        
        demographics = Demographics(
            medianAge=float(datausa_data.get('Median Age', 35.0)),
            medianIncome=int(datausa_data.get('Median Household Income', 50000)),
            populationDensity=population,  # Simplified - would need area for true density
            householdSize=2.5,  # DataUSA doesn't provide this directly
            collegeEducated=round((bachelors_plus / population_25_plus) * 100, 1) if population_25_plus > 0 else 0,
            unemploymentRate=float(datausa_data.get('Unemployment Rate', 5.0)),
            whiteCollarJobs=65.0,  # Would need occupation data - using average
            homeOwnership=round((owner_occupied / total_housing) * 100, 1) if total_housing > 0 else 0,
            medianHomeValue=int(datausa_data.get('Median Property Value', 200000)),
            rentBurden=30.0,  # Would need detailed rent burden data
            internetPenetration=90.0,  # Not available in DataUSA
            mobileUsage=88.0,
            socialMediaUsage=70.0,
            onlineShoppingIndex=120.0,
            urbanizationLevel=urbanization,
            retailDensity=300,
            competitionIndex=75.0,
            tvConsumption=4.0,
            digitalAdReceptivity=78.0,
            brandLoyalty=50.0
        )
        
        return GeographicRegion(
            id=zip_code,
            name=f"{zip_code} (DataUSA.io)",
            source="DATAUSA_IO",
            demographics=demographics,
            lastUpdated=datetime.utcnow().isoformat()
        )

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# Geographic API Endpoints
@api_router.get("/geographic/zip/{zip_code}", response_model=GeographicRegion)
async def get_zip_demographics(zip_code: str):
    """Get demographic data for a specific ZIP code from DataUSA.io"""
    try:
        # Validate ZIP code format
        if not zip_code.isdigit() or len(zip_code) not in [4, 5]:
            raise HTTPException(status_code=400, detail="Invalid ZIP code format")
        
        # Get data from DataUSA.io
        datausa_data = await DataUSAService.get_zip_demographics(zip_code)
        
        if datausa_data:
            # Transform real data to our format
            region = DataUSAService.transform_datausa_to_demographics(datausa_data, zip_code)
            logger.info(f"Returning real DataUSA data for ZIP {zip_code}")
            return region
        else:
            # Fallback to realistic mock data when DataUSA.io doesn't have data
            logger.warning(f"DataUSA.io has no data for ZIP {zip_code}, using fallback data")
            return create_fallback_zip_data(zip_code)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing ZIP code {zip_code}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def get_zip_location_name(zip_code: str) -> str:
    """Get city and state name for a ZIP code based on known patterns"""
    
    # Common ZIP code patterns with their corresponding city/state
    zip_locations = {
        # New York
        '100': 'New York, NY',
        '101': 'New York, NY', 
        '102': 'New York, NY',
        '103': 'Staten Island, NY',
        '104': 'Bronx, NY',
        '105': 'Mount Vernon, NY',
        '106': 'White Plains, NY',
        '107': 'Yonkers, NY',
        '108': 'New Rochelle, NY',
        '109': 'Pelham, NY',
        '110': 'Queens, NY',
        '111': 'Long Island City, NY',
        '112': 'Brooklyn, NY',
        '113': 'Flushing, NY',
        '114': 'Jamaica, NY',
        '115': 'Kew Gardens, NY',
        '116': 'Far Rockaway, NY',
        '117': 'Jamaica, NY',
        '118': 'Brooklyn, NY',
        '119': 'Brooklyn, NY',
        
        # California
        '900': 'Los Angeles, CA',
        '901': 'Los Angeles, CA',
        '902': 'Beverly Hills, CA',
        '903': 'Inglewood, CA',
        '904': 'Santa Monica, CA',
        '905': 'Torrance, CA',
        '906': 'Long Beach, CA',
        '907': 'Long Beach, CA',
        '908': 'Long Beach, CA',
        '910': 'Pasadena, CA',
        '911': 'Pasadena, CA',
        '912': 'Glendale, CA',
        '913': 'Beverly Hills, CA',
        '914': 'Santa Monica, CA',
        '915': 'Beverly Hills, CA',
        '916': 'Sacramento, CA',
        '917': 'Sacramento, CA',
        '918': 'Sacramento, CA',
        '919': 'Sacramento, CA',
        '920': 'Ventura, CA',
        '921': 'Santa Barbara, CA',
        '922': 'Santa Barbara, CA',
        '923': 'Ventura, CA',
        '924': 'Ventura, CA',
        '925': 'Walnut Creek, CA',
        '926': 'Fresno, CA',
        '927': 'Fresno, CA',
        '928': 'Fresno, CA',
        '930': 'Oxnard, CA',
        '931': 'Santa Barbara, CA',
        '932': 'Bakersfield, CA',
        '933': 'Bakersfield, CA',
        '934': 'Santa Barbara, CA',
        '935': 'Mojave, CA',
        '936': 'Fresno, CA',
        '937': 'Fresno, CA',
        '938': 'Fresno, CA',
        '939': 'Salinas, CA',
        '940': 'San Francisco, CA',
        '941': 'San Francisco, CA',
        '942': 'Sacramento, CA',
        '943': 'Palo Alto, CA',
        '944': 'San Mateo, CA',
        '945': 'Oakland, CA',
        '946': 'Oakland, CA',
        '947': 'Berkeley, CA',
        '948': 'Richmond, CA',
        '949': 'Tiburon, CA',  # This covers 94920!
        '950': 'Santa Rosa, CA',
        '951': 'Riverside, CA',
        '952': 'Riverside, CA',
        '953': 'Riverside, CA',
        '954': 'Santa Maria, CA',
        '955': 'Eureka, CA',
        '956': 'Fresno, CA',
        '957': 'San Jose, CA',
        '958': 'Santa Cruz, CA',
        '959': 'Stockton, CA',
        '960': 'Redding, CA',
        '961': 'Reno, NV',
        
        # Texas
        '750': 'Dallas, TX',
        '751': 'Dallas, TX',
        '752': 'Dallas, TX',
        '753': 'Dallas, TX',
        '754': 'Greenville, TX',
        '755': 'Texarkana, TX',
        '756': 'Longview, TX',
        '757': 'Tyler, TX',
        '758': 'Palestine, TX',
        '759': 'Lufkin, TX',
        '760': 'Fort Worth, TX',
        '761': 'Fort Worth, TX',
        '762': 'Denton, TX',
        '763': 'Wichita Falls, TX',
        '764': 'Eastland, TX',
        '765': 'Temple, TX',
        '766': 'Waco, TX',
        '767': 'Waco, TX',
        '768': 'Brownwood, TX',
        '769': 'San Angelo, TX',
        '770': 'Houston, TX',
        '771': 'Houston, TX',
        '772': 'Houston, TX',
        '773': 'Huntsville, TX',
        '774': 'Conroe, TX',
        '775': 'Galveston, TX',
        '776': 'Beaumont, TX',
        '777': 'Beaumont, TX',
        '778': 'Bryan, TX',
        '779': 'Bryan, TX',
        '780': 'San Antonio, TX',
        '781': 'San Antonio, TX',
        '782': 'San Antonio, TX',
        '783': 'Corpus Christi, TX',
        '784': 'Corpus Christi, TX',
        '785': 'McAllen, TX',
        '786': 'Austin, TX',
        '787': 'Austin, TX',
        '788': 'Austin, TX',
        '789': 'Giddings, TX',
        '790': 'Amarillo, TX',
        '791': 'Amarillo, TX',
        '792': 'Childress, TX',
        '793': 'Lubbock, TX',
        '794': 'Lubbock, TX',
        '795': 'Abilene, TX',
        '796': 'Abilene, TX',
        '797': 'Midland, TX',
        '798': 'El Paso, TX',
        '799': 'El Paso, TX',
        
        # Florida
        '320': 'Jacksonville, FL',
        '321': 'Orlando, FL',
        '322': 'Melbourne, FL',
        '323': 'Cocoa, FL',
        '324': 'Gainesville, FL',
        '325': 'Ocala, FL',
        '326': 'Gainesville, FL',
        '327': 'Leesburg, FL',
        '328': 'Orlando, FL',
        '329': 'Orlando, FL',
        '330': 'Miami, FL',
        '331': 'Miami, FL',
        '332': 'Miami, FL',
        '333': 'Miami, FL',
        '334': 'Fort Lauderdale, FL',
        '335': 'Fort Lauderdale, FL',
        '336': 'Tampa, FL',
        '337': 'Tampa, FL',
        '338': 'Lakeland, FL',
        '339': 'Tampa, FL',
        '340': 'Tallahassee, FL',
        '341': 'Tallahassee, FL',
        '342': 'Panama City, FL',
        '343': 'Tallahassee, FL',
        '344': 'Gainesville, FL',
        
        # Illinois  
        '600': 'Chicago, IL',
        '601': 'Chicago, IL',
        '602': 'Chicago, IL',
        '603': 'Chicago, IL',
        '604': 'Chicago, IL',
        '605': 'Chicago, IL',
        '606': 'Chicago, IL',
        '607': 'Chicago, IL',
        '608': 'Chicago, IL',
        '609': 'Chicago, IL',
        '610': 'Rockford, IL',
        '611': 'Rockford, IL',
        '612': 'Rock Island, IL',
        '613': 'La Salle, IL',
        '614': 'Galesburg, IL',
        '615': 'Peoria, IL',
        '616': 'Peoria, IL',
        '617': 'Bloomington, IL',
        '618': 'Champaign, IL',
        '619': 'Champaign, IL',
        '620': 'East St. Louis, IL',
        '621': 'East St. Louis, IL',
        '622': 'East St. Louis, IL',
        '623': 'Quincy, IL',
        '624': 'Effingham, IL',
        '625': 'Springfield, IL',
        '626': 'Springfield, IL',
        '627': 'Springfield, IL',
        '628': 'Centralia, IL',
        '629': 'Carbondale, IL'
    }
    
    # Try to match first 3 digits
    prefix = zip_code[:3]
    if prefix in zip_locations:
        return zip_locations[prefix]
    
    # Fall back to state-level matching based on first digit
    first_digit = zip_code[0]
    state_map = {
        '0': 'Massachusetts',
        '1': 'New York', 
        '2': 'Washington DC',
        '3': 'Florida',
        '4': 'Georgia',
        '5': 'Alabama',
        '6': 'Illinois',
        '7': 'Texas',
        '8': 'Colorado',
        '9': 'California'
    }
    
    if first_digit in state_map:
        return f"{zip_code}, {state_map[first_digit]}"
    
    return f"{zip_code}, US"

def create_fallback_zip_data(zip_code: str) -> GeographicRegion:
    """Create realistic fallback demographic data for a ZIP code"""
    
    # Generate somewhat realistic data based on ZIP code characteristics
    zip_int = int(zip_code.zfill(5))
    
    # Use ZIP code to create variation in demographics
    median_income = 35000 + (zip_int % 100000)  # Varies from 35k to 135k
    median_age = 25 + (zip_int % 40)  # Varies from 25 to 65
    population = 5000 + (zip_int % 50000)  # Varies from 5k to 55k
    
    # Get proper city/state name
    location_name = get_zip_location_name(zip_code)
    
    # Determine urbanization based on ZIP patterns
    if zip_code.startswith(('100', '101', '102')):  # NYC area
        urbanization = "URBAN"
        median_income = max(median_income, 60000)
    elif zip_code.startswith(('902', '903', '904')):  # CA area  
        urbanization = "URBAN"
        median_income = max(median_income, 70000)
    elif zip_code.startswith(('600', '601', '602')):  # Chicago area
        urbanization = "URBAN"
        median_income = max(median_income, 55000)
    elif int(zip_code[0]) <= 3:  # East coast
        urbanization = "SUBURBAN"
    else:
        urbanization = "MIXED"
    
    demographics = Demographics(
        medianAge=float(median_age),
        medianIncome=int(median_income),
        populationDensity=population,
        householdSize=2.3 + (zip_int % 10) / 10,  # 2.3 to 3.2
        collegeEducated=25.0 + (zip_int % 50),  # 25% to 75%
        unemploymentRate=3.0 + (zip_int % 8),  # 3% to 11%
        whiteCollarJobs=50.0 + (zip_int % 40),  # 50% to 90%
        homeOwnership=40.0 + (zip_int % 50),  # 40% to 90%
        medianHomeValue=int(median_income * 3.5),  # Roughly 3.5x income
        rentBurden=25.0 + (zip_int % 20),  # 25% to 45%
        internetPenetration=85.0 + (zip_int % 15),  # 85% to 100%
        mobileUsage=80.0 + (zip_int % 20),  # 80% to 100%
        socialMediaUsage=60.0 + (zip_int % 30),  # 60% to 90%
        onlineShoppingIndex=100.0 + (zip_int % 50),  # 100 to 150
        urbanizationLevel=urbanization,
        retailDensity=200 + (zip_int % 400),  # 200 to 600
        competitionIndex=50.0 + (zip_int % 50),  # 50% to 100%
        tvConsumption=2.0 + (zip_int % 40) / 10,  # 2.0 to 6.0 hours
        digitalAdReceptivity=60.0 + (zip_int % 30),  # 60% to 90%
        brandLoyalty=30.0 + (zip_int % 50)  # 30% to 80%
    )
    
    return GeographicRegion(
        id=zip_code,
        name=f"{location_name} ({zip_code})",
        source="FALLBACK_REALISTIC",
        demographics=demographics,
        lastUpdated=datetime.utcnow().isoformat()
    )

@api_router.get("/geographic/zips", response_model=GeographicResponse)
async def get_multiple_zip_demographics(zip_codes: str):
    """Get demographic data for multiple ZIP codes (comma-separated)"""
    try:
        zip_list = [zip_code.strip() for zip_code in zip_codes.split(',') if zip_code.strip()]
        
        if len(zip_list) > 50:  # Limit to prevent abuse
            raise HTTPException(status_code=400, detail="Too many ZIP codes requested (max 50)")
        
        regions = []
        
        # Process each ZIP code
        for zip_code in zip_list:
            try:
                # Validate ZIP code format before processing
                if not zip_code.isdigit() or len(zip_code) not in [4, 5]:
                    logger.warning(f"Skipping invalid ZIP code format: {zip_code}")
                    continue
                    
                datausa_data = await DataUSAService.get_zip_demographics(zip_code)
                if datausa_data:
                    region = DataUSAService.transform_datausa_to_demographics(datausa_data, zip_code)
                    logger.info(f"Got real DataUSA data for ZIP {zip_code}")
                    regions.append(region)
                else:
                    # Use fallback data when DataUSA.io doesn't have data
                    region = create_fallback_zip_data(zip_code)
                    logger.warning(f"Using fallback data for ZIP {zip_code}")
                    regions.append(region)
            except Exception as e:
                logger.warning(f"Failed to get data for ZIP {zip_code}: {e}")
                # Skip invalid ZIP codes rather than adding fallback data
                continue
        
        return GeographicResponse(
            regions=regions,
            count=len(regions),
            source="DATAUSA_IO_WITH_FALLBACK"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing multiple ZIP codes: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/geographic/states", response_model=GeographicResponse)
async def get_states():
    """Get list of US states with basic demographic data"""
    try:
        # For now, return a basic list of major states
        # In a full implementation, this would fetch state-level data from DataUSA.io
        states = [
            {"id": "CA", "name": "California", "code": "CA"},
            {"id": "TX", "name": "Texas", "code": "TX"},
            {"id": "FL", "name": "Florida", "code": "FL"},
            {"id": "NY", "name": "New York", "code": "NY"},
            {"id": "PA", "name": "Pennsylvania", "code": "PA"},
            {"id": "IL", "name": "Illinois", "code": "IL"},
            {"id": "OH", "name": "Ohio", "code": "OH"},
            {"id": "GA", "name": "Georgia", "code": "GA"},
            {"id": "NC", "name": "North Carolina", "code": "NC"},
            {"id": "MI", "name": "Michigan", "code": "MI"}
        ]
        
        # Create basic demographic data for states
        state_regions = []
        for state in states:
            demographics = Demographics(
                medianAge=38.0,
                medianIncome=55000,
                populationDensity=100,
                householdSize=2.5,
                collegeEducated=32.0,
                unemploymentRate=5.5,
                whiteCollarJobs=65.0,
                homeOwnership=65.0,
                medianHomeValue=250000,
                rentBurden=30.0,
                internetPenetration=85.0,
                mobileUsage=88.0,
                socialMediaUsage=70.0,
                onlineShoppingIndex=120.0,
                urbanizationLevel="MIXED",
                retailDensity=300,
                competitionIndex=75.0,
                tvConsumption=4.0,
                digitalAdReceptivity=78.0,
                brandLoyalty=50.0
            )
            
            region = GeographicRegion(
                id=state["code"],
                name=state["name"],
                source="STATE_LIST",
                type="state",
                demographics=demographics,
                lastUpdated=datetime.utcnow().isoformat()
            )
            state_regions.append(region)
        
        return GeographicResponse(
            regions=state_regions,
            count=len(state_regions),
            source="STATE_LIST"
        )
        
    except Exception as e:
        logger.error(f"Error getting states: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/geographic/dmas", response_model=GeographicResponse) 
async def get_dmas():
    """Get list of Designated Market Areas (DMAs)"""
    try:
        # Major DMAs for testing
        dmas = [
            {"id": "501", "name": "New York", "rank": 1},
            {"id": "803", "name": "Los Angeles", "rank": 2},
            {"id": "602", "name": "Chicago", "rank": 3},
            {"id": "504", "name": "Philadelphia", "rank": 4},
            {"id": "623", "name": "Dallas-Ft. Worth", "rank": 5},
            {"id": "807", "name": "San Francisco-Oakland-San Jose", "rank": 6},
            {"id": "539", "name": "Tampa-St. Pete (Sarasota)", "rank": 7},
            {"id": "511", "name": "Washington, DC (Hagerstown)", "rank": 8},
            {"id": "618", "name": "Houston", "rank": 9},
            {"id": "506", "name": "Boston (Manchester)", "rank": 10}
        ]
        
        dma_regions = []
        for dma in dmas:
            demographics = Demographics(
                medianAge=36.0,
                medianIncome=60000,
                populationDensity=500,
                householdSize=2.4,
                collegeEducated=35.0,
                unemploymentRate=4.8,
                whiteCollarJobs=70.0,
                homeOwnership=60.0,
                medianHomeValue=300000,
                rentBurden=32.0,
                internetPenetration=90.0,
                mobileUsage=92.0,
                socialMediaUsage=75.0,
                onlineShoppingIndex=130.0,
                urbanizationLevel="URBAN",
                retailDensity=500,
                competitionIndex=85.0,
                tvConsumption=3.5,
                digitalAdReceptivity=82.0,
                brandLoyalty=45.0
            )
            
            region = GeographicRegion(
                id=dma["id"],
                name=f"DMA {dma['rank']}: {dma['name']}",
                source="DMA_LIST",
                type="dma",
                demographics=demographics,
                lastUpdated=datetime.utcnow().isoformat()
            )
            dma_regions.append(region)
        
        return GeographicResponse(
            regions=dma_regions,
            count=len(dma_regions),
            source="DMA_LIST"
        )
        
    except Exception as e:
        logger.error(f"Error getting DMAs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
