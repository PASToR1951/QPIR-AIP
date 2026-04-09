const TOUR_VERSION = 'v1';

const CONTACT_EMAIL = 'guihulngan.city@deped.gov.ph';

function withStorage(config) {
  return {
    ...config,
    storageKey: `help:toursSeen:${config.id}:${TOUR_VERSION}`,
    contactEmail: CONTACT_EMAIL,
    contactHref: `mailto:${CONTACT_EMAIL}`,
  };
}

export const portalHelpConfig = {
  userDashboard: withStorage({
    id: 'user-dashboard',
    title: 'Dashboard Help',
    docsHref: '/getting-started#4-dashboard-overview',
    autoStart: true,
    steps: [
      {
        target: 'dashboard-action-prompt',
        title: 'Start here',
        description: 'This message tells you the next step you should take right now.',
        placement: 'bottom',
      },
      {
        target: 'dashboard-aip-card',
        title: 'AIP - Annual Plan',
        description: 'Open this card to create or continue your annual plan.',
        placement: 'bottom',
      },
      {
        target: 'dashboard-pir-card',
        title: 'PIR - Quarterly Report',
        description: 'This card opens after your AIP is submitted and ready for quarterly reporting.',
        placement: 'top',
      },
      {
        target: 'dashboard-submission-history',
        title: 'Submission history',
        description: 'Review your submitted AIPs and PIRs here any time.',
        placement: 'top',
      },
    ],
  }),
  aip: withStorage({
    id: 'aip',
    title: 'AIP Help',
    docsHref: '/getting-started#6-what-to-do-first',
    autoStart: false,
    steps: [
      {
        target: 'form-program-selector',
        title: 'Choose your program',
        description: 'Start by picking the DepEd program you are preparing an AIP for.',
        placement: 'bottom',
      },
      {
        target: 'form-autosave',
        title: 'Draft saving',
        description: 'Use Save Draft or watch the save status here while you work.',
        placement: 'bottom',
      },
      {
        target: 'form-step-nav',
        title: 'Move step by step',
        description: 'Use these controls to move through the wizard one section at a time.',
        placement: 'top',
      },
      {
        target: 'form-review-submit',
        title: 'Review before submit',
        description: 'Use this area to preview your plan and submit it when you are ready.',
        placement: 'top',
      },
    ],
  }),
  pir: withStorage({
    id: 'pir',
    title: 'PIR Help',
    docsHref: '/getting-started#6-what-to-do-first',
    autoStart: false,
    steps: [
      {
        target: 'form-program-selector',
        title: 'Choose your program',
        description: 'Pick a program with a submitted AIP before starting your quarterly report.',
        placement: 'bottom',
      },
      {
        target: 'form-autosave',
        title: 'Draft saving',
        description: 'Your save status appears here while you complete the report.',
        placement: 'bottom',
      },
      {
        target: 'form-step-nav',
        title: 'Move through the report',
        description: 'Use these controls to complete each PIR section in order.',
        placement: 'top',
      },
      {
        target: 'form-review-submit',
        title: 'Preview and submit',
        description: 'Preview your report here, then submit it for review.',
        placement: 'top',
      },
    ],
  }),
  cesDashboard: withStorage({
    id: 'ces-dashboard',
    title: 'CES Help',
    docsHref: '/getting-started#6-what-to-do-first',
    autoStart: true,
    steps: [
      {
        target: 'ces-filters',
        title: 'Filter the queue',
        description: 'Use these filters to narrow the PIRs waiting for your review.',
        placement: 'bottom',
      },
      {
        target: 'ces-queue',
        title: 'Review queue',
        description: 'Open a PIR from this list to review, note, or return it.',
        placement: 'top',
      },
    ],
  }),
  cesReview: withStorage({
    id: 'ces-review',
    title: 'CES Review Help',
    docsHref: '/getting-started#6-what-to-do-first',
    autoStart: false,
    steps: [
      {
        target: 'ces-review-actions',
        title: 'Finish your review',
        description: 'Use these actions to note the PIR forward or return it with remarks.',
        placement: 'bottom',
      },
      {
        target: 'ces-review-content',
        title: 'Read the report',
        description: 'This page shows the full PIR details you need before taking action.',
        placement: 'top',
      },
    ],
  }),
  clusterHead: withStorage({
    id: 'cluster-head',
    title: 'Cluster Head Help',
    docsHref: '/getting-started#6-what-to-do-first',
    autoStart: true,
    steps: [
      {
        target: 'cluster-filters',
        title: 'Filter the queue',
        description: 'Use these filters to narrow the school PIRs waiting for your review.',
        placement: 'bottom',
      },
      {
        target: 'cluster-queue',
        title: 'School PIR queue',
        description: 'Review each school PIR from this queue and open the right actions.',
        placement: 'top',
      },
    ],
  }),
  adminDashboard: withStorage({
    id: 'admin-dashboard',
    title: 'Admin Help',
    docsHref: '/getting-started#3-understanding-your-role',
    autoStart: true,
    steps: [
      {
        target: 'admin-sidebar',
        title: 'Admin navigation',
        description: 'Use the sidebar to move between dashboard, submissions, users, schools, reports, and settings.',
        placement: 'right',
      },
      {
        target: 'admin-notifications',
        title: 'Notifications',
        description: 'Important submission and workflow updates appear here.',
        placement: 'bottom',
      },
      {
        target: 'admin-overview',
        title: 'Overview dashboard',
        description: 'This overview summarizes the current system status and activity.',
        placement: 'bottom',
      },
      {
        target: 'admin-workspace',
        title: 'Main workspace',
        description: 'This area changes with each admin page you open.',
        placement: 'top',
      },
    ],
  }),
};

export function getPortalHelp(pathname) {
  if (pathname === '/') return portalHelpConfig.userDashboard;
  if (pathname === '/aip') return portalHelpConfig.aip;
  if (pathname === '/pir') return portalHelpConfig.pir;
  if (pathname === '/ces') return portalHelpConfig.cesDashboard;
  if (pathname.startsWith('/ces/pirs/')) return portalHelpConfig.cesReview;
  if (pathname.startsWith('/cluster-head')) return portalHelpConfig.clusterHead;
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin') return portalHelpConfig.adminDashboard;
    return { ...portalHelpConfig.adminDashboard, autoStart: false };
  }
  return null;
}
