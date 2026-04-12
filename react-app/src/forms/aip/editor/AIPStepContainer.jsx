import React from 'react';

function normalizeSteps(steps) {
    return Array.isArray(steps) ? steps : [steps];
}

export default React.memo(function AIPStepContainer({
    appMode,
    currentStep,
    steps,
    animated = true,
    keepMounted = true,
    className = '',
    children,
}) {
    const visible = appMode === 'full' || normalizeSteps(steps).includes(currentStep);

    if (!visible && !keepMounted) {
        return null;
    }

    const visibilityClassName = visible ? 'block' : 'hidden';
    const animationClassName = animated && visible ? 'animate-in fade-in slide-in-from-bottom-4 duration-200' : '';
    const spacingClassName = appMode === 'full' ? 'mb-16' : '';

    return (
        <div className={`${visibilityClassName} ${animationClassName} ${spacingClassName} ${className}`.trim()}>
            {children}
        </div>
    );
});
