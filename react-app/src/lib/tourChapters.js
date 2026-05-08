import React from 'react';
import {
  Bell,
  BookOpen,
  Buildings,
  ChartLine,
  CheckCircle,
  Clipboard,
  ClockCounterClockwise,
  Eye,
  FileText,
  Flag,
  Funnel,
  Gear,
  Layout,
  ListChecks,
  SquaresFour,
  Stamp,
  Table,
  Users,
} from '@phosphor-icons/react';

export const TOUR_VERSION = 'v2';
export const CONTACT_EMAIL = 'guihulngan.city@deped.gov.ph';

function createTourIcon(Icon) {
  return React.createElement(Icon, { size: 20, weight: 'fill' });
}

export const TOUR_CHAPTERS = {
  'user-dashboard': {
    id: 'user-dashboard',
    title: 'Dashboard Tour',
    docsHref: '/getting-started#4-dashboard-overview',
    route: '/',
    steps: [
      {
        id: 'summary',
        target: 'dashboard-summary',
        title: 'Start with your summary',
        description:
          'This panel gives you the quick read on your current planning and reporting work. Check it first when you sign in.',
        placement: 'bottom',
        icon: createTourIcon(SquaresFour),
      },
      {
        id: 'action-prompt',
        target: 'dashboard-action-prompt',
        title: 'Follow the next action',
        description:
          'The prompt updates with the most useful next step, so you can move through AIP and PIR work without guessing.',
        placement: 'bottom',
        missingTargetHint:
          'The dashboard is still loading. The tour will continue once the prompt appears.',
        icon: createTourIcon(Flag),
      },
      {
        id: 'aip-card',
        target: 'dashboard-aip-card',
        title: 'Open your AIP workspace',
        description:
          'Use this card to start or continue your Annual Implementation Plan for the fiscal year.',
        placement: 'top',
        icon: createTourIcon(Clipboard),
      },
      {
        id: 'pir-card',
        target: 'dashboard-pir-card',
        title: 'File quarterly PIRs here',
        description:
          'After an AIP is available, this card takes you to your Program Implementation Report for the current reporting period.',
        placement: 'top',
        icon: createTourIcon(ClockCounterClockwise),
      },
      {
        id: 'submission-history',
        target: 'dashboard-submission-history',
        title: 'Track every submission',
        description:
          'Your past drafts, submitted documents, review status, and downloads are collected here for quick follow-up.',
        placement: 'top',
        icon: createTourIcon(ListChecks),
      },
      {
        id: 'profile-menu',
        target: 'dashboard-profile-menu',
        title: 'Account and logout',
        description:
          'Open your profile menu to review account options and sign out when you are finished, especially on shared devices.',
        placement: 'bottom',
        icon: createTourIcon(Gear),
      },
    ],
  },

  aip: {
    id: 'aip',
    title: 'AIP Tour',
    docsHref: '/getting-started#6-what-to-do-first',
    route: '/aip',
    steps: [
      {
        id: 'program-selector',
        target: 'form-program-selector',
        title: 'Choose the program',
        description:
          'Select the DepEd program you are planning for. Each program keeps its own activities, targets, and budget.',
        placement: 'bottom',
        missingTargetHint:
          'If you are already inside the editor, this selector may be hidden. You can skip this step and continue with the form tour.',
        icon: createTourIcon(SquaresFour),
      },
      {
        id: 'autosave',
        target: 'form-autosave',
        title: 'Watch the save status',
        description:
          'Autosave protects your draft while you work. Use this indicator to confirm your latest changes are safe.',
        placement: 'bottom',
        prerequisiteTarget: 'aip-form-active',
        missingTargetHint:
          'Open an AIP first. The save status appears as soon as the editor loads.',
        icon: createTourIcon(CheckCircle),
      },
      {
        id: 'step-nav',
        target: 'form-step-nav',
        title: 'Move through the sections',
        description:
          'Use the section controls to work through the plan in order, then return to any completed section before submitting.',
        placement: 'top',
        prerequisiteTarget: 'aip-form-active',
        missingTargetHint:
          'This appears inside the AIP editor. If you are in Full View, scroll to the form sections.',
        icon: createTourIcon(Layout),
      },
      {
        id: 'review-submit',
        target: 'form-review-submit',
        title: 'Review before submitting',
        description:
          'Use the final area to preview the full plan, check entries carefully, and submit when the AIP is ready for review.',
        placement: 'top',
        prerequisiteTarget: 'aip-form-active',
        missingTargetHint:
          'Complete the required AIP sections, then scroll to the final review area.',
        icon: createTourIcon(Eye),
      },
    ],
  },

  pir: {
    id: 'pir',
    title: 'PIR Tour',
    docsHref: '/getting-started#6-what-to-do-first',
    route: '/pir',
    steps: [
      {
        id: 'program-selector',
        target: 'form-program-selector',
        title: 'Choose the report program',
        description:
          'Pick the program tied to an AIP. The PIR uses that approved plan as the basis for quarterly reporting.',
        placement: 'bottom',
        missingTargetHint:
          'If the report editor is already open, you can skip this selector step and continue.',
        icon: createTourIcon(SquaresFour),
      },
      {
        id: 'autosave',
        target: 'form-autosave',
        title: 'Autosave keeps the report safe',
        description:
          'Your PIR draft saves as you work. This status tells you when the latest changes have been stored.',
        placement: 'bottom',
        prerequisiteTarget: 'pir-form-active',
        missingTargetHint:
          'Open a PIR first. The save status appears once the report editor loads.',
        icon: createTourIcon(CheckCircle),
      },
      {
        id: 'step-nav',
        target: 'form-step-nav',
        title: 'Complete each report section',
        description:
          'Move through profile details, indicators, accomplishments, factors, action items, and final review with the section controls.',
        placement: 'top',
        prerequisiteTarget: 'pir-form-active',
        missingTargetHint:
          'This appears inside the PIR editor. If you are in Full View, scroll to the report sections.',
        icon: createTourIcon(Layout),
      },
      {
        id: 'review-submit',
        target: 'form-review-submit',
        title: 'Preview and submit the PIR',
        description:
          'Check accomplishments, spending, and action items here before filing the quarterly report for review.',
        placement: 'top',
        prerequisiteTarget: 'pir-form-active',
        missingTargetHint:
          'Select a program and continue through the PIR sections until the review area appears.',
        icon: createTourIcon(Eye),
      },
    ],
  },

  'ces-dashboard': {
    id: 'ces-dashboard',
    title: 'CES Queue Tour',
    docsHref: '/getting-started#5-pir-review-chain',
    route: '/ces',
    steps: [
      {
        id: 'filters',
        target: 'ces-filters',
        title: 'Start with the filters',
        description:
          'Use search, period, and document tabs to focus the queue before opening a submission.',
        placement: 'bottom',
        icon: createTourIcon(Funnel),
      },
      {
        id: 'queue',
        target: 'ces-queue',
        title: 'Open work from the queue',
        description:
          'Pending AIPs and PIRs appear here. Open an item to review the document and take the next action.',
        placement: 'top',
        icon: createTourIcon(FileText),
      },
    ],
  },

  'ces-review': {
    id: 'ces-review',
    title: 'CES Review Tour',
    docsHref: '/getting-started#5-pir-review-chain',
    route: '/ces',
    steps: [
      {
        id: 'content',
        target: 'ces-review-content',
        title: 'Read the submission first',
        description:
          'Review the document details, accomplishments, budget, and remarks before deciding what to do next.',
        placement: 'top',
        missingTargetHint:
          'Open a submission from the CES queue first. The review content appears inside each document.',
        icon: createTourIcon(BookOpen),
      },
      {
        id: 'actions',
        target: 'ces-review-actions',
        title: 'Use the action controls',
        description:
          'Approve, note, forward, or return from this area. Clear remarks help the next user understand the decision.',
        placement: 'bottom',
        missingTargetHint:
          'Open a submission that is ready for CES action to see these controls.',
        icon: createTourIcon(CheckCircle),
      },
    ],
  },

  'division-focal-queue': {
    id: 'division-focal-queue',
    title: 'Focal Queue Tour',
    docsHref: '/getting-started#5-pir-review-chain',
    route: '/division',
    steps: [
      {
        id: 'filters',
        target: 'division-focal-filters',
        title: 'Focus the recommendation queue',
        description:
          'Filter by document type or search by school and program to find the submissions assigned to you.',
        placement: 'bottom',
        icon: createTourIcon(Funnel),
      },
      {
        id: 'queue',
        target: 'division-focal-queue',
        title: 'Open a document to review',
        description:
          'AIPs and PIRs awaiting focal recommendation are listed here. Open one row to inspect it before recommending or returning.',
        placement: 'top',
        icon: createTourIcon(FileText),
      },
    ],
  },

  'division-focal-review': {
    id: 'division-focal-review',
    title: 'Focal Review Tour',
    docsHref: '/getting-started#5-pir-review-chain',
    route: '/division',
    steps: [
      {
        id: 'content',
        target: 'division-focal-content',
        title: 'Review the document details',
        description:
          'Read the plan or report content, including activities, budget, and school/program context, before taking action.',
        placement: 'top',
        missingTargetHint:
          'Open a document from the focal queue first. The review content appears inside the selected submission.',
        icon: createTourIcon(BookOpen),
      },
      {
        id: 'actions',
        target: 'division-focal-actions',
        title: 'Recommend or return clearly',
        description:
          'Use these controls to recommend the document onward or return it with remarks that explain what needs attention.',
        placement: 'bottom',
        missingTargetHint:
          'Open a document that is ready for recommendation to see the action controls.',
        icon: createTourIcon(Stamp),
      },
    ],
  },

  'admin-dashboard': {
    id: 'admin-dashboard',
    title: 'Admin Workspace Tour',
    docsHref: '/getting-started#2-find-your-role',
    route: '/admin',
    steps: [
      {
        id: 'overview',
        target: 'admin-overview',
        title: 'Monitor the system overview',
        description:
          'This dashboard summarizes active users, submissions, workload, and recent movement across the portal.',
        placement: 'bottom',
        missingTargetHint: 'Navigate to the Admin Overview page first.',
        icon: createTourIcon(SquaresFour),
      },
      {
        id: 'navigation',
        target: ['admin-sidebar', 'admin-menu-toggle'],
        title: 'Navigate the admin modules',
        description:
          'Use the sidebar to move between users, records, submissions, reports, settings, and other admin tools.',
        placement: 'right',
        missingTargetHint:
          'If the sidebar is hidden on your screen, open it with the menu button in the top bar.',
        icon: createTourIcon(Layout),
      },
      {
        id: 'notifications',
        target: 'admin-notifications',
        title: 'Watch system notifications',
        description:
          'Submission updates and workflow events appear here so you can respond during active review periods.',
        placement: 'bottom',
        icon: createTourIcon(Bell),
      },
      {
        id: 'workspace',
        target: 'admin-workspace',
        title: 'Work in the main panel',
        description:
          'The workspace changes with the selected module. Keep the sidebar and this panel together as your admin command center.',
        placement: 'top',
        icon: createTourIcon(Gear),
      },
    ],
  },

  'admin-users': {
    id: 'admin-users',
    title: 'User Management Tour',
    docsHref: '/getting-started#2-find-your-role',
    route: '/admin/users',
    steps: [
      {
        id: 'navigation',
        target: ['admin-sidebar', 'admin-menu-toggle'],
        title: 'Open the Users module',
        description:
          'The Users section is where accounts are reviewed, roles are assigned, and access is maintained.',
        placement: 'right',
        missingTargetHint: 'Navigate to Admin > Users first.',
        icon: createTourIcon(Users),
      },
      {
        id: 'workspace',
        target: 'admin-workspace',
        title: 'Manage accounts here',
        description:
          'Search, filter, create, import, edit, disable, or review accounts from the user workspace.',
        placement: 'top',
        icon: createTourIcon(Users),
      },
      {
        id: 'onboarding-analytics',
        target: 'admin-onboarding-analytics',
        title: 'Track onboarding adoption',
        description:
          'This snapshot shows who has completed, started, dismissed, or not yet begun the guided journey.',
        placement: 'top',
        missingTargetHint: 'Scroll below the user table to view the onboarding snapshot.',
        icon: createTourIcon(ChartLine),
      },
    ],
  },

  'admin-resources': {
    id: 'admin-resources',
    title: 'Records Tour',
    docsHref: '/getting-started#2-find-your-role',
    route: '/admin/schools',
    steps: [
      {
        id: 'navigation',
        target: ['admin-sidebar', 'admin-menu-toggle'],
        title: 'Open schools or programs',
        description:
          'These modules keep the division records and active programs aligned for planning and reporting.',
        placement: 'right',
        missingTargetHint: 'Navigate to Admin > Schools or Admin > Programs first.',
        icon: createTourIcon(Buildings),
      },
      {
        id: 'workspace',
        target: 'admin-workspace',
        title: 'Maintain the records',
        description:
          'Use the workspace tools to search, review, and update the records that power AIP and PIR workflows.',
        placement: 'top',
        icon: createTourIcon(Table),
      },
    ],
  },

  'admin-submissions': {
    id: 'admin-submissions',
    title: 'Submissions Tour',
    docsHref: '/getting-started#5-pir-review-chain',
    route: '/admin/submissions',
    steps: [
      {
        id: 'workspace',
        target: 'admin-workspace',
        title: 'Review submissions division-wide',
        description:
          'All AIP and PIR submissions appear here. Use tabs, filters, grouping, exports, and document details to monitor review status.',
        placement: 'top',
        missingTargetHint: 'Navigate to Admin > Submissions first.',
        icon: createTourIcon(FileText),
      },
    ],
  },

  'admin-reports-settings': {
    id: 'admin-reports-settings',
    title: 'Reports and Settings Tour',
    docsHref: '/getting-started#2-find-your-role',
    route: '/admin/reports',
    steps: [
      {
        id: 'navigation',
        target: ['admin-sidebar', 'admin-menu-toggle'],
        title: 'Find reports and settings',
        description:
          'Reports support monitoring and exports. Settings controls portal deadlines, branding, signatories, email, and announcements.',
        placement: 'right',
        missingTargetHint: 'Navigate to Admin > Reports or Admin > Settings first.',
        icon: createTourIcon(ChartLine),
      },
      {
        id: 'workspace',
        target: 'admin-workspace',
        title: 'Use the selected module',
        description:
          'The selected report or settings panel loads here. Work carefully, since these tools affect division-wide operations.',
        placement: 'top',
        icon: createTourIcon(Gear),
      },
    ],
  },

  'observer-overview': {
    id: 'observer-overview',
    title: 'Observer Overview Tour',
    docsHref: '/getting-started#2-find-your-role',
    route: '/admin',
    steps: [
      {
        id: 'overview',
        target: 'admin-overview',
        title: 'Start with read-only monitoring',
        description:
          'Observer access is designed for visibility. Use the overview to understand submission movement without changing operational records.',
        placement: 'bottom',
        icon: createTourIcon(Eye),
      },
      {
        id: 'navigation',
        target: ['admin-sidebar', 'admin-menu-toggle'],
        title: 'Use the available modules',
        description:
          'Observer navigation shows the monitoring areas available to you, with admin-only maintenance tools hidden.',
        placement: 'right',
        missingTargetHint:
          'If the sidebar is hidden on your screen, open it with the menu button in the top bar.',
        icon: createTourIcon(Layout),
      },
      {
        id: 'workspace',
        target: 'admin-workspace',
        title: 'Review without editing records',
        description:
          'The main workspace lets you inspect submissions and reports while preserving the integrity of live data.',
        placement: 'top',
        icon: createTourIcon(BookOpen),
      },
    ],
  },

  'observer-submissions': {
    id: 'observer-submissions',
    title: 'Observer Submissions Tour',
    docsHref: '/getting-started#5-pir-review-chain',
    route: '/admin/submissions',
    steps: [
      {
        id: 'workspace',
        target: 'admin-workspace',
        title: 'Inspect submissions safely',
        description:
          'Use tabs, filters, document previews, and exports to follow AIP and PIR status. Action controls stay disabled for Observer accounts.',
        placement: 'top',
        missingTargetHint: 'Navigate to Admin > Submissions first.',
        icon: createTourIcon(Eye),
      },
    ],
  },

  'observer-consolidation': {
    id: 'observer-consolidation',
    title: 'Observer Consolidation Tour',
    docsHref: '/getting-started#5-pir-review-chain',
    route: '/admin/consolidation-template',
    steps: [
      {
        id: 'workspace',
        target: 'admin-consolidation-workspace',
        title: 'Review consolidated findings',
        description:
          'This workspace brings together accomplishments, gaps, recommendations, and management response for division review.',
        placement: 'top',
        missingTargetHint: 'Navigate to the Consolidation module first.',
        icon: createTourIcon(Table),
      },
      {
        id: 'response',
        target: 'admin-consolidation-workspace',
        title: 'Add management response when needed',
        description:
          'Observer accounts can contribute management response while other sensitive fields remain protected.',
        placement: 'top',
        icon: createTourIcon(Stamp),
      },
    ],
  },
};

export function getTourChapter(chapterId) {
  return TOUR_CHAPTERS[chapterId] ?? null;
}

export function resolveChapterSteps(chapterId, stepIds) {
  const chapter = getTourChapter(chapterId);
  if (!chapter) return [];
  if (!Array.isArray(stepIds) || stepIds.length === 0) return chapter.steps;

  const allowed = new Set(stepIds);
  return chapter.steps.filter((step) => allowed.has(step.id));
}

export function resolveTaskTourSteps(task) {
  if (!task) return [];
  const chapterSteps = resolveChapterSteps(task.tourChapterId, task.tourStepIds);
  return chapterSteps.length > 0 ? chapterSteps : (task.tourSteps ?? []);
}
