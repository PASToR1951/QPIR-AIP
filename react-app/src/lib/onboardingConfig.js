export const ONBOARDING_VERSION = 1;

export const DEFAULT_CHECKLIST_PROGRESS = {
  completed_task_ids: [],
  hint_ids_seen: [],
  panel_hidden: false,
};

// ── Role key lookup ───────────────────────────────────────────────────────────
// Maps DB role strings → short internal keys. Single source of truth for role
// naming: add or rename roles here only.
const ROLE_KEY_MAP = {
  'School':               'school',
  'Division Personnel':   'division',
  'CES-SGOD':             'ces',
  'CES-ASDS':             'ces',
  'CES-CID':              'ces',
  'Cluster Coordinator':  'cluster',
  'Admin':                'admin',
  'Observer':             'observer',
  'Pending':              'pending',
};

export function getRoleKey(role) {
  return ROLE_KEY_MAP[role] ?? 'unknown';
}

// ── Role registry ─────────────────────────────────────────────────────────────
// One entry per internal role key. Adding a new role means adding one block here
// instead of editing four separate *ByRole objects.
//
// Schema per entry:
//   hasChecklist      — shows the onboarding checklist panel
//   isWelcomeEligible — shows the WelcomeCard on first login
//   content           — WelcomeCard copy  (null if no welcome card)
//   tasks             — checklist tasks
//   hints             — contextual first-action hints
//   practiceTasks     — practice mode tasks
export const ROLE_REGISTRY = {
  school: {
    hasChecklist: true,
    isWelcomeEligible: true,
    content: {
      title: 'Welcome to the AIP-PIR Portal',
      subtitle: 'Your digital workspace for submitting Annual Implementation Plans and filing quarterly progress reports.',
      bullets: [
        'Plan your year — submit an AIP by filling in your programs, activities, and allocated budget.',
        'Report quarterly — file a PIR each quarter to record accomplishments against your plan.',
        'Work at your own pace — autosave keeps every draft safe so you can pick up where you left off.',
      ],
    },
    tasks: [
      {
        id: 'school-dashboard',
        label: 'View your dashboard',
        description: 'Open your dashboard and find the AIP and PIR cards.',
        route: '/',
        completeOn: ['author.dashboard_visited'],
        tourSteps: [
          {
            target: 'dashboard-aip-card',
            title: 'AIP — Annual Plan',
            description: 'This card opens your Annual Implementation Plan. Click "Start Planning" to begin filling in your activities and budget for the year.',
            placement: 'top',
          },
          {
            target: 'dashboard-pir-card',
            title: 'PIR — Quarterly Report',
            description: 'After your AIP is submitted, you will file quarterly PIR reports here to record what actually happened versus what you planned.',
            placement: 'top',
          },
        ],
      },
      {
        id: 'school-open-form',
        label: 'Open an AIP form',
        description: 'Open the AIP form to start your first plan.',
        route: '/aip',
        completeOn: ['author.form_visited'],
        tourSteps: [
          {
            target: 'form-step-nav',
            title: 'Form Steps',
            description: 'The AIP form is divided into sections — Alignment, Targets, Action Plan, and more. Complete each section in order before moving on.',
            placement: 'bottom',
            prerequisiteTarget: 'aip-form-active',
            missingTargetHint: 'Open the AIP form first by clicking "Start Planning" on your dashboard, then come back to this task.',
          },
          {
            target: 'form-program-selector',
            title: 'Program Selector',
            description: 'Start here. Pick one of your assigned programs from this list — each program has its own set of activities and budget to fill in.',
            placement: 'bottom',
          },
        ],
      },
      {
        id: 'school-program',
        label: 'Select your first program',
        description: 'Choose a program so the form can load its activities.',
        route: '/aip',
        completeOn: ['author.program_selected'],
        tourSteps: [
          {
            target: 'form-program-selector',
            title: 'Choose a Program',
            description: 'Select any program from this list to start. Once selected, the form will load that program\'s activities and budget fields for you to fill in.',
            placement: 'bottom',
            missingTargetHint: 'Open the AIP form first by clicking "Start Planning" on your dashboard.',
          },
        ],
      },
      {
        id: 'school-save',
        label: 'Save a draft section',
        description: 'Enter a first draft section and make sure it saves.',
        route: '/aip',
        completeOn: ['author.draft_saved'],
        tourSteps: [
          {
            target: 'form-autosave',
            title: 'Save Status',
            description: 'This shows whether your work is saved. The form saves automatically as you type — you do not need to click anything. You can also click "Save Draft" here for a manual checkpoint.',
            placement: 'bottom',
            prerequisiteTarget: 'aip-form-active',
            missingTargetHint: 'Open the AIP form first by clicking "Start Planning" on your dashboard.',
          },
        ],
      },
      {
        id: 'school-review',
        label: 'Reach the review step',
        description: 'Complete the form sections and open the review area.',
        route: '/aip',
        completeOn: ['author.review_area_opened'],
        tourSteps: [
          {
            target: 'form-review-submit',
            title: 'Review & Submit',
            description: 'After completing all sections, this area appears at the bottom. Review everything carefully here before submitting — once submitted, changes require your coordinator\'s approval.',
            placement: 'top',
            prerequisiteTarget: 'aip-form-active',
            missingTargetHint: 'Complete all form sections first, then scroll to the bottom of the form to reach the submit area.',
          },
        ],
      },
    ],
    hints: [
      {
        id: 'author-autosave',
        pathname: '/aip',
        target: 'form-autosave',
        title: 'This form auto-saves while you work',
        description: 'You can safely pause after entering a first draft section. Save Draft is still available whenever you want a manual checkpoint.',
        requiredTaskId: 'school-open-form',
        pendingTaskId: 'school-save',
      },
    ],
    practiceTasks: [
      {
        id: 'practice-school-submit-aip',
        label: 'Practice: Submit an AIP',
        description: 'Walk through the AIP submission step on a mock program — no real data is affected.',
        practiceType: 'aip_submit',
        completeOn: ['practice.aip_submitted'],
      },
      {
        id: 'practice-school-file-pir',
        label: 'Practice: File a PIR',
        description: 'Try the quarterly PIR filing flow without submitting anything real.',
        practiceType: 'pir_submit',
        completeOn: ['practice.pir_submitted'],
      },
    ],
  },

  division: {
    hasChecklist: true,
    isWelcomeEligible: true,
    content: {
      title: 'Welcome to your planning workspace',
      subtitle: 'Manage AIP submissions and quarterly PIR reports for your assigned programs.',
      bullets: [
        'Submit AIPs — fill in programs, activities, and budgets through a structured step-by-step form.',
        'Report quarterly — file PIR entries each quarter to track outcomes against your planned targets.',
        'Stay organised — autosave and draft history keep your work safe across sessions.',
      ],
    },
    tasks: [
      {
        id: 'division-dashboard',
        label: 'View your dashboard',
        description: 'Open your dashboard and find the AIP and PIR cards.',
        route: '/',
        completeOn: ['author.dashboard_visited'],
        tourSteps: [
          {
            target: 'dashboard-aip-card',
            title: 'AIP — Annual Plan',
            description: 'This card opens the Annual Implementation Plan workspace for your assigned programs. Click "Start Planning" to begin.',
            placement: 'top',
          },
          {
            target: 'dashboard-pir-card',
            title: 'PIR — Quarterly Report',
            description: 'After the AIP is submitted, quarterly PIR reports are filed here to track actual activities and spending versus what was planned.',
            placement: 'top',
          },
        ],
      },
      {
        id: 'division-open-form',
        label: 'Open an AIP form',
        description: 'Open the AIP form for one of your assigned programs.',
        route: '/aip',
        completeOn: ['author.form_visited'],
        tourSteps: [
          {
            target: 'form-step-nav',
            title: 'Form Steps',
            description: 'The AIP is divided into sections. Work through each one in order — Alignment, Targets, Action Plan, and so on — before reaching the final review.',
            placement: 'bottom',
            prerequisiteTarget: 'aip-form-active',
            missingTargetHint: 'Open the AIP form first by clicking "Start Planning" on your dashboard.',
          },
          {
            target: 'form-program-selector',
            title: 'Program Selector',
            description: 'Select one of your assigned programs here to start. Each program has its own separate budget and activity entries.',
            placement: 'bottom',
          },
        ],
      },
      {
        id: 'division-program',
        label: 'Select an assigned program',
        description: 'Choose one of your assigned programs to load the form.',
        route: '/aip',
        completeOn: ['author.program_selected'],
        tourSteps: [
          {
            target: 'form-program-selector',
            title: 'Choose a Program',
            description: 'Pick one of your assigned programs from this list. Once selected, the form loads that program\'s activities and budget fields.',
            placement: 'bottom',
            missingTargetHint: 'Open the AIP form first by clicking "Start Planning" on your dashboard.',
          },
        ],
      },
      {
        id: 'division-save',
        label: 'Save a draft section',
        description: 'Enter a first draft section and make sure it saves.',
        route: '/aip',
        completeOn: ['author.draft_saved'],
        tourSteps: [
          {
            target: 'form-autosave',
            title: 'Save Status',
            description: 'Autosave runs automatically as you work. This indicator shows when your last save happened. Click "Save Draft" here anytime for an extra manual checkpoint.',
            placement: 'bottom',
            prerequisiteTarget: 'aip-form-active',
            missingTargetHint: 'Open the AIP form first by clicking "Start Planning" on your dashboard.',
          },
        ],
      },
      {
        id: 'division-review',
        label: 'Reach the review step',
        description: 'Complete the form sections and open the review area.',
        route: '/aip',
        completeOn: ['author.review_area_opened'],
        tourSteps: [
          {
            target: 'form-review-submit',
            title: 'Review & Submit',
            description: 'Once all sections are complete, this area appears at the bottom. Check all entries before submitting — post-submission changes need coordinator approval.',
            placement: 'top',
            prerequisiteTarget: 'aip-form-active',
            missingTargetHint: 'Complete all form sections first, then scroll to the bottom to reach the review area.',
          },
        ],
      },
    ],
    hints: [
      {
        id: 'division-autosave',
        pathname: '/aip',
        target: 'form-autosave',
        title: 'Draft saving is already on',
        description: 'Once you start editing, autosave keeps your first draft section from getting lost.',
        requiredTaskId: 'division-open-form',
        pendingTaskId: 'division-save',
      },
    ],
    practiceTasks: [
      {
        id: 'practice-division-submit-aip',
        label: 'Practice: Submit an AIP',
        description: 'Walk through the AIP submission step on a mock program — no real data is affected.',
        practiceType: 'aip_submit',
        completeOn: ['practice.aip_submitted'],
      },
      {
        id: 'practice-division-file-pir',
        label: 'Practice: File a PIR',
        description: 'Try the quarterly PIR filing flow without submitting anything real.',
        practiceType: 'pir_submit',
        completeOn: ['practice.pir_submitted'],
      },
    ],
  },

  ces: {
    hasChecklist: true,
    isWelcomeEligible: true,
    content: {
      title: 'Welcome to the CES review queue',
      subtitle: 'Your workspace for reviewing PIR submissions forwarded from cluster coordinators.',
      bullets: [
        'Review forwarded PIRs — quarterly reports from schools arrive here after cluster approval.',
        'Filter and prioritise — quickly locate submissions by school name or quarter.',
        'Note and forward, or return — move reports up the chain or send them back with remarks.',
      ],
    },
    tasks: [
      {
        id: 'ces-queue',
        label: 'View the review queue',
        description: 'Open the CES queue and review the forwarded PIR list.',
        route: '/ces',
        completeOn: ['ces.queue_visited'],
        tourSteps: [
          {
            target: 'ces-filters',
            title: 'Queue Filters',
            description: 'Use these to narrow the queue by school name or quarter. At quarter-end, filtering first is the fastest way to find submissions that need immediate action.',
            placement: 'bottom',
          },
          {
            target: 'ces-queue',
            title: 'Submissions Table',
            description: 'Every PIR forwarded to your level appears in this table. Click any row to open that school\'s report and begin your review.',
            placement: 'top',
          },
        ],
      },
      {
        id: 'ces-filter',
        label: 'Filter submissions',
        description: 'Use the filters to narrow the queue by school or quarter.',
        route: '/ces',
        completeOn: ['ces.filter_applied'],
        tourSteps: [
          {
            target: 'ces-filters',
            title: 'Filter Bar',
            description: 'Type a school name or select a quarter here. The table updates instantly — no need to press Enter. Use this before opening any submission to focus on what matters first.',
            placement: 'bottom',
          },
        ],
      },
      {
        id: 'ces-open-review',
        label: 'Open a submission for review',
        description: 'Open one PIR from the queue to inspect the report.',
        route: '/ces',
        completeOn: ['ces.review_opened'],
        tourSteps: [
          {
            target: 'ces-queue',
            title: 'Opening a PIR',
            description: 'Click any row in this table to open that school\'s report. You will see their reported activities, expenditures for the quarter, and any attachments they uploaded.',
            placement: 'top',
          },
        ],
      },
      {
        id: 'ces-actions',
        label: 'Find the action controls',
        description: 'Find the Note & Forward and Return controls in a review.',
        route: '/ces',
        completeOn: ['ces.action_area_viewed'],
        tourSteps: [
          {
            target: 'ces-review-content',
            title: 'Report Content',
            description: 'This section shows what the school reported — activities completed and money spent. Read through this before deciding what action to take.',
            placement: 'bottom',
            missingTargetHint: 'Open a PIR from the queue first — the review content and action buttons appear inside each submission.',
          },
          {
            target: 'ces-review-actions',
            title: 'Action Buttons',
            description: '"Note & Forward" sends the PIR up to the next level. "Return" sends it back with your feedback. Always write a clear note when returning so the school knows what to fix.',
            placement: 'bottom',
            missingTargetHint: 'Open a PIR from the queue first — the action buttons appear at the top of each submission.',
          },
        ],
      },
    ],
    hints: [
      {
        id: 'ces-filters',
        pathname: '/ces',
        target: 'ces-filters',
        title: 'Start with the queue filters',
        description: 'A quick search or quarter filter is the fastest way to narrow live submissions before opening one.',
        pendingTaskId: 'ces-filter',
      },
    ],
    practiceTasks: [
      {
        id: 'practice-ces-forward',
        label: 'Practice: Forward a PIR to SDS',
        description: 'Note and forward a mock PIR to the SDS — no real records change.',
        practiceType: 'ces_forward',
        completeOn: ['practice.ces_forwarded'],
      },
      {
        id: 'practice-ces-return',
        label: 'Practice: Return a PIR',
        description: 'Return a mock PIR with feedback — no real records change.',
        practiceType: 'ces_return',
        completeOn: ['practice.ces_returned'],
      },
    ],
  },

  cluster: {
    hasChecklist: true,
    isWelcomeEligible: true,
    content: {
      title: 'Welcome to your cluster review queue',
      subtitle: 'Your queue for reviewing and acting on PIR submissions from your cluster schools.',
      bullets: [
        'See all your schools — every PIR submitted by schools in your cluster appears in one place.',
        'Approve or return — move reports forward to the CES level or send them back with feedback.',
        'Filter by school or quarter — quickly focus on who needs your attention first.',
      ],
    },
    tasks: [
      {
        id: 'cluster-queue',
        label: 'View your school queue',
        description: 'Open the cluster queue and review submitted school PIRs.',
        route: '/cluster-head',
        completeOn: ['cluster.queue_visited'],
        tourSteps: [
          {
            target: 'cluster-filters',
            title: 'Queue Filters',
            description: 'Filter by school name or quarter to find specific submissions. Schools with overdue PIRs are usually sorted to the top.',
            placement: 'bottom',
          },
          {
            target: 'cluster-queue',
            title: 'Your School Queue',
            description: 'This table lists every PIR submitted by schools in your cluster. Click any row to open that school\'s quarterly report and review it.',
            placement: 'top',
          },
        ],
      },
      {
        id: 'cluster-filter',
        label: 'Filter submissions',
        description: 'Use the filters to narrow the queue by school or quarter.',
        route: '/cluster-head',
        completeOn: ['cluster.filter_applied'],
        tourSteps: [
          {
            target: 'cluster-filters',
            title: 'Search & Filter',
            description: 'Type a school name or pick a quarter here. The queue updates immediately. Use this to focus on schools that are late or need your attention most urgently.',
            placement: 'bottom',
          },
        ],
      },
      {
        id: 'cluster-open-review',
        label: 'Open a school PIR',
        description: 'Open one school PIR from the queue for review.',
        route: '/cluster-head',
        completeOn: ['cluster.review_surface_opened'],
        tourSteps: [
          {
            target: 'cluster-queue',
            title: 'Opening a School PIR',
            description: 'Click any row here to open that school\'s quarterly report. You will see their activities, actual spending, and any files they attached before you decide to approve or return.',
            placement: 'top',
          },
        ],
      },
      {
        id: 'cluster-actions',
        label: 'Find the action controls',
        description: 'Find the Note & Approve and Return controls in a review.',
        route: '/cluster-head',
        completeOn: ['cluster.action_area_viewed'],
        tourSteps: [
          {
            target: 'cluster-queue',
            title: 'Finding Action Controls',
            description: 'Click any row to open a school PIR. Once inside, you will find "Note & Approve" and "Return" buttons at the top. Approving forwards it up; returning sends it back with your remarks.',
            placement: 'top',
          },
        ],
      },
    ],
    hints: [
      {
        id: 'cluster-filters',
        pathname: '/cluster-head',
        target: 'cluster-filters',
        title: 'Use filters before opening a review',
        description: 'Search and quarter filters help you focus on the schools that need your attention first.',
        pendingTaskId: 'cluster-filter',
      },
    ],
    practiceTasks: [
      {
        id: 'practice-cluster-note',
        label: 'Practice: Note and approve a PIR',
        description: 'Approve a mock school PIR with optional remarks — no real records change.',
        practiceType: 'cluster_note',
        completeOn: ['practice.cluster_noted'],
      },
      {
        id: 'practice-cluster-return',
        label: 'Practice: Return a PIR',
        description: 'Return a mock school PIR with feedback — no real records change.',
        practiceType: 'cluster_return',
        completeOn: ['practice.cluster_returned'],
      },
    ],
  },

  admin: {
    hasChecklist: true,
    isWelcomeEligible: true,
    content: {
      title: 'Welcome to the admin workspace',
      subtitle: 'The system management workspace for users, schools, programs, and submissions.',
      bullets: [
        'Manage users — approve new accounts and assign roles so everyone has the right access.',
        'Maintain records — add or update schools and programs for the current planning cycle.',
        'Monitor submissions — track AIP and PIR status across all schools from one place.',
      ],
    },
    tasks: [
      {
        id: 'admin-overview',
        label: 'Explore the admin dashboard',
        description: 'Open the Admin Overview to check the system summary.',
        route: '/admin',
        completeOn: ['admin.overview_visited'],
        tourSteps: [
          {
            target: 'admin-overview',
            title: 'System Overview',
            description: 'This panel shows system-wide counts — total users, recent submissions, and accounts waiting for role assignment. Check here for a quick health check.',
            placement: 'bottom',
            missingTargetHint: 'Navigate to the Admin Overview page first.',
          },
          {
            target: 'admin-sidebar',
            title: 'Admin Navigation',
            description: 'Use this sidebar to move between Users, Schools, Programs, Submissions, Reports, and Settings. Each section has its own management tools.',
            placement: 'right',
          },
        ],
      },
      {
        id: 'admin-users',
        label: 'View the user list',
        description: 'Visit Users to review accounts and pending role assignments.',
        route: '/admin/users',
        completeOn: ['admin.users_visited'],
        tourSteps: [
          {
            target: 'admin-sidebar',
            title: 'Users Section',
            description: 'The Users page lists every registered account. Accounts without a role are marked Pending — assign them a role so they can start using the system.',
            placement: 'right',
            missingTargetHint: 'Navigate to Admin > Users first.',
          },
          {
            target: 'admin-workspace',
            title: 'User List',
            description: 'All registered accounts appear here. Click any user to view their details, change their role, or deactivate their account.',
            placement: 'top',
          },
        ],
      },
      {
        id: 'admin-resources',
        label: 'View schools or programs',
        description: 'Open Schools or Programs to review system records.',
        route: '/admin/schools',
        completeOn: ['admin.resources_visited'],
        tourSteps: [
          {
            target: 'admin-sidebar',
            title: 'Schools & Programs',
            description: 'Schools manages school records and coordinator assignments. Programs manages which programs are active for the current planning cycle.',
            placement: 'right',
            missingTargetHint: 'Navigate to Admin > Schools first.',
          },
          {
            target: 'admin-workspace',
            title: 'Records Table',
            description: 'All schools or programs appear here depending on which section you opened. Use the search and filter controls at the top to find specific records.',
            placement: 'top',
          },
        ],
      },
      {
        id: 'admin-submissions',
        label: 'View submissions',
        description: 'Visit Submissions to review AIP and PIR status.',
        route: '/admin/submissions',
        completeOn: ['admin.submissions_visited'],
        tourSteps: [
          {
            target: 'admin-workspace',
            title: 'Submissions Workspace',
            description: 'All AIP and PIR submissions across every school appear here. Use this to check which schools have submitted, which are still pending, and which may need follow-up.',
            placement: 'top',
            missingTargetHint: 'Navigate to Admin > Submissions first.',
          },
        ],
      },
      {
        id: 'admin-reports-settings',
        label: 'Review reports or settings',
        description: 'Open Reports or Settings to review exports and configuration.',
        route: '/admin/reports',
        completeOn: ['admin.reports_settings_visited'],
        tourSteps: [
          {
            target: 'admin-sidebar',
            title: 'Reports & Settings',
            description: 'Reports lets you export submission data and generate summaries for review cycles. Settings is where you configure deadlines, school assignments, and other system options.',
            placement: 'right',
            missingTargetHint: 'Navigate to Admin > Reports first.',
          },
          {
            target: 'admin-workspace',
            title: 'Content Area',
            description: 'The selected section\'s content loads here. Reports will show export options and data summaries. Settings shows configuration fields for the system.',
            placement: 'top',
          },
        ],
      },
    ],
    hints: [],
    practiceTasks: [
      {
        id: 'practice-admin-create-user',
        label: 'Practice: Create a user',
        description: 'Fill out the user creation form on a mock account — nothing is saved.',
        practiceType: 'admin_create_user',
        completeOn: ['practice.admin_user_created'],
      },
      {
        id: 'practice-admin-assign-role',
        label: 'Practice: Assign a role',
        description: 'Change the role of a mock user — no real accounts are modified.',
        practiceType: 'admin_assign_role',
        completeOn: ['practice.admin_role_assigned'],
      },
    ],
  },

  pending: {
    hasChecklist: false,
    isWelcomeEligible: true,
    content: {
      title: 'Your account is almost ready',
      subtitle: 'You\'ve registered successfully. An administrator needs to assign your role before your workspace opens.',
      bullets: [
        'AIP-PIR is the division\'s portal for submitting Annual Implementation Plans and filing quarterly PIR reports.',
        'Your access level depends on your role — school, cluster, CES, or division.',
        'Sign in again after your role is assigned and your workspace will be ready to go.',
      ],
    },
    tasks: [],
    hints: [],
    practiceTasks: [],
  },

  observer: {
    hasChecklist: false,
    isWelcomeEligible: false,
    content: null,
    tasks: [],
    hints: [],
    practiceTasks: [],
  },
};

// ── Excluded auto-open paths ──────────────────────────────────────────────────
export const EXCLUDED_AUTO_OPEN_PATHS = new Set([
  '/login',
  '/oauth/callback',
  '/docs',
  '/getting-started',
  '/faq',
  '/privacy',
  '/changelog',
]);
