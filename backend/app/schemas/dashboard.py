from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ExecutiveOverview(BaseModel):
    totalContracts: int
    activeContracts: int
    contractsExpiringSoon: int
    upcomingRenewals: int
    overdueCount: int
    reviewRequired: int
    draftContracts: int
    expiredContracts: int
    highRiskContracts: int
    riskDistribution: Dict[str, int]
    statusDistribution: Dict[str, int]
    categoryDistribution: Dict[str, int]

class SmartInsights(BaseModel):
    highRiskAlerts: List[Dict[str, Any]]
    upcomingDeadlines: List[Dict[str, Any]]
    missingOrProblematicClauses: List[Dict[str, Any]]
    actionableRecommendations: List[Dict[str, Any]]

class DeadlineItem(BaseModel):
    id: str
    contractId: str
    contractName: str
    contractType: str
    company: str
    type: str # EXPIRY, RENEWAL, NOTICE, MISSING_DATE
    typeLabel: str # Expiry Date, Renewal Date, Notice Deadline, Missing Date
    date: Optional[str] = None
    daysRemaining: Optional[int] = None
    status: str # OVERDUE, DUE_TODAY, URGENT, UPCOMING, UNCLEAR
    urgency: str # critical, high, medium, low, info
    action: str
    riskLevel: str
    startDate: Optional[str] = None
    expiryDate: Optional[str] = None
    renewalDate: Optional[str] = None
    noticePeriod: Optional[str] = None
    paymentTerms: Optional[str] = None
    penaltyInfo: Optional[str] = None
    summary: Optional[str] = None
    riskIndicators: List[str] = []

class DashboardStats(BaseModel):
    totalContracts: int
    activeContracts: int
    reviewRequired: int
    draftContracts: int
    expiredContracts: int
    highRiskContracts: int
    renewalsDueNext90Days: int
    contractVisibility: str = "100%"
    riskDistribution: Dict[str, int]
    statusDistribution: Dict[str, int]

class DashboardResponse(BaseModel):
    executiveOverview: ExecutiveOverview
    smartInsights: SmartInsights
    deadlines: List[DeadlineItem]
    recentActivity: List[Dict[str, Any]]
    stats: DashboardStats
