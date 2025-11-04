import React, { useState, useEffect, useCallback } from 'react';
import type { ServiceItem, ModalState, AppView, Client, ClientModalState, ContactModalState, Contact, ScanInputMode, HybridChoiceModalState } from './types';
import Header from './components/Header';
import ServiceModal from './components/modals/ServiceModal';
import AiModal from './components/modals/AiModal';
import Toast from './components/modals/Toast';
import { getDiagnosticTips } from './services/geminiService';
import Dashboard from './components/views/Dashboard';
import ServiceList from './components/views/ServiceList';
import History from './components/views/History';
import Settings from './components/views/Settings';
import Clients from './components/views/Clients';
import ClientModal from './components/modals/ClientModal';
import { useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import { getServiceItems, saveServiceItem, deleteServiceItem, getClients, saveClient, deleteClient, getContacts, saveContact, deleteContact } from './services/firestoreService';
import ClientDetail from './components/views/ClientDetail';
import ContactModal from './components/modals/ContactModal';
import QrScannerModal from './components/modals/QrScannerModal';
import HybridChoiceModal from './components/modals/HybridChoiceModal';

const App: React.FC = () => {
    const { currentUser, organizationId, logout } = useAuth();
    
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
    const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
    const [hybridChoiceState, setHybridChoiceState] = useState<HybridChoiceModalState>({ isOpen: false });

    // Scan State
    const [scanMode, setScanMode] = useState<'add' | 'check' | null>(null);
    const [scanInputMode, setScanInputMode] = useState<ScanInputMode>(() => {
        return (localStorage.getItem('scanInputMode') as ScanInputMode) || 'nfc';
    });
     
    useEffect(() => {
        localStorage.setItem('scanInputMode', scanInputMode);
    }, [scanInputMode]);

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


    // Unified Tag/Code Processing
    const handleTagRead = useCallback((identifier: string) => {
        if (!scanMode || !organizationId) return;

        const existingItem = serviceItems.find(item => item.id === identifier);
        const now = new Date().toISOString();

        if (scanMode === 'add') {
            if (existingItem) {
                showToast('Ten tag/kod jest już przypisany. Użyj opcji "Aktualizuj Status".', 'error');
            } else {
                const newItem: Omit<ServiceItem, 'docId'> = {
                    id: identifier,
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

    // Scan Handlers
    const handleNfcScan = useCallback(async () => {
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
            const mockIdentifier = `mock-id-${Date.now()}`;
            handleTagRead(mockIdentifier);
        }
    }, [scanMode, showToast, handleTagRead]);
    
    const handleBarcodeScan = () => {
        if (!scanMode) return;
        setIsQrScannerOpen(true);
    };

    const handleStartScan = (mode: 'add' | 'check') => {
        setScanMode(mode);
        switch(scanInputMode) {
            case 'nfc':
                handleNfcScan();
                break;
            case 'barcode':
                handleBarcodeScan();
                break;
            case 'hybrid':
                setHybridChoiceState({ isOpen: true });
                break;
        }
    };


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
                return <Settings 
                            currentMode={scanInputMode} 
                            onModeChange={setScanInputMode}
                            onBack={() => setCurrentView('dashboard')} 
                       />;
            case 'dashboard':
            default:
                return <Dashboard 
                            onScanAdd={() => handleStartScan('add')} 
                            onScanCheck={() => handleStartScan('check')}
                            onNavigate={setCurrentView} 
                       />;
        }
    }, [currentView, serviceItems, clients, handleDeleteServiceItem, handleDeleteClient, handleDeleteContact, handleGetAiTips, isLoadingData, organizationId, selectedClient, scanInputMode]);

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
            
            {isQrScannerOpen && (
                <QrScannerModal
                    isOpen={isQrScannerOpen}
                    onClose={() => setIsQrScannerOpen(false)}
                    onScanSuccess={(decodedText) => {
                        handleTagRead(decodedText);
                        setIsQrScannerOpen(false);
                    }}
                />
            )}

            {hybridChoiceState.isOpen && (
                <HybridChoiceModal
                    isOpen={hybridChoiceState.isOpen}
                    onClose={() => setHybridChoiceState({ isOpen: false })}
                    onNfcSelect={() => {
                        handleNfcScan();
                        setHybridChoiceState({ isOpen: false });
                    }}
                    onBarcodeSelect={() => {
                        handleBarcodeScan();
                        setHybridChoiceState({ isOpen: false });
                    }}
                />
            )}

             {currentUser && (
                <button
                    onClick={logout}
                    title="Wyloguj"
                    className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-transform transform hover:scale-110 z-20"
                >
                    <i className="fas fa-sign-out-alt text-2xl"></i>
                </button>
            )}
        </div>
    );
};

export default App;