import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    
    useEffect(() => {
        if (!isOpen) return;

        const html5QrCode = new Html5Qrcode("qr-reader");
        let isScannerRunning = true;

        const qrCodeSuccessCallback = (decodedText: string) => {
            if (isScannerRunning) {
                isScannerRunning = false;
                onScanSuccess(decodedText);
            }
        };

        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
        
        Html5Qrcode.getCameras().then(cameras => {
            if (cameras && cameras.length && isScannerRunning) {
                 html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    qrCodeSuccessCallback,
                    undefined
                ).catch(err => {
                    console.error("QR Scanner failed to start", err);
                });
            }
        }).catch(err => {
             console.error("Could not get cameras", err);
        });

        return () => {
             if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(err => {
                    console.error("QR Scanner failed to stop cleanly", err)
                });
            }
        };
    }, [isOpen, onClose, onScanSuccess]);

    if (!isOpen) return null;
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
             <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all animate-fade-in-up relative">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Skieruj aparat na kod</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                 <div className="p-4">
                    <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
                 </div>
                 <p className="text-xs text-center text-gray-500 pb-4">Skaner uruchomi się automatycznie.</p>
             </div>
        </div>
    );
};

export default QrScannerModal;
