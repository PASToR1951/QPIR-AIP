import createFormProvider from '../shared/createFormProvider.js';

const {
    Provider: AipProvider,
    useState: useAipState,
    useDispatch: useAipDispatch,
    useSelector: useAipSelector,
} = createFormProvider({ name: 'Aip' });

export { AipProvider, useAipState, useAipDispatch, useAipSelector };

export const selectAipProfile = (state) => state.profile;
export const selectAipObjectives = (state) => state.objectives;
export const selectAipIndicators = (state) => state.indicators;
export const selectAipActivities = (state) => state.activities;
export const selectAipSignatories = (state) => state.signatories;
export const selectAipSuggestions = (state) => state.suggestions;
export const selectAipUi = (state) => state.ui;
export const selectAipSubmission = (state) => state.submission;
