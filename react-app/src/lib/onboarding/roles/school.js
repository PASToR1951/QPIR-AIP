export const schoolRoleConfig = {
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
          target: 'dashboard-summary',
          title: 'Your Dashboard',
          description: 'This is your home base. It shows a quick summary of where you stand — whether your AIP is done, how many PIR reports are still pending, and what needs attention next.',
          placement: 'bottom',
        },
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
        {
          target: 'dashboard-submission-history',
          title: 'Submission History',
          description: 'Your past and pending submissions appear here. Use this to track the status of each report — whether it is still in draft, under review, or already approved.',
          placement: 'top',
        },
        {
          target: 'dashboard-profile-menu',
          title: 'Account & Logout',
          description: 'Click your profile icon here to open the account menu. At the bottom of the menu you will find the Logout button — use it when you are done for the day.',
          placement: 'bottom',
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
};
