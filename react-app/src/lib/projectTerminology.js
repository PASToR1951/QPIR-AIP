export function getProjectTerminology(usesSchoolTerminology = true) {
    if (usesSchoolTerminology) {
        return {
            projectTitleLabel: 'School Improvement Project / Title',
            projectTitleShortLabel: 'SIP Title',
            projectTitlePlaceholder: 'Enter SIP Title...',
            projectTitleValidationMessage: 'Please enter a SIP Title.',
            projectTitleDocumentLabel: 'School Improvement Project/Title:',
            projectTitlePdfLabel: 'SCHOOL IMPROVEMENT PROJECT/TITLE:',
            aipReferenceLabel: 'SIP/AIP',
        };
    }

    return {
        projectTitleLabel: 'Program Improvement Project / Title',
        projectTitleShortLabel: 'PIP Title',
        projectTitlePlaceholder: 'Enter PIP Title...',
        projectTitleValidationMessage: 'Please enter a PIP Title.',
        projectTitleDocumentLabel: 'Program Improvement Project/Title:',
        projectTitlePdfLabel: 'PROGRAM IMPROVEMENT PROJECT/TITLE:',
        aipReferenceLabel: 'PIP/AIP',
    };
}
