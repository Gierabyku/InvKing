
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
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

const App: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [modalState, setModalState] = useState<ModalState>({ type: null, item: null });
    const [aiTips, setAiTips] = useState<string>('');
    const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
    const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [scanMode, setScanMode] = useState<'add' | 'check' | null>(null);

    useEffect(() => {
        try {
            const savedItems = localStorage.getItem('inventoryItems');
            if (savedItems) {
                setItems(JSON.parse(savedItems));
            }
        } catch (error) {
            console.error("Failed to load items from localStorage", error);
            setToast({ message: 'Nie udało się wczytać zapisanych przedmiotów.', type: 'error' });
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('inventoryItems', JSON.stringify(items));
        } catch (error) {
            console.error("Failed to save items to localStorage", error);
            setToast({ message: 'Nie udało się zapisać przedmiotów.', type: 'error' });
        }
    }, [items]);

    // FIX: Memoize showToast to ensure it has a stable reference when used in other useCallback hooks.
    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // FIX: Memoize handleTagRead to prevent stale closures over `scanMode` and `items`.
    const handleTagRead = useCallback((serialNumber: string) => {
        if (!scanMode) return;

        const existingItem = items.find(item => item.id === serialNumber);

        if (scanMode === 'add') {
            if (existingItem) {
                showToast('Ten tag jest już przypisany. Użyj opcji "Skanuj (Sprawdź)".', 'error');
            } else {
                const newItem: InventoryItem = {
                    id: serialNumber,
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
                setModalState({ type: 'add', item: newItem });
            }
        } else if (scanMode === 'check') {
            if (existingItem) {
                setItems(prevItems =>
                    prevItems.map(item =>
                        item.id === serialNumber ? { ...item, lastScanned: new Date().toISOString() } : item
                    )
                );
                setModalState({ type: 'edit', item: existingItem });
            } else {
                showToast('Nie znaleziono przedmiotu. Użyj opcji "Skanuj (Dodaj)".', 'error');
            }
        }
        setScanMode(null); // Reset scan mode after operation
    }, [items, scanMode, showToast]);

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
                showToast('Skanowanie NFC nie powiodło się. Upewnij się, że uprawnienia są włączone.', 'error');
            }
        } else {
            showToast('Web NFC nie jest wspierane na tym urządzeniu.', 'error');
            // Fallback for testing without NFC
            const mockSerialNumber = `mock-sn-${Date.now()}`;
            handleTagRead(mockSerialNumber);
        }
    }, [scanMode, showToast, handleTagRead]);

    useEffect(() => {
        if (scanMode) {
            handleScan();
        }
    }, [scanMode, handleScan]);


    const handleSaveItem = useCallback((itemToSave: InventoryItem) => {
        if (modalState.type === 'add') {
            setItems(prevItems => [...prevItems, itemToSave]);
            showToast('Przedmiot dodany pomyślnie!', 'success');
        } else if (modalState.type === 'edit') {
            setItems(prevItems => prevItems.map(item => item.id === itemToSave.id ? itemToSave : item));
            showToast('Przedmiot zaktualizowany pomyślnie!', 'success');
        }
        setModalState({ type: null, item: null });
        setCurrentView('inventory');
    }, [modalState.type, showToast]);

    const handleDeleteItem = useCallback((id: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
        showToast('Przedmiot usunięty.', 'success');
    }, [showToast]);

    const handleGetAiTips = useCallback(async (item: InventoryItem) => {
        setIsAiModalOpen(true);
        setIsLoadingAi(true);
        setAiTips('');
        try {
            const tips = await getOrganizationTips(item);
            setAiTips(tips);
        } catch (error) {
            console.error("Error fetching AI tips:", error);
            setAiTips('Przepraszam, nie udało mi się w tej chwili pobrać wskazówek.');
            showToast('Nie udało się pobrać wskazówek AI.', 'error');
        } finally {
            setIsLoadingAi(false);
        }
    }, [showToast]);
    
    const renderView = useCallback(() => {
        switch (currentView) {
            case 'inventory':
                return <InventoryList 
                            items={items}
                            onEdit={(item) => setModalState({ type: 'edit', item })}
                            onDelete={handleDeleteItem}
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
    }, [currentView, items, handleDeleteItem, handleGetAiTips]);

    return (
        <div className="min-h-screen bg-gray-900 font-sans flex flex-col">
            <Header currentView={currentView} onBack={() => setCurrentView('dashboard')} />
            <main className="flex-grow p-4">
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
