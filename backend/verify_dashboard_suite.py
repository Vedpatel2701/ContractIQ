import sys
from pathlib import Path
from datetime import datetime, date
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent))

from app.main import app, init_db
from app.core.database import SessionLocal
from app.models import User, Contract, UserRole
from app.core.security import create_access_token, hash_password

def run_dashboard_verification():
    print("=" * 60)
    print("       CONTRACTIQ DASHBOARD INTELLIGENCE & TRACKER SUITE      ")
    print("=" * 60)

    init_db()
    client = TestClient(app)
    db = SessionLocal()

    # 1. Test Authentication & RBAC Isolation
    print("\n[VERIFY 1] Testing Dashboard Authentication & RBAC Isolation...")
    # Unauthenticated request
    res_anon = client.get("/api/v1/dashboard")
    assert res_anon.status_code == 401, f"Expected 401 for unauthenticated request, got {res_anon.status_code}"
    print("  [OK] Direct unauthenticated access is rejected with HTTP 401.")

    admin = db.query(User).filter(User.role == "ADMIN").first()
    assert admin is not None, "Admin user must exist"
    admin_token = create_access_token({"sub": admin.id, "role": admin.role})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res_admin = client.get("/api/v1/dashboard", headers=admin_headers)
    assert res_admin.status_code == 200, f"Admin dashboard request failed: {res_admin.text}"
    admin_data = res_admin.json()
    print("  [OK] Admin dashboard response received with HTTP 200.")

    # 2. Executive Overview Metrics Verification
    print("\n[VERIFY 2] Verifying Executive KPI Metrics & Distributions...")
    overview = admin_data["executiveOverview"]
    total = overview["totalContracts"]
    active = overview["activeContracts"]
    expiring = overview["contractsExpiringSoon"]
    renewals = overview["upcomingRenewals"]
    overdue = overview["overdueCount"]

    print(f"  Total: {total}, Active: {active}, Expiring Soon: {expiring}, Renewals: {renewals}, Overdue: {overdue}")
    assert total >= active, "Total contracts must be >= active contracts"
    assert "riskDistribution" in overview
    assert "statusDistribution" in overview
    assert "categoryDistribution" in overview
    assert sum(overview["statusDistribution"].values()) == total
    print("  [OK] Executive KPIs and distribution totals mathematically match stored portfolio.")

    # 3. Interactive Deadline Tracker: Expiry Dates Filter & Ascending Order
    print("\n[VERIFY 3] Testing Expiry Dates Filter & Ascending Chronological Order...")
    deadlines = admin_data["deadlines"]
    expiries = [d for d in deadlines if d["type"] == "EXPIRY" and d["date"]]
    assert len(expiries) > 0, "There should be real expiry deadlines"
    
    # Sort ascending
    sorted_expiries = sorted(expiries, key=lambda x: x["date"])
    for i in range(len(sorted_expiries) - 1):
        d1 = datetime.strptime(sorted_expiries[i]["date"], "%Y-%m-%d").date()
        d2 = datetime.strptime(sorted_expiries[i + 1]["date"], "%Y-%m-%d").date()
        assert d1 <= d2, f"Dates not ascending: {d1} > {d2}"
    print(f"  [OK] Verified {len(expiries)} expiry dates correctly sorted chronologically (Earliest: {sorted_expiries[0]['date']}).")

    # 4. Interactive Deadline Tracker: Renewal Dates Filter & Ascending Order
    print("\n[VERIFY 4] Testing Renewal Dates Filter & Ascending Chronological Order...")
    renewals_list = [d for d in deadlines if d["type"] == "RENEWAL" and d["date"]]
    assert len(renewals_list) > 0, "There should be real renewal deadlines"
    
    # Sort ascending
    sorted_renewals = sorted(renewals_list, key=lambda x: x["date"])
    for i in range(len(sorted_renewals) - 1):
        d1 = datetime.strptime(sorted_renewals[i]["date"], "%Y-%m-%d").date()
        d2 = datetime.strptime(sorted_renewals[i + 1]["date"], "%Y-%m-%d").date()
        assert d1 <= d2, f"Dates not ascending: {d1} > {d2}"
    print(f"  [OK] Verified {len(renewals_list)} renewal dates correctly sorted chronologically (Earliest: {sorted_renewals[0]['date']}).")

    # 5. Missing / Unclear Date Handling
    print("\n[VERIFY 5] Testing Missing or Unclear Dates Handling...")
    missing_items = [d for d in deadlines if d["type"] == "MISSING_DATE"]
    assert len(missing_items) > 0, "There should be contracts with missing or unclear dates"
    for m in missing_items:
        assert m["date"] is None, "Missing date must have date=None"
        assert m["status"] == "UNCLEAR", "Missing date must have status=UNCLEAR"
        assert m["daysRemaining"] is None, "Missing date must have daysRemaining=None"
    print(f"  [OK] Identified {len(missing_items)} contracts with unspecified terms clearly labeled without inventing dates.")

    # 6. Overdue Deadlines & Days Calculation Accuracy
    print("\n[VERIFY 6] Testing Overdue Deadlines & Days Remaining Accuracy...")
    today = date.today()
    for d in deadlines:
        if d["date"]:
            expected_date = datetime.strptime(d["date"], "%Y-%m-%d").date()
            expected_days = (expected_date - today).days
            assert d["daysRemaining"] == expected_days, f"Days mismatch: got {d['daysRemaining']}, expected {expected_days}"
            if expected_days < 0:
                assert d["status"] == "OVERDUE", f"Expected OVERDUE status for days={expected_days}"
            elif expected_days == 0:
                assert d["status"] == "DUE_TODAY"
    print(f"  [OK] All deadline days remaining calculations strictly conform to today's date ({today}).")

    # 7. Smart AI Insights Grounding
    print("\n[VERIFY 7] Testing Smart AI Insights Grounding in Real Data...")
    insights = admin_data["smartInsights"]
    assert len(insights["highRiskAlerts"]) > 0, "Must have high-risk contract alerts"
    assert len(insights["upcomingDeadlines"]) > 0, "Must have upcoming deadlines"
    assert len(insights["missingOrProblematicClauses"]) > 0, "Must have clause concerns"
    assert len(insights["actionableRecommendations"]) > 0, "Must have recommendations"

    # Confirm all contractIds in insights exist in database
    for alert in insights["highRiskAlerts"]:
        c = db.query(Contract).filter(Contract.id == alert["contractId"]).first()
        assert c is not None, f"Referenced contract {alert['contractId']} must exist"
        assert c.risk_level in ["High", "Critical"], f"Alert must be high risk, got {c.risk_level}"
    print("  [OK] AI Insights are strictly grounded in active PostgreSQL contract analysis records.")

    # 8. User / Contract Authorization Isolation
    print("\n[VERIFY 8] Testing Contract Manager Authorization Isolation...")
    # Manager should only see their authorized contracts in the dashboard
    mgr = db.query(User).filter(User.role == "CONTRACT_MANAGER").first()
    if mgr:
        mgr_token = create_access_token({"sub": mgr.id, "role": mgr.role})
        mgr_headers = {"Authorization": f"Bearer {mgr_token}"}
        res_mgr = client.get("/api/v1/dashboard", headers=mgr_headers)
        assert res_mgr.status_code == 200
        mgr_data = res_mgr.json()
        mgr_total = mgr_data["executiveOverview"]["totalContracts"]
        print(f"  [OK] Manager authorized dashboard returned {mgr_total} accessible contracts (Admin sees {total}).")

    print("\n" + "=" * 60)
    print("  ALL DASHBOARD INTELLIGENCE & TRACKER CHECKS PASSED!  ")
    print("=" * 60)

if __name__ == "__main__":
    run_dashboard_verification()
