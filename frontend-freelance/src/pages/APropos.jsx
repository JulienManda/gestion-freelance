import React, { useState } from 'react';
import { getTheme } from '../utils/theme';

const MATRICULE = '3368/24 : Manda';

const TABLES = [
    {
        name: 'utilisateur',
        cols: [
            ['id', 'INT', 'PK, AUTO_INCREMENT', 'Identifiant unique'],
            ['nom_entreprise', 'VARCHAR(150)', 'NOT NULL', "Nom de l'activité ou de l'entreprise"],
            ['nom_admin', 'VARCHAR(150)', 'NOT NULL', 'Nom du responsable du compte'],
            ['email', 'VARCHAR(254)', 'NOT NULL, UNIQUE', 'Identifiant de connexion'],
            ['mot_de_passe', 'VARCHAR(255)', 'NOT NULL', 'Mot de passe haché (jamais en clair)'],
            ['activite', 'VARCHAR(150)', 'NULL', "Domaine d'activité"],
            ['telephone', 'VARCHAR(20)', 'NULL', 'Contact téléphonique'],
        ],
    },
    {
        name: 'client',
        cols: [
            ['id', 'INT', 'PK, AUTO_INCREMENT', 'Identifiant unique'],
            ['nom', 'VARCHAR(150)', 'NOT NULL', 'Nom du client'],
            ['entreprise', 'VARCHAR(150)', 'NULL', 'Entreprise du client'],
            ['email', 'VARCHAR(254)', 'NULL', 'Adresse e-mail'],
            ['telephone', 'VARCHAR(20)', 'NULL', 'Téléphone'],
            ['utilisateur_id', 'INT', 'FK, NOT NULL', 'Utilisateur propriétaire du client'],
        ],
    },
    {
        name: 'service',
        cols: [
            ['id', 'INT', 'PK, AUTO_INCREMENT', 'Identifiant unique'],
            ['nom', 'VARCHAR(150)', 'NOT NULL', 'Nom de la prestation'],
            ['description', 'TEXT', 'NULL', 'Détail de la prestation'],
            ['prix_base', 'DECIMAL(10,2)', 'NOT NULL, CHECK (>= 0)', 'Prix de référence'],
            ['utilisateur_id', 'INT', 'FK, NOT NULL', 'Utilisateur propriétaire du service'],
        ],
    },
    {
        name: 'devis',
        cols: [
            ['id', 'INT', 'PK, AUTO_INCREMENT', 'Identifiant unique'],
            ['date_creation', 'DATE', 'NOT NULL', 'Date de création du devis'],
            ['statut', 'VARCHAR(20)', "NOT NULL, DEFAULT 'en_attente', CHECK", 'en_attente, accepte ou refuse'],
            ['client_id', 'INT', 'FK, NOT NULL', 'Client destinataire du devis'],
        ],
    },
    {
        name: 'ligne_devis',
        cols: [
            ['id', 'INT', 'PK, AUTO_INCREMENT', 'Identifiant unique'],
            ['quantite', 'INT', 'NOT NULL, DEFAULT 1, CHECK (> 0)', 'Quantité commandée'],
            ['prix_unitaire', 'DECIMAL(10,2)', 'NOT NULL, CHECK (>= 0)', 'Prix appliqué au moment du devis'],
            ['devis_id', 'INT', 'FK, NOT NULL', 'Devis auquel la ligne appartient'],
            ['service_id', 'INT', 'FK, NOT NULL', 'Service concerné'],
        ],
    },
    {
        name: 'facture',
        cols: [
            ['id', 'INT', 'PK, AUTO_INCREMENT', 'Identifiant unique'],
            ['date_emission', 'DATE', 'NOT NULL', "Date d'émission"],
            ['date_echeance', 'DATE', 'NOT NULL, CHECK (>= date_emission)', 'Date limite de paiement'],
            ['devis_id', 'INT', 'FK, NOT NULL, UNIQUE', 'Devis facturé (un devis = une facture au plus)'],
        ],
    },
    {
        name: 'paiement',
        cols: [
            ['id', 'INT', 'PK, AUTO_INCREMENT', 'Identifiant unique'],
            ['montant', 'DECIMAL(10,2)', 'NOT NULL, CHECK (> 0)', 'Montant versé'],
            ['date_paiement', 'DATE', 'NOT NULL', 'Date du paiement'],
            ['moyen', 'VARCHAR(50)', 'NULL', 'Espèces, mobile money, virement…'],
            ['facture_id', 'INT', 'FK, NOT NULL', 'Facture réglée'],
        ],
    },
];

