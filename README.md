# 🎲 Ludo 3D - Modern React Three Fiber Frontend

High-fidelity real-time 3D multiplayer Ludo game client built with **React**, **React Three Fiber (R3F)**, **Three.js**, and **Tailwind CSS**.

---

## 🌟 Visual & Interactive Features

- **3D Procedural Ludo Board**: Full 15x15 board with dynamic player base highlights, 52 circuit tiles, and safe star zones.
- **Stylized 3D Esports Human NPCs**:
  - Seated player avatars in modern streetwear hoodies with glowing esports gaming headsets and expressive anime/Pixar-style eyes.
  - **Inverse Kinematics (IK) Overhand Grip**: Avatars lean forward across the table, reach down with white gamer gloves, lift pawns along a parabolic momentum flight arc, and place them down firmly on destination tiles.
  - **Real-Time Multiplayer Sync**: Both the moving player and opponents across the table see the exact same hand-moving animation live.
- **Luxury Gaming Lounge Environment**:
  - Rich dark walnut chamfered gaming table with recessed emerald felt and brushed brass inlay.
  - Ergonomic mid-century bucket armchairs with leather padding in player theme colors.
  - Overhead hanging pendant lamp fixture with focused tabletop spotlight.
- **Physical 3D Dice**: Interactive tumbling dice with physics-style spin and authoritative face result display.
- **Glassmorphic 2D HUD**: Built with Tailwind CSS, showing turn badges, dice roll shortcuts (Spacebar), room code copying, and winner confetti celebration.
- **Multi-Device / Mobile Support**: Automatically detects network host so phones and laptops on the same Wi-Fi can join and play together seamlessly.

---

## 📁 Architecture Overview

```
frontend/
├── index.html
├── vite.config.js                     # Vite dev server with host: true
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── App.jsx                        # Canvas viewport, HUD, & keyboard listener
    ├── main.jsx                       # React DOM entry
    ├── index.css                      # Tailwind styles & glassmorphic utilities
    ├── constants/
    │   └── boardCoordinates.js        # 3D Vector mapping for circuit, bases, & home runs
    ├── hooks/
    │   └── useLudoSocket.js           # Real-time Socket.io state management hook
    └── components/
        ├── 3d/
        │   ├── Scene.jsx              # R3F Canvas, OrbitControls, and Studio Lighting
        │   ├── Table.jsx              # 3D Luxury gaming lounge table
        │   ├── Chair.jsx              # 3D Mid-century bucket armchairs
        │   ├── HumanNPC.jsx           # 3D Stylized human avatars with 2-bone arm IK
        │   ├── Board.jsx              # Procedural 3D board geometry & safe zone stars
        │   ├── Token.jsx              # 3D Pawn with synchronized hand pickup flight & bounce
        │   └── Dice.jsx               # 3D tumbling physics dice with authoritative face
        └── ui/
            ├── LudoUI.jsx             # Minimalist HUD (turn pills, roll button, rematch)
            └── RoomModal.jsx          # Clean Create/Join room modal
```

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

*The frontend runs on `http://localhost:3000` (Local) and `http://<your-ip>:3000` (Network).*

---

## ⚙️ Environment Variables (Optional)

Create a `.env` file in the `frontend` root:
```env
VITE_BACKEND_URL=http://localhost:4000
```
*(By default, the client automatically connects to the server on port 4000 using the current browser hostname, enabling instant mobile/network multiplayer without configuration).*
