import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, User, Trash2, Edit3, X, ShoppingCart, Check, XCircle } from 'lucide-react';
import { api } from '../utils/api';
import { getTheme } from '../utils/theme';
import { getSafeId, calculateLinesTotal, sortByIdDesc, todayISO } from '../utils/helpers';
import { checkNumber, checkDate, hasErrors } from '../utils/validators';
import useNotification from '../hooks/useNotification';
import usePagination from '../hooks/usePagination';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import FieldError from '../components/FieldError';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Notification from '../components/Notification';

const ITEMS_PER_PAGE = 4;
const MAX_PRICE = 99999999.99;
const STATUTS = ['ATTENTE', 'ACCEPTE', 'REFUSE'];
const EMPTY_LINE = { service: '', quantite: 1, prix_unitaire: '' };

const createEmptyForm = () => ({ client: '', statut: 'ATTENTE', date_creation: todayISO(), lignes: [{ ...EMPTY_LINE }] });

const validateDevis = (data) => ({
    client: data.client ? '' : 'Le client est obligatoire.',
    statut: STATUTS.includes(data.statut) ? '' : 'Le statut est invalide.',
    date_creation: checkDate(data.date_creation, 'La date'),
    lignes: data.lignes.map(l => (
        l.service
            ? checkNumber(l.quantite, 'La quantité', { integer: true, min: 1 })
              || checkNumber(l.prix_unitaire, 'Le prix unitaire', { min: 0, max: MAX_PRICE, decimals: 2 })
            : 'Choisissez un service.'
    )),
});

const getStatutClass = (statut) => {
    if (statut === 'ACCEPTE') return 'bg-green-500/20 text-green-500';
    if (statut === 'REFUSE') return 'bg-red-500/20 text-red-500';
    return 'bg-amber-500/20 text-amber-500';
};

