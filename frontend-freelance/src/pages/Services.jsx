import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, AlignLeft, Tag, Trash2, Edit3, X } from 'lucide-react';
import { api } from '../utils/api';
import { getTheme } from '../utils/theme';
import { sortByIdDesc, trimValues } from '../utils/helpers';
import { checkText, checkNumber, hasErrors } from '../utils/validators';
import useNotification from '../hooks/useNotification';
import usePagination from '../hooks/usePagination';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Notification from '../components/Notification';

const ITEMS_PER_PAGE = 4;
const MAX_PRICE = 99999999.99;
const EMPTY_FORM = { nom: '', description: '', prix_base: '' };

const validateService = (data) => ({
    nom: checkText(data.nom, 'Le nom du service', { required: true, min: 2, max: 150 }),
    prix_base: checkNumber(data.prix_base, 'Le prix de base', { positive: true, max: MAX_PRICE, decimals: 2 }),
    description: checkText(data.description, 'La description', { max: 1000 }),
});

export default function Services({ isDarkMode = false, primaryColor = '#185e45' }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [delService, setDelService] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [notification, showNotification] = useNotification();

    const { cardBg, field, tableHeaderBg, divideClass, rowHover } = getTheme(isDarkMode, true);

    const loadServices = () => {
        axios.get(api('services/'))
            .then(res => {
                setServices(sortByIdDesc(res.data));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadServices(); }, []);

    const search = searchTerm.toLowerCase();
    const results = services.filter(s =>
        s.nom.toLowerCase().includes(search) ||
        (s.description && s.description.toLowerCase().includes(search))
    );

    const { currentPage, setCurrentPage, currentItems, totalPages } = usePagination(results, ITEMS_PER_PAGE, searchTerm);

    const openModal = (service = null) => {
        setEditingId(service ? service.id : null);
        setFormData(service
            ? { nom: service.nom, description: service.description || '', prix_base: service.prix_base || '' }
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
        const errs = validateService(payload);
        setErrors(errs);
        if (hasErrors(errs)) return;

        const req = editingId
            ? axios.put(api(`services/${editingId}/`), payload)
            : axios.post(api('services/'), payload);

        req.then(() => {
            setIsModalOpen(false);
            loadServices();
            if (!editingId) setCurrentPage(1);
            showNotification(`Service ${editingId ? 'mis à jour' : 'ajouté'} avec succès !`);
        }).catch(() => showNotification("Erreur lors de l'opération.", 'error'));
    };

    const handleDelete = () => {
        if (!delService) return;
        axios.delete(api(`services/${delService.id}/`))
            .then(() => {
                setDelService(null);
                loadServices();
                showNotification('Service supprimé avec succès !');
            })
            .catch(() => {
                setDelService(null);
                showNotification('Suppression impossible : ce service est utilisé dans des devis.', 'error');
            });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <PageHeader
                title="Catalogue des Services"
                subtitle="Gérez les prestations et produits que vous proposez."
                actionLabel="Nouveau Service"
                onAction={() => openModal()}
                primaryColor={primaryColor}
                isDarkMode={isDarkMode}
            />

            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher par nom ou description..." cardBg={cardBg} />

            <div className={`rounded-3xl border shadow-sm overflow-hidden ${cardBg}`}>
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Chargement...</div>
                ) : results.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Package size={48} className="mx-auto mb-3 opacity-50" />
                        <p>Aucun service trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`text-xs font-semibold uppercase ${tableHeaderBg}`}>
                                    <th className="p-4 pl-6">Service</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Prix Base</th>
                                    <th className="p-4 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y text-sm ${divideClass}`}>
                                {currentItems.map(s => (
                                    <tr key={s.id} className={`transition group ${rowHover}`}>
                                        <td className="p-4 pl-6 font-semibold flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
                                                <Package size={16} />
                                            </div>
                                            {s.nom}
                                        </td>
                                        <td className="p-4 opacity-80">
                                            <div className="flex items-center gap-2 max-w-xs truncate">
                                                <AlignLeft size={15} className="shrink-0 opacity-50" />
                                                <span className="truncate">{s.description || 'Aucune description'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Tag size={15} className="opacity-50" />
                                                {s.prix_base ? `${Number(s.prix_base).toLocaleString()} Ar` : '-'}
                                            </div>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(s)} className="cursor-pointer p-2 text-blue-500 transition-all duration-200 hover:bg-blue-500/10 rounded-lg hover:scale-110 active:scale-95"><Edit3 size={18} /></button>
                                                <button onClick={() => setDelService(s)} className="cursor-pointer p-2 text-red-500 transition-all duration-200 hover:bg-red-500/10 rounded-lg hover:scale-110 active:scale-95"><Trash2 size={18} /></button>
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
                        totalItems={results.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        isDarkMode={isDarkMode}
                    />
                )}
            </div>

            {isModalOpen && (
                <Modal>
                    <div className={`rounded-3xl shadow-xl max-w-md w-full p-6 border animate-in zoom-in-95 duration-200 ${cardBg}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editingId ? 'Modifier' : 'Nouveau'} Service</h3>
                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer p-2 rounded-full transition-all hover:bg-gray-500/20 active:scale-95"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            <FormField label="Nom du service *" error={errors.nom}>
                                <input type="text" maxLength={150} value={formData.nom} onChange={updateField('nom')} className={field} />
                            </FormField>
                            <FormField label="Prix de base (Ar) *" error={errors.prix_base}>
                                <input type="number" min="0" step="0.01" value={formData.prix_base} onChange={updateField('prix_base')} className={field} />
                            </FormField>
                            <FormField label="Description" error={errors.description}>
                                <textarea rows="3" maxLength={1000} value={formData.description} onChange={updateField('description')} className={`${field} resize-none`} />
                            </FormField>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer flex-1 py-3 rounded-xl border border-gray-500/30 transition-all hover:bg-gray-500/10 active:scale-95 font-semibold">Annuler</button>
                                <button type="submit" style={{ backgroundColor: primaryColor }} className="cursor-pointer flex-1 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-95 shadow-md">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            {delService && (
                <ConfirmDeleteModal
                    title="Supprimer le service"
                    name={delService.nom}
                    cardBg={cardBg}
                    onCancel={() => setDelService(null)}
                    onConfirm={handleDelete}
                />
            )}

            <Notification notification={notification} />
        </div>
    );
}
