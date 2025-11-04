import React from 'react';
import type { ServiceItem } from '../../types';
import ServiceCard from '../ServiceCard';

interface ServiceListProps {
    items: ServiceItem[];
    onEdit: (item: ServiceItem) => void;
    onDelete: (docId: string) => void;
    onGetAiTips: (item: ServiceItem) => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ items, onEdit, onDelete, onGetAiTips }) => {
    if (items.length === 0) {
        return (
            <div className="text-center text-gray-400 mt-20">
                <i className="fas fa-tools fa-3x mb-4"></i>
                <h2 className="text-xl font-semibold">Brak urządzeń w serwisie</h2>
                <p>Przejdź do pulpitu, aby przyjąć pierwsze urządzenie.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {items.map(item => (
                <ServiceCard
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

export default ServiceList;
