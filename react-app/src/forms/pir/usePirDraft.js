import { useCallback } from 'react';
import useDraftAutosave from '../shared/useDraftAutosave.js';
import { buildPirLocalSnapshot, buildPirPayload } from './buildPirPayload.js';
import { savePirDraft } from './submitPir.js';

export default function usePirDraft({
    appMode,
    state,
    quarterString,
    isDivisionPersonnel,
    onHydrate,
}) {
    const storageKey = state.profile.program
        ? `pir_draft_${state.profile.program}_${quarterString}`
        : null;

    const buildSnapshot = useCallback(() => (
        buildPirLocalSnapshot(state, { quarterString })
    ), [quarterString, state]);

    const saveDraft = useCallback(() => (
        savePirDraft({
            body: buildPirPayload(state, { isDivisionPersonnel, quarterString }),
        })
    ), [isDivisionPersonnel, quarterString, state]);

    return useDraftAutosave({
        enabled: ['wizard', 'full'].includes(appMode) && Boolean(state.profile.program),
        storageKey,
        buildSnapshot,
        saveDraft,
        onHydrate,
    });
}

