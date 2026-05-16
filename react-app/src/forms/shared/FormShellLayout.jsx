import React from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { PageLoader } from '../../components/ui/PageLoader';
import { AnnouncementBanner } from '../../components/ui/AnnouncementBanner';
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
            <AnnouncementBanner />
            <AnimatePresence mode="wait">
                {appMode === 'splash' ? (
                    <Motion.div key="splash" {...motionProps}>
                        {splash}
                    </Motion.div>
                ) : appMode === 'readonly' ? (
                    <Motion.div key="readonly" {...motionProps}>
                        {readonly}
                    </Motion.div>
                ) : (
                    <Motion.div key="form" {...motionProps}>
                        {editor}
                    </Motion.div>
                )}
            </AnimatePresence>
            {afterAnimate}
        </div>
    );
}
