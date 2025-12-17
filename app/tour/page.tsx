"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    SparklesIcon,
    HomeIcon,
    UserPlusIcon,
    ChartBarIcon,
    MealIcon,
    ShoppingCartIcon,
    MenuBookIcon,
    BriefcaseIcon,
    PhoneIcon
} from '@/components/Icons';

// Mock Component for "Create Room" Screenshot
const MockCreateRoom = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-sm mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Create New Khata</h3>
        <div className="space-y-3">
            <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg w-full animate-pulse"></div>
            <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg w-full animate-pulse delay-75"></div>
            <div className="h-10 bg-primary-500 rounded-lg w-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                Create Room
            </div>
        </div>
    </div>
);

// Mock Component for "Room Code" Screenshot
const MockRoomCode = () => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-sm mx-auto flex flex-col items-center text-center transform -rotate-1 hover:rotate-0 transition-transform duration-500">
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-3">
            <UserPlusIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-white">Invite Members</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Share this code with your roommates</p>
        <div className="bg-slate-100 dark:bg-slate-700 px-6 py-3 rounded-lg border-dashed border-2 border-slate-300 dark:border-slate-600">
            <span className="text-3xl font-mono font-bold tracking-widest text-slate-900 dark:text-white">8294</span>
        </div>
    </div>
);

// Mock Component for "Expense" Screenshot
const MockExpense = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-sm mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500">
        <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-slate-700 dark:text-slate-300">New Expense</span>
            <span className="text-xs text-slate-400">Today</span>
        </div>
        <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">🛒 </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Groceries</p>
                        <p className="text-xs text-slate-500">Shared by 4</p>
                    </div>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">৳2,500</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">⚡</div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">WiFi Bill</p>
                        <p className="text-xs text-slate-500">Shared by 4</p>
                    </div>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">৳1,000</span>
            </div>
        </div>
    </div>
);

// Mock Component for "Meal Management" Screenshot
// Mock Component for "Meal Management" Screenshot
const MockMealManagement = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-sm mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500">
        {/* Meal Rate Header */}
        <div className="flex justify-between items-center mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/30">
            <div>
                <p className="text-[10px] text-green-600 dark:text-green-300 font-bold uppercase tracking-wider">Meal Rate</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">৳52.50<span className="text-xs font-medium text-green-500 ml-1">/meal</span></p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Total This Month</p>
                <p className="font-bold text-slate-800 dark:text-white">142 Meals</p>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
            {/* Today's Menu */}
            <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-2">
                    <MenuBookIcon className="w-3 h-3 text-orange-500" /> Today's Menu
                </h4>
                <div className="space-y-1.5 pl-1">
                    <p className="text-xs flex gap-2"><span className="text-slate-400 w-3">☀️</span> <span className="text-slate-700 dark:text-slate-300">Egg & Toast</span></p>
                    <p className="text-xs flex gap-2"><span className="text-slate-400 w-3">🕛</span> <span className="text-slate-700 dark:text-slate-300">Chicken Curry</span></p>
                    <p className="text-xs flex gap-2"><span className="text-slate-400 w-3">🌙</span> <span className="text-slate-700 dark:text-slate-300">Fish Fry</span></p>
                </div>
            </div>

            {/* Shopping & Meal Count */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1"><ShoppingCartIcon className="w-3 h-3 text-blue-500" /> Shopper</h4>
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded">John (You)</span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1"><MealIcon className="w-3 h-3 text-purple-500" /> Who's Eating?</h4>
                    <div className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded">
                        <span className="text-slate-600 dark:text-slate-400">John</span>
                        <div className="flex gap-1">
                            <span className="px-1.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">B</span>
                            <span className="px-1.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">L</span>
                            <span className="px-1.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">D</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs p-1.5 rounded mt-1">
                        <span className="text-slate-600 dark:text-slate-400">Sarah</span>
                        <div className="flex gap-1">
                            <span className="px-1.5 bg-slate-100 text-slate-400 rounded text-[10px] font-bold">-</span>
                            <span className="px-1.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">L</span>
                            <span className="px-1.5 bg-slate-100 text-slate-400 rounded text-[10px] font-bold">-</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const MockStaff = () => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-sm mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center gap-3 mb-4">
            <BriefcaseIcon className="w-6 h-6 text-primary-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Household Services</h3>
        </div>
        <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-lg">🧹</div>
                    <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">Fatima Begum</p>
                        <p className="text-xs text-slate-500">Maid</p>
                    </div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-2 rounded-full">
                    <PhoneIcon className="w-4 h-4" />
                </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-center justify-between border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-lg">🔧</div>
                    <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">Nosin Miah</p>
                        <p className="text-xs text-slate-500">Plumber</p>
                    </div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-2 rounded-full">
                    <PhoneIcon className="w-4 h-4" />
                </div>
            </div>
        </div>
    </div>
);

// Mock Component for "Reports" Screenshot
const MockReports = () => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 w-full max-w-sm mx-auto transform -rotate-1 hover:rotate-0 transition-transform duration-500">
        <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-slate-800 dark:text-white">Monthly Breakdown</h3>
        </div>
        <div className="flex items-end gap-2 h-32 justify-between px-2">
            <div className="w-8 bg-blue-300 dark:bg-blue-700 rounded-t-sm h-[60%]"></div>
            <div className="w-8 bg-green-300 dark:bg-green-700 rounded-t-sm h-[80%]"></div>
            <div className="w-8 bg-yellow-300 dark:bg-yellow-700 rounded-t-sm h-[40%]"></div>
            <div className="w-8 bg-red-300 dark:bg-red-700 rounded-t-sm h-[100%] shadow-[0_0_15px_rgba(248,113,113,0.5)]"></div>
            <div className="w-8 bg-purple-300 dark:bg-purple-700 rounded-t-sm h-[50%]"></div>
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-500 font-mono">
            <span>Rent</span><span>Food</span><span>Util</span><span>Misc</span><span>Oth</span>
        </div>
    </div>
);

