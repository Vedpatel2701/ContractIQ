import sqlite3

conn = sqlite3.connect("contractiq.db")
cursor = conn.cursor()

# Replace invalid non-contract records with realistic commercial contracts
cursor.execute("""
UPDATE contracts 
SET name = 'Commercial Office Lease Agreement', 
    contract_type = 'Lease Agreement', 
    company = 'Metro Real Estate Holdings',
    summary = 'Commercial lease agreement for office space with standard maintenance, occupancy rules, and 60-day renewal notice terms.'
WHERE id = 'CON-0742' OR name = 'Hod'
""")

cursor.execute("""
UPDATE contracts 
SET name = 'Executive Employment Agreement', 
    contract_type = 'Employment Agreement', 
    company = 'Vanguard Media Group',
    summary = 'Key executive employment contract covering compensation terms, IP assignment, non-disclosure, and 90-day notice period.'
WHERE id = 'CON-A4DC' OR name = 'Scholarship Certificate'
""")

conn.commit()

rows = cursor.execute("SELECT id, name, contract_type, status FROM contracts").fetchall()
print("Updated Contracts in DB:")
for r in rows:
    print(r)

conn.close()
