import React from 'react';
import type { AppView } from '../../types';

interface DashboardProps {
    onScanAdd: () => void;
    onScanCheck: () => void;
    onNavigate: (view: AppView) => void;
}

const DashboardButton = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
    <button onClick={onClick} className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center transition-transform transform hover:scale-105 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <i className={`${icon} text-indigo-400 text-4xl mb-4`}></i>
        <span className="text-lg font-semibold text-white">{label}</span>
    </button>
);


const Dashboard: React.FC<DashboardProps> = ({ onScanAdd, onScanCheck, onNavigate }) => {
    return (
        <div className="grid grid-cols-2 gap-4 p-4">
            <DashboardButton icon="fas fa-plus-circle" label="Skanuj (Dodaj)" onClick={onScanAdd} />
            <DashboardButton icon="fas fa-search" label="Skanuj (Sprawdź)" onClick={onScanCheck} />
            <DashboardButton icon="fas fa-boxes" label="Asortyment" onClick={() => onNavigate('inventory')} />
            <DashboardButton icon="fas fa-history" label="Historia" onClick={() => onNavigate('history')} />
            <DashboardButton icon="fas fa-cog" label="Ustawienia" onClick={() => onNavigate('settings')} />
        </div>
    );
};

export default Dashboard;