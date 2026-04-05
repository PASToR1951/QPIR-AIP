/**
 * Maps technical server error strings to user-friendly messages.
 *
 * Usage:
 *   import { getFriendlyError } from './lib/errorMessages.js';
 *   message: getFriendlyError(error.response?.data?.error, 'Fallback message')
 */

// Tier 1: exact string match
const EXACT_MAP = {
  // ── Budget ──────────────────────────────────────────────────────────────────
  'Invalid budget amount: must be a non-negative number':
    'One or more budget fields contain an invalid amount. Please enter a valid positive number.',
  'Invalid budget amount: must be a non-negative number not exceeding 999,999,999,999':
    'A budget amount exceeds the maximum allowed value. Please enter a smaller amount.',
  'Invalid budget_from_division: must be a non-negative number':
    'The "Budget from Division" field must be a valid positive number.',
  'Invalid budget_from_co_psf: must be a non-negative number':
    'The "Budget from CO/PSF" field must be a valid positive number.',

  // ── Required fields ──────────────────────────────────────────────────────────
  'program_title is required':
    'Please select a program before continuing.',
  'program_title and quarter are required':
    'Please select both a program and a quarter before continuing.',

  // ── Duplicate / conflict ─────────────────────────────────────────────────────
  'An AIP has already been submitted for this program and year':
    'An AIP for this program and year has already been submitted.',
  'A PIR has already been submitted for this quarter':
    'A PIR for this quarter has already been submitted.',
  'A PIR has already been submitted for this program and quarter.':
    'A PIR for this program and quarter has already been submitted.',
  'A record already exists for this request':
    'A submission already exists for this request. Duplicate entries are not allowed.',
  'Email already exists':
    'That email address is already registered. Please use a different email.',
  'A program with that title already exists for that applicability level.':
    'A program with that title already exists. Please use a unique title.',
  'A program with that title already exists in that division.':
    'A program with that title already exists in that division. Please use a unique title.',
  'Cannot delete a cluster that has schools assigned to it':
    'This cluster cannot be deleted because it still has schools assigned to it.',
  'Maximum of 10 Cluster Coordinator accounts allowed.':
    'The maximum number of Cluster Coordinator accounts (10) has already been reached.',

  // ── Submission window ────────────────────────────────────────────────────────
  'Submission window has not opened yet for this quarter.':
    'The submission window for this quarter has not opened yet. Please check back later.',
  'The submission window for this quarter is closed.':
    'The submission window for this quarter is now closed. No further submissions can be accepted.',

  // ── Authorization ────────────────────────────────────────────────────────────
  'Authentication required':
    'Your session has expired or you are not logged in. Please sign in again.',
  'Unauthorized':
    'Your session has expired or you are not logged in. Please sign in again.',
  'Forbidden':
    'You do not have permission to perform this action.',
  'Access denied':
    'You do not have permission to perform this action.',
  'You are not assigned to this program':
    'You are not assigned to this program. Contact an administrator if this is an error.',
  'Not authorized to request edit for this AIP':
    'You are not authorized to request an edit for this AIP.',

  // ── State constraints ────────────────────────────────────────────────────────
  'This AIP has been archived and cannot be modified':
    'This AIP has been archived and can no longer be modified.',
  'This AIP can no longer be edited in its current state.':
    'This AIP cannot be edited in its current state. It may already be under review or approved.',
  'This PIR can no longer be edited — it is currently under review.':
    'This PIR cannot be edited because it is currently under review.',
  'This AIP cannot be deleted in its current state.':
    'This AIP cannot be deleted. It may be under review or already approved.',
  'This PIR can no longer be deleted — it is currently under review.':
    'This PIR cannot be deleted because it is currently under review.',
  'Edit requests can only be made for Approved AIPs':
    'Edit requests can only be made for AIPs that have been approved.',
  'PIR is not in a reviewable state':
    'This PIR is not in a state that allows review.',
  'PIR is already under review':
    'This PIR is already under review.',
  'PIR is not pending CES review':
    'This PIR is not currently pending CES review.',
  'PIR is not pending Cluster Head review':
    'This PIR is not currently pending Cluster Head review.',
  'Cannot delete your own account':
    'You cannot delete your own account.',

  // ── Not found ────────────────────────────────────────────────────────────────
  'Resource not found':
    'The requested resource could not be found.',
  'Not found':
    'The requested item could not be found.',
  'PIR not found':
    'The requested PIR could not be found. It may have been deleted.',
  'AIP not found':
    'The requested AIP could not be found. It may have been deleted.',
  'No AIP found for this program and year':
    'No AIP has been submitted yet for this program and year.',
  'No submitted AIP found':
    'No submitted AIP could be found for this program.',
  'No AIP found for this program':
    'No AIP could be found for this program.',
  'No submitted PIR found for this quarter':
    'No submitted PIR was found for this quarter.',
  'User not found':
    'The requested user account could not be found.',

  // ── Field length / type ──────────────────────────────────────────────────────
  'Remarks cannot exceed 5000 characters':
    'Remarks must be 5,000 characters or fewer. Please shorten your entry.',
  'Notes cannot exceed 5000 characters':
    'Notes must be 5,000 characters or fewer. Please shorten your entry.',
  'remarks must be a string':
    'Please enter remarks as plain text.',
  'activity_review_id and notes are required':
    'Both an activity and notes are required to save this review.',

  // ── User management ──────────────────────────────────────────────────────────
  'name is required for this role':
    "A name is required for this role. Please provide the user's full name.",
  'first_name and last_name are required for Division Personnel':
    'First name and last name are required for Division Personnel accounts.',
  'email, password, role are required':
    'Email, password, and role are all required to create a new user.',

  // ── Deadline / schedule validation ───────────────────────────────────────────
  'Invalid year (must be 2020\u20132100)':
    'Please enter a valid year between 2020 and 2100.',
  'Invalid quarter (must be 1\u20134)':
    'Please enter a valid quarter (1 through 4).',
  'Invalid date':
    'The date you entered is not valid. Please check the format.',
  'Invalid open_date':
    'The open date you entered is not valid. Please check the format.',
  'Open date must be before deadline':
    'The open date must be set before the submission deadline.',
  'Grace period must be between 0 and 30 days':
    'The grace period must be between 0 and 30 days.',
  'Cluster number is required':
    'A cluster number is required.',

  // ── Admin validation ─────────────────────────────────────────────────────────
  'Invalid cluster':
    'The cluster value is not valid. Please select a valid cluster.',
  'Invalid status':
    'The status value is not valid. Please select a valid status.',
  "Unsupported export format. Use 'csv' or 'xlsx'.":
    "Unsupported export format. Please choose either CSV or XLSX.",

  // ── Auth ─────────────────────────────────────────────────────────────────────
  'Login failed':
    'Sign-in failed due to an unexpected error. Please try again.',

  // ── System / rate limiting ───────────────────────────────────────────────────
  'Too many requests, please try again later.':
    'Too many requests have been made. Please wait a moment and try again.',
  'Rate limit exceeded for reports. Please wait.':
    'Too many report requests have been made. Please wait a moment and try again.',
  'Request body too large (max 2MB)':
    'The submitted data is too large. Please reduce the amount of content and try again.',
};

