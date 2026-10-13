import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function Notification({ notification }) {
    if (!notification) return null;
    const isError = notification.type === 'error';

    return (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5">
            <div className={`flex items-center gap-2 px-5 py-4 rounded-2xl text-white font-medium shadow-xl ${isError ? 'bg-red-600' : 'bg-green-600'}`}>
                {isError ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                {notification.message}
            </div>
        </div>
    );
}
