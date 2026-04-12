export const OUTCOME_OPTIONS = [
    "Outcome 1: High Performing Teachers",
    "Outcome 2: Learners' Physical and Mental Well-Being Protected",
    "Outcome 3: Efficient and Supportive Governance Structure",
    "Outcome 4: Improved Education Quality through Upgraded Curriculum, Modernized Assessment, and Digitally Enabled Schools",
    "Outcome 5: Empowered Graduates fit for Employment, Entrepreneurship or Higher Education",
];

export const OUTCOME_TARGETS = {
    "Outcome 1: High Performing Teachers": [
        { code: "O.1.1", description: "Percentage of public school teachers who completed training on content and pedagogy" },
        { code: "O.1.2", description: "Number of public school teachers who completed: Certificate Programs" },
        { code: "O.1.3", description: "Number of public school teachers who completed: Scholarship Programs" },
        { code: "O.1.4", description: "Percentage of learners with complete set of textbooks: Elementary" },
        { code: "O.1.5", description: "Percentage of learners with complete set of textbooks: Junior High School" },
        { code: "O.1.6", description: "Percentage of learners with complete set of textbooks: Senior High School" },
        { code: "O.1.7", description: "Percentage of public school teachers provided with a laptop" },
        { code: "O.1.8", description: "Percentage of public schools meeting the minimum standard for teacher to student ratio" },
        { code: "O.1.9", description: "Percentage of public schools with at least one Administrative Officer" },
    ],
    "Outcome 2: Learners' Physical and Mental Well-Being Protected": [
        { code: "O.2.1", description: "Percentage of school-age children in school - Net Enrollment Rate in Kindergarten" },
        { code: "O.2.2", description: "Percentage of school-age children in school - Net Enrollment Rate in Elementary" },
        { code: "O.2.3", description: "Percentage of school-age children in school - Net Enrollment Rate in Junior High School (JHS)" },
        { code: "O.2.4", description: "Percentage of school-age children in school - Net Enrollment Rate in Senior High School (SHS)" },
        { code: "O.2.5", description: "Percentage of learners who completed Grade 6 Completion Rate: Elementary" },
        { code: "O.2.6", description: "Percentage of learners who completed Grade 10 Completion Rate: JHS" },
        { code: "O.2.7", description: "Percentage of learners who completed Grade 12 - Completion Rate: SHS" },
        { code: "O.2.8", description: "Percentage of severely wasted and wasted learners in public elementary schools provided with meals through School-based Feeding Program" },
        { code: "O.2.9", description: "Percentage of resolved bullying incidents" },
        { code: "O.2.10", description: "Percentage of public schools with a functional child protection committee" },
        { code: "O.2.11", description: "Percentage of public schools with a functional school governing council" },
        { code: "O.2.12", description: "Percentage of public schools with a guidance advocate" },
        { code: "O.2.13", description: "Percentage of schools with a guidance office" },
        { code: "O.2.14", description: "Percentage of schools with a health clinic" },
        { code: "O.2.15", description: "Percentage of public schools with ideal classroom to student ratio" },
        { code: "O.2.16", description: "Percentage of public schools with electricity" },
        { code: "O.2.17", description: "Percentage of public schools with libraries" },
        { code: "O.2.18", description: "Percentage of public schools with faculty rooms" },
    ],
    "Outcome 3: Efficient and Supportive Governance Structure": [
        { code: "O.3.1", description: "Percentage of Schools Division Offices conferred with Level 3 PRIME-HRM accreditation" },
        { code: "O.3.2", description: "Number of schools provided with innovation funds" },
        { code: "O.3.3", description: "Number of public schools provided with school grants (innovation funds for schools)" },
        { code: "O.3.4", description: "Percentage of public schools provided with research funds" },
    ],
    "Outcome 4: Improved Education Quality through Upgraded Curriculum, Modernized Assessment, and Digitally Enabled Schools": [
        { code: "O.4.1", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - English increased (Grade 3)" },
        { code: "O.4.2", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - English increased (Grade 6)" },
        { code: "O.4.3", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - English increased (Grade 10)" },
        { code: "O.4.4", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - English increased (Grade 12)" },
        { code: "O.4.5", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - Mathematics increased (Grade 3)" },
        { code: "O.4.6", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - Mathematics increased (Grade 6)" },
        { code: "O.4.7", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - Mathematics increased (Grade 10)" },
        { code: "O.4.8", description: "Percentage of learners achieving at least \"Proficient\" in the National Achievement Test (NAT) - Mathematics increased (Grade 12)" },
    ],
    "Outcome 5: Empowered Graduates fit for Employment, Entrepreneurship or Higher Education": [
        { code: "O.5.1", description: "Percentage of passers in the National Certification (NC) assessments" },
        { code: "O.5.2", description: "Percentage of passers in the Alternative Learning System Accreditation and Equivalency (A & E) Test" },
    ],
};

export function getTargetsForOutcome(outcome) {
    return OUTCOME_TARGETS[outcome] ?? [];
}

export function getTargetOptionsForOutcome(outcome) {
    return getTargetsForOutcome(outcome).map((target) => ({
        value: target.description,
        label: `${target.code} - ${target.description}`,
    }));
}

export function findTargetByDescription(outcome, description) {
    return getTargetsForOutcome(outcome).find((target) => target.description === description) ?? null;
}
