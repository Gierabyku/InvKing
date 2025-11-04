import { db } from '../firebase/config';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import type { ServiceItem, Client, Contact } from '../types';

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

export const saveServiceItem = (organizationId: string, item: ServiceItem | Omit<ServiceItem, 'docId'>) => {
    const itemData = { ...item, lastUpdated: new Date().toISOString() };
    if ('docId' in itemData && itemData.docId) {
        const itemDoc = doc(db, `organizations/${organizationId}/serviceItems`, itemData.docId);
        const { docId, ...dataToUpdate } = itemData;
        return updateDoc(itemDoc, dataToUpdate);
    } else {
        const itemsCollection = collection(db, `organizations/${organizationId}/serviceItems`);
        return addDoc(itemsCollection, itemData);
    }
};

export const deleteServiceItem = (organizationId: string, docId: string) => {
    const itemDoc = doc(db, `organizations/${organizationId}/serviceItems`, docId);
    return deleteDoc(itemDoc);
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
    if ('docId' in clientData && clientData.docId) {
        const clientDoc = doc(db, `organizations/${organizationId}/clients`, clientData.docId);
        const { docId, ...dataToUpdate } = clientData;
        return updateDoc(clientDoc, dataToUpdate);
    } else {
        const clientsCollection = collection(db, `organizations/${organizationId}/clients`);
        return addDoc(clientsCollection, clientData);
    }
};

export const deleteClient = async (organizationId: string, docId: string) => {
    // This is a more complex operation if we need to delete subcollections
    // For now, we just delete the client document. A more robust solution
    // would involve a cloud function to clean up subcollections.
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
    if ('docId' in contact && contact.docId) {
        const contactDoc = doc(db, `organizations/${organizationId}/clients/${clientId}/contacts`, contact.docId);
        const { docId, ...dataToUpdate } = contact;
        return updateDoc(contactDoc, dataToUpdate);
    } else {
        const contactsCollection = collection(db, `organizations/${organizationId}/clients/${clientId}/contacts`);
        return addDoc(contactsCollection, contact);
    }
};

export const deleteContact = (organizationId: string, clientId: string, contactId: string) => {
    const contactDoc = doc(db, `organizations/${organizationId}/clients/${clientId}/contacts`, contactId);
    return deleteDoc(contactDoc);
};
