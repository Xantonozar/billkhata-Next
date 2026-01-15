"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { api } from '@/services/api';
import { User, X, Plus, Check } from 'lucide-react';

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const { addToast } = useNotifications();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    // Form state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        whatsapp: user?.whatsapp || '',
        facebook: user?.facebook || '',
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

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <User className="w-8 h-8 text-primary-500" />
                        <h1 className="text-3xl font-bold text-card-foreground">My Profile</h1>
                    </div>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                {/* User Info Card */}
                <div className="bg-card rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-card-foreground">Personal Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-card-foreground"
                                />
                            ) : (
                                <p className="text-lg text-card-foreground">{user.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                            <p className="text-lg text-card-foreground">{user.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
                                <p className="text-lg text-card-foreground">{user.role}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Room</label>
                                <p className="text-lg text-card-foreground">{user.khataId || 'No room'}</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">WhatsApp</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.whatsapp}
                                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                    placeholder="Enter WhatsApp number"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-card-foreground"
                                />
                            ) : (
                                <p className="text-lg text-card-foreground">{user.whatsapp || 'Not added'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Facebook</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.facebook}
                                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                    placeholder="Enter Facebook profile"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-card-foreground"
                                />
                            ) : (
                                <p className="text-lg text-card-foreground">{user.facebook || 'Not added'}</p>
                            )}
                        </div>
                    </div>
                </div>



                {/* Food Preferences */}
                <div className="bg-card rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-card-foreground">Food Preferences</h2>

                    {/* Likes */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-green-600 dark:text-green-400">✓ Foods I Like</h3>
                        </div>
                        {isEditing && (
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newItem.likes}
                                    onChange={(e) => setNewItem({ ...newItem, likes: e.target.value })}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem('likes')}
                                    placeholder="Add food you like..."
                                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-card-foreground"
                                />
                                <button
                                    onClick={() => handleAddItem('likes')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {formData.foodPreferences.likes.length > 0 ? (
                                formData.foodPreferences.likes.map((item: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md text-sm">
                                        <Check className="w-3 h-3" />
                                        {item}
                                        {isEditing && (
                                            <button onClick={() => handleRemoveItem('likes', item)} className="ml-1 hover:text-green-600">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No preferences set</p>
                            )}
                        </div>
                    </div>

                    {/* Dislikes */}
                    <div className="mb-6">
                        <h3 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">− Foods I Prefer to Avoid</h3>
                        {isEditing && (
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newItem.dislikes}
                                    onChange={(e) => setNewItem({ ...newItem, dislikes: e.target.value })}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem('dislikes')}
                                    placeholder="Add food you dislike..."
                                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-card-foreground"
                                />
                                <button
                                    onClick={() => handleAddItem('dislikes')}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {formData.foodPreferences.dislikes.length > 0 ? (
                                formData.foodPreferences.dislikes.map((item: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
                                        {item}
                                        {isEditing && (
                                            <button onClick={() => handleRemoveItem('dislikes', item)} className="ml-1 hover:text-yellow-600">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No preferences set</p>
                            )}
                        </div>
                    </div>

                    {/* Avoidance */}
                    <div className="mb-6">
                        <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">✕ Foods I Won't Eat (Allergies/Restrictions)</h3>
                        {isEditing && (
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newItem.avoidance}
                                    onChange={(e) => setNewItem({ ...newItem, avoidance: e.target.value })}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem('avoidance')}
                                    placeholder="Add food to avoid..."
                                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-card-foreground"
                                />
                                <button
                                    onClick={() => handleAddItem('avoidance')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {formData.foodPreferences.avoidance.length > 0 ? (
                                formData.foodPreferences.avoidance.map((item: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md text-sm font-medium">
                                        <X className="w-3 h-3" />
                                        {item}
                                        {isEditing && (
                                            <button onClick={() => handleRemoveItem('avoidance', item)} className="ml-1 hover:text-red-600">
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No restrictions set</p>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <h3 className="font-medium text-card-foreground mb-2">📝 Additional Notes</h3>
                        {isEditing ? (
                            <textarea
                                value={formData.foodPreferences.notes}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    foodPreferences: { ...formData.foodPreferences, notes: e.target.value }
                                })}
                                placeholder="Any other dietary preferences or notes..."
                                rows={4}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-card-foreground resize-none"
                            />
                        ) : (
                            <p className="text-card-foreground whitespace-pre-wrap">{formData.foodPreferences.notes || 'No additional notes'}</p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
