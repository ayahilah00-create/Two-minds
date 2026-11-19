require("dotenv").config();
const express = require("express");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const dataFile = path.join(__dirname, "data.json");

if (!process.env.SESSION_SECRET || !process.env.REHAN_CODE || !process.env.UBAID_CODE) {
  console.error("Set SESSION_SECRET, REHAN_CODE and UBAID_CODE in .env before starting.");
  process.exit(1);
}

let shared = { tasks: [], notes: [], updatedAt: null };
try { if (fs.existsSync(dataFile)) shared = JSON.parse(fs.readFileSync(dataFile, "utf8")); } catch {}

app.use(express.json({ limit: "100kb" }));
const sessionMiddleware = session({
  name: "two_minds_session",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 }
});
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);
// Flat layout: all files sit in the repo root, so serve only the 4 public files (never server.js / package.json / data.json)
const pub = { "/style.css": "style.css", "/app.js": "app.js", "/manifest.json": "manifest.json" };
Object.entries(pub).forEach(([route, file]) => app.get(route, (req, res) => res.sendFile(path.join(__dirname, file))));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

const attempts = new Map();
function requireLogin(req, res, next) {
  if (!req.session.person) return res.status(401).json({ error: "Please log in first." });
  next();
}

app.post("/api/login", (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const entry = attempts.get(ip) || { count: 0, until: 0 };
  if (entry.until > now) return res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
  const { person, code } = req.body || {};
  const expected = person === "Rehan" ? process.env.REHAN_CODE : person === "Ubaid" ? process.env.UBAID_CODE : null;
  if (!expected || String(code || "") !== expected) {
    entry.count += 1;
    if (entry.count >= 5) { entry.count = 0; entry.until = now + 5 * 60 * 1000; }
    attempts.set(ip, entry);
    return res.status(401).json({ error: "Name ya secret code sahi nahi hai." });
  }
  attempts.delete(ip);
  req.session.person = person;
  res.json({ person });
});
app.post("/api/logout", (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/me", (req, res) => res.json({ person: req.session.person || null }));
app.get("/api/state", requireLogin, (req, res) => res.json(shared));
app.put("/api/state", requireLogin, (req, res) => {
  const body = req.body || {};
  shared = {
    tasks: Array.isArray(body.tasks) ? body.tasks.slice(0, 300) : [],
    notes: Array.isArray(body.notes) ? body.notes.slice(0, 100) : [],
    updatedAt: new Date().toISOString(),
    updatedBy: req.session.person
  };
  fs.writeFileSync(dataFile, JSON.stringify(shared, null, 2));
  io.emit("shared:update", shared);
  res.json(shared);
});

io.use((socket, next) => {
  if (!socket.request.session || !socket.request.session.person) {
    return next(new Error("Login required"));
  }
  next();
});
io.on("connection", socket => socket.emit("shared:update", shared));

server.listen(PORT, () => console.log(`TWO MINDS running on http://localhost:${PORT}`));
