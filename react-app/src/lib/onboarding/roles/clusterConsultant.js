export const clusterConsultantRoleConfig = {
  hasChecklist: true,
  isWelcomeEligible: true,
  content: {
    title: 'Welcome to Cluster Consultant access',
    subtitle: 'Your workspace is scoped to one assigned cluster.',
    bullets: [
      'Monitor cluster submissions from the lightweight dashboard.',
      'Open PIR details to verify accomplishments and gaps.',
      'Leave overall or section-specific remarks when corrections are needed.',
    ],
  },
  title: 'Welcome to Cluster Consultant access',
  subtitle: 'Your guide covers cluster monitoring and PIR remarks for your assigned cluster.',
  tasks: [
    {
      id: 'cluster-consultant-dashboard',
      label: 'Open the cluster dashboard',
      description: 'Review PIR movement for the cluster assigned to your account.',
      href: '/cluster-consultant',
      completeOn: ['clusterConsultant.dashboard_visited'],
    },
    {
      id: 'cluster-consultant-pirs',
      label: 'Open a PIR detail',
      description: 'Inspect a PIR before adding overall or section-specific remarks.',
      href: '/cluster-consultant',
      completeOn: ['clusterConsultant.pir_detail_visited'],
    },
  ],
};
