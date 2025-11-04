import React from 'react';
import type { ScanInputMode, OrgUser } from '../../types';

interface SettingsProps {
    currentMode: ScanInputMode;
    onModeChange: (mode: ScanInputMode) => void;
    isNfcQuickReadEnabled: boolean;
    onNfcQuickReadChange: (enabled: boolean) => void;
    onBack: () => void;
    orgUsers: OrgUser[];
    currentUser: OrgUser | null;
    onAddUser: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    currentMode, 
    onModeChange, 
    isNfcQuickReadEnabled, 
    onNfcQuickReadChange, 
    onBack,
    orgUsers,
    currentUser,
    onAddUser 
}) => {

    const options: { mode: ScanInputMode; icon: string; title: string; description: string }[] = [
        {
            mode: 'nfc',
            icon: 'fas fa-wifi',
            title: 'NFC',
            description: 'Skanuj tagi zbliżeniowe. Szybkie i proste.',
        },
        {
            mode: 'barcode',
            icon: 'fas fa-camera',
            title: 'Kod Kreskowy / QR',
            description: 'Użyj aparatu do skanowania kodów 1D i 2D.',
        },
        {
            mode: 'hybrid',
            icon: 'fas fa-random',
            title: 'Hybrydowy',
            description: 'Wybieraj metodę przed każdym skanowaniem.',
        },
    ];

    const isAdmin = currentUser?.isAdmin;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-white mb-6">Tryb Wprowadzania Danych</h2>
            <div className="space-y-4">
                {options.map(option => (
                    <button
                        key={option.mode}
                        onClick={() => onModeChange(option.mode)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center
                            ${currentMode === option.mode ? 'bg-indigo-900/50 border-indigo-500 shadow-lg' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                    >
                        <i className={`${option.icon} text-3xl w-12 text-center ${currentMode === option.mode ? 'text-indigo-400' : 'text-gray-400'}`}></i>
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-white">{option.title}</h3>
                            <p className="text-sm text-gray-400">{option.description}</p>
                        </div>
                        {currentMode === option.mode && (
                            <div className="ml-auto text-green-400">
                                <i className="fas fa-check-circle text-2xl"></i>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <h2 className="text-2xl font-bold text-white mb-6 mt-8">Ustawienia Skanowania</h2>
             <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Włącz Szybki Odczyt NFC</h3>
                    <p className="text-sm text-gray-400">Aktywuj skaner NFC po kliknięciu przycisku "Skanuj".</p>
                </div>
                <button
                    onClick={() => onNfcQuickReadChange(!isNfcQuickReadEnabled)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isNfcQuickReadEnabled ? 'bg-indigo-600' : 'bg-gray-600'}`}
                >
                    <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isNfcQuickReadEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                </button>
            </div>

            {isAdmin && (
                <>
                    <h2 className="text-2xl font-bold text-white mb-6 mt-8">Zarządzaj Użytkownikami</h2>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-end mb-4">
                            <button onClick={onAddUser} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold flex items-center">
                                <i className="fas fa-user-plus mr-2"></i>Dodaj Użytkownika
                            </button>
                        </div>
                        <div className="space-y-2">
                            {orgUsers.map(user => (
                                <div key={user.docId} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-white">{user.email}</p>
                                        <p className="text-xs text-gray-400">{user.isAdmin ? 'Administrator' : 'Użytkownik'}</p>
                                    </div>
                                    {/* Edit button can be added here */}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

             <div className="mt-8 text-center">
                 <button onClick={onBack} className="px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors font-semibold">
                    Wróć do pulpitu
                </button>
            </div>
        </div>
    );
};

export default Settings;