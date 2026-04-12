import React, { Suspense, lazy } from 'react';

const LazyAipDocument = lazy(() => (
    import('../../../components/docs/AIPDocument.jsx').then((module) => ({ default: module.AIPDocument }))
));

function PreviewFallback() {
    return (
        <div className="px-6 py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading preview...
        </div>
    );
}

export default React.memo(function AIPDocumentPreview({ aipData }) {
    if (!aipData) {
        return null;
    }

    return (
        <Suspense fallback={<PreviewFallback />}>
            <LazyAipDocument {...aipData} />
        </Suspense>
    );
});
