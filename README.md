# Scout Voice AI 🏀

> AI-powered basketball scouting verification platform using ElevenLabs conversational voice agents

Scout Voice AI automates the process of verifying and enriching global basketball scouting data by using AI voice agents to call coaches, GMs, and league contacts — capturing conversations, extracting structured updates via LLM, and routing changes through a human approval workflow before updating the database.

---

## 🎯 Problem It Solves

Basketball scouting organizations maintain large databases of:
- League information across 50+ countries
- Team rosters and play style profiles
- Coach and GM contact details
- Recruiting requirements and player preferences
- Country-specific lifestyle and travel information

**This data goes stale constantly.** Coaches move teams, emails change, recruiting priorities shift every season. Manual verification doesn't scale globally.

**Scout Voice AI replaces manual phone calls with AI** — automatically calling contacts, conducting natural scouting conversations, extracting structured data, and letting a human review before any record is updated.

---

## 🏗️ System Architecture

```
Scout AI Database
        ↓
Dashboard / Contact Management
        ↓
Call Trigger (one-click or scheduled)
        ↓
ElevenLabs AI Voice Agent
        ↓
Outbound Call to Coach / GM
        ↓
Transcript + Recording captured
        ↓
Webhook → FastAPI Backend
        ↓
LLM Structured Extraction (OpenAI)
        ↓
Diff / Change Detection
        ↓
Human Approval Dashboard
        ↓
Database Update + Audit Log
```

---

## ✨ Core Features

### 1. Contact & Team Management
- Full CRUD for Leagues, Teams, Coaches, and GMs
- Search by name or email
- Filter by verification status (verified / pending / unverified)
- Region and league filters
- Last verified date tracking

### 2. AI Outbound Calling (ElevenLabs)
- One-click outbound call trigger per contact
- ElevenLabs conversational AI agent conducts the call
- Agent introduces itself, asks scouting questions naturally
- Supports multilingual conversations
- Call statuses: queued → ringing → answered → completed / voicemail / failed

### 3. Webhook Ingestion
- FastAPI endpoint receives post-call data from ElevenLabs
- Stores full transcript and recording URL
- Links data back to the correct contact record

### 4. LLM Transcript Extraction (OpenAI)
- Parses the conversation transcript into structured JSON
- Extracts: verified email, coach name, team play style, ideal player profile, city notes, recruiting priorities
- Outputs a confidence score per extraction

### 5. Change Detection
- Compares extracted values against current database records
- Highlights exactly what changed (field by field)
- Assigns confidence level: high / medium / low

### 6. Human Approval Workflow
- All AI-suggested changes go into an approval queue
- Reviewer can **Approve**, **Reject**, or **Flag for review**
- Approved changes are applied to the database immediately
- Rejected changes are logged but not applied

### 7. Audit Log
- Full history of every approved/rejected change
- Records: entity type, field, old value, new value, who approved, timestamp
- Filterable by action type

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy 2.0 |
| AI Voice | ElevenLabs Conversational AI |
| LLM Extraction | OpenAI GPT-4o-mini |
| Hosting (frontend) | Vercel |
| Hosting (backend) | Railway / Render / AWS |

---

## 📁 Project Structure

```
scout-voice-ai/
├── backend/
│   ├── main.py                  # FastAPI app entry point + CORS + routes
│   ├── database.py              # SQLAlchemy engine + session setup
│   ├── models.py                # Database models (League, Team, Coach, CallLog, etc.)
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── seed_data.py             # Populate DB with sample basketball data
│   ├── requirements.txt
│   ├── .env.example             # Environment variable template
│   ├── routers/
│   │   ├── leagues.py           # CRUD endpoints for leagues
│   │   ├── teams.py             # CRUD endpoints for teams
│   │   ├── coaches.py           # CRUD endpoints for coaches
│   │   ├── calls.py             # Trigger calls, view logs, get transcripts
│   │   ├── webhooks.py          # ElevenLabs post-call webhook receiver
│   │   ├── approvals.py         # Human approval workflow (approve/reject/flag)
│   │   └── audit.py             # Audit log retrieval
│   └── services/
│       ├── elevenlabs.py        # ElevenLabs API integration + mock mode
│       ├── llm_extraction.py    # OpenAI transcript parsing + mock mode
│       └── diff_detection.py   # Compare extracted vs current DB values
│
└── frontend/
    ├── app/
    │   ├── page.tsx             # Dashboard (stats, recent calls, pending approvals)
    │   ├── contacts/page.tsx    # Contact management table
    │   ├── calls/page.tsx       # Call log + transcript viewer
    │   ├── approvals/page.tsx   # AI update review and approval
    │   └── audit/page.tsx       # Full audit history
    ├── components/
    │   └── Sidebar.tsx          # Navigation sidebar
    └── lib/
        ├── api.ts               # API client (fetch wrapper for all endpoints)
        └── types.ts             # TypeScript interfaces for all data models
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yatishdurga/Scout-Voice-AI.git
cd Scout-Voice-AI
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate       # Mac/Linux
# .venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section below)

# Seed the database with sample data
python seed_data.py

# Start the backend server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be running at: `http://localhost:8000`
Interactive API docs at: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variable
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
```

Frontend will be running at: `http://localhost:3000`

