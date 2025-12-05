"use client";

import React from 'react';
import Link from 'next/link';
import { SparklesIcon, BillsIcon, MealIcon, ChartBarIcon } from '@/components/Icons';
import LandingDashboardPreview from '@/components/LandingDashboardPreview';

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/50 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400">{description}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <header className="py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-8 h-8 text-primary-500" />
          <span className="font-bold text-2xl">BillKhata</span>
        </div>
        <div className="space-x-2">
          <Link href="/login" className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-block">
            Login
          </Link>
          <Link href="/signup" className="px-4 py-2 text-sm font-semibold rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-colors inline-block">
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="py-12 md:py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Split Bills,
              <br />
              <span className="text-primary-500">Share Meals,</span>
              <br />
              Stay Friends.
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto md:mx-0">
              The ultimate app for managing shared living expenses. From rent and utilities to daily meals, BillKhata keeps everything fair and transparent.
            </p>
            <div className="mt-8 flex gap-4 justify-center md:justify-start">
              <Link href="/signup" className="px-5 md:px-8 py-3 font-semibold rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-transform hover:scale-105 shadow-lg inline-block">
                <span className="md:hidden">Create Khata</span>
                <span className="hidden md:inline">Create Your Khata</span>
              </Link>
              <Link href="/demo" className="px-5 md:px-8 py-3 font-semibold rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-transform hover:scale-105 inline-block">
                <span className="md:hidden">Demo</span>
                <span className="hidden md:inline">See Demo</span>
              </Link>
            </div>
          </div>
          <div className="hidden md:block relative z-10">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl blur opacity-30 animate-pulse"></div>
            <LandingDashboardPreview />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Everything you need in one place</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto">BillKhata is packed with features to make shared living easier, more transparent, and conflict-free.</p>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BillsIcon className="w-6 h-6 text-primary-500" />}
              title="💰 Bill Splitting"
              description="Easily add bills for rent, utilities, and more. Split them equally or assign custom amounts per person."
            />
            <FeatureCard
              icon={<MealIcon className="w-6 h-6 text-primary-500" />}
              title="🍽️ Meal Tracker"
              description="Log daily meals to automatically calculate costs. Perfect for managing shared grocery funds fairly."
            />
            <FeatureCard
              icon={<ChartBarIcon className="w-6 h-6 text-primary-500" />}
              title="📊 Smart Analytics"
              description="Get clear insights with per-member breakdowns, monthly trends, and payment history reports."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl font-bold mb-12">Get Started in 4 Simple Steps</h2>
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Dashed line connector for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px -translate-y-8">
              <svg width="100%" height="2"><line x1="0" y1="1" x2="100%" y2="1" strokeWidth="2" strokeDasharray="8, 8" className="stroke-current text-slate-300 dark:text-slate-600" /></svg>
            </div>
            <div className="relative flex flex-col items-center">
              <div className="h-16 w-16 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-2xl z-10">1</div>
              <h3 className="mt-4 font-bold text-lg">Create Room</h3>
              <p className="mt-1 text-slate-600 dark:text-slate-400">A manager sets up a new room and gets a unique code.</p>
            </div>
            <div className="relative flex flex-col items-center">
              <div className="h-16 w-16 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-2xl z-10">2</div>
              <h3 className="mt-4 font-bold text-lg">Add Members</h3>
              <p className="mt-1 text-slate-600 dark:text-slate-400">Members join the room using the shared 6-digit code.</p>
            </div>
            <div className="relative flex flex-col items-center">
              <div className="h-16 w-16 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-2xl z-10">3</div>
              <h3 className="mt-4 font-bold text-lg">Track Expenses</h3>
              <p className="mt-1 text-slate-600 dark:text-slate-400">Log all bills, meals, and deposits as they happen.</p>
            </div>
            <div className="relative flex flex-col items-center">
              <div className="h-16 w-16 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-2xl z-10">4</div>
              <h3 className="mt-4 font-bold text-lg">Settle Up</h3>
              <p className="mt-1 text-slate-600 dark:text-slate-400">View clear balances and settle dues with a single click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center text-slate-500 dark:text-slate-400">
          <p>&copy; 2024 BillKhata. All rights reserved.</p>
        </div>
      </footer>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "BillKhata",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web, Android, iOS",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "The ultimate app for managing shared living expenses. Split bills, track meals, and manage finances with roommates easily and transparently.",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250"
            }
          })
        }}
      />
    </div>
  );
}
