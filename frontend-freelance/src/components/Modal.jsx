import React from 'react';

export default function Modal({ children, overlayClass = 'bg-black/60' }) {
    return (
        <div className={`fixed inset-0 ${overlayClass} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
            {children}
        </div>
    );
}
