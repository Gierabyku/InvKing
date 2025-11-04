import React, { useState, useEffect, useMemo } from 'react';
import type { ServiceItem, ServiceStatus, Client, Contact, HistoryEntry } from '../../types';
import { getContacts, getHistoryForItem } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

// Client Selector Component
const ClientSelector: React.FC<{ clients: Client[]; onSelect: (client: Client) => void; disabled: boolean }> = ({ clients, onSelect, disabled }) => {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredClients = query.length > 0 ? clients.filter(client => 
        (client.name && client.name.toLowerCase().includes(query.toLowerCase())) || 
        (client.companyName && client.companyName.toLowerCase().includes(query.toLowerCase()))
    ) : [];

    const handleSelect = (client: Client) => {
        onSelect(client);
        setQuery(client.companyName || client.name || '');
        setShowSuggestions(false);
    };

    return (
        <div className="relative">
            <label htmlFor="clientSearch" className="block text-sm font-medium text-gray-300 mb-1">Wybierz lub wyszukaj klienta</label>
            <input
                id="clientSearch"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Zacznij pisać, aby wyszukać..."
                autoComplete="off"
                disabled={disabled}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-800 disabled:text-gray-500"
            />
            {showSuggestions && filteredClients.length > 0 && (
                <ul className="absolute z-20 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-48 overflow-y-auto">
                    {filteredClients.map(client => (
                        <li 
                            key={client.docId}
                            onMouseDown={() => handleSelect(client)}
                            className="px-3 py-2 cursor-pointer hover:bg-indigo-600"
                        >
                            <p className="font-semibold">{client.companyName || client.name}</p>
                            <p className="text-xs text-gray-300">{client.type === 'company' ? client.name : client.phone}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const HistoryViewer: React.FC<{ itemId: string }> = ({ itemId }) => {
    const { organizationId } = useAuth();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!organizationId) return;
        const unsubscribe = getHistoryForItem(organizationId, itemId, (entries) => {
            setHistory(entries);
            setIsLoading(false);
        }, (err) => {
            console.error("Failed to load history", err);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [organizationId, itemId]);

    if (isLoading) {
        return <div className="text-center text-gray-400">Ładowanie historii...</div>;
    }
    if (history.length === 0) {
        return <div className="text-center text-gray-400">Brak historii dla tego zlecenia.</div>;
    }

    return (
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {history.map(entry => (
                <div key={entry.docId} className="text-xs p-2 bg-gray-900/50 rounded-md">
                    <div className="flex justify-between items-center text-gray-400 mb-1">
                        <span className="font-semibold">{entry.type}</span>
                        <span>{new Date(entry.timestamp).toLocaleString('pl-PL')}</span>
                    </div>
                    <p className="text-gray-300">{entry.details}</p>
                    <p className="text-right text-gray-500 text-[10px] mt-1">przez: {entry.user}</p>
                </div>
            ))}
        </div>
    )
};

const NotesViewer: React.FC<{ notes: string | null | undefined }> = ({ notes }) => {
    const parsedNotes = useMemo(() => {
        if (!notes) return [];
        return notes.split('\n').filter(line => line.trim() !== '');
    }, [notes]);

    if (parsedNotes.length === 0) {
        return <p className="text-sm text-gray-500 text-center py-4">Brak notatek.</p>;
    }

    return (
        <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-900/50 p-3 rounded-md">
            {parsedNotes.map((note, index) => (
                <p key={index} className="text-sm text-gray-300 border-b border-gray-700 pb-1 last:border-b-0">{note}</p>
            ))}
        </div>
    );
};


interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: ServiceItem | Omit<ServiceItem, 'docId'>, newNote: string) => void;
    item: ServiceItem | Omit<ServiceItem, 'docId'>;
    mode: 'add' | 'edit';
    clients: Client[];
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onSave, item, mode, clients }) => {
    const { organizationId } = useAuth();
    const [formData, setFormData] = useState(item);
    const [newNote, setNewNote] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [isClientSectionLocked, setIsClientSectionLocked] = useState(mode === 'edit');
    const [unlockClickCount, setUnlockClickCount] = useState(0);

    useEffect(() => {
        setFormData(item);
        setNewNote('');
        setSelectedClient(null);
        setContacts([]);
        setIsClientSectionLocked(mode === 'edit');
        setUnlockClickCount(0);
    }, [item, mode]);
    
    useEffect(() => {
        if (selectedClient && selectedClient.type === 'company' && organizationId) {
            setIsLoadingContacts(true);
            const unsubscribe = getContacts(organizationId, selectedClient.docId, (fetchedContacts) => {
                setContacts(fetchedContacts);
                setIsLoadingContacts(false);
            }, (error) => {
                console.error("Failed to fetch contacts:", error);
                setIsLoadingContacts(false);
            });
            return () => unsubscribe();
        } else {
            setContacts([]);
        }
    }, [selectedClient, organizationId]);

    if (!isOpen) return null;
    
    const handleUnlockAttempt = () => {
        if (!isClientSectionLocked) return;
        const newCount = unlockClickCount + 1;
        setUnlockClickCount(newCount);
        if (newCount >= 10) {
            setIsClientSectionLocked(false);
        }
    };
    
    const handleClientSelect = (client: Client) => {
        setSelectedClient(client);
        setFormData(prev => ({
            ...prev,
            clientId: client.docId,
            contactId: undefined, // Reset contact on new client selection
            companyName: client.companyName || '',
            clientName: client.type === 'individual' ? (client.name || '') : '',
            clientPhone: client.type === 'individual' ? client.phone : '',
            clientEmail: client.type === 'individual' ? (client.email || '') : '',
        }));
    };
    
    const handleContactSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const contactId = e.target.value;
        const contact = contacts.find(c => c.docId === contactId);
        if (contact) {
             setFormData(prev => ({
                ...prev,
                contactId: contact.docId,
                clientName: contact.name,
                clientPhone: contact.phone,
                clientEmail: contact.email || '',
            }));
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, newNote);
    };
    
    const statusOptions: ServiceStatus[] = ['Przyjęty', 'W trakcie diagnozy', 'Oczekuje na części', 'W trakcie naprawy', 'Gotowy do odbioru', 'Zwrócony klientowi'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-700">
                     <h2 className="text-xl font-bold">{mode === 'add' ? 'Przyjmij Urządzenie na Serwis' : 'Edytuj Zlecenie Serwisowe'}</h2>
                     <p className="text-sm text-gray-400">ID: {item.id}</p>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
                    
                    <div onClick={handleUnlockAttempt} className={`${isClientSectionLocked ? 'opacity-60 cursor-not-allowed' : ''} transition-opacity space-y-4`}>
                        <ClientSelector clients={clients} onSelect={handleClientSelect} disabled={isClientSectionLocked} />
                        
                        {selectedClient && selectedClient.type === 'company' && (
                            <div>
                                <label htmlFor="contactId" className="block text-sm font-medium text-gray-300 mb-1">Osoba Kontaktowa</label>
                                <select 
                                    id="contactId" 
                                    name="contactId" 
                                    value={formData.contactId || ''}
                                    onChange={handleContactSelect}
                                    disabled={isLoadingContacts || isClientSectionLocked}
                                    required
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-800 disabled:text-gray-500"
                                >
                                    <option value="" disabled>{isLoadingContacts ? 'Ładowanie...' : 'Wybierz kontakt'}</option>
                                    {contacts.map(contact => (
                                        <option key={contact.docId} value={contact.docId}>{contact.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <hr className="border-gray-600 my-4" />
                        
                        <h3 className="text-lg font-semibold text-gray-300">Dane Klienta / Kontaktu</h3>
                         <div>
                            <label htmlFor="clientName" className="block text-sm font-medium text-gray-300 mb-1">Imię i Nazwisko</label>
                            <input id="clientName" name="clientName" type="text" value={formData.clientName} onChange={handleChange} required disabled={isClientSectionLocked} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-800 disabled:text-gray-500" />
                        </div>
                        <div>
                            <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-300 mb-1">Telefon</label>
                            <input id="clientPhone" name="clientPhone" type="tel" value={formData.clientPhone} onChange={handleChange} required disabled={isClientSectionLocked} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-800 disabled:text-gray-500" />
                        </div>
                         <div>
                            <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-300 mb-1">Email (opcjonalnie)</label>
                            <input id="clientEmail" name="clientEmail" type="email" value={formData.clientEmail || ''} onChange={handleChange} disabled={isClientSectionLocked} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-800 disabled:text-gray-500" />
                        </div>
                        {formData.companyName && (
                             <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-1">Firma</label>
                                <input id="companyName" name="companyName" type="text" value={formData.companyName} disabled className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-400" />
                            </div>
                        )}
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
                        <label className="block text-sm font-medium text-gray-300 mb-2">Istniejące notatki</label>
                        <NotesViewer notes={formData.serviceNotes} />
                    </div>
                     <div>
                        <label htmlFor="newNote" className="block text-sm font-medium text-gray-300 mb-1">Dodaj nową notatkę</label>
                        <textarea id="newNote" name="newNote" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3}/>
                    </div>

                    {mode === 'edit' && 'docId' in item && (
                        <>
                            <hr className="border-gray-600 my-4" />
                            <h3 className="text-lg font-semibold text-gray-300">Historia Zlecenia</h3>
                            <HistoryViewer itemId={item.docId} />
                        </>
                    )}

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
