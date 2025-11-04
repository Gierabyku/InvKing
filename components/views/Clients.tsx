import React, { useState, useMemo } from 'react';
import type { Client } from '../../types';
import ClientCard from '../ClientCard';

interface ClientsProps {
    clients: Client[];
    onAddClient: () => void;
    onEditClient: (client: Client) => void;
    onDeleteClient: (docId: string) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, onAddClient, onEditClient, onDeleteClient }) => {
    const [filter, setFilter] = useState<'all' | 'individual' | 'company'>('all');

    const filteredClients = useMemo(() => {
        if (filter === 'all') return clients;
        return clients.filter(client => client.type === filter);
    }, [clients, filter]);

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
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
                    <FilterButton value="all" label="Wszyscy" />
                    <FilterButton value="individual" label="Indywidualni" />
                    <FilterButton value="company" label="Firmy" />
                </div>
                <button onClick={onAddClient} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold flex items-center">
                    <i className="fas fa-plus mr-2"></i>Dodaj Klienta
                </button>
            </div>

            {filteredClients.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                    <i className="fas fa-users fa-3x mb-4"></i>
                    <h2 className="text-xl font-semibold">Brak klientów</h2>
                    <p>Dodaj swojego pierwszego klienta, aby rozpocząć.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {filteredClients.map(client => (
                        <ClientCard
                            key={client.docId}
                            client={client}
                            onEdit={() => onEditClient(client)}
                            onDelete={() => onDeleteClient(client.docId)}
                            onHistory={() => alert('Historia zleceń wkrótce!')}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Clients;
