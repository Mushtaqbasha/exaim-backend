import sqlite3

conn = sqlite3.connect('exaim_database.db')
c = conn.cursor()

# This adds YOU to the authorized educators list
c.execute("INSERT OR REPLACE INTO educators (email, password) VALUES ('mushtaq@gmail.com', 'mushtaq123')")

conn.commit()
conn.close()
print("✅ Mushtaq, you are now an authorized Educator!")