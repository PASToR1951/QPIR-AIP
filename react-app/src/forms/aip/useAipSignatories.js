import { useEffect } from 'react';

/**
 * Auto-fills signatory fields from the logged-in user and program data.
 * Runs four independent effects, each guarded so they only fire once.
 */
export function useAipSignatories({
    user, state, dispatch,
    isDivisionPersonnel, isSchoolUser,
    notedBy,
    rawPrograms, profile,
}) {
    // Auto-fill "Project Coordinator" from the logged-in user
    useEffect(() => {
        if (!user || profile.projectCoord) return;
        const baseName = user.name || [
            user.first_name,
            user.middle_initial ? `${user.middle_initial}.` : null,
            user.last_name,
        ].filter(Boolean).join(' ').trim();
        const fullName = (user.salutation ? `${user.salutation} ${baseName}` : baseName).trim();
        if (fullName) {
            dispatch({ type: 'SET_PROFILE_FIELD', payload: { field: 'projectCoord', value: fullName } });
        }
    }, [user, profile.projectCoord, dispatch]);

    // Auto-fill "Prepared by" name from the logged-in user (salutation + name + M.I.)
    useEffect(() => {
        if (!user || state.signatories.preparedByName) return;
        const baseName = user.name || [
            user.first_name,
            user.middle_initial ? `${user.middle_initial}.` : null,
            user.last_name,
        ].filter(Boolean).join(' ').trim();
        const fullName = (user.salutation ? `${user.salutation} ${baseName}` : baseName).trim();
        if (fullName) {
            dispatch({ type: 'SET_SIGNATORY', payload: { field: 'preparedByName', value: fullName } });
        }
    }, [user, state.signatories.preparedByName, dispatch]);

    // Auto-fill "Prepared by" title from the user's position — separate effect so the
    // name guard above doesn't block this from running after the name is already set
    useEffect(() => {
        if (!user?.position || state.signatories.preparedByTitle) return;
        dispatch({ type: 'SET_SIGNATORY', payload: { field: 'preparedByTitle', value: user.position } });
    }, [user, state.signatories.preparedByTitle, dispatch]);

    // Auto-fill "Approved by" from the selected program's division chief
    useEffect(() => {
        if (state.signatories.approvedByName) return;
        if ((isDivisionPersonnel || isSchoolUser) && notedBy) {
            const selectedProgram = rawPrograms.find(p => p.title === profile.depedProgram);
            const division = selectedProgram?.division;
            const chief = division ? notedBy[division] : null;
            if (chief?.name) {
                dispatch({ type: 'SET_SIGNATORY', payload: { field: 'approvedByName', value: chief.name } });
                if (chief.title) {
                    dispatch({ type: 'SET_SIGNATORY', payload: { field: 'approvedByTitle', value: chief.title } });
                }
            }
        }
    }, [isDivisionPersonnel, isSchoolUser, notedBy, rawPrograms, profile.depedProgram, state.signatories.approvedByName, dispatch]);
}
