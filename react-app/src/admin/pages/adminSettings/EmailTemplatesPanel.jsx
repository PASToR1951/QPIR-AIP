import React, { useEffect, useRef } from 'react';
import {
  EnvelopeOpen,
  FloppyDisk,
  PaperPlaneTilt,
  ArrowCounterClockwise,
  Eye,
  Warning,
} from '@phosphor-icons/react';
import { Spinner } from '../../components/Spinner.jsx';
import { SettingsCard } from './SettingsUI.jsx';

const FIELD_LIMITS = {
  subject: 200,
  title: 120,
  intro: 280,
  body_html: 64 * 1024,
  label: 60,
};

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

function CharCounter({ value, max }) {
  const used = (value ?? '').length;
  const over = used > max;
  return (
    <span className={`text-[10px] font-bold ${over ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
      {used}/{max}
    </span>
  );
}

function TemplatePicker({ templates, selectedKey, onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((template) => {
        const active = template.key === selectedKey;
        return (
          <button
            key={template.key}
            onClick={() => onSelect(template.key)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${
              active
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-dark-base text-slate-700 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:border-indigo-300'
            }`}
          >
            {template.label}
          </button>
        );
      })}
    </div>
  );
}

function VariableChips({ variables, onInsert }) {
  if (!variables || variables.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
        Variables
      </p>
      <div className="flex flex-wrap gap-1.5">
        {variables.map((variable) => (
          <button
            key={variable.name}
            type="button"
            onClick={() => onInsert(variable.name)}
            title={variable.description}
            className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-100 hover:bg-indigo-100 dark:bg-dark-base dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-dark-border transition-colors"
          >
            {`{{${variable.name}}}`}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, max, mono, lines, placeholder, onFocus }) {
  const Tag = lines && lines > 1 ? 'textarea' : 'input';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
        <CharCounter value={value} max={max} />
      </div>
      <Tag
        value={value ?? ''}
        rows={lines}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className={`w-full px-3 py-2 text-sm bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all ${mono ? 'font-mono text-[12px] leading-snug' : ''}`}
      />
    </div>
  );
}

export function EmailTemplatesPanel({
  templates,
  selectedKey,
  selectedDefinition,
  draft,
  dirty,
  loading,
  loadingDetail,
  saving,
  testing,
  previewLoading,
  previewHtml,
  previewSubject,
  formError,
  missingTable,
  loadAll,
  selectTemplate,
  updateField,
  refreshPreview,
  save,
  restoreDefault,
  sendTest,
}) {
  const fieldRefs = useRef({});
  const focusedFieldRef = useRef('body_html');

  useEffect(() => {
    if (templates.length === 0 && !loading && !missingTable) {
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh preview on first load of a template so the iframe isn't blank.
  useEffect(() => {
    if (!selectedKey) return;
    if (loadingDetail) return;
    if (previewHtml) return;
    refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, loadingDetail]);

  const handleInsertVariable = (varName) => {
    const field = focusedFieldRef.current;
    if (!field) return;
    const el = fieldRefs.current[field];
    const token = `{{${varName}}}`;
    if (!el) {
      updateField(field, (draft?.[field] ?? '') + token);
      return;
    }
    const start = el.selectionStart ?? (el.value?.length ?? 0);
    const end = el.selectionEnd ?? start;
    const current = draft?.[field] ?? '';
    const next = current.slice(0, start) + token + current.slice(end);
    updateField(field, next);
    // Reset cursor after the inserted token on next tick.
    requestAnimationFrame(() => {
      try {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      } catch { /* select range may throw on certain inputs; ignore */ }
    });
  };

  const accentValid = HEX_REGEX.test(draft.accent_color ?? '');

  if (missingTable) {
    return (
      <SettingsCard
        icon={EnvelopeOpen}
        iconBg="bg-rose-100 dark:bg-rose-950/50"
        iconColor="text-rose-600 dark:text-rose-400"
        title="Email Templates"
        description="Template storage is not yet available."
      >
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30">
          <Warning size={18} weight="fill" className="text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="text-sm text-rose-700 dark:text-rose-300">
            <p className="font-bold">Email templates table is missing.</p>
            <p className="mt-1 leading-relaxed">
              Run the latest database migrations to enable the template editor.
              Outbound emails continue to send using the built-in defaults.
            </p>
          </div>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      icon={EnvelopeOpen}
      iconBg="bg-indigo-100 dark:bg-indigo-950/50"
      iconColor="text-indigo-600 dark:text-indigo-400"
      title="Email Templates"
      description="Edit the wording of system-sent emails. The branded header/footer scaffold stays fixed; only the highlighted parts are editable."
    >
      {loading ? (
        <div className="flex items-center justify-center h-32"><Spinner /></div>
      ) : (
        <>
          <TemplatePicker
            templates={templates}
            selectedKey={selectedKey}
            onSelect={selectTemplate}
            disabled={saving || loadingDetail}
          />

          {!selectedKey ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Choose a template above to start editing.</p>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center h-32"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Editor column */}
              <div className="space-y-4">
                {selectedDefinition?.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {selectedDefinition.description}
                  </p>
                )}

                <VariableChips
                  variables={selectedDefinition?.variables ?? []}
                  onInsert={handleInsertVariable}
                />

                <TextField
                  label="Internal Label"
                  value={draft.label}
                  onChange={(v) => updateField('label', v)}
                  max={FIELD_LIMITS.label}
                  onFocus={() => { focusedFieldRef.current = 'label'; }}
                />

                <div ref={(el) => { if (el) fieldRefs.current.subject = el.querySelector('input'); }}>
                  <TextField
                    label="Subject"
                    value={draft.subject}
                    onChange={(v) => updateField('subject', v)}
                    max={FIELD_LIMITS.subject}
                    onFocus={() => { focusedFieldRef.current = 'subject'; }}
                  />
                </div>

                <div ref={(el) => { if (el) fieldRefs.current.title = el.querySelector('input'); }}>
                  <TextField
                    label="Header Title"
                    value={draft.title}
                    onChange={(v) => updateField('title', v)}
                    max={FIELD_LIMITS.title}
                    onFocus={() => { focusedFieldRef.current = 'title'; }}
                  />
                </div>

                <div ref={(el) => { if (el) fieldRefs.current.intro = el.querySelector('textarea'); }}>
                  <TextField
                    label="Header Intro"
                    value={draft.intro}
                    onChange={(v) => updateField('intro', v)}
                    max={FIELD_LIMITS.intro}
                    lines={3}
                    onFocus={() => { focusedFieldRef.current = 'intro'; }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentValid ? draft.accent_color : '#1d4ed8'}
                      onChange={(e) => updateField('accent_color', e.target.value)}
                      className="h-9 w-12 rounded-lg border border-slate-200 dark:border-dark-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={draft.accent_color ?? ''}
                      onChange={(e) => updateField('accent_color', e.target.value)}
                      placeholder="#1d4ed8"
                      className={`flex-1 px-3 py-2 text-sm font-mono bg-white dark:bg-dark-base border rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                        accentValid ? 'border-slate-200 dark:border-dark-border focus:border-indigo-400' : 'border-rose-400 focus:border-rose-500'
                      }`}
                    />
                  </div>
                  {!accentValid && (
                    <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                      Must be a 6-digit hex color like #1d4ed8.
                    </p>
                  )}
                </div>

                <div ref={(el) => { if (el) fieldRefs.current.body_html = el.querySelector('textarea'); }}>
                  <TextField
                    label="Body HTML"
                    value={draft.body_html}
                    onChange={(v) => updateField('body_html', v)}
                    max={FIELD_LIMITS.body_html}
                    lines={16}
                    mono
                    onFocus={() => { focusedFieldRef.current = 'body_html'; }}
                  />
                </div>

                {formError && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-sm">
                    <Warning size={16} weight="fill" className="shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{formError}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={save}
                    disabled={saving || !dirty || !accentValid}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Spinner size="sm" variant="white" /> : <FloppyDisk size={15} weight="bold" />}
                    {saving ? 'Saving…' : 'Save Template'}
                  </button>
                  <button
                    onClick={refreshPreview}
                    disabled={previewLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-dark-base dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-colors"
                  >
                    {previewLoading ? <Spinner size="sm" variant="subtle" /> : <Eye size={15} weight="bold" />}
                    {previewLoading ? 'Rendering…' : 'Refresh Preview'}
                  </button>
                  <button
                    onClick={sendTest}
                    disabled={testing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-dark-base dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-colors"
                  >
                    {testing ? <Spinner size="sm" variant="subtle" /> : <PaperPlaneTilt size={15} weight="bold" />}
                    {testing ? 'Sending…' : 'Send Test To Me'}
                  </button>
                  <button
                    onClick={restoreDefault}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-dark-base border border-slate-200 dark:border-dark-border hover:border-indigo-300 text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-colors"
                  >
                    <ArrowCounterClockwise size={15} weight="bold" />
                    Restore Default
                  </button>
                </div>
              </div>

              {/* Preview column */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 dark:border-dark-border bg-slate-50/70 dark:bg-dark-base/70 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Subject preview</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 break-words">
                    {previewSubject || <span className="text-slate-400 italic">Refresh preview to render…</span>}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-dark-border overflow-hidden bg-white">
                  <iframe
                    title="Email preview"
                    sandbox="allow-same-origin"
                    srcDoc={previewHtml || '<p style="padding:24px;font-family:sans-serif;color:#94a3b8;">Click Refresh Preview to render the email…</p>'}
                    className="w-full"
                    style={{ minHeight: '640px', border: 'none' }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Preview renders with sample variable values. Email clients (especially Gmail) may apply additional styling overrides.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </SettingsCard>
  );
}
