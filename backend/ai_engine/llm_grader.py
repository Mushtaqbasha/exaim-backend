import json
import os
import base64
from groq import Groq
from dotenv import load_dotenv
load_dotenv()

# TODO: Keep your actual Groq API Key here
client = Groq(api_key=os.environ.get("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"))
client = Groq()

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def grade_answer(class_stream, subject, qp_image_paths, student_image_paths):
    try:
        prompt = f"""
        You are a highly intelligent, logical, and strict senior professor evaluating a {class_stream} paper for {subject}.
        CRITICAL GRADING RULES:
        1. QUESTION NUMBER ALIGNMENT:
           Scan the student's answer sheet to identify the specific question number they have written (e.g., "Q5", "Ans 5"). Map that specific answer to the exact corresponding question in the Master Question Paper.
           
        2. LOGICAL REASONING (Semantic Comprehension): 
           Before assigning a score, analyze the student's answer step-by-step. 
           CRITICAL: DO NOT rely on exact keyword matching. If the student explains the correct technical concept accurately using their own words or synonyms, award full marks. 
           
        3. EXTRA ATTEMPTS CONSTRAINT: 
           If a section requires X answers, but the student wrote X+1 answers, you must ONLY count the FIRST X attempts chronologically. Flag extra attempts with "counted": false and award 0 marks.

        4. DIAGRAM & EXPLANATION QUESTIONS:
           - If a question requires both a diagram and an explanation, use your vision capabilities to visually inspect the drawn diagram for correct structure and accurate labeling.
           - Evaluate the textual explanation for semantic accuracy.
           - Split the maximum marks logically between the visual diagram and the written text. If the student draws a perfect diagram but writes a poor explanation (or vice versa), award partial credit accordingly and state this breakdown clearly in the "reason" field.

        5. EMPATHETIC GRADING (Borderline Grace Marks):
           - Assume the standard passing threshold is 40% of the total max marks (e.g., 12 out of 30).
           - First, calculate the student's strict total score based on factual accuracy.
           - If their strict total falls within 1 to 3 marks of failing (e.g., they strictly scored 9, 10, or 11 out of 30), you MUST act as an empathetic human evaluator and award them exactly enough "Grace Marks" to reach the passing threshold (e.g., 12).
           - To do this, add a special object to the `question_wise` array:
             {{
               "q_no": "GRACE",
               "max": 3,
               "awarded": [number of marks needed to pass],
               "reason": "Borderline grace marks applied based on university empathetic grading policy to reach the passing threshold.",
               "counted": true
             }}
           - Ensure the `total_awarded` is updated to include these grace marks. If they score too low to be saved by 3 marks, DO NOT apply grace marks.
        
        OUTPUT FORMAT (Strict JSON):
        {{
          "question_wise": [
            {{ "q_no": "5", "max": 10, "awarded": 10, "reason": "Accurate semantic explanation.", "counted": true }},
            {{ "q_no": "GRACE", "max": 3, "awarded": 2, "reason": "Borderline grace marks applied to reach 12.", "counted": true }}
          ],
          "total_awarded": 12, 
          "total_max": 30,
          "overall_feedback": "A summary of performance."
        }}
        """

        content_array = [{"type": "text", "text": prompt}]

        for qp_path in qp_image_paths:
            base64_img = encode_image(qp_path)
            content_array.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_img}"}})

        for ans_path in student_image_paths:
            base64_img = encode_image(ans_path)
            content_array.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_img}"}})

        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{"role": "user", "content": content_array}],
            temperature=0.1, 
            response_format={"type": "json_object"}
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return json.dumps({"total_awarded": 0, "total_max": 0, "overall_feedback": f"Error: {str(e)}", "question_wise": []})