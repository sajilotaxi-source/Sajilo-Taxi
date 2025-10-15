import React, { useState, useEffect } from 'react';
import type { CustomerAuthPageProps, AppLoginPageProps } from '../types.ts';
import { BackArrowIcon } from './icons.tsx';
import { Logo } from './ui.tsx';
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

// --- FIREBASE CONFIGURATION ---
// IMPORTANT: Replace with your actual Firebase project configuration.
// You can find this in your Firebase project settings.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your value
    authDomain: "your-project-id.firebaseapp.com", // Replace with your value
    projectId: "your-project-id", // Replace with your value
    storageBucket: "your-project-id.appspot.com", // Replace with your value
    messagingSenderId: "your-sender-id", // Replace with your value
    appId: "1:your-sender-id:web:your-app-id" // Replace with your value
};

// Initialize Firebase and Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Extend window interface for reCAPTCHA verifier
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
    }
}

export const CustomerAuthPage = ({ onAuthSuccess, onBack, dataApi, onNavigateHome }: CustomerAuthPageProps) => {
    const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Setup reCAPTCHA verifier on component mount
    useEffect(() => {
        try {
            if (!window.recaptchaVerifier) {
                 window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible',
                    'callback': (response: any) => {
                        // reCAPTCHA solved, allow signInWithPhoneNumber.
                    }
                });
                window.recaptchaVerifier.render(); // Render the invisible reCAPTCHA
            }
        } catch (e) {
            console.error("Error setting up reCAPTCHA", e);
            setError("Could not initialize authentication service. Please refresh the page.");
        }
    }, []);

    const handleSendOtp = async () => {
        if (!/^\d{10}$/.test(phone)) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        setIsProcessing(true);
        setError('');
        try {
            const formattedPhoneNumber = `+91${phone}`;
            const appVerifier = window.recaptchaVerifier;
            if (!appVerifier) throw new Error("reCAPTCHA verifier not initialized.");
            
            const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
            setConfirmationResult(result);
            setStep('otp');
        } catch (e: any) {
            console.error("Firebase Auth Error:", e);
            setError(e.message || 'Failed to send OTP. Please check your phone number and try again.');
             // Reset reCAPTCHA in case of error
            try {
                window.recaptchaVerifier?.clear();
            } catch (rcError) {
                console.error("Error resetting reCAPTCHA", rcError);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6 || !confirmationResult) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }
        setIsProcessing(true);
        setError('');
        try {
            const userCredential = await confirmationResult.confirm(otp);
            const userPhoneNumber = userCredential.user.phoneNumber?.replace('+91', '') || phone;

            const existingCustomer = dataApi.customer.findByPhone(userPhoneNumber);
            if (existingCustomer) {
                onAuthSuccess(existingCustomer);
            } else {
                setPhone(userPhoneNumber);
                setStep('name');
            }
        } catch (e: any) {
            console.error("Firebase Verification Error:", e);
            setError(e.message || 'Invalid OTP or an error occurred.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSignUp = () => {
        if (!name.trim()) { setError('Please enter your full name.'); return; }
        if (email && !/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address.'); return; }
        setIsProcessing(true);
        setError('');
        setTimeout(() => {
            const newUserDetails = { name, phone, email };
            const newUser = dataApi.customer.signUp(newUserDetails);
            onAuthSuccess(newUser);
            setIsProcessing(false);
        }, 500);
    };
    
    const goBack = () => {
        setError('');
        if (step === 'otp') { setOtp(''); setStep('phone'); }
        else if (step === 'name') setStep('phone');
        else onBack();
    };

    const renderContent = () => {
        switch (step) {
            case 'otp':
                return (
                    <>
                        <h2 className="text-3xl font-bold text-dark text-center">Enter OTP</h2>
                        <p className="text-center text-dark/80 mt-2">An OTP was sent to <strong>{phone}</strong>.</p>
                        {error && <p className="text-center font-semibold text-danger bg-danger/10 border border-danger rounded-lg p-2 my-4">{error}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-4 mt-6">
                             <div>
                                <label className="block text-sm font-bold text-dark mb-1">OTP Code</label>
                                <input type="tel" value={otp} onChange={e => setOtp(e.target.value)} required className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold text-center tracking-[0.5em]" placeholder="______" maxLength={6} />
                            </div>
                            <button type="submit" disabled={isProcessing} className="w-full !mt-6 bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500 transition-transform transform hover:scale-105 disabled:opacity-50">
                                {isProcessing ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </form>
                    </>
                );
            case 'name':
                return (
                     <>
                        <h2 className="text-3xl font-bold text-dark text-center">Welcome!</h2>
                        <p className="text-center text-dark/80 mt-2">Let's get you set up. Please enter your details.</p>
                        {error && <p className="text-center font-semibold text-danger bg-danger/10 border border-danger rounded-lg p-2 my-4">{error}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4 mt-6">
                            <div>
                                <label className="block text-sm font-bold text-dark mb-1">Full Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold" placeholder="Enter your full name" />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-dark mb-1">Email Address (Optional)</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold" placeholder="For booking confirmation" />
                            </div>
                            <button type="submit" disabled={isProcessing} className="w-full !mt-6 bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500 transition-transform transform hover:scale-105 disabled:opacity-50">
                                {isProcessing ? 'Signing up...' : 'Complete Sign Up'}
                            </button>
                        </form>
                    </>
                );
            case 'phone':
            default:
                 return (
                    <>
                        <h2 className="text-3xl font-bold text-dark text-center">Sign In or Sign Up</h2>
                         {error && <p className="text-center font-semibold text-danger bg-danger/10 border border-danger rounded-lg p-2 my-4">{error}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4 mt-6">
                            <div>
                                <label className="block text-sm font-bold text-dark mb-1">Phone Number</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold" placeholder="Enter 10-digit number" />
                            </div>
                            <button type="submit" disabled={isProcessing} className="w-full !mt-6 bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500 transition-transform transform hover:scale-105 disabled:opacity-50">
                                {isProcessing ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    </>
                );
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col bg-light-gray">
            <header className="bg-black/90 backdrop-blur-md p-4 border-b-2 border-primary/30 sticky top-0 z-10 flex items-center">
                <button onClick={goBack} className="p-2 rounded-full text-white hover:bg-white/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6"/></button>
                <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm mx-auto bg-white/80 backdrop-blur-lg border border-gray-200 p-8 rounded-2xl shadow-2xl">
                    {renderContent()}
                </div>
            </main>
            <div id="recaptcha-container"></div>
        </div>
    );
};

export const AppLoginPage = ({ role, onLogin, error }: AppLoginPageProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpRequired, setOtpRequired] = useState(false);
    
    const titleMap: Record<string, string> = { superadmin: 'Admin Panel', driver: 'Driver Login' };
    
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await onLogin({ username, password });
        if (result.otpRequired) {
            setOtpRequired(true);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onLogin({ username, otp });
    };

    const renderPasswordForm = () => (
        <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-6">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold" placeholder="Username"/>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold" placeholder="Password"/>
            <button type="submit" className="w-full !mt-6 bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500">Login</button>
        </form>
    );
    
    const renderOtpForm = () => (
         <form onSubmit={handleOtpSubmit} className="space-y-4 mt-6">
            <p className="text-center text-sm text-dark/80">Enter the 6-digit code from your authenticator app.</p>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required inputMode="numeric" pattern="\d{6}" maxLength={6} className="block w-full px-3 py-3 bg-white text-dark border-2 border-gray-400 rounded-lg font-semibold text-center text-2xl tracking-[0.2em]" placeholder="_ _ _ _ _ _"/>
            <button type="submit" className="w-full !mt-6 bg-primary text-dark font-bold py-3 px-4 rounded-xl hover:bg-yellow-500">Verify</button>
         </form>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-light-gray">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-6"><Logo /></div>
                <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg">
                    <h2 className="text-3xl font-bold text-dark text-center">{otpRequired ? 'Enter Security Code' : titleMap[role] || 'Login'}</h2>
                    {error && <p className="text-center font-semibold text-danger bg-danger/10 border border-danger rounded-lg p-2 my-4">{error}</p>}
                    {otpRequired ? renderOtpForm() : renderPasswordForm()}
                </div>
            </div>
        </div>
    );
};