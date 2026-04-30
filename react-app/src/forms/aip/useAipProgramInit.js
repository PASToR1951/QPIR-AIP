import { useCallback } from 'react';
import api from '../../lib/api.js';
import { emitOnboardingSignal } from '../../lib/onboardingSignals.js';

/**
 * Produces the stable callback set needed by useFormLifecycle and by useAipMutations.
 * Keeps the per-program API calls, draft bootstrapping, and form-reset logic in one place.
 */
export function useAipProgramInit({
    rawPrograms, data, state, dispatch, shell, draft, profile, setLoadError, reportingYear,
}) {
    const findProgramByTitle = useCallback((programTitle) => (
        rawPrograms.find((program) => program.title === programTitle) ?? null
    ), [rawPrograms]);

    const buildProgramParams = useCallback((programTitle, extraParams = {}) => {
        const program = findProgramByTitle(programTitle);
        return {
            ...extraParams,
            program_title: programTitle,
            ...(program?.id ? { program_id: program.id } : {}),
        };
    }, [findProgramByTitle]);

    const resetFormState = useCallback((selectedProgram = '') => {
        const selectedProgramRecord = findProgramByTitle(selectedProgram);
        dispatch({ type: 'RESET', payload: { year: reportingYear } });
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'depedProgram', value: selectedProgram } });
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'programId', value: selectedProgramRecord?.id ?? null } });
        dispatch({
            type: 'SET_SUGGESTIONS',
            payload: { coordinatorSuggestions: data.coordinatorSuggestions, personsTerms: data.personsTerms },
        });
        shell.setCurrentStep(1);
    }, [data.coordinatorSuggestions, data.personsTerms, dispatch, findProgramByTitle, reportingYear, shell]);

    const loadServerDraft = useCallback(async (selectedProgram, yearValue) => {
        const draftResponse = await api.get('/api/aips/draft', {
            params: buildProgramParams(selectedProgram, { year: parseInt(yearValue, 10) }),
        });
        if (draftResponse.data.hasDraft) { draft.hydrate(draftResponse.data.draftData); return true; }
        return false;
    }, [buildProgramParams, draft]);

    const applyTemplateForProgram = useCallback(async (selectedProgram) => {
        const selectedProgramRecord = findProgramByTitle(selectedProgram);
        if (!selectedProgramRecord?.id) return false;
        const templateResponse = await api.get(`/api/programs/${selectedProgramRecord.id}/template`);
        const template = templateResponse.data;
        if (!template) return false;
        dispatch({ type: 'APPLY_TEMPLATE', payload: { outcome: template.outcome, targetDescription: template.target_description, indicators: template.indicators ?? [] } });
        return true;
    }, [dispatch, findProgramByTitle]);

    const hasInputtedData = useCallback(() => (
        profile.outcome || profile.sipTitle || profile.projectCoord
        || state.objectives.some((o) => o.trim())
        || state.indicators.some((i) => i.description.trim() || i.target.trim())
        || state.signatories.preparedByName
        || state.signatories.approvedByName
        || state.activities.some((a) => a.name || a.period || a.persons || a.outputs || a.budgetAmount || a.budgetSource)
    ), [
        profile.outcome, profile.sipTitle, profile.projectCoord,
        state.activities, state.indicators, state.objectives,
        state.signatories.approvedByName, state.signatories.preparedByName,
    ]);

    // Callbacks consumed directly by useFormLifecycle
    const resetSubmissionState = useCallback(() => {
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isSubmitted', value: false } });
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing',   value: false } });
    }, [dispatch]);

    const exitEditMode = useCallback(() => {
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: false } });
    }, [dispatch]);

    const clearProgramField = useCallback(() => {
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'depedProgram', value: '' } });
        dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'programId',    value: null } });
    }, [dispatch]);

    const loadReadonlyRecord = useCallback(async (selectedProgram) => {
        const response = await api.get('/api/aips', {
            params: buildProgramParams(selectedProgram, { year: reportingYear }),
        });
        dispatch({ type: 'HYDRATE_SUBMITTED', payload: { aip: response.data } });
    }, [buildProgramParams, dispatch, reportingYear]);

    const hydrateDraft = useCallback((draftData) => {
        draft.hydrate(draftData);
    }, [draft]);

    const getLocalDraftKey = useCallback((selectedProgram) =>
        `aip_draft_${selectedProgram}_${reportingYear}`, [reportingYear]);

    const getLocalDraftModal = useCallback(({ localDraft }) => ({
        type: 'warning',
        title: 'Continue your saved draft?',
        message: `We found an auto-saved draft from ${new Date(localDraft.savedAt).toLocaleString()}. Continue from that draft?`,
        confirmText: 'Continue draft',
        cancelText: 'Continue without local draft',
    }), []);

    const loadInitialDraft = useCallback(async (selectedProgram) => {
        const currentYear = reportingYear;
        const hasServerDraft = await loadServerDraft(selectedProgram, currentYear);
        if (!hasServerDraft) await applyTemplateForProgram(selectedProgram);
    }, [applyTemplateForProgram, loadServerDraft, reportingYear]);

    const loadDiscardedLocalDraftFallback = useCallback(async (selectedProgram) => {
        const currentYear = reportingYear;
        const hasServerDraft = await loadServerDraft(selectedProgram, currentYear);
        if (!hasServerDraft) await applyTemplateForProgram(selectedProgram);
    }, [applyTemplateForProgram, loadServerDraft, reportingYear]);

    const onBeforeStart = useCallback(({ mode, selectedProgram }) => {
        setLoadError(null);
        if (mode !== 'readonly') {
            emitOnboardingSignal('author.program_selected', { program: selectedProgram, mode });
        }
    }, [setLoadError]);

    const onReadonlyError = useCallback((error) => {
        setLoadError(error?.friendlyMessage ?? 'Failed to load the AIP. Please try again.');
    }, [setLoadError]);

    return {
        findProgramByTitle, buildProgramParams, resetFormState,
        loadServerDraft, applyTemplateForProgram, hasInputtedData,
        resetSubmissionState, exitEditMode, clearProgramField,
        loadReadonlyRecord, hydrateDraft,
        getLocalDraftKey, getLocalDraftModal,
        loadInitialDraft, loadDiscardedLocalDraftFallback,
        onBeforeStart, onReadonlyError,
    };
}
