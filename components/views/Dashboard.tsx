import React from 'react';
import type { AppView, UserPermissions } from '../../types';

interface DashboardProps {
    onScan: () => void;
    onNavigate: (view: AppView) => void;
    permissions?: UserPermissions;
}

// FIX: Refactored NavButton to use React.FC with an explicit props interface to fix a TypeScript error where the 'key' prop was being incorrectly type-checked.
interface NavButtonProps {
    icon: string;
    label: string;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center transition-transform transform hover:scale-105 hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 aspect-square"
    >
        <i className={`${icon} text-4xl mb-4 text-indigo-400`}></i>
        <span className="text-base font-semibold text-white">{label}</span>
    </button>
);

const Dashboard: React.FC<DashboardProps> = ({ onScan, onNavigate, permissions }) => {
    
    // Default to a restricted view if permissions are not yet loaded
    const p = permissions || {
        canScan: false,
        canViewServiceList: false,
        canViewClients: false,
        canViewScheduledServices: false,
        canViewHistory: false,
        canViewSettings: false,
        canManageUsers: false,
    };

    const navButtons = [
        { icon: 'fas fa-list-alt', label: 'Urządzenia w Serwisie', view: 'serviceList' as AppView, permission: p.canViewServiceList },
        { icon: 'fas fa-users', label: 'Klienci', view: 'clients' as AppView, permission: p.canViewClients },
        { icon: 'fas fa-calendar-alt', label: 'Serwisy Zaplanowane', view: 'scheduledServices' as AppView, permission: p.canViewScheduledServices },
        { icon: 'fas fa-history', label: 'Historia', view: 'history' as AppView, permission: p.canViewHistory },
        { icon: 'fas fa-cog', label: 'Ustawienia', view: 'settings' as AppView, permission: p.canViewSettings },
    ];
    
    const availableButtons = navButtons.filter(button => button.permission);
    
    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
            
            {/* Primary Scan Button */}
            {p.canScan && (
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
            )}

            {/* Navigation Buttons */}
            {availableButtons.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                    {availableButtons.map(button => (
                        <NavButton 
                            key={button.view}
                            icon={button.icon}
                            label={button.label}
                            onClick={() => onNavigate(button.view)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;