"""
Enterprise Agentic Loan System API Server
FastAPI server to expose the enterprise agentic system as REST API for n8n integration
"""
import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Import the enterprise agentic system
import sys
sys.path.append('/Users/saibhargav/workspace/enterprise-agentic-loan-system')

from main import EnterpriseAgenticLoanProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Enterprise Agentic Loan System API",
    description="REST API for the Enterprise Agentic Loan Processing System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the enterprise loan processor
try:
    loan_processor = EnterpriseAgenticLoanProcessor()
    logger.info("Enterprise Agentic Loan Processor initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize loan processor: {str(e)}")
    loan_processor = None

# Pydantic models for request/response
class DocumentProcessingRequest(BaseModel):
    documents: List[Dict[str, Any]]
    borrower_info: Dict[str, Any]
    processing_options: Optional[Dict[str, Any]] = Field(default_factory=dict)

class LoanProcessingRequest(BaseModel):
    loan_data: Dict[str, Any]
    document_results: Optional[Dict[str, Any]] = None
    enterprise_config: Optional[Dict[str, Any]] = Field(default_factory=dict)

class DocumentProcessingResponse(BaseModel):
    status: str
    documents_processed: int
    extracted_data: Dict[str, Any]
    validation_status: str
    processing_time: float
    timestamp: str

class LoanProcessingResponse(BaseModel):
    status: str
    loan_id: str
    final_decision: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    compliance_check: Dict[str, Any]
    processing_time: float
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    system_health: Dict[str, Any]

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "Enterprise Agentic Loan System API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        if loan_processor:
            system_status = loan_processor.get_system_status()
            return HealthResponse(
                status="healthy",
                timestamp=datetime.now().isoformat(),
                version="1.0.0",
                system_health=system_status
            )
        else:
            return HealthResponse(
                status="unhealthy",
                timestamp=datetime.now().isoformat(),
                version="1.0.0",
                system_health={"error": "Loan processor not initialized"}
            )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.now().isoformat(),
            version="1.0.0",
            system_health={"error": str(e)}
        )

@app.post("/process-documents", response_model=DocumentProcessingResponse)
async def process_documents(
    request: DocumentProcessingRequest,
    x_enterprise_tier: Optional[str] = Header(None)
):
    """Process loan documents using the document processing agent"""
    try:
        start_time = datetime.now()
        
        if not loan_processor:
            raise HTTPException(status_code=503, detail="Loan processor not available")
        
        # Prepare document processing data
        processing_data = {
            "documents": request.documents,
            "borrower_info": request.borrower_info,
            "processing_options": request.processing_options,
            "enterprise_tier": x_enterprise_tier or "standard"
        }
        
        # Process documents using the document processing agent
        result = loan_processor.document_agent.process_documents(processing_data)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return DocumentProcessingResponse(
            status="success",
            documents_processed=len(request.documents),
            extracted_data=result.get("extracted_data", {}),
            validation_status=result.get("validation_status", "unknown"),
            processing_time=processing_time,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Document processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document processing failed: {str(e)}")

@app.post("/process-loan", response_model=LoanProcessingResponse)
async def process_loan(
    request: LoanProcessingRequest,
    x_enterprise_tier: Optional[str] = Header(None),
    x_processing_mode: Optional[str] = Header(None)
):
    """Process complete loan application using the enterprise agentic system"""
    try:
        start_time = datetime.now()
        
        if not loan_processor:
            raise HTTPException(status_code=503, detail="Loan processor not available")
        
        # Prepare loan processing data
        loan_data = request.loan_data.copy()
        loan_data["enterprise_tier"] = x_enterprise_tier or "standard"
        loan_data["processing_mode"] = x_processing_mode or "standard"
        loan_data["enterprise_config"] = request.enterprise_config
        
        # Add document results if provided
        if request.document_results:
            loan_data["document_results"] = request.document_results
        
        # Process loan using the enterprise agentic system
        result = loan_processor.process_loan_application(loan_data)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return LoanProcessingResponse(
            status="success",
            loan_id=result.get("loan_id", "unknown"),
            final_decision=result.get("final_decision", {}),
            risk_assessment=result.get("risk_assessment", {}),
            compliance_check=result.get("compliance_check", {}),
            processing_time=processing_time,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Loan processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Loan processing failed: {str(e)}")

@app.post("/process-complete-loan")
async def process_complete_loan(
    request: LoanProcessingRequest,
    x_enterprise_tier: Optional[str] = Header(None)
):
    """Process complete loan application in one call (documents + loan processing)"""
    try:
        start_time = datetime.now()
        
        if not loan_processor:
            raise HTTPException(status_code=503, detail="Loan processor not available")
        
        # Prepare complete processing data
        loan_data = request.loan_data.copy()
        loan_data["enterprise_tier"] = x_enterprise_tier or "standard"
        loan_data["enterprise_config"] = request.enterprise_config
        
        # Process complete loan application
        result = loan_processor.process_loan_application(loan_data)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Add processing metadata
        result["processing_metadata"] = {
            "processing_time": processing_time,
            "enterprise_tier": x_enterprise_tier or "standard",
            "timestamp": datetime.now().isoformat(),
            "api_version": "1.0.0"
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Complete loan processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Complete loan processing failed: {str(e)}")

@app.get("/system-status")
async def get_system_status():
    """Get current system status"""
    try:
        if loan_processor:
            return loan_processor.get_system_status()
        else:
            return {
                "status": "unavailable",
                "error": "Loan processor not initialized",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"System status check failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/agents")
async def get_agents():
    """Get information about available agents"""
    try:
        if loan_processor:
            return {
                "agents": [
                    {
                        "name": "Document Processing Agent",
                        "status": "active",
                        "capabilities": ["document_classification", "data_extraction", "validation"]
                    },
                    {
                        "name": "Risk Assessment Agent",
                        "status": "active",
                        "capabilities": ["credit_analysis", "risk_scoring", "financial_assessment"]
                    },
                    {
                        "name": "Compliance Agent",
                        "status": "active",
                        "capabilities": ["regulatory_compliance", "fair_lending", "audit_preparation"]
                    },
                    {
                        "name": "Decision Making Agent",
                        "status": "active",
                        "capabilities": ["loan_decision", "terms_calculation", "approval_logic"]
                    }
                ],
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "agents": [],
                "error": "Loan processor not initialized",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Agents info failed: {str(e)}")
        return {
            "agents": [],
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/test-endpoint")
async def test_endpoint(request: Request):
    """Test endpoint for debugging"""
    try:
        body = await request.body()
        headers = dict(request.headers)
        
        return {
            "status": "success",
            "message": "Test endpoint working",
            "received_body": json.loads(body) if body else {},
            "headers": headers,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Test endpoint failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "enterprise-api-server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
