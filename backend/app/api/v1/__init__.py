from fastapi import APIRouter
from app.api.v1.contracts import router as contracts_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.chat import router as chat_router
from app.api.v1.notifications import router as notifications_router

api_v1_router = APIRouter()
api_v1_router.include_router(contracts_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(chat_router)
api_v1_router.include_router(notifications_router)