export default function Devis({ refreshData, isDarkMode = false, primaryColor = '#185e45' }) {
    const [devisList, setDevisList] = useState([]);
    const [clientsList, setClientsList] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toRemove, setToRemove] = useState(null);
    const [formData, setFormData] = useState(createEmptyForm);
    const [errors, setErrors] = useState({});
    const [notification, showNotification] = useNotification();

    const { cardBg, inputBg, field, tableHeaderBg, divideClass, rowHover } = getTheme(isDarkMode);

    const loadAll = () => {
        Promise.all([
            axios.get(api('devis/')),
            axios.get(api('clients/')),
            axios.get(api('services/')),
        ]).then(([resDevis, resClients, resServices]) => {
            setDevisList(sortByIdDesc(resDevis.data));
            setClientsList(resClients.data);
            setServicesList(resServices.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { loadAll(); }, []);

    const getClientName = (id) => {
        const c = clientsList.find(item => String(item.id) === String(id));
        return c ? `${c.nom} ${c.entreprise ? `(${c.entreprise})` : ''}` : `Client #${id}`;
    };

    const visible = devisList.filter(d => getClientName(d.client).toLowerCase().includes(searchTerm.toLowerCase()));
    const { currentPage, setCurrentPage, currentItems, totalPages } = usePagination(visible, ITEMS_PER_PAGE, searchTerm);

    const openModal = (devis = null) => {
        setEditingId(devis ? devis.id : null);
        if (devis) {
            const lignes = devis.lignes && devis.lignes.length > 0
                ? devis.lignes.map(l => ({ service: getSafeId(l.service) || '', quantite: l.quantite || 1, prix_unitaire: l.prix_unitaire || '' }))
                : [{ ...EMPTY_LINE }];
            setFormData({ client: devis.client || '', statut: devis.statut || 'ATTENTE', date_creation: devis.date_creation || '', lignes });
        } else {
            setFormData(createEmptyForm());
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const updateField = (name) => (e) => {
        setFormData({ ...formData, [name]: e.target.value });
        setErrors({ ...errors, [name]: '' });
    };

    const handleAddLine = () => setFormData({ ...formData, lignes: [...formData.lignes, { ...EMPTY_LINE }] });

    const handleRemoveLine = (index) => {
        if (formData.lignes.length === 1) return;
        setFormData({ ...formData, lignes: formData.lignes.filter((_, i) => i !== index) });
        setErrors({ ...errors, lignes: [] });
    };

    const handleLineChange = (index, name, value) => {
        const lignes = formData.lignes.map((line, i) => {
            if (i !== index) return line;
            const updated = { ...line, [name]: value };
            if (name === 'service') {
                const srv = servicesList.find(s => String(s.id) === String(value));
                if (srv) updated.prix_unitaire = srv.prix_base || '';
            }
            return updated;
        });
        setFormData({ ...formData, lignes });
        setErrors({ ...errors, lignes: (errors.lignes || []).map((message, i) => (i === index ? '' : message)) });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formErrors = validateDevis(formData);
        setErrors(formErrors);
        if (hasErrors(formErrors)) return;

        const req = editingId
            ? axios.put(api(`devis/${editingId}/`), formData)
            : axios.post(api('devis/'), formData);

        req.then(() => {
            setIsModalOpen(false);
            loadAll();
            if (refreshData) refreshData();
            showNotification(`Devis ${editingId ? 'mis à jour' : 'créé'} avec succès !`);
        }).catch(() => showNotification("Erreur lors de l'enregistrement.", 'error'));
    };

    const handleStatusChange = (devis, newStatus) => {
        const payload = {
            ...devis,
            statut: newStatus,
            lignes: (devis.lignes || []).map(l => ({ service: getSafeId(l.service), quantite: l.quantite, prix_unitaire: l.prix_unitaire })),
        };
        axios.put(api(`devis/${devis.id}/`), payload)
            .then(() => {
                loadAll();
                showNotification(`Statut changé : ${newStatus}`);
            })
            .catch(() => showNotification('Erreur lors du changement de statut.', 'error'));
    };

    const doDelete = () => {
        if (!toRemove) return;
        axios.delete(api(`devis/${toRemove.id}/`))
            .then(() => {
                setToRemove(null);
                loadAll();
                showNotification('Devis supprimé avec succès !');
            })
            .catch(() => {
                setToRemove(null);
                showNotification('Suppression impossible : ce devis est déjà facturé.', 'error');
            });
    };

    const actionButton = 'cursor-pointer p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95';

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <PageHeader
                title="Gestion des Devis"
                subtitle="Suivi des propositions commerciales."
                actionLabel="Nouveau Devis"
                onAction={() => openModal()}
                primaryColor={primaryColor}
                isDarkMode={isDarkMode}
            />

            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher par client..." cardBg={cardBg} />

            <div className={`rounded-3xl border shadow-sm overflow-hidden ${cardBg}`}>
                {loading ? <div className="p-8 text-center text-gray-400">Chargement...</div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`text-xs font-semibold uppercase ${tableHeaderBg}`}>
                                    <th className="p-4 pl-6">Client</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Statut</th>
                                    <th className="p-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y text-sm ${divideClass}`}>
                                {currentItems.map(d => (
                                    <tr key={d.id} className={`transition group ${rowHover}`}>
                                        <td className="p-4 pl-6 font-semibold flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shadow-sm" style={{ backgroundColor: primaryColor }}><User size={14} /></div>
                                            {getClientName(d.client)}
                                        </td>
                                        <td className="p-4 opacity-80"><span className="flex items-center gap-1.5"><Calendar size={14} /> {d.date_creation}</span></td>
                                        <td className="p-4 font-bold">{calculateLinesTotal(d.lignes).toLocaleString()} Ar</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatutClass(d.statut)}`}>{d.statut}</span>
                                        </td>
                                        <td className="p-4 pr-6 text-right space-x-1">
                                            {d.statut !== 'ACCEPTE' && <button onClick={() => handleStatusChange(d, 'ACCEPTE')} title="Accepter" className={`${actionButton} text-green-500 hover:bg-green-500/10`}><Check size={18} /></button>}
                                            {d.statut !== 'REFUSE' && <button onClick={() => handleStatusChange(d, 'REFUSE')} title="Refuser" className={`${actionButton} text-amber-500 hover:bg-amber-500/10`}><XCircle size={18} /></button>}
                                            <button onClick={() => openModal(d)} title="Modifier" className={`${actionButton} text-blue-500 hover:bg-blue-500/10`}><Edit3 size={18} /></button>
                                            <button onClick={() => setToRemove(d)} title="Supprimer" className={`${actionButton} text-red-500 hover:bg-red-500/10`}><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && (
                    <Pagination
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        totalItems={visible.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        isDarkMode={isDarkMode}
                    />
                )}
            </div>

            {isModalOpen && (
                <Modal>
                    <div className={`rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto border animate-in zoom-in-95 duration-200 ${cardBg}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editingId ? 'Modifier' : 'Nouveau'} Devis</h3>
                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer p-2 rounded-full transition-all hover:bg-gray-500/20 active:scale-95"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FormField label="Client *" error={errors.client}>
                                    <select value={formData.client} onChange={updateField('client')} className={field}>
                                        <option value="">-- Choisir --</option>
                                        {clientsList.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Statut" error={errors.statut}>
                                    <select value={formData.statut} onChange={updateField('statut')} className={field}>
                                        {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Date" error={errors.date_creation}>
                                    <input type="date" value={formData.date_creation} onChange={updateField('date_creation')} className={field} />
                                </FormField>
                            </div>

                            <div className="pt-4 border-t border-gray-700/30">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-sm flex items-center gap-2"><ShoppingCart size={16} /> Lignes de devis</span>
                                    <button type="button" onClick={handleAddLine} className="cursor-pointer text-xs px-3 py-1.5 rounded-lg border border-gray-500/30 transition-all hover:bg-gray-500/10 active:scale-95 font-semibold"> + Ajouter Ligne</button>
                                </div>
                                {formData.lignes.map((l, i) => (
                                    <div key={i} className="mb-2">
                                        <div className="flex gap-2 items-center">
                                            <select value={l.service} onChange={e => handleLineChange(i, 'service', e.target.value)} className={`flex-1 p-2 rounded-xl border text-sm ${inputBg}`}>
                                                <option value="">-- Service --</option>
                                                {servicesList.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                                            </select>
                                            <input type="number" min="1" step="1" value={l.quantite} onChange={e => handleLineChange(i, 'quantite', e.target.value)} placeholder="Qté" className={`w-20 p-2 rounded-xl border text-sm text-center ${inputBg}`} />
                                            <input type="number" min="0" step="0.01" value={l.prix_unitaire} onChange={e => handleLineChange(i, 'prix_unitaire', e.target.value)} placeholder="Prix U." className={`w-32 p-2 rounded-xl border text-sm ${inputBg}`} />
                                            <button type="button" onClick={() => handleRemoveLine(i)} className="cursor-pointer p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all hover:scale-110 active:scale-95"><Trash2 size={16} /></button>
                                        </div>
                                        <FieldError message={errors.lignes?.[i]} />
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer flex-1 py-3 rounded-xl border border-gray-500/30 transition-all hover:bg-gray-500/10 active:scale-95 font-semibold">Annuler</button>
                                <button type="submit" style={{ backgroundColor: primaryColor }} className="cursor-pointer flex-1 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md">Enregistrer Devis</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            {toRemove && (
                <ConfirmDeleteModal
                    title="Supprimer le devis"
                    name={`Devis #${toRemove.id}`}
                    cardBg={cardBg}
                    onCancel={() => setToRemove(null)}
                    onConfirm={doDelete}
                />
            )}

            <Notification notification={notification} />
        </div>
    );
}
