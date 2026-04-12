import { useEffect, useState } from 'react';
import api from '../../lib/api.js';

const EMPTY_STATE = {
    programsWithAIPs: [],
    programList: [],
    programAbbreviations: {},
    completedPrograms: [],
    returnedPrograms: [],
    draftPrograms: [],
    coordinatorSuggestions: [],
    personsTerms: [],
    supervisorName: '',
    supervisorTitle: '',
    notedBy: {
        SGOD: { name: '', title: '' },
        CID:  { name: '', title: '' },
        OSDS: { name: '', title: '' },
    },
    clusterHead: { name: '', title: '' },
    draft: null,
    isLoading: true,
    error: null,
};

export default function useProgramsAndConfig({
    kind,
    quarter,
    schoolOrUserId,
    clusterId,
}) {
    const [state, setState] = useState(EMPTY_STATE);

    useEffect(() => {
        let isActive = true;

        const init = async () => {
            try {
                if (kind === 'pir') {
                    const results = await Promise.allSettled([
                        api.get('/api/programs/with-aips'),
                        api.get('/api/programs/with-pirs', { params: { quarter } }),
                        api.get('/api/config', clusterId ? { params: { cluster_id: clusterId } } : undefined),
                        api.get('/api/pirs/draft'),
                    ]);

                    if (!isActive) {
                        return;
                    }

                    const [withAipsRes, withPirsRes, configRes, draftRes] = results;
                    const nextState = {
                        ...EMPTY_STATE,
                        isLoading: false,
                    };

                    if (withAipsRes.status === 'fulfilled') {
                        const programs = withAipsRes.value.data;
                        nextState.programsWithAIPs = programs.map((program) => program.title);
                        nextState.programAbbreviations = Object.fromEntries(
                            programs
                                .filter((program) => program.abbreviation)
                                .map((program) => [program.title, program.abbreviation]),
                        );
                    }

                    if (withPirsRes.status === 'fulfilled') {
                        nextState.completedPrograms = withPirsRes.value.data.map((program) => program.title);
                    }

                    if (configRes.status === 'fulfilled') {
                        const cfg = configRes.value.data;
                        nextState.supervisorName = cfg.supervisor_name ?? '';
                        nextState.supervisorTitle = cfg.supervisor_title ?? '';
                        nextState.notedBy = {
                            SGOD: { name: cfg.sgod_noted_by_name ?? '', title: cfg.sgod_noted_by_title ?? '' },
                            CID:  { name: cfg.cid_noted_by_name  ?? '', title: cfg.cid_noted_by_title  ?? '' },
                            OSDS: { name: cfg.osds_noted_by_name ?? '', title: cfg.osds_noted_by_title ?? '' },
                        };
                        nextState.clusterHead = {
                            name: cfg.cluster_head_name ?? '',
                            title: cfg.cluster_head_title ?? 'Cluster Coordinator',
                        };
                    }

                    if (draftRes.status === 'fulfilled' && draftRes.value.data.hasDraft) {
                        nextState.draft = {
                            hasDraft: true,
                            lastSaved: draftRes.value.data.lastSaved,
                            draftProgram: draftRes.value.data.draftProgram,
                            draftData: draftRes.value.data.draftData,
                        };
                    }

                    setState(nextState);
                    return;
                }

                const results = await Promise.allSettled([
                    api.get('/api/programs'),
                    api.get('/api/programs/with-aips'),
                    schoolOrUserId ? api.get(`/api/schools/${schoolOrUserId}/coordinators`) : Promise.resolve(null),
                    schoolOrUserId ? api.get(`/api/schools/${schoolOrUserId}/persons-terms`) : Promise.resolve(null),
                ]);

                if (!isActive) {
                    return;
                }

                const [programsRes, completedRes, coordsRes, termsRes] = results;
                const nextState = {
                    ...EMPTY_STATE,
                    isLoading: false,
                };

                if (programsRes.status === 'fulfilled') {
                    const programs = programsRes.value.data;
                    nextState.programList = programs.map((program) => program.title).sort();
                    nextState.programAbbreviations = Object.fromEntries(
                        programs
                            .filter((program) => program.abbreviation)
                            .map((program) => [program.title, program.abbreviation]),
                    );
                } else {
                    const status = programsRes.reason?.response?.status;
                    nextState.error = (
                        programsRes.reason?.friendlyMessage
                        ?? (status === 403
                            ? 'You do not have permission to load programs for this account.'
                            : 'Programs could not be loaded. Please refresh and try again.')
                    );
                }

                if (completedRes.status === 'fulfilled') {
                    const programs = completedRes.value.data;
                    nextState.programsWithAIPs = programs.map((program) => program.title);
                    nextState.completedPrograms = programs
                        .filter((program) => program.aip_status !== 'Draft')
                        .map((program) => program.title);
                    nextState.returnedPrograms = programs
                        .filter((program) => program.aip_status === 'Returned')
                        .map((program) => program.title);
                    nextState.draftPrograms = programs
                        .filter((program) => program.aip_status === 'Draft')
                        .map((program) => program.title);
                }

                if (coordsRes.status === 'fulfilled' && coordsRes.value?.data) {
                    nextState.coordinatorSuggestions = coordsRes.value.data;
                }

                if (termsRes.status === 'fulfilled' && termsRes.value?.data) {
                    nextState.personsTerms = termsRes.value.data;
                }

                setState(nextState);
            } catch (error) {
                if (!isActive) {
                    return;
                }
                setState((currentState) => ({
                    ...currentState,
                    isLoading: false,
                    error,
                }));
            }
        };

        setState(EMPTY_STATE);
        init();

        return () => {
            isActive = false;
        };
    }, [kind, quarter, schoolOrUserId, clusterId]);

    return state;
}

