
import React, { useState } from 'react';
import type { CustomerAuthPageProps, AppLoginPageProps } from '../types.ts';
import { BackArrowIcon } from './icons.tsx';
import { Logo } from './ui.tsx';

export const CustomerAuthPage = ({ onAuthSuccess, onBack, dataApi, onNavigateHome }: CustomerAuthPageProps) => {
    const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSimulated, setIsSimulated] = useState(false);

    const handleSendOtp = async () => {
        if (!/^\d{10}$/.test(phone)) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        setIsProcessing(true);
        setError('');
        try {
            const response = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send-otp', phone })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP.');
            }

            setVerificationId(data.verificationId);
            setIsSimulated(data.simulated);
            setStep('otp');
        } catch (e: any) {
            setError(e.message || 'An error occurred.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }
        setIsProcessing(true);
        setError('');
        try {
            const response = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify-otp', otp, verificationId })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'OTP verification failed.');
            }

            // OTP is correct, check if user exists
            const existingCustomer = dataApi.customer.findByPhone(phone);
            if (existingCustomer) {
                onAuthSuccess(existingCustomer);
            } else {
                setStep('name'); // New user, ask for name
            }
        } catch (e: any) {
            setError(e.message || 'An error occurred.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSignUp = () => {
        if (!name.trim()) {
            setError('Please enter your full name.');
            return;
        }
        setIsProcessing(true);
        setError('');
        setTimeout(() => {
            const newUserDetails = { name, phone };
            const newUser = dataApi.customer.signUp(newUserDetails);
            onAuthSuccess(newUser);
            setIsProcessing(false);
        }, 500);
    };
    
    const goBack = () => {
        setError('');
        setIsSimulated(false);
        if (step === 'otp') { setOtp(''); setStep('phone'); }
        else if (step === 'name') setStep('phone');
        else onBack();
    };

    const renderContent = () => {
        switch (step) {
            case 'otp':
                return (
                    <>
                        <h2 className="text-3xl font-bold text-black text-center">Enter OTP</h2>
                        <p className="text-center text-black/80 mt-2">An OTP was sent to <strong>{phone}</strong>.</p>
                        {error && <p className="text-center font-semibold text-red-700 bg-red-100 border border-red-700 rounded-lg p-2 my-4">{error}</p>}
                        {isSimulated && (
                            <div className="text-center font-semibold text-blue-700 bg-blue-100 border border-blue-700 rounded-lg p-3 my-4">
                                <p>SMS delivery is simulated.</p>
                                <p><strong>Please check the server console for the OTP.</strong></p>
                            </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-4 mt-6">
                             <div>
                                <label className="block text-sm font-bold text-black mb-1">OTP Code</label>
                                <input type="tel" value={otp} onChange={e => setOtp(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold text-center tracking-[0.5em]" placeholder="______" maxLength={6} />
                            </div>
                            <button type="submit" disabled={isProcessing} className="w-full !mt-6 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500 transition-transform transform hover:scale-105 disabled:opacity-50">
                                {isProcessing ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </form>
                    </>
                );
            case 'name':
                return (
                     <>
                        <h2 className="text-3xl font-bold text-black text-center">Welcome!</h2>
                        <p className="text-center text-black/80 mt-2">Let's get you set up. Please enter your name.</p>
                        {error && <p className="text-center font-semibold text-red-700 bg-red-100 border border-red-700 rounded-lg p-2 my-4">{error}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4 mt-6">
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Full Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Enter your full name" />
                            </div>
                            <button type="submit" disabled={isProcessing} className="w-full !mt-6 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500 transition-transform transform hover:scale-105 disabled:opacity-50">
                                {isProcessing ? 'Signing up...' : 'Complete Sign Up'}
                            </button>
                        </form>
                    </>
                );
            case 'phone':
            default:
                 return (
                    <>
                        <h2 className="text-3xl font-bold text-black text-center">Sign In or Sign Up</h2>
                         {error && <p className="text-center font-semibold text-red-700 bg-red-100 border border-red-700 rounded-lg p-2 my-4">{error}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4 mt-6">
                            <div>
                                <label className="block text-sm font-bold text-black mb-1">Phone Number</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Enter 10-digit number" />
                            </div>
                            <button type="submit" disabled={isProcessing} className="w-full !mt-6 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500 transition-transform transform hover:scale-105 disabled:opacity-50">
                                {isProcessing ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    </>
                );
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-yellow-400/80 backdrop-blur-md p-4 border-b-2 border-white/30 sticky top-0 z-10 flex items-center">
                <button onClick={goBack} className="p-2 rounded-full hover:bg-black/10 transition-colors" aria-label="Go back"><BackArrowIcon className="h-6 w-6 text-black"/></button>
                <div className="flex-grow text-center"><button onClick={onNavigateHome} aria-label="Go to homepage"><Logo /></button></div><div className="w-10"></div>
            </header>
            <main className="flex-grow p-4 flex flex-col items-center justify-center">
                <div className="w-full max-w-sm mx-auto bg-white/60 backdrop-blur-lg border border-white/40 p-8 rounded-2xl shadow-2xl">
                    {renderContent()}
                </div>
            </main>
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
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Username"/>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold" placeholder="Password"/>
            <button type="submit" className="w-full !mt-6 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500">Login</button>
        </form>
    );
    
    const renderOtpForm = () => (
         <form onSubmit={handleOtpSubmit} className="space-y-4 mt-6">
            <p className="text-center text-sm text-black/80">Enter the 6-digit code from your authenticator app.</p>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required inputMode="numeric" pattern="\d{6}" maxLength={6} className="block w-full px-3 py-3 bg-white text-black border-2 border-black/80 rounded-lg font-semibold text-center text-2xl tracking-[0.2em]" placeholder="_ _ _ _ _ _"/>
            <button type="submit" className="w-full !mt-6 bg-yellow-400 text-black font-bold py-3 px-4 rounded-xl border-2 border-black hover:bg-yellow-500">Verify</button>
         </form>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-yellow-400">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-6"><Logo /></div>
                <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-lg">
                    <h2 className="text-3xl font-bold text-black text-center">{otpRequired ? 'Enter Security Code' : titleMap[role] || 'Login'}</h2>
                    {error && <p className="text-center font-semibold text-red-700 bg-red-100 border border-red-700 rounded-lg p-2 my-4">{error}</p>}
                    {otpRequired ? renderOtpForm() : renderPasswordForm()}
                </div>
            </div>
        </div>
    );
};