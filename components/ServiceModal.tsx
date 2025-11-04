import React, { useState, useEffect } from 'react';
import type { ServiceItem, ServiceStatus, Client } from '../types';

// Client Selector Component
const ClientSelector: React.FC<{ clients: Client[]; onSelect: (client: Client) => void }> = ({ clients, onSelect }) => {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredClients = query.length > 0 ? clients.filter(client => 
        client.clientName.toLowerCase().includes(query.toLowerCase()) || 
        (client.companyName && client.companyName.toLowerCase().includes(query.toLowerCase()))
    ) : [];

    const handleSelect = (client: Client) => {
        onSelect(client);
        setQuery('');
        setShowSuggestions(false);
    };

    return (
        <div className="relative">
            <label htmlFor="clientSearch" className="block text-sm font-medium text-gray-300 mb-1">Wybierz istniejącego klienta</label>
            <input
                id="clientSearch"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Zacznij pisać, aby wyszukać..."
                autoComplete="off"
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {showSuggestions && filteredClients.length > 0 && (
                <ul className="absolute z-10 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-48 overflow-y-auto">
                    {filteredClients.map(client => (
                        <li 
                            key={client.docId}
                            onClick={() => handleSelect(client)}
                            className="px-3 py-2 cursor-pointer hover:bg-indigo-600"
                        >
                            <p className="font-semibold">{client.clientName}</p>
                            <p className="text-xs text-gray-300">{client.companyName || client.clientPhone}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: ServiceItem | Omit<ServiceItem, 'docId'>) => void;
    item: ServiceItem | Omit<ServiceItem, 'docId'>;
    mode: 'add' | 'edit';
    clients: Client[];
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onSave, item, mode, clients }) => {
    const [formData, setFormData] = useState(item);

    useEffect(() => {
        setFormData(item);
    }, [item]);
    
    if (!isOpen) return null;

    const handleClientSelect = (client: Client) => {
        setFormData(prev => ({
            ...prev,
            clientId: client.docId,
            clientName: client.clientName,
            companyName: client.companyName || '',
            clientPhone: client.clientPhone,
            clientEmail: client.clientEmail || '',
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const statusOptions: ServiceStatus[] = ['Przyjęty', 'W trakcie diagnozy', 'Oczekuje na części', 'W trakcie naprawy', 'Gotowy do odbioru', 'Zwrócony klientowi'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-700">
                     <h2 className="text-xl font-bold">{mode === 'add' ? 'Przyjmij Urządzenie na Serwis' : 'Edytuj Zlecenie Serwisowe'}</h2>
                     <p className="text-sm text-gray-400">ID Taga: {item.id}</p>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
                    
                    <ClientSelector clients={clients} onSelect={handleClientSelect} />
                    
                    <hr className="border-gray-600 my-4" />
                    
                    <h3 className="text-lg font-semibold text-gray-300">Dane Klienta</h3>
                    <div>
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-300 mb-1">Imię i Nazwisko</label>
                        <input id="clientName" name="clientName" type="text" value={formData.clientName} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                     <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-1">Firma (opcjonalnie)</label>
                        <input id="companyName" name="companyName" type="text" value={formData.companyName || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-300 mb-1">Telefon</label>
                        <input id="clientPhone" name="clientPhone" type="tel" value={formData.clientPhone} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                     <div>
                        <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-300 mb-1">Email (opcjonalnie)</label>
                        <input id="clientEmail" name="clientEmail" type="email" value={formData.clientEmail || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    <hr className="border-gray-600 my-4" />

                    <h3 className="text-lg font-semibold text-gray-300">Urządzenie i Usterka</h3>
                    <div>
                        <label htmlFor="deviceName" className="block text-sm font-medium text-gray-300 mb-1">Nazwa Urządzenia</label>
                        <input id="deviceName" name="deviceName" type="text" value={formData.deviceName} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="reportedFault" className="block text-sm font-medium text-gray-300 mb-1">Zgłoszona usterka</label>
                        <textarea id="reportedFault" name="reportedFault" value={formData.reportedFault} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3}/>
                    </div>

                    <hr className="border-gray-600 my-4" />
                    
                    <h3 className="text-lg font-semibold text-gray-300">Status i Notatki Serwisowe</h3>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status Naprawy</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="serviceNotes" className="block text-sm font-medium text-gray-300 mb-1">Notatki Serwisowe (wewnętrzne)</label>
                        <textarea id="serviceNotes" name="serviceNotes" value={formData.serviceNotes || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3}/>
                    </div>
                </form>
                <div className="p-6 border-t border-gray-700 mt-auto bg-gray-800 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors">Anuluj</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">Zapisz</button>
                </div>
            </div>
        </div>
    );
};

export default ServiceModal;
