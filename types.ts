export interface InventoryItem {
    docId: string; // Firestore document ID
    id: string; // NFC tag serial number, non-editable
    organizationId: string; // To scope data to a specific company/tenant
    name: string; // Required
    description: string;
    
    photo?: string; // base64 encoded image string
    status: 'Na stanie' | 'W użyciu' | 'Zarezerwowany' | 'Zutylizowany';
    category?: string;
    quantity: number;
    location?: string;
    
    serialNumber?: string; // User-defined serial number
    customIndex?: string;
    additionalDescription?: string;
    
    supplier?: string;
    purchaseDate?: string; // ISO date string
    purchasePrice?: number;
    
    expiryDate?: string; // ISO date string

    attributes: string[];
    
    lastScanned: string;
}

export interface ModalState {
    type: 'add' | 'edit' | null;
    item: InventoryItem | Omit<InventoryItem, 'docId'> | null;
}

export type AppView = 'dashboard' | 'inventory' | 'history' | 'settings';