---

## 🔑 Environment Variables

Create `backend/.env` from the provided `.env.example`:

```env
# Database (SQLite for local dev, PostgreSQL for production)
DATABASE_URL=sqlite:///./scout_voice.db

# ElevenLabs — get from https://elevenlabs.io
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
ELEVENLABS_PHONE_NUMBER_ID=your_phone_number_id

# OpenAI — get from https://platform.openai.com
OPENAI_API_KEY=your_openai_api_key

# Set to false when you have real API keys
MOCK_MODE=true
```

> **MOCK_MODE=true** runs the full workflow with simulated calls, transcripts, and LLM extraction — no API keys required. Perfect for development and demos.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Dashboard statistics |
| GET/POST | `/leagues/` | List or create leagues |
| GET/POST | `/teams/` | List or create teams |
| GET/POST | `/coaches/` | List or create coaches (with search/filter) |
| PATCH | `/coaches/{id}` | Update a coach |
| POST | `/calls/trigger` | Trigger an outbound AI call |
| GET | `/calls/` | List all calls (filterable by status) |
| GET | `/calls/{id}/transcript` | Get transcript for a completed call |
| POST | `/webhooks/elevenlabs/post-call` | ElevenLabs post-call webhook |
| GET | `/approvals/` | List pending AI-suggested updates |
| POST | `/approvals/{id}/action` | Approve / Reject / Flag an update |
| GET | `/audit/` | Full audit log |

Full interactive documentation: `http://localhost:8000/docs`

---

## 🔄 How the Full Workflow Works

1. **Scout logs in** to the dashboard and sees all coaches with unverified status
2. **Clicks "Call"** next to a coach — this triggers an ElevenLabs AI voice agent to call the coach's phone number
3. **The AI agent** introduces itself as Scout AI, asks verification questions (email, play style, recruiting needs, city info), and handles the conversation naturally
4. **After the call**, ElevenLabs sends a webhook to the backend with the full transcript and recording URL
5. **The backend** sends the transcript to OpenAI, which extracts structured JSON (new email, team style, recruiting notes, etc.) with a confidence score
6. **The diff engine** compares extracted values against the current database and identifies exactly what changed
7. **The approval queue** shows the scout the old vs new values for each field, with confidence levels
8. **The scout approves or rejects** — approved changes are applied to the database and logged in the audit trail

---

## 📸 Screenshots

### Dashboard
- Live stats: total coaches, verified count, verification rate progress bar
- Recent calls with status badges
- Pending approvals requiring review

### Contacts Page
- Searchable, filterable table of all coaches and GMs
- Verification status badges (verified / pending / unverified)
- One-click call trigger, inline edit, delete

### Calls Page
- Full call log with coach name, team, league, status, duration
- Filter by status (completed / queued / voicemail / failed)
- Click "View Transcript" to read the full AI conversation

### Approvals Page
- AI-extracted changes displayed field by field
- Old value vs new value comparison
- Confidence level badges (high / medium / low)
- Approve All / Reject / Flag actions

### Audit Log
- Complete history of every data change
- Who approved it, when, what changed

---

## 🌍 Sample Data Included

The seed script populates the database with realistic basketball scouting data:

**Leagues:** EuroLeague, NBA G League, Liga ACB (Spain), Lega Basket Serie A (Italy), Turkish BSL

**Teams:** Real Madrid Basketball, Fenerbahce Beko, CSKA Moscow, South Bay Lakers, Long Island Nets, FC Barcelona, Valencia Basket, Olimpia Milano, Anadolu Efes

**16 contacts** including head coaches, assistant coaches, and GMs — with a mix of verified, pending, and unverified statuses

---

## 🔮 V2 Roadmap

- [ ] Recurring verification scheduler (monthly re-verification campaigns)
- [ ] Analytics dashboard (verification rates by region, call success rates)
- [ ] Multilingual call routing (Spanish, Italian, Turkish, Russian agents)
- [ ] Recruiter scoring system (player-market match scoring)
- [ ] Timezone-based call scheduling
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Bulk call campaigns (call 50 contacts in one click)
- [ ] Player market insights from coach conversations

---

## 💡 Why This Project

Basketball scouting is a global, data-intensive industry. Teams spend thousands of hours manually calling contacts to verify information that changes constantly. This project demonstrates how **AI voice agents + LLMs + human-in-the-loop review** can automate an entire data verification pipeline — reducing manual effort by 80%+ while keeping humans in control of every data change.

The architecture is also applicable beyond basketball: any industry that maintains large contact databases requiring periodic phone-based verification (real estate, insurance, healthcare directories) could use this same pattern.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with FastAPI, Next.js, ElevenLabs, and OpenAI*
