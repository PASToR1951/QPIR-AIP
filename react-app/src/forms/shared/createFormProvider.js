import React, { createContext, useContext } from 'react';

export default function createFormProvider({
    name,
}) {
    const StateContext = createContext(null);
    const DispatchContext = createContext(null);

    function Provider({ state, dispatch, children }) {
        return React.createElement(
            StateContext.Provider,
            { value: state },
            React.createElement(
                DispatchContext.Provider,
                { value: dispatch },
                children,
            ),
        );
    }

    function useStateValue() {
        const value = useContext(StateContext);
        if (value === null) {
            throw new Error(`use${name}State must be used within a ${name}Provider.`);
        }
        return value;
    }

    function useDispatchValue() {
        const value = useContext(DispatchContext);
        if (value === null) {
            throw new Error(`use${name}Dispatch must be used within a ${name}Provider.`);
        }
        return value;
    }

    function useSelector(selector) {
        return selector(useStateValue());
    }

    return {
        Provider,
        useState: useStateValue,
        useDispatch: useDispatchValue,
        useSelector,
    };
}
