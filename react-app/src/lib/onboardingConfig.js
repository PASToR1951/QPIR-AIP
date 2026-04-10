export const ONBOARDING_VERSION = 1;

const ACTIVE_ROLE_KEYS = ['school', 'division', 'ces', 'cluster', 'admin'];
const EXCLUDED_AUTO_OPEN_PATHS = [
  '/login',
  '/oauth/callback',
  '/docs',
  '/getting-started',
  '/faq',
  '/privacy',
  '/changelog',
];

export const DEFAULT_CHECKLIST_PROGRESS = {
  completed_task_ids: [],
  hint_ids_seen: [],
  panel_hidden: false,
};

export function getRoleKey(role) {
  if (role === 'School') return 'school';
  if (role === 'Division Personnel') return 'division';
  if (['CES-SGOD', 'CES-ASDS', 'CES-CID'].includes(role)) return 'ces';
  if (role === 'Cluster Coordinator') return 'cluster';
  if (role === 'Admin') return 'admin';
  if (role === 'Observer') return 'observer';
  if (role === 'Pending') return 'pending';
  return 'unknown';
}

export function isChecklistRole(roleKey) {
  return ACTIVE_ROLE_KEYS.includes(roleKey);
}

export function isWelcomeEligibleRole(roleKey) {
  return isChecklistRole(roleKey) || roleKey === 'pending';
}

export function shouldSuppressAutoWelcome(pathname = '') {
  return EXCLUDED_AUTO_OPEN_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );
}

export const onboardingContent = {
  school: {
    title: 'Welcome to the AIP-PIR Portal',
    subtitle: 'We’ll guide you through your first real planning steps.',
    bullets: [
      'Open the planning workspace for one of your assigned programs.',
      'Save a first draft safely before anything is submitted.',
      'Reach the review step so you know where final checks happen.',
    ],
  },
  division: {
    title: 'Welcome to your planning workspace',
    subtitle: 'Your checklist focuses on the first actions Division Personnel actually take.',
    bullets: [
      'Open the AIP workspace for one of your assigned programs.',
      'Save a first draft section and confirm autosave is working.',
      'Reach the review area without triggering any irreversible action.',
    ],
  },
  ces: {
    title: 'Welcome to the CES review queue',
    subtitle: 'We’ll walk you through the review flow without taking action on a live submission.',
    bullets: [
      'Use filters to narrow the queue quickly.',
      'Open a real submission and inspect the review surface.',
      'Find the action controls before you ever need to use them.',
    ],
  },
  cluster: {
    title: 'Welcome to the cluster review queue',
    subtitle: 'Your onboarding centers on the school review work you do most often.',
    bullets: [
      'Open your cluster queue and narrow it with filters.',
      'Open a school PIR review surface from the live queue.',
      'Locate the note and return controls before acting on a submission.',
    ],
  },
  admin: {
    title: 'Welcome to the admin workspace',
    subtitle: 'Your checklist covers the core pages you will use to manage the system.',
    bullets: [
      'Move through users, schools, programs, and submissions.',
      'Review where reports and settings live in the admin workspace.',
      'Keep tours handy for route-by-route refreshers later on.',
    ],
  },
  pending: {
    title: 'Your account is almost ready',
    subtitle: 'An administrator still needs to assign your role before the full workspace opens.',
    bullets: [
      'You can sign in again later to check your access.',
      'Once your role is assigned, onboarding will guide your first actions.',
    ],
  },
};

