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
    // Tracks whether a handleStart call is in-flight (including while a local-draft
    // confirmation modal is open). Without this, the URL-params effect would keep
    // re-invoking handleStart on every render because handleStart's identity changes
    // every render (its deps include shell/draft/etc.) while appMode stays 'splash'.
    const startPendingRef = useRef(false);

    useEffect(() => {
        appModeRef.current = appMode;
    }, [appMode]);

    const moveToMode = useCallback((mode, selectedProgram) => {
        setAppMode(mode);
        setSearchParams({ program: selectedProgram, mode }, { replace: true });
    }, [setAppMode, setSearchParams]);

    const handleStart = useCallback(async (mode, selectedProgram) => {
        if (!selectedProgram || startPendingRef.current) {
            return false;
        }

        startPendingRef.current = true;

        resetFormState(selectedProgram);
        resetSubmissionState?.();
        await onBeforeStart?.({ mode, selectedProgram });

        if (mode === 'readonly') {
            try {
                await loadReadonlyRecord(selectedProgram);
            } catch (error) {
                startPendingRef.current = false;
                onReadonlyError?.(error);
                return false;
            }

            moveToMode('readonly', selectedProgram);
            startPendingRef.current = false;
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
                    startPendingRef.current = false;
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
                    startPendingRef.current = false;
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
        startPendingRef.current = false;
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

        if (appMode !== 'readonly' && hasInputtedData()) {
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

    // Keep a ref so the URL-params effect below can always call the latest
    // handleStart without listing it as a dependency. handleStart changes
    // identity on every render (its dep chain includes the un-memoised shell
    // object), so putting it in the deps array causes the effect to re-fire
    // while appMode is already 'splash' but the URL still has ?mode=readonly —
    // which re-triggers handleStart and bounces the user back into readonly.
    const handleStartRef = useRef(handleStart);
    useEffect(() => {
        handleStartRef.current = handleStart;
    }, [handleStart]);

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

        if (appModeRef.current === 'splash' && !startPendingRef.current) {
            handleStartRef.current(paramMode, paramProgram);
        }
    }, [clearProgramField, searchParams, setAppMode, setSplashSelectedProgram]);

    return {
        handleStart,
        handleBack,
        handleHome,
        handleToggleAppMode,
    };
}
