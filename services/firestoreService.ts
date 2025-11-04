import { db } from '../firebase/config';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    writeBatch,
    collectionGroup,
    orderBy,
    limit,
    where
} from 'firebase/firestore';
import type { ServiceItem, Client, Contact, HistoryEntry } from '../types';


const cleanUndefinedFields = (data: object) => {
    const cleanedData: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key) && (data as any)[key] !== undefined) {
            cleanedData[key] = (data as any)[key];
        }
    }
    return cleanedData;
};


// === Service Items Functions ===

export const getServiceItems = (
    organizationId: string,
    callback: (items: ServiceItem[]) => void,
    onError: (error: Error) => void
) => {
    const itemsCollection = collection(db, `organizations/${organizationId}/serviceItems`);
    const q = query(itemsCollection);

    return onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data()
        } as ServiceItem));
        callback(items);
    }, onError);
};

export const getSingleServiceItem = async (organizationId: string, docId: string): Promise<ServiceItem | null> => {
    const itemDocRef = doc(db, `organizations/${organizationId}/serviceItems`, docId);
    const docSnap = await getDoc(itemDocRef);
    if (docSnap.exists()) {
        return { docId: docSnap.id, ...docSnap.data() } as ServiceItem;
    } else {
        return null;
    }
};

export const saveServiceItem = (organizationId: string, item: ServiceItem | Omit<ServiceItem, 'docId'> | Partial<ServiceItem>) => {
    const itemData = { ...item, lastUpdated: new Date().toISOString() };
    const cleanedItemData = cleanUndefinedFields(itemData);

    if ('docId' in cleanedItemData && cleanedItemData.docId) {
        const itemDoc = doc(db, `organizations/${organizationId}/serviceItems`, cleanedItemData.docId);
        const { docId, ...dataToUpdate } = cleanedItemData;
        return updateDoc(itemDoc, dataToUpdate);
    } else {
        const itemsCollection = collection(db, `organizations/${organizationId}/serviceItems`);
        return addDoc(itemsCollection, cleanedItemData);
    }
};

export const deleteServiceItem = (organizationId: string, docId: string) => {
    const itemDoc = doc(db, `organizations/${organizationId}/serviceItems`, docId);
    return deleteDoc(itemDoc);
};


// === History Functions ===

export const addHistoryEntry = (organizationId: string, serviceItemId: string, entry: Omit<HistoryEntry, 'docId'>) => {
    const historyCollection = collection(db, `organizations/${organizationId}/serviceItems/${serviceItemId}/history`);
    return addDoc(historyCollection, entry);
};

export const getHistoryForItem = (
    organizationId: string,
    serviceItemId: string,
    callback: (history: HistoryEntry[]) => void,
    onError: (error: Error) => void
) => {
    const historyCollection = collection(db, `organizations/${organizationId}/serviceItems/${serviceItemId}/history`);
    const q = query(historyCollection, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (querySnapshot) => {
        const history = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data()
        } as HistoryEntry));
        callback(history);
    }, onError);
};

export const getGlobalHistory = (
    organizationId: string,
    callback: (history: HistoryEntry[]) => void,
    onError: (error: Error) => void
) => {
    const historyQuery = query(
      collectionGroup(db, 'history'),
      where('organizationId', '==', organizationId),
      orderBy('timestamp', 'desc'),
      limit(25)
    );
  
    return onSnapshot(historyQuery, (querySnapshot) => {
      const history = querySnapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      } as HistoryEntry));
      callback(history);
    }, (error) => {
        console.error("Error fetching global history. This may be due to a missing Firestore index. Check the console for a link to create it.", error);
        onError(error);
    });
};


// === Clients Functions ===

export const getClients = (
    organizationId: string,
    callback: (clients: Client[]) => void,
    onError: (error: Error) => void
) => {
    const clientsCollection = collection(db, `organizations/${organizationId}/clients`);
    const q = query(clientsCollection);

    return onSnapshot(q, (querySnapshot) => {
        const clients = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data()
        } as Client));
        callback(clients);
    }, onError);
};

export const saveClient = (organizationId: string, client: Client | Omit<Client, 'docId'>) => {
    const clientData = { ...client, organizationId };
    const cleanedData = cleanUndefinedFields(clientData);

    if ('docId' in cleanedData && cleanedData.docId) {
        const clientDoc = doc(db, `organizations/${organizationId}/clients`, cleanedData.docId);
        const { docId, ...dataToUpdate } = cleanedData;
        return updateDoc(clientDoc, dataToUpdate);
    } else {
        const clientsCollection = collection(db, `organizations/${organizationId}/clients`);
        return addDoc(clientsCollection, cleanedData);
    }
};

export const deleteClient = async (organizationId: string, docId: string) => {
    const clientDoc = doc(db, `organizations/${organizationId}/clients`, docId);
    return deleteDoc(clientDoc);
};


// === Contacts Functions ===

export const getContacts = (
    organizationId: string,
    clientId: string,
    callback: (contacts: Contact[]) => void,
    onError: (error: Error) => void
) => {
    const contactsCollection = collection(db, `organizations/${organizationId}/clients/${clientId}/contacts`);
    const q = query(contactsCollection);
    
    return onSnapshot(q, (querySnapshot) => {
        const contacts = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data()
        } as Contact));
        callback(contacts);
    }, onError);
};

export const saveContact = (organizationId: string, clientId: string, contact: Contact | Omit<Contact, 'docId'>) => {
    const cleanedData = cleanUndefinedFields(contact);
    if ('docId' in cleanedData && cleanedData.docId) {
        const contactDoc = doc(db, `organizations/${organizationId}/clients/${clientId}/contacts`, cleanedData.docId);
        const { docId, ...dataToUpdate } = cleanedData;
        return updateDoc(contactDoc, dataToUpdate);
    } else {
        const contactsCollection = collection(db, `organizations/${organizationId}/clients/${clientId}/contacts`);
        return addDoc(contactsCollection, cleanedData);
    }
};

export const deleteContact = (organizationId: string, clientId: string, contactId: string) => {
    const contactDoc = doc(db, `organizations/${organizationId}/clients/${clientId}/contacts`, contactId);
    return deleteDoc(contactDoc);
};