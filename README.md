# Tech-Fest 2026 Portal (MERN Stack)

> Complete MERN Stack Project Development & Deployment Lab Guide Implementation  
> **MongoDB • Express.js • React (Vite) • Node.js | GitHub → Render → Netlify**

---

## 📌 Project Overview & Objectives

- **Project Title:** Tech-Fest 2026 Portal
- **Objective:** Build, test, and deploy a full-stack MERN application that enables students to explore university techfest events (Hackathons, Robotics, Coding sprints, CTF challenges), register authenticated student accounts, book digital event passes with unique ticket codes, and monitor live API health status across distributed cloud environments.

---

## 🏛 System Architecture

As outlined in Slide 02 of the Student Lab Guide:

```
[ Browser / Client ] 
        │
        ▼ (HTTPS REST Requests)
[ React (Vite) Frontend ] ── Hosted on Netlify
        │
        ▼ (JSON API calls)
[ Express.js REST API ]   ── Hosted on Render
        │
        ▼ (Mongoose ODM / TLS)
[ MongoDB Atlas ]         ── Cloud NoSQL Database Cluster
```

- **Frontend (Netlify):** Interactive React UI, event catalogs with search and category filtering, JWT token management, modal dialogs, and real-time backend health monitoring.
- **Backend (Render):** Node.js runtime running Express REST API, CORS middleware, bcrypt password hashing, JSON Web Token (JWT) issuing, event CRUD, and `/api/health` monitoring.
- **Database (MongoDB Atlas):** Persistent cloud storage for `Users`, `Events`, and `Registrations` with automatic seed fallback.

---

## 📂 Project Directory Structure

```text
Tech-Fest-2026-portal/
├── client/                     # React + Vite frontend
│   ├── public/
│   │   ├── _redirects          # Netlify SPA redirect rule
│   │   └── favicon.svg
│   ├── src/
│   │   ├── App.css             # Futuristic dark-mode techfest styling
│   │   ├── App.jsx             # Core interactive React application
│   │   ├── index.css           # Design tokens, variables & typography
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env                    # VITE_API_URL=http://localhost:5000
│
├── server/                     # Express + Node.js backend
│   ├── server.js               # Full API with Auth, Events, Passes, Health check
│   ├── package.json
│   ├── .env.example
│   └── .env                    # MONGO_URI, JWT_SECRET, CLIENT_ORIGIN
│
├── screenshots/                # Verified lab execution screenshots
│   ├── 01_hero_portal.png
│   ├── 02_events_catalog.png
│   ├── 03_architecture_blueprint.png
│   └── 04_ticket_pass_dashboard.png
│
├── .gitignore                  # Ignores node_modules, .env, and dist
├── README.md
└── CLASSROOM_SUBMISSION_REPORT.md
```

---

## 🚀 Quick Local Setup & Execution

### 1. Prerequisites
- **Node.js**: v18+ or v22+
- **Git**: Installed and configured

### 2. Backend Setup
```bash
cd server
npm install
npm start
```
- Server starts on `http://localhost:5000`
- Verify Health Check: `curl http://localhost:5000/api/health` → `{"status": "ok"}`

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
- Frontend starts on `http://localhost:5173` (or `http://127.0.0.1:5173`)
- Open in browser to explore events, sign up, and generate event passes!

---

## 🌐 Cloud Deployment Guide

### A. MongoDB Atlas Database
1. Create a free M0 cluster on MongoDB Atlas.
2. In **Security → Network Access**, add your current IP address (or `0.0.0.0/0` for Render cloud access).
3. Under **Database Access**, create a user (e.g. `techadmin`) with a secure password.
4. Copy the connection string:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/techfest2026?retryWrites=true&w=majority
   ```

### B. Backend Deployment on Render
1. Create a New Web Service connected to your GitHub repository `Techfest-deployment`.
2. Configure settings:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free ($0/month)
3. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_random_32_character_secret_key`
   - `CLIENT_ORIGIN`: `https://YOUR-SITE.netlify.app`
4. Health check URL: `https://YOUR-RENDER-SERVICE.onrender.com/api/health`

### C. Frontend Deployment on Netlify
1. Connect GitHub repository `Techfest-deployment`.
2. Build Settings:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Environment Variable:
   - `VITE_API_URL`: `https://YOUR-RENDER-SERVICE.onrender.com`

---

## 🧪 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Deployment uptime & status verification | ❌ No |
| `POST` | `/api/auth/register` | Create student account (bcrypt + JWT) | ❌ No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | ❌ No |
| `GET` | `/api/auth/me` | Fetch logged-in student profile | ✅ Yes (Bearer JWT) |
| `GET` | `/api/events` | List all events with category & search filter | ❌ No |
| `GET` | `/api/events/:id` | Fetch single event details and rules | ❌ No |
| `POST` | `/api/registrations` | Book event pass & generate ticket code | ✅ Yes (Bearer JWT) |
| `GET` | `/api/registrations/my` | View user's registered event passes | ✅ Yes (Bearer JWT) |
| `DELETE`| `/api/registrations/:id`| Cancel registration | ✅ Yes (Bearer JWT) |
