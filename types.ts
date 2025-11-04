export type ServiceStatus = 'Przyjęty' | 'W trakcie diagnozy' | 'Oczekuje na części' | 'W trakcie naprawy' | 'Gotowy do odbioru' | 'Zwrócony klientowi';

export interface Note {
    timestamp: string; // ISO date string
    user: string; // email of the user who added the note
    text: string;
}

export interface ServiceItem {
    docId: string; // Firestore document ID
    id: string; // NFC tag serial number or QR code content, non-editable
    organizationId: string;

    // Client Info
    clientId?: string; // Link to a client document
    contactId?: string; // Link to a contact sub-document
    clientName: string; // Name of the person (individual client or company contact)
    companyName?: string; // Company name, if applicable
    clientPhone: string;
    clientEmail?: string;

    // Device Info
    deviceName: string;
    deviceModel?: string;
    deviceSerialNumber?: string;
    photo?: string; // base64 encoded image string

    // Service Info
    status: ServiceStatus;
    reportedFault: string;
    serviceNotes: Note[]; // Changed from string to an array of Note objects

    // Timestamps
    dateReceived: string; // ISO date string
    lastUpdated: string; // ISO date string
    
    // Scheduling
    nextServiceDate?: string; // ISO date string (YYYY-MM-DD)
}

export type ClientType = 'individual' | 'company';

export interface Contact {
    docId: string;
    name: string;
    phone: string;
    email?: string;
}

export interface Client {
    docId: string;
    organizationId: string;
    type: ClientType;
    // For 'individual' type
    name?: string; 
    // For 'company' type
    companyName?: string; 
    // General contact info (for individual or main office for company)
    phone: string;
    email?: string;
}

export interface HistoryEntry {
    docId?: string;
    timestamp: string;
    user: string;
    type: 'Utworzono' | 'Zmiana Statusu' | 'Dodano Notatkę' | 'Edycja Danych';
    details: string;
    serviceItemId: string;
    serviceItemName: string;
    organizationId: string; // Added for efficient global history querying
}


export interface ModalState {
    type: 'add' | 'edit' | null;
    item: ServiceItem | Omit<ServiceItem, 'docId'> | null;
}

export interface QuickEditModalState {
    isOpen: boolean;
    item: ServiceItem | null;
}

export interface ClientModalState {
    type: 'add' | 'edit' | null;
    client: Client | Omit<Client, 'docId'> | null;
}

export interface ContactModalState {
    type: 'add' | 'edit' | null;
    contact: Contact | Omit<Contact, 'docId'> | null;
}

export type AppView = 'dashboard' | 'serviceList' | 'clients' | 'clientDetail' | 'history' | 'settings' | 'scheduledServices';

export type ScanInputMode = 'nfc' | 'barcode' | 'hybrid';

export interface HybridChoiceModalState {
    isOpen: boolean;
}