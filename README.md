# mallards 🧠

## Prevent Lending Bias Before It Happens | Real-Time AI-Driven Risk & Fairness Optimization 🚀 

## Overview 🌟
Modern financial AI models can amplify bias, misclassify cultural financial behaviors, and create regulatory risk.

This project solves that problem by allowing banks to simulate, analyze, and optimize AI-driven lending policies—before deployment.

- AI-Powered Lending Simulations – Adjust policies & instantly see approval, fraud, and bias impact.
- AI Pre-Optimization Nudges – AI suggests improvements before users even interact.
- Real-Time Anomaly Detection – Detects unexpected transaction behaviors & fairness risks.
- Predictive Modeling – Forecasts lending risks using Prophet & ARIMA.
- AI Chat & Voice Narratives – Explains AI-driven financial decisions in real time.

## Core Features 🎯 

### Simulation Sandbox 🛠️
Modify financial policies and instantly see the impact on fairness, fraud risk, and approvals.
- Dynamic AI-Driven Before/After Comparisons
- Explains lending decisions in real-time
- AI Pre-Optimization Nudges flag bad policies before execution

### Dashboard & Anomalies Detection 📊 
Live financial monitoring for AI decision trends.
- Real-Time Approval & Risk Trends
- Cultural Pattern Alerts – Detects AI bias in lending across different regions.
- Fraud Detection – Unusual financial behaviors flagged in real time.

### Predictive Insights 📈
Forecast risk & lending shifts with AI models (Prophet, ARIMA).
- Upcoming Events Impact on Lending Decisions
- Approval Rate & Spending Forecasts

## Installation & Setup ⚡
1️⃣ Clone the Repository
```
git clone https://github.com/your-repo-name.git
cd your-repo-name
```

2️⃣ Start the Backend (FastAPI)
```
# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # Activate virtual environment (Mac/Linux)
venv\Scripts\activate     # Activate virtual environment (Windows)

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload
```

3️⃣ Start the Frontend (React + Vite)
In a separate terminal window, start the frontend
```
npm install
npm run dev
```

🎯 The app should now be running!

Frontend: http://localhost:5173

Backend API Docs: http://localhost:8000/docs (Swagger UI for API testing)
