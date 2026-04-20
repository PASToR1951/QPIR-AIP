import { useReducer } from 'react';
import {
    appendArrayItem,
    appendExpandedArrayItem,
    removeArrayItemAtIndex,
    removeExpandedArrayItem,
    replaceExpandedArrayItems,
    updateArrayItemAtIndex,
    updateArrayItemById,
} from '../shared/createArraySectionReducer.js';

export const AIP_PHASES = ["Planning", "Implementation", "Monitoring and Evaluation"];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function deriveAipPeriodLabel(startMonth, endMonth) {
    if (!startMonth || !endMonth) {
        return '';
    }

    const start = parseInt(startMonth, 10);
    const end = parseInt(endMonth, 10);

    if (Number.isNaN(start) || Number.isNaN(end)) {
        return '';
    }

    return start === end
        ? MONTH_NAMES[start - 1]
        : `${MONTH_NAMES[start - 1]} to ${MONTH_NAMES[end - 1]}`;
}

export function createEmptyAipActivity({
    phase = 'Planning',
    ...overrides
} = {}) {
    return {
        id: overrides.id ?? (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        phase,
        name: '',
        period: '',
        periodStartMonth: '',
        periodEndMonth: '',
        persons: '',
        outputs: '',
        budgetAmount: '',
        budgetSource: '',
        ...overrides,
    };
}

export function createInitialAipActivities() {
    return [
        createEmptyAipActivity({ phase: 'Planning' }),
        createEmptyAipActivity({ phase: 'Implementation' }),
        createEmptyAipActivity({ phase: 'Monitoring and Evaluation' }),
    ];
}

export function createInitialAipState({
    year = String(new Date().getFullYear()),
} = {}) {
    return {
        profile: {
            programId: null,
            year,
            outcome: '',
            selectedTarget: '',
            depedProgram: '',
            sipTitle: '',
            projectCoord: '',
        },
        objectives: [''],
        indicators: [{ description: '', target: '' }],
        activities: createInitialAipActivities(),
        signatories: {
            preparedByName: '',
            preparedByTitle: '',
            approvedByName: '',
            approvedByTitle: '',
        },
        suggestions: {
            coordinatorSuggestions: [],
            personsTerms: [],
        },
        ui: {
            expandedActivityId: null,
        },
        submission: {
            aipId: null,
            aipStatus: null,
            isEditing: false,
            isSubmitted: false,
        },
    };
}

function aipReducer(state, action) {
    switch (action.type) {
        case 'RESET':
            return createInitialAipState(action.payload);

        case 'SET_PROFILE_FIELD':
            return {
                ...state,
                profile: {
                    ...state.profile,
                    [action.payload.field]: action.payload.value,
                },
            };

        case 'SET_OUTCOME':
            return {
                ...state,
                profile: {
                    ...state.profile,
                    outcome: action.payload,
                    selectedTarget: '',
                },
                indicators: [{ description: '', target: '' }],
            };

        case 'SET_SELECTED_TARGET':
            return {
                ...state,
                profile: {
                    ...state.profile,
                    selectedTarget: action.payload,
                },
            };

        case 'APPLY_TEMPLATE': {
            const indicators = action.payload.indicators?.length > 0
                ? action.payload.indicators.map((indicator) => ({
                    description: indicator.description,
                    target: '',
                }))
                : [{ description: action.payload.targetDescription, target: '' }];

            return {
                ...state,
                profile: {
                    ...state.profile,
                    outcome: action.payload.outcome,
                    selectedTarget: action.payload.targetDescription,
                },
                indicators,
            };
        }

        case 'SET_OBJECTIVE':
            return {
                ...state,
                objectives: updateArrayItemAtIndex(state.objectives, action.payload.index, action.payload.value),
            };

        case 'ADD_OBJECTIVE':
            return {
                ...state,
                objectives: appendArrayItem(state.objectives, ''),
            };

        case 'REMOVE_OBJECTIVE':
            return {
                ...state,
                objectives: removeArrayItemAtIndex(state.objectives, action.payload.index, ['']),
            };

        case 'SET_INDICATOR':
            return {
                ...state,
                indicators: updateArrayItemAtIndex(state.indicators, action.payload.index, (indicator) => ({
                    ...indicator,
                    [action.payload.field]: action.payload.value,
                })),
            };

        case 'ADD_INDICATOR':
            return {
                ...state,
                indicators: appendArrayItem(state.indicators, { description: '', target: '' }),
            };

        case 'REMOVE_INDICATOR':
            return {
                ...state,
                indicators: removeArrayItemAtIndex(state.indicators, action.payload.index, [{ description: '', target: '' }]),
            };

        case 'SET_ACTIVITY':
            return {
                ...state,
                activities: updateArrayItemById(state.activities, action.payload.id, (activity) => {
                    if (activity.id !== action.payload.id) {
                        return activity;
                    }

                    const updated = {
                        ...activity,
                        [action.payload.field]: action.payload.value,
                    };

                    if (action.payload.field === 'periodStartMonth' || action.payload.field === 'periodEndMonth') {
                        const startMonth = action.payload.field === 'periodStartMonth'
                            ? action.payload.value
                            : updated.periodStartMonth;
                        const endMonth = action.payload.field === 'periodEndMonth'
                            ? action.payload.value
                            : updated.periodEndMonth;
                        updated.period = deriveAipPeriodLabel(startMonth, endMonth);
                    }

                    return updated;
                }),
            };

        case 'ADD_ACTIVITY': {
            const { items, ui } = appendExpandedArrayItem({
                items: state.activities,
                item: action.payload.activity,
                ui: state.ui,
            });

            return {
                ...state,
                activities: items,
                ui,
            };
        }

        case 'REMOVE_ACTIVITY': {
            const { items, ui } = removeExpandedArrayItem({
                items: state.activities,
                id: action.payload.id,
                ui: state.ui,
                fallbackItems: createInitialAipActivities,
            });

            return {
                ...state,
                activities: items,
                ui,
            };
        }

        case 'SET_SIGNATORY':
            return {
                ...state,
                signatories: {
                    ...state.signatories,
                    [action.payload.field]: action.payload.value,
                },
            };

        case 'SET_SUGGESTIONS':
            return {
                ...state,
                suggestions: {
                    ...state.suggestions,
                    ...action.payload,
                },
            };

        case 'SET_EXPANDED_ACTIVITY_ID':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    expandedActivityId: action.payload,
                },
            };

        case 'SET_SUBMISSION_FIELD':
            return {
                ...state,
                submission: {
                    ...state.submission,
                    [action.payload.field]: action.payload.value,
                },
            };

        case 'HYDRATE_DRAFT': {
            const draft = action.payload.draft ?? {};
            const nextActivities = draft.activities?.length ? draft.activities : state.activities;
            const nextIndicators = draft.indicators?.length ? draft.indicators : state.indicators;
            const hydratedActivities = replaceExpandedArrayItems({
                nextItems: nextActivities,
                ui: state.ui,
                fallbackItems: createInitialAipActivities,
            });

            return {
                ...state,
                profile: {
                    ...state.profile,
                    programId: draft.programId ?? state.profile.programId,
                    year: draft.year || state.profile.year,
                    outcome: draft.outcome || '',
                    selectedTarget: draft.targetDescription || draft.indicators?.[0]?.description || '',
                    depedProgram: draft.depedProgram || state.profile.depedProgram,
                    sipTitle: draft.sipTitle || '',
                    projectCoord: draft.projectCoord || '',
                },
                objectives: draft.objectives?.length ? draft.objectives : [''],
                indicators: nextIndicators,
                activities: hydratedActivities.items,
                signatories: {
                    preparedByName: draft.preparedByName || '',
                    preparedByTitle: draft.preparedByTitle || '',
                    approvedByName: draft.approvedByName || '',
                    approvedByTitle: draft.approvedByTitle || '',
                },
                ui: hydratedActivities.ui,
            };
        }

        case 'HYDRATE_SUBMITTED': {
            const aip = action.payload.aip ?? {};
            const nextActivities = aip.activities?.length ? aip.activities : state.activities;
            const nextIndicators = aip.indicators?.length ? aip.indicators : state.indicators;
            const hydratedActivities = replaceExpandedArrayItems({
                nextItems: nextActivities,
                ui: state.ui,
                fallbackItems: createInitialAipActivities,
            });

            return {
                ...state,
                profile: {
                    ...state.profile,
                    programId: aip.programId ?? state.profile.programId,
                    year: String(aip.year || state.profile.year),
                    outcome: aip.outcome || '',
                    selectedTarget: aip.targetDescription || aip.indicators?.[0]?.description || '',
                    depedProgram: aip.depedProgram || state.profile.depedProgram,
                    sipTitle: aip.sipTitle || '',
                    projectCoord: aip.projectCoord || '',
                },
                objectives: aip.objectives || [],
                indicators: nextIndicators,
                activities: hydratedActivities.items,
                signatories: {
                    preparedByName: aip.preparedByName || '',
                    preparedByTitle: aip.preparedByTitle || '',
                    approvedByName: aip.approvedByName || '',
                    approvedByTitle: aip.approvedByTitle || '',
                },
                submission: {
                    ...state.submission,
                    aipId: aip.id ?? null,
                    aipStatus: aip.status ?? null,
                    editRequested: aip.editRequested ?? false,
                    editRequestedAt: aip.editRequestedAt ?? null,
                    editRequestCount: aip.editRequestCount ?? 0,
                },
                ui: hydratedActivities.ui,
            };
        }

        default:
            return state;
    }
}

export default function useAipFormState(options) {
    return useReducer(aipReducer, options, createInitialAipState);
}
