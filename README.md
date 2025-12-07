<div align="center">

  <h1>✨ BillKhata</h1>
  
  <p align="center">
    <strong>No More Mess in Your Mess.</strong>
  </p>

  <p align="center">
    Smart Expense & Meal Manager for Shared Living in Bangladesh
    <br />
    <a href="https://billkhata.com"><strong>Explore the Demo »</strong></a>
    <br />
    <br />
    <a href="#overview">Overview</a>
    ·
    <a href="#problem">Problem</a>
    ·
    <a href="#features">Features</a>
    ·
    <a href="#tech-stack">Tech Stack</a>
    ·
    <a href="#quick-start">Quick Start</a>
  </p>

  <div align="center">
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/MongoDB-Ready-green?style=flat-square&logo=mongodb" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/PWA-Supported-purple?style=flat-square&logo=pwa" alt="PWA" />
  </div>
</div>

<br />

## 📖 Overview

In Bangladesh, thousands of students and young professionals live together in messes or shared bachelor homes. While shared living reduces personal expenses, it often creates constant confusion around meal rates, payments, monthly costs, and household responsibilities. 

**Who paid the rent? Who owes money? How many meals did each person take? Who will manage the bua (housemaid)?** These questions turn into arguments, stress, and mistrust.

**BillKhata** solves this problem with a simple, transparent, and automated system designed specifically for bachelors living in shared homes in Bangladesh.

---

## 🔴 Problem

Living in a shared mess or bachelor home brings several recurring issues:

### **Meal Calculation Confusion**
Meal rates change daily depending on expenses. People forget to update or manipulate the numbers.

### **Payment Tracking Disputes**
It becomes unclear who paid for groceries, gas bills, rent, bua/maid, electricity, water, or internet bills.

### **Lack of Transparency**
Data is usually recorded on paper or notes in mobile phones with no accountability.

### **No Central Information**
New members or existing members do not know:
- Who manages the meals
- Who handles household bills
- Bua's contact number
- Current month's budget
- Small expenses like salt, spices, or cooking gas

### **Human Error & Arguments**
Manual calculation leads to mistakes and conflicts among roommates.

---

## 🚀 Features

### ✔ **Automated Meal & Rate Calculation**
- **Members enter daily meals** (Breakfast, Lunch, Dinner)
- **Daily expenses update the per-meal cost automatically**
- **Everyone can see real-time meal rates**
- **No more manual calculations or disputes**

### ✔ **Expense Sharing & Payment Tracking**
- **Track who paid for what** - groceries, gas, utilities
- **Split any household cost** across all or selected members
- **Avoid misunderstandings** with transparent payment history
- **Approve/reject system** - Manager can verify expenses before approval

### ✔ **Central Mess Information**
Store important details in one place:
- **Bua/maid phone number**
- **Shop contacts** (grocery store, gas supplier)
- **Monthly rent agreements**
- **Common rules** for the mess
- **Emergency contacts**

### ✔ **Member-wise Accounts**
Each person has a personal dashboard showing:
- **Total meals consumed** (breakfast/lunch/dinner breakdown)
- **Amount owed/received** (refund or due)
- **Pending payments** and approvals
- **Monthly summary** with detailed breakdowns

### ✔ **Shopping Duty Roster**
- **Assign shopping days** to different members
- **Track who is responsible** for marketing
- **Automated reminders** for upcoming duties
- **Approve shopping expenses** before adding to meal rate

### ✔ **Menu Management**
- **Set permanent weekly menu** or override for specific days
- **Display today's menu** on dashboard
- **Plan meals in advance**
- **Temporary menu changes** for special occasions

### ✔ **Bill Management**
- **Rent, WiFi, Electricity, Gas, Water** - all in one place
- **Custom or equal splits** among members
- **Due date reminders**
- **Payment status tracking**

### ✔ **Reports & Analytics**
- **Visual charts** showing expense distribution
- **Trend analysis** for the last 6 months
- **Fund health** monitoring (Deposits - Expenses)
- **Export reports** for record-keeping

### ✔ **Data Backup & Security**
- **Cloud-based system** keeps everything safe
- **Members can access** anytime from any device
- **JWT authentication** with secure cookies
- **Role-based access control** (Manager vs Member)

---

## 🎯 Target Users

BillKhata is built for:

- **Students** living in messes or shared rooms
- **Job holders** living away from family
- **Small bachelor groups** in cities like Dhaka, Chattogram, Sylhet, Rajshahi, Khulna, etc.
- **Anyone sharing expenses** in a communal living arrangement

---

## 💡 Benefits

