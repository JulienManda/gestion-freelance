import React, { useState } from 'react';
import { Save, CheckCircle, Moon, Sun, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../utils/api';
import { trimValues } from '../utils/helpers';
import { checkText, checkEmail, checkPhone, hasErrors } from '../utils/validators';
import FieldError from '../components/FieldError';

const COLOR_PRESETS = [
    { name: 'Vert Forêt (Défaut)', value: '#185e45' },
    { name: 'Bleu Océan', value: '#1e40af' },
    { name: 'Violet Élégant', value: '#6b21a8' },
    { name: 'Gris Carbone', value: '#334155' },
];

const validateProfile = (data) => ({
    nomEntreprise: checkText(data.nomEntreprise, "Le nom de l'entreprise", { required: true, min: 2, max: 150 }),
    username: checkText(data.username, "Le nom de l'administrateur", { required: true, min: 3, max: 150 }),
    telephone: checkPhone(data.telephone),
    email: checkEmail(data.email),
    activite: checkText(data.activite, "L'activité", { required: true, min: 2, max: 150 }),
    primaryColor: !data.primaryColor || COLOR_PRESETS.some(p => p.value === data.primaryColor) ? '' : 'Couleur invalide.',
});

function Field({ label, error, inputClass, ...inputProps }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
            <input {...inputProps} className={inputClass} />
            <FieldError message={error} />
        </div>
    );
}

export default function Configuration({ user, setUser }) {
    const [formData, setFormData] = useState(user);
    const [successMessage, setSuccessMessage] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const isDarkMode = user.darkMode || false;

    const inputClass = `w-full border rounded-xl p-3 text-sm focus:outline-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#185e45]'}`;
    const sectionTitleClass = `text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${isDarkMode ? 'border-gray-800 text-gray-300' : 'border-gray-100 text-gray-700'}`;

    const updateField = (name) => (e) => {
        setFormData({ ...formData, [name]: e.target.value });
        setErrors({ ...errors, [name]: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        const payload = trimValues(formData);
        const validationErrors = validateProfile(payload);
        setErrors(validationErrors);
        if (hasErrors(validationErrors)) return;

        const token = localStorage.getItem('auth_token');

        try {
            const response = await axios.put(api('profile/'), payload, {
                headers: { Authorization: `Token ${token}` },
            });

            const updatedUser = { ...response.data.user, primaryColor: payload.primaryColor, darkMode: payload.darkMode };

            setUser(updatedUser);
            localStorage.setItem('user_profile', JSON.stringify(updatedUser));

            setSuccessMessage(true);

            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (err) {
            console.error('Erreur lors de la sauvegarde :', err);
            setError("Erreur lors de l'enregistrement des modifications sur le serveur.");
        }
    };

    return (
        <div className="animate-in fade-in duration-300 max-w-2xl">
            <div className="mb-8 mt-2">
                <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Configuration</h1>
                <p className="text-gray-400 text-sm">Gérez vos informations professionnelles, votre thème visuel et vos préférences.</p>
            </div>

            {successMessage && (
                <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold">
                    <CheckCircle size={18} /> Paramètres enregistrés ! Redirection vers le tableau de bord...
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-semibold">
                    {error}
                </div>
            )}

            <div className={`rounded-3xl p-8 border shadow-sm space-y-6 ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}`}>
                <form onSubmit={handleSave} noValidate className="space-y-5">

                    <div>
                        <h3 className={sectionTitleClass}>Informations de l'Entreprise</h3>
                        <div className="space-y-4">
                            <Field
                                label="Nom de l'entreprise / Marque"
                                type="text"
                                maxLength={150}
                                value={formData.nomEntreprise || ''}
                                onChange={updateField('nomEntreprise')}
                                inputClass={`${inputClass} font-semibold`}
                                error={errors.nomEntreprise}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field
                                    label="Nom de l'administrateur"
                                    type="text"
                                    maxLength={150}
                                    value={formData.username || ''}
                                    onChange={updateField('username')}
                                    inputClass={inputClass}
                                    error={errors.username}
                                />
                                <Field
                                    label="Téléphone"
                                    type="text"
                                    maxLength={20}
                                    value={formData.telephone || ''}
                                    onChange={updateField('telephone')}
                                    inputClass={inputClass}
                                    error={errors.telephone}
                                />
                            </div>

                            <Field
                                label="Email professionnel"
                                type="email"
                                maxLength={254}
                                value={formData.email || ''}
                                onChange={updateField('email')}
                                inputClass={inputClass}
                                error={errors.email}
                            />

                            <Field
                                label="Activité / Métier"
                                type="text"
                                maxLength={150}
                                value={formData.activite || ''}
                                onChange={updateField('activite')}
                                inputClass={inputClass}
                                error={errors.activite}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <h3 className={sectionTitleClass}>Apparence & Thème</h3>

                        <div className="space-y-4">
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-3">
                                    {formData.darkMode ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-amber-500" />}
                                    <div>
                                        <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mode Sombre</p>
                                        <p className="text-xs text-gray-400">Basculer entre l'interface claire et sombre.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.darkMode || false}
                                        onChange={(e) => setFormData({ ...formData, darkMode: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#185e45]"></div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1.5">
                                    <Palette size={14} /> Couleur des boutons principaux
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {COLOR_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, primaryColor: preset.value })}
                                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold transition ${formData.primaryColor === preset.value
                                                ? (isDarkMode ? 'border-gray-600 bg-gray-800 ring-2 ring-gray-600/20' : 'border-gray-900 bg-gray-50 ring-2 ring-gray-900/10')
                                                : (isDarkMode ? 'border-gray-800 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700')
                                                }`}
                                        >
                                            <span className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: preset.value }}></span>
                                            <span>{preset.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <FieldError message={errors.primaryColor} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 shadow-sm hover:opacity-90"
                            style={{ backgroundColor: formData.primaryColor || '#185e45' }}
                        >
                            <Save size={16} /> Enregistrer et synchroniser
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
