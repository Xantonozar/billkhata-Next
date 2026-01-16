"use client";

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { User, X, Plus, Save, Edit2, Mail, Phone, Facebook, Camera } from 'lucide-react';

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const { addToast } = useNotifications();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        whatsapp: user?.whatsapp || '',
        facebook: user?.facebook || '',
        avatarUrl: user?.avatarUrl || '',
        foodPreferences: {
            likes: user?.foodPreferences?.likes || [],
            dislikes: user?.foodPreferences?.dislikes || [],
            avoidance: user?.foodPreferences?.avoidance || [],
            notes: user?.foodPreferences?.notes || ''
        }
    });

    // Input state for adding new items
    const [newItem, setNewItem] = useState({ likes: '', dislikes: '', avoidance: '' });

    const handleAddItem = (type: 'likes' | 'dislikes' | 'avoidance') => {
        const value = newItem[type].trim();
        if (value && !formData.foodPreferences[type].includes(value)) {
            setFormData({
                ...formData,
                foodPreferences: {
                    ...formData.foodPreferences,
                    [type]: [...formData.foodPreferences[type], value]
                }
            });
            setNewItem({ ...newItem, [type]: '' });
        }
    };

    const handleRemoveItem = (type: 'likes' | 'dislikes' | 'avoidance', item: string) => {
        setFormData({
            ...formData,
            foodPreferences: {
                ...formData.foodPreferences,
                [type]: formData.foodPreferences[type].filter((i: string) => i !== item)
            }
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 5 * 1024 * 1024) {
            addToast({ type: 'error', title: 'Error', message: 'Image size should be less than 5MB' });
            return;
        }

        if (!file.type.startsWith('image/')) {
            addToast({ type: 'error', title: 'Error', message: 'Please upload an image file' });
            return;
        }

        setUploading(true);
        try {
            const url = await api.uploadImage(file);
            if (url) {
                setFormData(prev => ({ ...prev, avatarUrl: url }));
                addToast({ type: 'success', title: 'Success', message: 'Image uploaded successfully' });
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Failed to upload image' });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatedUser = await api.updateUserProfile(formData);
            setUser(updatedUser);
            addToast({ type: 'success', title: 'Success', message: 'Profile updated successfully' });
            setIsEditing(false);
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error', message: error.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            whatsapp: user?.whatsapp || '',
            facebook: user?.facebook || '',
            avatarUrl: user?.avatarUrl || '',
            foodPreferences: {
                likes: user?.foodPreferences?.likes || [],
                dislikes: user?.foodPreferences?.dislikes || [],
                avoidance: user?.foodPreferences?.avoidance || [],
                notes: user?.foodPreferences?.notes || ''
            }
        });
        setIsEditing(false);
    };

    if (!user) return null;

    const renderBadges = (items: string[], type: 'likes' | 'dislikes' | 'avoidance') => {
        const styles = {
            likes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            dislikes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            avoidance: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        };

        if (items.length === 0) return <span className="text-sm text-muted-foreground">None</span>;

        return (
            <div className="flex flex-wrap gap-2">
                {items.map((item, idx) => (
                    <span key={idx} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type]}`}>
                        {item}
                        {isEditing && (
                            <button onClick={() => handleRemoveItem(type, item)} className="ml-1 hover:opacity-75">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-6 animate-fade-in">

                {/* Header Actions */}
                <div className="flex items-center justify-between px-1">
                    <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/10 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                            <Edit2 className="w-4 h-4" /> Edit
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancel}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading || uploading}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Identity Card */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400 dark:text-slate-500 overflow-hidden border-2 border-slate-100 dark:border-slate-700">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user.name?.charAt(0) || 'U'
                                )}
                            </div>

                            {isEditing && (
                                <>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-sm"
                                        disabled={uploading}
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                            {isEditing ? (
                                <div className="max-w-xs mx-auto sm:mx-0">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary-500/20 outline-none"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-xl font-bold text-card-foreground">{user.name}</h2>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            )}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground pt-1">
                                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                    <User className="w-3.5 h-3.5" /> {user.role}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                                    Room {user.khataId || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Phone className="w-4 h-4 text-slate-400" /> WhatsApp
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    placeholder="+880..."
                                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground pl-6">{user.whatsapp || 'Not added'}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Facebook className="w-4 h-4 text-slate-400" /> Facebook
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.facebook}
                                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                    placeholder="Profile Link"
                                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground pl-6 truncate">{user.facebook || 'Not added'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preferences Card */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                    <h3 className="text-lg font-semibold text-card-foreground">Dining Preferences</h3>

                    <div className="grid gap-6">
                        {/* Likes */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Foods I Like</label>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newItem.likes}
                                        onChange={(e) => setNewItem({ ...newItem, likes: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem('likes')}
                                        placeholder="Add item..."
                                        className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                                    />
                                    <button onClick={() => handleAddItem('likes')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="min-h-[2rem] flex items-center">
                                {renderBadges(formData.foodPreferences.likes, 'likes')}
                            </div>
                        </div>

                        {/* Dislikes */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Foods I Avoid</label>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newItem.dislikes}
                                        onChange={(e) => setNewItem({ ...newItem, dislikes: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem('dislikes')}
                                        placeholder="Add item..."
                                        className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                                    />
                                    <button onClick={() => handleAddItem('dislikes')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="min-h-[2rem] flex items-center">
                                {renderBadges(formData.foodPreferences.dislikes, 'dislikes')}
                            </div>
                        </div>

                        {/* Restrictions */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-rose-600 dark:text-rose-400">Allergies / Strict Restrictions</label>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newItem.avoidance}
                                        onChange={(e) => setNewItem({ ...newItem, avoidance: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem('avoidance')}
                                        placeholder="Add item..."
                                        className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md text-sm bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30"
                                    />
                                    <button onClick={() => handleAddItem('avoidance')} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-md hover:bg-rose-100">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="min-h-[2rem] flex items-center">
                                {renderBadges(formData.foodPreferences.avoidance, 'avoidance')}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Additional Notes</label>
                            {isEditing ? (
                                <textarea
                                    value={formData.foodPreferences.notes}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        foodPreferences: { ...formData.foodPreferences, notes: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm resize-none"
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-100 dark:border-slate-800">
                                    {formData.foodPreferences.notes || 'No notes.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
