import { db } from '../firebase/config';
import { getFunctions, httpsCallable } from "firebase/functions";
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
    collectionGroup,
    orderBy,
    limit,
    where,
    getDocs,
    arrayUnion,
    setDoc,
} from 'firebase/firestore';
import type { ServiceItem, Client, Contact, HistoryEntry, Note, OrgUser } from '../types';


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

export const getServiceItemByTagId = async (organizationId: string, tagId: string): Promise<ServiceItem | null> => {
    const itemsCollection = collection(db, `organizations/${organizationId}/serviceItems`);
    const q = query(itemsCollection, where("id", "==", tagId), limit(1));
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            return { docId: docSnap.id, ...docSnap.data() } as ServiceItem;
        }
        return null;
    } catch(error) {
        console.error("Error fetching item by tag ID. This may be due to a missing Firestore index. Check the console for a link to create it.", error);
        throw error;
    }
};

export const createServiceItemWithHistory = async (
    organizationId: string,
    itemData: Omit<ServiceItem, 'docId'>,
    historyEntries: Omit<HistoryEntry, 'docId' | 'serviceItemId'>[]
) => {
    const batch = writeBatch(db);
    const itemsCollection = collection(db, `organizations/${organizationId}/serviceItems`);
    const newItemRef = doc(itemsCollection);

    const dataToSave = { ...itemData, organizationId };

    batch.set(newItemRef, cleanUndefinedFields(dataToSave));

    const historyCollection = collection(newItemRef, 'history');
    historyEntries.forEach(entry => {
        const historyRef = doc(historyCollection);
        batch.set(historyRef, { ...entry, serviceItemId: newItemRef.id, organizationId });
    });

    try {
        await batch.commit();
        return newItemRef.id;
    } catch (error: any) {
        console.error("Batch commit failed in createServiceItemWithHistory:", error);
        if (error.code === 'permission-denied') {
            throw new Error("Missing or insufficient permissions. Check Firestore rules.");
        }
        throw error;
    }
};


export const updateServiceItemWithHistory = async (
    organizationId: string,
    itemDocId: string,
    updateData: Partial<ServiceItem>,
    newNote: Note | null,
    newHistoryEntries: Omit<HistoryEntry, 'docId' | 'serviceItemId'>[]
) => {
    const batch = writeBatch(db);
    const itemRef = doc(db, `organizations/${organizationId}/serviceItems`, itemDocId);
    
    const finalUpdateData = { ...updateData };
    if (newNote) {
        (finalUpdateData as any).serviceNotes = arrayUnion(newNote);
    }

    batch.update(itemRef, cleanUndefinedFields(finalUpdateData));

    if (newHistoryEntries.length > 0) {
        const historyCollection = collection(itemRef, 'history');
        newHistoryEntries.forEach(entry => {
            const historyRef = doc(historyCollection);
            batch.set(historyRef, { ...entry, serviceItemId: itemDocId, organizationId });
        });
    }

    await batch.commit();
};


export const deleteServiceItem = (organizationId: string, docId: string) => {
    const itemDoc = doc(db, `organizations/${organizationId}/serviceItems`, docId);
    return deleteDoc(itemDoc);
};


// === History Functions ===

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

// === Organization Users Functions ===

export const getOrgUsers = (
    organizationId: string,
    callback: (users: OrgUser[]) => void,
    onError: (error: Error) => void
) => {
    const q = query(collection(db, 'users'), where('organizationId', '==', organizationId));

    return onSnapshot(q, (querySnapshot) => {
        const users = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data()
        } as OrgUser));
        callback(users);
    }, onError);
};


export const saveOrgUser = (user: OrgUser | Omit<OrgUser, 'docId'>) => {
    const userData = { ...user };
    const cleanedData = cleanUndefinedFields(userData);

    if ('docId' in cleanedData && cleanedData.docId) {
        const userDoc = doc(db, `users`, cleanedData.docId);
        const { docId, ...dataToUpdate } = cleanedData;
        return updateDoc(userDoc, dataToUpdate);
    } else {
        // This path should ideally not be taken, as docId (UID) is required.
        // If we need to create a user here, we'd need their UID first.
        // For now, we assume creation happens elsewhere and we only update.
        throw new Error("Cannot save user without a docId (UID).");
    }
};


export const createNewUserInCloud = async (userData: {
    email: string;
    password?: string;
    // isAdmin: boolean; // Removed
    permissions: any;
    organizationId: string;
}) => {
    const functions = getFunctions();
    const createNewUser = httpsCallable(functions, 'createNewUser');
    try {
        const result = await createNewUser(userData);
        return result.data;
    } catch (error) {
        console.error("Error calling createNewUser function:", error);
        throw error;
    }
};