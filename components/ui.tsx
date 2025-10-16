
import React from 'react';
import type { LogoProps, ModalProps } from '../types.ts';
import { XIcon } from './icons.tsx';

export const Logo = ({ className = '' }: LogoProps) => (
    <div className={`inline-flex items-center justify-center`}>
        <img
            src="https://lh3.googleusercontent.com/d/1cl35jQBc1ALQWlGYGrgMaP4_rmSJcK7X"
            alt="Sajilo Taxi Logo"
            className={`h-16 w-auto ${className}`}
        />
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
