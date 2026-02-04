"use client";

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import ThemeToggle from './ThemeToggle';
import {
    UserCircleIcon, LogoutIcon, DashboardIcon, BillsIcon, MenuIcon, XIcon,
    MealIcon, ShoppingCartIcon, UsersIcon, ChartBarIcon, CogIcon,
    SparklesIcon, ChevronDownIcon, HomeIcon, ElectricityIcon, WaterIcon, GasIcon, WifiIcon, MaidIcon, OtherIcon, ListBulletIcon, CreditCardIcon, ClipboardCheckIcon, ArchiveBoxIcon, BellIcon, CalendarIcon,
    MenuBookIcon, BriefcaseIcon, BanknotesIcon
} from './Icons';
import { Role } from '@/types';
import NotificationsPanel from './NotificationsPanel';
import { usePendingCount } from '@/hooks/usePendingCount';
import PusherProvider from './PusherProvider';

interface NavLinkProps {
    href: string;
    icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
    children: React.ReactNode;
    isSublink?: boolean;
    badgeCount?: number;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, children, isSublink = false, badgeCount }) => {
    const router = useRouter();
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <button
            onClick={() => router.push(href)}
            className={`w-full flex items-center text-left ${isSublink ? 'pl-12 pr-3 py-2' : 'px-3 py-2.5'} rounded-md text-sm font-medium transition-all group duration-200 active:scale-[0.98] ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
        >
            {React.cloneElement(icon, { className: `flex-shrink-0 w-6 h-6 mr-3 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}` })}
            <span className="flex-grow font-semibold">{children}</span>
            {badgeCount && badgeCount > 0 && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {badgeCount}
                </span>
            )}
        </button>
    );
};

const BillsNavGroup: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true); // Start open by default
    const pathname = usePathname();
    const router = useRouter();
    const isBillsActive = pathname?.startsWith('/bills') || false;

    return (
        <div>
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                }}
                className={`w-full flex items-center text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all group duration-200 active:scale-[0.98] ${isBillsActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
            >
                <BillsIcon className={`flex-shrink-0 w-6 h-6 mr-3 transition-colors ${isBillsActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                <span className="flex-grow font-semibold">Bills</span>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="mt-1 space-y-1">
                    <NavLink href="/bills" icon={<DashboardIcon />} isSublink>Overview</NavLink>
                    <NavLink href="/bills-all" icon={<ListBulletIcon />} isSublink>All Bills</NavLink>
                    <NavLink href="/bills-rent" icon={<HomeIcon />} isSublink>Rent</NavLink>
                    <NavLink href="/bills-electricity" icon={<ElectricityIcon />} isSublink>Electricity</NavLink>
                    <NavLink href="/bills-water" icon={<WaterIcon />} isSublink>Water</NavLink>
                    <NavLink href="/bills-gas" icon={<GasIcon />} isSublink>Gas</NavLink>
                    <NavLink href="/bills-wifi" icon={<WifiIcon />} isSublink>WiFi</NavLink>
                    <NavLink href="/bills-maid" icon={<MaidIcon />} isSublink>Maid</NavLink>
                    <NavLink href="/bills-others" icon={<OtherIcon />} isSublink>Others</NavLink>
                </div>
            </div>
        </div>
    )
}

const SidebarContent: React.FC<{ pendingCount: number }> = ({ pendingCount }) => {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-r border-border">
            <div className="h-16 flex items-center px-4 border-b border-border">
                <SparklesIcon className="w-8 h-8 text-primary" />
                <span className="ml-2 font-bold text-2xl text-foreground font-sans">BillKhata</span>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                <NavLink href="/dashboard" icon={<DashboardIcon />}>Dashboard</NavLink>
                {(user?.role === Role.Manager || user?.role === Role.MasterManager) && (
                    <NavLink href="/pending-approvals" icon={<ClipboardCheckIcon />} badgeCount={pendingCount}>Pending Approvals</NavLink>
                )}
                <BillsNavGroup />
                {user?.role === Role.MasterManager && (
                    <NavLink href="/bills/manage" icon={<BanknotesIcon />}>Manage Bills</NavLink>
                )}
                <NavLink href="/meals" icon={<MealIcon />}>Meal Management</NavLink>
                <NavLink href="/shopping" icon={<ShoppingCartIcon />}>Fund Management</NavLink>
                <NavLink href="/duty" icon={<ClipboardCheckIcon />}>Duty</NavLink>
                <NavLink href="/staff" icon={<BriefcaseIcon />}>Services</NavLink>
                <NavLink href="/calendar" icon={<CalendarIcon />}>Calendar</NavLink>
                <NavLink href="/menu" icon={<MenuBookIcon />}>Menu</NavLink>
                <NavLink href="/members" icon={<UsersIcon />}>Room Members</NavLink>
                <NavLink href="/history" icon={<ArchiveBoxIcon />}>History</NavLink>
                {(user?.role === Role.Manager || user?.role === Role.MasterManager) && (
                    <NavLink href="/payment-dashboard" icon={<CreditCardIcon />}>Payment Dashboard</NavLink>
                )}
                <NavLink href="/reports-analytics" icon={<ChartBarIcon />}>Reports & Analytics</NavLink>
                <NavLink href="/profile" icon={<UserCircleIcon />}>Profile</NavLink>
                <NavLink href="/settings" icon={<CogIcon />}>Settings</NavLink>
            </nav>
            {user && (
                <div className="px-4 py-3 border-t border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 transition-transform duration-200 hover:scale-105">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-border" />
                            ) : (
                                <UserCircleIcon className="w-10 h-10 text-muted-foreground" />
                            )}
                            <div className="flex-grow">
                                <p className="font-semibold text-sm text-foreground">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-all active:scale-95 duration-200"
                            aria-label="Logout"
                        >
                            <LogoutIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-3">
                        <ThemeToggle />
                    </div>
                </div>
            )}
        </div>
    );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { unreadCount } = useNotifications();
    const { count: pendingCount, refetch: refetchPendingCount } = usePendingCount(user?.khataId, user?.role === Role.Manager || user?.role === Role.MasterManager);

    return (
        <PusherProvider onPendingCountUpdate={refetchPendingCount}>
            <div className="h-screen flex overflow-hidden bg-background">
                {/* Mobile Sidebar */}
                {sidebarOpen && (
                    <div className="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true">
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
                        <div className="relative flex-1 flex flex-col max-w-xs w-full animate-slide-in-right bg-card border-r border-border">
                            <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <button
                                    type="button"
                                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <span className="sr-only">Close sidebar</span>
                                    <XIcon className="h-6 w-6 text-white" />
                                </button>
                            </div>
                            <SidebarContent pendingCount={pendingCount} />
                        </div>
                        <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
                    </div>
                )}

                {/* Desktop Sidebar */}
                <div className="hidden md:flex md:flex-shrink-0">
                    <div className="flex flex-col w-64 bg-card border-r border-border">
                        <div className="flex flex-col h-0 flex-1">
                            <SidebarContent pendingCount={pendingCount} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                    <div className="relative z-30 flex-shrink-0 flex h-16 bg-background/80 backdrop-blur-md shadow-sm border-b border-border/40">
                        <button
                            type="button"
                            className="px-4 border-r border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary md:hidden"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="sr-only">Open sidebar</span>
                            <MenuIcon className="h-6 w-6" />
                        </button>
                        <div className="flex-1 px-4 flex justify-between items-center">
                            <div className="flex items-center md:hidden">
                                <SparklesIcon className="w-8 h-8 text-primary" />
                                <span className="ml-2 font-bold text-xl text-foreground font-sans">BillKhata</span>
                            </div>
                            <div className="hidden md:block"></div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setNotificationsOpen(true)} className="relative p-2 rounded-full text-muted-foreground hover:bg-muted transition-all active:scale-95">
                                    <span className="sr-only">View notifications</span>
                                    <BellIcon className="h-6 w-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"></span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <main className="flex-1 relative overflow-y-auto focus:outline-none bg-background">
                        <div className="py-6">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
                <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
            </div>
        </PusherProvider>
    );
};

export default AppLayout;