export const onboardingTasksByRole = {
  school: [
    {
      id: 'school-dashboard',
      label: 'View your dashboard',
      description: 'Start on your landing page.',
      route: '/',
      completeOn: ['author.dashboard_visited'],
    },
    {
      id: 'school-open-form',
      label: 'Open an AIP form',
      description: 'Enter the planning workspace.',
      route: '/aip',
      completeOn: ['author.form_visited'],
    },
    {
      id: 'school-program',
      label: 'Select your first program',
      description: 'Pick one program to begin planning.',
      route: '/aip',
      completeOn: ['author.program_selected'],
    },
    {
      id: 'school-save',
      label: 'Save a draft section',
      description: 'Use Save Draft or let autosave capture your work.',
      route: '/aip',
      completeOn: ['author.draft_saved'],
    },
    {
      id: 'school-review',
      label: 'Reach the review step',
      description: 'Open the finalize area before submitting.',
      route: '/aip',
      completeOn: ['author.review_area_opened'],
    },
  ],
  division: [
    {
      id: 'division-dashboard',
      label: 'View your dashboard',
      description: 'Start on your landing page.',
      route: '/',
      completeOn: ['author.dashboard_visited'],
    },
    {
      id: 'division-open-form',
      label: 'Open an AIP form',
      description: 'Open the assigned program workspace.',
      route: '/aip',
      completeOn: ['author.form_visited'],
    },
    {
      id: 'division-program',
      label: 'Select an assigned program',
      description: 'Pick one assigned program to begin.',
      route: '/aip',
      completeOn: ['author.program_selected'],
    },
    {
      id: 'division-save',
      label: 'Save a draft section',
      description: 'Use Save Draft or autosave once.',
      route: '/aip',
      completeOn: ['author.draft_saved'],
    },
    {
      id: 'division-review',
      label: 'Reach the review step',
      description: 'Open the finalize area before submitting.',
      route: '/aip',
      completeOn: ['author.review_area_opened'],
    },
  ],
  ces: [
    {
      id: 'ces-queue',
      label: 'View the review queue',
      description: 'Open the CES queue landing page.',
      route: '/ces',
      completeOn: ['ces.queue_visited'],
    },
    {
      id: 'ces-filter',
      label: 'Filter submissions',
      description: 'Use search or quarter to narrow the queue.',
      route: '/ces',
      completeOn: ['ces.filter_applied'],
    },
    {
      id: 'ces-open-review',
      label: 'Open a submission for review',
      description: 'Enter a real PIR review screen.',
      route: '/ces',
      completeOn: ['ces.review_opened'],
    },
    {
      id: 'ces-actions',
      label: 'Review the action area',
      description: 'Locate the note and return controls.',
      route: '/ces',
      completeOn: ['ces.action_area_viewed'],
    },
  ],
  cluster: [
    {
      id: 'cluster-queue',
      label: 'View your school queue',
      description: 'Open the cluster review landing page.',
      route: '/cluster-head',
      completeOn: ['cluster.queue_visited'],
    },
    {
      id: 'cluster-filter',
      label: 'Filter submissions',
      description: 'Use search or quarter to narrow the queue.',
      route: '/cluster-head',
      completeOn: ['cluster.filter_applied'],
    },
    {
      id: 'cluster-open-review',
      label: 'Open a school PIR',
      description: 'Open the live review surface from the queue.',
      route: '/cluster-head',
      completeOn: ['cluster.review_surface_opened'],
    },
    {
      id: 'cluster-actions',
      label: 'Review the action area',
      description: 'Locate the note and return controls.',
      route: '/cluster-head',
      completeOn: ['cluster.action_area_viewed'],
    },
  ],
  admin: [
    {
      id: 'admin-overview',
      label: 'Explore the admin dashboard',
      description: 'Start from the admin overview.',
      route: '/admin',
      completeOn: ['admin.overview_visited'],
    },
    {
      id: 'admin-users',
      label: 'View the user list',
      description: 'Open the user management page.',
      route: '/admin/users',
      completeOn: ['admin.users_visited'],
    },
    {
      id: 'admin-resources',
      label: 'View schools or programs',
      description: 'Open either schools or programs.',
      route: '/admin/schools',
      completeOn: ['admin.resources_visited'],
    },
    {
      id: 'admin-submissions',
      label: 'View submissions',
      description: 'Open the submissions workspace.',
      route: '/admin/submissions',
      completeOn: ['admin.submissions_visited'],
    },
    {
      id: 'admin-reports-settings',
      label: 'Review reports or settings',
      description: 'Open either reports or settings.',
      route: '/admin/reports',
      completeOn: ['admin.reports_settings_visited'],
    },
  ],
};

export const onboardingHintsByRole = {
  school: [
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
  division: [
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
  ces: [
    {
      id: 'ces-filters',
      pathname: '/ces',
      target: 'ces-filters',
      title: 'Start with the queue filters',
      description: 'A quick search or quarter filter is the fastest way to narrow live submissions before opening one.',
      pendingTaskId: 'ces-filter',
    },
  ],
  cluster: [
    {
      id: 'cluster-filters',
      pathname: '/cluster-head',
      target: 'cluster-filters',
      title: 'Use filters before opening a review',
      description: 'Search and quarter filters help you focus on the schools that need your attention first.',
      pendingTaskId: 'cluster-filter',
    },
  ],
};

export function getOnboardingTasks(roleKey) {
  return onboardingTasksByRole[roleKey] ?? [];
}

export function getOnboardingHints(roleKey) {
  return onboardingHintsByRole[roleKey] ?? [];
}

export function normalizeChecklistProgress(progress, roleKey) {
  const tasks = getOnboardingTasks(roleKey);
  const validTaskIds = new Set(tasks.map((task) => task.id));
  const source = progress && typeof progress === 'object' ? progress : {};

  return {
    completed_task_ids: Array.isArray(source.completed_task_ids)
      ? source.completed_task_ids.filter((taskId) => validTaskIds.has(taskId))
      : [],
    hint_ids_seen: Array.isArray(source.hint_ids_seen)
      ? source.hint_ids_seen.filter((hintId) => typeof hintId === 'string' && hintId.trim().length > 0)
      : [],
    panel_hidden: Boolean(source.panel_hidden),
  };
}
