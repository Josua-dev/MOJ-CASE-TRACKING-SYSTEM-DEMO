# MOJ Case Tracking System
## Ministry of Justice — Republic of Namibia

A full-stack web application for tracking magistrate court cases.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Recharts, Lucide Icons |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcrypt |

---

## Project Structure

```
magistrate-system/
├── backend/
│   ├── db/database.js       # SQLite setup & seed data
│   ├── middleware/auth.js   # JWT middleware
│   ├── routes/
│   │   ├── auth.js          # Login & register
│   │   └── cases.js         # Full CRUD + stats
│   └── server.js            # Express entry point
└── frontend/
    ├── public/index.html
    └── src/
        ├── context/AuthContext.js
        ├── pages/
        │   ├── Login.js
        │   ├── Dashboard.js
        │   └── Cases.js
        ├── components/
        │   ├── Sidebar.js
        │   ├── CaseModal.js
        │   └── CaseDetailModal.js
        ├── App.js
        └── index.css
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm

### 1. Install backend dependencies
```bash
cd backend
npm install
```

### 2. Start the backend
```bash
node server.js
# Backend runs on http://localhost:5000
```

### 3. Install frontend dependencies (new terminal)
```bash
cd frontend
npm install
```

### 4. Start the frontend
```bash
npm start
# Opens http://localhost:3000
```

---

## Default Login

| Field | Value |
|-------|-------|
| Email | admin@moj.na |
| Password | Admin@1234 |

---

## Features

- **JWT Authentication** — secure login with role-based access
- **Dashboard** — live stats, charts by case type, status breakdown
- **Case Register** — full CRUD with search, status and type filters
- **Case Detail** — full case info with audit trail
- **Audit Logging** — every status change and note is recorded with timestamp and user
- **Auto Case Numbering** — MOJ-YYYY-XXXX format generated automatically
- **5 Seeded Sample Cases** — ready to explore on first run

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register user |
| GET | /api/cases | List/search cases |
| POST | /api/cases | Create case |
| GET | /api/cases/:id | Get case + logs |
| PUT | /api/cases/:id | Update case |
| POST | /api/cases/:id/logs | Add note |
| GET | /api/cases/meta/stats | Dashboard stats |

---

Built by Josua Uuyuni — Software Engineer
