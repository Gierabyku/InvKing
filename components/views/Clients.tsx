import React, { useState, useMemo } from 'react';
import type { Client } from '../../types';
import ClientCard from '../ClientCard';

interface ClientsProps {
    clients: Client[];
    onAddClient: () => void;
    onEditClient: (client: Client) => void;
    onDeleteClient: (docId: string) => void;
    onViewDetails: (client: Client) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, onAddClient, onEditClient, onDeleteClient, onViewDetails }) => {
    const [filter, setFilter] = useState<'all' | 'individual' | 'company'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClients = useMemo(() => {
        let tempClients = [...clients];

        // Type filter
        if (filter !== 'all') {
            tempClients = tempClients.filter(client => client.type === filter);
        }

        // Search filter
        if (searchQuery.trim() !== '') {
            const lowerCaseQuery = searchQuery.toLowerCase();
            tempClients = tempClients.filter(client =>
                (client.name && client.name.toLowerCase().includes(lowerCaseQuery)) ||
                (client.companyName && client.companyName.toLowerCase().includes(lowerCaseQuery)) ||
                client.phone.toLowerCase().includes(lowerCaseQuery) ||
                (client.email && client.email.toLowerCase().includes(lowerCaseQuery))
            );
        }
        
        return tempClients.sort((a,b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));

    }, [clients, filter, searchQuery]);

    const handleReset = () => {
        setFilter('all');
        setSearchQuery('');
    };

    const FilterButton = ({ value, label }: { value: typeof filter, label: string }) => (
        <button
            onClick={() => setFilter(value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === value ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
             <div className="sticky top-[72px] bg-gray-900/80 backdrop-blur-sm z-10 p-4 mb-6 rounded-lg border border-gray-700 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Wyszukaj po nazwie, firmie, telefonie..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-grow"
                    />
                     <div className="flex-shrink-0 flex space-x-2 bg-gray-800 p-1 rounded-lg">
                        <FilterButton value="all" label="Wszyscy" />
                        <FilterButton value="individual" label="Indywidualni" />
                        <FilterButton value="company" label="Firmy" />
                    </div>
                </div>
                 <div className="flex justify-between items-center">
                    <button onClick={handleReset} className="px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500 transition-colors font-semibold">
                        Resetuj filtry
                    </button>
                    <button onClick={onAddClient} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold flex items-center">
                        <i className="fas fa-plus mr-2"></i>Dodaj Klienta
                    </button>
                </div>
            </div>


            {filteredClients.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                    <i className="fas fa-search fa-3x mb-4"></i>
                    <h2 className="text-xl font-semibold">Brak wyników</h2>
                     <p>Nie znaleziono klientów pasujących do Twoich kryteriów.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {filteredClients.map(client => (
                        <ClientCard
                            key={client.docId}
                            client={client}
                            onEdit={() => onEditClient(client)}
                            onDelete={() => onDeleteClient(client.docId)}
                            onHistory={() => onViewDetails(client)} // Changed to onViewDetails for consistency
                            onViewDetails={() => onViewDetails(client)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Clients;