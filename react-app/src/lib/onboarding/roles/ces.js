export const cesRoleConfig = {
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
};
