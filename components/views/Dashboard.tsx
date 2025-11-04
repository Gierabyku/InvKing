import React from 'react';
import type { AppView } from '../../types';

interface DashboardProps {
    onScan: () => void;
    onNavigate: (view: AppView) => void;
}

const NavButton = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void; }) => (
    <button
        onClick={onClick}
        className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center transition-transform transform hover:scale-105 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 aspect-square"
    >
        <i className={`${icon} text-4xl mb-4 text-indigo-400`}></i>
        <span className="text-base font-semibold text-white">{label}</span>
    </button>
);

const Dashboard: React.FC<DashboardProps> = ({ onScan, onNavigate }) => {
    const navButtons = [
        { icon: 'fas fa-list-alt', label: 'Urządzenia w Serwisie', view: 'serviceList' as AppView },
        { icon: 'fas fa-users', label: 'Klienci', view: 'clients' as AppView },
        { icon: 'fas fa-history', label: 'Historia', view: 'history' as AppView },
        { icon: 'fas fa-cog', label: 'Ustawienia', view: 'settings' as AppView },
    ];
    
    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
            
            {/* Primary Scan Button */}
            <div className="mb-8">
                <button 
                    onClick={onScan}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg p-8 flex flex-col sm:flex-row items-center justify-center text-center transition-transform transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                >
                    <i className="fas fa-qrcode text-5xl sm:mr-6 mb-4 sm:mb-0"></i>
                    <div>
                        <h2 className="text-2xl font-bold">Skanuj Urządzenie</h2>
                        <p className="text-indigo-200">Przyjmij nowe zlecenie lub zaktualizuj istniejące</p>
                    </div>
                </button>
            </div>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {navButtons.map(button => (
                    <NavButton 
                        key={button.view}
                        icon={button.icon}
                        label={button.label}
                        onClick={() => onNavigate(button.view)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
