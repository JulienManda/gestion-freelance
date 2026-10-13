import React, { useState } from 'react';
import { User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { api } from '../utils/api';
import { trimValues } from '../utils/helpers';
import { checkText, checkEmail, checkPassword, hasErrors } from '../utils/validators';
import FieldError from '../components/FieldError';

const INITIAL_FORM = {
    username: '',
    email: '',
    password: '',
    nomEntreprise: 'MonEspace',
    activite: 'Community Management & Design',
};

const validateAuth = (data, isRegister) => ({
    username: checkText(data.username, "Le nom d'utilisateur", { required: true, min: 3, max: 150 }),
    email: isRegister ? checkEmail(data.email) : '',
    password: checkPassword(data.password, { strict: isRegister }),
});

function AuthInput({ label, icon: Icon, error, ...inputProps }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    {...inputProps}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#185e45]"
                />
            </div>
            <FieldError message={error} />
        </div>
    );
}

export default function Auth({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM);

    const updateField = (name) => (e) => {
        setFormData({ ...formData, [name]: e.target.value });
        setErrors({ ...errors, [name]: '' });
    };

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setError('');
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const payload = trimValues(formData, ['password']);
        const validationErrors = validateAuth(payload, isRegister);
        setErrors(validationErrors);
        if (hasErrors(validationErrors)) return;

        setLoading(true);

        try {
            const response = await axios.post(api(isRegister ? 'register/' : 'login/'), payload);
            const { token, user } = response.data;

            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_profile', JSON.stringify(user || payload));

            onLogin(user || payload, token);
        } catch (err) {
            console.error("Erreur d'authentification:", err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                'Erreur de connexion au serveur. Vérifiez vos identifiants.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 font-sans p-4">
            <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-xl border border-gray-100 animate-in fade-in duration-300">

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full border-4 border-[#185e45] border-t-transparent animate-spin-slow"></div>
                    <span className="text-2xl font-bold text-gray-900">MonEspace</span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {isRegister ? 'Créer un compte sécurisé' : 'Connexion à votre espace'}
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                    {isRegister
                        ? 'Enregistrez vos accès pour sécuriser vos données.'
                        : 'Entrez vos identifiants pour accéder à votre tableau de bord.'}
                </p>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <AuthInput
                        label="Nom d'utilisateur"
                        icon={User}
                        type="text"
                        placeholder="Votre pseudo ou nom"
                        maxLength={150}
                        value={formData.username}
                        onChange={updateField('username')}
                        error={errors.username}
                    />

                    {isRegister && (
                        <AuthInput
                            label="Email professionnel"
                            icon={Mail}
                            type="email"
                            placeholder="contact@freelance.com"
                            maxLength={254}
                            value={formData.email}
                            onChange={updateField('email')}
                            error={errors.email}
                        />
                    )}

                    <AuthInput
                        label="Mot de passe"
                        icon={Lock}
                        type="password"
                        placeholder="••••••••"
                        maxLength={128}
                        value={formData.password}
                        onChange={updateField('password')}
                        error={errors.password}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#185e45] hover:bg-green-800 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm mt-6 disabled:opacity-50"
                    >
                        {loading ? 'Chargement...' : (isRegister ? "S'inscrire" : 'Se connecter')} <ArrowRight size={16} />
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={toggleMode} className="text-xs text-[#185e45] font-semibold hover:underline">
                        {isRegister ? 'Déjà un compte ? Connectez-vous' : 'Pas de compte ? Inscrivez-vous'}
                    </button>
                </div>

            </div>
        </div>
    );
}
