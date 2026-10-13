import React from 'react';
import FieldError from './FieldError';

export default function FormField({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-bold uppercase opacity-60 mb-1">{label}</label>
            {children}
            <FieldError message={error} />
        </div>
    );
}
