import React, { useState, useEffect } from 'react';
import type { Client, Contact } from '../../types';
import { getContacts } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import ContactCard from '../ContactCard';

interface ClientDetailProps {
    client: Client;
    onBack: () => void;
    onAddContact: () => void;
    onEditContact: (contact: Contact) => void;
    onDeleteContact: (contactId: string) => void;
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack, onAddContact, onEditContact, onDeleteContact }) => {
    const { organizationId } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!organizationId || !client) return;

        setIsLoading(true);
        const unsubscribe = getContacts(organizationId, client.docId, (fetchedContacts) => {
            setContacts(fetchedContacts);
            setIsLoading(false);
        }, (error) => {
            console.error("Failed to fetch contacts", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [organizationId, client]);

    if (!client) {
        return (
            <div className="text-center text-gray-400 mt-20">
                <p>Nie wybrano klienta.</p>
                <button onClick={onBack} className="mt-4 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">
                    Wróć do listy klientów
                </button>
            </div>
        );
    }
    
    return (
        <div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
                <h2 className="text-2xl font-bold text-indigo-400 mb-2">{client.companyName}</h2>
                <div className="text-gray-400 space-y-1">
                     <p><i className="fas fa-phone-alt w-4 mr-2 text-gray-500"></i>{client.phone} (Główny)</p>
                     {client.email && <p><i className="fas fa-envelope w-4 mr-2 text-gray-500"></i>{client.email} (Główny)</p>}
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Osoby Kontaktowe</h3>
                <button onClick={onAddContact} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold flex items-center">
                    <i className="fas fa-plus mr-2"></i>Dodaj Kontakt
                </button>
            </div>
            
             {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
                </div>
            ) : contacts.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 bg-gray-800/50 p-6 rounded-lg">
                    <i className="fas fa-user-friends fa-2x mb-4"></i>
                    <p>Brak zdefiniowanych osób kontaktowych dla tej firmy.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                    {contacts.map(contact => (
                        <ContactCard 
                            key={contact.docId} 
                            contact={contact} 
                            onEdit={() => onEditContact(contact)} 
                            onDelete={() => onDeleteContact(contact.docId)} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientDetail;
