import React from 'react';
import type { Client } from '../types';

interface ClientCardProps {
    client: Client;
    onEdit: () => void;
    onDelete: () => void;
    onHistory: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete, onHistory }) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-[1.02] flex flex-col">
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-indigo-400 pr-2">{client.clientName}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${client.type === 'company' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                        {client.type === 'company' ? 'Firma' : 'Indywidualny'}
                    </span>
                </div>
                
                <div className="text-sm text-gray-400 mb-3 space-y-1">
                    {client.companyName && <p><i className="fas fa-building w-4 mr-2 text-gray-500"></i>{client.companyName}</p>}
                    <p><i className="fas fa-phone-alt w-4 mr-2 text-gray-500"></i>{client.clientPhone}</p>
                    {client.clientEmail && <p><i className="fas fa-envelope w-4 mr-2 text-gray-500"></i>{client.clientEmail}</p>}
                </div>
            </div>
            <div className="border-t border-gray-700 mt-auto p-3 flex justify-end space-x-2 bg-gray-800/50">
                 <button onClick={onHistory} title="Historia Zleceń" className="px-3 py-1 text-xs font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors flex items-center">
                    <i className="fas fa-history"></i>
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

export default ClientCard;
