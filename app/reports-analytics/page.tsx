"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import { ExportIcon, CurrencyRupeeIcon, MealIcon, BanknotesIcon, TrendingUpIcon } from '@/components/Icons';
import { api } from '@/services/api';
import { useNotifications } from '@/contexts/NotificationContext';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';

// --- Components ---

const SummaryCard: React.FC<{ icon: React.ReactNode; title: string; value: string; subtitle: string; colorClass: string }> = ({ icon, title, value, subtitle, colorClass }) => (
    <div className="bg-card p-6 rounded-2xl shadow-lg border border-border flex items-start gap-5 hover:transform hover:scale-[1.02] transition-all duration-300">
        <div className={`flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl ${colorClass} shadow-inner`}>
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
            <p className="text-2xl font-bold text-card-foreground mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>
        </div>
    </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode; footer?: string }> = ({ title, children, footer }) => (
    <div className="bg-card p-6 rounded-2xl shadow-lg border border-border h-full flex flex-col">
        <h3 className="font-bold text-lg text-card-foreground mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
            {title}
        </h3>
        <div className="flex-grow flex items-center justify-center w-full">
            {children}
        </div>
        {footer && <p className="text-xs text-center text-muted-foreground mt-4 pt-4 border-t border-border">{footer}</p>}
    </div>
);

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        setTimeout(() => setAnimated(true), 100);
    }, []);

    if (!data || data.length === 0) {
        return <div className="text-slate-400 text-sm">No data available</div>;
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercent = 0;

    return (
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="relative w-48 h-48 group">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                    {data.map((item, i) => {
                        const percent = (item.value / total) * 100;
                        const dashArray = `${percent} ${100 - percent}`;
                        const offset = 100 - cumulativePercent;
                        cumulativePercent += percent;

                        return (
                            <circle
                                key={i}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth="12"
                                strokeDasharray={animated ? dashArray : `0 100`}
                                strokeDashoffset={offset}
                                className="transition-all duration-1000 ease-out hover:stroke-[14] cursor-pointer"
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <title>{item.label}: ৳{item.value}</title>
                            </circle>
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-muted-foreground font-medium">Total</span>                    <span className="text-xl font-bold text-card-foreground">৳{total.toFixed(0)}</span>
                </div>
            </div>
            <div className="space-y-3 text-sm w-full max-w-[200px]">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                            <span className="text-muted-foreground font-medium">{item.label}</span>
                        </div>
                        <span className="text-card-foreground font-bold">{((item.value / total) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        setTimeout(() => setAnimated(true), 100);
    }, []);

    if (!data || data.length === 0) return <div className="text-slate-400 text-sm">No data available</div>;

    const maxValue = Math.max(...data.map(d => d.value), 100);

    return (
        <div className="w-full h-64 flex items-end justify-between gap-2 pt-6 pb-2">
            {data.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="relative w-full flex justify-center items-end h-full">
                        <div
                            className="w-full max-w-[40px] rounded-t-lg opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out shadow-lg hover:shadow-xl"
                            style={{
                                backgroundColor: item.color,
                                height: animated ? `${(item.value / maxValue) * 100}%` : '0%',
                                transitionDelay: `${i * 100}ms`
                            }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                ৳{item.value.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center" title={item.label}>
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

const LineChart: React.FC<{ data: { label: string; values: { name: string; value: number; color: string }[] }[] }> = ({ data }) => {
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        setTimeout(() => setAnimated(true), 300);
    }, []);

    if (!data || data.length === 0) return <div className="text-slate-400 text-sm">No data available</div>;

    const allValues = data.flatMap(d => d.values.map(v => v.value));
    const maxValue = Math.max(...allValues, 100);

    const width = 100;
    const height = 60;
    const chartHeight = 50;
    const chartBottom = height - 5;

    const getY = (value: number) => chartBottom - ((value / maxValue) * chartHeight);
    const getX = (index: number, total: number) => (index / (total - 1)) * width;

    const createPath = (values: number[]) => {
        if (values.length === 0) return '';
        let path = `M ${getX(0, values.length)} ${getY(values[0])}`;
        for (let i = 1; i < values.length; i++) {
            const prevX = getX(i - 1, values.length);
            const currX = getX(i, values.length);
            const prevY = getY(values[i - 1]);
            const currY = getY(values[i]);
            const cpX = (prevX + currX) / 2;
            path += ` Q ${cpX} ${prevY}, ${cpX} ${(prevY + currY) / 2} Q ${cpX} ${currY}, ${currX} ${currY}`;
        }
        return path;
    };

    const series = data[0]?.values || [];

    return (
        <div className="w-full space-y-6">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                    const y = chartBottom - (ratio * chartHeight);
                    return <line key={ratio} x1="0" y1={y} x2={width} y2={y} stroke="currentColor" className="text-border" strokeWidth="0.2" />;
                })}

                {/* Paths */}
                {series.map((serie, seriesIdx) => {
                    const values = data.map(d => d.values[seriesIdx]?.value || 0);
                    const path = createPath(values);
                    return (
                        <g key={seriesIdx}>
                            <path
                                d={path}
                                fill="none"
                                stroke={serie.color}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                                style={{
                                    strokeDasharray: 300,
                                    strokeDashoffset: animated ? 0 : 300
                                }}
                            />
                            {/* Dots */}
                            {values.map((val, i) => (
                                <circle
                                    key={i}
                                    cx={getX(i, values.length)}
                                    cy={getY(val)}
                                    r="1.5"
                                    fill={serie.color}
                                    className={`transition-opacity duration-500 delay-[${1000 + i * 100}ms] ${animated ? 'opacity-100' : 'opacity-0'} hover:r-2 cursor-pointer`}
                                >
                                    <title>{serie.name}: ৳{val}</title>
                                </circle>
                            ))}
                        </g>
                    );
                })}

                {/* X Axis Labels */}
                {data.map((d, i) => (
                    <text key={i} x={getX(i, data.length)} y={height} textAnchor="middle" className="text-[3px] fill-slate-400 font-medium">{d.label}</text>
                ))}
            </svg>

            <div className="flex flex-wrap justify-center gap-6 text-xs">
                {series.map((serie, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full border border-border">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: serie.color }}></div>
                        <span className="text-muted-foreground font-medium">{serie.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function ReportsAnalyticsPage() {
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [activeDateRange, setActiveDateRange] = useState('This Month');
    const [loading, setLoading] = useState(true);
    const [sortCategoryBy, setSortCategoryBy] = useState<'amount' | 'name'>('amount');
    const [analyticsData, setAnalyticsData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.khataId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const data = await api.getAnalytics(user.khataId, activeDateRange);
                setAnalyticsData(data);
            } catch (error) {
                console.error('Error fetching report data:', error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load report data' });
            } finally {
                setLoading(false);
            }

            // Prefetch the other date range in background (for instant switching)
            const otherRange = activeDateRange === 'This Month' ? 'Last 6 Months' : 'This Month';
            api.getAnalytics(user.khataId, otherRange).catch(() => {
                // Silently ignore prefetch errors
            });
        };

        fetchData();
    }, [user?.khataId, activeDateRange, addToast]);

    const reportData = useMemo(() => {
        if (!analyticsData) return {
            totalShoppingExpenses: 0,
            totalBillAmount: 0,
            avgMealCost: 0,
            totalDeposits: 0,
            fundHealth: 0,
            billCategoryData: [],
            trendData: [],
            activeMembers: 0,
            totalBills: 0
        };

        let categoryData = [...(analyticsData.billCategoryData || [])];

        // Sort Categories
        if (sortCategoryBy === 'amount') {
            categoryData.sort((a: any, b: any) => b.value - a.value);
        } else {
            categoryData.sort((a: any, b: any) => a.label.localeCompare(b.label));
        }

        return {
            ...analyticsData,
            billCategoryData: categoryData,
            activeMembers: analyticsData.stats?.activeMembers || 0,
            totalBills: analyticsData.stats?.totalBills || 0
        };
    }, [analyticsData, sortCategoryBy]);

    // Access check removed to allow all members to view reports


    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <>
            <AppLayout>
                <div className="space-y-8 animate-fade-in pb-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl shadow-lg border border-indigo-200 dark:border-indigo-700/50">
                                <span className="text-2xl sm:text-3xl">📈</span>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Reports & Analytics</h1>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Deep dive into your financial data</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center flex-wrap gap-2 sm:gap-3">
                            <div className="bg-card p-1 rounded-lg border border-border flex shadow-sm w-full sm:w-auto">
                                {['This Month', 'Last 6 Months'].map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setActiveDateRange(range)}
                                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all ${activeDateRange === range
                                            ? 'bg-primary-500 text-white shadow-md'
                                            : 'text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-card border border-border rounded-lg shadow-sm hover:bg-muted transition-colors text-muted-foreground w-full sm:w-auto">
                                <ExportIcon className="w-4 h-4" />Export
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <SummaryCard
                            icon={<CurrencyRupeeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />}
                            title="Shopping Exp"
                            value={`৳${reportData.totalShoppingExpenses.toLocaleString()}`}
                            subtitle={activeDateRange}
                            colorClass="bg-red-100 dark:bg-red-900/20"
                        />
                        <SummaryCard
                            icon={<MealIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />}
                            title="Total Bills"
                            value={`৳${reportData.totalBillAmount.toLocaleString()}`}
                            subtitle="Rent, Wifi, etc."
                            colorClass="bg-purple-100 dark:bg-purple-900/20"
                        />
                        <SummaryCard
                            icon={<BanknotesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />}
                            title="Total Deposits"
                            value={`৳${reportData.totalDeposits.toLocaleString()}`}
                            subtitle="Collected"
                            colorClass="bg-green-100 dark:bg-green-900/20"
                        />
                        <SummaryCard
                            icon={<TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />}
                            title="Fund Health"
                            value={`৳${reportData.fundHealth.toLocaleString()}`}
                            subtitle={reportData.fundHealth >= 0 ? 'Surplus' : 'Deficit'}
                            colorClass="bg-blue-100 dark:bg-blue-900/20"
                        />
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartContainer title="Expense Distribution" footer="Breakdown by category">
                            <div className="w-full flex flex-col gap-4">
                                <div className="flex justify-end px-4">
                                    <select
                                        value={sortCategoryBy}
                                        onChange={(e) => setSortCategoryBy(e.target.value as any)}
                                        className="text-xs border border-border rounded-md px-2 py-1 bg-muted text-muted-foreground focus:outline-none"
                                    >
                                        <option value="amount">Sort by Amount</option>
                                        <option value="name">Sort by Name</option>
                                    </select>
                                </div>
                                <DonutChart data={reportData.billCategoryData} />
                            </div>
                        </ChartContainer>
                        <ChartContainer title="Financial Trend (6 Months)" footer="Income vs Expenses">
                            <LineChart data={reportData.trendData} />
                        </ChartContainer>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid grid-cols-1 gap-6">
                        <ChartContainer title="Category Comparison" footer="Bar chart visualization">
                            <BarChart data={reportData.billCategoryData} />
                        </ChartContainer>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="bg-card p-4 sm:p-6 rounded-2xl shadow-lg border border-border flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Bills</p>
                                <p className="text-xl sm:text-2xl font-bold text-card-foreground mt-1">{reportData.totalBills}</p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center text-lg sm:text-xl">📄</div>
                        </div>
                        <div className="bg-card p-4 sm:p-6 rounded-2xl shadow-lg border border-border flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Meals Served</p>
                                <p className="text-xl sm:text-2xl font-bold text-card-foreground mt-1">{reportData.totalMealsCount || 0}</p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center text-lg sm:text-xl">🍛</div>
                        </div>
                        <div className="bg-card p-4 sm:p-6 rounded-2xl shadow-lg border border-border flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Active Members</p>
                                <p className="text-xl sm:text-2xl font-bold text-card-foreground mt-1">{reportData.activeMembers}</p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center text-lg sm:text-xl">👥</div>
                        </div>
                    </div>
                </div>
            </AppLayout>

        </>
    );
}
