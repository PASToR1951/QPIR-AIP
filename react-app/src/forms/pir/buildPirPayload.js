import { FACTOR_TYPES } from './usePirFormState.js';

export function buildPirPayload(state, { isDivisionPersonnel, quarterString }) {
    return {
        program_title: state.profile.program,
        quarter: quarterString,
        program_owner: state.profile.owner,
        budget_from_division: parseFloat(state.budget.fromDivision) || 0,
        budget_from_co_psf: parseFloat(state.budget.fromCoPSF) || 0,
        functional_division: isDivisionPersonnel ? state.profile.functionalDivision : null,
        indicator_quarterly_targets: state.indicatorTargets,
        action_items: state.actionItems.filter((item) => item.action?.trim()),
        activity_reviews: state.activities.map((activity) => ({
            aip_activity_id: activity.fromAIP ? activity.aip_activity_id : null,
            complied: activity.complied,
            actual_tasks_conducted: activity.actualTasksConducted,
            contributory_performance_indicators: activity.contributoryIndicators,
            movs_expected_outputs: activity.movsExpectedOutputs,
            adjustments: activity.adjustments,
            is_unplanned: activity.isUnplanned,
            physTarget: activity.physTarget,
            finTarget: activity.finTarget,
            physAcc: activity.physAcc,
            finAcc: activity.finAcc,
            actions: activity.actions,
        })),
        factors: Object.fromEntries(
            FACTOR_TYPES.map((type) => [type, {
                facilitating: state.factors[type]?.facilitating ?? '',
                hindering: state.factors[type]?.hindering ?? '',
                recommendations: state.factors[type]?.recommendations ?? '',
            }]),
        ),
    };
}

export function buildPirLocalSnapshot(state, { quarterString }) {
    return {
        program: state.profile.program,
        quarter: quarterString,
        school: state.profile.school,
        owner: state.profile.owner,
        budgetFromDivision: state.budget.fromDivision,
        budgetFromCoPSF: state.budget.fromCoPSF,
        functionalDivision: state.profile.functionalDivision,
        indicatorQuarterlyTargets: state.indicatorTargets,
        actionItems: state.actionItems,
        activities: state.activities,
        factors: state.factors,
    };
}

