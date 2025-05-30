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
            
            url = f"{cls.BASE_URL}?drilldowns=ZCTA&measures={','.join(measures)}&year=latest&geo={zcta}"
            
            # Make async request using requests in thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: requests.get(url, timeout=10)
            )
            
            if response.status_code != 200:
                logger.error(f"DataUSA API error: {response.status_code}")
                return None
                
            data = response.json()
            
            if not data.get('data') or len(data['data']) == 0:
                logger.warning(f"No DataUSA data found for ZIP {zip_code}")
                return None
                
            return data['data'][0]
            
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
