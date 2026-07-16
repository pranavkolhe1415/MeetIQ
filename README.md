# 🧠 MeetIQ — AI Meeting Intelligence Platform

A production-ready AI Meeting Analyzer that allows users to upload meeting recordings (video/audio), automatically analyze them using AI, and generate professional reports with downloadable PDFs.

## ✨ Features

- **AI Transcription** — Speech-to-text via OpenAI Whisper (Hugging Face)
- **Speaker Diarization** — Automatic speaker identification
- **Smart Summaries** — Executive summaries, overviews, action items
- **Key Decisions & Quotes** — Extracted automatically from transcript
- **AI Chat** — Ask questions about your meetings
- **PDF Reports** — Professional branded reports with PDFKit
- **Real-time Processing** — Live progress with animated pipeline
- **Dark/Light Theme** — Toggle-based theme support
- **Authentication** — JWT + bcrypt signup/login
- **Notifications** — Real-time activity notifications

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Uploads | Multer |
| Video | FFmpeg |
| PDF | PDFKit |
| Charts | Chart.js |
| Icons | Lucide Icons |
| Animation | GSAP |
| AI | Hugging Face Inference API |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- FFmpeg (optional, for video processing)

### Setup


1. Clone the repository.
2. Install dependencies:
   npm install

3. Download the Whisper model (`ggml-base.en.bin`) and place it in the project root.

4. Download the Whisper binaries and place them in the `whisper/` directory.

5. Run:
   npm start


```bash
# 1. Clone the project
git clone <repo-url>
cd meetiq

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and Hugging Face API token

# 4. Start the server
npm start

# 5. Open browser
# http://localhost:3000
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) |
| `HF_API_TOKEN` | Hugging Face API token |

## 📁 Project Structure

```
meetiq/
├── config/          # Database & upload configuration
├── controllers/     # Route handlers (auth, meeting, chat, notification)
├── middleware/       # Auth, validation, error handling
├── models/          # Mongoose schemas (User, Meeting, Chat, etc.)
├── public/          # Frontend (HTML, CSS, JS)
│   ├── css/         # Stylesheets
│   ├── js/          # Client-side JavaScript
│   └── index.html   # SPA entry point
├── routes/          # Express route definitions
├── services/        # AI, PDF, Chat services
├── uploads/         # File storage
├── server.js        # Entry point
└── .env             # Environment config
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/meetings/upload` | Upload meeting |
| POST | `/api/meetings/:id/analyze` | Start analysis |
| GET | `/api/meetings` | List meetings |
| GET | `/api/meetings/:id` | Get meeting |
| DELETE | `/api/meetings/:id` | Delete meeting |
| GET | `/api/meetings/:id/report` | Get report |
| GET | `/api/meetings/:id/pdf` | Download PDF |
| POST | `/api/chat` | Send chat message |
| GET | `/api/notifications` | Get notifications |

## 🔒 Security

- Helmet.js for HTTP headers
- Rate limiting (100 req/15min)
- JWT authentication
- Input validation with express-validator
- Password hashing with bcrypt (12 rounds)
- CORS enabled

---

Built with ❤️ by MeetIQ Team | v1.0.0
