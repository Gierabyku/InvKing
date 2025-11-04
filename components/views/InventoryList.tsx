import React from 'react';
import type { InventoryItem } from '../../types';
import ItemCard from '../ItemCard';

interface InventoryListProps {
    items: InventoryItem[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (docId: string) => void;
    onGetAiTips: (item: InventoryItem) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onEdit, onDelete, onGetAiTips }) => {
    if (items.length === 0) {
        return (
            <div className="text-center text-gray-400 mt-20">
                <i className="fas fa-box-open fa-3x mb-4"></i>
                <h2 className="text-xl font-semibold">Asortyment jest pusty</h2>
                <p>Przejdź do pulpitu, aby zeskanować pierwszy przedmiot.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {items.sort((a, b) => new Date(b.lastScanned).getTime() - new Date(a.lastScanned).getTime()).map(item => (
                <ItemCard
                    key={item.docId}
                    item={item}
                    onEdit={() => onEdit(item)}
                    onDelete={() => onDelete(item.docId)}
                    onGetAiTips={() => onGetAiTips(item)}
                />
            ))}
        </div>
    );
};

export default InventoryList;