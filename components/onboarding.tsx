


import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './ui.tsx';
import { 
    UserIcon, PhoneIcon, EmailIcon, SteeringWheelIcon, TaxiIcon, ClockIcon,
    IdCardIcon, FileTextIcon, UploadCloudIcon, BackArrowIcon, CheckIcon, CheckCircleIcon 
} from './icons.tsx';
import { createPortal } from 'react-dom';

// FIX: Define explicit props interface for DocumentUpload to improve type safety.
interface DocumentUploadProps {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onFileSelect: (id: string, file: File | null) => void;
    selectedFile: File | null;
}

type FormStep = 1 | 2 | 3 | 'submitted';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const Stepper = ({ currentStep }: { currentStep: FormStep }) => {
    const steps = [
        { id: 1, name: 'Personal' },
        { id: 2, name: 'Vehicle' },
        { id: 3, name: 'Documents' },
    ];

    const getStatus = (stepId: number) => {
        if (currentStep === 'submitted' || (typeof currentStep === 'number' && stepId < currentStep)) return 'complete';
        if (stepId === currentStep) return 'active';
        return 'inactive';
    };

    return (
        <nav className="flex items-center justify-center" aria-label="Progress">
            {steps.map((step, stepIdx) => (
                <React.Fragment key={step.name}>
                    <div className="flex flex-col items-center">
                        <div className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                            { complete: 'text-success border-success', active: 'text-primary border-primary', inactive: 'text-gray-400 border-gray-400' }[getStatus(step.id)]
                        }`}>
                            {getStatus(step.id) === 'complete' ? <CheckIcon className="h-6 w-6" /> : <span className="font-bold">{step.id}</span>}
                        </div>
                        <p className={`mt-2 text-sm font-medium ${getStatus(step.id) !== 'inactive' ? 'text-white' : 'text-gray-400'}`}>{step.name}</p>
                    </div>

                    {stepIdx < steps.length - 1 && (
                        <div className={`flex-auto h-1 mx-4 ${
                             { complete: 'bg-success', active: 'bg-gradient-to-r from-success to-primary', inactive: 'bg-gray-400' }[getStatus(step.id)]
                        }`} />
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

// FIX: Explicitly typed DocumentUpload as a React.FC to correctly handle the 'key' prop and resolve the TypeScript error.
const DocumentUpload: React.FC<DocumentUploadProps> = ({ id, label, icon: Icon, onFileSelect, selectedFile }) => (
    <div>
        <label htmlFor={id} className="document-upload-button">
            {selectedFile ? (
                <div className="text-success">
                    <CheckCircleIcon className="h-10 w-10 mx-auto" />
                    <p className="font-bold mt-2 text-sm text-dark truncate">{selectedFile.name}</p>
                </div>
            ) : (
                <>
                    <div className="text-gray-500"><Icon className="h-10 w-10" /></div>
                    <p className="font-bold mt-2 text-dark text-sm">{label}</p>
                </>
            )}
        </label>
        <input id={id} name={id} type="file" className="sr-only" onChange={(e) => onFileSelect(id, (e.target.files && e.target.files[0]) || null)} />
    </div>
);

const OnboardingVideoBackground = () => {
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const videoContainer = document.getElementById('bg-video-container');
        setContainer(videoContainer);

        // When this component unmounts (i.e., when user navigates away from onboarding),
        // clear the video container to remove the background.
        return () => {
            if (videoContainer) {
                videoContainer.innerHTML = '';
            }
        };
    }, []);

    if (!container) {
        return null;
    }

    return createPortal(
        <>
            <video autoPlay loop muted playsInline className="onboarding-video-bg">
                <source src="https://storage.googleapis.com/project-screenshots/sajilo-onboarding-bg.mp4" type="video/mp4" />
            </video>
            <div className="onboarding-video-overlay"></div>
        </>,
        container
    );
};

export const DriverOnboardingPage = () => {
    const [step, setStep] = useState<FormStep>(1);
    const [formData, setFormData] = useState({
        fullName: '', phone: '', email: '',
        vehicleNumber: '', vehicleType: 'SUV', experience: ''
    });
    const [files, setFiles] = useState<Record<string, File | null>>({
        license: null, rc: null, insurance: null, pollution: null,
        permit: null, ownerKyc: null, driverKyc: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const formRef = useRef<HTMLDivElement>(null);

    const MAX_FILE_SIZE_MB = 5;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const TOTAL_MAX_SIZE_MB = 20;
    const TOTAL_MAX_SIZE_BYTES = TOTAL_MAX_SIZE_MB * 1024 * 1024;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileSelect = (id: string, file: File | null) => {
        const input = document.getElementById(id) as HTMLInputElement;

        if (file && file.size > MAX_FILE_SIZE_BYTES) {
            setError(`File "${file.name}" is too large. Please upload files smaller than ${MAX_FILE_SIZE_MB}MB.`);
            if(input) input.value = ''; 
            return;
        }

        const newFiles = { ...files, [id]: file };
        // FIX: Explicitly typing reduce parameters to resolve an issue where TypeScript incorrectly infers the accumulator type as 'unknown', leading to a comparison error. This was the root cause of the bug on line 155.
        const totalSize = Object.values(newFiles).reduce((sum, f) => {
            if (f) {
                return sum + f.size;
            }
            return sum;
        }, 0);
        
        if (totalSize > TOTAL_MAX_SIZE_BYTES) {
             setError(`Total size of all documents exceeds the limit of ${TOTAL_MAX_SIZE_MB}MB. Please use smaller files.`);
             if(input) input.value = ''; 
             return;
        }

        setError(''); 
        setFiles(prev => ({ ...prev, [id]: file }));
    };

    const nextStep = () => setStep(prev => (typeof prev === 'number' && prev < 3 ? (prev + 1) as FormStep : prev));
    // FIX: Added a `typeof` check to ensure `prev` is a number before performing arithmetic. This resolves an error where `prev` could be the string 'submitted', which cannot be compared to a number.
    const prevStep = () => setStep(prev => (typeof prev === 'number' && prev > 1 ? (prev - 1) as FormStep : prev));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const missingDocuments = Object.entries(files)
            .filter(([, file]) => file === null)
            .map(([key]) => key);

        if (missingDocuments.length > 0) {
            setError(`Please upload all required documents. Missing: ${missingDocuments.join(', ')}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const filesPayload: Record<string, { name: string; data: string; type: string; }> = {};
            for (const key in files) {
                const file = files[key];
                if (file) {
                    filesPayload[key] = {
                        name: file.name,
                        data: await fileToBase64(file),
                        type: file.type
                    };
                }
            }

            const response = await fetch('/api/onboard-driver', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData, files: filesPayload })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Submission failed.');
            }

            setStep('submitted');
            window.scrollTo(0, 0);

        } catch (err: any) {
            setError(err.message || 'An error occurred during submission.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // FIX: Define explicit type for document types array to ensure type consistency.
    interface DocumentTypeInfo {
        id: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
    }
    const documentTypes: DocumentTypeInfo[] = [
        { id: 'license', label: "Driver's License", icon: IdCardIcon },
        { id: 'rc', label: "Vehicle RC", icon: FileTextIcon },
        { id: 'insurance', label: "Vehicle Insurance", icon: FileTextIcon },
        { id: 'pollution', label: "Pollution Certificate", icon: FileTextIcon },
        { id: 'permit', label: "Route Permit", icon: FileTextIcon },
        { id: 'ownerKyc', label: "Owner's KYC", icon: IdCardIcon },
        { id: 'driverKyc', label: "Driver's KYC", icon: IdCardIcon },
    ];


    return (
        <div className="min-h-screen text-white relative">
            <OnboardingVideoBackground />
            <header className="absolute top-0 left-0 right-0 p-4 z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <a href="/"><Logo /></a>
                    <a href="/" className="font-bold text-dark bg-primary hover:bg-yellow-500 transition-colors px-4 py-2 rounded-lg">
                        Book a Ride
                    </a>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-32 pb-16 flex flex-col items-center">
                {step !== 'submitted' && (
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-shadow">Become a Sajilo Hero</h1>
                        <p className="mt-4 text-lg md:text-xl text-primary max-w-2xl">
                            Join our community of professional drivers and start earning with flexible hours and great support.
                        </p>
                    </div>
                )}

                <div ref={formRef} className="w-full max-w-3xl mt-12">
                    {step === 'submitted' ? (
                        <div className="bg-black/70 backdrop-blur-md border border-success rounded-2xl p-8 text-center animate-fade-in">
                            <CheckCircleIcon className="h-20 w-20 mx-auto text-success" />
                            <h2 className="text-3xl font-bold mt-4">Application Submitted!</h2>
                            <p className="text-gray-300 mt-2">Thank you for your interest in joining Sajilo Taxi. We have received your documents and will review your application. We will contact you on your registered mobile number within 2-3 business days.</p>
                             <a href="/" className="mt-8 inline-block font-bold text-dark bg-primary hover:bg-yellow-500 transition-colors px-6 py-3 rounded-lg">
                                Back to Homepage
                            </a>
                        </div>
                    ) : (
                        <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8">
                            <Stepper currentStep={step} />
                            <form onSubmit={handleSubmit} className="mt-8">
                                {step === 1 && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="relative"><UserIcon className="absolute top-3 left-3 h-6 w-6 text-gray-400" /><input type="text" name="fullName" placeholder="Full Name" required value={formData.fullName} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 pl-12 focus:ring-primary focus:border-primary" /></div>
                                            <div className="relative"><PhoneIcon className="absolute top-3 left-3 h-6 w-6 text-gray-400" /><input type="tel" name="phone" placeholder="Phone Number" required value={formData.phone} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 pl-12 focus:ring-primary focus:border-primary" /></div>
                                        </div>
                                        <div className="relative"><EmailIcon className="absolute top-3 left-3 h-6 w-6 text-gray-400" /><input type="email" name="email" placeholder="Email Address" required value={formData.email} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 pl-12 focus:ring-primary focus:border-primary" /></div>
                                    </div>
                                )}
                                {step === 2 && (
                                     <div className="space-y-6 animate-fade-in">
                                        <div className="grid md:grid-cols-2 gap-6">
                                             <div className="relative"><SteeringWheelIcon className="absolute top-3 left-3 h-6 w-6 text-gray-400" /><input type="text" name="vehicleNumber" placeholder="Vehicle Number (e.g., SK01J1234)" required value={formData.vehicleNumber} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 pl-12 focus:ring-primary focus:border-primary" /></div>
                                             <div className="relative"><TaxiIcon className="absolute top-3 left-3 h-6 w-6 text-gray-400" /><select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 pl-12 focus:ring-primary focus:border-primary"><option>SUV</option><option>Sedan</option><option>Sumo</option><option>Hatchback</option></select></div>
                                        </div>
                                         <div className="relative"><ClockIcon className="absolute top-3 left-3 h-6 w-6 text-gray-400" /><input type="number" name="experience" placeholder="Years of Driving Experience" required value={formData.experience} onChange={handleChange} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 pl-12 focus:ring-primary focus:border-primary" /></div>
                                    </div>
                                )}
                                {step === 3 && (
                                    <div className="animate-fade-in">
                                        <p className="text-center text-gray-300 mb-6">Please upload clear copies of all required documents.</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {/* FIX: Used destructuring in the map callback to pass props more explicitly. */}
                                            {documentTypes.map(({ id, label, icon }) => (
                                                <DocumentUpload
                                                    key={id}
                                                    id={id}
                                                    label={label}
                                                    icon={icon}
                                                    onFileSelect={handleFileSelect}
                                                    selectedFile={files[id]}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {error && <p className="text-center font-semibold text-danger bg-danger/20 border border-danger rounded-lg p-3 my-6">{error}</p>}

                                <div className="mt-8 flex justify-between items-center">
                                    {step > 1 ? (
                                        <button type="button" onClick={prevStep} className="font-bold text-secondary hover:text-white transition-colors px-6 py-3 rounded-lg flex items-center gap-2">
                                            <BackArrowIcon className="h-5 w-5" /> Back
                                        </button>
                                    ) : <div></div>}

                                    {step < 3 ? (
                                        <button type="button" onClick={nextStep} className="font-bold text-dark bg-primary hover:bg-yellow-500 transition-colors px-6 py-3 rounded-lg">
                                            Next Step
                                        </button>
                                    ) : (
                                        <button type="submit" disabled={isSubmitting} className="font-bold text-dark bg-primary hover:bg-yellow-500 transition-colors px-6 py-3 rounded-lg disabled:opacity-50">
                                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};