from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid

class ObjectiveType(str, Enum):
    CONVERSIONS = "conversions"
    REVENUE = "revenue"
    ROAS = "roas"
    BRAND_AWARENESS = "brand_awareness"
    TRAFFIC = "traffic"

class MarketSelectionMethod(str, Enum):
    MANUAL = "manual"
    AUTOMATIC = "automatic"

class TestStatus(str, Enum):
    DRAFT = "draft"
    QUALITY_REVIEW = "quality_review"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    REJECTED = "rejected"

class GeographicUnit(BaseModel):
    id: str
    name: str
    type: str  # "zip", "dma", "state"
    population: int
    historical_conversions: int
    historical_spend: float
    historical_revenue: float
    conversion_rate: float
    cpm: float
    ctr: float

class TestObjective(BaseModel):
    type: ObjectiveType
    primary_kpi: str
    secondary_kpis: Optional[List[str]] = []
    measurement_window: int = 14  # days
    expected_lift: Optional[float] = None

class BudgetConfiguration(BaseModel):
    total_budget: float
    daily_budget: float
    duration_days: int
    min_spend_threshold: float = 1000.0
    allocation_method: str = "equal"  # "equal", "population_weighted"

class MarketSelection(BaseModel):
    method: MarketSelectionMethod
    selected_units: Optional[List[str]] = []  # Unit IDs
    criteria: Optional[Dict[str, Any]] = {}
    auto_selection_params: Optional[Dict[str, Any]] = {}

class StatisticalMetrics(BaseModel):
    mse: float
    variance: float
    bias: float
    coverage: float
    power: float
    significance_level: float = 0.05
    minimum_detectable_effect: float

class QualityIndicators(BaseModel):
    statistical_metrics: StatisticalMetrics
    balance_score: float  # 0-100, higher is better
    sample_size_adequacy: bool
    spend_adequacy: bool
    conversion_volume_adequacy: bool
    overall_quality_score: float  # 0-100
    recommendations: List[str]
    warnings: List[str]

class TestGroup(BaseModel):
    group_id: str
    group_type: str  # "treatment" or "control"
    units: List[GeographicUnit]
    total_population: int
    historical_metrics: Dict[str, float]
    allocation_percentage: float

class GeoLiftTest(BaseModel):
    test_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    
    # Step 1: Objectives
    objective: TestObjective
    
    # Step 2: Budget
    budget: BudgetConfiguration
    
    # Step 3: Markets
    market_selection: MarketSelection
    
    # Step 4: Statistical Analysis
    treatment_group: Optional[TestGroup] = None
    control_group: Optional[TestGroup] = None
    quality_indicators: Optional[QualityIndicators] = None
    
    # Step 5: Approval & Launch
    status: TestStatus = TestStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    approved_at: Optional[datetime] = None
    launched_at: Optional[datetime] = None
    
    # Meta Campaign Integration
    meta_campaign_id: Optional[str] = None
    meta_campaign_config: Optional[Dict[str, Any]] = {}

class MetaAccountData(BaseModel):
    """Dummy structure matching Meta API response format"""
    account_id: str
    account_name: str
    business_id: str
    
    # Geographic performance data
    geographic_insights: List[Dict[str, Any]]
    
    # Historical metrics by location
    conversion_data: Dict[str, Dict[str, float]]  # {zip_code: {metric: value}}
    spend_data: Dict[str, Dict[str, float]]
    performance_metrics: Dict[str, Any]

class OptimizationRequest(BaseModel):
    available_units: List[GeographicUnit]
    objectives: List[str]
    constraints: Dict[str, Any]
    treatment_percentage: float = 0.5

class OptimizationResult(BaseModel):
    treatment_units: List[str]
    control_units: List[str]
    balance_metrics: Dict[str, float]
    optimization_score: float
    iterations: int
    convergence_achieved: bool
