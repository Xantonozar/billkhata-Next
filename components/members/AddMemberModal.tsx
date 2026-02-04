"use client";

import React, { useState } from 'react';
import { XIcon, SpinnerIcon, UserPlusIcon, CameraIcon } from '@/components/Icons';
import { api } from '@/services/api';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    khataId: string;
    onMemberAdded: () => void;
}

export default function AddMemberModal({ isOpen, onClose, khataId, onMemberAdded }: AddMemberModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [error, setError] = useState('');
    const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setGeneratedCredentials(null);

        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/members/${khataId}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim() || undefined,
                    password: password.trim() || undefined,
                    avatarUrl: avatarUrl || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create member');
            }

            // Refresh list immediately on success
            onMemberAdded();

            // If credentials were generated, show them to the user
        } catch (err: any) {
            setError(err.message || 'Failed to create member');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        setUploading(true);
        setError('');
        try {
            const url = await api.uploadImage(file);
            if (url) {
                setAvatarUrl(url);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setEmail('');
        setPassword('');
        setAvatarUrl('');
        setError('');
        setGeneratedCredentials(null);
        onClose();
    };

    const handleCopyCredentials = () => {
        if (generatedCredentials) {
            const text = `Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`;
            navigator.clipboard.writeText(text);
        }
    };

    const handleDone = () => {
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4" onClick={handleClose}>
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                        <UserPlusIcon className="w-6 h-6 text-primary" />
                        Add Member
                    </h3>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {!generatedCredentials ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserPlusIcon className="w-10 h-10 text-slate-400" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                                    disabled={uploading}
                                >
                                    <CameraIcon className="w-3.5 h-3.5" />
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
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">Add Profile Photo (Optional)</span>
                        </div>

                        <div>
                            <label htmlFor="memberName" className="block text-sm font-medium text-foreground mb-1">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="memberName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="memberEmail" className="block text-sm font-medium text-foreground mb-1">
                                Email <span className="text-xs text-muted-foreground">(optional)</span>
                            </label>
                            <input
                                id="memberEmail"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="memberPassword" className="block text-sm font-medium text-foreground mb-1">
                                Password <span className="text-xs text-muted-foreground">(optional)</span>
                            </label>
                            <input
                                id="memberPassword"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                placeholder="••••••••"
                            />
                        </div>

                        <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                            💡 <strong>Note:</strong> Email and password are optional. If not provided, system will generate dummy credentials automatically.
                        </p>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && <SpinnerIcon className="w-4 h-4" />}
                                Add Member
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                                ✓ Member created successfully!
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                                Since you didn't provide email/password, here are the auto-generated credentials:
                            </p>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-300 dark:border-green-700 space-y-2">
                                <div>
                                    <span className="text-xs font-medium text-muted-foreground">Email:</span>
                                    <p className="text-sm font-mono break-all">{generatedCredentials.email}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-muted-foreground">Password:</span>
                                    <p className="text-sm font-mono break-all">{generatedCredentials.password}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCopyCredentials}
                                className="px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-semibold hover:bg-blue-200 dark:hover:bg-blue-900"
                            >
                                Copy Credentials
                            </button>
                            <button
                                onClick={handleDone}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
