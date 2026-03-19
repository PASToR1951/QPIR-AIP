# Unappended Changes

## 1. AIP Sort Order Change

### Summary

Changed the default sort order in `ViewModeSelector` from alphabetical A→Z to **By Status**, with a corrected status hierarchy.

---

### Previous Implementation

**File:** `react-app/src/components/ui/ViewModeSelector.jsx`

#### Default sort order
```js
const [sortOrder, setSortOrder] = useState('az');
```
The view opened with programs sorted alphabetically ascending (A→Z) by default.

#### Status rank (old hierarchy)
```js
const statusRank = p => {
    if (completedPrograms.includes(p)) return 0; // Submitted — highest priority
    if (draftProgram === p) return 1;             // Draft
    return 2;                                      // Pending — lowest priority
};
```
When the user manually selected "By Status", submitted programs floated to the top, followed by drafts, then pending.

---

### New Implementation

#### Default sort order
```js
const [sortOrder, setSortOrder] = useState('status');
```
The view now opens with "By Status" active — no manual selection required.

#### Status rank (new hierarchy)
```js
const statusRank = p => {
    if (draftProgram === p) return 0;             // Draft — highest priority
    if (completedPrograms.includes(p)) return 1;  // Submitted
    return 2;                                      // Pending — lowest priority
};
```

#### Priority order
| Rank | Status | Rationale |
|------|--------|-----------|
| 0 | **Draft** | Active work in progress — needs immediate attention |
| 1 | **Submitted** | Completed forms — useful reference, lower urgency |
| 2 | **Pending** | No action taken yet — lowest urgency |

#### Notes

