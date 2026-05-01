export const CURRENT_VERSION = '1.2.0-beta';

export const CHANGELOG = [
  {
    version: '1.2.0-beta',
    date: '2026-04-30',
    title: 'AIP-PIR Beta 3',
    description:
      'Beta 3 adds the focal person recommendation chain for school submissions and migrates school reporting windows from quarters to trimesters.',
    changes: [
      {
        type: 'feature',
        text: 'School AIP and PIR submissions now enter a Division Personnel focal person recommendation step before CES and Cluster Head review.',
      },
      {
        type: 'feature',
        text: 'Admins can assign program focal persons, and focal reviewers now have dedicated AIP/PIR queues and recommendation or return actions.',
      },
      {
        type: 'feature',
        text: 'CES reviewers now have an AIP review queue for focal-recommended school AIPs.',
      },
      {
        type: 'feature',
        text: 'School reporting periods now use trimesters with admin-managed trimester submission windows.',
      },
      {
        type: 'improvement',
        text: 'PIR monitoring factors are now captured per activity for clearer review, PDF, and report output.',
      },
      {
        type: 'improvement',
        text: 'AIPs and PIRs now support soft-delete timestamps for retention and privacy workflows.',
      },
      {
        type: 'security',
        text: 'Session restore and multi-device logout flows were hardened for safer shared-device and stale-session handling.',
      },
      {
        type: 'fix',
        text: 'AIP/PIR writes and admin review writes now use advisory-lock concurrency protections to prevent duplicate or conflicting updates.',
      },
      {
        type: 'improvement',
        text: 'Admin submissions, PIR review, session management, dashboard insights, and status badges were cleaned up for the Beta 3 workflow.',
      },
      {
        type: 'fix',
        text: 'PIR profile lifecycle updates lock AIP-derived functional division values and keep read-only back navigation from triggering draft saves.',
      },
      {
        type: 'docs',
        text: 'Documentation is being aligned with the DepEd Monitoring and Evaluation Manual, including PIR timelines, MOVs, roles, and YEPE concepts.',
      },
    ],
  },
  {
    version: '1.1.0-beta',
    date: '2026-04-23',
    title: 'Beta 2',
    description:
      'Beta release for the AIP-PIR management workflow.',
    changes: [
      {
        type: 'feature',
        text: 'Supports AIP and PIR submission, review, administration, reporting, notifications, and backups.',
      },
      {
        type: 'security',
        text: 'Includes role-based access, HttpOnly JWT sessions, audit logs, and privacy controls.',
      },
    ],
  },
];

export function getChangelog() {
  return CHANGELOG;
}