const TourStep: React.FC<{
    stepNumber: number;
    title: string;
    description: string;
    features?: string[];
    mock: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ stepNumber, title, description, features, mock, isActive, onClick }) => (
    <div
        onClick={onClick}
        className={`cursor-pointer transition-all duration-300 flex flex-col md:flex-row gap-6 md:gap-12 items-center p-6 rounded-2xl border-2 ${isActive ? 'bg-white dark:bg-slate-800 border-primary-500 shadow-xl scale-[1.02]' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-60 hover:opacity-100'}`}
    >
        <div className="flex-1 text-center md:text-left order-2 md:order-1">
            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mb-3 ${isActive ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                {stepNumber}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-4">{description}</p>
            {isActive && features && (
                <ul className="text-left space-y-2 inline-block">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <span className="text-primary-500 font-bold">✓</span> {feature}
                        </li>
                    ))}
                </ul>
            )}
        </div>
        <div className="flex-1 w-full max-w-sm order-1 md:order-2">
            {mock}
        </div>
    </div>
);

export default function TourPage() {
    const [activeStep, setActiveStep] = useState(1);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
            {/* Header */}
            <header className="py-6 px-6 md:px-12 flex justify-between items-center bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-50">
                <Link href="/" className="flex items-center space-x-2 group">
                    <SparklesIcon className="w-8 h-8 text-primary-500 group-hover:rotate-12 transition-transform" />
                    <span className="font-bold text-2xl tracking-tight">BillKhata</span>
                </Link>
                <Link href="/signup" className="px-5 py-2.5 text-sm font-bold rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-all hover:shadow-lg hover:px-6">
                    Get Started Free
                </Link>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-20">
                <div className="text-center mb-16 space-y-4 animate-fade-in">
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        See how it <span className="text-primary-500">works</span>.
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        A quick guided tour of BillKhata. From setting up your room to generating monthly reports, managing shared finances has never been this simple.
                    </p>
                </div>

                <div className="space-y-4 relative">
                    {/* Connecting Line (Visual only) */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 rounded-full hidden md:block -z-10"></div>

                    <TourStep
                        stepNumber={1}
                        isActive={activeStep === 1}
                        onClick={() => setActiveStep(1)}
                        title="Create or Join a Room"
                        description="Start by creating a digital space for your shared home. Define how you want to manage costs."
                        features={[
                            "Set your preferred currency (Tk, USD, etc.)",
                            "Define billing cycle start dates",
                            "Customize expense categories"
                        ]}
                        mock={<MockCreateRoom />}
                    />

                    <TourStep
                        stepNumber={2}
                        isActive={activeStep === 2}
                        onClick={() => setActiveStep(2)}
                        title="Invite Your Roommates"
                        description="Onboard your roommates in seconds. No complex sign-ups or email verifications needed to join."
                        features={[
                            "Generate a unique 6-digit room code",
                            "One-click copy & share",
                            "Instant access for all members"
                        ]}
                        mock={<MockRoomCode />}
                    />

                    <TourStep
                        stepNumber={3}
                        isActive={activeStep === 3}
                        onClick={() => setActiveStep(3)}
                        title="Meal Management & Shopping"
                        description="Manage your kitchen efficiently. Assign shopping duties and track daily meal costs automatically."
                        features={[
                            "Daily Menu Display (Breakfast/Lunch/Dinner)",
                            "Individual Meal Counts (Who is eating today)",
                            "Shopping Day Assignment",
                            "Live Meal Rate Calculation"
                        ]}
                        mock={<MockMealManagement />}
                    />

                    <TourStep
                        stepNumber={4}
                        isActive={activeStep === 4}
                        onClick={() => setActiveStep(4)}
                        title="Split Bills & Expenses"
                        description="Log shared usage like Rent, WiFi, and Electricity. Split costs equally or assign specific amounts."
                        features={[
                            "Support for Rent, WiFi, Maid, and Utilities",
                            "Custom split options (who pays what)",
                            "Upload receipts/bills"
                        ]}
                        mock={<MockExpense />}
                    />

                    <TourStep
                        stepNumber={5}
                        isActive={activeStep === 5}
                        onClick={() => setActiveStep(5)}
                        title="Manage Household Staff"
                        description="Keep essential contacts like your Maid, Cook, Electrician, or Plumber in one place. Anyone in the room can access them instantly."
                        features={[
                            "Shared Contact List",
                            "One-tap Calling",
                            "Categories for Maid, Cook, etc."
                        ]}
                        mock={<MockStaff />}
                    />

                    <TourStep
                        stepNumber={6}
                        isActive={activeStep === 6}
                        onClick={() => setActiveStep(6)}
                        title="Transparent Reports"
                        description="End the month with zero confusion. Get automated financial breakdowns for every member."
                        features={[
                            "Automated per-member calculation",
                            "Visual charts for expense distribution",
                            "One-click 'Settle Up' for dues"
                        ]}
                        mock={<MockReports />}
                    />
                </div>

                <div className="mt-16 sm:mt-24 text-center space-y-8 bg-gradient-to-br from-primary-500/10 to-purple-500/10 p-6 sm:p-12 rounded-3xl border border-primary-500/20">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Ready to simplify your shared living?</h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/signup" className="px-8 py-4 text-lg font-bold rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                            Create Your Account
                        </Link>
                        <Link href="/" className="px-8 py-4 text-lg font-bold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-all hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2">
                            <HomeIcon className="w-5 h-5" /> Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
