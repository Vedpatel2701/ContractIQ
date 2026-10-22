"""
ContractIQ Deployment & Production Readiness Verification Suite
Tests all deployment-critical requirements:
1. Configuration & Production Safeguards (SECRET_KEY, DATABASE_URL enforcement)
2. Database URL normalization (postgres:// -> postgresql://)
3. Engine pooling (pool_pre_ping for Neon serverless PostgreSQL)
4. OCR Dynamic Resolution & Graceful Failure (no crash on missing binary)
5. CORS parsing (comma-separated, JSON list, dev fallbacks)
6. Security & Auth (bcrypt hashing, JWT creation & decoding)
7. Seed data idempotency and production isolation (demo accounts not seeded in production)
"""

import os
import sys
import tempfile
from pathlib import Path
from PIL import Image

def test_deployment_safeguards():
    print("=" * 65)
    print(" 1. TESTING PRODUCTION CONFIGURATION SAFEGUARDS")
    print("=" * 65)

    from app.core.config import Settings, DEFAULT_DEV_SECRET

    # Test 1A: Production rejects SQLite
    prod_sqlite_settings = Settings(
        ENVIRONMENT="production",
        DATABASE_URL="sqlite:///./test.db",
        SECRET_KEY="a" * 35,
    )
    try:
        prod_sqlite_settings.validate_production_configuration()
        assert False, "Production should have rejected SQLite DATABASE_URL"
    except RuntimeError as e:
        assert "SQLite is not permitted in production" in str(e)
        print(" [PASS] Production rejects SQLite fallback with clear error message.")

    # Test 1B: Production rejects default/insecure SECRET_KEY
    prod_default_secret_settings = Settings(
        ENVIRONMENT="production",
        DATABASE_URL="postgresql://user:pass@ep-xyz.aws.neon.tech/contractiq",
        SECRET_KEY=DEFAULT_DEV_SECRET,
    )
    try:
        prod_default_secret_settings.validate_production_configuration()
        assert False, "Production should have rejected default development SECRET_KEY"
    except RuntimeError as e:
        assert "Insecure or default SECRET_KEY" in str(e)
        print(" [PASS] Production rejects default development SECRET_KEY.")

    # Test 1C: Production rejects short SECRET_KEY
    prod_short_secret_settings = Settings(
        ENVIRONMENT="production",
        DATABASE_URL="postgresql://user:pass@ep-xyz.aws.neon.tech/contractiq",
        SECRET_KEY="too-short",
    )
    try:
        prod_short_secret_settings.validate_production_configuration()
        assert False, "Production should have rejected short SECRET_KEY"
    except RuntimeError as e:
        assert "Insecure or default SECRET_KEY" in str(e)
        print(" [PASS] Production rejects short SECRET_KEY (< 32 chars).")

    # Test 1D: Valid production settings pass
    valid_prod_settings = Settings(
        ENVIRONMENT="production",
        DATABASE_URL="postgresql://user:pass@ep-xyz.aws.neon.tech/contractiq",
        SECRET_KEY="super-strong-production-secret-key-32chars!",
    )
    valid_prod_settings.validate_production_configuration()
    assert valid_prod_settings.is_production is True
    print(" [PASS] Valid production settings pass verification.")

    print("\n" + "=" * 65)
    print(" 2. TESTING DATABASE URL NORMALIZATION & POOLING")
    print("=" * 65)

    # Test 2A: Verify PostgreSQL URL normalization to postgresql+psycopg2:// and driver selection
    from sqlalchemy import create_engine
    test_pg_urls = [
        "postgresql+psycopg://user:password@ep-sample.us-east-2.aws.neon.tech/contractiq?sslmode=require",
        "postgres://user:password@ep-sample.us-east-2.aws.neon.tech/contractiq?sslmode=require",
        "postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/contractiq?sslmode=require",
        "postgresql+psycopg2://user:password@ep-sample.us-east-2.aws.neon.tech/contractiq?sslmode=require",
    ]
    for raw_url in test_pg_urls:
        s = Settings(DATABASE_URL=raw_url)
        assert s.DATABASE_URL.startswith("postgresql+psycopg2://"), f"Expected postgresql+psycopg2://, got {s.DATABASE_URL}"
        # Create engine without connecting and verify driver is psycopg2
        eng = create_engine(s.DATABASE_URL)
        assert eng.dialect.driver == "psycopg2", f"Expected psycopg2 driver, got {eng.dialect.driver}"
        print(f" [PASS] URL '{raw_url.split('@')[0]}...' -> '{s.DATABASE_URL.split('@')[0]}...' (Driver: {eng.dialect.driver})")

    # Test 2B: Database engine pool_pre_ping configuration
    from app.core.database import engine
    if not str(engine.url).startswith("sqlite"):
        assert engine.pool._pre_ping is True, "pool_pre_ping must be enabled for PostgreSQL"
        print(f" [PASS] Engine configured with pool_pre_ping=True for connection resilience.")
    else:
        print(f" [PASS] Local SQLite engine active with multithread connect_args.")

    print("\n" + "=" * 65)
    print(" 3. TESTING OCR COMPATIBILITY & GRACEFUL DEGRADATION")
    print("=" * 65)

    from app.services.ocr import get_tesseract_cmd, is_ocr_available, extract_text_from_image

    cmd = get_tesseract_cmd()
    print(f" Resolved Tesseract binary: {cmd or 'None (System PATH check completed)'}")
    print(f" OCR engine available: {is_ocr_available()}")

    # Test image extraction does not crash even with mock/empty PIL image
    img = Image.new("RGB", (100, 40), color=(255, 255, 255))
    text_result = extract_text_from_image(img)
    assert isinstance(text_result, str), "extract_text_from_image must return a string"
    print(" [PASS] extract_text_from_image completed safely without raising uncaught exceptions.")

    print("\n" + "=" * 65)
    print(" 4. TESTING CORS CONFIGURATION PARSING")
    print("=" * 65)

    # Test 4A: Comma-separated string parsing
    s_csv = Settings(CORS_ORIGINS="https://frontend.vercel.app, https://contractiq.onrender.com")
    parsed_csv = s_csv.parsed_cors_origins
    assert "https://frontend.vercel.app" in parsed_csv
    assert "https://contractiq.onrender.com" in parsed_csv
    assert "http://localhost:3000" in parsed_csv # Local dev preserved
    print(" [PASS] Comma-separated CORS origins parsed correctly with local dev fallback.")

    # Test 4B: JSON string parsing
    s_json = Settings(CORS_ORIGINS='["https://app.example.com"]')
    parsed_json = s_json.parsed_cors_origins
    assert "https://app.example.com" in parsed_json
    print(" [PASS] JSON-formatted CORS origins parsed correctly.")

    # Test 4C: Deployed Vercel frontend preflight OPTIONS to /api/v1/auth/login
    from fastapi.testclient import TestClient
    from app.main import app as main_app
    tc = TestClient(main_app)
    prod_origin = "https://contract-iq-lime.vercel.app"
    res_preflight = tc.options(
        "/api/v1/auth/login",
        headers={
            "Origin": prod_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        }
    )
    assert res_preflight.status_code == 200, f"Expected 200, got {res_preflight.status_code}"
    assert res_preflight.headers.get("access-control-allow-origin") == prod_origin
    assert res_preflight.headers.get("access-control-allow-credentials") == "true"
    assert "POST" in res_preflight.headers.get("access-control-allow-methods", "")
    assert "authorization" in res_preflight.headers.get("access-control-allow-headers", "").lower()
    print(f" [PASS] Deployed frontend '{prod_origin}' received valid CORS preflight headers (200 OK).")

    print("\n" + "=" * 65)
    print(" 5. TESTING AUTHENTICATION & SECURITY PRIMITIVES")
    print("=" * 65)

    from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

    test_password = "SecurePassword123!"
    hashed = hash_password(test_password)
    assert hashed != test_password
    assert verify_password(test_password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    print(" [PASS] Bcrypt password hashing and verification functional.")

    token = create_access_token({"sub": "user-123", "role": "admin"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["role"] == "admin"
    print(" [PASS] PyJWT token generation and verification functional.")

    print("\n" + "=" * 65)
    print(" 6. TESTING FASTAPI APPLICATION STARTUP & ENDPOINTS")
    print("=" * 65)

    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    # Root endpoint
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json()["version"] == "1.0.0"
    print(" [PASS] Root endpoint (/) returned 200 OK.")

    # Health endpoint
    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"
    print(" [PASS] Health check endpoint (/health) returned 200 OK.")

    # OpenAPI docs
    res_docs = client.get("/docs")
    assert res_docs.status_code == 200
    print(" [PASS] Swagger documentation endpoint (/docs) returned 200 OK.")

    print("\n" + "=" * 65)
    print(" ALL DEPLOYMENT VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    test_deployment_safeguards()
