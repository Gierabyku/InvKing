import React from 'react';
import type { HistoryEntry } from '../../types';

interface HistoryProps {
    history: HistoryEntry[];
    onBack: () => void;
}

const History: React.FC<HistoryProps> = ({ history, onBack }) => {

    const getIconForType = (type: HistoryEntry['type']) => {
        switch (type) {
            case 'Utworzono':
                return 'fas fa-plus-circle text-green-400';
            case 'Zmiana Statusu':
                return 'fas fa-sync-alt text-blue-400';
            case 'Dodano Notatkę':
                return 'fas fa-comment-dots text-yellow-400';
            case 'Edycja Danych':
                return 'fas fa-pencil-alt text-purple-400';
            default:
                return 'fas fa-history text-gray-400';
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold text-white mb-6">Ostatnia Aktywność</h2>
            {history.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                    <i className="fas fa-history fa-3x mb-4"></i>
                    <h2 className="text-xl font-semibold">Brak historii zdarzeń</h2>
                    <p>Wszystkie zmiany w zleceniach pojawią się tutaj.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map(entry => (
                        <div key={entry.docId} className="bg-gray-800 p-4 rounded-lg flex items-start">
                             <div className="w-10 text-center mr-4">
                                <i className={`${getIconForType(entry.type)} text-2xl`}></i>
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-white">{entry.type}</p>
                                    <p className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString('pl-PL')}</p>
                                </div>
                                <p className="text-sm text-gray-300">{entry.details}</p>
                                <div className="text-xs text-gray-500 mt-2">
                                     <span>Urządzenie: <span className="font-medium text-gray-400">{entry.serviceItemName}</span></span>
                                     <span className="mx-2">|</span>
                                     <span>Użytkownik: <span className="font-medium text-gray-400">{entry.user}</span></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
             <div className="mt-8 text-center">
                 <button onClick={onBack} className="px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors font-semibold">
                    Wróć do pulpitu
                </button>
            </div>
        </div>
    );
};

export default History;