import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Trash } from '@phosphor-icons/react';
import { Spinner } from './Spinner.jsx';
import api from '../../lib/api.js';
import { FormModal } from './FormModal.jsx';
import { ConfirmModal } from './ConfirmModal.jsx';
import { SearchableSelect } from './SearchableSelect.jsx';
import {
  OUTCOME_OPTIONS,
  findTargetByDescription,
  getTargetOptionsForOutcome,
} from '../../forms/aip/strategicAlignmentCatalog.js';

const EMPTY_FORM = {
  outcome: '',
  targetDescription: '',
  indicators: [''],
};

function toFormState(template) {
  if (!template) {
    return { ...EMPTY_FORM };
  }

  const indicators = Array.isArray(template.indicators) && template.indicators.length > 0
    ? template.indicators.map((indicator) => indicator.description ?? '').filter(Boolean)
    : [''];

  return {
    outcome: template.outcome ?? '',
    targetDescription: template.target_description ?? '',
    indicators: indicators.length > 0 ? indicators : [''],
  };
}

export default function ProgramTemplatesModal({
  open,
  program,
  onClose,
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState('');
  const [hasTemplate, setHasTemplate] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const outcomeOptions = useMemo(
    () => OUTCOME_OPTIONS.map((outcome) => ({ value: outcome, label: outcome })),
    [],
  );
  const targetOptions = useMemo(
    () => getTargetOptionsForOutcome(form.outcome),
    [form.outcome],
  );

  useEffect(() => {
    if (!open) {
      setDeleteOpen(false);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || !program?.id) {
      return;
    }

    let cancelled = false;

    const loadTemplate = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/api/admin/programs/${program.id}/template`);
        if (cancelled) {
          return;
        }

        setHasTemplate(Boolean(response.data));
        setForm(toFormState(response.data));
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.friendlyMessage ?? 'Template could not be loaded.');
          setHasTemplate(false);
          setForm({ ...EMPTY_FORM });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTemplate();

    return () => {
      cancelled = true;
    };
  }, [open, program?.id]);

  const saveDisabled = loading || !form.outcome || !form.targetDescription.trim();

  const handleSave = async () => {
    if (!program?.id) {
      return;
    }

    const target = findTargetByDescription(form.outcome, form.targetDescription);
    if (!target) {
      setError('Select a valid target from the approved list.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        outcome: form.outcome,
        target_code: target.code,
        target_description: target.description,
        indicators: form.indicators
          .map((description) => description.trim())
          .filter(Boolean)
          .map((description) => ({ description })),
      };

      await api.put(`/api/admin/programs/${program.id}/template`, payload);
      setHasTemplate(true);
      onSaved?.(hasTemplate ? 'Template updated.' : 'Template saved.');
      onClose();
    } catch (requestError) {
      setError(requestError.friendlyMessage ?? 'Template could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!program?.id) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.delete(`/api/admin/programs/${program.id}/template`);
      setDeleteOpen(false);
      setHasTemplate(false);
      onSaved?.('Template deleted.');
      onClose();
    } catch (requestError) {
      setError(requestError.friendlyMessage ?? 'Template could not be deleted.');
    } finally {
      setSaving(false);
    }
  };

  const updateIndicator = (index, value) => {
    setForm((current) => ({
      ...current,
      indicators: current.indicators.map((indicator, indicatorIndex) => (
        indicatorIndex === index ? value : indicator
      )),
    }));
  };

  const removeIndicator = (index) => {
    setForm((current) => {
      const nextIndicators = current.indicators.filter((_, indicatorIndex) => indicatorIndex !== index);
      return {
        ...current,
        indicators: nextIndicators.length > 0 ? nextIndicators : [''],
      };
    });
  };

  const addIndicator = () => {
    setForm((current) => ({
      ...current,
      indicators: [...current.indicators, ''],
    }));
  };

  return (
    <>
      <FormModal
        open={open}
        title={program ? `Program Template: ${program.title}` : 'Program Template'}
        subtitle="Set the default outcome, target, and indicators used when a blank AIP starts."
        icon={BookOpen}
        onSave={handleSave}
        onCancel={onClose}
        loading={saving}
        saveLabel={hasTemplate ? 'Save Changes' : 'Save Template'}
        saveDisabled={saveDisabled}
        wide
      >
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Outcome
                </label>
                <SearchableSelect
                  options={outcomeOptions}
                  value={form.outcome}
                  onChange={(value) => {
                    setError('');
                    setForm((current) => ({
                      ...current,
                      outcome: value,
                      targetDescription: '',
                    }));
                  }}
                  placeholder="Select outcome"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Outcome Target
                </label>
                <SearchableSelect
                  options={targetOptions}
                  value={form.targetDescription}
                  onChange={(value) => {
                    setError('');
                    setForm((current) => ({
                      ...current,
                      targetDescription: value,
                    }));
                  }}
                  placeholder={form.outcome ? 'Select target' : 'Select an outcome first'}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-border dark:bg-dark-base">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Indicators
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Leave annual targets blank in the template. Users can fill them in on the AIP.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addIndicator}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
                >
                  <Plus size={14} weight="bold" />
                  Add
                </button>
              </div>
              <div className="space-y-3">
                {form.indicators.map((indicator, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <textarea
                      value={indicator}
                      onChange={(event) => updateIndicator(index, event.target.value)}
                      rows={2}
                      placeholder={`Indicator ${index + 1}`}
                      className="min-h-[82px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-indigo-400 dark:border-dark-border dark:bg-dark-surface dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeIndicator(index)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/30"
                      title="Remove indicator"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {hasTemplate && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30"
                >
                  <Trash size={14} weight="bold" />
                  Delete Template
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm font-bold text-red-500">{error}</p>
            )}
          </div>
        )}
      </FormModal>

      <ConfirmModal
        open={deleteOpen}
        title="Delete Program Template"
        message={`Delete the saved template for "${program?.title}"? Blank AIPs for this program will stop auto-filling.`}
        variant="danger"
        confirmLabel="Delete Template"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={saving}
      />
    </>
  );
}