const FOREIGN_KEYS = [
    ['client.utilisateur_id', 'utilisateur(id)', 'CASCADE', 'Supprimer un compte supprime ses données propres'],
    ['service.utilisateur_id', 'utilisateur(id)', 'CASCADE', 'Idem'],
    ['devis.client_id', 'client(id)', 'RESTRICT', "On ne supprime pas un client qui a des devis"],
    ['ligne_devis.devis_id', 'devis(id)', 'CASCADE', "Les lignes n'existent que dans leur devis"],
    ['ligne_devis.service_id', 'service(id)', 'RESTRICT', 'Un service utilisé dans un devis est conservé'],
    ['facture.devis_id', 'devis(id)', 'RESTRICT', 'Une facture émise protège son devis'],
    ['paiement.facture_id', 'facture(id)', 'RESTRICT', 'Un paiement enregistré protège sa facture'],
];

const PASSAGE = [
    'Association (1,n) – (1,1) : la clé primaire du côté 1 devient clé étrangère du côté n (client → devis, utilisateur → client, utilisateur → service, facture → paiement).',
    'Association porteuse de données (devis – service, avec quantite et prix_unitaire) : transformée en table ligne_devis, dont les deux clés étrangères identifient la ligne.',
    'Association (0,1) – (1,1) : la clé étrangère est placée du côté (1,1) avec une contrainte UNIQUE (facture.devis_id), ce qui garantit au plus une facture par devis.',
];

const NORMALISATION = [
    ['1FN', "Tous les attributs sont atomiques, aucun champ multivalué ni groupe répétitif (les lignes d'un devis sont dans leur propre table)."],
    ['2FN', "Chaque table a une clé primaire simple (id), donc aucune dépendance partielle possible."],
    ['3FN', "Aucun attribut non-clé ne dépend d'un autre attribut non-clé. Les informations du client ne sont pas recopiées dans devis ou facture : elles sont retrouvées par jointure."],
    ['Données calculées', "Non stockées : total d'un devis = SUM(quantite × prix_unitaire), montant payé = SUM(paiement.montant), solde restant = total − montant payé. Les stocker créerait une redondance et un risque d'incohérence."],
    ['Cas particulier assumé', "prix_unitaire (ligne_devis) peut différer de service.prix_base. Ce n'est pas une redondance mais un historique : le prix facturé doit rester figé même si le tarif du service change plus tard."],
    ["Isolation par utilisateur", "Seuls client et service portent utilisateur_id. Devis, facture et paiement sont rattachés à l'utilisateur par leur chaîne de clés étrangères, ce qui évite une dépendance transitive."],
];

const kindOf = (c) => (c[2].startsWith('PK') ? 'pk' : c[2].startsWith('FK') ? 'fk' : 'col');

const BOX_W = 200;
const HEAD_H = 32;
const ROW_H = 22;

const POSITIONS = {
    utilisateur: { x: 20, y: 20 },
    client: { x: 280, y: 20 },
    devis: { x: 540, y: 20 },
    facture: { x: 800, y: 20 },
    service: { x: 280, y: 260 },
    ligne_devis: { x: 540, y: 260 },
    paiement: { x: 800, y: 210 },
};

const tableByName = (name) => TABLES.find((t) => t.name === name);
const boxHeight = (name) => HEAD_H + tableByName(name).cols.length * ROW_H;
const rowY = (name, col) => {
    const index = tableByName(name).cols.findIndex((c) => c[0] === col);
    return POSITIONS[name].y + HEAD_H + index * ROW_H + ROW_H / 2;
};

const yClient = rowY('client', 'utilisateur_id');
const yDevis = rowY('devis', 'client_id');
const yFacture = rowY('facture', 'devis_id');
const yService = rowY('service', 'utilisateur_id');
const yLigne = rowY('ligne_devis', 'service_id');
const bottomOf = (name) => POSITIONS[name].y + boxHeight(name);

const LINKS = [
    { pts: [[220, yClient], [280, yClient]], from: '1', to: 'n' },
    { pts: [[120, bottomOf('utilisateur')], [120, yService], [280, yService]], from: '1', to: 'n' },
    { pts: [[480, yDevis], [540, yDevis]], from: '1', to: 'n' },
    { pts: [[640, bottomOf('devis')], [640, POSITIONS.ligne_devis.y]], from: '1', to: 'n' },
    { pts: [[480, yLigne], [540, yLigne]], from: '1', to: 'n' },
    { pts: [[740, yFacture], [800, yFacture]], from: '0,1', to: '1,1' },
    { pts: [[900, bottomOf('facture')], [900, POSITIONS.paiement.y]], from: '1', to: 'n' },
];

const placeLabel = (p, q, atStart) => {
    if (p[1] === q[1]) {
        return atStart
            ? { x: p[0] + 4, y: p[1] - 5, anchor: 'start' }
            : { x: q[0] - 4, y: q[1] - 5, anchor: 'end' };
    }
    return atStart
        ? { x: p[0] + 6, y: p[1] + 14, anchor: 'start' }
        : { x: q[0] + 6, y: q[1] - 6, anchor: 'start' };
};

