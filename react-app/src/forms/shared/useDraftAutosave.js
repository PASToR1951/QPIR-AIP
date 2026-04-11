import { useCallback, useEffect, useRef, useState } from 'react';

function formatTimestamp() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function useDraftAutosave({
    enabled,
    storageKey,
    buildSnapshot,
    saveDraft,
    debounceMs = 15000,
    onHydrate,
    onAutosave,
    afterManualSave,
}) {
    const saveTimerRef = useRef(null);
    const autosaveTimerRef = useRef(null);
    const autosaveFlashTimerRef = useRef(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState(null);
    const [lastAutoSavedTime, setLastAutoSavedTime] = useState(null);

    const clearDraft = useCallback((key = storageKey) => {
        if (!key) {
            return;
        }
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore storage failures in private mode or quota limits.
        }
    }, [storageKey]);

    const readDraft = useCallback((key = storageKey) => {
        if (!key) {
            return null;
        }

        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, [storageKey]);

    const hydrate = useCallback((draftData) => {
        if (draftData) {
            onHydrate?.(draftData);
        }
    }, [onHydrate]);

    const saveNow = useCallback(async () => {
        if (!saveDraft) {
            return;
        }

        clearTimeout(saveTimerRef.current);
        setIsSaving(true);

        try {
            await saveDraft();
            afterManualSave?.();
        } catch {
            // The current forms do not surface draft-save errors inline.
        }

        saveTimerRef.current = setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
            setLastSavedTime(formatTimestamp());
            saveTimerRef.current = setTimeout(() => setIsSaved(false), 3000);
        }, 800);
    }, [afterManualSave, saveDraft]);

    useEffect(() => () => {
        clearTimeout(saveTimerRef.current);
        clearTimeout(autosaveTimerRef.current);
        clearTimeout(autosaveFlashTimerRef.current);
    }, []);

    useEffect(() => {
        if (!enabled || !storageKey || !buildSnapshot) {
            return undefined;
        }

        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
            try {
                localStorage.setItem(storageKey, JSON.stringify({
                    ...buildSnapshot(),
                    savedAt: new Date().toISOString(),
                }));
                onAutosave?.();
                setLastAutoSavedTime(formatTimestamp());
                clearTimeout(autosaveFlashTimerRef.current);
                autosaveFlashTimerRef.current = setTimeout(() => setLastAutoSavedTime(null), 3000);
            } catch {
                // Ignore local storage failures.
            }
        }, debounceMs);

        return () => {
            clearTimeout(autosaveTimerRef.current);
        };
    }, [buildSnapshot, debounceMs, enabled, onAutosave, storageKey]);

    return {
        isSaving,
        isSaved,
        lastSavedTime,
        lastAutoSavedTime,
        saveNow,
        clearDraft,
        readDraft,
        hydrate,
    };
}

