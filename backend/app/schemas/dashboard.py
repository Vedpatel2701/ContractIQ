from typing import List, Dict, Any
from pydantic import BaseModel

class DashboardStats(BaseModel):
    totalContracts: int
    activeContracts: int
    reviewRequired: int
    draftContracts: int
    expiredContracts: int
    highRiskContracts: int
    renewalsDueNext90Days: int
    contractVisibility: str = "98%"
    
    riskDistribution: Dict[str, int]
    statusDistribution: Dict[str, int]

class DashboardResponse(BaseModel):
    stats: DashboardStats
    recentActivity: List[Dict[str, Any]]
