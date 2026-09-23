from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class PartiesSchema(BaseModel):
    customer: Optional[str] = "Customer Corp"
    vendor: Optional[str] = "Vendor Services"
    legalOwner: Optional[str] = "Legal Team"

class ClauseBase(BaseModel):
    clause_type: Optional[str] = None
    text: str
    page_number: Optional[int] = None

class ClauseResponse(ClauseBase):
    id: str
    contract_id: str

    class Config:
        from_attributes = True

class RiskIndicatorBase(BaseModel):
    description: str
    severity: Optional[str] = "Moderate"

class RiskIndicatorResponse(RiskIndicatorBase):
    id: str
    contract_id: str

    class Config:
        from_attributes = True

class ContractBase(BaseModel):
    name: str
    contractType: Optional[str] = Field(default="General Agreement", alias="contractType")
    company: str
    status: Optional[str] = "Draft"
    riskLevel: Optional[str] = Field(default="Low", alias="riskLevel")
    
    startDate: Optional[str] = Field(default=None, alias="startDate")
    expiryDate: Optional[str] = Field(default=None, alias="expiryDate")
    renewalDate: Optional[str] = Field(default=None, alias="renewalDate")
    noticePeriod: Optional[str] = Field(default=None, alias="noticePeriod")
    paymentTerms: Optional[str] = Field(default=None, alias="paymentTerms")
    penaltyInfo: Optional[str] = Field(default=None, alias="penaltyInfo")
    summary: Optional[str] = None
    
    parties: Optional[PartiesSchema] = None

    class Config:
        populate_by_name = True

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    name: Optional[str] = None
    contractType: Optional[str] = Field(default=None, alias="contractType")
    company: Optional[str] = None
    status: Optional[str] = None
    riskLevel: Optional[str] = Field(default=None, alias="riskLevel")
    expiryDate: Optional[str] = Field(default=None, alias="expiryDate")
    renewalDate: Optional[str] = Field(default=None, alias="renewalDate")
    noticePeriod: Optional[str] = Field(default=None, alias="noticePeriod")
    paymentTerms: Optional[str] = Field(default=None, alias="paymentTerms")
    penaltyInfo: Optional[str] = Field(default=None, alias="penaltyInfo")
    summary: Optional[str] = None

    class Config:
        populate_by_name = True

class ContractResponse(BaseModel):
    id: str
    name: str
    contractType: str = Field(alias="contract_type")
    company: str
    status: str
    riskLevel: str = Field(alias="risk_level")
    
    startDate: Optional[str] = Field(default=None, alias="start_date")
    expiryDate: Optional[str] = Field(default=None, alias="expiry_date")
    renewalDate: Optional[str] = Field(default=None, alias="renewal_date")
    noticePeriod: Optional[str] = Field(default=None, alias="notice_period")
    paymentTerms: Optional[str] = Field(default=None, alias="payment_terms")
    penaltyInfo: Optional[str] = Field(default=None, alias="penalty_info")
    summary: Optional[str] = None
    lastUpdated: Optional[str] = None
    
    clauses: List[str] = []
    riskIndicators: List[str] = []
    parties: PartiesSchema = Field(default_factory=PartiesSchema)
    
    fileName: Optional[str] = Field(default=None, alias="file_name")
    fileSize: Optional[str] = Field(default=None, alias="file_size")

    class Config:
        populate_by_name = True
        from_attributes = True