- Within each status group, items retain their relative order from the original program list (JavaScript's sort is stable).
- The filter tabs (All / Done / Draft / Pending) and the sort dropdown remain unchanged — users can still switch to A→Z or Z→A manually.

---

## 2. AIP & PIR Loading Animation

### Summary

Added a full-screen loading animation (`PageLoader`) to both `AIPForm` and `PIRForm` that displays while initial data is fetched from the database on mount.

---

### Previous Implementation

**Files:** `react-app/src/AIPForm.jsx`, `react-app/src/PIRForm.jsx`

Both forms had two **separate** `useEffect` hooks that fired in parallel on mount with no loading state:

```js
// Effect 1 — fetched programs & completion status
useEffect(() => {
    const fetchPrograms = async () => {
        const [programsRes, completedRes] = await Promise.all([...]);
        setProgramList(...);
        setCompletedPrograms(...);
    };
    fetchPrograms();
}, []);

// Effect 2 — checked for an existing draft
useEffect(() => {
    const fetchDraft = async () => {
        const res = await axios.get(`/api/drafts/AIP/${user.id}`, ...);
        if (res.data.hasDraft) { setHasDraft(true); ... }
    };
    fetchDraft();
}, [user?.id]);
```

The form rendered immediately on mount with empty program lists, causing a flash of an empty `ViewModeSelector` before data arrived.

---

### New Implementation

Both effects were merged into a single `init()` function using `Promise.allSettled` so all requests fire together and the UI waits for all to settle before rendering.

```js
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
    const init = async () => {
        try {
            const requests = [
                axios.get(`/api/programs`, ...),
                axios.get(`/api/programs/with-aips`, ...),
            ];
            if (user?.id) requests.push(axios.get(`/api/drafts/AIP/${user.id}`, ...));

            const results = await Promise.allSettled(requests);
            const [programsRes, completedRes, draftRes] = results;

            if (programsRes.status === 'fulfilled') setProgramList(...);
            if (completedRes.status === 'fulfilled') setCompletedPrograms(...);
            if (draftRes?.status === 'fulfilled' && draftRes.value.data.hasDraft) {
                setHasDraft(true); setDraftInfo(...); setLoadedDraftData(...);
            }
        } finally {
            setIsLoading(false);
        }
    };
    init();
}, []);
```

A guard at the top of the render returns the `PageLoader` until `isLoading` is false:

```jsx
if (isLoading) return <PageLoader message="Loading AIP..." />;
```

### PageLoader component

**File:** `react-app/src/components/ui/PageLoader.jsx`

Pre-existing full-screen loader with:
- Animated logo carousel (rotates every 1.2 s through 4 DepEd logos)
- Two glowing orb backgrounds with `animate-pulse`
- Three-dot bounce spinner (blue → indigo → pink)
- Configurable `message` prop

### Changes per file

| File | Change |
|------|--------|
| `AIPForm.jsx` | Import `PageLoader`; merge 2 fetch effects into 1; add `isLoading` guard |
| `PIRForm.jsx` | Same as above; also includes school map fetch in the merged effect |

### Notes

- `Promise.allSettled` is used (not `Promise.all`) so a single failed request does not block the rest of the data from loading.
- School map fetch in `PIRForm` is conditionally pushed into the same requests array and is handled at index 3 after draft.
- The loader is removed (`isLoading = false`) in the `finally` block, so it always clears regardless of errors.

---

## 3. Frontend Performance Optimizations

### Summary

Implemented all P0, P1, P2-2, P2-4, P3 optimizations from `docs/performance-analysis.md` to eliminate form stuttering, cascading re-renders, and GPU-expensive continuous animations across the AIP and PIR forms.

Reference: `docs/performance-analysis.md`

---

### 3a. React.memo on section components (P0-1)

Wrapped form section components in `React.memo` to prevent re-renders when parent form state changes don't affect their props.

```jsx
// Before
export default function AIPGoalsTargetsSection({ ... }) { ... }

// After
export default React.memo(function AIPGoalsTargetsSection({ ... }) { ... });
```

| File | Status |
|------|--------|
| `components/forms/aip/AIPActionPlanSection.jsx` | Already had `React.memo` — no change |
| `components/forms/aip/AIPGoalsTargetsSection.jsx` | Wrapped in `React.memo` |
| `components/forms/aip/AIPProfileSection.jsx` | Wrapped in `React.memo` |
| `components/forms/pir/PIRMonitoringEvaluationSection.jsx` | Already had `React.memo` — no change |
| `components/forms/pir/PIRFactorsSection.jsx` | Wrapped in `React.memo` |
| `components/forms/pir/PIRFinancialsSection.jsx` | Wrapped in `React.memo` |
| `components/forms/pir/PIRProfileSection.jsx` | Wrapped in `React.memo` |

---

### 3b. useCallback on all form handlers (P1-1)

Wrapped 12+ handler functions in both `AIPForm.jsx` and `PIRForm.jsx` with `useCallback` using **functional state updaters** (`prev => ...`) so the dependency array can be empty, producing stable references.

```jsx
// Before — new function reference every render
const handleActivityChange = (id, field, value) => {
    setActivities(activities.map(a => a.id === id ? { ...a, [field]: value } : a));
};

// After — stable reference, no deps needed
const handleActivityChange = useCallback((id, field, value) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
}, []);
```

**AIPForm.jsx handlers wrapped:**
`handleObjectiveChange`, `handleIndicatorChange`, `handleAddObjective`, `handleRemoveObjective`, `handleAddIndicator`, `handleRemoveIndicator`, `handleActivityChange`, `handleAddActivity`, `handleRemoveActivity`, `handleAddActivityPhase`, `handleRemoveActivityPhase`, `handleProfileChange`

**PIRForm.jsx handlers wrapped:**
`handleFactorChange`, `handleRatingChange`, `handleRecommendationChange`, `handleFinancialChange`, `handleAddFinancialRow`, `handleRemoveFinancialRow`, `handleMEChange`, `handleAddMERow`, `handleRemoveMERow`, `handleProfileChange`

---

### 3c. useMemo for motionProps (P0-3)

**Files:** `AIPForm.jsx`, `PIRForm.jsx`

```jsx
// Before — new object every render
const motionProps = settings.reduceMotion ? { ... } : { ... };

// After — only recomputed when reduceMotion changes
const motionProps = useMemo(() => (
    settings.reduceMotion
        ? { initial: false, animate: false, exit: false, transition: { duration: 0 } }
        : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, ... }
), [settings.reduceMotion]);
```

---

### 3d. AccessibilityContext value memoization (P1-3)

**File:** `react-app/src/context/AccessibilityContext.jsx`

```jsx
// Before — new object every render, cascading re-renders to all consumers
<AccessibilityContext.Provider value={{ settings, update, reset }}>

// After — stable reference via useMemo + useCallback
const update = useCallback((key, value) =>
    setSettings(prev => ({ ...prev, [key]: value })), []);
const reset = useCallback(() => setSettings(DEFAULTS), []);
const contextValue = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);

<AccessibilityContext.Provider value={contextValue}>
```

---

### 3e. Autosave debounce with ref-guarded timer (P1-4)

**Files:** `AIPForm.jsx`, `PIRForm.jsx`

Replaced raw nested `setTimeout` chains with a `useRef`-guarded timer pattern that clears previous timers and cleans up on unmount.

```jsx
const saveTimerRef = useRef(null);

// In handleSaveForLater:
clearTimeout(saveTimerRef.current);
saveTimerRef.current = setTimeout(() => {
    setIsSaving(true);
    // ... save logic ...
    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
}, 800);

// Cleanup on unmount
useEffect(() => () => clearTimeout(saveTimerRef.current), []);
```

---

### 3f. FormBackground GPU cost reduction (P2-2)

**File:** `react-app/src/components/ui/FormBackground.jsx`

```jsx
// Before — expensive GPU compositing + continuous animation
<div className="blur-[120px] animate-pulse duration-[4000ms] ..."
     style={{ animationDelay: '0s' }} />

// After — static opacity, no continuous animation, no inline style objects
<div className="blur-3xl opacity-40 pointer-events-none z-0 print:hidden ..." />
```

Removed `animate-pulse`, `duration-[4000ms]`, and `animationDelay` inline styles from all orb elements.

---

### 3g. Login page: animejs → pure CSS animations (P3-1)

**Files:** `react-app/src/Login.jsx`, `react-app/src/index.css`, `react-app/package.json`

Replaced all `animejs` animation calls with CSS keyframe animations and uninstalled the ~30 KB dependency.

| Animation | CSS Class |
|-----------|-----------|
| Card entrance (translateY + opacity) | `.login-card-entrance` |
| Orb 1 floating | `.login-orb-float-1` |
| Orb 2 floating | `.login-orb-float-2` |
| Error shake | `.login-shake` |

**CSS keyframes added to `index.css`:**
```css
@keyframes login-card-entrance {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes login-orb-float-1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%      { transform: translate(20px, -30px) scale(1.1); }
}
@keyframes login-orb-float-2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%      { transform: translate(-20px, 40px) scale(1.2); }
}
@keyframes login-shake {
    0%, 100% { transform: translateX(0); }
    20%      { transform: translateX(-10px); }
    40%      { transform: translateX(10px); }
    60%      { transform: translateX(-10px); }
    80%      { transform: translateX(10px); }
}
```

**Dependency removed:**
```bash
npm uninstall animejs
```

---

### 3h. Image lazy loading + dimensions (P2-4)

**File:** `react-app/src/components/ui/DashboardHeader.jsx`

```jsx
// Before — no lazy loading, no explicit dimensions (causes CLS)
<img src="/DepEd_Seal.webp" alt="DepEd Seal" className="h-9 w-auto" />

// After
<img src="/DepEd_Seal.webp" alt="DepEd Seal" width={36} height={36} loading="lazy" className="h-9 w-auto" />
```

Applied to both `DepEd_Seal.webp` and `Division_Logo.webp`.

---

### 3i. useEffect dependency array fixes (P1-2)

**File:** `react-app/src/PIRForm.jsx`

Added missing `isDivisionPersonnel` to the AIP activities fetch effect dependency array.

**File:** `react-app/src/components/ui/ViewModeSelector.jsx`

Already had `onStart` in deps — no change needed.

---

### 3j. JSON.parse try/catch guards (P3-2)

**File:** `react-app/src/components/ui/FormHeader.jsx`

```jsx
// Before — crashes if localStorage value is corrupted
const user = userStr ? JSON.parse(userStr) : null;

// After
let user = null;
try {
    user = userStr ? JSON.parse(userStr) : null;
} catch {
    localStorage.removeItem('user');
}
```

`App.jsx` and `AIPForm.jsx` / `PIRForm.jsx` already had this guard.

---

### 3k. CSS reduce-motion selector scope (P3-3)

**File:** `react-app/src/index.css`

```css
/* Before — matched every DOM element */
.a11y-reduce-motion * { animation: none !important; }

/* After — scoped to specific animated classes */
.a11y-reduce-motion .animate-pulse,
.a11y-reduce-motion .animate-spin,
.a11y-reduce-motion .animate-bounce,
.a11y-reduce-motion .login-orb-float-1,
.a11y-reduce-motion .login-orb-float-2,
.a11y-reduce-motion .login-card-entrance,
.a11y-reduce-motion .login-shake,
.a11y-reduce-motion [data-motion] {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
}
```

---

### Already optimized (no changes needed)

These items were audited and found to be pre-optimized:

| File | Item | Status |
|------|------|--------|
| `TextareaAuto.jsx` | P0-2: Local state buffering with blur-sync | Already implemented |
| `ViewModeSelector.jsx` | P0-3: Module-level `THEME_CLASSES` | Already hoisted |
| `ViewModeSelector.jsx` | P0-4: `useMemo` for `sortedFiltered` and counts | Already memoized |
| `Input.jsx` | P0-3: Module-level `THEME_CLASSES` | Already hoisted |
| `Select.jsx` | P0-3: Module-level `THEME_CLASSES` | Already hoisted |

---

### Items not implemented (future work)

| Item | Reason |
|------|--------|
| **P2-1: Lift-down form state to section components** | High-effort refactor — moves section-level state from parent form into each section. Root cause fix for keystroke-triggered full re-renders. |
| **P2-3: Lazy-load Mermaid** | Requires finding all mermaid import sites and wrapping with `React.lazy`/`Suspense`. |

---

### Files changed

| File | Changes |
|------|---------|
| `AIPForm.jsx` | `useRef` + `useMemo` imports; `JSON.parse` guard; `useMemo` motionProps; `useCallback` on 12 handlers; `saveTimerRef` debounce + unmount cleanup |
| `PIRForm.jsx` | Same as AIPForm; added `isDivisionPersonnel` to effect deps; `useCallback` on 10 handlers |
| `AIPGoalsTargetsSection.jsx` | Wrapped in `React.memo` |
| `AIPProfileSection.jsx` | Wrapped in `React.memo` |
| `PIRFactorsSection.jsx` | Wrapped in `React.memo` |
| `PIRFinancialsSection.jsx` | Wrapped in `React.memo` |
| `PIRProfileSection.jsx` | Wrapped in `React.memo` |
| `AccessibilityContext.jsx` | `useCallback` for `update`/`reset`; `useMemo` for context value |
| `FormBackground.jsx` | Removed `blur-[120px]`, `animate-pulse`, `animationDelay` inline styles; static `blur-3xl opacity-40` |
| `Login.jsx` | Removed `animejs` import + `useEffect`; CSS animation classes; CSS-based error shake |
| `DashboardHeader.jsx` | `width`/`height`/`loading="lazy"` on images |
| `FormHeader.jsx` | `JSON.parse` try/catch guard |
| `index.css` | Login CSS keyframes; scoped reduce-motion selectors |
| `package.json` | Removed `animejs` dependency |

---

## 4. Structured AIP Activity Periods

### Summary

Replaced free-text `implementation_period` input with structured **month-range pickers** (`period_start_month`, `period_end_month`) on `AIPActivity`. This enables timeline-aware PIR filtering and dashboard statistics.

---

### Schema changes

**File:** `server/prisma/schema.prisma`

Added two nullable integer columns to `AIPActivity`:

```prisma
model AIPActivity {
  // ... existing fields ...
  implementation_period String
  period_start_month   Int?     // 1=Jan … 12=Dec — nullable for legacy data
  period_end_month     Int?     // 1=Jan … 12=Dec
  // ...
}
```

Nullable so that legacy AIPs created before this change (which only have the free-text `implementation_period`) continue to work without migration backfill.

---

### Backend changes

**File:** `server/routes/data.ts`

**a) AIP creation endpoint** — now persists the structured month fields alongside the free-text period:

