import { useCallback, useEffect, useRef } from 'react';

export default function useFormLifecycle({
    shell,
    searchParams,
    setSearchParams,
    navigate,
    isLoading,
    currentProgram,
    isEditing,
    hasInputtedData,
    draft,
    resetFormState,
    resetSubmissionState,
    exitEditMode,
    clearProgramField,
    loadReadonlyRecord,
    hydrateDraft,
    getLocalDraftKey,
    getLocalDraftModal,
    loadInitialDraft,
    loadDiscardedLocalDraftFallback,
    onBeforeStart,
    onReadonlyError,
}) {
    const {
        appMode,
        setAppMode,
        openModal,
        closeModal,
        setSplashSelectedProgram,
        autoStartedRef,
    } = shell;
    const appModeRef = useRef(appMode);

    useEffect(() => {
        appModeRef.current = appMode;
    }, [appMode]);

    const moveToMode = useCallback((mode, selectedProgram) => {
        setAppMode(mode);
        setSearchParams({ program: selectedProgram, mode }, { replace: true });
    }, [setAppMode, setSearchParams]);

    const handleStart = useCallback(async (mode, selectedProgram) => {
        if (!selectedProgram) {
            return false;
        }

        resetFormState(selectedProgram);
        resetSubmissionState?.();
        await onBeforeStart?.({ mode, selectedProgram });

        if (mode === 'readonly') {
            try {
                await loadReadonlyRecord(selectedProgram);
            } catch (error) {
                onReadonlyError?.(error);
                return false;
            }

            moveToMode('readonly', selectedProgram);
            return true;
        }

        const localStorageKey = getLocalDraftKey?.(selectedProgram);
        const localDraft = localStorageKey ? draft?.readDraft?.(localStorageKey) : null;

        if (localDraft) {
            const modal = getLocalDraftModal?.({ localDraft, selectedProgram }) ?? {
                type: 'warning',
                title: 'Continue your saved draft?',
                message: `We found an auto-saved draft from ${new Date(localDraft.savedAt).toLocaleString()}. Continue from that draft?`,
                confirmText: 'Continue draft',
                cancelText: 'Start fresh',
            };

            openModal({
                ...modal,
                onConfirm: () => {
                    hydrateDraft(localDraft);
                    closeModal();
                    moveToMode(mode, selectedProgram);
                },
                onClose: async () => {
                    closeModal();
                    draft?.clearDraft?.(localStorageKey);

                    try {
                        await (loadDiscardedLocalDraftFallback ?? loadInitialDraft)?.(selectedProgram);
                    } catch {
                        // Continue with a blank form when fallback loading fails.
                    }

                    moveToMode(mode, selectedProgram);
                },
            });

            return true;
        }

        try {
            await loadInitialDraft?.(selectedProgram);
        } catch {
            // Continue with a blank form when no server draft is available.
        }

        moveToMode(mode, selectedProgram);
        return true;
    }, [
        draft,
        getLocalDraftKey,
        getLocalDraftModal,
        hydrateDraft,
        loadDiscardedLocalDraftFallback,
        loadInitialDraft,
        loadReadonlyRecord,
        moveToMode,
        onBeforeStart,
        onReadonlyError,
        resetFormState,
        resetSubmissionState,
        shell,
    ]);

    const handleBack = useCallback(() => {
        if (isEditing) {
            exitEditMode?.();
            setAppMode('readonly');
            setSearchParams({ program: currentProgram, mode: 'readonly' }, { replace: true });
            return;
        }

        if (appMode === 'splash') {
            navigate('/');
            return;
        }

        if (hasInputtedData()) {
            draft?.saveNow?.();
        }

        setAppMode('splash');
        setSearchParams({}, { replace: true });
    }, [
        appMode,
        closeModal,
        currentProgram,
        draft,
        exitEditMode,
        hasInputtedData,
        isEditing,
        navigate,
        openModal,
        setAppMode,
        setSearchParams,
    ]);

    const handleHome = useCallback(() => {
        if (hasInputtedData()) {
            draft?.saveNow?.();
        }

        navigate('/');
    }, [draft, hasInputtedData, navigate]);

    const handleToggleAppMode = useCallback(() => {
        const nextMode = appMode === 'wizard' ? 'full' : 'wizard';
        moveToMode(nextMode, currentProgram);
    }, [appMode, currentProgram, moveToMode]);

    useEffect(() => {
        if (isLoading || autoStartedRef.current) {
            return;
        }

        autoStartedRef.current = true;
        const paramProgram = searchParams.get('program');
        const paramMode = searchParams.get('mode');

        if (paramProgram && ['wizard', 'full', 'readonly'].includes(paramMode)) {
            handleStart(paramMode, paramProgram);
            return;
        }

        if (paramProgram && !paramMode) {
            setSplashSelectedProgram(paramProgram);
        }
    }, [handleStart, isLoading, searchParams, setSplashSelectedProgram]);

    useEffect(() => {
        if (!autoStartedRef.current) {
            return;
        }

        const paramProgram = searchParams.get('program');
        const paramMode = searchParams.get('mode');

        if (!paramProgram) {
            setSplashSelectedProgram(null);
            if (appModeRef.current !== 'splash') {
                setAppMode('splash');
                clearProgramField?.();
            }
            return;
        }

        if (!paramMode) {
            setSplashSelectedProgram(paramProgram);
            if (appModeRef.current !== 'splash') {
                setAppMode('splash');
                clearProgramField?.();
            }
            return;
        }

        if (appModeRef.current === 'splash') {
            handleStart(paramMode, paramProgram);
        }
    }, [clearProgramField, handleStart, searchParams, setAppMode, setSplashSelectedProgram]);

    return {
        handleStart,
        handleBack,
        handleHome,
        handleToggleAppMode,
    };
}
