import React from 'react';
import type { Contact } from '../types';

interface ContactCardProps {
    contact: Contact;
    onEdit: () => void;
    onDelete: () => void;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onEdit, onDelete }) => {
    return (
        <div className="bg-gray-800 rounded-lg shadow-md p-4 flex flex-col justify-between">
            <div>
                <h4 className="font-bold text-white">{contact.name}</h4>
                <div className="text-sm text-gray-400 mt-2 space-y-1">
                    <p><i className="fas fa-phone-alt w-4 mr-2 text-gray-500"></i>{contact.phone}</p>
                    {contact.email && <p><i className="fas fa-envelope w-4 mr-2 text-gray-500"></i>{contact.email}</p>}
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
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

export default ContactCard;