```ts
period_start_month: act.periodStartMonth ? parseInt(act.periodStartMonth) : null,
period_end_month: act.periodEndMonth ? parseInt(act.periodEndMonth) : null,
```

**b) AIP read endpoints** — return the new fields in activity responses:

```ts
period_start_month: a.period_start_month,
period_end_month: a.period_end_month,
```

**c) `activityOverlapsQuarter()` helper** — determines if an activity's month range overlaps a given quarter:

```ts
function activityOverlapsQuarter(startMonth: number, endMonth: number, quarter: number): boolean {
  const qStart = (quarter - 1) * 3 + 1; // Q1=1, Q2=4, Q3=7, Q4=10
  const qEnd = quarter * 3;              // Q1=3, Q2=6, Q3=9, Q4=12
  return startMonth <= qEnd && endMonth >= qStart;
}
```

---

### Frontend changes

**File:** `react-app/src/components/forms/aip/AIPActionPlanSection.jsx`

Added a `MonthRangePicker` component that replaces the free-text period input:

```jsx
const MONTHS = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, ...
];

function MonthRangePicker({ startMonth, endMonth, onStartChange, onEndChange, compact }) {
    // Two <select> dropdowns: Start → End
    // End month options are filtered to >= startMonth
}
```

Used in both wizard mode and table mode for each AIP activity row.

