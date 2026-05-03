import { useState, useEffect } from 'react';

/**
 * Manages the program-list state that is derived from useProgramsAndConfig.
 * Consolidates the data-sync effect and the autosaved-programs cleanup effect
 * so the container shell only holds orchestration logic.
 */
export function useAipProgramState({ data, dispatch, profileYear }) {
    const [programList, setProgramList]                   = useState([]);
    const [programAbbreviations, setProgramAbbreviations] = useState({});
    const [completedPrograms, setCompletedPrograms]       = useState([]);
    const [returnedPrograms, setReturnedPrograms]         = useState([]);
    const [draftPrograms, setDraftPrograms]               = useState([]);
    const [autosavedPrograms, setAutosavedPrograms]       = useState([]);
    const [notedBy, setNotedBy]                           = useState(null);
    const [loadError, setLoadError]                       = useState(null);

    // Sync data → local state whenever the programs/config response updates
    useEffect(() => {
        setProgramList(data.programList);
        setProgramAbbreviations(data.programAbbreviations);
        setCompletedPrograms(data.completedPrograms);
        setReturnedPrograms(data.returnedPrograms);
        setDraftPrograms(data.draftPrograms);
        setNotedBy(data.notedBy);
        setLoadError(typeof data.error === 'string' ? data.error : (data.error?.friendlyMessage ?? null));
        dispatch({
            type: 'SET_SUGGESTIONS',
            payload: {
                coordinatorSuggestions: data.coordinatorSuggestions,
                personsTerms: data.personsTerms,
            },
        });
    }, [
        data.completedPrograms,
        data.coordinatorSuggestions,
        data.draftPrograms,
        data.error,
        data.personsTerms,
        data.programAbbreviations,
        data.programList,
        data.returnedPrograms,
        data.notedBy,
        dispatch,
    ]);

    // Remove completed programs' localStorage drafts; track which programs still have autosaved data
    useEffect(() => {
        if (!profileYear || programList.length === 0) return;
        completedPrograms.forEach((program) => {
            try { localStorage.removeItem(`aip_draft_${program}_${profileYear}`); } catch { /* ignore */ }
        });
        const nextAutosavedPrograms = programList.filter((program) => (
            !completedPrograms.includes(program)
            && localStorage.getItem(`aip_draft_${program}_${profileYear}`) !== null
        ));
        setAutosavedPrograms(nextAutosavedPrograms);
    }, [completedPrograms, profileYear, programList]);

    return {
        programList,
        programAbbreviations,
        completedPrograms, setCompletedPrograms,
        returnedPrograms, setReturnedPrograms,
        draftPrograms, setDraftPrograms,
        autosavedPrograms, setAutosavedPrograms,
        notedBy,
        loadError, setLoadError,
    };
}
