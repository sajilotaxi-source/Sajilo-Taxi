

import React, { useState, useEffect } from 'react';
import type { LogoProps, ModalProps } from '../types.ts';
import { XIcon } from './icons.tsx';

export const Logo = ({ className = '' }: LogoProps) => (
    <div className={`inline-flex items-center justify-center`}>
        <img
            src="https://lh3.googleusercontent.com/d/1CEtU5W3SjsXFf0GwXw0ERcflTcZY5LUf"
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

export const UpdateToast = ({ onRefresh }: { onRefresh: () => void }) => (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 animate-fade-in">
        <div className="bg-dark text-white rounded-lg shadow-2xl p-4 flex items-center justify-between gap-4">
            <span>🚀 A new Sajilo Taxi app update is available. Please refresh.</span>
            <button onClick={onRefresh} className="bg-primary text-dark font-bold py-1 px-3 rounded-md hover:bg-yellow-500 whitespace-nowrap">
                Refresh Now
            </button>
        </div>
    </div>
);

export const WhatsAppWidget = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 1000); // Fade in after 1 second

        return () => clearTimeout(timer);
    }, []);

    const chatUrl = "https://wa.link/ae54ev";
    const greetingTitle = "Sajilo Taxi";
    const greetingMessage = "Hello! 👋 Welcome to Sajilo Taxi. How can we help you today?";
    const hoverMessage = "Available 24/7 – Tap to Chat";
    const buttonText = "Talk to Sajilo Team";

    return (
        <div className={`fixed bottom-5 right-5 z-50 group transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Tooltip on Hover */}
            <div 
                className={`
                    absolute bottom-full right-0 mb-3 w-72
                    bg-white rounded-lg shadow-xl border border-gray-200
                    p-4
                    transition-all duration-300 ease-in-out origin-bottom-right
                    transform-gpu group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0
                    scale-95 opacity-0 -translate-y-2 pointer-events-none
                `}
            >
                 <p className="font-bold text-dark">{greetingTitle}</p>
                 <p className="text-sm text-gray-700 mt-1">{greetingMessage}</p>
                 <p className="text-xs text-gray-500 mt-2 font-semibold">{hoverMessage}</p>
            </div>

            {/* Main Button */}
            <a
                href={chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                    flex items-center gap-3
                    bg-[#25D366] text-white font-bold
                    py-3 px-5 rounded-full shadow-2xl
                    transition-all duration-300 ease-in-out
                    hover:bg-[#128C7E] hover:scale-110
                "
                aria-label={buttonText}
            >
                <img 
                    src="https://lh3.googleusercontent.com/d/1_-TGAhl_lGsR2DBqGIuT37a78fonkhGv" 
                    alt="Sajilo Team" 
                    className="h-8 w-8 rounded-full object-cover border-2 border-white" 
                />
                <span className="hidden sm:inline">{buttonText}</span>
            </a>
        </div>
    );
};