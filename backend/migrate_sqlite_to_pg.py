"""
Migration Script: Migrate records from SQLite (contractiq.db) to PostgreSQL.
Preserves Primary Keys, Foreign Keys, and Timestamps. Idempotent.
"""
import sqlite3
import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models.contract import Contract
from app.models.clause import Clause
from app.models.risk import RiskIndicator
from app.models.chat import ChatMessage
from app.models.notification import Notification

BASE_DIR = Path(__file__).resolve().parent
SQLITE_DB_PATH = BASE_DIR / "contractiq.db"

def parse_dt(val):
    if val is None:
        return None
    if isinstance(val, datetime.datetime):
        return val
    try:
        return datetime.datetime.fromisoformat(str(val))
    except Exception:
        return None

def migrate():
    print(f"Connecting to SQLite database at {SQLITE_DB_PATH}...")
    if not SQLITE_DB_PATH.exists():
        print("SQLite database file not found. Nothing to migrate.")
        return

    # Ensure PostgreSQL tables exist
    Base.metadata.create_all(bind=engine)
    
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sq_cur = sqlite_conn.cursor()

    pg_db: Session = SessionLocal()

    try:
        # 1. Migrate Contracts
        sq_contracts = sq_cur.execute("SELECT * FROM contracts").fetchall()
        print(f"Found {len(sq_contracts)} contracts in SQLite.")
        migrated_contracts = 0
        for row in sq_contracts:
            existing = pg_db.query(Contract).filter(Contract.id == row['id']).first()
            if not existing:
                c = Contract(
                    id=row['id'],
                    name=row['name'],
                    contract_type=row['contract_type'],
                    company=row['company'],
                    status=row['status'],
                    risk_level=row['risk_level'],
                    start_date=row['start_date'],
                    expiry_date=row['expiry_date'],
                    renewal_date=row['renewal_date'],
                    notice_period=row['notice_period'],
                    payment_terms=row['payment_terms'],
                    payment_status=row['payment_status'] if 'payment_status' in row.keys() else "Paid",
                    penalty_info=row['penalty_info'],
                    summary=row['summary'],
                    is_demo=bool(row['is_demo']),
                    customer=row['customer'],
                    vendor=row['vendor'],
                    legal_owner=row['legal_owner'],
                    file_path=row['file_path'],
                    file_name=row['file_name'],
                    file_size=row['file_size'],
                    extracted_text=row['extracted_text'],
                    created_at=parse_dt(row['created_at']) or datetime.datetime.utcnow(),
                    updated_at=parse_dt(row['updated_at']) or datetime.datetime.utcnow()
                )
                pg_db.add(c)
                migrated_contracts += 1
        pg_db.commit()
        print(f"Migrated {migrated_contracts} new contracts to PostgreSQL.")

        # 2. Migrate Clauses
        sq_clauses = sq_cur.execute("SELECT * FROM clauses").fetchall()
        print(f"Found {len(sq_clauses)} clauses in SQLite.")
        migrated_clauses = 0
        for row in sq_clauses:
            existing = pg_db.query(Clause).filter(Clause.id == row['id']).first()
            if not existing:
                cl = Clause(
                    id=row['id'],
                    contract_id=row['contract_id'],
                    clause_type=row['clause_type'],
                    text=row['text'],
                    page_number=row['page_number']
                )
                pg_db.add(cl)
                migrated_clauses += 1
        pg_db.commit()
        print(f"Migrated {migrated_clauses} new clauses to PostgreSQL.")

        # 3. Migrate Risk Indicators
        sq_risks = sq_cur.execute("SELECT * FROM risk_indicators").fetchall()
        print(f"Found {len(sq_risks)} risk_indicators in SQLite.")
        migrated_risks = 0
        for row in sq_risks:
            existing = pg_db.query(RiskIndicator).filter(RiskIndicator.id == row['id']).first()
            if not existing:
                r = RiskIndicator(
                    id=row['id'],
                    contract_id=row['contract_id'],
                    description=row['description'],
                    severity=row['severity']
                )
                pg_db.add(r)
                migrated_risks += 1
        pg_db.commit()
        print(f"Migrated {migrated_risks} new risk_indicators to PostgreSQL.")

        # 4. Migrate Chat Messages
        sq_chats = sq_cur.execute("SELECT * FROM chat_messages").fetchall()
        print(f"Found {len(sq_chats)} chat_messages in SQLite.")
        migrated_chats = 0
        for row in sq_chats:
            existing = pg_db.query(ChatMessage).filter(ChatMessage.id == row['id']).first()
            if not existing:
                cm = ChatMessage(
                    id=row['id'],
                    contract_id=row['contract_id'],
                    role=row['role'],
                    text=row['text'],
                    created_at=parse_dt(row['created_at']) or datetime.datetime.utcnow()
                )
                pg_db.add(cm)
                migrated_chats += 1
        pg_db.commit()
        print(f"Migrated {migrated_chats} new chat_messages to PostgreSQL.")

        # 5. Migrate Notifications
        sq_notifs = sq_cur.execute("SELECT * FROM notifications").fetchall()
        print(f"Found {len(sq_notifs)} notifications in SQLite.")
        migrated_notifs = 0
        for row in sq_notifs:
            existing = pg_db.query(Notification).filter(Notification.id == row['id']).first()
            if not existing:
                n = Notification(
                    id=row['id'],
                    contract_id=row['contract_id'],
                    title=row['title'],
                    description=row['description'],
                    alert_type=row['alert_type'],
                    is_read=bool(row['is_read']),
                    created_at=parse_dt(row['created_at']) or datetime.datetime.utcnow()
                )
                pg_db.add(n)
                migrated_notifs += 1
        pg_db.commit()
        print(f"Migrated {migrated_notifs} new notifications to PostgreSQL.")

        print("\nAll data successfully migrated to PostgreSQL!")

    except Exception as e:
        pg_db.rollback()
        print(f"Error during migration: {e}")
        raise e
    finally:
        sqlite_conn.close()
        pg_db.close()

if __name__ == "__main__":
    migrate()
