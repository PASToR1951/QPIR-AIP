import { useCallback } from 'react';
import api from '../../lib/api.js';
import { buildAipPayload } from './buildAipPayload.js';
import submitAip from './submitAip.js';

/**
 * All user-triggered mutation actions for the AIP form:
 * bulk delete, single delete, edit AIP, request/cancel edit, remove activity, confirm submit.
 */
export function useAipMutations({
    shell, dispatch, navigate, state, draft,
    profile, submission, projectTerminology,
    setSearchParams, setCompletedPrograms, setReturnedPrograms, setDraftPrograms,
    showToast, buildProgramParams,
}) {
    const handleBulkDelete = useCallback((programsToDelete) => {
        shell.openModal({
            type: 'warning',
            title: `Delete ${programsToDelete.length} AIP${programsToDelete.length > 1 ? 's' : ''}?`,
            message: `This will permanently delete ${programsToDelete.length} AIP submission${programsToDelete.length > 1 ? 's' : ''}. This cannot be undone.`,
            confirmText: `Yes, Delete ${programsToDelete.length > 1 ? 'All' : 'It'}`,
            onConfirm: async () => {
                shell.closeModal();
                const currentYear = parseInt(profile.year, 10);
                const results = await Promise.allSettled(
                    programsToDelete.map((program) => (
                        api.delete('/api/aips', { params: buildProgramParams(program, { year: currentYear }) })
                    )),
                );
                const deletedPrograms = programsToDelete.filter((_, index) => results[index].status === 'fulfilled');
                if (deletedPrograms.length > 0) {
                    setCompletedPrograms((prev) => prev.filter((p) => !deletedPrograms.includes(p)));
                    setReturnedPrograms((prev)  => prev.filter((p) => !deletedPrograms.includes(p)));
                    setDraftPrograms((prev)      => prev.filter((p) => !deletedPrograms.includes(p)));
                    showToast(deletedPrograms);
                }
            },
        });
    }, [buildProgramParams, profile.year, setCompletedPrograms, setDraftPrograms, setReturnedPrograms, shell, showToast]);

    const handleRequestEdit = useCallback(async () => {
        if (!submission.aipId) return;
        try {
            await api.post(`/api/aips/${submission.aipId}/request-edit`);
            const now = new Date().toISOString();
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'editRequested',    value: true } });
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'editRequestedAt',  value: now } });
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'editRequestCount', value: (submission.editRequestCount ?? 0) + 1 } });
            const remaining = 3 - ((submission.editRequestCount ?? 0) + 1);
            shell.openModal({
                type: 'success', title: 'Edit Request Sent',
                message: `Your request to edit this AIP has been sent. An admin will review it shortly.\n\nYou can cancel this request anytime using the "Edit Request Sent" button.${remaining > 0 ? ` You have ${remaining} edit request${remaining !== 1 ? 's' : ''} remaining.` : ' This was your last allowed edit request.'}`,
                confirmText: 'Okay', onConfirm: shell.closeModal, hideCancelButton: true,
            });
        } catch (error) {
            shell.openModal({ type: 'warning', title: 'Request Failed', message: error.friendlyMessage ?? 'Failed to send edit request. Please try again.', confirmText: 'Close', onConfirm: shell.closeModal });
        }
    }, [shell, submission.aipId, dispatch]);

    const handleCancelEditRequest = useCallback(async () => {
        if (!submission.aipId) return;
        try {
            await api.post(`/api/aips/${submission.aipId}/cancel-edit-request`);
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'editRequested',   value: false } });
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'editRequestedAt', value: null } });
        } catch (error) {
            shell.openModal({ type: 'warning', title: 'Cancel Failed', message: error.friendlyMessage ?? 'Failed to cancel edit request. Please try again.', confirmText: 'Close', onConfirm: shell.closeModal });
        }
    }, [shell, submission.aipId, dispatch]);

    const handleEditAIP = useCallback(() => {
        dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing', value: true } });
        shell.setCurrentStep(1);
        shell.setAppMode('wizard');
        setSearchParams({ program: profile.depedProgram, mode: 'wizard' }, { replace: true });
    }, [dispatch, profile.depedProgram, setSearchParams, shell]);

    const handleDeleteSubmission = useCallback(() => {
        shell.openModal({
            type: 'warning', title: 'Delete Submission?',
            message: 'The document will be marked as deleted and remain in your submission history for audit purposes. This cannot be undone.',
            confirmText: 'Yes, Delete',
            onConfirm: async () => {
                shell.closeModal();
                try {
                    await api.delete(`/api/aips/${submission.aipId}`);
                    setCompletedPrograms((prev) => prev.filter((p) => p !== profile.depedProgram));
                    setReturnedPrograms((prev)  => prev.filter((p) => p !== profile.depedProgram));
                    setDraftPrograms((prev)      => prev.filter((p) => p !== profile.depedProgram));
                    showToast([profile.depedProgram]);
                    shell.setAppMode('splash');
                    setSearchParams({}, { replace: true });
                } catch (error) {
                    shell.openModal({ type: 'warning', title: "We couldn't delete this AIP", message: error.friendlyMessage ?? 'Please try again. If the problem continues, contact SDO IT.', confirmText: 'Close', onConfirm: shell.closeModal });
                }
            },
        });
    }, [profile.depedProgram, setCompletedPrograms, setDraftPrograms, setReturnedPrograms, setSearchParams, shell, showToast, submission.aipId]);

    const handleRequestRemoveActivity = useCallback((activityId) => {
        const activity = state.activities.find((a) => a.id === activityId);
        const hasData = activity && [activity.name, activity.period, activity.persons, activity.outputs, activity.budgetAmount, activity.budgetSource].some((v) => String(v).trim() !== '');
        if (hasData) {
            shell.openModal({
                type: 'warning', title: 'Delete Activity?',
                message: 'This activity contains data. Are you sure you want to permanently remove it?',
                confirmText: 'Yes, Delete',
                onConfirm: () => { dispatch({ type: 'REMOVE_ACTIVITY', payload: { id: activityId } }); shell.closeModal(); },
            });
            return;
        }
        dispatch({ type: 'REMOVE_ACTIVITY', payload: { id: activityId } });
    }, [dispatch, shell, state.activities]);

    const handleConfirmSubmit = useCallback(async () => {
        const payload = buildAipPayload(state);
        const validationErrors = [];
        if (!profile.outcome) validationErrors.push('Please choose an Outcome Category.');
        if (!profile.sipTitle.trim()) validationErrors.push(projectTerminology.projectTitleValidationMessage);
        if (payload.activities.length === 0) validationErrors.push('Add at least one activity before submitting.');
        if (validationErrors.length > 0) {
            shell.openModal({ type: 'warning', title: 'Complete the required fields', message: validationErrors.join(' '), confirmText: 'Review form', onConfirm: shell.closeModal });
            return;
        }
        try {
            await submitAip({ body: payload, aipId: submission.aipId, isEditing: submission.isEditing });
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isEditing',  value: false } });
            dispatch({ type: 'SET_SUBMISSION_FIELD', payload: { field: 'isSubmitted', value: true } });
            draft.clearDraft(`aip_draft_${profile.depedProgram}_${profile.year}`);
            shell.openModal({
                type: 'success',
                title: submission.isEditing ? 'AIP updated' : 'AIP submitted',
                message: submission.isEditing
                    ? 'Your changes have been saved and sent back for review.'
                    : 'Your AIP - Annual Plan has been submitted. You can review it from your submission history.',
                confirmText: 'View Submission',
                onConfirm: () => {
                    shell.closeModal();
                    shell.setAppMode('readonly');
                    setSearchParams({ program: profile.depedProgram, mode: 'readonly' }, { replace: true });
                    api.get('/api/aips', { params: buildProgramParams(profile.depedProgram, { year: new Date().getFullYear() }) })
                        .then(r => { dispatch({ type: 'HYDRATE_SUBMITTED', payload: { aip: r.data } }); }).catch(() => {});
                },
                hideCancelButton: true,
                extraAction: { text: 'Back to Dashboard', onClick: () => { shell.closeModal(); navigate('/'); } },
            });
        } catch (error) {
            shell.openModal({ type: 'warning', title: submission.isEditing ? "We couldn't update this AIP" : "We couldn't submit this AIP", message: error.friendlyMessage ?? 'Please try again. If the problem continues, contact SDO IT.', confirmText: 'Close', onConfirm: shell.closeModal });
        }
    }, [buildProgramParams, dispatch, draft, navigate, profile.depedProgram, profile.outcome, profile.sipTitle, profile.year, projectTerminology.projectTitleValidationMessage, setSearchParams, shell, state, submission.aipId, submission.isEditing]);

    return {
        handleBulkDelete, handleRequestEdit, handleCancelEditRequest,
        handleEditAIP, handleDeleteSubmission, handleRequestRemoveActivity, handleConfirmSubmit,
    };
}
