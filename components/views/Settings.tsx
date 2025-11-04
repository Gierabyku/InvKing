import React from 'react';

interface SettingsProps {
    onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
    return (
        <div className="text-center text-gray-400 mt-20">
            <i className="fas fa-cog fa-3x mb-4"></i>
            <h2 className="text-xl font-semibold">Ustawienia</h2>
            <p className="mb-6">Ta funkcja będzie dostępna wkrótce!</p>
             <button onClick={onBack} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">
                Wróć
            </button>
        </div>
    );
};

export default Settings;