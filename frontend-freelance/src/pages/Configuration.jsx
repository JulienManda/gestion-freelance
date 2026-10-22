import React, { useState } from 'react';
import { Save, CheckCircle, Moon, Sun, Palette, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api, clearSession } from '../utils/api';
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
    const [showDelete, setShowDelete] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const isDarkMode = user.darkMode || false;

    const inputClass = `w-full border rounded-xl p-3 text-sm focus:outline-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[#185e45]'}`;
    const titleClass = `text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${isDarkMode ? 'border-gray-800 text-gray-300' : 'border-gray-100 text-gray-700'}`;

    const updateField = (name) => (e) => {
        setFormData({ ...formData, [name]: e.target.value });
        setErrors({ ...errors, [name]: '' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');

        const payload = trimValues(formData);
        const errs = validateProfile(payload);
        setErrors(errs);
        if (hasErrors(errs)) return;

        const token = localStorage.getItem('auth_token');

        try {
            const response = await axios.put(api('profile/'), payload, {
                headers: { Authorization: `Token ${token}` },
            });

            const newUser = { ...response.data.user, primaryColor: payload.primaryColor, darkMode: payload.darkMode };

            setUser(newUser);
            localStorage.setItem('user_profile', JSON.stringify(newUser));

            setSuccessMessage(true);

            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (err) {
            console.error('Erreur lors de la sauvegarde :', err);
            setError("Erreur lors de l'enregistrement des modifications sur le serveur.");
        }
    };

    const closeDelete = () => {
        setShowDelete(false);
        setDeletePassword('');
        setDeleteError('');
        setShowDeletePassword(false);
    };

    const deleteAccount = async (e) => {
        e.preventDefault();
        if (!deletePassword) {
            setDeleteError('Entrez votre mot de passe pour confirmer.');
            return;
        }
        setDeleting(true);
        setDeleteError('');
        try {
            await axios.delete(api('profile/'), { data: { password: deletePassword } });
            clearSession();
            window.location.href = '/';
        } catch (err) {
            setDeleteError(err.response?.data?.error || 'Suppression impossible pour le moment.');
            setDeleting(false);
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
                        <h3 className={titleClass}>Informations de l'Entreprise</h3>
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
                        <h3 className={titleClass}>Apparence & Thème</h3>

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

            <div className={`mt-8 rounded-3xl border p-6 ${isDarkMode ? 'border-red-900/50 bg-red-950/20' : 'border-red-200 bg-red-50/50'}`}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-2">Zone de danger</h2>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Supprimer votre compte efface définitivement vos clients, services, devis, factures et paiements. Cette action est irréversible.
                </p>
                <button
                    type="button"
                    onClick={() => setShowDelete(true)}
                    className="cursor-pointer inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
                >
                    <Trash2 size={16} /> Supprimer mon compte
                </button>
            </div>

            {showDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <form
                        onSubmit={deleteAccount}
                        className={`rounded-3xl p-6 max-w-sm w-full border shadow-2xl ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'}`}
                    >
                        <AlertTriangle size={32} className="mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-bold mb-2 text-center">Supprimer définitivement le compte ?</h3>
                        <p className="text-sm opacity-70 mb-4 text-center">
                            Toutes vos données seront effacées. Entrez votre mot de passe pour confirmer.
                        </p>
                        <div className="relative">
                            <input
                                type={showDeletePassword ? 'text' : 'password'}
                                value={deletePassword}
                                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                placeholder="Mot de passe"
                                autoComplete="current-password"
                                maxLength={128}
                                className={`${inputClass} pr-11`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowDeletePassword(!showDeletePassword)}
                                aria-label={showDeletePassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                                {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <FieldError message={deleteError} />
                        <div className="flex gap-3 mt-5">
                            <button type="button" onClick={closeDelete} className="cursor-pointer flex-1 py-2.5 border border-gray-500/30 rounded-xl font-semibold transition hover:bg-gray-500/10">
                                Annuler
                            </button>
                            <button type="submit" disabled={deleting} className="cursor-pointer flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold transition hover:bg-red-700 disabled:opacity-50">
                                {deleting ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
