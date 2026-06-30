# 🔥 Ignite-AI - Full-Stack AI Chat Application

Ignite-AI is a sleek, responsive, and lightning-fast full-stack AI Chat Application. Built using a modern MERN stack architecture (Vite, React, Node.js, Express, and MongoDB Atlas), it features an immersive interactive particle-flame background, user authentication, and real-time AI conversational capabilities.

## 🚀 Live Demo
- **Frontend (Deployed on Vercel):** [Your Vercel URL Here]
- **Backend (Deployed on Render/Railway):** [Your Backend URL Here]

---

## ✨ Features
- **Immersive UI:** Dynamic flame particle effects moving fluidly in the background using `@tsparticles`.
- **Full-Stack Architecture:** Separated backend and frontend structures for optimal scaling.
- **Robust Database:** Fully integrated with MongoDB Atlas for persistent storage of user conversations and accounts.
- **Responsive Layout:** Tailwind CSS powered sleek chat components, markdown block rendering, and seamless layout transitions.
- **Secure Configuration:** Environment protection for private keys, database strings, and API secrets.

---

## 📁 Project Structure

```text
ignite-ai-fullstack/
│
├── backend/                  # Node.js + Express Server
│   ├── middleware/           # Auth and validation middlewares
│   ├── models/               # MongoDB Mongoose schemas
│   ├── routes/               # API endpoint routing
│   ├── utils/                # Helper functions
│   ├── .env                  # Private backend environment keys (ignored)
│   └── server.js             # Main server entry point
│
├── frontend/                 # Vite + React Client
│   ├── public/               # Static assets & logos
│   ├── src/
│   │   ├── components/       # Reusable components (FlameBackground, Sidebar, ChatArea)
│   │   ├── constants/        # Application configurations and constants
│   │   ├── hooks/            # Custom React hooks
│   │   └── services/         # API connection handlers
│   ├── .env                  # Public frontend keys (ignored)
│   ├── index.html            # Core HTML entry
│   └── vite.config.js        # Vite compilation settings
│
└── .gitignore                # Global ignores (node_modules, .env, dist)
```

---

## 🛠️ Installation & Setup

Follow these quick steps to get the project running locally on your computer:

### 1. Clone the repository
```bash
git clone https://github.com
cd ignite-ai-fullstack
```

### 2. Configure Environment Variables
Create a `.env` file inside your **backend** and **frontend** folders matching your dynamic keys.

**Backend `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://Ignite-Ai:<your_password>@chatcluster.ll8fmvo.mongodb.net/Ignite_Ai_DB?appName=chatCluster
```

### 3. Install & Start Backend Server
```bash
cd backend
npm install
npm start
```

### 4. Install & Start Frontend Client
Open a new terminal session:
```bash
cd frontend
npm install
npm run dev
```

---

## 💻 Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, `@tsparticles/react`
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Cloud Database)
- **Deployment:** Vercel

---

## 📜 License
This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

