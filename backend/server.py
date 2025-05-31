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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)