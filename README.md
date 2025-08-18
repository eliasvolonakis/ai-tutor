# AI Math Tutoring Platform

An interactive AI-powered platform where students upload worksheets, solve math problems, and receive tailored guidance.  
The system helps students not only find the right answer but also understand their approach and improve step by step.  

---

## ✨ Features

- **Worksheet Upload**: Students can upload their math worksheets directly to the platform.  
- **Interactive Problem Solving**: Students solve problems in a guided workspace.  
- **Step Capture**: The platform records each step of the student’s approach and final answer.  
- **Gap Analysis**: Compares the student’s work against the ideal solution to identify knowledge gaps and misconceptions.  
- **AI-Powered Hints**: Provides personalized hints, nudges, or detailed explanations to support the student’s learning journey.  

---

## 🧩 How It Works

1. **Load Questions**  
   - The platform ingests and displays worksheet problems in an interactive format.  

2. **Capture Student Work**  
   - Students input answers step by step.  
   - Every attempt and method is tracked.  

3. **Analyze the Gap**  
   - The student’s solution is compared with the model (ideal) solution.  
   - A delta is calculated to pinpoint differences in reasoning, steps, or accuracy.  

4. **AI Guidance**  
   - The AI analyzes the gap and generates support:  
     - Hints to encourage discovery.  
     - Nudges to guide toward the right path.  
     - Full explanations if the student is stuck.  

## 🛠️ Tech Stack

- **Frontend**: React (interactive workspace)  
- **Backend**: Node.js (API & AI integration)  
- **Database**: PostgreSQL (student work history, worksheets)  
- **AI Models**: GPT-based models for solution analysis & hint generation 
