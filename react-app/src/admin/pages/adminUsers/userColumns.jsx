import React from 'react';
import { PencilSimple, Key, ClockCounterClockwise, LockKey, LockKeyOpen, Trash } from '@phosphor-icons/react';
import { withResponsiveHide } from '../../components/dataTableColumns.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';

export function buildUserColumns({ onEdit, onManageSessions, onResetPassword, onToggle, onDelete, showProgTooltip, hideProgTooltip }) {
  return withResponsiveHide([
    {
      key: 'name', label: 'Name', sortable: true, render: (v, row) => {
        const display = (row.role === 'Division Personnel' || row.role === 'School') && row.first_name && row.last_name
          ? `${row.first_name}${row.middle_initial ? ` ${row.middle_initial}.` : ''} ${row.last_name}`
          : (v || (row.role === 'School' ? row.school?.name : null) || row.email);
        return <span className="font-bold text-slate-900 dark:text-slate-100">{display}</span>;
      },
    },
    { key: 'email', label: 'Email', render: v => <span className="text-sm text-slate-500 dark:text-slate-400">{v}</span> },
    { key: 'role', label: 'Role', render: v => <StatusBadge status={v} size="xs" /> },
    {
      key: 'school', label: 'Affiliation',
      render: (_, row) => <span className="text-xs text-slate-500 dark:text-slate-400">{row.role === 'Division Personnel' ? 'Division' : (row.school?.name ?? '—')}</span>,
    },
    {
      key: 'programs', label: 'Programs', render: (_, row) => {
        const progs = row.programs ?? [];
        if (!progs.length) return <span className="text-slate-400 dark:text-slate-600">—</span>;
        if (row.role !== 'School' && progs.length === 1)
          return <span className="text-xs text-slate-500 dark:text-slate-400">{progs[0].title}</span>;
        return (
          <span
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-default underline decoration-dotted underline-offset-2"
            onMouseEnter={e => showProgTooltip(e, progs)}
            onMouseLeave={hideProgTooltip}
          >
            {progs.length} {progs.length === 1 ? 'Program' : 'Programs'}
          </span>
        );
      },
    },
    {
      key: 'is_active', label: 'Status', render: v => (
        <span
          title={v ? 'account is active — user can log in' : 'account is disabled — user cannot log in, but their data is preserved'}
          className={`inline-flex items-center gap-1.5 text-xs font-bold cursor-default ${v ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${v ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {v ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'id', label: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(row)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
            <PencilSimple size={17} />
          </button>
          <button onClick={() => onResetPassword(row)} title="Reset Password" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
            <Key size={17} />
          </button>
          <button onClick={() => onManageSessions(row)} title="Sessions" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
            <ClockCounterClockwise size={17} />
          </button>
          <button onClick={() => onToggle(row)} title={row.is_active ? 'Disable' : 'Enable'}
            className={`p-1.5 rounded-lg transition-colors ${row.is_active ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}>
            {row.is_active ? <LockKey size={17} /> : <LockKeyOpen size={17} />}
          </button>
          <button onClick={() => onDelete(row)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
            <Trash size={17} />
          </button>
        </div>
      ),
    },
  ], {
    lg: ['email', 'school'],
    xl: ['programs'],
  });
}
