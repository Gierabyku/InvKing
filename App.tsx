import React, { useState, useEffect, useCallback } from 'react';
import type { ServiceItem, ModalState, AppView, Client, ClientModalState, ContactModalState, Contact } from './types';
import Header from './components/Header';
import ServiceModal from './components/ServiceModal';
import AiModal from './components/AiModal';
import Toast from './components/Toast';
import { getDiagnosticTips } from './services/geminiService';
import Dashboard from './components/views/Dashboard';
import ServiceList from './components/views/ServiceList';
import History from './components/views/History';
import Settings from './components/views/Settings';
import Clients from './components/views/Clients';
import ClientModal from './components/ClientModal';
import { useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import { getServiceItems, saveServiceItem, deleteServiceItem, getClients, saveClient, deleteClient, getContacts, saveContact, deleteContact } from './services/firestoreService';
import ClientDetail from './components/views/ClientDetail';
import ContactModal from './components/ContactModal';

const App: React.FC = () => {
    const { currentUser, organizationId } = useAuth();
    
    // App State
    const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Modal States
    const [serviceModalState, setServiceModalState] = useState<ModalState>({ type: null, item: null });
    const [clientModalState, setClientModalState] = useState<ClientModalState>({ type: null, client: null });
    const [contactModalState, setContactModalState] = useState<ContactModalState>({ type: null, contact: null });
    const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
    const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
    const [aiTips, setAiTips] = useState<string>('');
    
    // NFC Scan State
    const [scanMode, setScanMode] = useState<'add' | 'check' | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // Data Fetching Effects
    useEffect(() => {
        if (currentUser && organizationId) {
            setIsLoadingData(true);
            const unsubscribeItems = getServiceItems(organizationId, setServiceItems, (error) => {
                console.error("Failed to load items from Firestore", error);
                showToast('Nie udało się wczytać zleceń.', 'error');
            });

            const unsubscribeClients = getClients(organizationId, setClients, (error) => {
                console.error("Failed to load clients from Firestore", error);
                showToast('Nie udało się wczytać klientów.', 'error');
            });

            setIsLoadingData(false);

            return () => {
                unsubscribeItems();
                unsubscribeClients();
            };
        } else {
            setServiceItems([]);
            setClients([]);
            setIsLoadingData(false);
        }
    }, [currentUser, organizationId, showToast]);


    // NFC Handling
    const handleTagRead = useCallback((serialNumber: string) => {
        if (!scanMode || !organizationId) return;

        const existingItem = serviceItems.find(item => item.id === serialNumber);
        const now = new Date().toISOString();

        if (scanMode === 'add') {
            if (existingItem) {
                showToast('Ten tag jest już przypisany. Użyj opcji "Aktualizuj Status".', 'error');
            } else {
                const newItem: Omit<ServiceItem, 'docId'> = {
                    id: serialNumber,
                    organizationId,
                    clientName: '',
                    clientPhone: '',
                    deviceName: '',
                    reportedFault: '',
                    status: 'Przyjęty',
                    dateReceived: now,
                    lastUpdated: now,
                };
                setServiceModalState({ type: 'add', item: newItem });
            }
        } else if (scanMode === 'check') {
            if (existingItem) {
                setServiceModalState({ type: 'edit', item: existingItem });
            } else {
                showToast('Nie znaleziono zlecenia. Użyj opcji "Przyjmij na Serwis".', 'error');
            }
        }
        setScanMode(null);
    }, [serviceItems, scanMode, organizationId, showToast]);

    const handleScan = useCallback(async () => {
        if (!scanMode) return;
        if ('NDEFReader' in window) {
            try {
                const ndef = new (window as any).NDEFReader();
                await ndef.scan();
                showToast('Skanowanie rozpoczęte. Zbliż tag NFC.', 'success');
                ndef.addEventListener('reading', ({ serialNumber }: { serialNumber: string }) => {
                    handleTagRead(serialNumber);
                });
            } catch (error) {
                console.error('NFC scan failed:', error);
                showToast('Skanowanie NFC nie powiodło się.', 'error');
            }
        } else {
            showToast('Web NFC nie jest wspierane (tryb deweloperski).', 'info');
            const mockSerialNumber = `mock-sn-${Date.now()}`;
            handleTagRead(mockSerialNumber);
        }
    }, [scanMode, showToast, handleTagRead]);

    useEffect(() => {
        if (scanMode) {
            handleScan();
        }
    }, [scanMode, handleScan]);


    // CRUD Handlers
    const handleSaveServiceItem = useCallback(async (itemToSave: ServiceItem | Omit<ServiceItem, 'docId'>) => {
        if (!organizationId) return;
        try {
            await saveServiceItem(organizationId, itemToSave);
            showToast(serviceModalState.type === 'add' ? 'Urządzenie przyjęte!' : 'Zlecenie zaktualizowane!', 'success');
        } catch (error) {
            showToast('Nie udało się zapisać zlecenia.', 'error');
        }
        setServiceModalState({ type: null, item: null });
    }, [organizationId, serviceModalState.type, showToast]);

    const handleDeleteServiceItem = useCallback(async (docId: string) => {
        if (!organizationId) return;
        try {
            await deleteServiceItem(organizationId, docId);
            showToast('Zlecenie usunięte.', 'success');
        } catch (error) {
            showToast('Nie udało się usunąć zlecenia.', 'error');
        }
    }, [organizationId, showToast]);

    const handleSaveClient = useCallback(async (clientToSave: Client | Omit<Client, 'docId'>) => {
        if (!organizationId) return;
        try {
            await saveClient(organizationId, clientToSave);
            showToast(clientModalState.type === 'add' ? 'Klient dodany!' : 'Dane klienta zaktualizowane!', 'success');
        } catch (error) {
            showToast('Nie udało się zapisać klienta.', 'error');
        }
        setClientModalState({ type: null, client: null });
    }, [organizationId, clientModalState.type, showToast]);

    const handleDeleteClient = useCallback(async (docId: string) => {
        if (!organizationId) return;
        try {
            await deleteClient(organizationId, docId);
            showToast('Klient usunięty.', 'success');
        } catch (error) {
            showToast('Nie udało się usunąć klienta.', 'error');
        }
    }, [organizationId, showToast]);

    const handleSaveContact = useCallback(async (contactToSave: Contact | Omit<Contact, 'docId'>) => {
        if (!organizationId || !selectedClient) return;
        try {
            await saveContact(organizationId, selectedClient.docId, contactToSave);
            showToast(contactModalState.type === 'add' ? 'Kontakt dodany!' : 'Dane kontaktu zaktualizowane!', 'success');
        } catch (error) {
            showToast('Nie udało się zapisać kontaktu.', 'error');
        }
        setContactModalState({ type: null, contact: null });
    }, [organizationId, selectedClient, contactModalState.type, showToast]);

    const handleDeleteContact = useCallback(async (contactId: string) => {
        if (!organizationId || !selectedClient) return;
        try {
            await deleteContact(organizationId, selectedClient.docId, contactId);
            showToast('Kontakt usunięty.', 'success');
        } catch (error) {
            showToast('Nie udało się usunąć kontaktu.', 'error');
        }
    }, [organizationId, selectedClient, showToast]);


    // AI Handler
    const handleGetAiTips = useCallback(async (item: ServiceItem) => {
        setIsAiModalOpen(true);
        setIsLoadingAi(true);
        setAiTips('');
        try {
            const tips = await getDiagnosticTips(item);
            setAiTips(tips);
        } catch (error) {
            setAiTips('Przepraszam, nie udało mi się w tej chwili pobrać sugestii.');
            showToast('Nie udało się pobrać sugestii AI.', 'error');
        } finally {
            setIsLoadingAi(false);
        }
    }, [showToast]);
    
    // View Navigation
    const handleViewClientDetails = (client: Client) => {
        setSelectedClient(client);
        setCurrentView('clientDetail');
    };

    const handleBackFromDetails = () => {
        setSelectedClient(null);
        setCurrentView('clients');
    };
    
    // View Renderer
    const renderView = useCallback(() => {
        if (isLoadingData) {
            return (
                 <div className="flex justify-center items-center h-full mt-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
                </div>
            );
        }
        switch (currentView) {
            case 'serviceList':
                return <ServiceList
                            items={serviceItems}
                            onEdit={(item) => setServiceModalState({ type: 'edit', item })}
                            onDelete={(docId) => handleDeleteServiceItem(docId)}
                            onGetAiTips={handleGetAiTips}
                       />;
            case 'clients':
                return <Clients
                            clients={clients}
                            onAddClient={() => {
                                if (!organizationId) return;
                                const newClient: Omit<Client, 'docId'> = {
                                    organizationId: organizationId,
                                    name: '',
                                    phone: '',
                                    type: 'individual',
                                };
                                setClientModalState({ type: 'add', client: newClient });
                            }}
                            onEditClient={(client) => setClientModalState({ type: 'edit', client })}
                            onDeleteClient={handleDeleteClient}
                            onViewDetails={handleViewClientDetails}
                       />;
            case 'clientDetail':
                return <ClientDetail 
                            client={selectedClient!} 
                            onBack={handleBackFromDetails} 
                            onAddContact={() => {
                                const newContact: Omit<Contact, 'docId'> = { name: '', phone: '' };
                                setContactModalState({ type: 'add', contact: newContact });
                            }}
                            onEditContact={(contact) => setContactModalState({ type: 'edit', contact })}
                            onDeleteContact={handleDeleteContact}
                        />;
            case 'history':
                return <History onBack={() => setCurrentView('dashboard')} />;
            case 'settings':
                return <Settings onBack={() => setCurrentView('dashboard')} />;
            case 'dashboard':
            default:
                return <Dashboard 
                            onScanAdd={() => setScanMode('add')} 
                            onScanCheck={() => setScanMode('check')}
                            onNavigate={setCurrentView} 
                       />;
        }
    }, [currentView, serviceItems, clients, handleDeleteServiceItem, handleDeleteClient, handleDeleteContact, handleGetAiTips, isLoadingData, organizationId, selectedClient]);

    if (!currentUser) {
        return <Login />;
    }

    return (
        <div className="min-h-screen bg-gray-900 font-sans flex flex-col">
            <Header currentView={currentView} onBack={() => currentView === 'clientDetail' ? handleBackFromDetails() : setCurrentView('dashboard')} client={selectedClient} />
            <main className="flex-grow p-4 container mx-auto">
               {renderView()}
            </main>
            
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            {serviceModalState.type && serviceModalState.item && (
                <ServiceModal
                    isOpen={!!serviceModalState.type}
                    onClose={() => setServiceModalState({ type: null, item: null })}
                    onSave={handleSaveServiceItem}
                    item={serviceModalState.item}
                    mode={serviceModalState.type}
                    clients={clients}
                />
            )}
            
            {clientModalState.type && clientModalState.client && (
                 <ClientModal
                    isOpen={!!clientModalState.type}
                    onClose={() => setClientModalState({ type: null, client: null })}
                    onSave={handleSaveClient}
                    client={clientModalState.client}
                    mode={clientModalState.type}
                />
            )}

            {contactModalState.type && contactModalState.contact && selectedClient && (
                 <ContactModal
                    isOpen={!!contactModalState.type}
                    onClose={() => setContactModalState({ type: null, contact: null })}
                    onSave={handleSaveContact}
                    contact={contactModalState.contact}
                    mode={contactModalState.type}
                />
            )}

            {isAiModalOpen && (
                <AiModal
                    isOpen={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    tips={aiTips}
                    isLoading={isLoadingAi}
                />
            )}
        </div>
    );
};

export default App;
