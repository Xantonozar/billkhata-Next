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
    if (!member) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-card z-10 p-4 border-b border-border">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-card-foreground">
                            {member.name}'s Profile
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="p-6 space-y-6">
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
                </div>
            </div>
        </div>
    );
};

const MemberCard: React.FC<{ member: Member, onHistoryClick: () => void }> = ({ member, onHistoryClick }) => {
    const { user } = useAuth();
    const isManager = member.role === Role.Manager;

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
                {user?.role === Role.Manager && member.id !== user.id ? (
                    <button onClick={onHistoryClick} className="text-primary hover:underline">View Profile</button>
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
                    user.role === Role.Manager ? api.getPendingApprovals(user.khataId) : Promise.resolve([])
                ]);

                setMembers(membersData);
                setRoomDetails(roomData);
                if (user.role === Role.Manager) {
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

                    {/* Room Details Header */}
                    <div className="bg-card rounded-xl shadow-md p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground flex items-center gap-2">
                                    <UsersIcon className="w-8 h-8 text-primary-500" />
                                    {roomDetails?.name || 'My Room'}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Total Members: <span className="font-semibold text-gray-900 dark:text-white">{members.length}</span>
                                </p>
                            </div>

                            {user?.role === Role.Manager && (
                                <div className="w-full md:w-auto bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Room Code</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-widest">
                                                {roomDetails?.khataId || user?.khataId}
                                            </span>
                                            <button
                                                onClick={handleCopyRoomCode}
                                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors text-gray-500 dark:text-gray-400"
                                                title="Copy Code"
                                            >
                                                {copied ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
                                    <div className="w-full sm:w-auto h-px bg-gray-300 dark:bg-gray-600 sm:hidden"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {members.length === 0 ? (
                        <div className="bg-card rounded-xl shadow-md p-8 text-center">
                            <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No members yet</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {user?.role === Role.Manager
                                    ? 'Share your room code to invite members'
                                    : 'Waiting for members to join'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {members.map(member => (
                                <MemberCard key={member.id} member={member} onHistoryClick={() => setViewingMember(member)} />
                            ))}
                        </div>
                    )}

                    {user?.role === Role.Manager && pendingRequests.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">🔔 Pending Join Requests ({pendingRequests.length})</h2>
                            <div className="space-y-4">
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
                            {user?.role === Role.Manager
                                ? 'Deleting this room will permanently remove all data including bills, meals, deposits, and expenses.'
                                : 'Leaving this room will remove you from the member list. You can join again later.'}
                        </p>
                        {user?.role === Role.Manager ? (
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

