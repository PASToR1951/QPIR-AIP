export const AIP_WIZARD_STEPS = [
    { num: 1, label: 'Alignment' },
    { num: 2, label: 'Targets' },
    { num: 3, label: 'Action Plan' },
    { num: 4, label: 'M&E' },
    { num: 5, label: 'Signatures' },
    { num: 6, label: 'Finalize' },
];

export const AIP_TOTAL_STEPS = AIP_WIZARD_STEPS.length;

export const AIP_SIGNATURE_FIELDS = [
    {
        key: 'prepared',
        label: 'Prepared by',
        nameField: 'preparedByName',
        titleField: 'preparedByTitle',
        namePlaceholder: 'FULL NAME',
        titlePlaceholder: 'Title / Position',
    },
    {
        key: 'approved',
        label: 'Approved',
        nameField: 'approvedByName',
        titleField: 'approvedByTitle',
        namePlaceholder: 'FULL NAME',
        titlePlaceholder: 'Title / Position',
    },
];
