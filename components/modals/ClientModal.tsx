import React, { useState, useEffect } from 'react';
import type { Client } from '../../types';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Client | Omit<Client, 'docId'>) => void;
    client: Client | Omit<Client, 'docId'>;
    mode: 'add' | 'edit';
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, client, mode }) => {
    const [formData, setFormData] = useState(client);

    useEffect(() => {
        setFormData(client);
    }, [client]);
    
    if (!isOpen) return null;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };

        // Reset companyName if switching to individual
        if (name === 'type' && value === 'individual') {
            newFormData.companyName = '';
        }
        // Reset name if switching to company
        if (name === 'type' && value === 'company') {
            newFormData.name = '';
        }
        
        setFormData(newFormData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-700">
                     <h2 className="text-xl font-bold">{mode === 'add' ? 'Dodaj Nowego Klienta' : 'Edytuj Dane Klienta'}</h2>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Typ Klienta</label>
                        <select name="type" id="type" value={formData.type} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="individual">Indywidualny</option>
                            <option value="company">Firma</option>
                        </select>
                    </div>

                    {formData.type === 'individual' ? (
                        <Input id="name" name="name" label="Imię i Nazwisko" value={formData.name || ''} onChange={handleChange} required />
                    ) : (
                        <Input id="companyName" name="companyName" label="Nazwa Firmy" value={formData.companyName || ''} onChange={handleChange} required />
                    )}
                    
                    <Input id="phone" name="phone" label="Telefon" type="tel" value={formData.phone} onChange={handleChange} required />
                    <Input id="email" name="email" label="Email (opcjonalnie)" type="email" value={formData.email || ''} onChange={handleChange} />
                </form>
                 <div className="p-6 border-t border-gray-700 mt-auto bg-gray-800 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors">Anuluj</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">Zapisz</button>
                </div>
            </div>
        </div>
    );
};

const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
);

export default ClientModal;