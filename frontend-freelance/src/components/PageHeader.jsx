import React from 'react';
import { Plus } from 'lucide-react';

export default function PageHeader({ title, subtitle, actionLabel, onAction, primaryColor, isDarkMode, iconSize = 18 }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
            <div>
                <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
            </div>
            <button
                onClick={onAction}
                style={{ backgroundColor: primaryColor }}
                className="cursor-pointer inline-flex items-center justify-center gap-2 text-white font-semibold px-5 py-2.5 rounded-full shadow-sm transition-all duration-200 hover:opacity-90 active:scale-95"
            >
                <Plus size={iconSize} /> {actionLabel}
            </button>
        </div>
    );
}
