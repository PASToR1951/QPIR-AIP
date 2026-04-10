import React from 'react';
import {
  Flag,
  Clipboard,
  ClockCounterClockwise,
  ListChecks,
  SquaresFour,
  CheckCircle,
  Layout,
  Eye,
  Funnel,
  FileText,
  BookOpen,
  UserList,
  Bell,
  Gear,
} from '@phosphor-icons/react';

const TOUR_VERSION = 'v1';

const CONTACT_EMAIL = 'guihulngan.city@deped.gov.ph';

function createTourIcon(Icon) {
  return React.createElement(Icon, { size: 20, weight: 'fill' });
}

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
    autoStart: false,
    steps: [
      {
        target: 'dashboard-aip-card',
        title: 'AIP — Annual Plan',
        description:
          'Your Annual Implementation Plan lives here. Open this card to start planning for your DepEd program — it walks you through each section step by step.',
        placement: 'bottom',
        icon: createTourIcon(Clipboard),
      },
      {
        target: 'dashboard-pir-card',
        title: 'PIR — Quarterly Report',
        description:
          'Once your AIP is approved, this card activates. Submit your Program Implementation Report here every quarter to track your progress.',
        placement: 'top',
        icon: createTourIcon(ClockCounterClockwise),
      },
      {
        target: 'dashboard-action-prompt',
        title: 'Your action prompt',
        description:
          'This banner updates as you move through the process — it tells you exactly what to do next. Follow it and you will never get lost.',
        placement: 'bottom',
        missingTargetHint:
          'The dashboard is still loading. Give it a moment — the tour will continue automatically once it appears.',
        icon: createTourIcon(Flag),
      },
      {
        target: 'dashboard-submission-history',
        title: 'Your submission history',
        description:
          'Every AIP and PIR you have ever submitted appears here. Download, review, or track the review status of any past submission at any time.',
        placement: 'top',
        icon: createTourIcon(ListChecks),
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
        description:
          'Select the DepEd program you are preparing an AIP for. Each program gets its own plan — start here before filling in any details.',
        placement: 'bottom',
        missingTargetHint:
          'If you are already inside a form, this step no longer applies. You can skip it and continue the tour from the editor.',
        icon: createTourIcon(SquaresFour),
      },
      {
        target: 'form-autosave',
        title: 'Auto-save is on',
        description:
          'Your progress is saved automatically as you type. This status indicator shows when your last draft was saved — no need to click Save manually.',
        placement: 'bottom',
        missingTargetHint:
          'Choose a program and select a form view first. This header appears as soon as the AIP editor opens.',
        icon: createTourIcon(CheckCircle),
      },
      {
        target: 'form-step-nav',
        title: 'Move through sections',
        description:
          'Use Next and Back to move between the AIP sections in order. You can return to any completed section to make changes before submitting.',
        placement: 'top',
        missingTargetHint:
          'This step is only shown in Wizard View. If you switched to Full View, you can skip this step.',
        icon: createTourIcon(Layout),
      },
      {
        target: 'form-review-submit',
        title: 'Review, then submit',
        description:
          'Preview your complete plan here before sending it. Once you submit, your AIP goes to the CES for review — you will be notified of the result.',
        placement: 'top',
        missingTargetHint:
          'In Wizard View, keep using Continue until you reach Finalize. In Full View, scroll down until the review and submit section appears.',
        icon: createTourIcon(Eye),
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
        description:
          'Pick the program whose AIP has already been approved. Your quarterly report must be tied to a submitted AIP before you can proceed.',
        placement: 'bottom',
        missingTargetHint:
          'If you already opened a PIR, this step no longer applies. You can skip it and continue the tour from the report editor.',
        icon: createTourIcon(SquaresFour),
      },
      {
        target: 'form-autosave',
        title: 'Auto-save is on',
        description:
          'Your PIR draft is saved automatically as you work. This status bar shows your last save — you can safely leave and come back to finish.',
        placement: 'bottom',
        missingTargetHint:
          'Choose a program and form view first. This header appears once the PIR editor is on screen.',
        icon: createTourIcon(CheckCircle),
      },
      {
        target: 'form-step-nav',
        title: 'Complete each section',
        description:
          'Move through the report sections using Next and Back. Fill in each part completely before advancing — you can revisit any section before submitting.',
        placement: 'top',
        missingTargetHint:
          'This step only appears in Wizard View. If you switched to Full View, you can skip it and keep going.',
        icon: createTourIcon(Layout),
      },
      {
        target: 'form-review-submit',
        title: 'Preview and submit',
        description:
          'Review your complete quarterly report here. When everything looks right, submit it for CES review. You will receive a notification once it is processed.',
        placement: 'top',
        missingTargetHint:
          'In Wizard View, keep moving forward until you reach Finalize. In Full View, scroll down to find the review and submit section.',
        icon: createTourIcon(Eye),
      },
    ],
  }),

  cesDashboard: withStorage({
    id: 'ces-dashboard',
    title: 'CES Help',
    docsHref: '/getting-started#6-what-to-do-first',
    autoStart: false,
    steps: [
      {
        target: 'ces-filters',
        title: 'Filter the review queue',
        description:
          'Use these filters to narrow down the list by school, program, quarter, or submission status. Start here to find the reports that need your attention most.',
        placement: 'bottom',
        icon: createTourIcon(Funnel),
      },
      {
        target: 'ces-queue',
        title: 'Your review queue',
        description:
          'All pending PIRs appear here. Open any item to read the full report, add notes, and either forward it or return it to the school with remarks.',
        placement: 'top',
        icon: createTourIcon(FileText),
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
        title: 'Take action here',
        description:
          'Once you have read the report, use these buttons to either approve and forward the PIR, or return it to the school with written remarks for revision.',
        placement: 'bottom',
        icon: createTourIcon(CheckCircle),
      },
      {
        target: 'ces-review-content',
        title: 'Read the full report',
        description:
          'The complete PIR details are shown here — school profile, indicators, narrative, and attachments. Review everything carefully before taking action.',
        placement: 'top',
        icon: createTourIcon(BookOpen),
      },
    ],
  }),

  clusterHead: withStorage({
    id: 'cluster-head',
    title: 'Cluster Head Help',
    docsHref: '/getting-started#6-what-to-do-first',
    autoStart: false,
    steps: [
      {
        target: 'cluster-filters',
        title: 'Filter school PIRs',
        description:
          'Narrow down the list by school name, program, or quarter using these filters. Focus on the reports due for review in the current period.',
        placement: 'bottom',
        icon: createTourIcon(Funnel),
      },
      {
        target: 'cluster-queue',
        title: 'School PIR queue',
        description:
          'All PIRs from schools in your cluster appear here. Open each one to review and take the appropriate action before forwarding to the CES.',
        placement: 'top',
        icon: createTourIcon(UserList),
      },
    ],
  }),

  adminDashboard: withStorage({
    id: 'admin-dashboard',
    title: 'Admin Help',
    docsHref: '/getting-started#3-understanding-your-role',
    autoStart: false,
    steps: [
      {
        target: 'admin-overview',
        title: 'Overview dashboard',
        description:
          'This panel summarizes the current state of the system — active submissions, completion rates, pending reviews, and recent activity.',
        placement: 'bottom',
        icon: createTourIcon(SquaresFour),
      },
      {
        target: ['admin-sidebar', 'admin-menu-toggle'],
        title: 'Admin navigation',
        description:
          'Everything is one click away — manage users, schools, programs, deadlines, reports, and system settings from this sidebar. On smaller screens, use the menu button to open it.',
        placement: 'right',
        missingTargetHint:
          'If the admin sidebar is hidden on your screen size, use the menu button (☰) in the top bar to open it, then continue the tour.',
        icon: createTourIcon(Layout),
      },
      {
        target: 'admin-notifications',
        title: 'System notifications',
        description:
          'Submission updates, workflow events, and system alerts appear here. Keep an eye on this area during active submission periods.',
        placement: 'bottom',
        icon: createTourIcon(Bell),
      },
      {
        target: 'admin-workspace',
        title: 'Main workspace',
        description:
          'The content area changes based on which admin page you are viewing. Use the sidebar to switch between modules — this area updates accordingly.',
        placement: 'top',
        icon: createTourIcon(Gear),
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
