import createFormProvider from '../shared/createFormProvider.js';

const {
    Provider: PirProvider,
    useState: usePirState,
    useDispatch: usePirDispatch,
    useSelector: usePirSelector,
} = createFormProvider({ name: 'Pir' });

export { PirProvider, usePirState, usePirDispatch, usePirSelector };

export const selectProfile = (state) => state.profile;
export const selectBudget = (state) => state.budget;
export const selectIndicatorTargets = (state) => state.indicatorTargets;
export const selectActivities = (state) => state.activities;
export const selectRemovedAipActivities = (state) => state.removedAIPActivities;
export const selectFactors = (state) => state.factors;
export const selectActionItems = (state) => state.actionItems;
export const selectPirUi = (state) => state.ui;
export const selectPirSubmission = (state) => state.submission;
