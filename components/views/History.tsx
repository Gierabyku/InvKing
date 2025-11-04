import React from 'react';

interface HistoryProps {
    onBack: () => void;
}

const History: React.FC<HistoryProps> = ({ onBack }) => {
    return (
        <div className="text-center text-gray-400 mt-20">
            <i className="fas fa-history fa-3x mb-4"></i>
            <h2 className="text-xl font-semibold">Historia</h2>
            <p className="mb-6">Ta funkcja będzie dostępna wkrótce!</p>
            <button onClick={onBack} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold">
                Wróć
            </button>
        </div>
    );
};

export default History;