export const clusterRoleConfig = {
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
};