🔹 **Saves time** and reduces arguments  
🔹 **100% transparent** budgeting  
🔹 **Fair meal rate** calculation  
🔹 **Tracks all money flow** automatically  
🔹 **Keeps household information** in one place  
🔹 **Reduces stress** and improves relationships among roommates  
🔹 **No manual calculations** - everything is automated  
🔹 **Accessible anywhere** - mobile-first PWA design  

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Next.js API Routes (Serverless)
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT with Secure HTTP-only Cookies
- **State Management**: React Context API
- **Forms**: Custom form handling with validation
- **PWA**: next-pwa for offline support
- **Deployment**: Vercel (optimized for serverless)
- **Monitoring**: Vercel Speed Insights

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

# Optional: Cloudinary for image uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Run Locally
```bash
npm run dev
```
Visit `http://localhost:3000` to see your app running!

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📱 How to Use

### For Managers:

1. **Create a Room**: Sign up as a **Manager** and create a new "Room" (e.g., "Flat 302"). You'll get a generated Room Code (e.g., `FLAT302`).
2. **Invite Members**: Share the Room Code with your roommates.
3. **Approve Join Requests**: Members who join will need your approval.
4. **Set Up Menu**: Configure permanent weekly menu or set daily menu.
5. **Add Shopping Roster**: Assign shopping duties to members.
6. **Manage Bills**: Add rent, utilities, and other shared bills.
7. **Approve Expenses**: Review and approve shopping expenses submitted by members.
8. **Monitor Dashboard**: Track overall fund health and member balances.

### For Members:

1. **Join a Room**: Sign up as a **Member** and enter the Room Code provided by your manager.
2. **Wait for Approval**: Your manager will approve your join request.
3. **Log Daily Meals**: Mark your breakfast, lunch, and dinner every day.
4. **Add Deposits**: When you contribute money to the shared fund.
5. **Submit Expenses**: If you shop for the mess, submit the expense with receipt.
6. **View Your Balance**: Check your dashboard to see how much you owe or are owed.
7. **Check Menu**: See what's cooking for today.
8. **View Reports**: Track your monthly spending and meal consumption.

---

## 📦 Project Structure

```bash
billkhata-next/
├── app/                      # Next.js App Router
│   ├── api/                  # Backend API endpoints
│   │   ├── auth/            # Authentication (login, signup, me)
│   │   ├── bills/           # Bill management
│   │   ├── meals/           # Meal tracking
│   │   ├── menu/            # Menu management
│   │   ├── deposits/        # Deposit tracking
│   │   ├── expenses/        # Shopping expenses
│   │   ├── analytics/       # Reports & analytics
│   │   └── dashboard/       # Dashboard stats
│   ├── bills/               # Bills page
│   ├── dashboard/           # Main dashboard
│   ├── meals/               # Meals management
│   ├── menu/                # Menu management
│   ├── members/             # Member management
│   ├── shopping/            # Shopping & expenses
│   ├── reports-analytics/   # Reports page
│   └── ...                  # Other pages
├── components/              # Reusable UI Components
│   ├── modals/             # Modal dialogs
│   ├── shopping/           # Shopping-related components
│   └── ...
├── contexts/               # React Context providers
│   ├── AuthContext.tsx     # Authentication state
│   └── NotificationContext.tsx
├── lib/                    # Utilities
│   ├── db.ts              # MongoDB connection
│   ├── auth.ts            # Auth helpers
│   └── dateUtils.ts       # Date utilities
├── models/                 # Mongoose Schemas
│   ├── User.ts            # User model
│   ├── Room.ts            # Room model
│   ├── Bill.ts            # Bill model
│   ├── Meal.ts            # Meal model
│   ├── Menu.ts            # Menu model
│   ├── Deposit.ts         # Deposit model
│   └── Expense.ts         # Expense model
├── services/              # API service layer
│   └── api.ts            # Frontend API client
├── types/                 # TypeScript type definitions
│   └── index.ts
└── public/                # Static assets
    ├── icons/            # PWA icons
    ├── manifest.json     # PWA manifest
    └── og-image.png      # Open Graph image
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/billkhata-next)

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL`
- `CLOUDINARY_CLOUD_NAME` (optional)
- `CLOUDINARY_API_KEY` (optional)
- `CLOUDINARY_API_SECRET` (optional)

---

## 🎨 Taglines

- **"No More Mess in Your Mess."**
- **"Smart Meal & Expense Manager for Shared Living."**
- **"Live Together. Share Fairly."**
- **"Split Bills, Share Meals, Stay Friends."**

---

## 🤝 Contributing

This is a proprietary project. For feature requests or bug reports, please contact the development team.

---

## 🔒 License

This project is proprietary and confidential.  
© 2024 BillKhata. All rights reserved.

---

<div align="center">
  <p>Made with ❤️ for students and professionals living in shared homes across Bangladesh</p>
  <p>
    <strong>BillKhata</strong> - Making shared living simple, transparent, and stress-free
  </p>
</div>
