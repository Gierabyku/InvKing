import { db } from '../firebase/config';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch
} from 'firebase/firestore';
import type { InventoryItem } from '../types';

// Get all items for an organization with real-time updates
export const getItems = (
    organizationId: string,
    callback: (items: InventoryItem[]) => void,
    onError: (error: Error) => void
) => {
    const itemsCollection = collection(db, `organizations/${organizationId}/items`);
    const q = query(itemsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data()
        } as InventoryItem));
        callback(items);
    }, (error) => {
        console.error("Error fetching items: ", error);
        onError(error);
    });

    return unsubscribe;
};

// Add or update an item
export const saveItem = async (organizationId: string, item: InventoryItem | Omit<InventoryItem, 'docId'>) => {
    const itemsCollection = collection(db, `organizations/${organizationId}/items`);

    if ('docId' in item && item.docId) {
        // Update existing item
        const itemDoc = doc(db, `organizations/${organizationId}/items`, item.docId);
        // Exclude docId from the data being saved
        const { docId, ...itemData } = item;
        return updateDoc(itemDoc, itemData);
    } else {
        // Add new item
        return addDoc(itemsCollection, item);
    }
};

// Delete an item
export const deleteItem = async (organizationId: string, docId: string) => {
    const itemDoc = doc(db, `organizations/${organizationId}/items`, docId);
    return deleteDoc(itemDoc);
};
