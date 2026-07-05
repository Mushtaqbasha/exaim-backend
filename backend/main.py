from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil, os, json, sqlite3
import pymupdf as fitz
import jwt
from datetime import datetime, timedelta, timezone
from ai_engine.llm_grader import grade_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

SECRET_KEY = "exaim-super-secret-key-change-in-production"
ALGORITHM = "HS256"

# ==========================================
# --- DATABASE SETUP ---
# ==========================================
def init_db():
    conn = sqlite3.connect('exaim_database.db')
    c = conn.cursor()
    
    # Evaluations table
    c.execute('''CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        roll_number TEXT, 
        class_stream TEXT, 
        subject TEXT, 
        marks INTEGER, 
        detailed_marks TEXT, 
        feedback TEXT, 
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)''')
        
    # Users tables (Notice the UNIQUE constraint on roll_number and email)
    c.execute('''CREATE TABLE IF NOT EXISTS students (roll_number TEXT PRIMARY KEY, name TEXT, pin TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS educators (email TEXT PRIMARY KEY, password TEXT)''')
    
    # Default Users for testing
    c.execute("INSERT OR IGNORE INTO educators (email, password) VALUES ('professor@bnu.edu.in', 'admin123')")
    c.execute("INSERT OR IGNORE INTO educators (email, password) VALUES ('mushtaq@gmail.com', 'mushtaq123')")
    c.execute("INSERT OR IGNORE INTO students (roll_number, name, pin) VALUES ('U03CJ21S0015', 'Alex Mercer', '1234')")
    
    conn.commit()
    conn.close()

init_db()

# ==========================================
# --- HELPER: PDF TO IMAGE ---
# ==========================================
def process_upload(upload_file: UploadFile, prefix: str) -> list[str]:
    file_path = os.path.join(UPLOAD_DIR, f"{prefix}_{upload_file.filename}")
    with open(file_path, "wb") as f:
        shutil.copyfileobj(upload_file.file, f)
    if not upload_file.filename.lower().endswith('.pdf'):
        return [file_path]
    image_paths = []
    pdf_document = fitz.open(file_path)
    for page_num in range(len(pdf_document)):
        page = pdf_document.load_page(page_num)
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat)
        page_img_path = os.path.join(UPLOAD_DIR, f"{prefix}_{upload_file.filename}_p{page_num + 1}.png")
        pix.save(page_img_path)
        image_paths.append(page_img_path)
    pdf_document.close()
    return image_paths

# ==========================================
# --- EDUCATOR ENDPOINTS ---
# ==========================================
class EducatorSignup(BaseModel):
    email: str
    password: str

@app.post("/api/educator/signup")
async def educator_signup(credentials: EducatorSignup):
    conn = sqlite3.connect('exaim_database.db')
    c = conn.cursor()
    try:
        c.execute("INSERT INTO educators (email, password) VALUES (?, ?)", (credentials.email, credentials.password))
        conn.commit()
        return {"success": True, "message": "Educator registered successfully! You can now log in."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="This email is already registered.")
    finally:
        conn.close()

class EducatorLogin(BaseModel):
    email: str
    password: str

@app.post("/api/educator/login")
async def educator_login(credentials: EducatorLogin):
    conn = sqlite3.connect('exaim_database.db')
    c = conn.cursor()
    c.execute("SELECT email FROM educators WHERE email = ? AND password = ?", (credentials.email, credentials.password))
    educator = c.fetchone()
    conn.close()
    if educator:
        expire = datetime.now(timezone.utc) + timedelta(hours=2)
        token = jwt.encode({"sub": educator[0], "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
        return {"success": True, "token": token}
    else:
        raise HTTPException(status_code=401, detail="Invalid Email or Password")

@app.post("/api/grade")
async def grade_endpoint(
    class_stream: str = Form(...),
    subject: str = Form(...),
    roll_number: str = Form(...),
    question_paper: UploadFile = File(...),
    student_answer: UploadFile = File(...)
):
    qp_images = process_upload(question_paper, "qp")
    ans_images = process_upload(student_answer, "ans")

    result_json = grade_answer(class_stream, subject, qp_images, ans_images)
    ai_result = json.loads(result_json)

    detailed_marks_string = json.dumps(ai_result.get('question_wise', []))
    total_marks = ai_result.get('total_awarded', 0)
    feedback_text = ai_result.get('overall_feedback', 'No feedback provided.')

    conn = sqlite3.connect('exaim_database.db')
    c = conn.cursor()
    c.execute('''INSERT INTO evaluations (roll_number, class_stream, subject, marks, detailed_marks, feedback) 
                 VALUES (?, ?, ?, ?, ?, ?)''', 
              (roll_number, class_stream, subject, total_marks, detailed_marks_string, feedback_text))
    inserted_id = c.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": inserted_id, 
        "marks_awarded": total_marks, 
        "feedback": feedback_text,
        "detailed_marks": detailed_marks_string
    }

@app.get("/api/history")
async def get_history():
    conn = sqlite3.connect('exaim_database.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, roll_number AS rollNumber, marks, detailed_marks, feedback FROM evaluations ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    return [dict(ix) for ix in rows]
# ==========================================
# --- NEW: DELETE EVALUATION ENDPOINT ---
# ==========================================
@app.delete("/api/evaluation/{eval_id}")
async def delete_evaluation(eval_id: int):
    conn = sqlite3.connect('exaim_database.db')
    c = conn.cursor()
    
    # Execute the delete command based on the unique ID
    c.execute("DELETE FROM evaluations WHERE id = ?", (eval_id,))
    rows_deleted = c.rowcount
    
    conn.commit()
    conn.close()
    
    if rows_deleted == 0:
        raise HTTPException(status_code=404, detail="Evaluation not found.")
        
    return {"success": True, "message": "Evaluation permanently deleted."}

# ==========================================
# --- STUDENT ENDPOINTS ---
# ==========================================
class StudentSignup(BaseModel):
    roll_number: str
    name: str
    pin: str

@app.post("/api/student/signup")
async def student_signup(data: StudentSignup):
    conn = sqlite3.connect('exaim_database.db')
    c = conn.cursor()
    try:
        c.execute("INSERT INTO students (roll_number, name, pin) VALUES (?, ?, ?)", 
                 (data.roll_number.upper(), data.name, data.pin))
        conn.commit()
        return {"success": True, "message": "Student registered successfully! You can now log in."}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="This Roll Number is already registered.")
    finally:
        conn.close()

class StudentLogin(BaseModel):
    roll_number: str
    pin: str

@app.post("/api/student/login")
async def student_login(credentials: StudentLogin):
    conn = sqlite3.connect('exaim_database.db')
    c = conn.cursor()
    c.execute("SELECT name FROM students WHERE roll_number = ? AND pin = ?", (credentials.roll_number.upper(), credentials.pin))
    student = c.fetchone()
    conn.close()
    if student: return {"success": True, "name": student[0]}
    else: raise HTTPException(status_code=401, detail="Invalid Roll Number or PIN")

@app.get("/api/student/results/{roll_number}")
async def get_student_results(roll_number: str):
    conn = sqlite3.connect('exaim_database.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, class_stream, subject, marks, detailed_marks, feedback, timestamp FROM evaluations WHERE roll_number = ? ORDER BY id DESC", (roll_number.upper(),))
    rows = c.fetchall()
    conn.close()
    return [dict(ix) for ix in rows]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)