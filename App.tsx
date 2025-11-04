import React, { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, ModalState, AppView } from './types';
import Header from './components/Header';
import ItemModal from './components/ItemModal';
import AiModal from './components/AiModal';
import Toast from './components/Toast';
import { getOrganizationTips } from './services/geminiService';
import Dashboard from './components/views/Dashboard';
import InventoryList from './components/views/InventoryList';
import History from './components/views/History';
import Settings from './components/views/Settings';
import { useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import { getItems, saveItem, deleteItem as deleteItemFromDb } from './services/firestoreService';

const App: React.FC = () => {
    const { currentUser, organizationId } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [modalState, setModalState] = useState<ModalState>({ type: null, item: null });
    const [aiTips, setAiTips] = useState<string>('');
    const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
    const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [scanMode, setScanMode] = useState<'add' | 'check' | null>(null);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);


    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    useEffect(() => {
        if (currentUser && organizationId) {
            setIsLoadingData(true);
            const unsubscribe = getItems(organizationId, (fetchedItems) => {
                setItems(fetchedItems);
                setIsLoadingData(false);
            }, (error) => {
                console.error("Failed to load items from Firestore", error);
                showToast('Nie udało się wczytać przedmiotów z bazy danych.', 'error');
                setIsLoadingData(false);
            });

            return () => unsubscribe(); // Cleanup subscription on unmount
        } else {
            setItems([]); // Clear items if user logs out
            setIsLoadingData(false);
        }
    }, [currentUser, organizationId, showToast]);


    const handleTagRead = useCallback((serialNumber: string) => {
        if (!scanMode || !organizationId) return;

        const existingItem = items.find(item => item.id === serialNumber);

        if (scanMode === 'add') {
            if (existingItem) {
                showToast('Ten tag jest już przypisany. Użyj opcji "Skanuj (Sprawdź)".', 'error');
            } else {
                const newItem: Omit<InventoryItem, 'docId'> = {
                    id: serialNumber,
                    organizationId,
                    name: '',
                    description: '',
                    lastScanned: new Date().toISOString(),
                    photo: '',
                    status: 'Na stanie',
                    category: '',
                    quantity: 1,
                    location: '',
                    serialNumber: '',
                    customIndex: '',
                    additionalDescription: '',
                    supplier: '',
                    purchaseDate: '',
                    purchasePrice: 0,
                    expiryDate: '',
                    attributes: [],
                };
                setModalState({ type: 'add', item: newItem as InventoryItem });
            }
        } else if (scanMode === 'check') {
            if (existingItem) {
                const updatedItem = { ...existingItem, lastScanned: new Date().toISOString() };
                handleSaveItem(updatedItem); // Save the updated scan time
                setModalState({ type: 'edit', item: existingItem });
            } else {
                showToast('Nie znaleziono przedmiotu. Użyj opcji "Skanuj (Dodaj)".', 'error');
            }
        }
        setScanMode(null);
    }, [items, scanMode, organizationId, showToast]);

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
            showToast('Web NFC nie jest wspierane.', 'error');
            const mockSerialNumber = `mock-sn-${Date.now()}`;
            handleTagRead(mockSerialNumber);
        }
    }, [scanMode, showToast, handleTagRead]);

    useEffect(() => {
        if (scanMode) {
            handleScan();
        }
    }, [scanMode, handleScan]);


    const handleSaveItem = useCallback(async (itemToSave: InventoryItem) => {
        if (!organizationId) {
            showToast('Błąd: Brak identyfikatora organizacji.', 'error');
            return;
        }
        try {
            await saveItem(organizationId, itemToSave);
            showToast(modalState.type === 'add' ? 'Przedmiot dodany!' : 'Przedmiot zaktualizowany!', 'success');
        } catch (error) {
            showToast('Nie udało się zapisać przedmiotu.', 'error');
            console.error("Error saving item:", error);
        }
        setModalState({ type: null, item: null });
        setCurrentView('inventory');
    }, [organizationId, modalState.type, showToast]);

    const handleDeleteItem = useCallback(async (docId: string) => {
        if (!organizationId) return;
        try {
            await deleteItemFromDb(organizationId, docId);
            showToast('Przedmiot usunięty.', 'success');
        } catch (error) {
            showToast('Nie udało się usunąć przedmiotu.', 'error');
            console.error("Error deleting item:", error);
        }
    }, [organizationId, showToast]);

    const handleGetAiTips = useCallback(async (item: InventoryItem) => {
        setIsAiModalOpen(true);
        setIsLoadingAi(true);
        setAiTips('');
        try {
            const tips = await getOrganizationTips(item);
            setAiTips(tips);
        } catch (error) {
            setAiTips('Przepraszam, nie udało mi się w tej chwili pobrać wskazówek.');
            showToast('Nie udało się pobrać wskazówek AI.', 'error');
        } finally {
            setIsLoadingAi(false);
        }
    }, [showToast]);
    
    const renderView = useCallback(() => {
        if (isLoadingData) {
            return (
                 <div className="flex justify-center items-center h-full mt-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
                </div>
            )
        }
        switch (currentView) {
            case 'inventory':
                return <InventoryList 
                            items={items}
                            onEdit={(item) => setModalState({ type: 'edit', item })}
                            onDelete={(docId) => handleDeleteItem(docId)}
                            onGetAiTips={handleGetAiTips}
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
    }, [currentView, items, handleDeleteItem, handleGetAiTips, isLoadingData]);

    if (!currentUser) {
        return <Login />;
    }

    return (
        <div className="min-h-screen bg-gray-900 font-sans flex flex-col">
            <Header currentView={currentView} onBack={() => setCurrentView('dashboard')} />
            <main className="flex-grow p-4 container mx-auto">
               {renderView()}
            </main>
            
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

            {modalState.type && modalState.item && (
                <ItemModal
                    isOpen={!!modalState.type}
                    onClose={() => setModalState({ type: null, item: null })}
                    onSave={handleSaveItem}
                    item={modalState.item}
                    mode={modalState.type}
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