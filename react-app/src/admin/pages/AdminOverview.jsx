import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Buildings, Users, BookOpen, CalendarBlank, Eye, ChartBar, Wallet, CheckCircle } from '@phosphor-icons/react';
import { AdminLayout } from '../AdminLayout.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const API = import.meta.env.VITE_API_URL;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const DONUT_COLORS = ['#E94560', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

function relativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function complianceColor(pct) {
  if (pct >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40';
  if (pct >= 60) return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40';
  return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40';
}
function complianceText(pct) {
  if (pct >= 90) return 'text-emerald-700 dark:text-emerald-400';
  if (pct >= 60) return 'text-amber-700 dark:text-amber-400';
  return 'text-rose-700 dark:text-rose-400';
}
function deadlineColor(days) {
  if (days < 0) return 'rose';
  if (days <= 7) return 'rose';
  if (days <= 14) return 'amber';
  return 'emerald';
}

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/api/admin/overview`, { headers: authHeaders() })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  // PIR quarterly chart data from backend
  const quarterData = (data?.pirQuarterly ?? []).map((q) => ({
    name: q.quarter,
    Submitted: q.submitted,
    Approved: q.approved,
    'Under Review': q.underReview,
    Returned: q.returned,
  }));

  return (
    <AdminLayout title="Dashboard">
      {/* SDO Facade — restricted to this primary overview page only */}
      <div
        className="absolute inset-x-0 top-0 h-72 z-0 opacity-[0.03] dark:opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "url('/SDO_Facade.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)',
        }}
      />
      {loading ? (
        <div className="space-y-6">
          {/* Stat card skeletons */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-dark-border animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-16 bg-slate-200 dark:bg-dark-border rounded-lg animate-pulse" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-dark-border rounded-lg animate-pulse" />
                  <div className="h-3 w-20 bg-slate-200 dark:bg-dark-border rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          {/* Chart skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
                <div className="h-4 w-40 bg-slate-200 dark:bg-dark-border rounded-lg animate-pulse mb-4" />
                <div className="h-52 bg-slate-100 dark:bg-dark-border/50 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
          {/* Table skeleton */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
            <div className="h-4 w-36 bg-slate-200 dark:bg-dark-border rounded-lg animate-pulse mb-4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-dark-border/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={BookOpen}
              value={s?.pirSubmittedThisQ ?? '—'}
              label="Q PIR Submissions"
              sub={`${s?.pirApprovedThisQ ?? 0} approved · ${s?.pirReturnedThisQ ?? 0} returned`}
              color="indigo"
              onClick={() => navigate('/admin/submissions?type=pir')}
            />
            <StatCard
              icon={CheckCircle}
              value={`${s?.pirApprovalRate ?? 0}%`}
              label="PIR Approval Rate"
              sub={`${s?.pirApprovedThisYear ?? 0}/${s?.pirTotalThisYear ?? 0} approved this FY`}
              color={s?.pirApprovalRate >= 80 ? 'emerald' : s?.pirApprovalRate >= 50 ? 'amber' : 'rose'}
              onClick={() => navigate('/admin/reports')}
            />
            <StatCard
              icon={ChartBar}
              value={`${s?.avgPhysicalRate ?? 0}%`}
              label="Physical Accomplishment"
              sub={`${s?.totalActivitiesReviewed ?? 0} activities reviewed`}
              color={s?.avgPhysicalRate >= 80 ? 'emerald' : s?.avgPhysicalRate >= 50 ? 'amber' : 'rose'}
              onClick={() => navigate('/admin/reports')}
            />
            <StatCard
              icon={CalendarBlank}
              value={s?.daysLeft != null ? (s.daysLeft < 0 ? 'Overdue' : `${s.daysLeft}d`) : '—'}
              label={`Q${s?.currentQuarter} Deadline`}
              sub={s?.deadlineDate ? new Date(s.deadlineDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              color={deadlineColor(s?.daysLeft ?? 999)}
            />
            <StatCard
              icon={Buildings}
              value={`${s?.aipCompliantCount ?? 0}/${s?.totalSchools ?? 0}`}
              label="AIP Compliance"
              sub={`${s?.aipCompliancePct ?? 0}% schools compliant`}
              color={s?.aipCompliancePct >= 90 ? 'emerald' : s?.aipCompliancePct >= 60 ? 'amber' : 'rose'}
              onClick={() => navigate('/admin/submissions?type=aip')}
            />
            <StatCard
              icon={Wallet}
              value={`${s?.avgFinancialRate ?? 0}%`}
              label="Budget Utilization"
              sub="Avg. financial accomplishment"
              color={s?.avgFinancialRate >= 80 ? 'emerald' : s?.avgFinancialRate >= 50 ? 'amber' : 'rose'}
              onClick={() => navigate('/admin/reports')}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PIR Quarterly Progress (primary) */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-4">PIR Quarterly Progress</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={quarterData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid-line)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Submitted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Under Review" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Returned" fill="#E94560" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AIP Compliance by Cluster (secondary) */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-4">AIP Compliance by Cluster</h3>
              {data?.clusterCompliance?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.clusterCompliance}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="compliant"
                      nameKey="name"
                    >
                      {data.clusterCompliance.map((entry, i) => (
                        <Cell key={entry.id} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, props) => [
                        `${props.payload.compliant}/${props.payload.total} schools (${props.payload.pct}%)`,
                        props.payload.name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* PIR Submission Status by Cluster */}
          {data?.pirClusterStatus?.length > 0 && (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-4">Q{s?.currentQuarter} PIR Status by Cluster</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {data.pirClusterStatus.map(cl => (
                  <button
                    key={cl.id}
                    onClick={() => navigate(`/admin/submissions?type=pir&cluster=${cl.id}`)}
                    className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${complianceColor(cl.pct)}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Cluster {cl.cluster_number}</p>
                    <p className="font-black text-slate-900 dark:text-slate-100 text-sm mt-0.5 truncate">{cl.name}</p>
                    <p className={`text-xl font-black mt-1 ${complianceText(cl.pct)}`}>{cl.pct}%</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cl.submitted}/{cl.totalSchools} schools filed</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Submissions Table */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Recent Submissions</h3>
              <button onClick={() => navigate('/admin/submissions')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                View All →
              </button>
            </div>
            {data?.recentSubmissions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-dark-border">
                      {['School', 'Program', 'Type', 'Quarter', 'Submitted', 'Status', ''].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
                    {data.recentSubmissions.map((sub, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-border/20 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200 max-w-[140px] truncate">{sub.school}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-[160px] truncate">{sub.program}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={sub.type} size="xs" /></td>
                        <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{sub.quarter ?? '—'}</td>
                        <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{relativeTime(sub.submitted)}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={sub.status} size="xs" /></td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => navigate(`/admin/submissions`)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-600 py-8 text-center">No submissions yet.</p>
            )}
          </div>

        </div>
      )}
    </AdminLayout>
  );
}
