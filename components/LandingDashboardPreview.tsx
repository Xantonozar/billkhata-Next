"use client";

import React, { useEffect, useState } from 'react';
import { ChartBarIcon, UsersIcon, MealIcon, BillsIcon } from './Icons';

const AnimatedBarChart = () => {
    const [heights, setHeights] = useState([10, 30, 50, 20, 60, 40, 70]);

    useEffect(() => {
        const interval = setInterval(() => {
            setHeights(prev => prev.map(() => Math.floor(Math.random() * 60) + 20));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-32 flex items-end justify-between gap-2 px-2">
            {heights.map((h, i) => (
                <div
                    key={i}
                    className="w-full bg-primary-500 rounded-t-sm transition-all duration-1000 ease-in-out opacity-80 hover:opacity-100"
                    style={{ height: `${h}%` }}
                ></div>
            ))}
        </div>
    );
};

const StatCard = ({ title, value, icon, delay }: { title: string, value: string, icon: React.ReactNode, delay: string }) => (
    <div className={`bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg animate-fade-in`} style={{ animationDelay: delay }}>
        <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-white dark:bg-slate-600 rounded-md shadow-sm text-primary-500">
                {icon}
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-white ml-1">{value}</p>
    </div>
);

const ActivityItem = ({ text, time, amount }: { text: string, time: string, amount: string }) => (
    <div className="flex justify-between items-center p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md transition-colors">
        <div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{text}</p>
            <p className="text-[10px] text-slate-400">{time}</p>
        </div>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{amount}</span>
    </div>
);

export default function LandingDashboardPreview() {
    return (
        <div className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500">
            {/* Mock Header */}
            <div className="h-12 border-b border-slate-100 dark:border-slate-700 flex items-center px-4 justify-between bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="h-2 w-24 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
            </div>

            {/* Dashboard Content */}
            <div className="p-5 space-y-5">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                    <StatCard title="Total Bills" value="৳12,450" icon={<BillsIcon className="w-4 h-4" />} delay="0.1s" />
                    <StatCard title="Meal Fund" value="+৳2,300" icon={<MealIcon className="w-4 h-4" />} delay="0.2s" />
                </div>

                {/* Chart Section */}
                <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <ChartBarIcon className="w-4 h-4 text-primary-500" /> Monthly Expenses
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">Live</span>
                    </div>
                    <AnimatedBarChart />
                </div>

                {/* Recent Activity */}
                <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 px-1">Recent Activity</h4>
                    <div className="space-y-1">
                        <ActivityItem text="Grocery Shopping" time="2 mins ago" amount="-৳450" />
                        <ActivityItem text="Internet Bill Paid" time="1 hour ago" amount="-৳1,200" />
                        <ActivityItem text="Deposit Received" time="Yesterday" amount="+৳5,000" />
                    </div>
                </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute top-20 right-4 bg-white dark:bg-slate-700 p-2 rounded-lg shadow-lg animate-bounce">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-white">Active</span>
                </div>
            </div>
        </div>
    );
}
