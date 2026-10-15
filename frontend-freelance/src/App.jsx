import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileText, CreditCard,
  Settings, LogOut, AlertTriangle, Menu, X
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Devis from './pages/Devis';
import Factures from './pages/Factures';
import Configuration from './pages/Configuration';
import Auth from './pages/Auth';
import { api } from './utils/api';

function MainLayout({ user, setUser, onLogout }) {
  const [clients, setClients] = useState([]);
  const [devis, setDevis] = useState([]);
  const [factures, setFactures] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const primaryColor = user.primaryColor || '#185e45';
  const isDarkMode = user.darkMode || false;

  const loadData = () => {
    const token = localStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Token ${token}` } : {};

    fetch(api('clients/'), { headers })
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => console.error("Erreur chargement clients:", err));

    fetch(api('devis/'), { headers })
      .then(res => res.json())
      .then(data => setDevis(data))
      .catch(err => console.error("Erreur chargement devis:", err));

    fetch(api('factures/'), { headers })
      .then(res => res.json())
      .then(data => setFactures(data))
      .catch(err => console.error("Erreur chargement factures:", err));

    fetch(api('paiements/'), { headers })
      .then(res => res.json())
      .then(data => setPaiements(data))
      .catch(err => console.error("Erreur chargement paiements:", err));
  };

  useEffect(() => {
    loadData();
    setSidebarOpen(false); // ferme le menu mobile après navigation
  }, [location]);

  const navClass = ({ isActive }) =>
    `flex items-center justify-between p-3 rounded-xl transition relative ${isActive
      ? 'font-bold'
      : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')
    }`;

  const renderActiveIndicator = (isActive) =>
    isActive ? (
      <div
        className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md"
        style={{ backgroundColor: primaryColor }}
      ></div>
    ) : null;

  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'FA';

  return (
    <div
      className={`flex h-dvh font-sans p-2 sm:p-4 gap-4 w-full relative transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'
        }`}
    >
      {/* FOND SOMBRE DU MENU MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* BARRE LATÉRALE (tiroir sur mobile, fixe sur grand écran) */}
      <aside
        className={`w-64 max-w-[85vw] rounded-3xl flex flex-col p-6 shadow-sm shrink-0 overflow-y-auto transition-all duration-300 fixed top-2 bottom-2 left-2 z-40 sm:top-4 sm:bottom-4 sm:left-4 lg:static lg:z-auto lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'} ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'
          }`}
      >
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-8 h-8 rounded-full border-4 border-t-transparent"
            style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
          ></div>
          <span className={`text-xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {user.nomEntreprise || 'MonEspace'}
          </span>
        </div>

        <div className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Gestion</div>

        <nav className="flex flex-col gap-1 mb-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${navClass({ isActive })} ${isActive ? (isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-50') : ''
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex items-center gap-3 w-full" style={{ color: isActive ? primaryColor : undefined }}>
                {renderActiveIndicator(isActive)}
                <LayoutDashboard size={20} /> Tableau de bord
              </div>
            )}
          </NavLink>

          <NavLink
            to="/clients"
            className={({ isActive }) =>
              `${navClass({ isActive })} ${isActive ? (isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-50') : ''
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex items-center gap-3 w-full" style={{ color: isActive ? primaryColor : undefined }}>
                {renderActiveIndicator(isActive)}
                <Users size={20} /> Clients
              </div>
            )}
          </NavLink>

          <NavLink
            to="/services"
            className={({ isActive }) =>
              `${navClass({ isActive })} ${isActive ? (isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-50') : ''
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex items-center gap-3 w-full" style={{ color: isActive ? primaryColor : undefined }}>
                {renderActiveIndicator(isActive)}
                <Briefcase size={20} /> Services
              </div>
            )}
          </NavLink>

          <NavLink
            to="/devis"
            className={({ isActive }) =>
              `${navClass({ isActive })} ${isActive ? (isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-50') : ''
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex items-center gap-3 w-full" style={{ color: isActive ? primaryColor : undefined }}>
                {renderActiveIndicator(isActive)}
                <FileText size={20} /> Devis
              </div>
            )}
          </NavLink>

          <NavLink
            to="/factures"
            className={({ isActive }) =>
              `${navClass({ isActive })} ${isActive ? (isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-50') : ''
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex items-center gap-3 w-full" style={{ color: isActive ? primaryColor : undefined }}>
                {renderActiveIndicator(isActive)}
                <CreditCard size={20} /> Factures
              </div>
            )}
          </NavLink>
        </nav>

        <div className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Paramètres</div>
        <nav className="flex flex-col gap-1 mt-auto">
          <NavLink
            to="/configuration"
            className={({ isActive }) =>
              `${navClass({ isActive })} ${isActive ? (isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-50') : ''
              }`
            }
          >
            {({ isActive }) => (
              <div className="flex items-center gap-3 w-full" style={{ color: isActive ? primaryColor : undefined }}>
                {renderActiveIndicator(isActive)}
                <Settings size={20} /> Configuration
              </div>
            )}
          </NavLink>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-3 text-gray-400 hover:text-red-500 p-3 rounded-xl transition w-full text-left"
          >
            <LogOut size={20} /> Déconnexion
          </button>
        </nav>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main
        className={`flex-1 min-w-0 flex flex-col rounded-3xl p-4 sm:p-8 shadow-sm overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border border-gray-800 text-white' : 'bg-white text-gray-900'
          }`}
      >
        <header className="flex justify-between lg:justify-end items-center mb-2 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-xl ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-3 p-1.5 sm:pr-4 rounded-full border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'
                }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {initials}
              </div>
              <div className="text-xs hidden sm:block">
                <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.username}</p>
                <p className="text-gray-400">{user.email || 'contact@freelance.com'}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          <Routes>
            <Route path="/" element={<Dashboard clients={clients} devis={devis} factures={factures} paiements={paiements} primaryColor={primaryColor} isDarkMode={isDarkMode} />} />
            <Route path="/clients" element={<Clients isDarkMode={isDarkMode} primaryColor={primaryColor} />} />
            <Route path="/services" element={<Services isDarkMode={isDarkMode} primaryColor={primaryColor} />} />
            <Route path="/devis" element={<Devis refreshData={loadData} isDarkMode={isDarkMode} primaryColor={primaryColor} />} />
            <Route path="/factures" element={<Factures refreshData={loadData} user={user} isDarkMode={isDarkMode} primaryColor={primaryColor} />} />
            <Route path="/configuration" element={<Configuration user={user} setUser={setUser} />} />
          </Routes>
        </div>
      </main>

      {/* MODALE DE CONFIRMATION DE DÉCONNEXION */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in">
          <div
            className={`rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center border ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900'
              }`}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Confirmer la déconnexion</h3>
            <p className="text-xs text-gray-400 mb-6">
              Êtes-vous sûr de vouloir vous déconnecter de votre espace professionnel ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Annuler
              </button>
              <button
                onClick={onLogout}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition shadow-sm"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    return saved
      ? JSON.parse(saved)
      : {
        username: 'Admin',
        email: 'contact@freelance.com',
        nomEntreprise: 'MonEspace',
        activite: 'Community Management & Design',
        primaryColor: '#185e45',
        darkMode: false
      };
  });

  const handleLogin = (userData, authToken) => {
    setUser({
      ...userData,
      primaryColor: userData.primaryColor || '#185e45',
      darkMode: userData.darkMode || false
    });
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    setToken(null);
  };

  return (
    <Router>
      {token ? (
        <MainLayout user={user} setUser={setUser} onLogout={handleLogout} />
      ) : (
        <Auth onLogin={handleLogin} />
      )}
    </Router>
  );
}