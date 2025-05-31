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

# Load environment variables from .env file
load_dotenv()
import json

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
    """Get city and state name for a ZIP code based on known patterns"""
    
    # Fall back to state-level matching based on ZIP code patterns
    first_two = zip_code[:2] if len(zip_code) >= 2 else zip_code[0]
    
    # More accurate state mapping based on ZIP code patterns
    if first_two == '06':
        return f"{zip_code}, Connecticut"
    elif first_two in ['01', '02']:
        if first_two == '02' and zip_code.startswith('028'):
            return f"{zip_code}, Rhode Island"
        return f"{zip_code}, Massachusetts"  
    elif first_two == '03':
        return f"{zip_code}, New Hampshire"
    elif first_two == '04':
        return f"{zip_code}, Maine"
    elif first_two == '05':
        return f"{zip_code}, Vermont"
    elif zip_code[0] == '1':
        return f"{zip_code}, New York"
    elif zip_code[0] == '2':
        return f"{zip_code}, Washington DC area"
    elif zip_code[0] == '3':
        return f"{zip_code}, Florida"
    elif zip_code[0] == '4':
        return f"{zip_code}, Georgia"
    elif zip_code[0] == '5':
        return f"{zip_code}, Alabama"
    elif zip_code[0] == '6':
        return f"{zip_code}, Illinois"
    elif zip_code[0] == '7':
        return f"{zip_code}, Texas"
    elif zip_code[0] == '8':
        return f"{zip_code}, Colorado"
    elif zip_code[0] == '9':
        return f"{zip_code}, California"
    else:
        return f"{zip_code}, US"

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

@app.get("/api/geographic/states")
async def get_us_states():
    """Get list of US states for region selection"""
    states = [
        {"id": "AL", "name": "Alabama"},
        {"id": "AK", "name": "Alaska"},
        {"id": "AZ", "name": "Arizona"},
        {"id": "AR", "name": "Arkansas"},
        {"id": "CA", "name": "California"},
        {"id": "CO", "name": "Colorado"},
        {"id": "CT", "name": "Connecticut"},
        {"id": "DE", "name": "Delaware"},
        {"id": "FL", "name": "Florida"},
        {"id": "GA", "name": "Georgia"},
        {"id": "HI", "name": "Hawaii"},
        {"id": "ID", "name": "Idaho"},
        {"id": "IL", "name": "Illinois"},
        {"id": "IN", "name": "Indiana"},
        {"id": "IA", "name": "Iowa"},
        {"id": "KS", "name": "Kansas"},
        {"id": "KY", "name": "Kentucky"},
        {"id": "LA", "name": "Louisiana"},
        {"id": "ME", "name": "Maine"},
        {"id": "MD", "name": "Maryland"},
        {"id": "MA", "name": "Massachusetts"},
        {"id": "MI", "name": "Michigan"},
        {"id": "MN", "name": "Minnesota"},
        {"id": "MS", "name": "Mississippi"},
        {"id": "MO", "name": "Missouri"},
        {"id": "MT", "name": "Montana"},
        {"id": "NE", "name": "Nebraska"},
        {"id": "NV", "name": "Nevada"},
        {"id": "NH", "name": "New Hampshire"},
        {"id": "NJ", "name": "New Jersey"},
        {"id": "NM", "name": "New Mexico"},
        {"id": "NY", "name": "New York"},
        {"id": "NC", "name": "North Carolina"},
        {"id": "ND", "name": "North Dakota"},
        {"id": "OH", "name": "Ohio"},
        {"id": "OK", "name": "Oklahoma"},
        {"id": "OR", "name": "Oregon"},
        {"id": "PA", "name": "Pennsylvania"},
        {"id": "RI", "name": "Rhode Island"},
        {"id": "SC", "name": "South Carolina"},
        {"id": "SD", "name": "South Dakota"},
        {"id": "TN", "name": "Tennessee"},
        {"id": "TX", "name": "Texas"},
        {"id": "UT", "name": "Utah"},
        {"id": "VT", "name": "Vermont"},
        {"id": "VA", "name": "Virginia"},
        {"id": "WA", "name": "Washington"},
        {"id": "WV", "name": "West Virginia"},
        {"id": "WI", "name": "Wisconsin"},
        {"id": "WY", "name": "Wyoming"}
    ]
    
    return {"regions": states, "source": "STATIC"}

@app.get("/api/geographic/dmas")
async def get_dmas():
    """Get list of Designated Market Areas (DMAs)"""
    # Sample DMA data - in production this would come from a proper source
    dmas = [
        {"id": "501", "name": "New York, NY"},
        {"id": "803", "name": "Los Angeles, CA"},
        {"id": "602", "name": "Chicago, IL"},
        {"id": "504", "name": "Philadelphia, PA"},
        {"id": "623", "name": "Dallas-Ft. Worth, TX"},
        {"id": "506", "name": "Boston, MA"},
        {"id": "511", "name": "Washington, DC"},
        {"id": "539", "name": "Tampa-St. Petersburg, FL"},
        {"id": "618", "name": "Houston, TX"},
        {"id": "505", "name": "Detroit, MI"}
    ]
    
    return {"regions": dmas, "source": "STATIC"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)