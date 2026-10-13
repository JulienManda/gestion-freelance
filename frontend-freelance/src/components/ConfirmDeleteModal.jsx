import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDeleteModal({ title, name, cardBg, onCancel, onConfirm }) {
    return (
        <Modal>
            <div className={`rounded-3xl p-6 max-w-sm w-full text-center border animate-in zoom-in-95 ${cardBg}`}>
                <AlertTriangle size={32} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm opacity-70 mb-6">Voulez-vous vraiment supprimer <strong>{name}</strong> ? Cette action est irréversible.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="cursor-pointer flex-1 py-2.5 border border-gray-500/30 rounded-xl transition-all hover:bg-gray-500/10 active:scale-95 font-semibold">Annuler</button>
                    <button onClick={onConfirm} className="cursor-pointer flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold transition-all hover:bg-red-700 active:scale-95 shadow-md">Supprimer</button>
                </div>
            </div>
        </Modal>
    );
}
