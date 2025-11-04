
import React from 'react';

interface AiModalProps {
    isOpen: boolean;
    onClose: () => void;
    tips: string;
    isLoading: boolean;
}

const AiModal: React.FC<AiModalProps> = ({ isOpen, onClose, tips, isLoading }) => {
    if (!isOpen) return null;

    const formattedTips = tips.split('\n').map((line, index) => {
        line = line.replace(/^\*+\s*/, ''); // Remove leading asterisks
        if (line.trim() === '') return null;
        return (
            <li key={index} className="flex items-start mb-2">
                <span className="text-indigo-400 mr-3 mt-1"><i className="fas fa-check-circle"></i></span>
                <span>{line}</span>
            </li>
        );
    });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col transform transition-all animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-bold text-white flex items-center"><i className="fas fa-lightbulb text-yellow-400 mr-3"></i>Porady AI dot. Organizacji</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="overflow-y-auto pr-2 text-gray-300">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
                            <p className="mt-4 text-gray-400">Generuję genialne pomysły...</p>
                        </div>
                    ) : (
                        <ul className="list-none p-0">{formattedTips}</ul>
                    )}
                </div>
                 <div className="mt-6 text-right">
                     <button onClick={onClose} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">Zamknij</button>
                 </div>
            </div>
        </div>
    );
};

export default AiModal;