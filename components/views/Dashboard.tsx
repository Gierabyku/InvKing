import React from 'react';
import type { AppView } from '../../types';

interface DashboardProps {
    onScan: () => void;
    onNavigate: (view: AppView) => void;
}

const DashboardButton = ({ icon, label, onClick, isPrimary = false }: { icon: string; label: string; onClick: () => void, isPrimary?: boolean }) => (
    <button 
        onClick={onClick} 
        className={`rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 aspect-square ${
            isPrimary 
                ? 'bg-indigo-600 hover:bg-indigo-500 col-span-2' 
                : 'bg-gray-800 hover:bg-gray-700'
        }`}
    >
        <i className={`${icon} ${isPrimary ? 'text-white' : 'text-indigo-400'} text-4xl mb-4`}></i>
        <span className="text-base md:text-lg font-semibold text-white">{label}</span>
    </button>
);


const Dashboard: React.FC<DashboardProps> = ({ onScan, onNavigate }) => {
    return (
        <div className="grid grid-cols-2 gap-4 p-4">
            <DashboardButton icon="fas fa-qrcode" label="Skanuj Urządzenie" onClick={onScan} isPrimary={true} />
            <DashboardButton icon="fas fa-tools" label="Urządzenia w Serwisie" onClick={() => onNavigate('serviceList')} />
            <DashboardButton icon="fas fa-users" label="Klienci" onClick={() => onNavigate('clients')} />
            <DashboardButton icon="fas fa-history" label="Historia" onClick={() => onNavigate('history')} />
            <DashboardButton icon="fas fa-cog" label="Ustawienia" onClick={() => onNavigate('settings')} />
        </div>
    );
};

export default Dashboard;