**File:** `react-app/src/AIPForm.jsx`

- Activity state now includes `periodStartMonth` and `periodEndMonth` fields
- `handleActivityChange` auto-derives the display string (e.g., "Jan – Dec") when either month field changes:

```js
if (field === 'periodStartMonth' || field === 'periodEndMonth') {
    const s = field === 'periodStartMonth' ? value : updated.periodStartMonth;
    const e = field === 'periodEndMonth' ? value : updated.periodEndMonth;
    // Auto-generate period display string from month values
}
```

---

## 5. Timeline-Aware PIR Filtering

### Summary

PIR form now only shows AIP activities that are **relevant to the selected quarter**, instead of always showing all activities. Legacy data without structured month fields falls back to showing all activities.

---

### Implementation

**File:** `react-app/src/PIRForm.jsx`

After loading AIP activities, they are filtered by quarter overlap before populating the PIR form:

```jsx
const qStart = (currentQuarterNum - 1) * 3 + 1;
const qEnd = currentQuarterNum * 3;
const relevantActivities = aipActivities.filter(a =>
    a.period_start_month && a.period_end_month
        ? (a.period_start_month <= qEnd && a.period_end_month >= qStart)
        : true // Legacy data without structured months — show in all quarters
);
const activitiesToUse = relevantActivities.length > 0 ? relevantActivities : aipActivities;
```

