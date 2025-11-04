import React, { useState, useEffect, useMemo } from 'react';
import type { Client, Contact, ServiceItem, ServiceStatus } from '../../types';
import { getContacts } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import ContactCard from '../ContactCard';
import ServiceCard from '../ServiceCard';

interface ClientDetailProps {
    client: Client;
    serviceItems: ServiceItem[];
    onBack: () => void;
    onAddContact: () => void;
    onEditContact: (contact: Contact) => void;
    onDeleteContact: (contactId: string) => void;
    onEditServiceItem: (item: ServiceItem) => void;
    onDeleteServiceItem: (docId: string) => void;
    onGetServiceItemAiTips: (item: ServiceItem) => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ 
    client, 
    serviceItems,
    onBack, 
    onAddContact, 
    onEditContact, 
    onDeleteContact,
    onEditServiceItem,
    onDeleteServiceItem,
    onGetServiceItemAiTips
}) => {
    const { organizationId } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);

    // State for service item filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<Record<ServiceStatus, boolean>>({
        'Przyjęty': false, 'W trakcie diagnozy': false, 'Oczekuje na części': false,
        'W trakcie naprawy': false, 'Gotowy do odbioru': false, 'Zwrócony klientowi': false
    });
    const [statusFilterOpen, setStatusFilterOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(6);

    useEffect(() => {
        if (!organizationId || !client || client.type !== 'company') {
            setIsLoadingContacts(false);
            setContacts([]);
            return;
        }

        setIsLoadingContacts(true);
        const unsubscribe = getContacts(organizationId, client.docId, (fetchedContacts) => {
            setContacts(fetchedContacts);
            setIsLoadingContacts(false);
        }, (error) => {
            console.error("Failed to fetch contacts", error);
            setIsLoadingContacts(false);
        });

        return () => unsubscribe();
    }, [organizationId, client]);

    const clientServiceItems = useMemo(() => {
        return serviceItems.filter(item => item.clientId === client.docId);
    }, [serviceItems, client]);

    const filteredServiceItems = useMemo(() => {
        let filtered = [...clientServiceItems];
        
        // Search filter
        if (searchQuery) {
            const lowerCaseQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.deviceName.toLowerCase().includes(lowerCaseQuery) ||
                (item.deviceModel && item.deviceModel.toLowerCase().includes(lowerCaseQuery)) ||
                (item.deviceSerialNumber && item.deviceSerialNumber.toLowerCase().includes(lowerCaseQuery)) ||
                item.reportedFault.toLowerCase().includes(lowerCaseQuery)
            );
        }

        // Status filter
        const activeStatusFilters = Object.entries(statusFilter)
            .filter(([, isSelected]) => isSelected)
            .map(([status]) => status as ServiceStatus);

        if (activeStatusFilters.length > 0) {
            filtered = filtered.filter(item => activeStatusFilters.includes(item.status));
        }
        
        return filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }, [clientServiceItems, searchQuery, statusFilter]);

    const handleStatusChange = (status: ServiceStatus) => {
        setStatusFilter(prev => ({ ...prev, [status]: !prev[status] }));
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter({
            'Przyjęty': false, 'W trakcie diagnozy': false, 'Oczekuje na części': false,
            'W trakcie naprawy': false, 'Gotowy do odbioru': false, 'Zwrócony klientowi': false
        });
        setVisibleCount(6);
    };

    if (!client) {
        // This case should ideally not be reached if navigation is correct
        return <div className="text-center text-gray-400 mt-20"><p>Nie wybrano klienta.</p></div>;
    }

    const itemsToShow = filteredServiceItems.slice(0, visibleCount);
    const activeFilterCount = Object.values(statusFilter).filter(v => v).length;
    
    return (
        <div>
            {/* Client Info Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-indigo-400 mb-2">{client.companyName || client.name}</h2>
                <div className="text-gray-400 space-y-1">
                     <p><i className="fas fa-phone-alt w-4 mr-2 text-gray-500"></i>{client.phone} {client.type === 'company' && '(Główny)'}</p>
                     {client.email && <p><i className="fas fa-envelope w-4 mr-2 text-gray-500"></i>{client.email} {client.type === 'company' && '(Główny)'}</p>}
                </div>
            </div>

            {/* Contacts Section (for companies) */}
            {client.type === 'company' && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Osoby Kontaktowe</h3>
                        <button onClick={onAddContact} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold flex items-center">
                            <i className="fas fa-plus mr-2"></i>Dodaj Kontakt
                        </button>
                    </div>
                     {isLoadingContacts ? (
                        <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div></div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 bg-gray-800/50 p-6 rounded-lg"><i className="fas fa-user-friends fa-2x mb-4"></i><p>Brak zdefiniowanych osób kontaktowych.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {contacts.map(contact => (
                                <ContactCard key={contact.docId} contact={contact} onEdit={() => onEditContact(contact)} onDelete={() => onDeleteContact(contact.docId)} />
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Service Items Section */}
            <div className="mt-10">
                 <h3 className="text-xl font-semibold mb-4">Urządzenia w Serwisie ({clientServiceItems.length})</h3>
                 
                 <div className="sticky top-[72px] bg-gray-900/80 backdrop-blur-sm z-10 p-4 mb-6 rounded-lg border border-gray-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input
                            type="text"
                            placeholder="Wyszukaj w zleceniach klienta..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                         <div className="relative">
                            <button onClick={() => setStatusFilterOpen(!statusFilterOpen)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center">
                                <span>Filtruj Statusy {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
                                <i className={`fas fa-chevron-down transition-transform ${statusFilterOpen ? 'rotate-180' : ''}`}></i>
                            </button>
                            {statusFilterOpen && (
                                <div className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md p-4 space-y-2">
                                    {Object.keys(statusFilter).map(status => (
                                        <label key={status} className="flex items-center space-x-2 text-white cursor-pointer">
                                            <input type="checkbox" checked={statusFilter[status as ServiceStatus]} onChange={() => handleStatusChange(status as ServiceStatus)} className="h-4 w-4 rounded border-gray-500 bg-gray-600 text-indigo-600 focus:ring-indigo-500" />
                                            <span>{status}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                     <button onClick={handleResetFilters} className="px-4 py-2 text-sm rounded-md bg-gray-600 hover:bg-gray-500 transition-colors font-semibold">Resetuj Filtry</button>
                 </div>

                 {itemsToShow.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 bg-gray-800/50 p-6 rounded-lg"><i className="fas fa-search fa-2x mb-4"></i><p>Brak zleceń pasujących do kryteriów.</p></div>
                 ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                            {itemsToShow.map(item => (
                                <ServiceCard 
                                    key={item.docId}
                                    item={item}
                                    onEdit={() => onEditServiceItem(item)}
                                    onDelete={() => onDeleteServiceItem(item.docId)}
                                    onGetAiTips={() => onGetServiceItemAiTips(item)}
                                />
                            ))}
                        </div>
                        {visibleCount < filteredServiceItems.length && (
                             <div className="text-center mt-4">
                                <button onClick={() => setVisibleCount(prev => prev + 6)} className="px-6 py-3 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">
                                    Pokaż więcej ({filteredServiceItems.length - visibleCount} pozostało)
                                </button>
                            </div>
                        )}
                    </>
                 )}
            </div>
        </div>
    );
};

export default ClientDetail;