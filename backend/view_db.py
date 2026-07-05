import sqlite3

# Connect to the vault
conn = sqlite3.connect('exaim_database.db')
c = conn.cursor()

print("\n===  STUDENTS TABLE ===")
c.execute("SELECT * FROM students")
students = c.fetchall()
for s in students:
    print(f"Roll No: {s[0]} | Name: {s[1]} | PIN: {s[2]}")

print("\n===  EVALUATIONS TABLE ===")
c.execute("SELECT * FROM evaluations")
evals = c.fetchall()
if not evals:
    print("No evaluations found yet. Grade a paper first!")
else:
    for e in evals:
        print(f"ID: {e[0]} | Roll: {e[1]} | Subject: {e[3]} | Marks: {e[4]}")

conn.close()
print("\n")