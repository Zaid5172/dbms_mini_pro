# Smart Vehicle Parking and Incident Management System

A comprehensive, hybrid multi-database web application built for the DBMS Level 3 Project. This project integrates **MySQL** (Relational SQL for persistent transactional data) and **Redis** (In-Memory NoSQL Key-Value Store for real-time slot state caching, active session tracking, and rate-limiting).

## Tech Stack
- **Frontend / Backend API**: Next.js (React, API Routes)
- **Relational DB (SQL)**: MySQL (Users, Vehicles, Lots, Slots, Bookings, Payments with ACID transactions, triggers, stored functions, and views)
- **NoSQL DB (Key-Value)**: Redis (Real-time slot availability cache and active session caching)

---

## Setup & Installation

1. **Clone Repository & Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` and fill in your database credentials:
   ```bash
   cp .env.example .env.local
   ```

3. **Initialize Databases:**
   - Run `database/mysql_schema.sql` in your MySQL server.
   - Ensure Redis server is running locally (`redis-server`).

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
