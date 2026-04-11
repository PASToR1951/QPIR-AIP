import { useReducer } from 'react';

export const FACTOR_TYPES = ["Institutional", "Technical", "Infrastructure", "Learning Resources", "Environmental", "Others"];

export function createEmptyPirActivity(overrides = {}) {
    return {
        id: overrides.id ?? crypto.randomUUID(),
        name: '',
        implementation_period: '',
        period_start_month: null,
        period_end_month: null,
        aip_activity_id: null,
        fromAIP: false,
        isUnplanned: false,
        complied: null,
        actualTasksConducted: '',
        contributoryIndicators: '',
        movsExpectedOutputs: '',
        adjustments: '',
        physTarget: '',
        finTarget: '',
        physAcc: '',
        finAcc: '',
        actions: '',
        ...overrides,
    };
}

export function createInitialFactors() {
    return FACTOR_TYPES.reduce((accumulator, type) => {
        accumulator[type] = { facilitating: '', hindering: '', recommendations: '' };
        return accumulator;
    }, {});
}

export function createInitialPirState({
    isDivisionPersonnel = false,
    schoolName = '',
} = {}) {
    const initialActivity = createEmptyPirActivity();

    return {
        profile: {
            program: '',
            school: isDivisionPersonnel ? 'Division' : schoolName,
            owner: '',
            ownerLocked: false,
            functionalDivision: '',
        },
        budget: {
            fromDivision: '',
            fromCoPSF: '',
        },
        indicatorTargets: [],
        activities: [initialActivity],
        removedAIPActivities: [],
        factors: createInitialFactors(),
        actionItems: [{ action: '', response_asds: '', response_sds: '' }],
        ui: {
            expandedActivityId: initialActivity.id,
            isAddingActivity: false,
        },
        submission: {
            pirId: null,
            pirStatus: null,
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

function pirReducer(state, action) {
    switch (action.type) {
        case 'RESET':
            return createInitialPirState(action.payload);

        case 'SET_PROFILE_FIELD':
            return {
                ...state,
                profile: {
                    ...state.profile,
                    [action.payload.field]: action.payload.value,
                },
            };

        case 'SET_BUDGET_FIELD':
            return {
                ...state,
                budget: {
                    ...state.budget,
                    [action.payload.field]: action.payload.value,
                },
            };

        case 'SET_OWNER_LOCKED':
            return {
                ...state,
                profile: {
                    ...state.profile,
                    ownerLocked: action.payload,
                },
            };

        case 'SET_INDICATOR_TARGETS':
            return {
                ...state,
                indicatorTargets: action.payload,
            };

        case 'UPDATE_INDICATOR_TARGET':
            return {
                ...state,
                indicatorTargets: state.indicatorTargets.map((item, index) => (
                    index === action.payload.index
                        ? { ...item, quarterly_target: action.payload.value }
                        : item
                )),
            };

        case 'SET_ACTION_ITEM':
            return {
                ...state,
                actionItems: state.actionItems.map((item, index) => (
                    index === action.payload.index
                        ? { ...item, [action.payload.field]: action.payload.value }
                        : item
                )),
            };

        case 'ADD_ACTION_ITEM':
            return {
                ...state,
                actionItems: [...state.actionItems, { action: '', response_asds: '', response_sds: '' }],
            };

        case 'REMOVE_ACTION_ITEM': {
            const nextActionItems = state.actionItems.filter((_, index) => index !== action.payload.index);
            return {
                ...state,
                actionItems: nextActionItems.length > 0
                    ? nextActionItems
                    : [{ action: '', response_asds: '', response_sds: '' }],
            };
        }

        case 'ADD_ACTIVITY': {
            const nextActivities = [...state.activities, action.payload.activity];
            return {
                ...state,
                activities: nextActivities,
                ui: {
                    ...state.ui,
                    expandedActivityId: action.payload.activity.id,
                    isAddingActivity: action.payload.showAddedFlash ?? state.ui.isAddingActivity,
                },
            };
        }

        case 'UPDATE_ACTIVITY':
            return {
                ...state,
                activities: state.activities.map((activity) => (
                    activity.id === action.payload.id
                        ? { ...activity, [action.payload.field]: action.payload.value }
                        : activity
                )),
            };

        case 'REMOVE_ACTIVITY': {
            const activityToRemove = state.activities.find((activity) => activity.id === action.payload.id);
            const nextActivities = state.activities.filter((activity) => activity.id !== action.payload.id);
            const nextRemovedActivities = (
                action.payload.moveToRemovedAip
                && activityToRemove?.fromAIP
                && !state.removedAIPActivities.some((activity) => activity.id === action.payload.id)
            )
                ? [...state.removedAIPActivities, activityToRemove]
                : state.removedAIPActivities;

            return {
                ...state,
                activities: nextActivities.length > 0 ? nextActivities : [createEmptyPirActivity()],
                removedAIPActivities: nextRemovedActivities,
                ui: {
                    ...state.ui,
                    expandedActivityId: resolveExpandedActivityId(nextActivities, state.ui.expandedActivityId),
                },
            };
        }

        case 'RESTORE_ACTIVITY': {
            const activityToRestore = state.removedAIPActivities.find((activity) => activity.id === action.payload.id);
            if (!activityToRestore) {
                return state;
            }

            const nextActivities = [...state.activities, activityToRestore];
            return {
                ...state,
                activities: nextActivities,
                removedAIPActivities: state.removedAIPActivities.filter((activity) => activity.id !== action.payload.id),
                ui: {
                    ...state.ui,
                    expandedActivityId: activityToRestore.id,
                },
            };
        }

        case 'REPLACE_ACTIVITIES_FROM_AIP':
            return {
                ...state,
                activities: action.payload.activities.length > 0
                    ? action.payload.activities
                    : [createEmptyPirActivity()],
                ui: {
                    ...state.ui,
                    expandedActivityId: resolveExpandedActivityId(action.payload.activities, state.ui.expandedActivityId),
                },
            };

        case 'SET_FACTOR':
            return {
                ...state,
                factors: {
                    ...state.factors,
                    [action.payload.type]: {
                        ...state.factors[action.payload.type],
                        [action.payload.category]: action.payload.value,
                    },
                },
            };

        case 'SET_FACTORS':
            return {
                ...state,
                factors: action.payload,
            };

        case 'SET_EXPANDED_ACTIVITY_ID':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    expandedActivityId: action.payload,
                },
            };

        case 'SET_IS_ADDING_ACTIVITY':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    isAddingActivity: action.payload,
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

            return {
                ...state,
                profile: {
                    ...state.profile,
                    school: action.payload.isDivisionPersonnel
                        ? (draft.school || 'Division')
                        : state.profile.school,
                    owner: draft.owner || '',
                    functionalDivision: draft.functionalDivision || '',
                },
                budget: {
                    fromDivision: draft.budgetFromDivision || '',
                    fromCoPSF: draft.budgetFromCoPSF || '',
                },
                indicatorTargets: draft.indicatorQuarterlyTargets?.length
                    ? draft.indicatorQuarterlyTargets
                    : state.indicatorTargets,
                actionItems: draft.actionItems?.length
                    ? draft.actionItems
                    : state.actionItems,
                activities: nextActivities,
                factors: draft.factors || state.factors,
                ui: {
                    ...state.ui,
                    expandedActivityId: resolveExpandedActivityId(nextActivities, state.ui.expandedActivityId),
                },
            };
        }

        case 'HYDRATE_SUBMITTED': {
            const pir = action.payload.pir ?? {};
            const nextActivities = pir.activities?.length ? pir.activities : state.activities;

            return {
                ...state,
                profile: {
                    ...state.profile,
                    school: pir.school || state.profile.school,
                    owner: pir.owner || '',
                    functionalDivision: String(pir.functionalDivision || ''),
                },
                budget: {
                    fromDivision: String(pir.budgetFromDivision || ''),
                    fromCoPSF: String(pir.budgetFromCoPSF || ''),
                },
                indicatorTargets: pir.indicatorQuarterlyTargets || [],
                actionItems: pir.actionItems || state.actionItems,
                activities: nextActivities,
                factors: pir.factors || state.factors,
                submission: {
                    ...state.submission,
                    pirId: pir.id ?? null,
                    pirStatus: pir.status ?? null,
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

export default function usePirFormState(options) {
    return useReducer(pirReducer, options, createInitialPirState);
}

