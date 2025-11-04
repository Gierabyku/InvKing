import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmButtonText = 'Potwierdź', 
    cancelButtonText = 'Anuluj' 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all animate-fade-in-up p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <i className="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>
                    {title}
                </h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors font-semibold"
                    >
                        {cancelButtonText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors font-semibold"
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
