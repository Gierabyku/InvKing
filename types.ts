export interface InventoryItem {
    id: string; // NFC tag serial number, non-editable
    name: string; // Required
    description: string;
    
    // New fields
    photo?: string; // base64 encoded image string
    status: 'Na stanie' | 'W użyciu' | 'Zarezerwowany' | 'Zutylizowany';
    category?: string;
    quantity: number;
    location?: string;
    
    // Detailed Info
    serialNumber?: string; // User-defined serial number
    customIndex?: string;
    additionalDescription?: string;
    
    // Purchase/Supplier Info
    supplier?: string;
    purchaseDate?: string; // ISO date string
    purchasePrice?: number;
    
    // Expiry/Warranty
    expiryDate?: string; // ISO date string

    // Attributes/Tags
    attributes: string[];
    
    // System field
    lastScanned: string;
}

export interface ModalState {
    type: 'add' | 'edit' | null;
    item: InventoryItem | null;
}

export type AppView = 'dashboard' | 'inventory' | 'history' | 'settings';