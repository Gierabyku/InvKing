import React from 'react';
import type { InventoryItem } from '../types';

interface ItemCardProps {
    item: InventoryItem;
    onEdit: () => void;
    onDelete: () => void;
    onGetAiTips: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit, onDelete, onGetAiTips }) => {
    
    const getStatusChip = (status: InventoryItem['status']) => {
        const baseClasses = "text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full";
        switch (status) {
            case 'Na stanie': return `${baseClasses} bg-green-900 text-green-300`;
            case 'W użyciu': return `${baseClasses} bg-blue-900 text-blue-300`;
            case 'Zarezerwowany': return `${baseClasses} bg-yellow-900 text-yellow-300`;
            case 'Zutylizowany': return `${baseClasses} bg-gray-700 text-gray-300`;
            default: return `${baseClasses} bg-gray-700 text-gray-300`;
        }
    };

    const ExpiryInfo = ({ expiryDate }: { expiryDate?: string }) => {
        if (!expiryDate) return null;
        
        const now = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (daysUntilExpiry < 0) {
            return <p className="text-xs font-semibold text-red-400"><i className="fas fa-exclamation-triangle mr-1"></i>Przedawniony</p>;
        }
        if (daysUntilExpiry <= 30) {
            return <p className="text-xs font-semibold text-yellow-400"><i className="fas fa-exclamation-circle mr-1"></i>Wygasa za {daysUntilExpiry} dni</p>;
        }
        return null;
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-[1.02]">
            <div className="flex">
                {item.photo ? (
                    <img src={item.photo} alt={item.name} className="w-24 h-full object-cover"/>
                ) : (
                    <div className="w-24 h-24 bg-gray-700 flex items-center justify-center">
                        <i className="fas fa-image text-gray-500 text-3xl"></i>
                    </div>
                )}
                <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start">
                             <h3 className="text-lg font-bold text-indigo-400 pr-2">{item.name}</h3>
                             <div className="text-right flex-shrink-0">
                                <ExpiryInfo expiryDate={item.expiryDate} />
                             </div>
                        </div>

                        <div className="flex items-center mt-1 mb-2">
                             <span className={getStatusChip(item.status)}>{item.status}</span>
                        </div>

                        <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                        
                        <div className="flex text-xs text-gray-500 mt-2 space-x-4">
                            {item.location && <span><i className="fas fa-map-marker-alt mr-1"></i>{item.location}</span>}
                            <span>Ilość: {item.quantity}</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 mt-3 pt-3 flex justify-end space-x-2">
                        <button onClick={onGetAiTips} title="Porady AI" className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors flex items-center">
                            <i className="fas fa-lightbulb"></i>
                        </button>
                        <button onClick={onEdit} title="Edytuj" className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                            <i className="fas fa-pencil-alt"></i>
                        </button>
                        <button onClick={onDelete} title="Usuń" className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                            <i className="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemCard;