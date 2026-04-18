# 🏥 MediTriage — AI-Powered Healthcare Triage Platform

An intelligent healthcare triage system that assesses patient symptoms using AI (Google Gemini) with a rule-based fallback engine. Built with Node.js, Express, and Firebase.

## Features

- **AI-Powered Triage** — Uses Google Gemini for intelligent symptom analysis
- **Rule-Based Fallback** — Works without any API key using a comprehensive symptom database
- **Real-Time Dashboard** — Admin panel to monitor and manage patient assessments
- **Firebase Integration** — Cloud Firestore for persistent data storage
- **Vital Signs Assessment** — Analyzes blood pressure, temperature, heart rate, and oxygen levels

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A Firebase project (for data storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/meditriage.git
cd meditriage

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the server
npm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google Gemini API key for AI triage (falls back to rule-based without it) |
| `PORT` | No | Server port (default: 3000) |

## Security

- **Environment variables** are stored in `.env` (never committed to git)
- **Firebase Security Rules** should be configured to restrict database access
- See [SECURITY.md](SECURITY.md) for vulnerability reporting

## Tech Stack

- **Backend**: Node.js, Express
- **AI**: Google Gemini 2.0 Flash
- **Database**: Google Cloud Firestore
- **Frontend**: HTML, CSS, JavaScript

## License

MIT

---

> ⚠️ **Disclaimer**: This is a demonstration project. Always consult qualified healthcare professionals for medical advice.
