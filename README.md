# UPS Smart Billing & Payment Portal

An enterprise-grade, AI-driven billing and payment reconciliation platform designed to optimize cash flow, predict late payments, and provide a seamless, hyper-personalized experience for both logistics customers and finance teams.

## 🚀 Core Features Accomplished

### 1. AI & GenAI Chatbot Integration
- Integrated the lightning-fast **Groq SDK** to power a persistent, floating **AI Copilot** widget across all dashboards.
- The AI context-awareness system automatically ingests live database records (outstanding invoices, risk scores) allowing it to answer complex, natural-language financial queries instantly without hardcoded rules.

### 2. Predictive Cash Flow Analysis
- Built a **14-Day Rolling DSO (Days Sales Outstanding) Predictor** chart on the Finance Dashboard.
- Uses algorithmic probability to predict exactly when overdue and pending invoices will actually be paid, forecasting future cash flow to help finance teams make decisions.

### 3. Personalization Engines
- **Dynamic Payment Plans (Customer Side)**: Instead of rigid 50/50 splits, the platform dynamically generates AI-tailored installment plans based on the customer's specific total balance and cash flow timeline.
- **Behavioral Collection Engine (Finance Side)**: Automatically recommends specific human actions ("Urgent Call" vs "Gentle Email") and auto-drafts tailored collection emails based on a customer's real-time risk profile and behavioral history.

### 4. B2B API-Driven Integration
- Fully decoupled, RESTful architecture.
- Built a programmatic API endpoint (`POST /api/v1/external/invoices`) protected by robust **API Key Authentication**, allowing external systems (like SAP, Salesforce, or QuickBooks) to automatically push invoices into the platform.

### 5. Mobile-First Experience
- Fully responsive UI using Tailwind CSS breakpoints.
- Implemented an impressive, animated **Glassmorphism Hamburger Menu** for mobile devices that intelligently replaces desktop navigation buttons to provide a modern app-like experience.

### 6. Cloud-Native Architecture
- **Backend**: Containerized using a lean Alpine `Dockerfile`, ready for instant deployment to AWS, Google Cloud, or Docker environments.
- **Frontend**: Fully configured for edge deployment via `vercel.json` to handle React Router client-side routing on serverless architecture.

### 7. Bank-Grade Security & Authentication
- Secure JWT (JSON Web Token) authentication flows.
- Implemented `bcrypt` password hashing for all user accounts, resolving compromised password warnings and securing database integrity.

## 🛠 Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Recharts (Data Viz)
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite (via Prisma ORM, ready for Postgres migration)
- **AI/ML Engine**: Groq API (LLaMA/Qwen open-source models)

## 🔑 Demo Credentials
- **Finance Admin:** `finance@ups.com` | Password: `SecureUpsPassword2026!`
- **Customer (ABC Tech):** `abc@example.com` | Password: `SecureUpsPassword2026!`

---
*Built to accelerate revenue collection and modernize the logistics billing experience.*
