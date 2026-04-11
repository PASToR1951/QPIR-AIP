import React, { createContext, useContext } from 'react';

const FormShellContext = createContext(null);

export function FormShellProvider({ value, children }) {
    return (
        <FormShellContext.Provider value={value}>
            {children}
        </FormShellContext.Provider>
    );
}

export function useFormShellContext() {
    const value = useContext(FormShellContext);
    if (!value) {
        throw new Error('useFormShellContext must be used within a FormShellProvider.');
    }
    return value;
}