Fallback behavior:
- If structured months exist: only activities overlapping the quarter are shown
- If no structured months (legacy data): all activities are shown (conservative)
- If filtering produces zero results: falls back to all activities (safety net)

---

## 6. Dashboard Stats Redesign

### Summary

Replaced the previous 4-card dashboard stats layout with a focused **3-card system** plus a **quarter progress timeline** component. Removed budget display from the stats area. Module cards (AIP/PIR) now show meaningful progress badges instead of trivial "Submitted"/"Unlocked" status labels.

---

### 6a. DashboardStats component

**File:** `react-app/src/components/ui/DashboardStats.jsx`

Three stat cards in a responsive grid:

| Card | Content | Visual |
|------|---------|--------|
| **AIP Progress** | `{completed} of {total}` programs | Segmented bar (emerald filled / slate empty segments) |
| **Q{n} Reviews** | `{submitted} of {total}` PIRs, or "—" if no activities this quarter | Dot pips (emerald/slate circles) |
| **Q{n} Deadline** | Days remaining, date, or "Overdue" | Color-coded by urgency tier |

**Urgency tiers** for the deadline card:

| Days Left | Tier | Color | Extras |
|-----------|------|-------|--------|
| > 29 | `calm` | slate | Shows formatted date |
| 8–29 | `attention` | amber | Shows day count |
| 1–7 | `urgent` | rose | Pulsing red dot indicator |
| ≤ 0 | `overdue` | rose | "Due Today" or "Overdue" |

**Helper sub-components:**
- `SegmentedBar({ completed, total })` — horizontal bar divided into `total` segments, first `completed` are emerald
- `DotPips({ submitted, total })` — row of small circles for PIR progress
- `LoadingSkeleton()` — 3-card pulse animation placeholder
- `getActionPrompt(data, aipStatus)` — exported helper that returns a contextual action sentence for the welcome card

---

### 6b. QuarterTimeline component

**File:** `react-app/src/components/ui/QuarterTimeline.jsx`

Horizontal (desktop) / vertical (mobile) 4-node stepper showing Q1 through Q4 with:

