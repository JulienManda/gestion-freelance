import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const REVENUE_MONTH_INDEX = 8;

const hexToRgba = (hex, opacity = 0.15) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${opacity})`;
};

function StatCard({ label, value, caption, valueClass = 'text-4xl', captionClass = 'text-gray-400', cardClass, iconClass }) {
    return (
        <div className={`p-6 rounded-3xl border relative cursor-pointer transition ${cardClass}`}>
            <div className="flex justify-between items-start mb-4">
                <p className="font-medium text-gray-400">{label}</p>
                <div className={`border p-1.5 rounded-full ${iconClass}`}><ArrowUpRight size={16} className="text-gray-400" /></div>
            </div>
            <h2 className={`${valueClass} font-bold mb-4`}>{value}</h2>
            <p className={`text-xs ${captionClass}`}>{caption}</p>
        </div>
    );
}

export default function Dashboard({ clients = [], devis = [], factures = [], paiements = [], primaryColor = '#185e45', isDarkMode = false }) {
    const devisEnAttente = devis.filter(d => d.statut === 'ATTENTE').length;
    const chiffreAffairesTotal = paiements.reduce((acc, p) => acc + parseFloat(p.montant || 0), 0);

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client ? client.nom : 'Client inconnu';
    };

    const chartData = {
        labels: MONTHS,
        datasets: [
            {
                fill: true,
                label: "Chiffre d'affaires (Ar)",
                data: MONTHS.map((_, i) => (i === REVENUE_MONTH_INDEX ? chiffreAffairesTotal : 0)),
                borderColor: primaryColor,
                backgroundColor: hexToRgba(primaryColor, 0.15),
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: primaryColor,
                pointBorderColor: '#ffffff',
                pointRadius: 4,
            },
        ],
    };

    const tickColor = isDarkMode ? '#9ca3af' : '#6b7280';
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' },
                ticks: { color: tickColor },
            },
            x: {
                grid: { display: false },
                ticks: { color: tickColor },
            },
        },
    };

    const cardBgClass = isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 border-gray-100 text-gray-900';
    const subCardBgClass = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';

    const getStatutColor = (statut) => {
        if (statut === 'ACCEPTE') {
            return isDarkMode ? 'text-green-400 bg-green-950/40 border-green-800' : 'text-green-700 bg-green-50 border-green-200';
        }
        return isDarkMode ? 'text-amber-400 bg-amber-950/40 border-amber-800' : 'text-amber-700 bg-amber-50 border-amber-200';
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-8 mt-2">
                <div>
                    <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tableau de bord</h1>
                    <p className="text-gray-400 text-sm">Gérez votre activité, vos clients et vos paiements.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/devis"
                        className="text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Plus size={16} /> Créer un Devis
                    </Link>
                    <Link
                        to="/clients"
                        className={`border px-5 py-2.5 rounded-full text-sm font-semibold transition shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        Nouveau Client
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div
                    className="text-white p-6 rounded-3xl shadow-sm relative overflow-hidden group cursor-pointer transition-all"
                    style={{ backgroundColor: primaryColor }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <p className="font-medium text-white/90">Chiffre d'affaires</p>
                        <div className="bg-white/20 p-1.5 rounded-full"><ArrowUpRight size={16} /></div>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{chiffreAffairesTotal.toLocaleString()} Ar</h2>
                    <p className="text-xs text-white/80 flex items-center gap-1">↑ Total encaissé</p>
                </div>

                <StatCard label="Devis en attente" value={devisEnAttente} caption="En attente de signature" cardClass={cardBgClass} iconClass={subCardBgClass} />
                <StatCard label="Factures" value={factures.length} caption="Total factures enregistrées" valueClass="text-3xl" captionClass="text-gray-400 font-semibold" cardClass={cardBgClass} iconClass={subCardBgClass} />
                <StatCard label="Total Clients" value={clients.length} caption="Actifs dans la base" cardClass={cardBgClass} iconClass={subCardBgClass} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`p-6 rounded-3xl border col-span-1 flex flex-col justify-between ${cardBgClass}`}>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <TrendingUp size={18} style={{ color: primaryColor }} /> Évolution CA
                            </h3>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${subCardBgClass}`}>Annuel</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">Courbe de progression des encaissements.</p>
                    </div>

                    <div className="my-auto py-2">
                        <Line data={chartData} options={chartOptions} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-500/20 text-center">
                        <span className="text-xs text-gray-400 font-medium">Données synchronisées en temps réel</span>
                    </div>
                </div>

                <div className={`p-6 rounded-3xl border col-span-2 flex flex-col ${cardBgClass}`}>
                    <h3 className="font-bold text-lg mb-4">Activité Récente (Devis)</h3>
                    <div className="flex-1 flex flex-col justify-center">
                        {devis.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-8">Aucun devis récent pour le moment.</p>
                        ) : (
                            <div className="space-y-3">
                                {devis.slice(0, 4).map(d => {
                                    const clientNom = getClientName(d.client);

                                    return (
                                        <div key={d.id} className={`flex justify-between items-center p-4 rounded-2xl border transition ${subCardBgClass}`}>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-sm"
                                                    style={{ backgroundColor: primaryColor }}
                                                >
                                                    {clientNom.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className={`font-bold block text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{clientNom}</span>
                                                    <span className="text-xs text-gray-400">Créé le {d.date_creation || 'Récemment'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatutColor(d.statut)}`}>
                                                    {d.statut}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">{d.date_creation}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
