import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, Mail, Phone, User, Trash2, Edit3, X } from 'lucide-react';
import { api } from '../utils/api';
import { getTheme } from '../utils/theme';
import { sortByIdDesc, trimValues } from '../utils/helpers';
import { checkText, checkEmail, checkPhone, hasErrors } from '../utils/validators';
import useNotification from '../hooks/useNotification';
import usePagination from '../hooks/usePagination';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Notification from '../components/Notification';

const ITEMS_PER_PAGE = 3;
const EMPTY_FORM = { nom: '', entreprise: '', email: '', telephone: '' };

const validateClient = (data) => ({
    nom: checkText(data.nom, 'Le nom', { required: true, min: 2, max: 150 }),
    entreprise: checkText(data.entreprise, "Le nom de l'entreprise", { max: 150 }),
    email: checkEmail(data.email),
    telephone: checkPhone(data.telephone, { required: true }),
});

export default function Clients({ isDarkMode = false, primaryColor = '#185e45' }) {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [notification, showNotification] = useNotification();

    const { cardBg, field, tableHeaderBg, divideClass, rowHover } = getTheme(isDarkMode, true);

    const getClients = () => {
        axios.get(api('clients/'))
            .then(res => {
                setClients(sortByIdDesc(res.data));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { getClients(); }, []);

    const q = searchTerm.toLowerCase();
    const filtered = clients.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        (c.entreprise && c.entreprise.toLowerCase().includes(q)) ||
        (c.email || '').toLowerCase().includes(q)
    );

    const { currentPage, setCurrentPage, currentItems, totalPages } = usePagination(filtered, ITEMS_PER_PAGE, searchTerm);

    const openModal = (client = null) => {
        setEditingId(client ? client.id : null);
        setFormData(client
            ? { nom: client.nom, entreprise: client.entreprise || '', email: client.email || '', telephone: client.telephone || '' }
            : EMPTY_FORM);
        setErrors({});
        setIsModalOpen(true);
    };

    const updateField = (name) => (e) => {
        setFormData({ ...formData, [name]: e.target.value });
        setErrors({ ...errors, [name]: '' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = trimValues(formData);
        const newErrors = validateClient(payload);
        setErrors(newErrors);
        if (hasErrors(newErrors)) return;

        const req = editingId
            ? axios.put(api(`clients/${editingId}/`), payload)
            : axios.post(api('clients/'), payload);

        req.then(() => {
            setIsModalOpen(false);
            getClients();
            if (!editingId) setCurrentPage(1);
            showNotification(`Client ${editingId ? 'mis à jour' : 'ajouté'} avec succès !`);
        }).catch(() => showNotification("Erreur lors de l'opération.", 'error'));
    };

    const removeClient = () => {
        if (!toDelete) return;
        axios.delete(api(`clients/${toDelete.id}/`))
            .then(() => {
                setToDelete(null);
                getClients();
                showNotification('Client supprimé avec succès !');
            })
            .catch(() => {
                setToDelete(null);
                showNotification('Suppression impossible : ce client est lié à des devis.', 'error');
            });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <PageHeader
                title="Gestion des Clients"
                subtitle="Gérez votre portefeuille clients et leurs contacts."
                actionLabel="Nouveau Client"
                onAction={() => openModal()}
                primaryColor={primaryColor}
                isDarkMode={isDarkMode}
            />

            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher par nom, entreprise ou email..." cardBg={cardBg} />

            <div className={`rounded-3xl border shadow-sm overflow-hidden ${cardBg}`}>
                {loading ? (
                    <div className="p-8 text-center text-gray-500 font-medium">Chargement des données...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <User size={48} className="mx-auto text-gray-400 mb-3 opacity-50" />
                        <p className="font-medium opacity-60">Aucun client trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`text-xs font-semibold uppercase tracking-wider ${tableHeaderBg}`}>
                                    <th className="p-4 pl-6">Client</th>
                                    <th className="p-4">Entreprise</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y text-sm ${divideClass}`}>
                                {currentItems.map(client => (
                                    <tr key={client.id} className={`transition-colors group ${rowHover}`}>
                                        <td className="p-4 pl-6 font-semibold flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                                                {client.nom.substring(0, 2)}
                                            </div>
                                            {client.nom}
                                        </td>
                                        <td className="p-4 opacity-80">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={15} className="opacity-50" />
                                                {client.entreprise || <span className="italic opacity-50">Indépendant</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 opacity-80">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-2"><Mail size={14} className="opacity-50" /> {client.email}</span>
                                                {client.telephone && <span className="flex items-center gap-2"><Phone size={14} className="opacity-50" /> {client.telephone}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(client)} className="cursor-pointer p-2 rounded-lg text-blue-500 transition-all duration-200 hover:bg-blue-500/10 hover:scale-110 active:scale-95"><Edit3 size={18} /></button>
                                                <button onClick={() => setToDelete(client)} className="cursor-pointer p-2 rounded-lg text-red-500 transition-all duration-200 hover:bg-red-500/10 hover:scale-110 active:scale-95"><Trash2 size={18} /></button>
                                            </div>
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
                        totalItems={filtered.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        isDarkMode={isDarkMode}
                    />
                )}
            </div>

            {isModalOpen && (
                <Modal>
                    <div className={`rounded-3xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200 ${cardBg}`}>
                        <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                            <h3 className="text-xl font-bold">{editingId ? 'Modifier le client' : 'Nouveau client'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer p-2 rounded-full transition-all hover:bg-gray-500/20 active:scale-95"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
                            <FormField label="Nom *" error={errors.nom}>
                                <input type="text" maxLength={150} value={formData.nom} onChange={updateField('nom')} className={field} />
                            </FormField>
                            <FormField label="Entreprise" error={errors.entreprise}>
                                <input type="text" maxLength={150} value={formData.entreprise} onChange={updateField('entreprise')} className={field} />
                            </FormField>
                            <FormField label="Email *" error={errors.email}>
                                <input type="email" maxLength={254} value={formData.email} onChange={updateField('email')} className={field} />
                            </FormField>
                            <FormField label="Téléphone" error={errors.telephone}>
                                <input type="text" maxLength={20} value={formData.telephone} onChange={updateField('telephone')} className={field} />
                            </FormField>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer flex-1 py-3 rounded-xl border border-gray-500/30 transition-all hover:bg-gray-500/10 active:scale-95 font-semibold">Annuler</button>
                                <button type="submit" style={{ backgroundColor: primaryColor }} className="cursor-pointer flex-1 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md">{editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            {toDelete && (
                <ConfirmDeleteModal
                    title="Supprimer le client"
                    name={toDelete.nom}
                    cardBg={cardBg}
                    onCancel={() => setToDelete(null)}
                    onConfirm={removeClient}
                />
            )}

            <Notification notification={notification} />
        </div>
    );
}
