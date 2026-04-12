import React from 'react';
import { PencilSimple } from '@phosphor-icons/react';
import SectionHeader from '../../../components/ui/SectionHeader';
import SignatureBlock from '../../../components/ui/SignatureBlock';
import { AIP_SIGNATURE_FIELDS } from './aipEditorConfig.js';

export default React.memo(function AIPSignaturesSection({
    appMode,
    signatories,
    onSignatoryChange,
}) {
    return (
        <>
            <SectionHeader
                icon={<PencilSimple size={20} weight="bold" />}
                title="Signatures"
                subtitle="Finalize with necessary approvals."
                theme="pink"
                appMode={appMode}
            />

            <div className="relative mb-2 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface sm:p-8 md:rounded-3xl md:p-12">
                <svg
                    className="absolute inset-0 h-full w-full stroke-slate-300 opacity-20 dark:stroke-dark-border dark:opacity-40"
                    style={{ maskImage: 'linear-gradient(to bottom, transparent, black 30%)' }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="aip-signature-lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="20" strokeWidth="2"></line>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#aip-signature-lines)"></rect>
                </svg>

                <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-24">
                    {AIP_SIGNATURE_FIELDS.map((signatureField) => (
                        <SignatureBlock
                            key={signatureField.key}
                            label={signatureField.label}
                            name={signatories[signatureField.nameField]}
                            title={signatories[signatureField.titleField]}
                            onNameChange={(value) => onSignatoryChange(signatureField.nameField, value)}
                            onTitleChange={(value) => onSignatoryChange(signatureField.titleField, value)}
                            namePlaceholder={signatureField.namePlaceholder}
                            titlePlaceholder={signatureField.titlePlaceholder}
                            theme="pink"
                        />
                    ))}
                </div>
            </div>
        </>
    );
});
