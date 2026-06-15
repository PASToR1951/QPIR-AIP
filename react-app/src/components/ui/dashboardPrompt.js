import { getPeriodYear, periodNoun, periodPrefix } from '../../lib/periods.js';

export function calculateDaysLeft(isoDate) {
    if (!isoDate) return null;
    const deadline = new Date(isoDate);
    const now = new Date();
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getActionPrompt(data, aipStatus = 'none') {
    if (!data) return '';
    const { aipCompletion, pirSubmitted, currentQuarter } = data;
    const currentPeriod = data.currentPeriodLabel || `${periodPrefix(data.period_type)}${currentQuarter}`;
    const currentPeriodShort = `${periodPrefix(data.period_type)}${currentQuarter}`;
    const noun = periodNoun(data.period_type);
    const reportingYear = getPeriodYear(data.currentPeriodLabel, data.period_type === 'trimester' ? 'School' : 'Division Personnel');
    const daysLeft = calculateDaysLeft(data.deadline);

    if (aipCompletion.completed === 0) {
        return aipStatus === 'draft'
            ? `Continue your AIP - Annual Plan for FY ${reportingYear}.`
            : `Start by submitting your AIP - Annual Plan for FY ${reportingYear}.`;
    }
    if (pirSubmitted.total > 0 && pirSubmitted.submitted < pirSubmitted.total) {
        return data.deadline
            ? `Your ${currentPeriodShort} PIR report is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`
            : `${currentPeriod} PIR window is not configured yet.`;
    }
    if (pirSubmitted.total === 0 && aipCompletion.completed > 0) {
        const periodCount = data.period_type === 'trimester' ? 3 : 4;
        return `No activities are scheduled for ${currentPeriodShort}. ${currentQuarter < periodCount ? `Your next report opens in ${periodPrefix(data.period_type)}${currentQuarter + 1}.` : `All ${noun}s are complete.`}`;
    }
    if (pirSubmitted.submitted >= pirSubmitted.total && aipCompletion.completed >= aipCompletion.total) {
        const periodCount = data.period_type === 'trimester' ? 3 : 4;
        return `You are on track for ${currentPeriodShort}. ${currentQuarter < periodCount ? `Your next report opens in ${periodPrefix(data.period_type)}${currentQuarter + 1}.` : 'Great work this year.'}`;
    }
    return `You are managing the planning and reporting cycle for FY ${reportingYear}.`;
}
