"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import type { User } from '@/types';
import {
    UsersIcon, UserCircleIcon, PhoneIcon, WhatsAppIcon,
    CrownIcon, ClipboardIcon, XIcon, CheckCircleIcon, RefreshIcon, SpinnerIcon
} from '@/components/Icons';
import { api } from '@/services/api';
import { useNotifications } from '@/contexts/NotificationContext';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';
import { MemberSkeleton } from '@/components/skeletons/MemberSkeleton';
import AddMemberModal from '@/components/members/AddMemberModal';
import EditMemberModal from '@/components/members/EditMemberModal';

interface Member extends User {
    phone?: string;
    whatsapp?: string;
    facebook?: string;
    joined?: string;
    room?: string;
}

interface JoinRequest {
    id: string;
    name: string;
    email: string;
    requestedAt: string;
}

// Confirmation Modal Component
const ConfirmModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}> = ({ isOpen, title, message, confirmText, confirmColor = 'bg-red-500 hover:bg-red-600', onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onCancel}>
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-card-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground mb-6">{message}</p>                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 ${confirmColor}`}
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MemberHistoryModal: React.FC<{ member: Member | null, onClose: () => void }> = ({ member, onClose }) => {
    const { user } = useAuth();
    const [mealStats, setMealStats] = useState({ last24h: 0, last3d: 0, last7d: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (member && user?.khataId) {
            fetchMealStats();
        }
    }, [member, user?.khataId]);

    const fetchMealStats = async () => {
        if (!member || !user?.khataId) return;
        setLoading(true);

        try {
            const meals = await api.getMeals(user.khataId);
            const memberMeals = meals.filter((m: any) =>
                (m.userId === member.id || m._id === member.id || m.userId?._id === member.id)
            );

            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
            const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            setMealStats({
                last24h: memberMeals.filter((m: any) => new Date(m.date) >= last24h).reduce((sum: number, m: any) => sum + (m.totalMeals || 0), 0),
                last3d: memberMeals.filter((m: any) => new Date(m.date) >= last3d).reduce((sum: number, m: any) => sum + (m.totalMeals || 0), 0),
                last7d: memberMeals.filter((m: any) => new Date(m.date) >= last7d).reduce((sum: number, m: any) => sum + (m.totalMeals || 0), 0),
                total: memberMeals.reduce((sum: number, m: any) => sum + (m.totalMeals || 0), 0)
            });
        } catch (error) {
            console.error('Error fetching meal stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!member) return null;

    const foodPrefs = (member as any).foodPreferences || { likes: [], dislikes: [], avoidance: [], notes: '' };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-card z-10 p-4 border-b border-border">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-card-foreground">
                            {member.name}'s Profile
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    {/* Member Information */}
                    <div className="p-4 border rounded-lg border-border">
                        <h4 className="font-bold text-lg mb-2">Member Information</h4>
                        <div className="space-y-2 text-sm">
                            <div><strong>Name:</strong> {member.name}</div>
                            <div><strong>Email:</strong> {member.email}</div>
                            <div><strong>Role:</strong> {member.role}</div>
                            <div><strong>Room Status:</strong> {member.roomStatus}</div>
                            <div><strong>Room ID:</strong> {member.khataId || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="p-4 border rounded-lg border-border">
                        <h4 className="font-bold text-lg mb-2">Contact Details</h4>
                        <div className="space-y-2 text-sm">
                            <div><strong>Phone:</strong> {member.phone || 'Not added'}</div>
                            <div><strong>WhatsApp:</strong> {member.whatsapp || 'Not added'}</div>
                            <div>
                                <strong>Facebook:</strong>{' '}
                                {member.facebook ? (
                                    <a href={member.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        View Profile
                                    </a>
                                ) : (
                                    'Not added'
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meal Statistics */}
                    <div className="p-4 border rounded-lg border-border">
                        <h4 className="font-bold text-lg mb-3">Meal Statistics</h4>
                        {loading ? (
                            <div className="text-center text-sm text-muted-foreground">Loading...</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-primary-50 dark:bg-primary-500/10 p-3 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Last 24h</p>
                                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{mealStats.last24h}</p>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Last 3 Days</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mealStats.last3d}</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-500/10 p-3 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Last 7 Days</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{mealStats.last7d}</p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-lg text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{mealStats.total}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Food Preferences */}
                    <div className="p-4 border rounded-lg border-border">
                        <h4 className="font-bold text-lg mb-3">Food Preferences</h4>

                        {/* Likes */}
                        <div className="mb-4">
                            <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">✓ Likes</h5>
                            {foodPrefs.likes && foodPrefs.likes.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {foodPrefs.likes.map((item: string, idx: number) => (
                                        <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md text-xs">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No preferences set</p>
                            )}
                        </div>

                        {/* Dislikes */}
                        <div className="mb-4">
                            <h5 className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">− Dislikes</h5>
                            {foodPrefs.dislikes && foodPrefs.dislikes.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {foodPrefs.dislikes.map((item: string, idx: number) => (
                                        <span key={idx} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md text-xs">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No preferences set</p>
                            )}
                        </div>

                        {/* Avoidance */}
                        <div className="mb-4">
                            <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">✕ Won't Eat (Allergies/Restrictions)</h5>
                            {foodPrefs.avoidance && foodPrefs.avoidance.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {foodPrefs.avoidance.map((item: string, idx: number) => (
                                        <span key={idx} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md text-xs font-medium">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No restrictions set</p>
                            )}
                        </div>

                        {/* Notes */}
                        {foodPrefs.notes && (
                            <div>
                                <h5 className="text-sm font-medium text-card-foreground mb-2">📝 Notes</h5>
                                <p className="text-sm text-card-foreground whitespace-pre-wrap bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                                    {foodPrefs.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MemberCard: React.FC<{ member: Member, onHistoryClick: () => void, onEditClick?: () => void, showEdit?: boolean }> = ({ member, onHistoryClick, onEditClick, showEdit }) => {
    const { user } = useAuth();
    const isManager = member.role === Role.Manager || member.role === Role.MasterManager;

    const handleWhatsApp = () => {
        if (member.whatsapp) {
            const phoneNumber = member.whatsapp.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${phoneNumber}`, '_blank');
        }
    };

    const handleCall = () => {
        if (member.phone) {
            const phoneNumber = member.phone.replace(/[^0-9+]/g, '');
            window.open(`tel:${phoneNumber}`);
        }
    };

    return (
        <div className="bg-card rounded-xl shadow-md p-5">
            <div className="flex items-center gap-4">
                {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                    <UserCircleIcon className="w-12 h-12 text-gray-400 flex-shrink-0" />
                )}
                <div>
                    <h3 className="font-bold text-lg text-card-foreground flex items-center gap-2">
                        {member.name} {isManager && <CrownIcon className="w-5 h-5 text-yellow-500" />}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                </div>
            </div>
            <div className="border-t my-3 border-border"></div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>📞 {member.phone || 'Phone not added'}</p>
                {member.whatsapp ? (
                    <p>📱 WhatsApp: {member.whatsapp}</p>
                ) : (
                    <p className="text-gray-400">📱 WhatsApp not added</p>
                )}
                {member.facebook ? (
                    <p className="truncate">📘 Facebook: <a href={member.facebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a></p>
                ) : (
                    <p className="text-gray-400">📘 Facebook not added</p>
                )}
            </div>
            <div className="border-t my-3 border-border"></div>
            <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <p><strong>Role:</strong> {member.role}</p>
                <p><strong>Status:</strong> {member.roomStatus}</p>
            </div>
            <div className="border-t my-3 border-border"></div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
                {(user?.role === Role.Manager || user?.role === Role.MasterManager) && member.id !== user.id ? (
                    <>
                        <button onClick={onHistoryClick} className="text-primary hover:underline">View Profile</button>
                        {showEdit && onEditClick && (
                            <button
                                onClick={onEditClick}
                                className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        {member.whatsapp && (
                            <button onClick={handleWhatsApp} className="flex-1 px-3 py-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-md flex items-center justify-center gap-2 transition-colors hover:bg-green-200 dark:hover:bg-green-900"><WhatsAppIcon className="w-4 h-4" /> WhatsApp</button>
                        )}
                        {member.phone && member.phone !== 'Not added' && (
                            <button onClick={handleCall} className="flex-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md flex items-center justify-center gap-2 transition-colors hover:bg-blue-200 dark:hover:bg-blue-900"><PhoneIcon className="w-4 h-4" /> Call</button>
                        )}
                        <button onClick={onHistoryClick} className="w-full text-left mt-1 text-primary hover:underline p-1">View Profile →</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default function RoomMembersPage() {
    const { user, setUser } = useAuth();
    const { addToast } = useNotifications();
    const router = useRouter();
    const [viewingMember, setViewingMember] = useState<Member | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [roomDetails, setRoomDetails] = useState<any>(null);
    const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Confirmation modal states
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showEditMemberModal, setShowEditMemberModal] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);

    const fetchMembers = async () => {
        if (!user?.khataId) return;
        try {
            const membersData = await api.getMembersForRoom(user.khataId);
            setMembers(membersData);
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.khataId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch all data in parallel for faster load
                const [membersData, roomData, pendingData] = await Promise.all([
                    api.getMembersForRoom(user.khataId),
                    api.getRoomDetails(user.khataId),
                    user.role === Role.Manager || user.role === Role.MasterManager ? api.getPendingApprovals(user.khataId) : Promise.resolve([])
                ]);

                setMembers(membersData);
                setRoomDetails(roomData);
                if (user.role === Role.Manager || user.role === Role.MasterManager) {
                    setPendingRequests(pendingData);
                }
            } catch (error) {
                console.error('Error fetching room data:', error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load room details' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.khataId, user?.role]);

    const handleCopyRoomCode = () => {
        const code = roomDetails?.khataId || user?.khataId;
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            addToast({ type: 'success', title: 'Copied!', message: 'Room code copied to clipboard.' });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleApproveMember = async (userId: string) => {
        if (!user?.khataId) return;

        // Optimistic UI: Remove from pending immediately
        const approvedRequest = pendingRequests.find(p => p.id === userId);
        setPendingRequests(prev => prev.filter(p => p.id !== userId));
        addToast({ type: 'success', title: 'Success', message: 'Member approved successfully!' });

        try {
            const success = await api.approveMember(user.khataId, userId);
            if (success) {
                // Refresh all data in parallel
                const [pendingData, membersData, details] = await Promise.all([
                    api.getPendingApprovals(user.khataId),
                    api.getMembersForRoom(user.khataId),
                    api.getRoomDetails(user.khataId)
                ]);
                setPendingRequests(pendingData);
                setMembers(membersData);
                if (details) setRoomDetails(details);
            } else {
                // Revert optimistic update
                if (approvedRequest) {
                    setPendingRequests(prev => [...prev, approvedRequest]);
                }
                addToast({ type: 'error', title: 'Error', message: 'Failed to approve member' });
            }
        } catch (error) {
            console.error('Error approving member:', error);
            // Revert optimistic update
            if (approvedRequest) {
                setPendingRequests(prev => [...prev, approvedRequest]);
            }
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve member' });
        }
    };

    const handleLeaveRoom = async () => {
        if (!user?.khataId) return;
        setActionLoading(true);

        try {
            await api.leaveRoom(user.khataId);
            addToast({ type: 'success', title: 'Left Room', message: 'You have left the room successfully.' });

            // Update user context
            const updatedUser = await api.getCurrentUser();
            if (updatedUser) setUser(updatedUser);

            router.push('/join-room');
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error', message: error.message || 'Failed to leave room' });
        } finally {
            setActionLoading(false);
            setShowLeaveModal(false);
        }
    };

    const handleDeleteRoom = async () => {
        if (!user?.khataId) return;
        setActionLoading(true);

        try {
            await api.deleteRoom(user.khataId);
            addToast({ type: 'success', title: 'Room Deleted', message: 'The room and all data have been deleted.' });

            // Update user context
            const updatedUser = await api.getCurrentUser();
            if (updatedUser) setUser(updatedUser);

            router.push('/create-room');
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error', message: error.message || 'Failed to delete room' });
        } finally {
            setActionLoading(false);
            setShowDeleteModal(false);
        }
    };

    const handleEditMember = (member: Member) => {
        setEditingMember(member);
        setShowEditMemberModal(true);
    };

    const handleSaveMember = async (userId: string, data: any) => {
        try {
            await api.updateMemberById(userId, data);
            addToast({ type: 'success', title: 'Success', message: 'Member updated successfully!' });

            // Refresh members list
            await fetchMembers();
            setShowEditMemberModal(false);
            setEditingMember(null);
        } catch (error: any) {
            throw error; // Re-throw to let modal handle it
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <MemberSkeleton />
            </AppLayout>
        );
    }

    return (
        <>
            <AppLayout>
                <div className="space-y-6 animate-fade-in">

                    {/* Room Details Header - Refined UI/UX */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 relative overflow-hidden group mb-8">
                        {/* Decorative Background Element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary-500/10 transition-colors" />

                        <div className="relative z-10 space-y-6">
                            {/* Row 1: Room Name & Member Count */}
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div className="space-y-1">
                                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                        {roomDetails?.name || 'My Room'}
                                    </h1>
                                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-medium text-sm sm:text-base">
                                        <UsersIcon className="w-4 h-4" />
                                        <span>Total Members:</span>
                                        <span className="text-slate-900 dark:text-slate-200 font-bold">{members.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Room Code & Add Button (Side by Side) */}
                            {(user?.role === Role.Manager || user?.role === Role.MasterManager) && (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                                    {/* Room Code Area */}
                                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 flex items-center justify-between group/code transition-all hover:border-primary-200 dark:hover:border-primary-900/40">
                                        <div className="flex flex-col pl-1">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black mb-0.5">Room Code</span>
                                            <span className="font-mono text-xl sm:text-2xl font-black text-primary-600 dark:text-primary-400 tracking-[0.2em] leading-none">
                                                {roomDetails?.khataId || user?.khataId}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleCopyRoomCode}
                                            className="ml-4 p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 transition-all text-slate-400 hover:text-primary-600"
                                            title="Copy Room Code"
                                        >
                                            {copied ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Add Member Button */}
                                    {user?.role === Role.MasterManager && (
                                        <button
                                            onClick={() => setShowAddMemberModal(true)}
                                            className="px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary-500/20 border-b-4 border-primary-700 active:border-b-0 active:translate-y-1 group/btn"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <span>Add Member</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {members.length === 0 ? (
                        <div className="bg-card rounded-xl shadow-md p-8 text-center">
                            <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No members yet</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {user?.role === Role.Manager || user?.role === Role.MasterManager
                                    ? 'Share your room code to invite members'
                                    : 'Waiting for members to join'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {members.map(member => (
                                <MemberCard
                                    key={member.id}
                                    member={member}
                                    onHistoryClick={() => setViewingMember(member)}
                                    onEditClick={() => handleEditMember(member)}
                                    showEdit={user?.role === Role.MasterManager && member.id !== user.id}
                                />
                            ))}
                        </div>
                    )}

                    {(user?.role === Role.Manager || user?.role === Role.MasterManager) && pendingRequests.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-2xl font-black mb-6 text-slate-800 dark:text-white flex items-center gap-3">
                                <span className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">🔔</span>
                                Pending Join Requests ({pendingRequests.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingRequests.map(req => (
                                    <div key={req.id} className="bg-card rounded-xl shadow-md p-5">
                                        <h4 className="font-bold text-lg text-card-foreground">{req.name}</h4>
                                        <p className="text-sm text-muted-foreground">{req.email}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Requested: {new Date(req.requestedAt).toLocaleString()}</p>
                                        <div className="flex gap-2 justify-end mt-3">
                                            <button
                                                onClick={() => handleApproveMember(req.id)}
                                                className="px-4 py-1.5 text-sm font-semibold bg-green-100 text-green-700 rounded-md hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900"
                                            >
                                                Approve & Add
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Leave Room / Delete Room Section */}
                    <div className="bg-card rounded-xl shadow-md p-6 border-2 border-red-200 dark:border-red-900/50">
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">⚠️ Danger Zone</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {(user?.role === Role.Manager || user?.role === Role.MasterManager)
                                ? 'Deleting this room will permanently remove all data including bills, meals, deposits, and expenses.'
                                : 'Leaving this room will remove you from the member list. You can join again later.'}
                        </p>
                        {(user?.role === Role.Manager || user?.role === Role.MasterManager) ? (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                            >
                                🗑️ Delete Room
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowLeaveModal(true)}
                                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                            >
                                🚪 Leave Room
                            </button>
                        )}
                    </div>
                </div>
            </AppLayout>

            <MemberHistoryModal member={viewingMember} onClose={() => setViewingMember(null)} />

            <AddMemberModal
                isOpen={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                khataId={user?.khataId || ''}
                onMemberAdded={fetchMembers}
            />

            <EditMemberModal
                isOpen={showEditMemberModal}
                member={editingMember}
                onClose={() => {
                    setShowEditMemberModal(false);
                    setEditingMember(null);
                }}
                onSave={handleSaveMember}
                currentUserId={user?.id || ''}
            />

            {/* Confirmation Modals */}
            <ConfirmModal
                isOpen={showLeaveModal}
                title="Leave Room?"
                message="Are you sure you want to leave this room? You can request to join again later."
                confirmText="Leave Room"
                onConfirm={handleLeaveRoom}
                onCancel={() => setShowLeaveModal(false)}
                loading={actionLoading}
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Room?"
                message="This will permanently delete the room and ALL data (bills, meals, deposits, expenses). All members will be removed. This action cannot be undone!"
                confirmText="Delete Forever"
                onConfirm={handleDeleteRoom}
                onCancel={() => setShowDeleteModal(false)}
                loading={actionLoading}
            />


        </>
    );
}

