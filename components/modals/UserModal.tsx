import React, { useState, useEffect } from 'react';
import type { OrgUser, UserPermissions } from '../../types';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: OrgUser | Omit<OrgUser, 'docId'>, password?: string) => void;
    user: OrgUser | Omit<OrgUser, 'docId'>;
    mode: 'add' | 'edit';
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, mode }) => {
    const [formData, setFormData] = useState(user);
    const [password, setPassword] = useState('');

    useEffect(() => {
        setFormData(user);
        setPassword('');
    }, [user]);

    if (!isOpen) return null;

    const handlePermissionChange = (permission: keyof UserPermissions) => {
        let newPermissions = {
            ...formData.permissions,
            [permission]: !formData.permissions[permission],
        };
        
        const isNowAdmin = newPermissions.canManageUsers;
        
        // If user is now an admin, grant all permissions
        if (isNowAdmin) {
            newPermissions = Object.keys(newPermissions).reduce((acc, key) => {
                acc[key as keyof UserPermissions] = true;
                return acc;
            }, {} as UserPermissions);
        }

        setFormData(prev => ({
            ...prev,
            permissions: newPermissions
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, password);
    };

    const permissionLabels: Record<keyof UserPermissions, string> = {
        canScan: 'Skanowanie Urządzeń',
        canViewServiceList: 'Podgląd Urządzeń w Serwisie',
        canViewClients: 'Podgląd Klientów',
        canViewScheduledServices: 'Podgląd Zaplanowanych Serwisów',
        canViewHistory: 'Podgląd Historii',
        canViewSettings: 'Podgląd Ustawień',
        canManageUsers: 'Zarządzanie Użytkownikami (Admin)',
    };
    
    const isSuperAdmin = formData.permissions.canManageUsers;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold">{mode === 'add' ? 'Dodaj Nowego Użytkownika' : 'Edytuj Użytkownika'}</h2>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
                    <Input id="email" name="email" label="Email" type="email" value={formData.email} onChange={handleChange} required disabled={mode === 'edit'} />
                    {mode === 'add' && (
                        <Input id="password" name="password" label="Hasło" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    )}

                    <div className="pt-4">
                         <h3 className="text-lg font-semibold text-gray-300 mb-2">Uprawnienia</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded-md">
                            {Object.keys(permissionLabels).map(key => {
                                const permissionKey = key as keyof UserPermissions;
                                return (
                                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions[permissionKey]}
                                            onChange={() => handlePermissionChange(permissionKey)}
                                            disabled={isSuperAdmin && permissionKey !== 'canManageUsers'}
                                            className="h-5 w-5 rounded border-gray-500 bg-gray-600 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <span className={`text-gray-300 ${isSuperAdmin && permissionKey !== 'canManageUsers' ? 'text-gray-500' : ''}`}>
                                            {permissionLabels[permissionKey]}
                                        </span>
                                    </label>
                                );
                            })}
                         </div>
                    </div>

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
        <input {...props} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-900 disabled:text-gray-400" />
    </div>
);


export default UserModal;