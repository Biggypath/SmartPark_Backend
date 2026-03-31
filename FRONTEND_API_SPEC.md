# SmartPark Backend — Frontend Integration Specification

> **Version:** 1.0 — March 31, 2026
> **Backend Base URL:** `http://localhost:3000`
> **Transport:** REST (HTTP/JSON) + WebSocket (Socket.io)
> **Auth:** JWT Bearer Token (24 h expiry)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication](#2-authentication)
3. [REST API Endpoints](#3-rest-api-endpoints)
   - [Auth](#31-auth-no-token-required)
   - [User Cards](#32-user-cards-token-required)
   - [User Vehicles](#33-user-vehicles-token-required)
   - [Parking](#34-parking-public-no-token-required)
4. [WebSocket (Socket.io) Events](#4-websocket-socketio-events)
5. [Data Models & TypeScript Interfaces](#5-data-models--typescript-interfaces)
6. [Parking Slot Layout (for 3D Model)](#6-parking-slot-layout-for-3d-model)
7. [Slot State Machine](#7-slot-state-machine)
8. [Error Response Format](#8-error-response-format)
9. [Seed Data (for Development)](#9-seed-data-for-development)
10. [Frontend Integration Guide (React Three Fiber)](#10-frontend-integration-guide-react-three-fiber)

---

## 1. Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────┐
│   React Three Fiber │◄──ws───►│   SmartPark Backend  │
│      Frontend       │◄──http─►│   (Express + Socket) │
│                     │         │                      │
│  - 3D Parking Model │         │  Port 3000           │
│  - Auth Pages       │         │  CORS: origin "*"    │
│  - Card/Vehicle Mgmt│         │  JWT: 24h expiry     │
└─────────────────────┘         └──────────┬───────────┘
                                           │
                                    ┌──────▼──────┐
                                    │  PostgreSQL  │
                                    │  (Prisma)    │
                                    └─────────────┘
```

**How the 3D Digital Twin works:**

1. On page load, the frontend connects via Socket.io.
2. The server immediately sends a `dashboard:init` event with **all parking slots** (id, status, type, 3D coordinates).
3. The frontend renders each slot in the Three.js scene using `location_coordinates`.
4. When a slot's status changes (car enters, parks, or exits), the server pushes a `slot:update` event in real-time.
5. The frontend updates that single slot's visual state (color, animation, label) without re-fetching.

---

## 2. Authentication

All endpoints under `/api/users/*` require a JWT Bearer token.

### How to attach the token

```
Authorization: Bearer <token>
```

- The token is returned from `/api/auth/register` or `/api/auth/login`.
- It expires after **24 hours**.
- The token payload contains `{ user_id: string }`.

### Token verification failure responses

| Status | Body |
|--------|------|
| `401` | `{ "error": "Missing or invalid authorization header." }` |
| `401` | `{ "error": "Invalid or expired token." }` |

---

## 3. REST API Endpoints

### 3.1 Auth (No Token Required)

#### `POST /api/auth/register`

Create a new user account.

**Request Body:**

```json
{
  "email": "somchai@example.com",
  "password": "password123",
  "name": "Somchai Jaidee"
}
```

**Success Response:** `201 Created`

```json
{
  "user": {
    "user_id": "uuid-string",
    "email": "somchai@example.com",
    "name": "Somchai Jaidee",
    "created_at": "2026-03-31T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Missing fields | `{ "error": "Email, password, and name are required." }` |
| `409` | Duplicate email | `{ "error": "Email is already registered." }` |

---

#### `POST /api/auth/login`

Log in with existing credentials.

**Request Body:**

```json
{
  "email": "somchai@example.com",
  "password": "password123"
}
```

**Success Response:** `200 OK`

```json
{
  "user": {
    "user_id": "uuid-string",
    "email": "somchai@example.com",
    "name": "Somchai Jaidee",
    "created_at": "2026-03-31T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Missing fields | `{ "error": "Email and password are required." }` |
| `401` | Wrong credentials | `{ "error": "Invalid email or password." }` |

---

### 3.2 User Cards (Token Required)

All endpoints below require `Authorization: Bearer <token>`.

#### `GET /api/users/cards`

Get all privilege cards belonging to the authenticated user.

**Request:** No body needed.

**Success Response:** `200 OK`

```json
[
  {
    "card_id": "uuid-string",
    "user_id": "uuid-string",
    "program_id": "uuid-string",
    "issued_at": "2026-03-31T10:00:00.000Z",
    "is_active": true,
    "program": {
      "program_id": "uuid-string",
      "provider_name": "SCB First",
      "tier": "Private Banking",
      "free_hours": 5,
      "max_vehicles": 3,
      "is_active": true
    }
  }
]
```

---

#### `POST /api/users/cards`

Add a new privilege card to the user.

**Request Body:**

```json
{
  "program_id": "uuid-string"
}
```

**Success Response:** `201 Created`

```json
{
  "card_id": "uuid-string",
  "user_id": "uuid-string",
  "program_id": "uuid-string",
  "issued_at": "2026-03-31T10:00:00.000Z",
  "is_active": true,
  "program": {
    "program_id": "uuid-string",
    "provider_name": "SCB First",
    "tier": "Private Banking",
    "free_hours": 5,
    "max_vehicles": 3,
    "is_active": true
  }
}
```

**Error Response:**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Missing program_id | `{ "error": "program_id is required." }` |

---

#### `PUT /api/users/cards/:card_id`

Update a card (e.g., activate/deactivate). The `card_id` goes in the **URL path**, not query params.

**Request Body:**

```json
{
  "is_active": false
}
```

**Success Response:** `200 OK` — Returns the updated card object (same shape as GET).

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `404` | Card doesn't exist | `{ "error": "Card not found." }` |
| `403` | Not the owner | `{ "error": "You do not own this card." }` |

---

#### `DELETE /api/users/cards/:card_id`

Delete a card. The `card_id` goes in the **URL path**.

**Success Response:** `204 No Content` — Empty body.

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `404` | Card doesn't exist | `{ "error": "Card not found." }` |
| `403` | Not the owner | `{ "error": "You do not own this card." }` |

---

### 3.3 User Vehicles (Token Required)

All endpoints below require `Authorization: Bearer <token>`.

#### `GET /api/users/vehicles`

Get all vehicles linked to the authenticated user's cards.

**Request:** No body needed.

**Success Response:** `200 OK`

```json
[
  {
    "vehicle_id": "uuid-string",
    "registration": "1กข 1234",
    "province": "กรุงเทพมหานคร",
    "registered_at": "2026-03-31T10:00:00.000Z",
    "cards": [
      {
        "card_id": "uuid-string",
        "user_id": "uuid-string",
        "program_id": "uuid-string",
        "issued_at": "2026-03-31T10:00:00.000Z",
        "is_active": true
      }
    ]
  }
]
```

---

#### `POST /api/users/vehicles`

Register a new vehicle and link it to one of the user's cards.

**Request Body:**

```json
{
  "registration": "1กข 1234",
  "province": "กรุงเทพมหานคร",
  "card_id": "uuid-string"
}
```

**Success Response:** `201 Created`

```json
{
  "vehicle_id": "uuid-string",
  "registration": "1กข 1234",
  "province": "กรุงเทพมหานคร",
  "registered_at": "2026-03-31T10:00:00.000Z",
  "cards": [
    {
      "card_id": "uuid-string",
      "user_id": "uuid-string",
      "program_id": "uuid-string",
      "issued_at": "2026-03-31T10:00:00.000Z",
      "is_active": true
    }
  ]
}
```

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Missing fields | `{ "error": "registration, province, and card_id are required." }` |
| `404` | Card not found | `{ "error": "Card not found." }` |
| `403` | Not the card owner | `{ "error": "You do not own this card." }` |

---

#### `PUT /api/users/vehicles/:vehicle_id`

Update a vehicle's registration, province, or linked card. All fields are optional.

**Request Body:**

```json
{
  "registration": "9ZZ 9999",
  "province": "ชลบุรี",
  "card_id": "new-card-uuid"
}
```

**Success Response:** `200 OK` — Returns the updated vehicle object (same shape as GET item).

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `404` | Vehicle not found | `{ "error": "Vehicle not found." }` |
| `403` | No access | `{ "error": "You do not have access to this vehicle." }` |
| `403` | Don't own target card | `{ "error": "You do not own the target card." }` |

---

#### `DELETE /api/users/vehicles/:vehicle_id`

Delete a registered vehicle.

**Success Response:** `204 No Content` — Empty body.

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `404` | Vehicle not found | `{ "error": "Vehicle not found." }` |
| `403` | No access | `{ "error": "You do not have access to this vehicle." }` |

---

### 3.4 Parking (Public, No Token Required)

#### `GET /api/parking/dashboard`

Returns all parking slots with current status. Use this as a REST fallback for initial page load if WebSocket hasn't connected yet.

**Request:** No body or params needed.

**Success Response:** `200 OK`

```json
[
  {
    "slot_id": "VIP-A1",
    "slot_type": "VIP",
    "status": "FREE",
    "location_coordinates": "{\"x\":0,\"y\":0,\"z\":0}",
    "is_active": true
  },
  {
    "slot_id": "VIP-A2",
    "slot_type": "VIP",
    "status": "OCCUPIED",
    "location_coordinates": "{\"x\":10,\"y\":0,\"z\":0}",
    "is_active": true
  },
  {
    "slot_id": "GEN-B1",
    "slot_type": "GENERAL",
    "status": "ASSIGNED",
    "location_coordinates": "{\"x\":0,\"y\":10,\"z\":0}",
    "is_active": true
  }
]
```

---

#### `GET /api/parking/session`

Check the active parking session for a specific vehicle by license plate. Works for both **guest** and **registered** users.

**Query Parameters:**

| Param | Type | Required | Example |
|-------|------|----------|---------|
| `registration` | string | Yes | `1กข 1234` |
| `province` | string | Yes | `กรุงเทพมหานคร` |

**Example URL:**

```
GET /api/parking/session?registration=1กข%201234&province=กรุงเทพมหานคร
```

**Success Response:** `200 OK`

```json
{
  "session_id": "uuid-string",
  "slot": {
    "slot_id": "VIP-A1",
    "slot_type": "VIP",
    "status": "OCCUPIED"
  },
  "registration": "1กข 1234",
  "province": "กรุงเทพมหานคร",
  "is_registered": true,
  "entry_time": "2026-03-31T08:00:00.000Z",
  "duration_minutes": 120,
  "estimated_fee": 0,
  "free_hours": 5,
  "payment_status": "PENDING"
}
```

**Key fields explained:**

| Field | Description |
|-------|-------------|
| `is_registered` | `true` if the vehicle is linked to a user account with active cards, `false` for guests. |
| `free_hours` | The highest `free_hours` value from the vehicle's active privilege cards. `0` for guests. |
| `estimated_fee` | Real-time estimated fee based on current duration minus free hours. Rate is **20 THB/hour**, rounded up to whole hours. |
| `duration_minutes` | How many minutes the car has been parked so far. |
| `payment_status` | `"PENDING"` while parked, `"PAID"` after exit (if fee was 0). |

**Error Responses:**

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Missing query params | `{ "error": "registration and province query parameters are required." }` |
| `404` | No active session | `{ "error": "No active parking session found for this vehicle." }` |

---

## 4. WebSocket (Socket.io) Events

The backend uses **Socket.io** (not raw WebSocket). Connect to the same server URL.

### Connection

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");
```

### Events: Server → Client

#### `dashboard:init`

**Fired:** Immediately after a client connects.
**Purpose:** Send the full slot list so the 3D scene can render all slots at once.

**Payload:** Array of `ParkingSlot`

```json
[
  {
    "slot_id": "VIP-A1",
    "slot_type": "VIP",
    "status": "FREE",
    "location_coordinates": "{\"x\":0,\"y\":0,\"z\":0}",
    "is_active": true
  },
  {
    "slot_id": "GEN-B1",
    "slot_type": "GENERAL",
    "status": "OCCUPIED",
    "location_coordinates": "{\"x\":0,\"y\":10,\"z\":0}",
    "is_active": true
  }
]
```

---

#### `slot:update`

**Fired:** Whenever a slot's status changes (entry, park, or exit).
**Purpose:** Update one slot in the 3D scene in real-time.

**Payload:**

```json
{
  "slot_id": "VIP-A1",
  "status": "ASSIGNED",
  "slot_type": "VIP",
  "session": {
    "session_id": "uuid-string",
    "registration": "1กข 1234",
    "province": "กรุงเทพมหานคร"
  }
}
```

| Field | Type | Always Present | Description |
|-------|------|----------------|-------------|
| `slot_id` | string | Yes | Which slot changed |
| `status` | `"FREE"` \| `"ASSIGNED"` \| `"OCCUPIED"` | Yes | The new status |
| `slot_type` | `"VIP"` \| `"GENERAL"` | No | Only included on ASSIGNED events |
| `session` | object \| null | No | Only included on ASSIGNED events — contains the session and plate info |

---

#### `session:closed`

**Fired:** When a car exits and the session is finalized.
**Purpose:** Show exit summary (fee, duration) and animate the slot back to FREE.

**Payload:**

```json
{
  "session_id": "uuid-string",
  "slot_id": "VIP-A1",
  "total_fee": 40,
  "duration_minutes": 180
}
```

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string | The closed session UUID |
| `slot_id` | string | The slot that was freed |
| `total_fee` | number | Final fee in THB |
| `duration_minutes` | number | Total parking duration in minutes |

---

### Summary: Event Sequence Over a Slot's Lifecycle

```
1. Car scanned at entrance
   └─► slot:update { slot_id: "VIP-A1", status: "ASSIGNED", session: { ... } }

2. Car physically parks (sensor triggered)
   └─► slot:update { slot_id: "VIP-A1", status: "OCCUPIED" }

3. Car leaves (sensor triggered)
   └─► slot:update { slot_id: "VIP-A1", status: "FREE" }
   └─► session:closed { slot_id: "VIP-A1", total_fee: 0, duration_minutes: 45 }
```

---

## 5. Data Models & TypeScript Interfaces

Copy these interfaces into your frontend for type safety.

```typescript
// ─── Enums ───────────────────────────────

type SlotStatus = "FREE" | "OCCUPIED" | "ASSIGNED";
type SlotType = "VIP" | "GENERAL";
type PaymentStatus = "PENDING" | "PAID";

// ─── Auth ────────────────────────────────

interface AuthResponse {
  user: {
    user_id: string;
    email: string;
    name: string;
    created_at: string; // ISO 8601
  };
  token: string;
}

// ─── Privilege Program ───────────────────

interface PrivilegeProgram {
  program_id: string;
  provider_name: string; // e.g. "SCB First", "The 1 Card"
  tier: string | null;   // e.g. "Private Banking", "Gold", "Platinum"
  free_hours: number;
  max_vehicles: number;
  is_active: boolean;
}

// ─── User Card ───────────────────────────

interface UserCard {
  card_id: string;
  user_id: string;
  program_id: string;
  issued_at: string; // ISO 8601
  is_active: boolean;
  program: PrivilegeProgram; // Included via join
}

// ─── Registered Vehicle ──────────────────

interface RegisteredVehicle {
  vehicle_id: string;
  registration: string; // e.g. "1กข 1234"
  province: string;     // e.g. "กรุงเทพมหานคร"
  registered_at: string; // ISO 8601
  cards: UserCard[];    // Linked cards (M:N)
}

// ─── Parking Slot ────────────────────────

interface ParkingSlot {
  slot_id: string;               // e.g. "VIP-A1", "GEN-B3"
  slot_type: SlotType;
  status: SlotStatus;
  location_coordinates: string;  // JSON string: '{"x":0,"y":0,"z":0}'
  is_active: boolean;
}

// ─── Parsed Location (for Three.js) ─────

interface SlotCoordinates {
  x: number;
  y: number;
  z: number;
}

// ─── Socket.io Event Payloads ────────────

interface SlotUpdateEvent {
  slot_id: string;
  status: SlotStatus;
  slot_type?: SlotType;
  session?: {
    session_id: string;
    registration?: string | null;
    province?: string | null;
  } | null;
}

interface SessionClosedEvent {
  session_id: string;
  slot_id: string;
  total_fee: number;
  duration_minutes: number;
}

// ─── Session Check Response ──────────────

interface SessionCheckResponse {
  session_id: string;
  slot: {
    slot_id: string;
    slot_type: SlotType;
    status: SlotStatus;
  };
  registration: string | null;
  province: string | null;
  is_registered: boolean;
  entry_time: string; // ISO 8601
  duration_minutes: number;
  estimated_fee: number;
  free_hours: number;
  payment_status: PaymentStatus;
}
```

---

## 6. Parking Slot Layout (for 3D Model)

The seed data creates a **4-row × 5-column** grid (20 slots total):

| Row | Slot IDs | Type | Coordinates (y) |
|-----|----------|------|------------------|
| A | VIP-A1, VIP-A2, VIP-A3, VIP-A4, VIP-A5 | VIP | y = 0 |
| B | GEN-B1, GEN-B2, GEN-B3, GEN-B4, GEN-B5 | GENERAL | y = 10 |
| C | GEN-C1, GEN-C2, GEN-C3, GEN-C4, GEN-C5 | GENERAL | y = 20 |
| D | GEN-D1, GEN-D2, GEN-D3, GEN-D4, GEN-D5 | GENERAL | y = 30 |

**Column spacing:** x = `col_index * 10` (0, 10, 20, 30, 40)
**Row spacing:** y = `row_index * 10` (0, 10, 20, 30)
**All slots at:** z = 0

### Parsing coordinates in the frontend

```typescript
const slot: ParkingSlot = /* from API or socket */;
const coords: SlotCoordinates = JSON.parse(slot.location_coordinates);
// Use coords.x, coords.y, coords.z to position the 3D mesh
```

### Naming convention

| Prefix | Meaning |
|--------|---------|
| `VIP-` | VIP slot (privileged card holders get priority here) |
| `GEN-` | General slot (open to all — guests and registered) |

---

## 7. Slot State Machine

Each parking slot follows this state flow:

```
         ┌─────────────────────────────────────────────┐
         │                                             │
         ▼                                             │
      ┌──────┐   LPR Entry    ┌──────────┐   Sensor   │
      │ FREE │ ─────────────► │ ASSIGNED │ ──────────► │
      └──────┘                └──────────┘  Occupied   │
         ▲                                             │
         │                                     ┌───────┴──┐
         │               Sensor Exit           │ OCCUPIED  │
         └─────────────────────────────────────┴──────────┘
```

| State | Meaning | 3D Visual Suggestion |
|-------|---------|----------------------|
| `FREE` | Slot is empty and available | **Green** — no car model |
| `ASSIGNED` | System reserved this slot, car is driving to it | **Yellow/Amber** — pulsing/blinking |
| `OCCUPIED` | Car is physically in the slot (sensor confirmed) | **Red** — car model visible |

---

## 8. Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "Human-readable error message."
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `204` | Deleted (no body) |
| `400` | Bad request / validation error |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (not the owner / no access) |
| `404` | Resource not found |
| `409` | Conflict (e.g., duplicate email) |
| `500` | Internal server error |

---

## 9. Seed Data (for Development)

After seeding (`npx prisma db seed`), the database contains:

### Users (password for both: `password123`)

| Email | Name |
|-------|------|
| somchai@example.com | Somchai Jaidee |
| malee@example.com | Malee Suksri |

### Privilege Programs

| Provider | Tier | Free Hours | Max Vehicles |
|----------|------|------------|--------------|
| SCB First | Private Banking | 5 | 3 |
| The 1 Card | Gold | 2 | 2 |
| The 1 Card | Platinum | 3 | 3 |

### User Cards

| User | Program |
|------|---------|
| Somchai | SCB First (Private Banking) |
| Somchai | The 1 Card (Gold) |
| Malee | The 1 Card (Platinum) |

### Registered Vehicles

| Plate | Province | Linked Cards |
|-------|----------|--------------|
| 1กข 1234 | กรุงเทพมหานคร | Somchai's SCB First + The 1 Gold |
| 2ขค 5678 | เชียงใหม่ | Somchai's SCB First |
| 3คง 9012 | กรุงเทพมหานคร | Malee's The 1 Platinum |

### Parking Slots

20 slots: 5 VIP (row A), 15 GENERAL (rows B–D). Initially all `FREE` except two `OCCUPIED`:

- `VIP-A2` — Occupied by registered vehicle 3คง 9012
- `GEN-B2` — Occupied by guest vehicle 7ฉช 8888

### Pricing

Rate: **20 THB per hour** (rounded up to nearest whole hour).

**Fee formula:** `max(0, ceil(duration_hours) - free_hours) × 20`

---

## 10. Frontend Integration Guide (React Three Fiber)

### Recommended Libraries

```bash
npm install socket.io-client axios
```

### Socket.io Integration (Real-time 3D updates)

```typescript
// hooks/useSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = "http://localhost:3000";

interface ParkingSlot {
  slot_id: string;
  slot_type: "VIP" | "GENERAL";
  status: "FREE" | "ASSIGNED" | "OCCUPIED";
  location_coordinates: string;
  is_active: boolean;
}

interface SlotUpdateEvent {
  slot_id: string;
  status: "FREE" | "ASSIGNED" | "OCCUPIED";
  slot_type?: string;
  session?: {
    session_id: string;
    registration?: string | null;
    province?: string | null;
  } | null;
}

interface SessionClosedEvent {
  session_id: string;
  slot_id: string;
  total_fee: number;
  duration_minutes: number;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [lastClosed, setLastClosed] = useState<SessionClosedEvent | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    // 1. Receive full slot list on connect
    socket.on("dashboard:init", (data: ParkingSlot[]) => {
      setSlots(data);
    });

    // 2. Real-time slot status change
    socket.on("slot:update", (event: SlotUpdateEvent) => {
      setSlots((prev) =>
        prev.map((slot) =>
          slot.slot_id === event.slot_id
            ? { ...slot, status: event.status }
            : slot
        )
      );
    });

    // 3. Session closed (car exited)
    socket.on("session:closed", (event: SessionClosedEvent) => {
      setLastClosed(event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { slots, lastClosed };
}
```

### Rendering Slots in React Three Fiber

```tsx
// components/ParkingScene.tsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useSocket } from "../hooks/useSocket";

const STATUS_COLORS = {
  FREE: "#22c55e",     // Green
  ASSIGNED: "#eab308", // Yellow
  OCCUPIED: "#ef4444", // Red
};

function SlotMesh({ slot }: { slot: ParkingSlot }) {
  const coords = JSON.parse(slot.location_coordinates);

  return (
    <mesh position={[coords.x, 0, coords.y]}>
      <boxGeometry args={[8, 0.5, 8]} />
      <meshStandardMaterial color={STATUS_COLORS[slot.status]} />
    </mesh>
  );
}

export function ParkingScene() {
  const { slots } = useSocket();

  return (
    <Canvas camera={{ position: [20, 40, 60], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} />
      <OrbitControls />
      {slots.map((slot) => (
        <SlotMesh key={slot.slot_id} slot={slot} />
      ))}
    </Canvas>
  );
}
```

### Axios Setup for REST Endpoints

```typescript
// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────
export const register = (email: string, password: string, name: string) =>
  api.post("/auth/register", { email, password, name });

export const login = (email: string, password: string) =>
  api.post("/auth/login", { email, password });

// ─── Cards ───────────────────────────────
export const getCards = () => api.get("/users/cards");
export const addCard = (program_id: string) =>
  api.post("/users/cards", { program_id });
export const updateCard = (card_id: string, data: { is_active: boolean }) =>
  api.put(`/users/cards/${card_id}`, data);
export const deleteCard = (card_id: string) =>
  api.delete(`/users/cards/${card_id}`);

// ─── Vehicles ────────────────────────────
export const getVehicles = () => api.get("/users/vehicles");
export const registerVehicle = (
  registration: string,
  province: string,
  card_id: string
) => api.post("/users/vehicles", { registration, province, card_id });
export const updateVehicle = (
  vehicle_id: string,
  data: { registration?: string; province?: string; card_id?: string }
) => api.put(`/users/vehicles/${vehicle_id}`, data);
export const deleteVehicle = (vehicle_id: string) =>
  api.delete(`/users/vehicles/${vehicle_id}`);

// ─── Parking ─────────────────────────────
export const getDashboard = () => api.get("/parking/dashboard");
export const checkSession = (registration: string, province: string) =>
  api.get("/parking/session", { params: { registration, province } });
```

---

## Quick Reference Table

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Create account |
| `POST` | `/api/auth/login` | No | Log in |
| `GET` | `/api/users/cards` | Yes | List my cards |
| `POST` | `/api/users/cards` | Yes | Add a card |
| `PUT` | `/api/users/cards/:card_id` | Yes | Update a card |
| `DELETE` | `/api/users/cards/:card_id` | Yes | Delete a card |
| `GET` | `/api/users/vehicles` | Yes | List my vehicles |
| `POST` | `/api/users/vehicles` | Yes | Register a vehicle |
| `PUT` | `/api/users/vehicles/:vehicle_id` | Yes | Update a vehicle |
| `DELETE` | `/api/users/vehicles/:vehicle_id` | Yes | Delete a vehicle |
| `GET` | `/api/parking/dashboard` | No | All slot statuses |
| `GET` | `/api/parking/session` | No | Check active session by plate |
| **WS** | `dashboard:init` | — | Full slot list on connect |
| **WS** | `slot:update` | — | Real-time slot change |
| **WS** | `session:closed` | — | Session exit summary |
