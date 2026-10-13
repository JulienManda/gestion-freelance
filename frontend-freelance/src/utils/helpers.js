export const getSafeId = (item) => (typeof item === 'object' && item !== null) ? item.id : item;

export const getLignesArray = (lignesData) => {
    if (!lignesData) return [];
    if (typeof lignesData === 'string') {
        try { return JSON.parse(lignesData); } catch (e) { return []; }
    }
    return Array.isArray(lignesData) ? lignesData : [];
};

export const calculateLinesTotal = (lignes) =>
    (lignes || []).reduce((acc, l) => acc + (parseFloat(l.quantite || 0) * parseFloat(l.prix_unitaire || 0)), 0);

export const sortByIdDesc = (list) => [...list].sort((a, b) => b.id - a.id);

export const todayISO = () => new Date().toISOString().split('T')[0];

export const trimValues = (values, skip = []) =>
    Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, typeof value === 'string' && !skip.includes(key) ? value.trim() : value])
    );

export const readStoredProfile = () => {
    try {
        const stored = localStorage.getItem('user_profile');
        if (stored && stored !== 'undefined' && stored !== 'null') return JSON.parse(stored);
    } catch (e) {
        console.error('Erreur de lecture du profil:', e);
    }
    return {};
};
