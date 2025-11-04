import React from 'react';
import type { ServiceItem, ServiceStatus } from '../types';

interface ServiceCardProps {
    item: ServiceItem;
    onEdit: () => void;
    onDelete: () => void;
    onGetAiTips: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ item, onEdit, onDelete, onGetAiTips }) => {
    
    const getStatusChip = (status: ServiceStatus) => {
        const baseClasses = "text-xs font-semibold px-2.5 py-0.5 rounded-full";
        const statusMap: { [key in ServiceStatus]: string } = {
            'Przyjęty': `${baseClasses} bg-blue-900 text-blue-300`,
            'W trakcie diagnozy': `${baseClasses} bg-yellow-900 text-yellow-300`,
            'Oczekuje na części': `${baseClasses} bg-orange-900 text-orange-300`,
            'W trakcie naprawy': `${baseClasses} bg-purple-900 text-purple-300`,
            'Gotowy do odbioru': `${baseClasses} bg-green-900 text-green-300`,
            'Zwrócony klientowi': `${baseClasses} bg-gray-700 text-gray-300`,
        };
        return statusMap[status] || `${baseClasses} bg-gray-700 text-gray-300`;
    };

    const getNextServiceDateInfo = (dateString?: string) => {
        if (!dateString) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date
        const serviceDate = new Date(dateString);
        serviceDate.setHours(0, 0, 0, 0); // Normalize service date

        const diffTime = serviceDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const formattedDate = new Date(dateString).toLocaleDateString('pl-PL');

        if (diffDays < 0) {
            return {
                text: `Zaległy ${-diffDays} ${-diffDays === 1 ? 'dzień' : 'dni'} (${formattedDate})`,
                bgColor: 'bg-red-900/70',
                textColor: 'text-red-300'
            };
        }
        if (diffDays <= 30) {
            return {
                text: `Termin za ${diffDays} ${diffDays === 1 ? 'dzień' : 'dni'} (${formattedDate})`,
                bgColor: 'bg-yellow-900/70',
                textColor: 'text-yellow-300'
            };
        }
        return {
            text: `Zaplanowano na ${formattedDate}`,
            bgColor: 'bg-gray-700/50',
            textColor: 'text-gray-300'
        };
    };

    const dateInfo = getNextServiceDateInfo(item.nextServiceDate);

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-[1.02] flex flex-col">
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-indigo-400 pr-2">{item.deviceName}</h3>
                    <span className={getStatusChip(item.status)}>{item.status}</span>
                </div>
                
                <div className="text-sm text-gray-400 mb-3 space-y-1">
                    <p><i className="fas fa-user w-4 mr-2 text-gray-500"></i>{item.clientName}</p>
                    {item.companyName && <p><i className="fas fa-building w-4 mr-2 text-gray-500"></i>{item.companyName}</p>}
                    <p><i className="fas fa-phone-alt w-4 mr-2 text-gray-500"></i>{item.clientPhone}</p>
                    {item.clientEmail && <p><i className="fas fa-envelope w-4 mr-2 text-gray-500"></i>{item.clientEmail}</p>}
                </div>
                
                <p className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded-md">
                    <strong className="text-gray-400">Zgłoszona usterka:</strong> {item.reportedFault}
                </p>

                {dateInfo && (
                    <div className={`mt-3 p-2 rounded-md text-xs text-center font-semibold ${dateInfo.bgColor} ${dateInfo.textColor}`}>
                        <i className="fas fa-calendar-check mr-2"></i>
                        {dateInfo.text}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-700 mt-auto p-3 flex justify-end space-x-2 bg-gray-800/50">
                <button onClick={onGetAiTips} title="Sugestie AI" className="px-3 py-1 text-xs font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors flex items-center">
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
    );
};

export default ServiceCard;