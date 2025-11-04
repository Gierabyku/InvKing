import React, { useState, useMemo } from 'react';
import type { ServiceItem, Client, ServiceStatus } from '../../types';
import ServiceCard from '../ServiceCard';

const ITEMS_PER_PAGE = 9;

interface ServiceListProps {
    items: ServiceItem[];
    clients: Client[];
    onEdit: (item: ServiceItem) => void;
    onDelete: (docId: string) => void;
    onGetAiTips: (item: ServiceItem) => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ items, clients, onEdit, onDelete, onGetAiTips }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [statusFilterOpen, setStatusFilterOpen] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<Record<ServiceStatus, boolean>>({
        'Przyjęty': false,
        'W trakcie diagnozy': false,
        'Oczekuje na części': false,
        'W trakcie naprawy': false,
        'Gotowy do odbioru': false,
        'Zwrócony klientowi': false,
    });
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    const filteredItems = useMemo(() => {
        let filtered = [...items];

        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.deviceName.toLowerCase().includes(lowerCaseQuery) ||
                item.clientName.toLowerCase().includes(lowerCaseQuery) ||
                (item.companyName && item.companyName.toLowerCase().includes(lowerCaseQuery)) ||
                item.id.toLowerCase().includes(lowerCaseQuery) ||
                item.reportedFault.toLowerCase().includes(lowerCaseQuery)
            );
        }

        if (selectedClientId) {
            filtered = filtered.filter(item => item.clientId === selectedClientId);
        }

        const activeStatusFilters = Object.entries(selectedStatuses)
            .filter(([, isSelected]) => isSelected)
            .map(([status]) => status as ServiceStatus);

        if (activeStatusFilters.length > 0) {
            filtered = filtered.filter(item => activeStatusFilters.includes(item.status));
        }

        return filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }, [items, searchQuery, selectedClientId, selectedStatuses]);

    const handleStatusChange = (status: ServiceStatus) => {
        setSelectedStatuses(prev => ({
            ...prev,
            [status]: !prev[status]
        }));
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedClientId('');
        setSelectedStatuses({
            'Przyjęty': false, 'W trakcie diagnozy': false, 'Oczekuje na części': false,
            'W trakcie naprawy': false, 'Gotowy do odbioru': false, 'Zwrócony klientowi': false
        });
        setVisibleCount(ITEMS_PER_PAGE);
    };
    
    const activeFilterCount = (selectedClientId ? 1 : 0) + Object.values(selectedStatuses).filter(v => v).length;

    const itemsToShow = filteredItems.slice(0, visibleCount);

    return (
        <div className="pb-20">
            <div className="sticky top-[72px] bg-gray-900/80 backdrop-blur-sm z-10 p-4 mb-6 rounded-lg border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    <div className="lg:col-span-2">
                        <input
                            type="text"
                            placeholder="Wyszukaj po urządzeniu, kliencie, ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Wszyscy Klienci</option>
                            {clients.sort((a,b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || '')).map(client => (
                                <option key={client.docId} value={client.docId}>{client.companyName || client.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <button onClick={() => setStatusFilterOpen(!statusFilterOpen)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center">
                            <span>
                                Filtruj Statusy {activeFilterCount > 0 && `(${activeFilterCount})`}
                            </span>
                            <i className={`fas fa-chevron-down transition-transform ${statusFilterOpen ? 'rotate-180' : ''}`}></i>
                        </button>
                        {statusFilterOpen && (
                            <div className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md p-4 space-y-2">
                                {Object.keys(selectedStatuses).map(status => (
                                    <label key={status} className="flex items-center space-x-2 text-white cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses[status as ServiceStatus]}
                                            onChange={() => handleStatusChange(status as ServiceStatus)}
                                            className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>{status}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500 transition-colors font-semibold"
                    >
                        Resetuj Filtry
                    </button>
                </div>
            </div>

            {itemsToShow.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                    <i className="fas fa-search fa-3x mb-4"></i>
                    <h2 className="text-xl font-semibold">Brak wyników</h2>
                    <p>Nie znaleziono zleceň pasujących do Twoich kryteriów.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {itemsToShow.map(item => (
                            <ServiceCard
                                key={item.docId}
                                item={item}
                                onEdit={() => onEdit(item)}
                                onDelete={() => onDelete(item.docId)}
                                onGetAiTips={() => onGetAiTips(item)}
                            />
                        ))}
                    </div>
                    {visibleCount < filteredItems.length && (
                        <div className="text-center mt-8">
                            <button
                                onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                                className="px-6 py-3 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold"
                            >
                                Pokaż więcej ({filteredItems.length - visibleCount} pozostało)
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ServiceList;