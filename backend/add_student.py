import sqlite3

conn = sqlite3.connect('exaim_database.db')
c = conn.cursor()

# Replace these with the details you want to use!
new_roll_number = 'P19MT24S126001'
new_name = 'Aakash Raj B'
new_pin = '1004'

# This injects the new student into the database
c.execute("INSERT OR REPLACE INTO students (roll_number, name, pin) VALUES (?, ?, ?)", 
          (new_roll_number, new_name, new_pin))

conn.commit()
conn.close()
print(f" Success: Student {new_name} ({new_roll_number}) has been added!")