function Diagram({ primaryColor, isDarkMode }) {
    const c = isDarkMode
        ? { card: '#111827', line: '#374151', text: '#f3f4f6', mute: '#9ca3af', fkBg: '#3a2c0a', fkText: '#fbbf24' }
        : { card: '#ffffff', line: '#e5e7eb', text: '#111827', mute: '#6b7280', fkBg: '#fbf1dc', fkText: '#7a5200' };

    return (
        <svg
            viewBox="0 0 1020 430"
            className="w-full min-w-215 h-auto"
            role="img"
            aria-label="Schéma des 7 tables de la base de données et de leurs relations"
        >
            <title>Schéma des tables et de leurs relations</title>

            {LINKS.map((link, i) => {
                const first = placeLabel(link.pts[0], link.pts[1], true);
                const last = placeLabel(link.pts[link.pts.length - 2], link.pts[link.pts.length - 1], false);
                return (
                    <g key={i}>
                        <polyline
                            points={link.pts.map((p) => p.join(',')).join(' ')}
                            fill="none"
                            stroke={c.mute}
                            strokeWidth="1.5"
                        />
                        <text x={first.x} y={first.y} textAnchor={first.anchor} fontSize="11" fontWeight="700" fill={c.mute}>
                            {link.from}
                        </text>
                        <text x={last.x} y={last.y} textAnchor={last.anchor} fontSize="11" fontWeight="700" fill={c.mute}>
                            {link.to}
                        </text>
                    </g>
                );
            })}

            {TABLES.map((t) => {
                const { x, y } = POSITIONS[t.name];
                const h = boxHeight(t.name);
                return (
                    <g key={t.name}>
                        <rect x={x} y={y} width={BOX_W} height={h} rx="12" fill={c.card} stroke={c.line} />
                        <path
                            d={`M${x},${y + HEAD_H} V${y + 12} a12,12 0 0 1 12,-12 H${x + BOX_W - 12} a12,12 0 0 1 12,12 V${y + HEAD_H} Z`}
                            fill={primaryColor}
                        />
                        <text x={x + 14} y={y + 21} fontSize="13" fontWeight="700" fill="#ffffff">
                            {t.name}
                        </text>
                        {t.cols.map((col, i) => {
                            const k = kindOf(col);
                            const top = y + HEAD_H + i * ROW_H;
                            const mid = top + ROW_H / 2;
                            return (
                                <g key={col[0]}>
                                    {i > 0 && <line x1={x} x2={x + BOX_W} y1={top} y2={top} stroke={c.line} />}
                                    <text
                                        x={x + 14}
                                        y={mid + 4}
                                        fontSize="12"
                                        fontFamily="ui-monospace, Menlo, Consolas, monospace"
                                        fill={c.text}
                                        fontWeight={k === 'pk' ? 700 : 400}
                                        fontStyle={k === 'fk' ? 'italic' : 'normal'}
                                        textDecoration={k === 'pk' ? 'underline' : 'none'}
                                    >
                                        {k === 'fk' ? `#${col[0]}` : col[0]}
                                    </text>
                                    {k !== 'col' && (
                                        <g>
                                            <rect
                                                x={x + BOX_W - 38}
                                                y={mid - 7}
                                                width="26"
                                                height="14"
                                                rx="7"
                                                fill={k === 'pk' ? primaryColor : c.fkBg}
                                            />
                                            <text
                                                x={x + BOX_W - 25}
                                                y={mid + 3}
                                                fontSize="9"
                                                fontWeight="700"
                                                textAnchor="middle"
                                                fill={k === 'pk' ? '#ffffff' : c.fkText}
                                            >
                                                {k === 'pk' ? 'PK' : 'FK'}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                );
            })}
        </svg>
    );
}

export default function APropos({ isDarkMode = false, primaryColor = '#185e45' }) {
    const [current, setCurrent] = useState(TABLES[0].name);
    const { cardBg, tableHeaderBg, divideClass, rowHover } = getTheme(isDarkMode);
    const mute = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const table = tableByName(current);
    const headCell = 'text-left font-semibold px-4 py-3 whitespace-nowrap';
    const h2 = 'text-lg font-bold mt-10 mb-3';

    return (
        <div className="max-w-5xl mx-auto pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">À propos</h1>
                    <p className={`text-sm max-w-xl ${mute}`}>
                        Modèle physique de données (MPD) de l'application de gestion freelance : devis, factures et paiements.
                    </p>
                </div>
                <div className="rounded-2xl px-4 py-2.5 text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                    <p className="text-xs opacity-80">Matricule</p>
                    <p className="font-bold">{MATRICULE}</p>
                </div>
            </div>

            <h2 className={h2}>Schéma des tables</h2>
            <div className={`rounded-2xl border p-3 sm:p-5 overflow-x-auto ${cardBg}`}>
                <Diagram primaryColor={primaryColor} isDarkMode={isDarkMode} />
                <p className={`text-xs mt-3 ${mute}`}>
                    <b>PK</b> : clé primaire · <b>FK</b> : clé étrangère · 1 / n : une ligne de la table de gauche ou du haut est liée à plusieurs lignes de l'autre.
                </p>
            </div>

            <h2 className={h2}>Notation</h2>
            <ul className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <li>Nom de table en gras, attributs entre parenthèses</li>
                <li>Clé primaire : <b><u className="font-mono">id</u></b></li>
                <li>Clé étrangère : <i className="font-mono">#client_id</i></li>
            </ul>

            <h2 className={h2}>Schéma relationnel</h2>
            <ul className={`rounded-2xl border overflow-hidden divide-y ${cardBg} ${divideClass}`}>
                {TABLES.map((t) => (
                    <li key={t.name} className="px-4 sm:px-5 py-3 text-sm font-mono leading-7 break-words">
                        <b style={{ color: primaryColor }}>{t.name}</b> (
                        {t.cols.map((col, i) => {
                            const k = kindOf(col);
                            return (
                                <span key={col[0]}>
                                    {k === 'pk' ? <b><u>{col[0]}</u></b> : k === 'fk' ? <i>#{col[0]}</i> : col[0]}
                                    {i < t.cols.length - 1 ? ', ' : ''}
                                </span>
                            );
                        })}
                        )
                    </li>
                ))}
            </ul>

            <h2 className={h2}>Dictionnaire des données</h2>
            <div className="flex flex-wrap gap-2 mb-4">
                {TABLES.map((t) => {
                    const active = t.name === current;
                    return (
                        <button
                            key={t.name}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setCurrent(t.name)}
                            style={active ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                            className={`cursor-pointer font-mono text-sm px-3.5 py-1.5 rounded-full border transition ${active
                                ? 'text-white'
                                : (isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50')
                                }`}
                        >
                            {t.name}
                        </button>
                    );
                })}
            </div>
            <div className={`rounded-2xl border overflow-x-auto ${cardBg}`}>
                <table className="w-full text-sm min-w-160">
                    <thead className={tableHeaderBg}>
                        <tr>
                            <th className={headCell}>Colonne</th>
                            <th className={headCell}>Type MySQL</th>
                            <th className={headCell}>Contraintes</th>
                            <th className={headCell}>Description</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${divideClass}`}>
                        {table.cols.map((col) => (
                            <tr key={col[0]} className={rowHover}>
                                <td className="px-4 py-3 font-mono font-bold">{col[0]}</td>
                                <td className="px-4 py-3 font-mono">{col[1]}</td>
                                <td className="px-4 py-3">{col[2]}</td>
                                <td className="px-4 py-3">{col[3]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2 className={h2}>Clés étrangères et règles de suppression</h2>
            <div className={`rounded-2xl border overflow-x-auto ${cardBg}`}>
                <table className="w-full text-sm min-w-160">
                    <thead className={tableHeaderBg}>
                        <tr>
                            <th className={headCell}>Clé étrangère</th>
                            <th className={headCell}>Référence</th>
                            <th className={headCell}>ON DELETE</th>
                            <th className={headCell}>Justification</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${divideClass}`}>
                        {FOREIGN_KEYS.map((f) => (
                            <tr key={f[0]} className={rowHover}>
                                <td className="px-4 py-3 font-mono">{f[0]}</td>
                                <td className="px-4 py-3 font-mono">{f[1]}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f[2] === 'CASCADE'
                                            ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                                            : (isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700')
                                            }`}
                                    >
                                        {f[2]}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{f[3]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className={`text-xs mt-3 ${mute}`}>Toutes les clés étrangères utilisent ON UPDATE CASCADE.</p>

            <h2 className={h2}>Règles de passage du MCD au MPD appliquées</h2>
            <ul className="grid gap-3">
                {PASSAGE.map((p) => (
                    <li key={p} className={`rounded-2xl border px-4 sm:px-5 py-3.5 text-sm ${cardBg}`}>{p}</li>
                ))}
            </ul>

            <h2 className={h2}>Vérification de la normalisation</h2>
            <ul className="grid gap-3">
                {NORMALISATION.map(([title, text]) => (
                    <li key={title} className={`rounded-2xl border px-4 sm:px-5 py-3.5 text-sm ${cardBg}`}>
                        <p className="font-bold mb-1" style={{ color: primaryColor }}>{title}</p>
                        <p>{text}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
