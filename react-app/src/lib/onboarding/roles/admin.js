export const adminRoleConfig = {
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
};
