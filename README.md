# BillKhata - Shared Living Expense Manager

A comprehensive application for managing shared living expenses, bills, meals, and finances among roommates.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret (minimum 32 characters)
JWT_SECRET=your_secure_jwt_secret

# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/billkhata` |
| `JWT_SECRET` | Secret key for JWT token encryption | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXT_PUBLIC_API_URL` | API base URL for client-side requests | Local: `http://localhost:3000/api`<br/>Production: `https://yourdomain.com/api` |

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. **Important:** Set `NEXT_PUBLIC_API_URL` to your production domain (e.g., `https://your-app.vercel.app/api`)
5. Deploy

For detailed deployment instructions, see `deployment_guide.md`.

## Features

- 💰 **Bill Splitting** - Manage rent, utilities, and shared expenses
- 🍽️ **Meal Tracking** - Daily meal logging with automatic cost calculation
- 💵 **Deposits & Expenses** - Track fund contributions and spending
- 👥 **Member Management** - Role-based access (Manager/Member)
- 📊 **Analytics** - Detailed reports and payment history
- 🔔 **Notifications** - Real-time updates for all activities
- 🌙 **Dark Mode** - Optimized for day and night use
- 📱 **Mobile Responsive** - Works perfectly on all devices

## Tech Stack

- **Framework:** Next.js 16 (Turbopack)
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Project Structure

```
billkhata-next/
├── app/                    # Next.js app directory (pages & API routes)
├── components/             # Reusable React components
├── contexts/              # React context providers (Auth, Notifications)
├── models/                # Mongoose database models
├── services/              # API service layer
├── lib/                   # Utility functions (auth, db connection)
├── public/                # Static assets
└── types/                 # TypeScript type definitions
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## License

All rights reserved © 2024 BillKhata