// Tier 2: regex patterns for dynamic error strings (tested in order, first match wins)
const PATTERN_MAP = [
  // "Program 'XYZ' not found"
  [
    /^Program '.+' not found$/,
    'The specified program could not be found. It may have been removed or renamed.',
  ],
  // "A CES-SGOD account already exists. Only one account per CES role is allowed."
  [
    /^A .+ account already exists\. Only one account per CES role is allowed\.$/,
    'An account for this CES role already exists. Only one account per CES role is permitted.',
  ],
  // "Cluster 3 already exists"
  [
    /^Cluster \d+ already exists$/,
    'A cluster with that number already exists. Please choose a different cluster number.',
  ],
  // Generic program title duplicate (safety net)
  [
    /^A program with that title already exists/,
    'A program with that title already exists. Please use a unique title.',
  ],
];

const DEFAULT_FALLBACK =
  'An unexpected error occurred. Please try again or contact your administrator.';

/**
 * Convert a raw server error string into a user-friendly message.
 *
 * @param {string|undefined|null} technicalMessage - The error string from the server.
 * @param {string} [fallback] - Optional context-specific fallback. If omitted,
 *   a generic fallback is used for unmapped errors.
 * @returns {string} A user-friendly error message.
 */
export function getFriendlyError(technicalMessage, fallback) {
  if (!technicalMessage || typeof technicalMessage !== 'string') {
    return fallback ?? DEFAULT_FALLBACK;
  }

  // Tier 1: exact match
  if (Object.prototype.hasOwnProperty.call(EXACT_MAP, technicalMessage)) {
    return EXACT_MAP[technicalMessage];
  }

  // Tier 2: pattern match
  for (const [pattern, friendly] of PATTERN_MAP) {
    if (pattern.test(technicalMessage)) {
      return friendly;
    }
  }

  // No match — return caller's fallback or the default
  return fallback ?? DEFAULT_FALLBACK;
}
