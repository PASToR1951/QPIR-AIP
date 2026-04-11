import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PageLoader } from '../../components/ui/PageLoader';
import { useFormShellContext } from './formShellContext.jsx';

export default function FormShellLayout({
    loading = false,
    loadingMessage = 'Loading...',
    motionProps,
    splash,
    readonly,
    editor,
    afterAnimate = null,
    rootClassName = 'min-h-screen bg-slate-50 dark:bg-dark-base',
}) {
    const { appMode } = useFormShellContext();

    if (loading) {
        return <PageLoader message={loadingMessage} />;
    }

    return (
        <div className={rootClassName}>
            <AnimatePresence mode="wait">
                {appMode === 'splash' ? (
                    <motion.div key="splash" {...motionProps}>
                        {splash}
                    </motion.div>
                ) : appMode === 'readonly' ? (
                    <motion.div key="readonly" {...motionProps}>
                        {readonly}
                    </motion.div>
                ) : (
                    <motion.div key="form" {...motionProps}>
                        {editor}
                    </motion.div>
                )}
            </AnimatePresence>
            {afterAnimate}
        </div>
    );
}
