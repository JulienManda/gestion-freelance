import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const buttonClass = 'cursor-pointer p-2 rounded-lg border border-gray-500/30 transition-all hover:bg-gray-500/10 disabled:opacity-30 disabled:cursor-not-allowed';

export default function Pagination({ currentPage, setCurrentPage, totalPages, totalItems, itemsPerPage, isDarkMode }) {
    if (totalItems === 0) return null;

    const first = (currentPage - 1) * itemsPerPage + 1;
    const last = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`flex items-center justify-between px-6 py-4 border-t ${isDarkMode ? 'border-gray-800 bg-gray-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
            <span className="text-sm opacity-60">Affichage de {first} à {last} sur {totalItems}</span>
            <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className={buttonClass}><ChevronLeft size={18} /></button>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className={buttonClass}><ChevronRight size={18} /></button>
            </div>
        </div>
    );
}
