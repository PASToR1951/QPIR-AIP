import {
  CONTACT_EMAIL,
  TOUR_VERSION,
  getTourChapter,
} from './tourChapters.js';

function withHelpMetadata(chapterId, overrides = {}) {
  const chapter = getTourChapter(chapterId);
  if (!chapter) return null;

  return {
    ...chapter,
    ...overrides,
    autoStart: false,
    storageKey: `help:toursSeen:${chapter.id}:${TOUR_VERSION}`,
    contactEmail: CONTACT_EMAIL,
    contactHref: `mailto:${CONTACT_EMAIL}`,
  };
}

export const portalHelpConfig = {
  userDashboard: withHelpMetadata('user-dashboard'),
  aip: withHelpMetadata('aip'),
  pir: withHelpMetadata('pir'),
  cesDashboard: withHelpMetadata('ces-dashboard'),
  cesReview: withHelpMetadata('ces-review'),
  divisionQueue: withHelpMetadata('division-focal-queue'),
  divisionReview: withHelpMetadata('division-focal-review'),
  adminDashboard: withHelpMetadata('admin-dashboard'),
  adminUsers: withHelpMetadata('admin-users'),
  adminResources: withHelpMetadata('admin-resources'),
  adminSubmissions: withHelpMetadata('admin-submissions'),
  adminReportsSettings: withHelpMetadata('admin-reports-settings'),
  observerOverview: withHelpMetadata('observer-overview'),
  observerSubmissions: withHelpMetadata('observer-submissions'),
  observerConsolidation: withHelpMetadata('observer-consolidation'),
};

export function getPortalHelp(pathname, roleKey) {
  if (pathname === '/') return portalHelpConfig.userDashboard;
  if (pathname === '/aip') return portalHelpConfig.aip;
  if (pathname === '/pir') return portalHelpConfig.pir;

  if (pathname === '/ces') return portalHelpConfig.cesDashboard;
  if (pathname.startsWith('/ces/pirs/') || pathname.startsWith('/ces/aips/')) {
    return portalHelpConfig.cesReview;
  }

  if (pathname === '/division') return portalHelpConfig.divisionQueue;
  if (pathname.startsWith('/division/')) return portalHelpConfig.divisionReview;

  if (pathname.startsWith('/admin')) {
    const isObserver = roleKey === 'observer';
    if (pathname === '/admin') {
      return isObserver ? portalHelpConfig.observerOverview : portalHelpConfig.adminDashboard;
    }
    if (pathname === '/admin/users') return portalHelpConfig.adminUsers;
    if (pathname === '/admin/schools' || pathname === '/admin/programs') {
      return portalHelpConfig.adminResources;
    }
    if (pathname === '/admin/submissions') {
      return isObserver ? portalHelpConfig.observerSubmissions : portalHelpConfig.adminSubmissions;
    }
    if (pathname === '/admin/consolidation-template') {
      return isObserver ? portalHelpConfig.observerConsolidation : portalHelpConfig.adminReportsSettings;
    }
    if (pathname === '/admin/reports' || pathname === '/admin/settings') {
      return portalHelpConfig.adminReportsSettings;
    }
    return isObserver ? portalHelpConfig.observerOverview : portalHelpConfig.adminDashboard;
  }

  return null;
}
