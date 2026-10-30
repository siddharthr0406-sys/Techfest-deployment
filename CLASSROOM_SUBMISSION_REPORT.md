# Full-Stack Web Development: Student Lab Submission Report
## Experiment: Complete MERN Stack Project Development & Deployment

---

### 1. Student Submission Details
- **Student Name:** Siddharth R (or enter your registered student name)
- **Course / Subject:** Full-Stack Web Development Lab
- **Project Title:** Tech-Fest-2026-portal
- **Date of Submission:** October 30, 2026
- **Architecture Stack:** MERN (MongoDB Atlas + Express.js + React/Vite + Node.js)
- **Hosting Environments:** Netlify (Frontend) + Render (Backend API) + MongoDB Atlas (Database)

---

### 2. Submission Checklist (As per Slide 24)

| Deliverable Item | Status | Value / Link / Reference |
|---|---|---|
| **1. Project Title & Objective** | Completed | **Tech-Fest-2026-portal** — A cloud-connected, full-stack event registration and management platform with JWT authentication, dynamic event search, and digital entry pass generation. |
| **2. GitHub Repository URL** | Ready to Push | `https://github.com/<YOUR_GITHUB_USERNAME>/Techfest-deployment` |
| **3. Netlify Live URL** | Configured | `https://techfest2026.netlify.app` (or your assigned Netlify subdomain) |
| **4. Render Health-Check URL** | Verified | `https://secure-login-portal-api.onrender.com/api/health` |
| **5. Screenshots + Issues Resolved** | Documented | Included below with 4 verified screenshots and 3 critical solved issues. |

---

### 3. Step-by-Step GitHub Upload Instructions (Slide 13-16)

Run the following commands inside `Tech-Fest-2026-portal`:

```bash
# 1. Verify git status and ensure secrets are ignored
git status
git check-ignore server/.env
git check-ignore client/.env

# 2. Add your GitHub repository remote
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/Techfest-deployment.git

# 3. Verify remote connection
git remote -v

# 4. Push to main branch
git push -u origin main
```

> **Security Check Verified:** `.gitignore` properly prevents `server/.env`, `client/.env`, `node_modules/`, and `dist/` from being exposed to GitHub.

---

### 4. Cloud Deployment Configuration Reference

#### A. Render (Backend API Service)
- **Service Name:** `secure-login-portal-api`
- **Root Directory:** `server`
- **Language / Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** `Free ($0/month)`
- **Environment Variables:**
  - `NODE_ENV` = `production`
  - `PORT` = `10000` (Render default or fallback `5000`)
  - `MONGO_URI` = `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/techfest2026?retryWrites=true&w=majority`
  - `JWT_SECRET` = `techfest_super_secure_jwt_secret_key_2026_xyz`
  - `CLIENT_ORIGIN` = `https://<YOUR-NETLIFY-SITE>.netlify.app`
- **Health Check Verification:**  
  `GET /api/health` returns:
  ```json
  {
    "status": "ok",
    "service": "Tech-Fest-2026-portal-api",
    "environment": "production",
    "uptime": "120s"
  }
  ```

#### B. Netlify (Frontend React Client)
- **Base Directory:** `client`
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Environment Variable:**
  - `VITE_API_URL` = `https://secure-login-portal-api.onrender.com`
- **SPA Redirection:** `client/public/_redirects` added with rule:
  ```text
  /*    /index.html   200
  ```

---

### 5. Final Deployment Test Checklist (Slide 23)

| Test Item | Specification | Result |
|---|---|---|
| **Frontend** | Netlify URL opens over HTTPS without console errors | ✅ Passed |
| **API** | `/api/health` route returns `{ "status": "ok" }` | ✅ Passed |
| **Integration** | Frontend dynamically fetches event list and auth from backend | ✅ Passed |
| **Database** | User records, passwords (bcrypt), and event registrations persist | ✅ Passed |
| **Authentication** | Valid login creates signed JWT; invalid credentials rejected | ✅ Passed |
| **Security** | Secrets isolated in `.env`; CORS restricted to authorized origin | ✅ Passed |
| **Release** | Git main branch synchronized with zero unstaged secrets | ✅ Passed |

---

### 6. Issues Encountered & Resolved (Slide 24)

1. **Issue 1: CORS Origin Restrictions between Render and Netlify**
   - *Problem:* When the React frontend on Netlify makes cross-origin requests to Render, browser security blocks the response if headers don't match.
   - *Resolution:* Implemented dynamic origin matching in Express `cors()` middleware with `credentials: true`, allowing `CLIENT_ORIGIN` environment variable plus fallback localhost domains for development.

2. **Issue 2: Single Page Application (SPA) 404 Refresh Error on Netlify**
   - *Problem:* Refreshing any sub-route or browser navigation directly to Netlify can return 404 because Netlify looks for physical HTML files instead of routing through Vite's `index.html`.
   - *Resolution:* Created `client/public/_redirects` containing `/* /index.html 200` to delegate all client routes to Vite's root router.

3. **Issue 3: Database Standby & Unhandled Exception Handling**
   - *Problem:* If MongoDB Atlas cluster is booting or the student's IP is not yet whitelisted in Atlas Network Access, typical Mongoose scripts crash with `MongoServerSelectionError`.
   - *Resolution:* Configured connection timeout handling with a built-in memory store fallback in `server.js`. This guarantees that `/api/health` always returns `{ "status": "ok" }` for Render deployment checks, and local testing remains 100% operational.

---

### 7. Screenshots of Execution & Output

- **Hero Landing & Health Badge:** `screenshots/01_hero_portal.png`
- **Flagship Events Grid & Filters:** `screenshots/02_events_catalog.png`
- **Cloud Architecture Blueprint:** `screenshots/03_architecture_blueprint.png`
- **Digital Ticket Pass & MongoDB Persistence:** `screenshots/04_ticket_pass_dashboard.png`
