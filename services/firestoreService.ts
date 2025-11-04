import { db } from '../firebase/config';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import type { ServiceItem, Client } from '../types';

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

export const deleteClient = (organizationId: string, docId: string) => {
    const clientDoc = doc(db, `organizations/${organizationId}/clients`, docId);
    return deleteDoc(clientDoc);
};