- Per-quarter status node (color-coded circle)
- Connecting progress line that fills up to the current quarter
- Deadline date label per quarter

**Status configurations:**

| Status | Color | Dot Content | When |
|--------|-------|-------------|------|
| `Submitted` | emerald | ✓ | PIR submitted for that quarter |
| `In Progress` | blue + pulse ring | Quarter number | Current quarter, before deadline |
| `Missed` | rose | ✗ | Past quarter, had activities, no PIR submitted |
| `No Activities` | slate-300 | — | No AIP activities fall in that quarter |
| `Locked` | slate-200 | Lock icon (SVG) | Future quarter |

---

### 6c. Dashboard endpoint (timeline-aware)

**File:** `server/routes/data.ts` — `GET /api/dashboard`

The endpoint now computes quarter statuses by checking whether each AIP has activities overlapping each quarter:

```ts
const aipHasActivitiesInQuarter = (aip, q) =>
  aip.activities.some(a =>
    a.period_start_month && a.period_end_month
      ? activityOverlapsQuarter(a.period_start_month, a.period_end_month, q)
      : true // Legacy data — assume relevant
  );
```

**Quarter status logic:**
1. No activities in quarter → `"No Activities"`
2. Future quarter → `"Locked"`
3. Current quarter, before deadline → `"In Progress"`
4. Past quarter or deadline passed → check PIR count:
   - PIR exists → `"Submitted"`
   - Relevant AIPs but no PIR → `"Missed"`
   - No relevant AIPs → `"No Activities"`

**Response shape:**

```json
{
  "activePrograms": 5,
  "aipCompletion": { "completed": 3, "total": 5, "percentage": 60 },
  "pirSubmitted": { "submitted": 1, "total": 2 },
  "totalPlannedBudget": 150000,
  "currentQuarter": 1,
  "deadline": "2026-03-31T23:59:59.999Z",
  "quarters": [
    { "name": "Q1", "status": "In Progress", "deadline": "2026-03-31T23:59:59.999Z" },
    { "name": "Q2", "status": "No Activities", "deadline": "2026-06-30T23:59:59.999Z" },
    { "name": "Q3", "status": "Locked", "deadline": "2026-09-30T23:59:59.999Z" },
    { "name": "Q4", "status": "Locked", "deadline": "2026-12-31T23:59:59.999Z" }
  ]
}
```

---

### 6d. Welcome section simplification

**File:** `react-app/src/App.jsx`

Replaced two separate info cards (user role description + quick stats) with a single contextual action prompt:

```jsx
<p className="text-sm font-semibold text-slate-500 mt-auto">
  {dashboardLoading
    ? <span className="inline-block w-64 h-4 bg-slate-200 rounded animate-pulse" />
    : actionPrompt  // from getActionPrompt() helper
  }
</p>
```

`getActionPrompt()` returns context-sensitive guidance:
- No AIPs yet → "Start by submitting your Annual Implementation Plan for FY 2026."
- PIRs pending → "Your Q1 review is due in 12 days — submit your quarterly PIR."
- No activities this quarter → "No activities scheduled for Q1. Your next review opens in Q2."
- All done → "You're on track for Q1. Next review opens in Q2."

---

### 6e. Module card badge improvements

**File:** `react-app/src/App.jsx`

**AIP card** — replaced "Submitted" / "In Progress" badges with program completion ratio:

```jsx
{dashboardData.aipCompletion.completed}/{dashboardData.aipCompletion.total} Programs
```

Description dynamically shows remaining work:
- "2 programs still need planning for FY 2026."
- Falls back to generic description when all are complete

**PIR card** — replaced "Unlocked" badge with quarter-specific review status:

```jsx
Q{currentQuarter}: {pirSubmitted.submitted}/{pirSubmitted.total} Filed
// or when no activities:
No Q{currentQuarter} Activities
```

Description dynamically shows pending count:
- "2 quarterly reviews pending for Q1."
- "No activities scheduled this quarter. Check back next quarter."

Removed unused imports: `CheckCircle2`, `Clock`, `Unlock`.

---

### 6f. Budget display removal

**File:** `react-app/src/components/ui/DashboardStats.jsx`

Removed the `totalPlannedBudget` display that was previously shown under the AIP Progress card:

