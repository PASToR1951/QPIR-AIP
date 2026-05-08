export const observerRoleConfig = {
  hasChecklist: true,
  isWelcomeEligible: true,
  content: {
    title: 'Welcome to Observer access',
    subtitle: 'Your guided path focuses on safe, read-only monitoring and management response work.',
    bullets: [
      'Monitor without changing records - review overview data and submission status safely.',
      'Inspect submissions - use filters, previews, and exports while operational actions stay protected.',
      'Contribute responses - add management response in consolidation where your role allows it.',
    ],
  },
  tasks: [
    {
      id: 'observer-overview',
      label: 'Review the overview',
      description: 'Open the admin overview and learn what Observer access can monitor.',
      route: '/admin',
      completeOn: ['observer.overview_visited'],
      tourChapterId: 'observer-overview',
    },
    {
      id: 'observer-submissions',
      label: 'Inspect submissions',
      description: 'Open Submissions to review AIP and PIR status without changing records.',
      route: '/admin/submissions',
      completeOn: ['observer.submissions_visited'],
      tourChapterId: 'observer-submissions',
    },
    {
      id: 'observer-consolidation',
      label: 'Open consolidation response',
      description: 'Open Consolidation and find the management response workspace.',
      route: '/admin/consolidation-template',
      completeOn: ['observer.consolidation_visited'],
      tourChapterId: 'observer-consolidation',
    },
  ],
  hints: [],
  practiceTasks: [],
};
