import { useCallback } from 'react';
import useDraftAutosave from '../shared/useDraftAutosave.js';
import { buildAipLocalSnapshot, buildAipPayload } from './buildAipPayload.js';
import { saveAipDraft } from './submitAip.js';

export default function useAipDraft({
    appMode,
    state,
    onHydrate,
    onAutosave,
    afterManualSave,
}) {
    const storageKey = state.profile.depedProgram
        ? `aip_draft_${state.profile.depedProgram}_${state.profile.year}`
        : null;

    const buildSnapshot = useCallback(() => (
        buildAipLocalSnapshot(state)
    ), [state]);

    const saveDraft = useCallback(() => (
        saveAipDraft({
            body: buildAipPayload(state),
        })
    ), [state]);

    return useDraftAutosave({
        enabled: ['wizard', 'full'].includes(appMode) && Boolean(state.profile.depedProgram),
        storageKey,
        buildSnapshot,
        saveDraft,
        onHydrate,
        onAutosave,
        afterManualSave,
    });
}
