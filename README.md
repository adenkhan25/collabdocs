# CollabDocs — Real-Time Collaborative Document Editor
=======
A full-stack, Google-Docs-style collaborative document editor built as a  learning experience
Project. Teams can write, format, and edit documents together in real time, with live cursors,
>>>>>>> 3d38f23d1cc4dd9cff51420ccb0e068945bd631f
presence, threaded comments, version history, link-based sharing with roles, and export to
PDF / DOCX / HTML.

---

## Tech Stack

**Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Radix UI primitives
(shadcn-style components), Framer Motion, TipTap Editor, Yjs, Socket.io Client, Axios,
React Hook Form + Zod, Lucide React icons.

**Backend:** Node.js, Express.js, MongoDB + Mongoose, Socket.io, JWT auth, bcrypt password
hashing, Helmet, CORS, express-rate-limit, express-mongo-sanitize, multer (uploads), pdfkit
(PDF export), html-to-docx (DOCX export).

**Real-time collaboration:** Yjs CRDT documents synced over Socket.io, with an in-memory Y.Doc
store on the server that debounces persistence back to MongoDB, plus y-protocols/awareness for
live cursors, presence, and typing indicators.

---

## Project Structure

```
collabdocs/
├── backend/                 # Express + Socket.io API server
│   ├── src/
│   │   ├── config/           # MongoDB connection
│   │   ├── controllers/      # Route handler logic (auth, documents, comments, versions, ...)
│   │   ├── middleware/       # auth, error handling, document access control, uploads
│   │   ├── models/           # Mongoose schemas: User, Document, Comment, Version, Activity, Notification
│   │   ├── routes/           # Express routers
│   │   ├── sockets/          # Socket.io collaboration handler + Yjs doc store
│   │   ├── utils/            # JWT helpers, activity logger, DB seed script
│   │   └── server.js         # App entry point
│   ├── uploads/              # Uploaded images (served statically)
│   ├── package.json
│   └── .env.example
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/               # App Router pages (one route per feature)
│   │   ├── components/        # UI primitives, dashboard, editor, auth components
│   │   ├── contexts/          # Auth, Theme, Socket React contexts
│   │   ├── hooks/             # useDocuments, useTrash, useCollaboration
│   │   ├── lib/               # Axios client, utils, custom TipTap extensions
│   │   └── types/             # Shared TypeScript types
│   ├── package.json
│   └── .env.example
├── package.json               # Root workspace orchestration (npm workspaces + concurrently)
└── README.md
```

---

## Prerequisites

- **Node.js 18+** and **npm 9+** (for workspace support)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`, **or** a MongoDB Atlas connection
  string

If you don't have MongoDB installed locally:
- macOS: `brew install mongodb-community && brew services start mongodb-community`
- Windows/Linux: install from https://www.mongodb.com/try/download/community, or use a free
  [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and paste its connection string
  into `backend/.env` as `MONGO_URI`.

---

## Installation & Running

From the **project root**:

```bash
npm install
npm run dev
```

That's it. `npm install` will:
1. Install dependencies for the root, `backend`, and `frontend` workspaces.
2. Automatically create `backend/.env` and `frontend/.env` from their `.env.example` files
   (via a postinstall script) if they don't already exist.

`npm run dev` starts both servers concurrently:
- Backend API + Socket.io on **http://localhost:5000**
- Frontend Next.js app on **http://localhost:3000**

Open **http://localhost:3000** in your browser.

> If MongoDB isn't running, the backend will log a connection error on startup. Start MongoDB
> (or point `backend/.env`'s `MONGO_URI` at an Atlas cluster) and restart `npm run dev`.

### Loading sample data (optional but recommended)

To populate the database with sample users, documents, comments, and activity so you have
something to explore immediately:

```bash
npm run seed
```

This creates three demo accounts (see below) with shared documents, comments, and version
history already in place.

### Sample login credentials

| Email | Password |
|---|---|
| alice@example.com | password123 |
| bob@example.com | password123 |
| carol@example.com | password123 |

You can also just register a new account from the app's sign-up page.

---

## Running frontend/backend separately

If you prefer two terminals instead of the concurrent root script:

```bash
# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### `backend/.env`
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/collabdocs
JWT_SECRET=replace_this_with_a_long_random_secret_key_at_least_32_chars
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_DAYS=7
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
```

### `frontend/.env`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Important:** Change `JWT_SECRET` to a long, random string before deploying anywhere public.

---

## Features

- **Authentication** — register, login, logout, JWT-based sessions, protected routes,
  forgot/reset password flow, change password.
- **Dashboard** — create, rename, delete, restore, favorite, search, recent documents, trash
  (soft delete with permanent delete option), duplicate.
- **Rich text editor** — bold, italic, underline, strike, highlight, font size, font color,
  headings, bullet/numbered/checklist lists, tables, images (upload), hyperlinks, blockquotes,
  code blocks, undo/redo, fullscreen mode, live word/character count.
- **Real-time collaboration** — Socket.io + Yjs CRDT sync, live cursors with collaborator
  colors, presence avatars, typing indicators, join/leave toast notifications.
- **Comments** — highlight text, add comments, threaded replies, resolve/unresolve, delete own
  comments (or as document owner).
- **Version history** — manually save snapshots, browse previous versions, restore any version
  (auto-saves the current state as a version before restoring, so nothing is lost).
- **Sharing** — share by public link with configurable role (editor/viewer), invite specific
  people by email with per-user roles, revoke access.
- **Export** — PDF (pdfkit), DOCX (html-to-docx), HTML.
- **Activity log** — per-document activity feed and a global "My Activity" page covering
  logins, document changes, comments, sharing, and more.
- **Settings** — edit profile, change password, light/dark theme (persisted per-user).
- **Notifications** — in-app notification bell for shares, comments, and replies.

---

## Notes on the Yjs collaboration model

Each open document gets an in-memory `Y.Doc` on the server. Client edits are captured by TipTap's
`Collaboration` extension, diffed as Yjs updates, and relayed through Socket.io to every other
client currently viewing that document — then merged into the server's copy and, after a short
debounce, persisted to MongoDB (`Document.yjsState`) so state survives server restarts and is
available to the next person who opens the document. Presence and live cursors use
`y-protocols/awareness`, broadcast the same way. Plain document metadata (title, sharing
settings, comments, etc.) still goes through the normal REST API.

---

## License

<<<<<<< HEAD
Built for educational purposes as a learning experience project.
=======
Built for educational purposes as a  learning experience project.
>>>>>>> 3d38f23d1cc4dd9cff51420ccb0e068945bd631f