```jsx
// Removed:
{totalPlannedBudget > 0 && (
    <p className="text-[10px] text-slate-400 font-medium mt-2">
        Total planned: {formatBudget(totalPlannedBudget)}
    </p>
)}
```

The `formatBudget` helper and `totalPlannedBudget` destructuring remain in the file (budget is still computed server-side for potential future use) but are no longer rendered.

---

### Files changed (sections 4–6)

| File | Changes |
|------|---------|
| `server/prisma/schema.prisma` | Added `period_start_month` (Int?) and `period_end_month` (Int?) to `AIPActivity` |
| `server/routes/data.ts` | `activityOverlapsQuarter()` helper; AIP endpoints save/return month fields; dashboard endpoint with timeline-aware quarter statuses and PIR counting |
| `react-app/src/AIPForm.jsx` | Activity state includes `periodStartMonth`/`periodEndMonth`; auto-derives display string on change |
| `react-app/src/components/forms/aip/AIPActionPlanSection.jsx` | `MONTHS` constant; `MonthRangePicker` component; used in wizard and table modes |
| `react-app/src/PIRForm.jsx` | Quarter-based activity filtering with `activityOverlapsQuarter` logic; legacy fallback |
| `react-app/src/components/ui/DashboardStats.jsx` | New 3-card layout (`SegmentedBar`, `DotPips`, urgency tiers); removed budget display; `getActionPrompt()` export |
| `react-app/src/components/ui/QuarterTimeline.jsx` | New component — horizontal/vertical 4-node stepper with 5 status types |
| `react-app/src/App.jsx` | Wired `DashboardStats` + `QuarterTimeline`; simplified welcome section; program count badge on AIP card; quarter review status on PIR card; removed `CheckCircle2`/`Clock`/`Unlock` imports |

---

## 7. TextareaAuto Dynamic Resize on Load

### Summary

Fixed `TextareaAuto` so it auto-sizes to fit its content on initial render and when the value prop changes, not only when the user types. Added a minimum height so empty fields remain tappable on mobile.

---

### Previous Implementation

**File:** `react-app/src/components/ui/TextareaAuto.jsx`

The textarea only recalculated its height inside `handleInput` (fired on user keystrokes):

```jsx
const handleInput = useCallback((e) => {
    setLocalValue(e.target.value);
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
}, []);
```

With `rows={1}` and no auto-resize on mount, pre-filled textareas (from saved drafts or API data) appeared as a single tiny row — especially problematic on mobile where the text was unreadable.

---

### New Implementation

**a) Added `useEffect` on `localValue`** — recalculates height whenever value changes (initial load, prop updates, etc.):

```jsx
useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
}, [localValue]);
```

**b) Added `min-h-[2.5rem]`** to the base class list — ensures even empty textareas have a tappable minimum height on mobile:

```jsx
className={cn(
    "w-full outline-none resize-none overflow-hidden placeholder:text-slate-400 bg-transparent min-h-[2.5rem]",
    className
)}
```

### Files changed

| File | Changes |
|------|---------|
| `react-app/src/components/ui/TextareaAuto.jsx` | Added `useEffect` on `localValue` for auto-resize on load; added `min-h-[2.5rem]` base class |

---

## 8. Hide View Mode Toggle on Mobile

### Summary

Hidden the "Switch to Full View" / "Switch to Wizard" toggle button on mobile screens, since mobile is already forced into wizard mode by the `ViewModeSelector`.

---

### Previous Implementation

**File:** `react-app/src/components/ui/ViewModeToggle.jsx`

The toggle button was visible at all screen sizes:

```jsx
className={`flex text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm transition-colors items-center gap-1.5 ${textHoverClasses[theme]}`}
```

On mobile, tapping it would switch to Full Form view, which conflicts with the `ViewModeSelector` logic that forces wizard mode on `window.innerWidth < 768`.

---

### New Implementation

Added `hidden md:flex` so the button is hidden below the `md` (768px) breakpoint:

```jsx
className={`hidden md:flex text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm transition-colors items-center gap-1.5 ${textHoverClasses[theme]}`}
```

### Files changed

| File | Changes |
|------|---------|
| `react-app/src/components/ui/ViewModeToggle.jsx` | Added `hidden md:flex` to hide toggle on mobile screens |
