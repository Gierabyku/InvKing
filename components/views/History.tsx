import React, { useState, useMemo } from 'react';
import type { HistoryEntry } from '../../types';

interface HistoryProps {
    history: HistoryEntry[];
    onBack: () => void;
    error: string | null;
}

const History: React.FC<HistoryProps> = ({ history, onBack, error }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');

    const historyTypes: HistoryEntry['type'][] = ['Utworzono', 'Zmiana Statusu', 'Dodano Notatkę', 'Edycja Danych'];

    const filteredHistory = useMemo(() => {
        let tempHistory = [...history];

        // Type filter
        if (selectedType !== 'all') {
            tempHistory = tempHistory.filter(entry => entry.type === selectedType);
        }

        // Search filter
        if (searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            tempHistory = tempHistory.filter(entry =>
                entry.details.toLowerCase().includes(lowerCaseQuery) ||
                entry.serviceItemName.toLowerCase().includes(lowerCaseQuery) ||
                entry.user.toLowerCase().includes(lowerCaseQuery)
            );
        }

        return tempHistory; // Already sorted by Firestore
    }, [history, searchQuery, selectedType]);
    
    const handleReset = () => {
        setSearchQuery('');
        setSelectedType('all');
    };

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

    const renderContent = () => {
        if (error) {
            return (
                <div className="text-center text-red-400 bg-red-900/50 p-6 rounded-lg mt-10">
                    <i className="fas fa-exclamation-triangle fa-3x mb-4"></i>
                    <h2 className="text-xl font-semibold text-white">Błąd Wczytywania Historii</h2>
                    <p className="mt-2 text-red-300">{error}</p>
                </div>
            );
        }

        if (history.length === 0 && searchQuery === '' && selectedType === 'all') {
            return (
                <div className="text-center text-gray-400 mt-20">
                    <i className="fas fa-history fa-3x mb-4"></i>
                    <h2 className="text-xl font-semibold">Brak historii zdarzeń</h2>
                    <p>Wszystkie zmiany w zleceniach pojawią się tutaj.</p>
                </div>
            );
        }
        
        if (filteredHistory.length === 0) {
            return (
                 <div className="text-center text-gray-400 mt-20">
                    <i className="fas fa-search fa-3x mb-4"></i>
                    <h2 className="text-xl font-semibold">Brak wyników</h2>
                    <p>Nie znaleziono zdarzeń pasujących do Twoich kryteriów.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {filteredHistory.map(entry => (
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
        );
    };

    return (
        <div className="p-4">
            <div className="sticky top-[72px] bg-gray-900/80 backdrop-blur-sm z-10 p-4 mb-6 rounded-lg border border-gray-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Wyszukaj po szczegółach, urządzeniu, użytkowniku..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                     <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Wszystkie Typy Zdarzeń</option>
                        {historyTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                 <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500 transition-colors font-semibold"
                >
                    Resetuj Filtry
                </button>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-6">Ostatnia Aktywność</h2>
            {renderContent()}
             <div className="mt-8 text-center">
                 <button onClick={onBack} className="px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors font-semibold">
                    Wróć do pulpitu
                </button>
            </div>
        </div>
    );
};

export default History;