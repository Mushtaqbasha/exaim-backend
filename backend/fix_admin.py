import sqlite3

# Connect to your Exaim database
conn = sqlite3.connect('exaim_database.db')
c = conn.cursor()

# 1. Ensure the table exists
c.execute('''CREATE TABLE IF NOT EXISTS educators (email TEXT PRIMARY KEY, password TEXT)''')

# 2. Force-insert the professor (this overwrites if already there)
c.execute('''INSERT OR REPLACE INTO educators (email, password) 
             VALUES ('professor@bnu.edu.in', 'admin123')''')

conn.commit()
conn.close()
print("✅ Success: Professor credentials have been injected into the database!")