import React, { useState, useEffect, useCallback } from 'react';
import type { ServiceItem, ModalState, AppView, Client, ClientModalState, ContactModalState, Contact, ScanInputMode, HybridChoiceModalState, HistoryEntry, QuickEditModalState, ServiceStatus, Note, OrgUser, UserModalState, UserPermissions } from './types';
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
import { getServiceItems, deleteServiceItem, getClients, saveClient, deleteClient, getContacts, saveContact, deleteContact, getGlobalHistory, getServiceItemByTagId, createServiceItemWithHistory, updateServiceItemWithHistory, getOrgUsers, createNewUserInCloud, updateUserPermissionsInCloud, deleteUserInCloud } from './services/firestoreService';
import ClientDetail from './components/views/ClientDetail';
import ContactModal from './components/modals/ContactModal';
import QrScannerModal from './components/modals/QrScannerModal';
import HybridChoiceModal from './components/modals/HybridChoiceModal';
import QuickEditModal from './components/modals/QuickEditModal';
import ScheduledServices from './components/views/ScheduledServices';
import UserModal from './components/modals/UserModal';
import ConfirmModal from './components/modals/ConfirmModal';

const App: React.FC = () => {
    const { currentUser, orgUser, organizationId, logout } = useAuth();
    
    // App State
    const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
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
    const [userModalState, setUserModalState] = useState<UserModalState>({ type: null, user: null });
    const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
    const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
    const [aiTips, setAiTips] = useState<string>('');
    const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
    const [hybridChoiceState, setHybridChoiceState] = useState<HybridChoiceModalState>({ isOpen: false });
    const [userToDelete, setUserToDelete] = useState<OrgUser | null>(null);

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
        setTimeout(() => setToast(null), 5000); // Longer duration for info messages
    }, []);

    // Data Fetching Effects
    useEffect(() => {
        if (currentUser && organizationId) {
            setIsLoadingData(true);
            const unsubscribers: (() => void)[] = [];

            unsubscribers.push(getServiceItems(organizationId, setServiceItems, (error) => {
                console.error("Failed to load items from Firestore", error);
                showToast('Nie udało się wczytać zleceń.', 'error');
            }));

            unsubscribers.push(getClients(organizationId, setClients, (error) => {
                console.error("Failed to load clients from Firestore", error);
                showToast('Nie udało się wczytać klientów.', 'error');
            }));
            
            setHistoryError(null);
            unsubscribers.push(getGlobalHistory(organizationId, setGlobalHistory, (error) => {
                console.error("Error fetching global history. This may be due to a missing Firestore index. Check the console for a link to create it.", error.message);
                setHistoryError("Nie udało się wczytać historii. Prawdopodobnie brakuje wymaganego indeksu w bazie danych. Sprawdź konsolę deweloperską (F12) w przeglądarce, aby znaleźć link do jego utworzenia.");
            }));

            unsubscribers.push(getOrgUsers(organizationId, setOrgUsers, (error) => {
                 console.error("Failed to load users from Firestore", error);
                showToast('Nie udało się wczytać użytkowników.', 'error');
            }));

            setIsLoadingData(false);

            return () => {
                unsubscribers.forEach(unsub => unsub());
            };
        } else {
            setServiceItems([]);
            setClients([]);
            setGlobalHistory([]);
            setOrgUsers([]);
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
                    assignedTo: currentUser?.uid,
                    assignedToName: currentUser?.email || 'Nieznany',
                };
                setServiceModalState({ type: 'add', item: newItem });
            }
        } catch (error) {
            console.error("Error processing tag read:", error);
            showToast('Wystąpił błąd podczas weryfikacji. Sprawdź konsolę i upewnij się, że indeks Firestore został utworzony.', 'error');
        } finally {
            setIsScanning(false);
        }
    }, [organizationId, showToast, isScanning, currentUser]);

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
        if (scanInputMode === 'nfc') {
            handleNfcScan();
        } else if (scanInputMode === 'barcode') {
            handleBarcodeScan();
        } else {
            setHybridChoiceState({ isOpen: true });
        }
    };

    // AI Modal Handler
    const handleGetAiTips = async (item: ServiceItem) => {
        setIsAiModalOpen(true);
        setIsLoadingAi(true);
        try {
            const tips = await getDiagnosticTips(item);
            setAiTips(tips);
        } catch (error) {
            setAiTips('Nie udało się pobrać wskazówek. Spróbuj ponownie.');
        } finally {
            setIsLoadingAi(false);
        }
    };
    
    // Service Item Handlers
    const handleSaveServiceItem = async (itemData: ServiceItem | Omit<ServiceItem, 'docId'>, newNoteText: string) => {
        if (!organizationId || !currentUser) return;
        
        const now = new Date().toISOString();
        const userEmail = currentUser.email || 'unknown@user.com';

        // History and Note generation logic
        const newNote: Note | null = newNoteText.trim() !== '' ? { text: newNoteText.trim(), user: userEmail, timestamp: now } : null;
        let historyEntries: Omit<HistoryEntry, 'docId' | 'serviceItemId' | 'organizationId'>[] = [];
        
        const serviceItemName = itemData.deviceName || 'Nieznane Urządzenie';
        
        if (serviceModalState.type === 'add') {
             historyEntries.push({
                type: 'Utworzono',
                details: `Utworzono nowe zlecenie dla ${itemData.clientName} - ${itemData.deviceName}`,
                timestamp: now,
                user: userEmail,
                serviceItemName: itemData.deviceName,
            });
            if (newNote) {
                 historyEntries.push({
                    type: 'Dodano Notatkę',
                    details: `Dodano notatkę: "${newNote.text}"`,
                    timestamp: now,
                    user: userEmail,
                    serviceItemName: itemData.deviceName,
                });
            }
            try {
                await createServiceItemWithHistory(organizationId, { ...itemData, lastUpdated: now }, historyEntries.map(h => ({ ...h, organizationId })));
                showToast('Zlecenie zostało dodane!', 'success');
            } catch (error) {
                console.error("Error creating item:", error);
                showToast('Błąd podczas dodawania zlecenia.', 'error');
            }

        } else if (serviceModalState.type === 'edit' && 'docId' in itemData) {
            const originalItem = serviceItems.find(i => i.docId === (itemData as ServiceItem).docId);
            if (!originalItem) return;

            let hasChanges = false;
            let changeDetails: string[] = [];

            // Check for status change
            if (originalItem.status !== itemData.status) {
                hasChanges = true;
                historyEntries.push({
                    type: 'Zmiana Statusu',
                    details: `Zmieniono status z "${originalItem.status}" na "${itemData.status}"`,
                    timestamp: now,
                    user: userEmail,
                    serviceItemName
                });
            }
            
            // Check for data changes (excluding status and notes)
            const fieldsToCompare: (keyof ServiceItem)[] = ['clientName', 'clientPhone', 'deviceName', 'reportedFault', 'assignedTo', 'nextServiceDate'];
            fieldsToCompare.forEach(key => {
                if (originalItem[key] !== itemData[key]) {
                    changeDetails.push(`Zmieniono '${key}' z "${originalItem[key] || ''}" na "${itemData[key] || ''}"`);
                }
            });

            if(changeDetails.length > 0) {
                hasChanges = true;
                historyEntries.push({
                    type: 'Edycja Danych',
                    details: `Zaktualizowano dane zlecenia. ${changeDetails.join(', ')}`,
                    timestamp: now,
                    user: userEmail,
                    serviceItemName
                });
            }

             if (newNote) {
                hasChanges = true;
                 historyEntries.push({
                    type: 'Dodano Notatkę',
                    details: `Dodano notatkę: "${newNote.text}"`,
                    timestamp: now,
                    user: userEmail,
                    serviceItemName
                });
            }
            
            if (hasChanges) {
                try {
                    await updateServiceItemWithHistory(organizationId, (itemData as ServiceItem).docId, { ...itemData, lastUpdated: now }, newNote, historyEntries.map(h => ({ ...h, organizationId })));
                    showToast('Zmiany zostały zapisane!', 'success');
                } catch (error) {
                    console.error("Error updating item:", error);
                    showToast('Błąd podczas zapisywania zmian.', 'error');
                }
            } else {
                 showToast('Nie wprowadzono żadnych zmian.', 'info');
            }
        }
        
        setServiceModalState({ type: null, item: null });
    };

    const handleQuickSave = async (item: ServiceItem, newStatus: ServiceStatus, newNoteText: string) => {
        if (!organizationId || !currentUser) return;
        const now = new Date().toISOString();
        const userEmail = currentUser.email || 'unknown@user.com';
        const serviceItemName = item.deviceName;
        
        let historyEntries: Omit<HistoryEntry, 'docId' | 'serviceItemId' | 'organizationId'>[] = [];
        const newNote: Note | null = newNoteText.trim() !== '' ? { text: newNoteText.trim(), user: userEmail, timestamp: now } : null;

        let hasChanges = false;
        
        if (item.status !== newStatus) {
            hasChanges = true;
            historyEntries.push({
                type: 'Zmiana Statusu',
                details: `Zmieniono status z "${item.status}" na "${newStatus}"`,
                timestamp: now,
                user: userEmail,
                serviceItemName
            });
        }
        if (newNote) {
            hasChanges = true;
            historyEntries.push({
                type: 'Dodano Notatkę',
                details: `Dodano notatkę: "${newNote.text}"`,
                timestamp: now,
                user: userEmail,
                serviceItemName
            });
        }

        if (hasChanges) {
             try {
                await updateServiceItemWithHistory(organizationId, item.docId, { status: newStatus, lastUpdated: now }, newNote, historyEntries.map(h => ({ ...h, organizationId })));
                showToast('Zmiany zostały zapisane!', 'success');
            } catch (error) {
                console.error("Error updating item:", error);
                showToast('Błąd podczas zapisywania zmian.', 'error');
            }
        } else {
            showToast('Nie wprowadzono żadnych zmian.', 'info');
        }
        
        setQuickEditModalState({ isOpen: false, item: null });
    };

    const handleDeleteServiceItem = async (docId: string) => {
        if (!organizationId) return;
        if (window.confirm('Czy na pewno chcesz usunąć to zlecenie? Tej akcji nie można cofnąć.')) {
            try {
                await deleteServiceItem(organizationId, docId);
                showToast('Zlecenie usunięto pomyślnie.', 'success');
            } catch (error) {
                 console.error("Error deleting service item:", error);
                 showToast('Nie udało się usunąć zlecenia.', 'error');
            }
        }
    };
    
    // Client Handlers
    const handleSaveClient = async (clientData: Client | Omit<Client, 'docId'>) => {
        if (!organizationId) return;
        try {
            await saveClient(organizationId, clientData);
            showToast('Klient zapisany pomyślnie.', 'success');
            setClientModalState({ type: null, client: null });
        } catch (error) {
            console.error("Error saving client:", error);
            showToast('Nie udało się zapisać klienta.', 'error');
        }
    };

    const handleDeleteClient = async (docId: string) => {
        if (!organizationId) return;
        if (window.confirm('Czy na pewno chcesz usunąć tego klienta? Wszystkie powiązane z nim zlecenia pozostaną, ale stracą przypisanie.')) {
            try {
                await deleteClient(organizationId, docId);
                showToast('Klienta usunięto pomyślnie.', 'success');
            } catch (error) {
                 console.error("Error deleting client:", error);
                 showToast('Nie udało się usunąć klienta.', 'error');
            }
        }
    };

    // Contact Handlers
    const handleSaveContact = async (contactData: Contact | Omit<Contact, 'docId'>) => {
        if (!organizationId || !selectedClient) return;
        try {
            await saveContact(organizationId, selectedClient.docId, contactData);
            showToast('Kontakt zapisany pomyślnie.', 'success');
            setContactModalState({ type: null, contact: null });
        } catch (error) {
            console.error("Error saving contact:", error);
            showToast('Nie udało się zapisać kontaktu.', 'error');
        }
    };
    
    const handleDeleteContact = async (contactId: string) => {
        if (!organizationId || !selectedClient) return;
        if (window.confirm('Czy na pewno chcesz usunąć ten kontakt?')) {
            try {
                await deleteContact(organizationId, selectedClient.docId, contactId);
                showToast('Kontakt usunięty pomyślnie.', 'success');
            } catch (error) {
                console.error("Error deleting contact:", error);
                showToast('Nie udało się usunąć kontaktu.', 'error');
            }
        }
    };

    // User Management Handlers
    const handleSaveUser = async (userData: OrgUser | Omit<OrgUser, 'docId'>, password?: string) => {
        if (!organizationId) return;

        if (userModalState.type === 'add' && password) {
            try {
                await createNewUserInCloud({ 
                    email: userData.email, 
                    password, 
                    permissions: userData.permissions, 
                    organizationId 
                });
                showToast(`Użytkownik ${userData.email} został utworzony.`, 'success');
            } catch (error: any) {
                console.error("Failed to create user:", error);
                const errorMessage = error.message || 'Nie udało się utworzyć użytkownika.';
                showToast(errorMessage, 'error');
            }
        } else if (userModalState.type === 'edit' && 'docId' in userData) {
            try {
                await updateUserPermissionsInCloud({
                    userId: userData.docId,
                    permissions: userData.permissions,
                });
                showToast(`Uprawnienia dla ${userData.email} zostały zaktualizowane.`, 'success');
            } catch (error: any) {
                console.error("Failed to update user:", error);
                const errorMessage = error.message || 'Nie udało się zaktualizować uprawnień.';
                showToast(errorMessage, 'error');
            }
        }
        setUserModalState({ type: null, user: null }); // Close modal on success or failure
    };

    const handleDeleteUserRequest = (user: OrgUser) => {
        setUserToDelete(user);
    };

    const handleConfirmDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            await deleteUserInCloud(userToDelete.docId);
            showToast(`Użytkownik ${userToDelete.email} został usunięty.`, 'success');
        } catch (error: any) {
            console.error("Failed to delete user:", error);
            const errorMessage = error.message || 'Nie udało się usunąć użytkownika.';
            showToast(errorMessage, 'error');
        } finally {
            setUserToDelete(null); // Close modal
        }
    };

    // Navigation and View Handlers
    const handleNavigate = (view: AppView) => {
        setCurrentView(view);
    };

    const handleViewClientDetails = (client: Client) => {
        setSelectedClient(client);
        setCurrentView('clientDetail');
    };
    
    // Auth check and rendering
    if (isLoadingData) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div></div>;
    }
    
    if (!currentUser || !orgUser) {
        return <Login />;
    }

    const renderView = () => {
        switch(currentView) {
            case 'dashboard':
                return <Dashboard onScan={handleStartScan} onNavigate={handleNavigate} permissions={orgUser?.permissions} />;
            case 'serviceList':
                return <ServiceList 
                    items={serviceItems} 
                    clients={clients} 
                    onEdit={(item) => setServiceModalState({ type: 'edit', item })} 
                    onDelete={handleDeleteServiceItem} 
                    onGetAiTips={handleGetAiTips}
                />;
             case 'scheduledServices':
                return <ScheduledServices 
                    items={serviceItems} 
                    clients={clients} 
                    onEdit={(item) => setServiceModalState({ type: 'edit', item })} 
                    onDelete={handleDeleteServiceItem} 
                    onGetAiTips={handleGetAiTips}
                />;
            case 'clients':
                 return <Clients 
                    clients={clients} 
                    onAddClient={() => setClientModalState({ type: 'add', client: { organizationId, type: 'individual', name: '', phone: '', email: '' } })}
                    onEditClient={(client) => setClientModalState({ type: 'edit', client })}
                    onDeleteClient={handleDeleteClient}
                    onViewDetails={handleViewClientDetails}
                />;
            case 'clientDetail':
                return selectedClient ? <ClientDetail 
                    client={selectedClient} 
                    serviceItems={serviceItems}
                    onBack={() => setCurrentView('clients')} 
                    onAddContact={() => setContactModalState({ type: 'add', contact: { name: '', phone: '', email: '' } })}
                    onEditContact={(contact) => setContactModalState({ type: 'edit', contact })}
                    onDeleteContact={handleDeleteContact}
                    onEditServiceItem={(item) => setServiceModalState({ type: 'edit', item })}
                    onDeleteServiceItem={handleDeleteServiceItem}
                    onGetServiceItemAiTips={handleGetAiTips}
                /> : null;
            case 'history':
                return <History history={globalHistory} onBack={() => setCurrentView('dashboard')} error={historyError} />;
            case 'settings':
                return <Settings 
                    currentMode={scanInputMode}
                    onModeChange={setScanInputMode}
                    isNfcQuickReadEnabled={isNfcQuickReadEnabled}
                    onNfcQuickReadChange={setIsNfcQuickReadEnabled}
                    onBack={() => setCurrentView('dashboard')}
                    orgUsers={orgUsers}
                    currentUser={orgUser}
                    onAddUser={() => setUserModalState({ 
                        type: 'add', 
                        user: { 
                            organizationId,
                            email: '', 
                            permissions: { 
                                canScan: true, canViewServiceList: true, canViewClients: true, 
                                canViewScheduledServices: true, canViewHistory: true, canViewSettings: false, canManageUsers: false 
                            } 
                        } 
                    })}
                    onEditUser={(user) => setUserModalState({ type: 'edit', user })}
                    onDeleteUser={handleDeleteUserRequest}
                />;
            default:
                return <Dashboard onScan={handleStartScan} onNavigate={handleNavigate} permissions={orgUser?.permissions} />;
        }
    };
    

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Header currentView={currentView} onBack={() => currentView === 'clientDetail' ? setCurrentView('clients') : setCurrentView('dashboard')} client={selectedClient} />

            <main className="container mx-auto p-4">
                {renderView()}
            </main>
            
            <div className="fixed bottom-4 right-4 z-20 flex flex-col space-y-3">
                 <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform transform hover:scale-110">
                    <i className="fas fa-sign-out-alt"></i>
                </button>
            </div>
            
             {serviceModalState.type && serviceModalState.item && (
                <ServiceModal 
                    isOpen={!!serviceModalState.type}
                    onClose={() => setServiceModalState({ type: null, item: null })}
                    onSave={handleSaveServiceItem}
                    item={serviceModalState.item}
                    mode={serviceModalState.type}
                    clients={clients}
                    users={orgUsers}
                />
            )}

            {quickEditModalState.isOpen && quickEditModalState.item && (
                <QuickEditModal
                    isOpen={quickEditModalState.isOpen}
                    onClose={() => setQuickEditModalState({ isOpen: false, item: null })}
                    onSave={handleQuickSave}
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

            {contactModalState.type && contactModalState.contact && (
                <ContactModal 
                    isOpen={!!contactModalState.type}
                    onClose={() => setContactModalState({ type: null, contact: null })}
                    onSave={handleSaveContact}
                    contact={contactModalState.contact}
                    mode={contactModalState.type}
                />
            )}

            {userModalState.type && userModalState.user && (
                 <UserModal 
                    isOpen={!!userModalState.type}
                    onClose={() => setUserModalState({ type: null, user: null })}
                    onSave={handleSaveUser}
                    user={userModalState.user}
                    mode={userModalState.type}
                />
            )}
            
            <AiModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} tips={aiTips} isLoading={isLoadingAi} />
            
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            
            <QrScannerModal
                isOpen={isQrScannerOpen}
                onClose={() => setIsQrScannerOpen(false)}
                onScanSuccess={(decodedText) => {
                    setIsQrScannerOpen(false);
                    handleTagRead(decodedText);
                }}
            />
            
             <HybridChoiceModal 
                isOpen={hybridChoiceState.isOpen}
                onClose={() => setHybridChoiceState({ isOpen: false })}
                onNfcSelect={() => {
                    setHybridChoiceState({ isOpen: false });
                    handleNfcScan();
                }}
                onBarcodeSelect={() => {
                    setHybridChoiceState({ isOpen: false });
                    handleBarcodeScan();
                }}
             />

            <ConfirmModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleConfirmDeleteUser}
                title="Potwierdź usunięcie"
                message={`Czy na pewno chcesz trwale usunąć użytkownika ${userToDelete?.email}? Tej akcji nie można cofnąć.`}
                confirmButtonText="Usuń"
                cancelButtonText="Anuluj"
            />
        </div>
    );
};

export default App;