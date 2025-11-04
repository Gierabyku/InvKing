import React from 'react';

interface HybridChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNfcSelect: () => void;
    onBarcodeSelect: () => void;
}

const HybridChoiceModal: React.FC<HybridChoiceModalProps> = ({ isOpen, onClose, onNfcSelect, onBarcodeSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm transform transition-all animate-fade-in-up p-6">
                <h2 className="text-xl font-bold text-center mb-6">Wybierz Metodę Skanowania</h2>
                <div className="space-y-4">
                    <button 
                        onClick={onNfcSelect}
                        className="w-full flex items-center justify-center p-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                        <i className="fas fa-wifi text-2xl mr-4"></i>
                        <span className="font-semibold">Skanuj NFC</span>
                    </button>
                     <button 
                        onClick={onBarcodeSelect}
                        className="w-full flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                        <i className="fas fa-camera text-2xl mr-4"></i>
                        <span className="font-semibold">Skanuj Kod Kreskowy / QR</span>
                    </button>
                </div>
                 <div className="mt-8 text-center">
                    <button onClick={onClose} className="text-gray-400 hover:text-white">Anuluj</button>
                 </div>
            </div>
        </div>
    );
};

export default HybridChoiceModal;
