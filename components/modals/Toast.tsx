
import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        const timer = setTimeout(() => {
            setVisible(false);
            // Allow time for fade-out animation before calling onDismiss
            setTimeout(onDismiss, 300);
        }, 2700);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    const iconClass = type === 'success' ? 'fas fa-check-circle' : type === 'error' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';

    return (
        <div 
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 p-4 rounded-lg text-white shadow-lg flex items-center z-50 transition-all duration-300 ease-in-out ${bgColor} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
            <i className={`${iconClass} mr-3`}></i>
            <span>{message}</span>
        </div>
    );
};

export default Toast;