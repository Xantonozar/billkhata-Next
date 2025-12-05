<div align="center">

  <h1>✨ BillKhata</h1>
  
  <p align="center">
    <strong>Split Bills, Share Meals, Stay Friends.</strong>
  </p>

  <p align="center">
    The ultimate shared living expense manager for hostels, flats, and mess life.
    <br />
    <a href="https://billkhata.com"><strong>Explore the Demo »</strong></a>
    <br />
    <br />
    <a href="#features">Features</a>
    ·
    <a href="#tech-stack">Tech Stack</a>
    ·
    <a href="#quick-start">Quick Start</a>
    ·
    <a href="#deployment">Deployment</a>
  </p>

  <div align="center">
    <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/MongoDB-Ready-green?style=flat-square&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/PWA-Supported-purple?style=flat-square&logo=pwa" alt="PWA" />
  </div>
</div>

<br />

## 📖 About BillKhata

**BillKhata** solves the chaos of shared living finances. Whether you're students in a hostel, roommates in a flat, or managing a mess, keeping track of who owes what—especially with daily meals—can be a nightmare.

This app automates everything:
- **Daily Meal Logging**: Tracks breakfast, lunch, and dinner counts per member.
- **Dynamic Meal Rate**: Calculates the cost-per-meal in real-time based on total shopping expenses.
- **Smart Bill Splitting**: Handles rent, internet, maid salary, and utility bills with equal or custom splits.
- **Manager Tools**: Special controls for room managers to approve members and manage settings.

---

## 🚀 Features

### 🍛 Meal Management System
- **Daily Roster**: Mark meals (Breakfast/Lunch/Dinner) for each member daily.
- **Auto-Calculation**: The app automatically updates the "Meal Rate" as you add shopping expenses.
- **Shopping Duty**: Assign and track who is responsible for marketing/shopping on which days.
- **Menu Display**: Show what's cooking for B/L/D so everyone knows the menu.

### 💰 Expense Tracking
- **Split Your Way**: Split bills equally among all members or assign specific amounts.
- **Category Support**: Pre-defined categories for Rent, Electricity, WiFi, Maid, Gas, and more.
- **Receipts**: Track every deposit and expense with details.

### 📊 Transparent Reporting
- **Live Dashboard**: See your personal balance and room totals instantly.
- **Monthly Breakdown**: Visual charts showing where the money is going.
- **Settle Up**: One-click report generation to see who needs to pay whom at the end of the month.

### ⚡ Modern Tech & UX
- **Mobile First**: Fully responsive design that works like a native app on your phone.
- **PWA Ready**: Installable on Android & Desktop for offline-like experience.
- **Dark Mode**: Beautiful, easy-on-the-eyes dark theme by default.
- **Secure**: JWT-based authentication and role-based access control (Manager vs Member).

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js Server Actions & API Routes
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens) with Secure Cookies
- **Visuals**: Framer Motion (animations), Recharts (analytics)

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/billkhata-next.git
cd billkhata-next
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```env
# Database Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/billkhata

# Security
JWT_SECRET=your-super-long-secure-secret-key-min-32-chars

# App Config
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Run Locally
```bash
npm run dev
```
Visit `http://localhost:3000` to see your app running!

---

## 📱 How to Use

1.  **Create a Room**: Sign up as a **Manager** and create a new "Room" (e.g., "Flat 302"). You'll get a generated Room Code (e.g., `8294`).
2.  **Invite Members**: Friends sign up as **Members** and enter your Room Code to join.
3.  **Start Logging**:
    -   Add **Deposits** when members put money into the shared fund.
    -   Log **Daily Meals** for everyone.
    -   Add **Expenses** (Shopping, Bills) to deduct from the fund.
4.  **View Reports**: Checking the "Reports" tab shows exactly how much everyone has consumed vs. deposited.

---

## 📦 Project Structure

```bash
billkhata-next/
├── app/                  # Next.js App Router Pages & API
│   ├── (authenticated)/  # Protected routes (Dashboard, etc.)
│   ├── api/              # Backend API endpoints
│   ├── demo/             # Public Demo Page
│   └── ...
├── components/           # Reusable UI Components
├── lib/                  # Utilities (DB connect, Auth helpers)
├── models/               # Mongoose Schemas (User, Bill, Meal)
└── public/               # Static assets (Icons, Manifest)
```

---

## 🔒 License

This project is proprietary and confidential.
© 2025 BillKhata. All rights reserved.

