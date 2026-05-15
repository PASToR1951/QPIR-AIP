import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../lib/api.js';
import { createEmptyPirActivity } from './usePirFormState.js';
import { activityOverlapsPeriod } from '../../lib/periods.js';

export default function usePirAipActivities({
    program,
    programId,
    quarterString,
    currentQuarterNum,
    periodType = 'quarter',
    periodRange = null,
    isDivisionPersonnel,
    user,
    onActivitiesLoaded,
    onIndicatorsLoaded,
    onOwnerLoaded,
}) {
    const [isLoading, setIsLoading] = useState(false);
    const preserveDraftIndicatorsRef = useRef(false);
    const preserveActivityReviewsRef = useRef(false);

    const markDraftIndicatorsHydrated = useCallback(() => {
        preserveDraftIndicatorsRef.current = true;
    }, []);

    const markActivityReviewsHydrated = useCallback(() => {
        preserveActivityReviewsRef.current = true;
    }, []);

    useEffect(() => {
        if (!program) {
            return undefined;
        }

        const schoolId = isDivisionPersonnel ? null : (user?.school_id || null);
        if (!isDivisionPersonnel && !schoolId) {
            return undefined;
        }

        const yearMatch = quarterString.match(/CY (\d{4})/);
        const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
        let isActive = true;

        const fetchAipActivities = async () => {
            setIsLoading(true);
            try {
                const params = isDivisionPersonnel
                    ? { user_id: user?.id, program_title: program, year, ...(programId ? { program_id: programId } : {}) }
                    : { school_id: schoolId, program_title: program, year, ...(programId ? { program_id: programId } : {}) };

                const response = await api.get('/api/aips/activities', { params });
                if (!isActive) {
                    return;
                }

                const aipActivities = response.data.activities ?? [];
                if (aipActivities.length > 0) {
                    if (preserveActivityReviewsRef.current) {
                        preserveActivityReviewsRef.current = false;
                    } else {
                        const relevantActivities = aipActivities.filter((activity) => (
                            activity.period_start_month && activity.period_end_month
                                ? activityOverlapsPeriod(
                                    activity.period_start_month,
                                    activity.period_end_month,
                                    currentQuarterNum,
                                    periodType,
                                    periodRange,
                                )
                                : true
                        ));

                        onActivitiesLoaded?.(
                            relevantActivities.map((activity) => createEmptyPirActivity({
                                id: `aip:${activity.id}`,
                                name: activity.activity_name,
                                implementation_period: activity.implementation_period,
                                period_start_month: activity.period_start_month ?? null,
                                period_end_month: activity.period_end_month ?? null,
                                aip_activity_id: activity.id,
                                fromAIP: true,
                                isUnplanned: false,
                                movsExpectedOutputs: activity.outputs ?? '',
                                finTarget: String(activity.budget_amount ?? ''),
                            })),
                        );
                    }
                }

                if (response.data.indicators?.length) {
                    if (preserveDraftIndicatorsRef.current) {
                        preserveDraftIndicatorsRef.current = false;
                    } else {
                        onIndicatorsLoaded?.(response.data.indicators.map((indicator) => ({
                            description: indicator.description,
                            annual_target: String(indicator.target ?? ''),
                            quarterly_target: '',
                        })));
                    }
                }

                if (response.data.project_coordinator) {
                    onOwnerLoaded?.(response.data.project_coordinator);
                }
            } catch {
                // Keep manual entry mode when no AIP is available.
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        fetchAipActivities();

        return () => {
            isActive = false;
        };
    }, [
        currentQuarterNum,
        isDivisionPersonnel,
        onActivitiesLoaded,
        onIndicatorsLoaded,
        onOwnerLoaded,
        periodRange,
        periodRange?.end,
        periodRange?.start,
        periodType,
        program,
        programId,
        quarterString,
        user?.id,
        user?.school_id,
    ]);

    return {
        isLoading,
        markDraftIndicatorsHydrated,
        markActivityReviewsHydrated,
    };
}
