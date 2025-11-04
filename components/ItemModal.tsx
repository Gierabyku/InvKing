import React, { useState, useEffect, useRef } from 'react';
import type { InventoryItem } from '../types';

interface ItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: InventoryItem) => void;
    item: InventoryItem | Omit<InventoryItem, 'docId'>;
    mode: 'add' | 'edit';
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="border-t border-gray-700 pt-4 mb-4">
            <h3 onClick={() => setIsOpen(!isOpen)} className="text-lg font-semibold text-gray-300 mb-2 cursor-pointer flex justify-between items-center">
                {title}
                <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </h3>
            {isOpen && <div className="space-y-4">{children}</div>}
        </div>
    );
};

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSave, item, mode }) => {
    const [formData, setFormData] = useState<InventoryItem | Omit<InventoryItem, 'docId'>>(item);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        setFormData(item);
    }, [item]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim() !== '') {
            e.preventDefault();
            if (!formData.attributes.includes(tagInput.trim())) {
                setFormData({ ...formData, attributes: [...formData.attributes, tagInput.trim()] });
            }
            setTagInput('');
        }
    };
    
    const removeTag = (tagToRemove: string) => {
        setFormData({ ...formData, attributes: formData.attributes.filter(tag => tag !== tagToRemove) });
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as InventoryItem);
    };
    
    const Input = ({ label, id, ...props }: { label: string, id: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <input id={id} {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
    );
    
    const TextArea = ({ label, id, ...props }: { label: string, id: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
         <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
            <textarea id={id} {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2}/>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-700">
                     <h2 className="text-xl font-bold">{mode === 'add' ? 'Dodaj Nowy Przedmiot' : 'Edytuj Przedmiot'}</h2>
                     <p className="text-sm text-gray-400">ID Taga: {item.id}</p>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
                    <Section title="Podstawowe Informacje">
                        <Input label="Nazwa" id="name" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        <TextArea label="Opis" id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Zdjęcie</label>
                            <div className="mt-1 flex items-center">
                                {formData.photo && <img src={formData.photo} alt="preview" className="h-16 w-16 object-cover rounded-md mr-4" />}
                                <label className="cursor-pointer bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    <span>{formData.photo ? 'Zmień' : 'Wgraj'} Zdjęcie</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>
                        </div>
                    </Section>

                    <Section title="Kategoryzacja i Status">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Kategoria" id="category" type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                            <Input label="Lokalizacja" id="location" type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                                <select id="status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as InventoryItem['status'] })} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option>Na stanie</option>
                                    <option>W użyciu</option>
                                    <option>Zarezerwowany</option>
                                    <option>Zutylizowany</option>
                                </select>
                            </div>
                            <Input label="Ilość" id="quantity" type="number" min="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) })} required/>
                        </div>
                    </Section>
                    
                     <Section title="Atrybuty (Tagi)">
                         <div>
                            <label htmlFor="attributes" className="block text-sm font-medium text-gray-300 mb-1">Dodaj Tagi</label>
                            <input type="text" id="attributes" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Wpisz tag i naciśnij Enter" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.attributes.map(tag => (
                                    <span key={tag} className="bg-indigo-600 text-white px-2 py-1 rounded-full text-sm flex items-center">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-indigo-200 hover:text-white"> &times; </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <Section title="Dodatkowe Szczegóły">
                        <Input label="Indeks Własny" id="customIndex" type="text" value={formData.customIndex} onChange={e => setFormData({ ...formData, customIndex: e.target.value })} />
                        <Input label="Numer Seryjny" id="serialNumber" type="text" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                        <TextArea label="Opis Dodatkowy" id="additionalDescription" value={formData.additionalDescription} onChange={e => setFormData({ ...formData, additionalDescription: e.target.value })} />
                    </Section>
                    
                    <Section title="Zakup i Gwarancja">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Input label="Dostawca" id="supplier" type="text" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
                             <Input label="Cena Zakupu" id="purchasePrice" type="number" min="0" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })} />
                             <Input label="Data Zakupu" id="purchaseDate" type="date" value={formData.purchaseDate} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
                             <Input label="Data Ważności" id="expiryDate" type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                        </div>
                    </Section>
                </form>
                <div className="p-6 border-t border-gray-700 mt-auto bg-gray-800 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors">Anuluj</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">Zapisz</button>
                </div>
            </div>
        </div>
    );
};

export default ItemModal;