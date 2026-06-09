import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  PencilSimple,
  Trash,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeSlash,
  ArrowClockwise,
  CheckCircle,
  Question as HelpCircle,
  BookOpen,
  WarningCircle as AlertCircle,
  Shield,
  Gear,
  ChatCircle,
  MagnifyingGlass,
  X as ClearIcon,
  CaretRight,
} from '@phosphor-icons/react';
import api from '../../lib/api.js';
import { Spinner } from '../components/Spinner.jsx';
import { FormModal } from '../components/FormModal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';

const ICON_MAP = {
  HelpCircle,
  BookOpen,
  AlertCircle,
  Shield,
  Gear,
  ChatCircle,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

function blankForm() {
  return {
    id: null,
    category: '',
    question: '',
    answer: '',
    icon_key: 'HelpCircle',
    is_active: true,
  };
}

export default function AdminFAQ() {
  const [items, setItems] = useState([]);
  const [supportedIcons, setSupportedIcons] = useState(ICON_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorForm, setEditorForm] = useState(blankForm());
  const [editorError, setEditorError] = useState(null);
  const [editorSaving, setEditorSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [renamingCategory, setRenamingCategory] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [expandedItems, setExpandedItems] = useState(() => new Set());
  const [collapsedCategories, setCollapsedCategories] = useState(() => new Set());

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    }
    return Array.from(map.entries());
  }, [items]);

  const filteredGrouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return grouped
      .map(([category, list]) => {
        const filtered = list.filter((item) => {
          if (visibilityFilter === 'visible' && !item.is_active) return false;
          if (visibilityFilter === 'hidden' && item.is_active) return false;
          if (!q) return true;
          return (
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
          );
        });
        return [category, filtered];
      })
      .filter(([, list]) => list.length > 0);
  }, [grouped, search, visibilityFilter]);

  const toggleExpand = (id) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCategoryCollapse = (category) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category); else next.add(category);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setVisibilityFilter('all');
  };

  const existingCategories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  async function load() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/api/admin/faqs');
      setItems(res.data.items || []);
      if (Array.isArray(res.data.supportedIcons) && res.data.supportedIcons.length > 0) {
        setSupportedIcons(res.data.supportedIcons.filter((k) => ICON_MAP[k]));
      }
    } catch (err) {
      setFetchError(err.friendlyMessage || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate(prefillCategory = '') {
    setEditorForm({ ...blankForm(), category: prefillCategory });
    setEditorError(null);
    setEditorOpen(true);
  }

  function openEdit(item) {
    setEditorForm({
      id: item.id,
      category: item.category,
      question: item.question,
      answer: item.answer,
      icon_key: item.icon_key,
      is_active: item.is_active,
    });
    setEditorError(null);
    setEditorOpen(true);
  }

  async function saveEditor() {
    const { id, category, question, answer, icon_key, is_active } = editorForm;
    if (!category.trim()) return setEditorError('Category is required');
    if (!question.trim()) return setEditorError('Question is required');
    if (!answer.trim()) return setEditorError('Answer is required');

    setEditorSaving(true);
    setEditorError(null);
    try {
      if (id) {
        await api.patch(`/api/admin/faqs/${id}`, {
          category: category.trim(),
          question: question.trim(),
          answer: answer.trim(),
          icon_key,
          is_active,
        });
        showToast('FAQ updated');
      } else {
        await api.post('/api/admin/faqs', {
          category: category.trim(),
          question: question.trim(),
          answer: answer.trim(),
          icon_key,
        });
        showToast('FAQ created');
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      setEditorError(err.friendlyMessage || err.response?.data?.error || 'Save failed');
    } finally {
      setEditorSaving(false);
    }
  }

  async function toggleActive(item) {
    try {
      await api.patch(`/api/admin/faqs/${item.id}`, { is_active: !item.is_active });
      showToast(item.is_active ? 'FAQ hidden from public list' : 'FAQ is now visible');
      await load();
    } catch (err) {
      showToast(err.friendlyMessage || 'Toggle failed', 'error');
    }
  }

  async function move(item, direction) {
    const siblings = grouped.find(([cat]) => cat === item.category)?.[1] ?? [];
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swapWith = direction === 'up' ? siblings[idx - 1] : siblings[idx + 1];
    if (!swapWith) return;

    const payload = {
      items: [
        { id: item.id, category: item.category, sort_order: swapWith.sort_order },
        { id: swapWith.id, category: swapWith.category, sort_order: item.sort_order },
      ],
    };
    try {
      await api.post('/api/admin/faqs/reorder', payload);
      await load();
    } catch (err) {
      showToast(err.friendlyMessage || 'Reorder failed', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/admin/faqs/${deleteTarget.id}`);
      showToast('FAQ deleted');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showToast(err.friendlyMessage || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function saveRename() {
    const from = renamingCategory;
    const to = renameValue.trim();
    if (!from || !to) return;
    if (from === to) {
      setRenamingCategory(null);
      return;
    }
    setRenameSaving(true);
    try {
      const res = await api.patch('/api/admin/faqs/category', { from, to });
      showToast(`Renamed category — ${res.data.updated} item${res.data.updated === 1 ? '' : 's'} updated`);
      setRenamingCategory(null);
      setRenameValue('');
      await load();
    } catch (err) {
      showToast(err.friendlyMessage || 'Rename failed', 'error');
    } finally {
      setRenameSaving(false);
    }
  }

  async function confirmRestore() {
    setRestoring(true);
    try {
      const res = await api.post('/api/admin/faqs/restore-defaults');
      showToast(`Restored ${res.data.restored} default question${res.data.restored === 1 ? '' : 's'}`);
      setRestoreOpen(false);
      await load();
    } catch (err) {
      showToast(err.friendlyMessage || 'Restore failed', 'error');
    } finally {
      setRestoring(false);
    }
  }

  const totalActive = items.filter((i) => i.is_active).length;
  const totalHidden = items.length - totalActive;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">FAQ Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Edit, reorder, hide, and add Help Center questions. Changes are live immediately on <code className="text-xs px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">/faq</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRestoreOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ArrowClockwise size={16} /> Restore defaults
          </button>
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500"
          >
            <Plus size={16} /> Add question
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Spinner /></div>
      )}

      {fetchError && (
        <div className="p-4 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-sm">
          {fetchError}
        </div>
      )}

      {!loading && !fetchError && grouped.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400 mb-4">No FAQs yet.</p>
          <button
            onClick={() => setRestoreOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500"
          >
            <ArrowClockwise size={16} /> Seed defaults
          </button>
        </div>
      )}

      {!loading && !fetchError && grouped.length > 0 && (
        <>
          <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative flex-1">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions, answers, categories…"
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  title="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <ClearIcon size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 shrink-0">
              {[
                { key: 'all',     label: 'All',     count: items.length },
                { key: 'visible', label: 'Visible', count: totalActive },
                { key: 'hidden',  label: 'Hidden',  count: totalHidden },
              ].map((opt) => {
                const active = visibilityFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setVisibilityFilter(opt.key)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                      active
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {opt.label} <span className="opacity-60">({opt.count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredGrouped.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400 mb-3">No questions match your filters.</p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ClearIcon size={14} /> Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGrouped.map(([category, list]) => {
                const Icon = ICON_MAP[list[0]?.icon_key] || HelpCircle;
                const isCollapsed = collapsedCategories.has(category);
                const totalInCategory = grouped.find(([c]) => c === category)?.[1].length ?? list.length;
                const showingFiltered = list.length !== totalInCategory;
                return (
                  <section key={category} className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-dark-surface overflow-hidden">
                    <header className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => toggleCategoryCollapse(category)}
                        title={isCollapsed ? 'Expand category' : 'Collapse category'}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 shrink-0"
                      >
                        <CaretRight size={14} weight="bold" className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                      </button>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 flex items-center justify-center shrink-0">
                        <Icon size={18} />
                      </div>
                      {renamingCategory === category ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && renameValue.trim()) saveRename();
                              if (e.key === 'Escape') setRenamingCategory(null);
                            }}
                            className="flex-1 min-w-0 px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                          <button
                            onClick={saveRename}
                            disabled={renameSaving || !renameValue.trim()}
                            className="px-2 py-1 text-xs font-bold rounded bg-indigo-600 text-white disabled:opacity-50"
                          >Save</button>
                          <button
                            onClick={() => setRenamingCategory(null)}
                            className="px-2 py-1 text-xs font-bold rounded border border-slate-200 dark:border-slate-700"
                          >Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleCategoryCollapse(category)}
                          className="flex-1 min-w-0 text-left flex items-center gap-2"
                        >
                          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate">
                            {category}
                          </h2>
                          <span className="text-xs font-medium text-slate-400 shrink-0">
                            {showingFiltered ? `${list.length} of ${totalInCategory}` : list.length}
                          </span>
                        </button>
                      )}
                      {renamingCategory !== category && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => { setRenamingCategory(category); setRenameValue(category); }}
                            className="px-2 py-1 text-xs font-bold rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >Rename</button>
                          <button
                            onClick={() => openCreate(category)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            <Plus size={12} /> Add here
                          </button>
                        </div>
                      )}
                    </header>

                    {!isCollapsed && (
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {list.map((item) => {
                          const isHidden = !item.is_active;
                          const isExpanded = expandedItems.has(item.id);
                          const fullList = grouped.find(([c]) => c === category)?.[1] ?? list;
                          const fullIdx = fullList.findIndex((s) => s.id === item.id);
                          const isFirst = fullIdx === 0;
                          const isLast = fullIdx === fullList.length - 1;
                          return (
                            <li
                              key={item.id}
                              className={`flex items-start gap-2 px-3 sm:px-4 py-2.5 transition-colors ${
                                isHidden ? 'bg-slate-50/70 dark:bg-slate-900/40' : ''
                              }`}
                            >
                              <div className="flex flex-col pt-0.5 shrink-0">
                                <button
                                  onClick={() => move(item, 'up')}
                                  disabled={isFirst}
                                  title="Move up"
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400"
                                ><ArrowUp size={12} weight="bold" /></button>
                                <button
                                  onClick={() => move(item, 'down')}
                                  disabled={isLast}
                                  title="Move down"
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400"
                                ><ArrowDown size={12} weight="bold" /></button>
                              </div>

                              <button
                                onClick={() => toggleExpand(item.id)}
                                className="flex-1 min-w-0 text-left flex items-start gap-2 py-0.5"
                              >
                                <CaretRight
                                  size={12}
                                  weight="bold"
                                  className={`mt-1.5 shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`font-bold text-sm break-words ${isHidden ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                      {item.question}
                                    </p>
                                    {isHidden && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                                        <EyeSlash size={10} weight="bold" /> Hidden
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className={`text-sm text-slate-500 dark:text-slate-400 mt-0.5 break-words leading-relaxed ${
                                      isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1'
                                    }`}
                                  >
                                    {item.answer}
                                  </p>
                                </div>
                              </button>

                              <div className="flex gap-0.5 shrink-0">
                                <button
                                  onClick={() => toggleActive(item)}
                                  title={item.is_active ? 'Hide from public list' : 'Show in public list'}
                                  className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                >
                                  {item.is_active ? <Eye size={16} /> : <EyeSlash size={16} />}
                                </button>
                                <button
                                  onClick={() => openEdit(item)}
                                  title="Edit"
                                  className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                ><PencilSimple size={16} /></button>
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  title="Delete"
                                  className="p-2 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500"
                                ><Trash size={16} /></button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      <FormModal
        open={editorOpen}
        title={editorForm.id ? 'Edit FAQ' : 'Add FAQ'}
        subtitle={editorForm.id ? 'Update this question and answer' : 'Add a new question to the Help Center'}
        icon={HelpCircle}
        wide
        loading={editorSaving}
        saveLabel={editorForm.id ? 'Save changes' : 'Create'}
        onSave={saveEditor}
        onCancel={() => setEditorOpen(false)}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
            <input
              list="faq-category-options"
              value={editorForm.category}
              onChange={(e) => setEditorForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Pick existing or type a new category"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
            <datalist id="faq-category-options">
              {existingCategories.map((cat) => <option key={cat} value={cat} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Icon</label>
            <div className="flex flex-wrap gap-2">
              {supportedIcons.map((key) => {
                const Icon = ICON_MAP[key];
                if (!Icon) return null;
                const active = editorForm.icon_key === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditorForm((f) => ({ ...f, icon_key: key }))}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${active ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <Icon size={14} /> {key}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-1">The icon shown for this question's category is taken from the first question in the category.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Question</label>
            <textarea
              rows={2}
              value={editorForm.question}
              onChange={(e) => setEditorForm((f) => ({ ...f, question: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Answer</label>
            <textarea
              rows={6}
              value={editorForm.answer}
              onChange={(e) => setEditorForm((f) => ({ ...f, answer: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm leading-relaxed"
            />
          </div>
          {editorForm.id && (
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={editorForm.is_active}
                onChange={(e) => setEditorForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Visible in the public FAQ
            </label>
          )}
          {editorError && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{editorError}</p>
          )}
        </div>
      </FormModal>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete this FAQ?"
        message={deleteTarget ? `"${deleteTarget.question}" will be removed from the Help Center. This cannot be undone, but you can re-add it manually or run Restore Defaults to recover original questions.` : ''}
        variant="danger"
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        open={restoreOpen}
        title="Restore default FAQs?"
        message="This appends any default questions that have been deleted. Existing FAQs are not modified or removed."
        variant="info"
        confirmLabel="Restore"
        loading={restoring}
        onConfirm={confirmRestore}
        onCancel={() => setRestoreOpen(false)}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
          <div
            role="status"
            aria-live="polite"
            className={`nc-slide-up pointer-events-auto flex items-center gap-3 pl-3 pr-2 py-2.5 rounded-2xl shadow-xl backdrop-blur-sm border ${
              toast.type === 'error'
                ? 'bg-white/95 dark:bg-slate-900/90 border-rose-200 dark:border-rose-900/70'
                : 'bg-white/95 dark:bg-slate-900/90 border-emerald-200 dark:border-emerald-900/70'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'error'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {toast.type === 'error'
                ? <AlertCircle size={18} weight="fill" />
                : <CheckCircle size={18} weight="fill" />}
            </div>
            <span
              className={`text-sm font-bold pr-1 ${
                toast.type === 'error'
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {toast.msg}
            </span>
            <button
              onClick={() => setToast(null)}
              title="Dismiss"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <ClearIcon size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
