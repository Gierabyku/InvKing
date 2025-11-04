import React from 'react';
import type { AppView, Client } from '../types';

interface HeaderProps {
    currentView: AppView;
    onBack: () => void;
    client?: Client | null;
}

const Header: React.FC<HeaderProps> = ({ currentView, onBack, client }) => {
    const getTitle = () => {
        const defaultTitle = 'Menedżer Serwisu';
        const titles: { [key in AppView]?: string } = {
            dashboard: defaultTitle,
            serviceList: 'Urządzenia w Serwisie',
            clients: 'Klienci',
            history: 'Historia',
            settings: 'Ustawienia',
        };

        if (currentView === 'clientDetail' && client) {
            return client.companyName || client.name || 'Szczegóły Klienta';
        }
        
        return titles[currentView] || defaultTitle;
    };

    const title = getTitle();

    return (
        <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 p-4 shadow-md">
            <div className="container mx-auto flex items-center justify-between">
                <div className="w-10">
                    {currentView !== 'dashboard' && (
                        <button onClick={onBack} className="text-white hover:text-indigo-400 transition-colors">
                            <i className="fas fa-chevron-left text-lg"></i>
                        </button>
                    )}
                </div>
                <div className="flex items-center text-center">
                    <i className="fas fa-tools text-indigo-400 text-2xl mr-3"></i>
                    <h1 className="text-xl font-bold text-white tracking-wider truncate">{title}</h1>
                </div>
                <div className="w-10"></div>
            </div>
        </header>
    );
};

export default Header;