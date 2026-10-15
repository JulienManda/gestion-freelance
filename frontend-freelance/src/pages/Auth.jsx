import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { api } from '../utils/api';
import { trimValues } from '../utils/helpers';
import { checkText, checkEmail, checkPassword, hasErrors } from '../utils/validators';
import FieldError from '../components/FieldError';

const INITIAL_FORM = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
    nomEntreprise: 'MonEspace',
    activite: 'Community Management & Design',
};

const TITLES = {
    login: ['Connexion à votre espace', 'Entrez vos identifiants pour accéder à votre tableau de bord.'],
    register: ['Créer un compte sécurisé', 'Enregistrez vos accès pour sécuriser vos données.'],
    verify: ['Confirmez votre email', 'Entrez le code à 6 chiffres reçu par email.'],
    forgot: ['Mot de passe oublié', 'Entrez votre email : nous vous enverrons un code de réinitialisation.'],
    reset: ['Nouveau mot de passe', 'Entrez le code reçu par email puis choisissez un nouveau mot de passe.'],
};

const checkCode = (value) => (/^\d{6}$/.test(String(value).trim()) ? '' : 'Le code contient 6 chiffres.');

const validate = (data, mode) => {
    const errors = {};
    if (mode === 'login' || mode === 'register') {
        errors.username = checkText(data.username, "Le nom d'utilisateur", { required: true, min: 3, max: 150 });
    }
    if (mode !== 'login') errors.email = checkEmail(data.email);
    if (mode === 'login' || mode === 'register' || mode === 'reset') {
        errors.password = checkPassword(data.password, { strict: mode !== 'login' });
    }
    if ((mode === 'register' || mode === 'reset') && !errors.password && data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }
    if (mode === 'verify' || mode === 'reset') errors.code = checkCode(data.code);
    return errors;
};

function AuthInput({ label, icon: Icon, error, type, ...inputProps }) {
    const [visible, setVisible] = useState(false);
    const isPassword = type === 'password';
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    {...inputProps}
                    type={isPassword && visible ? 'text' : type}
                    className={`w-full pl-10 ${isPassword ? 'pr-11' : 'pr-4'} py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#185e45]`}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setVisible(!visible)}
                        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            <FieldError message={error} />
        </div>
    );
}

