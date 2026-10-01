# SimulAI — AI Virtual Interview Simulator

SimulAI is an AI-powered virtual interview simulator built as a **college project**. It uses the Gemini API to simulate role-specific interviews, accepts a candidate's CV in PDF format, stores interview history and candidate memory in SQLite, and supports browser-based voice input and text-to-speech.

> **Project status:** Working prototype / college project
>
> This repository is **not a production-ready or fully built final version**. The current implementation focuses on demonstrating the core interview workflow and proving that the main system works end to end. The project is intentionally kept simple as a prototype, and several planned capabilities are reserved for future implementations.

## Current Prototype

The current prototype includes:

- Local username/password registration and login
- Dashboard with multiple interview tracks
- IT & Software interview
- Finance & Business interview
- Marketing interview
- HR & Management interview
- PDF CV upload and text extraction
- Gemini-powered interview conversations
- Role-specific interviewer prompts
- SQLite storage for users, resumes, conversations, and interview memory
- Persistent conversation/profile summaries for future context
- Streaming AI responses in the chat interface
- Browser speech recognition for voice input
- Browser text-to-speech for AI responses
- Interview result UI for displaying evaluation data

## Technology Stack

- **Backend:** Python, Flask
- **AI:** Google Gemini API (`gemini-2.5-flash`)
- **Database:** SQLite
- **Resume Processing:** PyMuPDF
- **Frontend:** HTML, CSS, JavaScript
- **Voice:** Browser Speech Recognition API and Speech Synthesis API
- **Configuration:** python-dotenv

## Project Structure

```text
SimulAI/
├── app.py
├── database.py
├── engine.py
├── requirements.txt
├── .env.example
├── .gitignore
├── README.md
│
├── interviewers/
│   ├── finance.py
│   ├── it_interview.py
│   ├── management.py
│   └── marketing.py
│
├── templates/
│   ├── login.html
│   ├── dashboard.html
│   └── chat.html
│
└── static/
    ├── css/
    │   ├── chat.css
    │   ├── dashboard.css
    │   └── login.css
    ├── js/
    │   ├── chat.js
    │   ├── cv.js
    │   └── login.js
    └── images/
        └── simulai-logo.png
```

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/SimulAI.git
cd SimulAI
```

### 2. Create a virtual environment

Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

macOS / Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a file named `.env` in the project root and copy the values from `.env.example`.

```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=replace_with_a_random_secret
```

The `.env` file is intentionally ignored by Git so the API key is not committed to GitHub.

### 5. Run the application

```bash
python app.py
```

Open the local address shown by Flask in your browser.

## How the Prototype Works

```text
Login / Register
       ↓
Dashboard
       ↓
Select Interview Track
       ↓
Upload CV (PDF)
       ↓
Extract CV Text
       ↓
Gemini Interviewer
       ↓
Interview Conversation
       ↓
Memory / History Storage
       ↓
Evaluation / Result UI
```

Each interviewer track has its own system prompt so that interview questions are adapted to the selected field.

## Future Implementations

The current repository is a working foundation rather than the final envisioned version. Planned future work includes:

- Resume + Job Description analysis for more targeted interview questions
- Better resume parsing and skill-gap detection
- A more advanced and reliable evaluation system, including structured frameworks such as STAR for behavioural interviews
- A dedicated/fine-tuned local model option for selected tasks
- Better speech-to-text and text-to-speech systems instead of relying only on browser speech APIs
- More accurate voice-interview processing and improved real-time interaction
- A multi-agent interview panel, such as a Technical Lead, HR Interviewer, and background Evaluator
- More detailed analytics and interview reports
- Better session management so separate interview attempts can be evaluated independently
- Improved scoring, feedback, and interview personalization

These are future implementations and are **not claimed as features of the current prototype**.

## Security Notes

Do not commit your `.env` file, API keys, passwords, local database files, uploaded CVs, or generated Python cache files to GitHub. The included `.gitignore` is configured to exclude these files from normal Git tracking.

## Disclaimer

SimulAI is an academic/college project and a working prototype intended for educational demonstration. It is not intended to replace professional recruitment systems, professional interviewers, or production-grade assessment software.
