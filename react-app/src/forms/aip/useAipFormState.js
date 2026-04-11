import { useReducer } from 'react';

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
        id: overrides.id ?? crypto.randomUUID(),
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

function resolveExpandedActivityId(activities, previousExpandedId = null) {
    if (activities.length === 0) {
        return null;
    }

    return activities.some((activity) => activity.id === previousExpandedId)
        ? previousExpandedId
        : activities[activities.length - 1].id;
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
                indicators: state.indicators.length > 0
                    ? [{ ...state.indicators[0], description: action.payload }, ...state.indicators.slice(1)]
                    : [{ description: action.payload, target: '' }],
            };

        case 'SET_OBJECTIVE':
            return {
                ...state,
                objectives: state.objectives.map((objective, index) => (
                    index === action.payload.index ? action.payload.value : objective
                )),
            };

        case 'ADD_OBJECTIVE':
            return {
                ...state,
                objectives: [...state.objectives, ''],
            };

        case 'REMOVE_OBJECTIVE': {
            const nextObjectives = state.objectives.filter((_, index) => index !== action.payload.index);
            return {
                ...state,
                objectives: nextObjectives.length > 0 ? nextObjectives : [''],
            };
        }

        case 'SET_INDICATOR':
            return {
                ...state,
                indicators: state.indicators.map((indicator, index) => (
                    index === action.payload.index
                        ? { ...indicator, [action.payload.field]: action.payload.value }
                        : indicator
                )),
            };

        case 'ADD_INDICATOR':
            return {
                ...state,
                indicators: [...state.indicators, { description: '', target: '' }],
            };

        case 'REMOVE_INDICATOR': {
            const nextIndicators = state.indicators.filter((_, index) => index !== action.payload.index);
            return {
                ...state,
                indicators: nextIndicators.length > 0 ? nextIndicators : [{ description: '', target: '' }],
            };
        }

        case 'SET_ACTIVITY':
            return {
                ...state,
                activities: state.activities.map((activity) => {
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
            const nextActivities = [...state.activities, action.payload.activity];
            return {
                ...state,
                activities: nextActivities,
                ui: {
                    ...state.ui,
                    expandedActivityId: action.payload.activity.id,
                },
            };
        }

        case 'REMOVE_ACTIVITY': {
            const nextActivities = state.activities.filter((activity) => activity.id !== action.payload.id);
            const fallbackActivities = nextActivities.length > 0 ? nextActivities : createInitialAipActivities();
            return {
                ...state,
                activities: fallbackActivities,
                ui: {
                    ...state.ui,
                    expandedActivityId: resolveExpandedActivityId(nextActivities, state.ui.expandedActivityId),
                },
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

            return {
                ...state,
                profile: {
                    ...state.profile,
                    year: draft.year || state.profile.year,
                    outcome: draft.outcome || '',
                    selectedTarget: draft.indicators?.[0]?.description || '',
                    sipTitle: draft.sipTitle || '',
                    projectCoord: draft.projectCoord || '',
                },
                objectives: draft.objectives?.length ? draft.objectives : [''],
                indicators: nextIndicators,
                activities: nextActivities,
                signatories: {
                    preparedByName: draft.preparedByName || '',
                    preparedByTitle: draft.preparedByTitle || '',
                    approvedByName: draft.approvedByName || '',
                    approvedByTitle: draft.approvedByTitle || '',
                },
                ui: {
                    ...state.ui,
                    expandedActivityId: resolveExpandedActivityId(nextActivities, state.ui.expandedActivityId),
                },
            };
        }

        case 'HYDRATE_SUBMITTED': {
            const aip = action.payload.aip ?? {};
            const nextActivities = aip.activities?.length ? aip.activities : state.activities;
            const nextIndicators = aip.indicators?.length ? aip.indicators : state.indicators;

            return {
                ...state,
                profile: {
                    ...state.profile,
                    year: String(aip.year || state.profile.year),
                    outcome: aip.outcome || '',
                    selectedTarget: aip.indicators?.[0]?.description || '',
                    sipTitle: aip.sipTitle || '',
                    projectCoord: aip.projectCoord || '',
                },
                objectives: aip.objectives || [],
                indicators: nextIndicators,
                activities: nextActivities,
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
                },
                ui: {
                    ...state.ui,
                    expandedActivityId: resolveExpandedActivityId(nextActivities, state.ui.expandedActivityId),
                },
            };
        }

        default:
            return state;
    }
}

export default function useAipFormState(options) {
    return useReducer(aipReducer, options, createInitialAipState);
}

