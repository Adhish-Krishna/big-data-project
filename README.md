# SmartFleet — Big Data IoT Fleet Management & Rental Platform

<p align="center">
  <img src="frontend/public/logo_og.png" alt="SmartFleet Logo" width="160" />
</p>

<p align="center">
  <strong>Enterprise Big Data IoT Platform with Polyglot Persistence (MongoDB + Neo4j)</strong><br />
  Real-time Highway Route Simulation · Graph Network Pathfinding · IoT Telemetry Ingestion · Station Rebalancing
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Neo4j-5.26-008CC1?style=for-the-badge&logo=neo4j&logoColor=white" alt="Neo4j" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

## 📋 Table of Contents
- [Executive Overview](#-executive-overview)
- [Polyglot Persistence Architecture](#-polyglot-persistence-architecture)
- [System Architecture Diagram](#-system-architecture-diagram)
- [Key Application Features](#-key-application-features)
  - [1. Live OSM India Fleet Map & Real-Time Highway Transit](#1-live-osm-india-fleet-map--real-time-highway-transit)
  - [2. Intelligent Rental Planner & Pathfinding Engine](#2-intelligent-rental-planner--pathfinding-engine)
  - [3. Interactive Neo4j Knowledge Graph Visualizer](#3-interactive-neo4j-knowledge-graph-visualizer)
  - [4. Big Data IoT Aggregation Analytics](#4-big-data-iot-aggregation-analytics)
- [Graph & Document Data Models](#-graph--document-data-models)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Docker Compose (Recommended)](#1-run-with-docker-compose-recommended)
  - [Local Development Mode](#2-local-development-mode)
- [REST API Specifications](#-rest-api-specifications)
- [Design Aesthetics & Typography](#-design-aesthetics--typography)
- [Academic & Industry Relevance](#-academic--industry-relevance)

---

## 🌟 Executive Overview

**SmartFleet** is an end-to-end, enterprise-grade Fleet Management & IoT Telemetry tracking platform engineered for high-throughput sensor ingestion, multi-modal vehicle rental routing, and graph-based network optimization across India.

The platform solves complex operational challenges in modern smart mobility:
- **High-Velocity Telemetry Streams**: Processing high-frequency sensor readings (GPS coordinates, speed, battery percentage, engine temperature, harsh braking, and geofence events).
- **Interstate Routing & Pathfinding**: Calculating multi-hop shortest paths across transportation hubs using Cypher graph traversal with bridge toll and duration factors.
- **Dynamic Station Fleet Rebalancing**: Detecting surplus and deficit inventory across national hubs and recommending optimal vehicle transfers.
- **Real-Time Highway Route Simulation**: Active vehicle rentals authentically navigate highway trajectories from source to destination with dynamic GPS interpolation and consumption telemetry.

---

## 🧬 Polyglot Persistence Architecture

Rather than forcing an all-in-one database model, SmartFleet implements **Polyglot Persistence**, assigning distinct workloads to the database engine specifically optimized for that data access pattern:

```
                                  ┌──────────────────────────────┐
                                  │   SmartFleet Web Client      │
                                  │  (React 19 + TypeScript)     │
                                  └──────────────┬───────────────┘
                                                 │ HTTP / REST / Vite Proxy
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │   Express / Node.js Engine   │
                                  │    (TypeScript API Server)   │
                                  └──────┬───────────────┬───────┘
                                         │               │
                     High-Throughput IoT │               │ Graph Traversals &
                     Telemetry & Billing │               │ Topology Queries
                                         ▼               ▼
                      ┌────────────────────┐   ┌────────────────────┐
                      │      MongoDB       │   │       Neo4j        │
                      │  (Document Store)  │   │     (Graph DB)     │
                      └────────────────────┘   └────────────────────┘
```

| Operational Domain | Database Engine | Data Model & Technical Rationale |
| :--- | :--- | :--- |
| **High-Frequency IoT Telemetry** | **MongoDB** (v7.0) | Time-series document stream capturing live GPS `Point` coordinates, speed, battery %, and engine temp. Utilizes `2dsphere` geospatial indexing for proximity queries and geofence boundary audits. |
| **Rental Contracts & Billing** | **MongoDB** (v7.0) | Flexible schema storing rental contracts, insurance tiers (`BASIC`, `PREMIUM`, `ENTERPRISE`), tariff calculation, and customer contact specs. |
| **National Road Network & Routing** | **Neo4j** (v5.26) | Connected graph `(:Hub)-[:CONNECTED_TO {distanceKm, durationMinutes, tollFee}]->(:Hub)`. Uses Cypher `shortestPath` algorithms for optimal multi-hub routing. |
| **Fleet Allocations & Occupancy** | **Neo4j** (v5.26) | Real-time vehicle station residency `(:Vehicle)-[:CURRENTLY_AT]->(:Hub)`. Calculates surplus and deficit inventory across the station network. |
| **Customer Lineage & Relationships** | **Neo4j** (v5.26) | Graph relationships `(:Customer)-[:RENTED]->(:Vehicle)` enabling dual-write sync and customer travel lineage analysis. |

---

## 🚀 Key Application Features

### 1. Live OSM India Fleet Map & Real-Time Highway Transit
- **Centrally Focused Indian Map (`[20.5937, 78.9629]` zoom 5)**: Interconnected stations across Coimbatore, Bengaluru, Mumbai, Delhi, Chennai, Hyderabad, Pune, Kolkata, and Ahmedabad.
- **Authentic Highway Travel Simulation**:
  - When a rental is active, the vehicle **actually travels** along the highway trajectory between the origin and destination hubs.
  - Live GPS coordinates interpolate with natural curvature on every simulation tick (3.5s interval).
  - Dynamic highway cruising speed (**68–90 km/h**), realistic EV battery drain, and odometer progression.
  - Active **Highway Route Polylines** are drawn on Leaflet showing the vehicle in transit with real-time percentage completion badges.
- **Deep Diagnostics Side Drawer**:
  - High-frequency telemetry sparklines for Speed, Battery %, and Engine Temperature.
  - **Live Highway Journey Card**: Visualizes progress bar, origin station, destination station, and estimated completion.
  - Layered with `zIndex: 9999` to ensure smooth overlay above map controls.

### 2. Intelligent Rental Planner & Pathfinding Engine
- **Neo4j Shortest Path Engine**: Automatically calculates the shortest highway corridor between any two national hubs, displaying cumulative distance (km), travel time, toll expenses, and intermediate waypoints.
- **Coimbatore Tidel Park & Tech Hub Integration**: Full support for Coimbatore origin and destination routes (e.g. Coimbatore ↔ Bengaluru, Coimbatore ↔ Chennai).
- **Optimistic State Updates**: Newly booked contracts are instantly pinned to the active contracts view with zero blank-screen delay.
- **One-Click Vehicle Return**: Interactive vehicle check-in button that marks rentals completed and updates station inventory in real time.

### 3. Interactive Neo4j Knowledge Graph Visualizer
- **Interactive SVG Force-Directed Canvas**:
  - Real-time physics engine using normalized velocity vectors, center gravity, and boundary damping (zero `NaN` divergence).
  - Smooth pan, zoom (0.4x to 2.5x), and canvas drag interactions.
- **Dynamic Relationship Highlighting on Node Click**:
  - Clicking any Car, Hub, or Customer node highlights all direct relationships with a **3.5px glowing line** and animated flowing stroke dashes (`strokeDasharray: 6 4`).
  - Distinct relationship color palette:
    - 🟢 **Emerald Green (`#22c55e`)**: `[:CURRENTLY_AT]` (Vehicle stationed at Hub).
    - 🔵 **Cyan Blue (`#38bdf8`)**: `[:RENTED]` (Customer renting Vehicle).
    - 🟡 **Royal Gold (`#c9a84c`)**: `[:CONNECTED_TO]` (Hub-to-Hub highway road).
  - **Floating Cypher Edge Badges**: Displays `:RENTED`, `:CURRENTLY_AT`, or `:CONNECTED_TO` directly over active edges.
  - **Connected Sub-Graph Focus**: Selected nodes receive glowing double rings, neighbor nodes receive accent borders, and unrelated nodes fade to 20% opacity.
- **Direct Relationships Inspector**: Interactive sidebar cards let you click to jump directly from vehicle to hub to customer across the graph.
- **Fleet Rebalancing Engine**: Algorithmic recommendations to reallocate surplus vehicles to deficit hubs along the shortest route.

### 4. Big Data IoT Aggregation Analytics
- **Fleet Propulsion Composition**: Real-time aggregation of EV vs ICE fleets (Average battery %, fuel %, and odometer readings).
- **Corridor Rental Revenue**: Total revenue and mileage grouped by vehicle type and highway corridor.
- **Real-Time IoT Anomaly Stream**: Live feed monitoring harsh braking incidents and geofence boundary exits.

---

## 📐 Graph & Document Data Models

### Neo4j Graph Topology

```cypher
// Hub to Hub Highway Connection
(:Hub {id: "hub-cbe-central", name: "Coimbatore Tidel Park & Tech Hub", city: "Coimbatore", capacity: 32})
  -[:CONNECTED_TO {distanceKm: 362, durationMinutes: 340, tollFee: 6.0}]->
(:Hub {id: "hub-blr-electronic", name: "Bengaluru Electronic City Hub", city: "Bengaluru", capacity: 40})

// Vehicle Stationed at Hub
(:Vehicle {vin: "TN-38-EV-4410", make: "Tata", model: "Nexon EV Empowered", type: "ELECTRIC"})
  -[:CURRENTLY_AT]->
(:Hub {id: "hub-cbe-central"})

// Customer Active Rental
(:Customer {id: "CUST-801", name: "Devendra Sharma", phone: "+91-98200-11223"})
  -[:RENTED {rentalId: "RNT-IND-8821", status: "ACTIVE"}]->
(:Vehicle {vin: "IND-MUM-SUV-1002"})
```

### MongoDB Document Schema Examples

```json
// Vehicle IoT State Document
{
  "_id": "veh-cbe-001",
  "vin": "TN-38-EV-4410",
  "licensePlate": "TN-38-EV-4410",
  "make": "Tata",
  "model": "Nexon EV Empowered",
  "year": 2024,
  "type": "ELECTRIC",
  "status": "AVAILABLE",
  "batteryPct": 96,
  "dailyRate": 46,
  "currentHubId": "hub-cbe-central",
  "currentLocation": {
    "type": "Point",
    "coordinates": [76.9558, 11.0168]
  },
  "speedKmH": 0,
  "engineTempC": 35,
  "lastSeen": "2026-09-23T14:30:00.000Z"
}
```

---

## 🛠️ Quick Start Guide

### Prerequisites
- [Docker & Docker Desktop](https://www.docker.com/) (v24+)
- [Node.js](https://nodejs.org/) (v18+ or v20+) & `npm`

---

### 1. Run with Docker Compose (Recommended)

Start the entire polyglot stack (MongoDB, Neo4j, Express Backend, and React Frontend) with a single command:

```bash
docker compose up -d --build
```

#### Services and Access URLs:
| Service | URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | React 19 + Nginx production container |
| **Backend REST API** | [http://localhost:5000](http://localhost:5000) | Express + TypeScript API gateway |
| **Neo4j Browser** | [http://localhost:7474](http://localhost:7474) | User: `neo4j` · Password: `password123` |
| **MongoDB** | `localhost:27017` | Database: `smartfleet` |

---

### 2. Local Development Mode

If developing features locally outside of Docker:

```bash
# Step 1: Start database containers only
docker compose up -d mongodb neo4j

# Step 2: Start the Backend Server
cd backend
npm install
npm run seed       # Pre-populates Indian Hubs, Road Network, Vehicles, and Rentals
npm run dev        # Starts Express server on http://localhost:5000

# Step 3: Start the Frontend App (in a separate terminal)
cd ../frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173 or 5174
```

---

## 📡 REST API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck verifying MongoDB and Neo4j connection status. |
| `GET` | `/api/fleet` | List vehicles with optional filters (`status`, `type`, `hubId`). |
| `GET` | `/api/fleet/:vin` | Single vehicle telemetry history, battery status, and hub. |
| `GET` | `/api/fleet/nearby` | Geospatial `2dsphere` query for vehicles within radius. |
| `GET` | `/api/graph/hubs` | Retrieve all national transportation hubs. |
| `GET` | `/api/graph/network` | Node & edge graph payload for Knowledge Graph Visualizer. |
| `POST`| `/api/graph/route` | Cypher `shortestPath` query returning distance, duration, and tolls. |
| `GET` | `/api/graph/inventory`| Real-time hub capacity, occupancy, and deficit/surplus stats. |
| `GET` | `/api/graph/rebalance`| Algorithmic recommendations for station fleet transfers. |
| `GET` | `/api/rentals` | List active and historical rental contracts. |
| `POST`| `/api/rentals` | Dual-write booking: Creates MongoDB contract & Neo4j rental edge. |
| `POST`| `/api/rentals/:rentalId/complete` | Complete trip, check-in vehicle, and update station occupancy. |
| `GET` | `/api/telemetry/live` | Current GPS coordinates and telemetry stream for all vehicles. |
| `POST`| `/api/telemetry/simulate/tick` | Advance real-time vehicle simulation step along highway routes. |
| `POST`| `/api/telemetry/simulate/start|stop` | Toggle continuous simulation background process. |
| `GET` | `/api/analytics` | Aggregated analytics: vehicle metrics, revenue, and anomalies. |

---

## 🎨 Design Aesthetics & Typography

SmartFleet follows a curated **Royal Black & White** enterprise design language:
- **Brand Title Typography**: [Comfortaa](https://fonts.google.com/specimen/Comfortaa) (`22px`, 700 weight, `-0.02em` tracking) for a futuristic, geometric brand identity.
- **Body & Data Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) & [Inter](https://fonts.google.com/specimen/Inter) for maximum data readability.
- **Color Hierarchy**:
  - `Surface Dark`: Deep obsidian black (`#070707`, `#0c0c0c`, `#141414`).
  - `Accent Highlights`: Royal Gold (`#c9a84c`), Emerald Green (`#22c55e`), Electric Cyan (`#38bdf8`), and Amber (`#f59e0b`).
  - `Pills & Active States`: Clean high-contrast white pills (`#ffffff` on `#000000`) for tactile state switching.

---

## 🎓 Academic & Industry Relevance

This project was built to illustrate real-world distributed data engineering patterns:
1. **Addressing the CAP Theorem with Polyglot Storage**:
   - **MongoDB** provides partition tolerance and high write throughput for continuous append-only IoT telemetry.
   - **Neo4j** provides ACID-compliant graph traversal performance without expensive SQL recursive joins (`$O(k^d)$` vs `$O(d)$` path lookup).
2. **Dual-Write Consistency**:
   - Demonstrates coordinated two-phase updates across a document store (MongoDB contract storage) and a property graph (Neo4j customer-to-vehicle edge creation).
3. **Geospatial & Time-Series Convergence**:
   - Combines spatial coordinates (`2dsphere`) with time-series diagnostic streaming to detect anomalies like harsh braking and geofence boundary violations in near-real-time.

---
