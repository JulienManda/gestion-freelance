import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import axios from 'axios';
import { api } from '../utils/api';
import { getTheme } from '../utils/theme';
import { getSafeId, getLignesArray, calculateLinesTotal, readStoredProfile, todayISO } from '../utils/helpers';
import { checkDate, checkNumber, hasErrors } from '../utils/validators';
import useNotification from '../hooks/useNotification';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Notification from '../components/Notification';

const PAYMENT_METHODS = [
    { value: 'Virement', label: 'Virement bancaire' },
    { value: 'Mobile Money', label: 'Mobile Money' },
    { value: 'Espèces', label: 'Espèces' },
    { value: 'Chèque', label: 'Chèque' },
];

const PRINT_STYLES = `
    @page {
        size: auto;
        margin: 0mm;
    }
    @media print {
        body * { visibility: hidden; }
        #zone-impression, #zone-impression * { visibility: visible; }
        #zone-impression { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 2cm; 
            background: white !important; 
            color: black !important; 
        }
    }
`;

export default function Factures({ refreshData, user = {}, isDarkMode = false, primaryColor = '#185e45' }) {
    const [factures, setFactures] = useState([]);
    const [devisList, setDevisList] = useState([]);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [paiements, setPaiements] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});
    const [notification, showNotification] = useNotification(4000);

    const [showModal, setShowModal] = useState(false);
    const [selectedDevis, setSelectedDevis] = useState('');
    const [dateEcheance, setDateEcheance] = useState('');

    const [showPaiementModal, setShowPaiementModal] = useState(false);
    const [currentFacture, setCurrentFacture] = useState(null);
    const [montantPaiement, setMontantPaiement] = useState('');
    const [moyenPaiement, setMoyenPaiement] = useState('Virement');

    const [showPrintModal, setShowPrintModal] = useState(false);
    const [factureToPrint, setFactureToPrint] = useState(null);

    const profile = user.nomEntreprise ? user : readStoredProfile();
    const { cardBg, field, tableHeaderBg, divideClass, rowHover } = getTheme(isDarkMode);

    const fetchList = (endpoint, setter) =>
        axios.get(api(`${endpoint}/`))
            .then(res => setter(Array.isArray(res.data) ? res.data : []))
            .catch(() => setter([]));

    const fetchData = () => {
        fetchList('factures', setFactures);
        fetchList('devis', setDevisList);
        fetchList('clients', setClients);
        fetchList('services', setServices);
        fetchList('paiements', setPaiements);
    };

    useEffect(() => { fetchData(); }, []);

    const calculerTotalFacture = (devisIdOrObj) => {
        const devisId = getSafeId(devisIdOrObj);
        const d = devisList.find(item => item.id === devisId);
        return d ? calculateLinesTotal(getLignesArray(d.lignes)) : 0;
    };

    const calculerTotalPaye = (factureId) =>
        paiements
            .filter(p => getSafeId(p.facture) === getSafeId(factureId))
            .reduce((acc, p) => acc + parseFloat(p.montant || 0), 0);

    const getClientInfo = (devisIdOrObj) => {
        const devisId = getSafeId(devisIdOrObj);
        const d = devisList.find(item => item.id === devisId);
        const clientId = d ? getSafeId(d.client) : null;
        const c = clientId ? clients.find(item => item.id === clientId) : null;
        return c ? { nomComplet: c.nom, entreprise: c.entreprise || '' } : { nomComplet: 'Client inconnu', entreprise: '' };
    };

    const getServiceName = (serviceIdOrObj) => {
        const id = getSafeId(serviceIdOrObj);
        const s = services.find(item => item.id === id);
        return s ? s.nom : `Service #${id}`;
    };

    const getFactureSummary = (facture) => {
        const total = calculerTotalFacture(facture.devis);
        const paye = calculerTotalPaye(facture.id);
        return {
            total,
            paye,
            reste: Math.max(0, total - paye),
            estSolde: paye >= total && total > 0,
            client: getClientInfo(facture.devis),
        };
    };

    const devisSansFacture = devisList.filter(d =>
        d.statut === 'ACCEPTE' && !factures.some(f => getSafeId(f.devis) === d.id)
    );

    const facturesFiltrees = factures.filter(f => {
        const info = getClientInfo(f.devis);
        return `${f.id} ${info.nomComplet} ${info.entreprise}`.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const openFactureModal = () => {
        setErrors({});
        setShowModal(true);
    };

    const openPaiementModal = (facture, reste) => {
        setCurrentFacture(facture);
        setMontantPaiement(reste);
        setErrors({});
        setShowPaiementModal(true);
    };

    const handleCreateFacture = (e) => {
        e.preventDefault();
        const validationErrors = {
            devis: devisSansFacture.some(d => String(d.id) === String(selectedDevis)) ? '' : 'Choisissez un devis accepté.',
            date_echeance: checkDate(dateEcheance, "La date d'échéance", { min: todayISO() }),
        };
        setErrors(validationErrors);
        if (hasErrors(validationErrors)) return;

        axios.post(api('factures/'), { devis: getSafeId(selectedDevis), date_echeance: dateEcheance })
            .then(() => {
                setShowModal(false);
                setSelectedDevis('');
                setDateEcheance('');
                fetchData();
                if (refreshData) refreshData();
                showNotification('Facture générée avec succès !');
            })
            .catch(() => showNotification('Erreur lors de la création de la facture.', 'error'));
    };

    const handleAddPaiement = (e) => {
        e.preventDefault();
        const { reste } = getFactureSummary(currentFacture);
        const montantSaisi = parseFloat(montantPaiement);

        let montantError = checkNumber(montantPaiement, 'Le montant', { positive: true, decimals: 2 });
        if (!montantError && montantSaisi > reste) {
            montantError = `Impossible d'encaisser plus que le reste à payer (${reste.toLocaleString()} Ar).`;
        }
        const validationErrors = {
            montant: montantError,
            moyen: PAYMENT_METHODS.some(m => m.value === moyenPaiement) ? '' : 'Moyen de paiement invalide.',
        };
        setErrors(validationErrors);
        if (hasErrors(validationErrors)) return;

        axios.post(api('paiements/'), {
            facture: currentFacture.id,
            montant: montantSaisi,
            moyen: moyenPaiement,
        }).then(() => {
            setShowPaiementModal(false);
            fetchData();
            if (refreshData) refreshData();
            showNotification('Paiement enregistré avec succès !');
        }).catch(() => showNotification("Erreur lors de l'enregistrement du paiement.", 'error'));
    };

    const paiementSummary = currentFacture ? getFactureSummary(currentFacture) : null;

    const getInvoiceDetails = (facture) => {
        const devisId = getSafeId(facture.devis);
        const total = calculerTotalFacture(devisId);
        const paye = calculerTotalPaye(facture.id);
        const devisAssocie = devisList.find(d => d.id === devisId);
        return {
            info: getClientInfo(devisId),
            total,
            paye,
            reste: total - paye,
            lignes: getLignesArray(devisAssocie?.lignes),
        };
    };

    const invoice = showPrintModal && factureToPrint ? getInvoiceDetails(factureToPrint) : null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <style>{PRINT_STYLES}</style>

            <PageHeader
                title="Gestion des Factures"
                subtitle="Suivi des factures, paiements échelonnés et encaissements."
                actionLabel="Générer une Facture"
                onAction={openFactureModal}
                primaryColor={primaryColor}
                isDarkMode={isDarkMode}
                iconSize={16}
            />

            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher (Client, Entreprise, N°)..." cardBg={cardBg} />

            <div className={`rounded-3xl border shadow-sm overflow-hidden ${cardBg}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-xs font-semibold uppercase ${tableHeaderBg}`}>
                                <th className="p-4">Facture #</th>
                                <th className="p-4">Client</th>
                                <th className="p-4">Dates</th>
                                <th className="p-4">Total</th>
                                <th className="p-4">Payé / Reste</th>
                                <th className="p-4">Statut</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y text-sm ${divideClass}`}>
                            {facturesFiltrees.map(f => {
                                const { total, paye, reste, estSolde, client } = getFactureSummary(f);

                                return (
                                    <tr key={f.id} className={`transition group ${rowHover}`}>
                                        <td className="p-4 font-bold">Facture #{f.id}</td>
                                        <td className="p-4">
                                            <span className="font-bold block text-[15px]">{client.nomComplet}</span>
                                            {client.entreprise && <span className="text-xs opacity-60 block">{client.entreprise}</span>}
                                        </td>
                                        <td className="p-4 text-xs opacity-70">
                                            <span className="block">{f.date_emission}</span>
                                            <span className="block opacity-60">Éch : {f.date_echeance}</span>
                                        </td>
                                        <td className="p-4 font-bold">{total.toLocaleString()} Ar</td>

                                        <td className="p-4">
                                            <span className={`font-bold block text-[15px] ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                                                {paye.toLocaleString()} Ar
                                            </span>
                                            {!estSolde && (
                                                <span className={`block text-xs font-medium mt-0.5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                                    Reste : {reste.toLocaleString()} Ar
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${estSolde ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                                {estSolde ? 'Soldée' : 'En attente'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            <button onClick={() => { setFactureToPrint(f); setShowPrintModal(true); }} className="cursor-pointer px-3 py-1.5 border border-gray-500/30 rounded-lg text-xs font-semibold transition-all hover:bg-gray-500/10 active:scale-95">
                                                Voir
                                            </button>
                                            {!estSolde && (
                                                <button onClick={() => openPaiementModal(f, reste)} style={{ backgroundColor: primaryColor }} className="cursor-pointer text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all hover:opacity-90 active:scale-95">
                                                    Encaisser
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <Modal>
                    <div className={`rounded-3xl p-6 max-w-md w-full border animate-in zoom-in-95 duration-200 ${cardBg}`}>
                        <h3 className="text-xl font-bold mb-4">Générer une Facture</h3>
                        <form onSubmit={handleCreateFacture} noValidate className="space-y-4">
                            <FormField label="Devis Accepté disponible" error={errors.devis}>
                                <select value={selectedDevis} onChange={e => { setSelectedDevis(e.target.value); setErrors({ ...errors, devis: '' }); }} className={field}>
                                    <option value="">-- Choisir un devis --</option>
                                    {devisSansFacture.map(d => {
                                        const clientInfo = getClientInfo(d.id);
                                        return (
                                            <option key={d.id} value={d.id}>
                                                {clientInfo.nomComplet} {clientInfo.entreprise ? `— ${clientInfo.entreprise}` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </FormField>
                            <FormField label="Date d'échéance" error={errors.date_echeance}>
                                <input type="date" min={todayISO()} value={dateEcheance} onChange={e => { setDateEcheance(e.target.value); setErrors({ ...errors, date_echeance: '' }); }} className={field} />
                            </FormField>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="cursor-pointer flex-1 py-2.5 border border-gray-500/30 rounded-xl transition-all hover:bg-gray-500/10 active:scale-95 font-semibold">Annuler</button>
                                <button type="submit" style={{ backgroundColor: primaryColor }} className="cursor-pointer flex-1 py-2.5 text-white rounded-xl font-semibold shadow-md transition-all hover:opacity-90 active:scale-95">Créer</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            {showPaiementModal && currentFacture && (
                <Modal>
                    <div className={`rounded-3xl p-6 max-w-md w-full border animate-in zoom-in-95 duration-200 ${cardBg}`}>
                        <h3 className="text-xl font-bold mb-4">Enregistrer un Paiement</h3>

                        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <p className="text-sm font-bold flex justify-between">
                                <span>Reste à payer :</span>
                                <span>{paiementSummary.reste.toLocaleString()} Ar</span>
                            </p>
                        </div>

                        <form onSubmit={handleAddPaiement} noValidate className="space-y-4">
                            <FormField label="Montant à encaisser (Ar)" error={errors.montant}>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    max={paiementSummary.reste}
                                    value={montantPaiement}
                                    onChange={e => { setMontantPaiement(e.target.value); setErrors({ ...errors, montant: '' }); }}
                                    className={`${field} font-bold`}
                                />
                            </FormField>
                            <FormField label="Moyen de paiement" error={errors.moyen}>
                                <select value={moyenPaiement} onChange={e => setMoyenPaiement(e.target.value)} className={field}>
                                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </FormField>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowPaiementModal(false)} className="cursor-pointer flex-1 py-2.5 border border-gray-500/30 rounded-xl transition-all hover:bg-gray-500/10 active:scale-95 font-semibold">Annuler</button>
                                <button type="submit" style={{ backgroundColor: primaryColor }} className="cursor-pointer flex-1 py-2.5 text-white rounded-xl font-semibold shadow-md transition-all hover:opacity-90 active:scale-95">Valider</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            {invoice && (
                <Modal overlayClass="bg-black/70">
                    <div className="bg-white text-gray-900 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center pb-4 border-b mb-6">
                            <h3 className="font-bold text-lg">Aperçu de la Facture</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setShowPrintModal(false)} className="cursor-pointer px-4 py-2 border rounded-xl text-xs font-semibold transition-all hover:bg-gray-100 active:scale-95">Fermer</button>
                                <button onClick={() => window.print()} style={{ backgroundColor: primaryColor }} className="cursor-pointer text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:opacity-90 active:scale-95"><Printer size={14} /> Imprimer</button>
                            </div>
                        </div>

                        <div id="zone-impression" className="space-y-6">
                            <div className="flex justify-between">
                                <div>
                                    <h2 className="text-3xl font-black" style={{ color: primaryColor }}>FACTURE</h2>
                                    <p className="font-bold text-gray-500">N° FAC-{factureToPrint.id.toString().padStart(4, '0')}</p>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                    <p className="text-base font-bold text-gray-900">{profile?.nomEntreprise || 'MonEspace'}</p>
                                    <p>{profile?.activite}</p>
                                    <p>{profile?.email}</p>
                                    <p>{profile?.telephone}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl text-xs">
                                <p className="font-bold text-gray-400 uppercase">Facturé à :</p>
                                <p className="text-sm font-bold text-gray-900">{invoice.info.nomComplet}</p>
                                {invoice.info.entreprise && <p className="text-gray-600">{invoice.info.entreprise}</p>}
                            </div>

                            <table className="w-full text-left text-xs border-collapse">
                                <thead><tr className="border-b-2 border-gray-900"><th className="py-2">Prestation</th><th className="py-2 text-right">Total</th></tr></thead>
                                <tbody>
                                    {invoice.lignes.map((l, i) => (
                                        <tr key={i} className="border-b border-gray-100">
                                            <td className="py-2">{getServiceName(l.service)} (x{l.quantite})</td>
                                            <td className="py-2 text-right font-bold">{(l.quantite * parseFloat(l.prix_unitaire)).toLocaleString()} Ar</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="text-right text-sm font-bold pt-4 border-t">
                                <p>Total : {invoice.total.toLocaleString()} Ar</p>
                                <p className="text-green-600">Montant réglé : {invoice.paye.toLocaleString()} Ar</p>
                                <p style={{ color: primaryColor }} className="text-lg">Reste à payer : {invoice.reste > 0 ? invoice.reste.toLocaleString() : '0'} Ar</p>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            <Notification notification={notification} />
        </div>
    );
}
