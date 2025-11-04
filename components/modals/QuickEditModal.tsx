import React, { useState } from 'react';
import type { ServiceItem, ServiceStatus } from '../../types';

interface QuickEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: ServiceItem, newStatus: ServiceStatus, newNote: string) => void;
    item: ServiceItem;
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const [newStatus, setNewStatus] = useState<ServiceStatus>(item.status);
    const [newNote, setNewNote] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(item, newStatus, newNote);
    };

    const statusOptions: ServiceStatus[] = ['Przyjęty', 'W trakcie diagnozy', 'Oczekuje na części', 'W trakcie naprawy', 'Gotowy do odbioru', 'Zwrócony klientowi'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Szybka Edycja Zlecenia</h2>
                    <p className="text-sm text-gray-400">ID: {item.id}</p>
                </div>

                <div className="overflow-y-auto p-6 space-y-4">
                    {/* Read-only info */}
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold text-indigo-400">{item.deviceName}</h3>
                        <p className="text-sm text-gray-400"><i className="fas fa-user w-4 mr-2 text-gray-500"></i>{item.clientName} {item.companyName ? `(${item.companyName})` : ''}</p>
                        <p className="text-sm text-gray-400"><i className="fas fa-phone-alt w-4 mr-2 text-gray-500"></i>{item.clientPhone}</p>
                    </div>

                    <form id="quick-edit-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Zmień Status Naprawy</label>
                            <select 
                                id="status" 
                                name="status" 
                                value={newStatus} 
                                onChange={(e) => setNewStatus(e.target.value as ServiceStatus)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="newNote" className="block text-sm font-medium text-gray-300 mb-1">Dodaj Nową Notatkę (opcjonalnie)</label>
                            <textarea 
                                id="newNote" 
                                name="newNote" 
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Wpisz treść notatki..."
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                rows={4}
                            />
                        </div>
                    </form>
                </div>
                
                <div className="p-6 border-t border-gray-700 mt-auto bg-gray-800 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors">Anuluj</button>
                    <button type="submit" form="quick-edit-form" className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">Zapisz Zmiany</button>
                </div>
            </div>
        </div>
    );
};

export default QuickEditModal;
