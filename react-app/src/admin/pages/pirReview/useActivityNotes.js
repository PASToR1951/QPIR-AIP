import { useState } from 'react';
import api from '../../../lib/api.js';

/**
 * Shared note-saving logic used by both ActivityRow (inline table) and
 * SidePIRCard (side-by-side view). Saves on blur when the value changed.
 */
export function useActivityNotes({ review, pirId, onSaveNotes, canEditNotes }) {
  const [notes, setNotes] = useState(review.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const handleBlur = async () => {
    if (!canEditNotes || notes === (review.admin_notes ?? '')) return;
    setSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      await api.patch(`/api/admin/pirs/${pirId}/activity-notes`, {
        activity_review_id: review.id,
        notes,
      });
      onSaveNotes(review.id, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return { notes, setNotes, saving, saved, saveError, handleBlur };
}
