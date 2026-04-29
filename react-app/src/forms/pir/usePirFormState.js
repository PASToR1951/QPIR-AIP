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

export const FACTOR_TYPES = ["Institutional", "Technical", "Infrastructure", "Learning Resources", "Environmental", "Others"];

export function createEmptyPirActivity(overrides = {}) {
    return {
        id: overrides.id ?? (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
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
        accumulator[type] = {};
        return accumulator;
    }, {});
}

function normalizeFactors(loaded) {
    if (!loaded || typeof loaded !== 'object') return null;

    const hasLegacyShape = FACTOR_TYPES.some((type) => (
        typeof loaded[type]?.facilitating === 'string'
        || typeof loaded[type]?.hindering === 'string'
        || typeof loaded[type]?.recommendations === 'string'
    ));

    if (hasLegacyShape) {
        return createInitialFactors();
    }

    const normalized = createInitialFactors();
    FACTOR_TYPES.forEach((type) => {
        const group = loaded[type];
        if (!group || typeof group !== 'object') return;

        normalized[type] = Object.fromEntries(
            Object.entries(group)
                .filter(([, entry]) => entry && typeof entry === 'object')
                .map(([activityId, entry]) => [activityId, {
                    facilitating: entry.facilitating ?? '',
                    hindering: entry.hindering ?? '',
                }]),
        );
    });

    return normalized;
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
            cesRemarks: null,
            isEditing: false,
            isSubmitted: false,
        },
    };
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
                indicatorTargets: updateArrayItemAtIndex(state.indicatorTargets, action.payload.index, (item) => ({
                    ...item,
                    quarterly_target: action.payload.value,
                })),
            };

        case 'SET_ACTION_ITEM':
            return {
                ...state,
                actionItems: updateArrayItemAtIndex(state.actionItems, action.payload.index, (item) => ({
                    ...item,
                    [action.payload.field]: action.payload.value,
                })),
            };

        case 'ADD_ACTION_ITEM':
            return {
                ...state,
                actionItems: appendArrayItem(state.actionItems, { action: '', response_asds: '', response_sds: '' }),
            };

        case 'REMOVE_ACTION_ITEM':
            return {
                ...state,
                actionItems: removeArrayItemAtIndex(state.actionItems, action.payload.index, [{ action: '', response_asds: '', response_sds: '' }]),
            };

        case 'ADD_ACTIVITY': {
            const { items, ui } = appendExpandedArrayItem({
                items: state.activities,
                item: action.payload.activity,
                ui: state.ui,
                extraUi: {
                    isAddingActivity: action.payload.showAddedFlash ?? state.ui.isAddingActivity,
                },
            });

            return {
                ...state,
                activities: items,
                ui,
            };
        }

        case 'UPDATE_ACTIVITY':
            return {
                ...state,
                activities: updateArrayItemById(state.activities, action.payload.id, (activity) => ({
                    ...activity,
                    [action.payload.field]: action.payload.value,
                })),
            };

        case 'REMOVE_ACTIVITY': {
            const activityToRemove = state.activities.find((activity) => activity.id === action.payload.id);
            const nextRemovedActivities = (
                action.payload.moveToRemovedAip
                && activityToRemove?.fromAIP
                && !state.removedAIPActivities.some((activity) => activity.id === action.payload.id)
            )
                ? [...state.removedAIPActivities, activityToRemove]
                : state.removedAIPActivities;
            const nextActivityState = removeExpandedArrayItem({
                items: state.activities,
                id: action.payload.id,
                ui: state.ui,
                fallbackItems: [createEmptyPirActivity()],
            });

            return {
                ...state,
                activities: nextActivityState.items,
                removedAIPActivities: nextRemovedActivities,
                ui: nextActivityState.ui,
            };
        }

        case 'RESTORE_ACTIVITY': {
            const activityToRestore = state.removedAIPActivities.find((activity) => activity.id === action.payload.id);
            if (!activityToRestore) {
                return state;
            }

            const nextActivityState = appendExpandedArrayItem({
                items: state.activities,
                item: activityToRestore,
                ui: state.ui,
            });

            return {
                ...state,
                activities: nextActivityState.items,
                removedAIPActivities: state.removedAIPActivities.filter((activity) => activity.id !== action.payload.id),
                ui: nextActivityState.ui,
            };
        }

        case 'REPLACE_ACTIVITIES_FROM_AIP': {
            const nextActivityState = replaceExpandedArrayItems({
                nextItems: action.payload.activities,
                ui: state.ui,
                fallbackItems: [createEmptyPirActivity()],
            });

            return {
                ...state,
                activities: nextActivityState.items,
                ui: nextActivityState.ui,
            };
        }

        case 'SET_FACTOR':
            return {
                ...state,
                factors: {
                    ...state.factors,
                    [action.payload.type]: {
                        ...state.factors[action.payload.type],
                        [action.payload.activityId]: {
                            ...(state.factors[action.payload.type]?.[action.payload.activityId] ?? {}),
                            [action.payload.category]: action.payload.value,
                        },
                    },
                },
            };

        case 'SET_FACTORS':
            return {
                ...state,
                factors: normalizeFactors(action.payload) ?? state.factors,
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
            const hydratedActivities = replaceExpandedArrayItems({
                nextItems: nextActivities,
                ui: state.ui,
                fallbackItems: [createEmptyPirActivity()],
            });

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
                activities: hydratedActivities.items,
                factors: normalizeFactors(draft.factors) ?? state.factors,
                ui: hydratedActivities.ui,
            };
        }

        case 'HYDRATE_SUBMITTED': {
            const pir = action.payload.pir ?? {};
            const nextActivities = pir.activities?.length ? pir.activities : state.activities;
            const hydratedActivities = replaceExpandedArrayItems({
                nextItems: nextActivities,
                ui: state.ui,
                fallbackItems: [createEmptyPirActivity()],
            });

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
                activities: hydratedActivities.items,
                factors: normalizeFactors(pir.factors) ?? state.factors,
                submission: {
                    ...state.submission,
                    pirId: pir.id ?? null,
                    pirStatus: pir.status ?? null,
                    cesRemarks: pir.cesRemarks ?? null,
                },
                ui: hydratedActivities.ui,
            };
        }

        default:
            return state;
    }
}

export default function usePirFormState(options) {
    return useReducer(pirReducer, options, createInitialPirState);
}
