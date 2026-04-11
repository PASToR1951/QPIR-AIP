export function buildAipPayload(state) {
    return {
        program_title: state.profile.depedProgram,
        year: parseInt(state.profile.year, 10),
        outcome: state.profile.outcome,
        sip_title: state.profile.sipTitle,
        project_coordinator: state.profile.projectCoord,
        objectives: state.objectives.filter((objective) => objective.trim() !== ''),
        indicators: state.indicators.filter((indicator) => indicator.description.trim() !== ''),
        prepared_by_name: state.signatories.preparedByName,
        prepared_by_title: state.signatories.preparedByTitle,
        approved_by_name: state.signatories.approvedByName,
        approved_by_title: state.signatories.approvedByTitle,
        activities: state.activities.filter((activity) => activity.name.trim() !== ''),
    };
}

export function buildAipLocalSnapshot(state) {
    return {
        outcome: state.profile.outcome,
        depedProgram: state.profile.depedProgram,
        sipTitle: state.profile.sipTitle,
        projectCoord: state.profile.projectCoord,
        objectives: state.objectives.filter((objective) => objective.trim() !== ''),
        indicators: state.indicators.filter((indicator) => indicator.description.trim() !== ''),
        activities: state.activities,
        preparedByName: state.signatories.preparedByName,
        preparedByTitle: state.signatories.preparedByTitle,
        approvedByName: state.signatories.approvedByName,
        approvedByTitle: state.signatories.approvedByTitle,
        year: state.profile.year,
    };
}

