import React from 'react';
import type { LogoProps, ModalProps } from '../types.ts';
import { XIcon } from './icons.tsx';

export const Logo = ({ className = '' }: LogoProps) => (
    <div className={`inline-flex items-center justify-center logo-pulse rounded-md ${className}`}>
        <svg 
            width="130" 
            height="48" 
            viewBox="0 0 130 48" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect width="130" height="48" rx="6" fill="#000000"/>
            <rect x="1" y="1" width="128" height="46" rx="5" stroke="#333333" strokeWidth="2"/>
            <text x="12" y="35" fontFamily="Poppins, sans-serif" fontSize="28" fontWeight="bold" fill="#FFC107" letterSpacing="-0.05em">sajilo</text>
            <rect x="84" y="10" width="38" height="28" rx="4" fill="#333333"/>
            <text x="90" y="29" fontFamily="Poppins, sans-serif" fontSize="12" fontWeight="bold" fill="#FFC107" letterSpacing="0.05em">TAXI</text>
        </svg>
    </div>
);

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white w-full max-w-lg rounded-lg border-2 border-dark/20 shadow-lg flex flex-col max-h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b-2 border-dark/10 flex-shrink-0">
                    <h3 className="text-xl font-bold text-dark">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-dark hover:bg-gray-200" aria-label="Close modal"><XIcon className="h-6 w-6"/></button>
                </header>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};