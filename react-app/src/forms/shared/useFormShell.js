import { useCallback, useEffect, useRef, useState } from 'react';

export function createEmptyModalState() {
    return {
        isOpen: false,
        type: 'warning',
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onClose: null,
        onConfirm: () => {},
        hideCancelButton: false,
        extraAction: null,
    };
}

export default function useFormShell({ totalSteps, isMobileBreakpoint = 768 }) {
    const autoStartedRef = useRef(false);

    const [appMode, setAppModeRaw] = useState('splash');
    const [currentStep, setCurrentStep] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    const [modal, setModal] = useState(createEmptyModalState());
    const [splashSelectedProgram, setSplashSelectedProgram] = useState(null);

    const setAppMode = useCallback((nextMode) => {
        setAppModeRaw((currentMode) => {
            const resolvedMode = typeof nextMode === 'function' ? nextMode(currentMode) : nextMode;
            if (isMobile && resolvedMode === 'full') {
                return 'wizard';
            }
            return resolvedMode;
        });
    }, [isMobile]);

    const openModal = useCallback((nextModal) => {
        setModal((currentModal) => ({
            ...createEmptyModalState(),
            ...currentModal,
            ...nextModal,
            isOpen: true,
        }));
    }, []);

    const closeModal = useCallback(() => {
        setModal((currentModal) => ({
            ...currentModal,
            isOpen: false,
        }));
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep((step) => Math.min(step + 1, totalSteps));
    }, [totalSteps]);

    const prevStep = useCallback(() => {
        setCurrentStep((step) => Math.max(step - 1, 1));
    }, []);

    const editSection = useCallback((stepNumber) => {
        if (appMode === 'full') {
            return;
        }
        setCurrentStep(stepNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [appMode]);

    useEffect(() => {
        const checkMobile = () => {
            const nextIsMobile = window.innerWidth < isMobileBreakpoint;
            setIsMobile(nextIsMobile);
            if (nextIsMobile) {
                setAppModeRaw((currentMode) => (currentMode === 'full' ? 'wizard' : currentMode));
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, [isMobileBreakpoint]);

    return {
        appMode,
        setAppMode,
        currentStep,
        setCurrentStep,
        nextStep,
        prevStep,
        editSection,
        isMobile,
        modal,
        setModal,
        openModal,
        closeModal,
        splashSelectedProgram,
        setSplashSelectedProgram,
        autoStartedRef,
    };
}

