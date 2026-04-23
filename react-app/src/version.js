export const CURRENT_VERSION = '1.1.0-beta';

export const CHANGELOG = [
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
