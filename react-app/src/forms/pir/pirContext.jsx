import React, { createContext, useContext } from 'react';

const PirStateContext = createContext(null);
const PirDispatchContext = createContext(null);

export function PirProvider({ state, dispatch, children }) {
    return (
        <PirStateContext.Provider value={state}>
            <PirDispatchContext.Provider value={dispatch}>
                {children}
            </PirDispatchContext.Provider>
        </PirStateContext.Provider>
    );
}

export function usePirState() {
    const value = useContext(PirStateContext);
    if (!value) {
        throw new Error('usePirState must be used within a PirProvider.');
    }
    return value;
}

export function usePirDispatch() {
    const value = useContext(PirDispatchContext);
    if (!value) {
        throw new Error('usePirDispatch must be used within a PirProvider.');
    }
    return value;
}

export function usePirSelector(selector) {
    return selector(usePirState());
}

export const selectProfile = (state) => state.profile;
export const selectBudget = (state) => state.budget;
export const selectIndicatorTargets = (state) => state.indicatorTargets;
export const selectActivities = (state) => state.activities;
export const selectRemovedAipActivities = (state) => state.removedAIPActivities;
export const selectFactors = (state) => state.factors;
export const selectActionItems = (state) => state.actionItems;
export const selectPirUi = (state) => state.ui;
export const selectPirSubmission = (state) => state.submission;

