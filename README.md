# 🎨 Skribbl.io Clone — Real-Time Multiplayer Drawing & Guessing Game

An end-to-end, full-stack clone of **[skribbl.io](https://skribbl.io)** built with modern web technologies, strict Object-Oriented Programming (OOP) server architecture, real-time WebSocket synchronization, responsive HTML5 canvas, and a rich dark glassmorphic design system.

---

## 🚀 Live Demo & Deployment

- **Live URL**: Deployable with 1-click on [Render](https://render.com) or [Railway](https://railway.app).
- **Local Dev Server**: `http://localhost:5173` (Vite)
- **Local WebSocket & API Server**: `http://localhost:4000` (Node + Express + Socket.IO)

---

## ✨ Feature Breakdown & PDF Checklist Compliance

### 1. Room & Lobby System
- **Create Room**: Host can create a public or private (invite-only) room.
- **Join Room**: Join seamlessly via 6-character room code or 1-click shareable invite links (`?room=CODE`).
- **Interactive Lobby**: Live player roster tiles with animated SVG cartoon avatars, host crowns, and ready status.
- **Configurable Room Settings**:
  - **Rounds**: 2 to 10 rounds.
  - **Draw Time**: 20 to 180 seconds countdown.
  - **Max Players**: 2 to 20 players.
  - **Word Choices**: 2 to 5 words to pick from per turn.
  - **Progressive Hints**: 0 to 3 letter reveals over time.
  - **Room Visibility**: Public (browsable) or Private (invite-only).
  - **Custom Words**: Host can supply a custom comma-separated word list mixed into the dictionary.
- **Host Moderation**: Host can kick troublesome players directly from the player list.
- **Live Public Rooms Browser**: Browse and 1-click join active public rooms from the home menu.

### 2. Turn-Based Game Flow
- **Rotation Engine**: Server coordinates turn order, rotating drawers so every player draws once per round.
- **Word Selection**: The drawer gets a dedicated modal with 1–5 word options (with a 15s auto-pick fallback timer).
- **Drawing Phase**: Drawer sketches on the canvas; remote players watch strokes render live and type guesses.
- **Speed-Based Scoring**:
  - Guesser points scale dynamically with the remaining countdown time (`200 + 300 * (timeLeft / drawTime)`).
  - First guesser gets an order bonus.
  - Drawer earns bonus points for every player who guesses correctly.
  - Immediate round completion when all non-drawing players guess the word.
- **Round End Summary**: Shows the secret word, round point gains for each player, total scores, and announces who draws next.
- **Game Over & Podium**: 1st, 2nd, and 3rd place 3D step blocks with medals, celebratory confetti fireworks, full final leaderboard, and "Play Again" button for the host.

### 3. Real-Time HTML5 Canvas Drawing Tools
- **Brush / Pen**: Smooth line drawing with custom thickness.
- **16-Color Palette**: Curated vibrant colors + eraser toggle.
- **Brush Sizes**: 4 size presets (S, M, L, XL).
- **Flood Fill (Paint Bucket)**: High-performance 32-bit pixel-stack flood fill algorithm.
- **Undo**: Server-synchronized stroke undo stack.
- **Clear Canvas**: Instantly clears the canvas and synchronizes state across all participants.
- **Normalized Coordinates**: Uses 0.0 to 1.0 coordinate normalization so drawings look identical on mobile, tablet, and desktop monitors.
- **Download Masterpiece**: 1-click button to export and save the drawing as a high-resolution PNG.

### 4. Chat & Guessing System
- **Real-Time Guesses**: Instant server-side word matching (case-insensitive, trimmed).
- **Spoiler Protection**: When a player guesses correctly, an announcement is broadcast (`"PlayerX guessed the word!"`), while their subsequent guesses are hidden from other active guessers.
- **Close Guess Detection**: Uses the Levenshtein distance algorithm. If a player is 1 or 2 characters off, they receive a private notification: *"You are very close!"*.
- **Progressive Hints**: Automatically unmasks letters over time (e.g. `_ _ A _ _ E` and letter count `(6)`).

### 5. Avatar Builder & Synthesized Sound Engine
- **Customizable Cartoon Avatars**:
  - 10 fun skin colors.
  - 8 eye expressions (happy arches, wink, sunglasses, sparkles, hearts, dizzy swirls).
  - 8 mouth styles (huge grin, tongue out, surprised O, vampire fangs, mustache).
  - 7 accessories & hats (crown, party hat, chef hat, halo, baseball cap, gamer headphones).
  - Randomize button for instant unique styles.
- **Zero-Dependency Web Audio Synth**: Synthesizes crisp sound effects directly in the browser (round start gong, correct guess chord, close guess hint, countdown urgency tick, victory fanfare) with master mute/unmute control.

---

## 🏗️ Architecture Overview

```
skribbl-clone/
├── client/                     # Frontend (React 18 + Vite + TypeScript)
│   ├── src/
│   │   ├── components/         # Modular UI components
│   │   │   ├── Avatar.tsx      # SVG Avatar renderer
│   │   │   ├── AvatarCreator.tsx # Interactive avatar customizer
│   │   │   ├── CanvasBoard.tsx # HTML5 Canvas with drawing & flood fill
│   │   │   ├── ChatBox.tsx     # Real-time chat & guess feed
│   │   │   ├── PlayerList.tsx  # Live leaderboard & moderation
│   │   │   ├── HeaderBar.tsx   # Timer, word hints, room invite
│   │   │   ├── LobbyView.tsx   # Room lobby & host settings
│   │   │   ├── HomeView.tsx    # Home landing & public room browser
│   │   │   ├── WordPickerModal.tsx # Drawer word selection modal
│   │   │   ├── RoundEndOverlay.tsx # Round score breakdown
│   │   │   └── GameOverModal.tsx   # Winner podium & confetti
│   │   ├── services/
│   │   │   ├── socket.ts       # Socket.IO connection client
│   │   │   └── sound.ts        # Web Audio API sound synthesizer
│   │   ├── types.ts            # Shared client TypeScript types
│   │   ├── style.css           # Premium dark glassmorphism design system
│   │   ├── App.tsx             # Root game state coordinator
│   │   └── main.tsx            # Application entrypoint
│   └── package.json
│
├── server/                     # Backend (Node.js + Express + Socket.IO + TypeScript)
│   ├── src/
│   │   ├── models/             # Strict OOP Domain Models
│   │   │   ├── Player.ts       # Player entity, state & score logic
│   │   │   ├── WordManager.ts  # Word pools, hints & Levenshtein matching
│   │   │   ├── Game.ts         # Round state machine, turn rotation & timer
│   │   │   └── Room.ts         # Room container, host elected, chat history
│   │   ├── services/
│   │   │   └── RoomManager.ts  # Singleton managing active rooms & codes
│   │   ├── socket/
│   │   │   └── SocketHandler.ts # WebSocket events implementation
│   │   ├── types.ts            # Server TypeScript definitions
│   │   └── index.ts            # HTTP server, CORS, & static client serving
│   └── package.json
│
├── run-dev.js                  # Cross-platform development launcher
└── package.json                # Monorepo management scripts
```

---

## 📡 WebSocket Event Reference

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `create_room` | Client ➔ Server | `{ hostName, settings, avatar }` | Host creates a new room |
| `join_room` | Client ➔ Server | `{ roomId, playerName, avatar }` | Player joins room |
| `player_joined` | Server ➔ Clients | `{ player, players }` | Broadcast new player arrival |
| `player_left` | Server ➔ Clients | `{ playerId, players, newHostId }` | Broadcast player departure |
| `update_settings`| Client ➔ Server | `Partial<RoomSettings>` | Host adjusts settings |
| `start_game` | Client ➔ Server | `{}` | Host starts the game |
| `round_start` | Server ➔ Clients | `{ drawerId, wordOptions, drawTime, round }` | Starts round; sends word choices to drawer |
| `word_chosen` | Client ➔ Server | `{ word }` | Drawer selects word |
| `draw_start` | Client ➔ Server ➔ Clients | `{ x, y, color, size, tool }` | Stroke initiated |
| `draw_move` | Client ➔ Server ➔ Clients | `{ x, y }` | Stroke continued |
| `draw_end` | Client ➔ Server ➔ Clients | `{}` | Stroke completed |
| `draw_fill` | Client ➔ Server ➔ Clients | `{ x, y, color }` | Flood fill applied |
| `draw_undo` | Client ➔ Server ➔ Clients | `{ strokes }` | Last stroke undone |
| `canvas_clear` | Client ➔ Server ➔ Clients | `{}` | Canvas wiped clean |
| `guess` | Client ➔ Server | `{ text }` | Guess or chat submission |
| `guess_result` | Server ➔ Clients | `{ correct, isClose, points }` | Guess evaluation result |
| `chat_message` | Server ➔ Clients | `{ id, playerName, text, type }` | Broadcast chat / announcement |
| `time_tick` | Server ➔ Clients | `{ timeLeft }` | 1-second countdown tick |
| `hint_update` | Server ➔ Clients | `{ hint }` | Progressive hint letter reveal |
| `round_end` | Server ➔ Clients | `{ word, scores, nextDrawer, reason }` | Round completed |
| `game_over` | Server ➔ Clients | `{ winner, leaderboard }` | Game finished; winner podium |

---

## 💻 Local Development Setup

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node v22)
- npm `v9+`

### 1. Install Dependencies
Run from the root directory:
```bash
npm run install:all
```
*(Or navigate to `/server` and `/client` and run `npm install` in each).*

### 2. Start in Development Mode
Run both backend (port 4000) and frontend (port 5173) concurrently:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

### 3. Production Build & Test
```bash
npm run build
npm start
```
The server will start on port `4000` and automatically serve the built client application at **[http://localhost:4000](http://localhost:4000)**.

---

## 🌐 Deployment Instructions

### Deploy to Render
1. Create a **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Set the following configuration:
   - **Environment**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variable**: `PORT = 10000`
4. Deploy! Your WebSocket server and static client will run seamlessly on Render.

### Deploy to Railway
1. Click **New Project** -> **Deploy from GitHub repo** on [Railway](https://railway.app).
2. Railway detects Node.js automatically. Set:
   - Build Command: `npm run install:all && npm run build`
   - Start Command: `npm start`
3. Generate a public domain and play!

---

## 📝 License
MIT License. Built for the Skribbl.io Full-Stack Engineering Assignment.
