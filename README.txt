================================================================================
                    UPS SMART BILLING & PAYMENT PORTAL
================================================================================

An enterprise-grade, AI-driven billing and payment reconciliation platform 
designed to optimize cash flow, predict late payments, and provide a seamless, 
hyper-personalized experience for both logistics customers and finance teams.

--------------------------------------------------------------------------------
1. CORE FEATURES
--------------------------------------------------------------------------------
* AI & GenAI Chatbot Integration
  Integrated the lightning-fast Groq SDK to power a persistent, floating 
  AI Copilot widget across all dashboards. It automatically ingests live 
  database records allowing it to answer complex financial queries instantly.

* Predictive Cash Flow Analysis
  Built a 14-Day Rolling DSO (Days Sales Outstanding) Predictor chart on the 
  Finance Dashboard. Uses algorithmic probability to predict exactly when 
  overdue and pending invoices will actually be paid.

* Personalization Engines
  - Customer Side: Dynamically generates AI-tailored installment plans based 
    on the customer's specific total balance and cash flow timeline.
  - Finance Side: Automatically recommends specific human actions (e.g. "Urgent 
    Call") and auto-drafts tailored collection emails based on a risk profile.

* B2B API-Driven Integration
  Built a programmatic API endpoint (POST /api/v1/external/invoices) protected 
  by robust API Key Authentication, allowing external systems (like SAP) to 
  push invoices directly into the platform.

* Mobile-First Experience
  Fully responsive UI using Tailwind CSS breakpoints. Implemented an impressive, 
  animated Glassmorphism Hamburger Menu for mobile devices.

* Cloud-Native Architecture
  - Backend: Containerized using a lean Alpine Dockerfile, ready for instant 
    deployment to AWS, Google Cloud, or Docker environments.
  - Frontend: Fully configured for edge deployment via vercel.json.

* Bank-Grade Security
  Secure JWT authentication flows and bcrypt password hashing for all user 
  accounts to secure database integrity.

--------------------------------------------------------------------------------
2. TECH STACK
--------------------------------------------------------------------------------
* Frontend: React, TypeScript, Tailwind CSS, Recharts (Data Viz)
* Backend: Node.js, Express, TypeScript
* Database: SQLite (via Prisma ORM, ready for Postgres migration)
* AI/ML Engine: Groq API (LLaMA 3 / Qwen models)

--------------------------------------------------------------------------------
3. DEMO LOGIN CREDENTIALS
--------------------------------------------------------------------------------
* Finance Admin Account:
  Email: finance@ups.com
  Password: SecureUpsPassword2026!

* Customer Account (ABC Tech):
  Email: abc@example.com
  Password: SecureUpsPassword2026!

--------------------------------------------------------------------------------
4. HOW TO RUN LOCALLY
--------------------------------------------------------------------------------
Prerequisites: Node.js (v18+) and npm installed.

Step 1: Clone the repository
git clone <your-repo-url>
cd <your-repo-directory>

Step 2: Setup the Backend
cd backend
npm install
npx prisma db push
npx prisma generate
npm run dev
(Backend will start on http://localhost:4000)

Step 3: Setup the Frontend (Open a new terminal)
cd frontend
npm install
npm run dev
(Frontend will start on http://localhost:5173)

Note: You will need a Groq API Key to enable the AI chatbot. Place it in 
the backend/.env file under GROQ_API_KEY.

================================================================================
Built to accelerate revenue collection and modernize the logistics billing 
experience.
