export type ServiceStatus = 'Przyjęty' | 'W trakcie diagnozy' | 'Oczekuje na części' | 'W trakcie naprawy' | 'Gotowy do odbioru' | 'Zwrócony klientowi';

export interface ServiceItem {
    docId: string; // Firestore document ID
    id: string; // NFC tag serial number, non-editable
    organizationId: string;

    // Client Info
    clientId?: string; // Link to a client document
    clientName: string;
    companyName?: string;
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
    serviceNotes?: string;

    // Timestamps
    dateReceived: string; // ISO date string
    lastUpdated: string; // ISO date string
}

export type ClientType = 'individual' | 'company';

export interface Client {
    docId: string;
    organizationId: string;
    type: ClientType;
    clientName: string; // For individuals, full name. For companies, contact person.
    companyName?: string;
    clientPhone: string;
    clientEmail?: string;
}

export interface ModalState {
    type: 'add' | 'edit' | null;
    item: ServiceItem | Omit<ServiceItem, 'docId'> | null;
}

export interface ClientModalState {
    type: 'add' | 'edit' | null;
    // FIX: Allow the modal state to hold a new client object stub (Omit<Client, 'docId'>) as well as an existing client.
    client: Client | Omit<Client, 'docId'> | null;
}

export type AppView = 'dashboard' | 'serviceList' | 'clients' | 'history' | 'settings';