export default function Auth({ onLogin }) {
    const [mode, setMode] = useState('login');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [formData, setFormData] = useState(INITIAL_FORM);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const updateField = (name) => (e) => {
        setFormData({ ...formData, [name]: e.target.value });
        setErrors({ ...errors, [name]: '' });
    };

    const goTo = (next, { keepInfo = false } = {}) => {
        setMode(next);
        setError('');
        if (!keepInfo) setInfo('');
        setErrors({});
    };

    const finishLogin = (data, payload) => {
        const { token, user } = data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_profile', JSON.stringify(user || payload));
        onLogin(user || payload, token);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');

        const payload = trimValues(formData, ['password', 'confirmPassword']);
        const validationErrors = validate(payload, mode);
        setErrors(validationErrors);
        if (hasErrors(validationErrors)) return;

        setLoading(true);
        try {
            if (mode === 'login') {
                const { data } = await axios.post(api('login/'), { username: payload.username, password: payload.password });
                finishLogin(data, payload);
            } else if (mode === 'register') {
                const { confirmPassword, ...registerData } = payload;
                await axios.post(api('register/'), registerData);
                setCooldown(60);
                goTo('verify');
                setInfo(`Un code a été envoyé à ${payload.email}.`);
            } else if (mode === 'verify') {
                const { data } = await axios.post(api('verify-email/'), { email: payload.email, code: payload.code });
                finishLogin(data, payload);
            } else if (mode === 'forgot') {
                await axios.post(api('forgot-password/'), { email: payload.email });
                setCooldown(60);
                goTo('reset');
                setInfo('Si cet email correspond à un compte, un code vient d’être envoyé.');
            } else if (mode === 'reset') {
                await axios.post(api('reset-password/'), { email: payload.email, code: payload.code, password: payload.password });
                setFormData({ ...formData, password: '', confirmPassword: '', code: '' });
                goTo('login');
                setInfo('Mot de passe modifié. Vous pouvez vous connecter.');
            }
        } catch (err) {
            console.error("Erreur d'authentification:", err);
            const data = err.response?.data;
            if (data?.needs_verification) {
                // Compte créé mais email non confirmé : on bascule vers la saisie du code
                setFormData({ ...formData, email: data.email || formData.email });
                goTo('verify');
                setInfo('Votre email n’est pas encore confirmé. Entrez le code reçu ou renvoyez-en un.');
            } else {
                setError(data?.error || data?.detail || 'Erreur de connexion au serveur. Vérifiez vos informations.');
            }
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        if (cooldown > 0) return;
        setError('');
        try {
            await axios.post(api(mode === 'reset' ? 'forgot-password/' : 'resend-code/'), { email: formData.email.trim() });
            setCooldown(60);
            setInfo('Un nouveau code vient d’être envoyé.');
        } catch (err) {
            setError(err.response?.data?.error || 'Impossible de renvoyer le code pour le moment.');
        }
    };

    const [title, subtitle] = TITLES[mode];
    const submitLabel = {
        login: 'Se connecter', register: "S'inscrire", verify: 'Confirmer',
        forgot: 'Envoyer le code', reset: 'Changer le mot de passe',
    }[mode];
    const showCodeStep = mode === 'verify' || mode === 'reset';

    return (
        <div className="flex min-h-dvh w-full items-center justify-center bg-gray-100 font-sans p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-10 w-full max-w-md shadow-xl border border-gray-100 animate-in fade-in duration-300">

                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full border-4 border-[#185e45] border-t-transparent animate-spin-slow"></div>
                    <span className="text-2xl font-bold text-gray-900">MonEspace</span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-xs text-gray-500 mb-6">{subtitle}</p>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" /> {error}
                    </div>
                )}
                {info && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle2 size={16} className="shrink-0" /> {info}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {(mode === 'login' || mode === 'register') && (
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
                    )}

                    {mode !== 'login' && (
                        <AuthInput
                            label="Email professionnel"
                            icon={Mail}
                            type="email"
                            placeholder="contact@freelance.com"
                            maxLength={254}
                            value={formData.email}
                            onChange={updateField('email')}
                            error={errors.email}
                            readOnly={showCodeStep}
                        />
                    )}

                    {showCodeStep && (
                        <AuthInput
                            label="Code de confirmation"
                            icon={KeyRound}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="123456"
                            maxLength={6}
                            value={formData.code}
                            onChange={(e) => updateField('code')({ target: { value: e.target.value.replace(/\D/g, '') } })}
                            error={errors.code}
                        />
                    )}

                    {mode !== 'verify' && mode !== 'forgot' && (
                        <AuthInput
                            label={mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'}
                            icon={Lock}
                            type="password"
                            placeholder="••••••••"
                            maxLength={128}
                            value={formData.password}
                            onChange={updateField('password')}
                            error={errors.password}
                        />
                    )}

                    {(mode === 'register' || mode === 'reset') && (
                        <AuthInput
                            label="Confirmer le mot de passe"
                            icon={Lock}
                            type="password"
                            placeholder="••••••••"
                            maxLength={128}
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={updateField('confirmPassword')}
                            error={errors.confirmPassword}
                        />
                    )}

                    {mode === 'login' && (
                        <div className="text-right -mt-2">
                            <button type="button" onClick={() => goTo('forgot')} className="text-xs text-gray-500 hover:text-[#185e45] hover:underline">
                                Mot de passe oublié ?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#185e45] hover:bg-green-800 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm mt-6 disabled:opacity-50"
                    >
                        {loading ? 'Chargement...' : submitLabel} <ArrowRight size={16} />
                    </button>
                </form>

                {showCodeStep && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={resendCode}
                            disabled={cooldown > 0}
                            className="text-xs text-[#185e45] font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                        >
                            {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : 'Renvoyer le code'}
                        </button>
                    </div>
                )}

                <div className="mt-6 text-center">
                    {mode === 'login' && (
                        <button onClick={() => goTo('register')} className="text-xs text-[#185e45] font-semibold hover:underline">
                            Pas de compte ? Inscrivez-vous
                        </button>
                    )}
                    {mode === 'register' && (
                        <button onClick={() => goTo('login')} className="text-xs text-[#185e45] font-semibold hover:underline">
                            Déjà un compte ? Connectez-vous
                        </button>
                    )}
                    {mode !== 'login' && mode !== 'register' && (
                        <button onClick={() => goTo('login')} className="text-xs text-[#185e45] font-semibold hover:underline inline-flex items-center gap-1">
                            <ArrowLeft size={12} /> Retour à la connexion
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
