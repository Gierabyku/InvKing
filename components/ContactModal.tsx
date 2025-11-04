import React, { useState, useEffect } from 'react';
import type { Contact } from '../types';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contact: Contact | Omit<Contact, 'docId'>) => void;
    contact: Contact | Omit<Contact, 'docId'>;
    mode: 'add' | 'edit';
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSave, contact, mode }) => {
    const [formData, setFormData] = useState(contact);

    useEffect(() => {
        setFormData(contact);
    }, [contact]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all animate-fade-in-up">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold">{mode === 'add' ? 'Dodaj Kontakt' : 'Edytuj Kontakt'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <Input id="name" name="name" label="Imię i Nazwisko" value={formData.name} onChange={handleChange} required />
                        <Input id="phone" name="phone" label="Telefon" type="tel" value={formData.phone} onChange={handleChange} required />
                        <Input id="email" name="email" label="Email (opcjonalnie)" type="email" value={formData.email || ''} onChange={handleChange} />
                    </div>
                    <div className="p-6 border-t border-gray-700 bg-gray-800 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors">Anuluj</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">Zapisz</button>
                    </div>
                </form>
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

export default ContactModal;
