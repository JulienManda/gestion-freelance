const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s.-]+$/;

export const checkText = (value, label, { required = false, min = 0, max = Infinity } = {}) => {
    const text = String(value ?? '').trim();
    if (!text) return required ? `${label} est obligatoire.` : '';
    if (text.length < min) return `${label} doit contenir au moins ${min} caractères.`;
    if (text.length > max) return `${label} ne doit pas dépasser ${max} caractères.`;
    return '';
};

export const checkEmail = (value, { required = true } = {}) => {
    const email = String(value ?? '').trim();
    if (!email) return required ? "L'email est obligatoire." : '';
    if (email.length > 254) return "L'email ne doit pas dépasser 254 caractères.";
    return EMAIL_REGEX.test(email) ? '' : "L'email n'est pas valide.";
};

export const checkPhone = (value, { required = false } = {}) => {
    const phone = String(value ?? '').trim();
    if (!phone) return required ? 'Le téléphone est obligatoire.' : '';
    if (phone.length > 20) return 'Le téléphone ne doit pas dépasser 20 caractères.';
    const digits = phone.replace(/\D/g, '');
    if (!PHONE_REGEX.test(phone) || digits.length < 8 || digits.length > 15) {
        return 'Téléphone invalide (8 à 15 chiffres, "+" autorisé au début).';
    }
    return '';
};

export const checkPassword = (value, { strict = false } = {}) => {
    if (!value) return 'Le mot de passe est obligatoire.';
    if (!strict) return '';
    if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (value.length > 128) return 'Le mot de passe ne doit pas dépasser 128 caractères.';
    if (/^\d+$/.test(value)) return 'Le mot de passe ne peut pas être uniquement numérique.';
    return '';
};

export const checkNumber = (value, label, { min = -Infinity, max = Infinity, positive = false, integer = false, decimals } = {}) => {
    if (value === '' || value === null || value === undefined) return `${label} est obligatoire.`;
    const number = Number(value);
    if (!Number.isFinite(number)) return `${label} doit être un nombre.`;
    if (integer && !Number.isInteger(number)) return `${label} doit être un nombre entier.`;
    if (decimals !== undefined && !new RegExp(`^-?\\d+(\\.\\d{1,${decimals}})?$`).test(String(value).trim())) {
        return `${label} accepte au maximum ${decimals} décimales.`;
    }
    if (positive && number <= 0) return `${label} doit être supérieur à 0.`;
    if (number < min) return `${label} doit être supérieur ou égal à ${min}.`;
    if (number > max) return `${label} ne doit pas dépasser ${max.toLocaleString()}.`;
    return '';
};

export const checkDate = (value, label, { min } = {}) => {
    if (!value) return `${label} est obligatoire.`;
    if (Number.isNaN(Date.parse(value))) return `${label} n'est pas une date valide.`;
    if (min && value < min) return `${label} ne peut pas être antérieure au ${min}.`;
    return '';
};

export const hasErrors = (errors) =>
    Object.values(errors).some(error => (Array.isArray(error) ? error.some(Boolean) : Boolean(error)));
