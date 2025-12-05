"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';
import type { User } from '@/types';
import {
    UsersIcon, UserCircleIcon, PhoneIcon, WhatsAppIcon,
    CrownIcon, ClipboardIcon, XIcon, CheckCircleIcon
} from '@/components/Icons';
import { api } from '@/services/api';
import { useNotifications } from '@/contexts/NotificationContext';
import AppLayout from '@/components/AppLayout';
import ToastContainer from '@/components/ToastContainer';

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

const MemberHistoryModal: React.FC<{ member: Member | null, onClose: () => void }> = ({ member, onClose }) => {
    if (!member) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-4 border-b dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {member.name}'s Profile
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    <div className="p-4 border rounded-lg dark:border-gray-700">
                        <h4 className="font-bold text-lg mb-2">Member Information</h4>
                        <div className="space-y-2 text-sm">
                            <div><strong>Name:</strong> {member.name}</div>
                            <div><strong>Email:</strong> {member.email}</div>
                            <div><strong>Role:</strong> {member.role}</div>
                            <div><strong>Room Status:</strong> {member.roomStatus}</div>
                            <div><strong>Room ID:</strong> {member.khataId || 'N/A'}</div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg dark:border-gray-700">
                        <h4 className="font-bold text-lg mb-2">Contact Details</h4>
                        <div className="space-y-2 text-sm">
                            <div><strong>Phone:</strong> {member.phone || 'Not added'}</div>
                            <div><strong>WhatsApp:</strong> {member.whatsapp || 'Not added'}</div>
                            <div><strong>Facebook:</strong> {member.facebook || 'Not added'}</div>
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
        if (member.whatsapp && member.whatsapp !== 'Available' && member.whatsapp !== 'Not available') {
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
            <div className="flex items-center gap-4">
                <UserCircleIcon className="w-12 h-12 text-gray-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        {member.name} {isManager && <CrownIcon className="w-5 h-5 text-yellow-500" />}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                </div>
            </div>
            <div className="border-t my-3 border-gray-200 dark:border-gray-700"></div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>📞 {member.phone || 'Not added'}</p>
                <p>📱 WhatsApp: {member.whatsapp || 'Not added'}</p>
                <p>📘 Facebook: {member.facebook || 'Not added'}</p>
            </div>
            <div className="border-t my-3 border-gray-200 dark:border-gray-700"></div>
            <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <p><strong>Role:</strong> {member.role}</p>
                <p><strong>Status:</strong> {member.roomStatus}</p>
                <p><strong>Room:</strong> {member.room || member.khataId || 'N/A'}</p>
            </div>
            <div className="border-t my-3 border-gray-200 dark:border-gray-700"></div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
                {user?.role === Role.Manager && member.id !== user.id ? (
                    <button onClick={onHistoryClick} className="text-primary hover:underline">View Profile</button>
                ) : (
                    <>
                        {member.whatsapp && member.whatsapp !== 'Not added' && (
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
    const { user } = useAuth();
    const { addToast } = useNotifications();
    const [viewingMember, setViewingMember] = useState<Member | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.khataId) {
                setLoading(false);
                return;
            }

            try {
                const membersData = await api.getMembersForRoom(user.khataId);
                setMembers(membersData);

                if (user.role === Role.Manager) {
                    const pendingData = await api.getPendingApprovals(user.khataId);
                    setPendingRequests(pendingData);
                }
            } catch (error) {
                console.error('Error fetching room data:', error);
                addToast({ type: 'error', title: 'Error', message: 'Failed to load room members' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.khataId, user?.role]);

    const handleCopyRoomCode = () => {
        if (user?.khataId) {
            navigator.clipboard.writeText(user.khataId);
            setCopied(true);
            addToast({ type: 'success', title: 'Copied!', message: 'Room code copied to clipboard.' });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleApproveMember = async (userId: string) => {
        if (!user?.khataId) return;

        try {
            const success = await api.approveMember(user.khataId, userId);
            if (success) {
                addToast({ type: 'success', title: 'Success', message: 'Member approved successfully!' });
                const pendingData = await api.getPendingApprovals(user.khataId);
                setPendingRequests(pendingData);
                const membersData = await api.getMembersForRoom(user.khataId);
                setMembers(membersData);
            } else {
                addToast({ type: 'error', title: 'Error', message: 'Failed to approve member' });
            }
        } catch (error) {
            console.error('Error approving member:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to approve member' });
        }
    };

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
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <UsersIcon className="w-8 h-8 text-primary" />
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Room Members ({members.length})</h1>
                        </div>
                    </div>

                    {user?.role === Role.Manager && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="font-semibold">
                                <span>🔑 Room Code: </span>
                                <span className="font-mono text-lg bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{user.khataId}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopyRoomCode}
                                    className="flex items-center gap-1.5 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                    {copied ? <CheckCircleIcon className="w-4 h-4 text-green-600" /> : <ClipboardIcon className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}

                    {members.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
                            <UsersIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No members yet</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {user?.role === Role.Manager
                                    ? 'Share your room code to invite members'
                                    : 'Waiting for members to join'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">{req.name}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{req.email}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Requested: {new Date(req.requestedAt).toLocaleString()}</p>
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
                </div>
            </AppLayout>

            <MemberHistoryModal member={viewingMember} onClose={() => setViewingMember(null)} />
            <ToastContainer />
        </>
    );
}
