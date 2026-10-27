# BookLeaf AI Support Portal

A full-stack, AI-powered ticketing system designed for BookLeaf Publishing. It provides authors with a streamlined portal to submit and track queries, while giving the operations team an automated, real-time triage queue that drafts policy-compliant responses.

## 🔗 Live Demo
* **Frontend URL:** https://bookleaffrontend-three.vercel.app
* **Backend API Docs:** https://bookleafbackend-lime.vercel.app/docs

**Test Credentials:**
* **Admin:** `admin@bookleafpub.in`
* **Author:** `priya.sharma@email.com` 
*(Note: Password verification is bypassed for this demo environment).*

---

## 🏗️ Architecture & Code Quality
The application uses a modular, decoupled architecture separating routing, business logic, and data access. 

* **Backend (FastAPI & MongoDB):** The monolithic entry point was split into dedicated layers (`dependencies.py` for middleware, `services.py` for DB transactions, `routers/` for endpoints). This ensures clean separation of concerns and prevents spaghetti code.
* **Frontend (React, Vite, Tailwind):** Utilizes TanStack Query for state management and caching, and TanStack Router for type-safe, protected routing.
* **Real-time vs. Polling:** WebSockets are implemented strictly for the Admin dashboard to guarantee instant global queue updates without refreshing. The Author dashboard utilizes a 5-second polling interval via TanStack Query, providing near real-time feedback while significantly reducing persistent server connections.

---

## 🤖 AI Integration & Strategy
The AI pipeline utilizes Groq (openai/gpt-oss-20b) to process incoming tickets instantly.

* **Prompt Strategy:** The prompt uses a strict system message injecting BookLeaf's specific knowledge base policies. It forces the model to output a structured JSON response containing the `category`, `priority`, and a professional `draft`. 
* **Cost Management:** By offloading classification to a fast, low-cost model via Groq, we maintain high throughput. The structured JSON enforcement prevents token bloat.
* **Graceful Degradation:** The AI call is wrapped in a `try/except` block. If the Groq API rate-limits or fails, the system automatically falls back to assigning the ticket a "Medium" priority, categorizing it as a "General Inquiry," and leaving the draft blank for manual admin intervention. No ticket is ever lost due to an LLM failure.

---

## 🛡️ API Design & Security
The REST API is fully documented via FastAPI's auto-generated Swagger UI (`/docs`).

* **Authentication & RBAC:** All routes are protected by dependency-injected middleware. Axios interceptors pass simulated session headers to the backend.
* **Validation:** Pydantic models validate all incoming payloads, returning precise `422 Unprocessable Entity` errors for malformed requests instead of generic 500 crashes.
* **Data Isolation:** Authors can only retrieve tickets matching their specific `author_id`. If a user attempts to access the global queue without the `ADMIN` role, the API rejects the request with a `403 Forbidden` status.

---

## ⚙️ Local Setup Instructions

**1. Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in MONGODB_URI, GROQ_API_KEY
python seed.py             # seeds bookleaf_sample_data.json
uvicorn main:app --reload  # http://localhost:8000/docs
```

**2. Frontend**
```bash
cd frontend
npm install
cp .env.example .env       # set VITE_API_URL=http://localhost:8000
npm run dev