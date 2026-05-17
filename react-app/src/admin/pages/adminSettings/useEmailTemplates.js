import { useMemo, useState } from 'react';
import api from '../../../lib/api.js';

const EMPTY_DRAFT = {
  key: '',
  label: '',
  subject: '',
  title: '',
  intro: '',
  body_html: '',
  accent_color: '#1d4ed8',
};

export function useEmailTemplates({ showToast }) {
  const [templates, setTemplates] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [formError, setFormError] = useState('');
  const [missingTable, setMissingTable] = useState(false);
  const [dirty, setDirty] = useState(false);

  const definitionByKey = useMemo(() => {
    const map = {};
    for (const def of definitions) map[def.key] = def;
    return map;
  }, [definitions]);

  const selectedDefinition = selectedKey ? definitionByKey[selectedKey] : null;

  const loadAll = async () => {
    setLoading(true);
    setFormError('');
    try {
      const [listRes, defsRes] = await Promise.all([
        api.get('/api/admin/email-templates'),
        api.get('/api/admin/email-templates/definitions'),
      ]);
      const list = Array.isArray(listRes.data) ? listRes.data : [];
      const defs = Array.isArray(defsRes.data) ? defsRes.data : [];
      setTemplates(list);
      setDefinitions(defs);
      setMissingTable(false);
      if (list.length > 0 && !selectedKey) {
        await selectTemplate(list[0].key, list, defs);
      }
    } catch (error) {
      console.error(error);
      const status = error?.response?.status;
      if (status === 500 || status === 404) {
        setMissingTable(true);
      }
      showToast?.(error.friendlyMessage ?? 'Failed to load email templates.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = async (key, listOverride, defsOverride) => {
    setSelectedKey(key);
    setLoadingDetail(true);
    setFormError('');
    setPreviewHtml('');
    setPreviewSubject('');
    try {
      const { data } = await api.get(`/api/admin/email-templates/${key}`);
      setDraft({
        key: data.key,
        label: data.label ?? '',
        subject: data.subject ?? '',
        title: data.title ?? '',
        intro: data.intro ?? '',
        body_html: data.body_html ?? '',
        accent_color: data.accent_color ?? '#1d4ed8',
      });
      setLoadedUpdatedAt(data.updated_at ?? null);
      setDirty(false);
      const defs = defsOverride ?? definitions;
      const list = listOverride ?? templates;
      if (defs.length === 0 || list.length === 0) {
        // No-op: caller may not have run loadAll yet.
      }
    } catch (error) {
      showToast?.(error.friendlyMessage ?? 'Failed to load template.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const updateField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const refreshPreview = async () => {
    if (!selectedKey) return;
    setPreviewLoading(true);
    try {
      const { data } = await api.post(
        `/api/admin/email-templates/${selectedKey}/preview`,
        {
          label: draft.label,
          subject: draft.subject,
          title: draft.title,
          intro: draft.intro,
          body_html: draft.body_html,
          accent_color: draft.accent_color,
        },
      );
      setPreviewHtml(data.html ?? '');
      setPreviewSubject(data.subject ?? '');
      setFormError('');
    } catch (error) {
      const message = error?.response?.data?.error
        ?? error.friendlyMessage
        ?? 'Failed to render preview.';
      setFormError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const save = async () => {
    if (!selectedKey) return;
    setSaving(true);
    setFormError('');
    try {
      const { data } = await api.put(
        `/api/admin/email-templates/${selectedKey}`,
        {
          label: draft.label,
          subject: draft.subject,
          title: draft.title,
          intro: draft.intro,
          body_html: draft.body_html,
          accent_color: draft.accent_color,
          updated_at: loadedUpdatedAt,
        },
      );
      setLoadedUpdatedAt(data.updated_at ?? null);
      setDirty(false);
      setTemplates((prev) =>
        prev.map((row) =>
          row.key === selectedKey
            ? {
                ...row,
                label: data.label,
                subject: data.subject,
                title: data.title,
                intro: data.intro,
                accent_color: data.accent_color,
                updated_at: data.updated_at,
                updated_by: data.updated_by,
              }
            : row,
        ),
      );
      showToast?.('Template saved.');
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.error
        ?? error.friendlyMessage
        ?? 'Failed to save template.';
      if (status === 409) {
        setFormError(`${message} Reload the template to bring in the latest content before editing.`);
      } else {
        setFormError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const restoreDefault = async () => {
    if (!selectedKey) return;
    setFormError('');
    try {
      const { data } = await api.get(
        `/api/admin/email-templates/${selectedKey}/default`,
      );
      setDraft({
        key: data.key,
        label: data.label ?? '',
        subject: data.subject ?? '',
        title: data.title ?? '',
        intro: data.intro ?? '',
        body_html: data.body_html ?? '',
        accent_color: data.accent_color ?? '#1d4ed8',
      });
      setPreviewHtml(data.preview?.html ?? '');
      setPreviewSubject(data.preview?.subject ?? '');
      setDirty(true);
      showToast?.('Default loaded. Review and click Save to apply.');
    } catch (error) {
      setFormError(error.friendlyMessage ?? 'Failed to restore default.');
    }
  };

  const sendTest = async () => {
    if (!selectedKey) return;
    setTesting(true);
    try {
      const { data } = await api.post(
        `/api/admin/email-templates/${selectedKey}/test-send`,
      );
      if (data.status === 'sent') {
        showToast?.(`Test email sent to ${data.target}.`);
      } else if (data.status === 'skipped') {
        showToast?.(
          `Test email skipped: SMTP is disabled. Enable it in Email Configuration.`,
          'error',
        );
      } else {
        showToast?.(
          `Test email failed: ${data.error ?? 'unknown error'}.`,
          'error',
        );
      }
    } catch (error) {
      showToast?.(error.friendlyMessage ?? 'Test send failed.', 'error');
    } finally {
      setTesting(false);
    }
  };

  return {
    templates,
    definitions,
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
    loadedUpdatedAt,
    loadAll,
    selectTemplate,
    updateField,
    refreshPreview,
    save,
    restoreDefault,
    sendTest,
  };
}
