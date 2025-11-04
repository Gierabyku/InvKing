
import React, { useState, useEffect, useCallback } from 'react';
import type { ServiceItem, ModalState, AppView, Client, ClientModalState, ContactModalState, Contact, ScanInputMode, HybridChoiceModalState, HistoryEntry, QuickEditModalState, ServiceStatus, Note } from './types';
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
import { getServiceItems, deleteServiceItem, getClients, saveClient, deleteClient, getContacts, saveContact, deleteContact, getGlobalHistory, getServiceItemByTagId, createServiceItemWithHistory, updateServiceItemWithHistory } from './services/firestoreService';
import ClientDetail from './components/views/ClientDetail';
import ContactModal from './components/modals/ContactModal';
import QrScannerModal from './components/modals/QrScannerModal';
import HybridChoiceModal from './components/modals/HybridChoiceModal';
import QuickEditModal from './components/modals/QuickEditModal';
import ScheduledServices from './components/views/ScheduledServices';

const App: React.FC = () => {
    const { currentUser, organizationId, logout } = useAuth();
    
    // App State
    const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [globalHistory, setGlobalHistory] = useState<HistoryEntry[]>([]);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Modal States
    const [serviceModalState, setServiceModalState] = useState<ModalState>({ type: null, item: null });
    const [quickEditModalState, setQuickEditModalState] = useState<QuickEditModalState>({ isOpen: false, item: null });
    const [clientModalState, setClientModalState] = useState<ClientModalState>({ type: null, client: null });
    const [contactModalState, setContactModalState] = useState<ContactModalState>({ type: null, contact: null });
    const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
    const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
    const [aiTips, setAiTips] = useState<string>('');
    const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
    const [hybridChoiceState, setHybridChoiceState] = useState<HybridChoiceModalState>({ isOpen: false });

    // Scan State
    const [isScanning, setIsScanning] = useState(false);
    const [scanInputMode, setScanInputMode] = useState<ScanInputMode>(() => {
        return (localStorage.getItem('scanInputMode') as ScanInputMode) || 'nfc';
    });
    const [isNfcQuickReadEnabled, setIsNfcQuickReadEnabled] = useState<boolean>(() => {
        return localStorage.getItem('isNfcQuickReadEnabled') !== 'false';
    });
     
    useEffect(() => {
        localStorage.setItem('scanInputMode', scanInputMode);
    }, [scanInputMode]);
    
    useEffect(() => {
        localStorage.setItem('isNfcQuickReadEnabled', String(isNfcQuickReadEnabled));
    }, [isNfcQuickReadEnabled]);

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
                showToast('Nie udało się wczytać zleceň.', 'error');
            });

            const unsubscribeClients = getClients(organizationId, setClients, (error) => {
                console.error("Failed to load clients from Firestore", error);
                showToast('Nie udało się wczytać klientów.', 'error');
            });
            
            setHistoryError(null);
            const unsubscribeHistory = getGlobalHistory(organizationId, setGlobalHistory, (error) => {
                console.error("Error fetching global history. This may be due to a missing Firestore index. Check the console for a link to create it.", error.message);
                setHistoryError("Nie udało się wczytać historii. Prawdopodobnie brakuje wymaganego indeksu w bazie danych. Sprawdź konsolę deweloperską (F12) w przeglądarce, aby znaleźć link do jego utworzenia.");
            });

            setIsLoadingData(false);

            return () => {
                unsubscribeItems();
                unsubscribeClients();
                unsubscribeHistory();
            };
        } else {
            setServiceItems([]);
            setClients([]);
            setGlobalHistory([]);
            setIsLoadingData(false);
        }
    }, [currentUser, organizationId, showToast]);


    // Unified Tag/Code Processing
    const handleTagRead = useCallback(async (identifier: string) => {
        if (!organizationId || isScanning) return;

        setIsScanning(true);
        showToast('Weryfikuję tag/kod...', 'info');

        try {
            const existingItem = await getServiceItemByTagId(organizationId, identifier);
            
            if (existingItem) {
                // Item exists, open quick edit
                setQuickEditModalState({ isOpen: true, item: existingItem });
            } else {
                // Item does not exist, open add new
                const now = new Date().toISOString();
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
                    serviceNotes: [],
                };
                setServiceModalState({ type: 'add', item: newItem });
            }
        } catch (error) {
            console.error("Error processing tag read:", error);
            showToast('Wystąpił błąd podczas weryfikacji. Sprawdź konsolę i upewnij się, że indeks Firestore został utworzony.', 'error');
        } finally {
            setIsScanning(false);
        }
    }, [organizationId, showToast, isScanning]);

    // Scan Handlers
    const handleNfcScan = useCallback(async () => {
        if (isScanning || !isNfcQuickReadEnabled) return;
        
        if ('NDEFReader' in window) {
            try {
                const ndef = new (window as any).NDEFReader();
                await ndef.scan();
                showToast('Skanowanie rozpoczęte. Zbliż tag NFC.', 'info');
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
    }, [showToast, handleTagRead, isScanning, isNfcQuickReadEnabled]);
    
    const handleBarcodeScan = () => {
        if (isScanning) return;
        setIsQrScannerOpen(true);
    };

    const handleStartScan = () => {
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
    const handleSaveServiceItem = useCallback(async (itemToSave: ServiceItem | Omit<ServiceItem, 'docId'>, newNoteText: string) => {
        if (!organizationId || !currentUser?.email) return;

        const isNew = !('docId' in itemToSave);
        const originalItem = isNew ? null : serviceItems.find(i => i.docId === itemToSave.docId);
        
        const newHistoryEntries: Omit<HistoryEntry, 'docId' | 'serviceItemId'>[] = [];
        
        let newNote: Note | null = null;
        if (newNoteText.trim()) {
            newNote = {
                timestamp: new Date().toISOString(),
                user: currentUser.email,
                text: newNoteText.trim(),
            };
        }

        try {
            if (isNew) {
                const itemData: Omit<ServiceItem, 'docId'> = {
                     ...itemToSave,
                     serviceNotes: newNote ? [newNote] : [],
                     lastUpdated: new Date().toISOString()
                };
                
                newHistoryEntries.push({
                    type: 'Utworzono',
                    details: `Przyjęto zlecenie: "${itemData.deviceName}".`,
                    user: currentUser.email,
                    timestamp: new Date().toISOString(),
                    serviceItemName: itemData.deviceName,
                    organizationId: organizationId,
                });
                 if (newNote) {
                     newHistoryEntries.push({
                        type: 'Dodano Notatkę',
                        details: `Dodano notatkę: "${newNote.text}"`,
                        user: currentUser.email,
                        timestamp: new Date().toISOString(),
                        serviceItemName: itemData.deviceName,
                        organizationId: organizationId,
                    });
                }
                
                await createServiceItemWithHistory(organizationId, itemData, newHistoryEntries);
                showToast('Urządzenie przyjęte!', 'success');

            } else if (originalItem) { // This is an update
                const updatedItemData = { ...itemToSave };

                if (originalItem.status !== updatedItemData.status) {
                    newHistoryEntries.push({
                        type: 'Zmiana Statusu',
                        details: `Status zmieniony z "${originalItem.status}" na "${updatedItemData.status}".`,
                        user: currentUser.email,
                        timestamp: new Date().toISOString(),
                        serviceItemName: updatedItemData.deviceName,
                        organizationId: organizationId,
                    });
                }
                if (newNote) {
                    newHistoryEntries.push({
                        type: 'Dodano Notatkę',
                        details: `Dodano notatkę: "${newNote.text}"`,
                        user: currentUser.email,
                        timestamp: new Date().toISOString(),
                        serviceItemName: updatedItemData.deviceName,
                        organizationId: organizationId,
                    });
                }
                
                await updateServiceItemWithHistory(organizationId, updatedItemData.docId, updatedItemData, newNote, newHistoryEntries);
                showToast('Zlecenie zaktualizowane!', 'success');
            }
        } catch (error) {
            console.error("Save service item failed:", error);
            showToast('Nie udało się zapisać zlecenia.', 'error');
        }
        setServiceModalState({ type: null, item: null });
    }, [organizationId, showToast, currentUser, serviceItems]);

    const handleQuickUpdate = useCallback(async (item: ServiceItem, newStatus: ServiceStatus, newNoteText: string) => {
        if (!organizationId || !currentUser?.email) return;
        
        const originalItem = serviceItems.find(i => i.docId === item.docId);
        if(!originalItem) {
             showToast('Nie można odnaleźć zlecenia.', 'error');
             return;
        }
        
        const newHistoryEntries: Omit<HistoryEntry, 'docId' | 'serviceItemId'>[] = [];
        let newNote: Note | null = null;

        if (newNoteText.trim()) {
            newNote = {
                timestamp: new Date().toISOString(),
                user: currentUser.email,
                text: newNoteText.trim(),
            };
            newHistoryEntries.push({
                type: 'Dodano Notatkę',
                details: `Dodano notatkę: "${newNote.text}"`,
                user: currentUser.email,
                timestamp: new Date().toISOString(),
                serviceItemName: item.deviceName,
                organizationId: organizationId,
            });
        }
        
        if (originalItem.status !== newStatus) {
            newHistoryEntries.push({
                type: 'Zmiana Statusu',
                details: `Status zmieniony z "${originalItem.status}" na "${newStatus}".`,
                user: currentUser.email,
                timestamp: new Date().toISOString(),
                serviceItemName: item.deviceName,
                organizationId: organizationId,
            });
        }

        const itemToUpdate: Partial<ServiceItem> = {
            status: newStatus,
            lastUpdated: new Date().toISOString(),
        };


        try {
            await updateServiceItemWithHistory(organizationId, item.docId, itemToUpdate, newNote, newHistoryEntries);
            showToast('Zlecenie zaktualizowane!', 'success');
        } catch(e) {
            console.error("Quick update failed:", e);
            showToast('Błąd podczas aktualizacji zlecenia.', 'error');
        }
        setQuickEditModalState({ isOpen: false, item: null });
    }, [organizationId, currentUser, showToast, serviceItems]);

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
                            clients={clients}
                            onEdit={(item) => setServiceModalState({ type: 'edit', item })}
                            onDelete={(docId) => handleDeleteServiceItem(docId)}
                            onGetAiTips={handleGetAiTips}
                       />;
            case 'scheduledServices':
                return <ScheduledServices
                            items={serviceItems}
                            clients={clients}
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
                            serviceItems={serviceItems}
                            onBack={handleBackFromDetails} 
                            onAddContact={() => {
                                const newContact: Omit<Contact, 'docId'> = { name: '', phone: '' };
                                setContactModalState({ type: 'add', contact: newContact });
                            }}
                            onEditContact={(contact) => setContactModalState({ type: 'edit', contact })}
                            onDeleteContact={handleDeleteContact}
                            onEditServiceItem={(item) => setServiceModalState({ type: 'edit', item })}
                            onDeleteServiceItem={handleDeleteServiceItem}
                            onGetServiceItemAiTips={handleGetAiTips}
                        />;
            case 'history':
                return <History history={globalHistory} error={historyError} onBack={() => setCurrentView('dashboard')} />;
            case 'settings':
                return <Settings 
                            currentMode={scanInputMode} 
                            onModeChange={setScanInputMode}
                            isNfcQuickReadEnabled={isNfcQuickReadEnabled}
                            onNfcQuickReadChange={setIsNfcQuickReadEnabled}
                            onBack={() => setCurrentView('dashboard')} 
                       />;
            case 'dashboard':
            default:
                return <Dashboard 
                            onScan={handleStartScan}
                            onNavigate={setCurrentView} 
                       />;
        }
    }, [currentView, serviceItems, clients, globalHistory, handleDeleteServiceItem, handleDeleteClient, handleDeleteContact, handleGetAiTips, isLoadingData, organizationId, selectedClient, scanInputMode, isNfcQuickReadEnabled, handleStartScan, historyError]);

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

            {quickEditModalState.isOpen && quickEditModalState.item && (
                 <QuickEditModal
                    isOpen={quickEditModalState.isOpen}
                    onClose={() => setQuickEditModalState({ isOpen: false, item: null })}
                    onSave={handleQuickUpdate}
                    item={quickEditModalState.item}
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
                    onClose={() => {
                        setHybridChoiceState({ isOpen: false });
                    }}
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