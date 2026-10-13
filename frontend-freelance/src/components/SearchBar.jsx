import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder, cardBg }) {
    return (
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${cardBg}`}>
            <Search size={20} className="text-gray-400" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
            />
        </div>
    );
}
