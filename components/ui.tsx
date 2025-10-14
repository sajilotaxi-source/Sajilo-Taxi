
import React from 'react';
import type { LogoProps, ModalProps } from '../types.ts';
import { TaxiIcon, XIcon } from './icons.tsx';

export const Logo = ({ className = '' }: LogoProps) => (
    <div className={`inline-flex items-center bg-yellow-400 p-1 border-2 border-black rounded-md logo-pulse ${className}`}>
      <span className="text-3xl font-bold tracking-tighter text-black pr-2">sajilo</span>
      <div className="flex flex-col items-center justify-center bg-gray-200/80 px-1 py-0.5 rounded-sm">
        <TaxiIcon className="h-6 w-6 text-black"/>
        <span className="text-[0.6rem] font-bold text-black tracking-widest -mt-1">TAXI</span>
      </div>
    </div>
);

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white w-full max-w-lg rounded-lg border-2 border-black shadow-lg flex flex-col max-h-[90vh]">
                <header className="flex items-center justify-between p-4 border-b-2 border-black/20 flex-shrink-0">
                    <h3 className="text-xl font-bold text-black">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-black hover:bg-gray-200" aria-label="Close modal"><XIcon className="h-6 w-6"/></button>
                </header>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};
