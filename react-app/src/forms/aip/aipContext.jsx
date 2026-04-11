import React, { createContext, useContext } from 'react';

const AipStateContext = createContext(null);
const AipDispatchContext = createContext(null);

export function AipProvider({ state, dispatch, children }) {
    return (
        <AipStateContext.Provider value={state}>
            <AipDispatchContext.Provider value={dispatch}>
                {children}
            </AipDispatchContext.Provider>
        </AipStateContext.Provider>
    );
}

export function useAipState() {
    const value = useContext(AipStateContext);
    if (!value) {
        throw new Error('useAipState must be used within an AipProvider.');
    }
    return value;
}

export function useAipDispatch() {
    const value = useContext(AipDispatchContext);
    if (!value) {
        throw new Error('useAipDispatch must be used within an AipProvider.');
    }
    return value;
}

export function useAipSelector(selector) {
    return selector(useAipState());
}

export const selectAipProfile = (state) => state.profile;
export const selectAipObjectives = (state) => state.objectives;
export const selectAipIndicators = (state) => state.indicators;
export const selectAipActivities = (state) => state.activities;
export const selectAipSignatories = (state) => state.signatories;
export const selectAipSuggestions = (state) => state.suggestions;
export const selectAipUi = (state) => state.ui;
export const selectAipSubmission = (state) => state.submission;

