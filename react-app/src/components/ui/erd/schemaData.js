export const MODELS = [
  {
    name: 'Cluster',
    table: 'clusters',
    color: '#6366f1',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'cluster_number', type: 'Int', unique: true },
      { name: 'name', type: 'String' },
    ],
  },
  {
    name: 'School',
    table: 'schools',
    color: '#0ea5e9',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'name', type: 'String' },
      { name: 'level', type: 'String' },
      { name: 'cluster_id', type: 'Int', fk: true },
    ],
  },
  {
    name: 'Program',
    table: 'programs',
    color: '#8b5cf6',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'title', type: 'String', unique: true },
      { name: 'school_level_requirement', type: 'String' },
    ],
  },
  {
    name: 'User',
    table: 'users',
    color: '#f59e0b',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'email', type: 'String', unique: true },
      { name: 'password', type: 'String' },
      { name: 'role', type: 'String' },
      { name: 'name', type: 'String?' },
      { name: 'first_name', type: 'String?' },
      { name: 'middle_initial', type: 'String?' },
      { name: 'last_name', type: 'String?' },
      { name: 'school_id', type: 'Int?', fk: true, unique: true },
      { name: 'created_at', type: 'DateTime' },
    ],
  },
  {
    name: 'AIP',
    table: 'aips',
    color: '#10b981',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'school_id', type: 'Int?', fk: true },
      { name: 'program_id', type: 'Int', fk: true },
      { name: 'created_by_user_id', type: 'Int?', fk: true },
      { name: 'year', type: 'Int' },
      { name: 'outcome', type: 'String' },
      { name: 'sip_title', type: 'String' },
      { name: 'project_coordinator', type: 'String' },
      { name: 'objectives', type: 'Json' },
      { name: 'indicators', type: 'Json' },
      { name: 'created_at', type: 'DateTime' },
    ],
  },
  {
    name: 'AIPActivity',
    table: 'aip_activities',
    color: '#14b8a6',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'aip_id', type: 'Int', fk: true },
      { name: 'phase', type: 'String' },
      { name: 'activity_name', type: 'String' },
      { name: 'budget_amount', type: 'Decimal' },
      { name: 'budget_source', type: 'String' },
    ],
  },
  {
    name: 'PIR',
    table: 'pirs',
    color: '#ef4444',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'aip_id', type: 'Int', fk: true },
      { name: 'created_by_user_id', type: 'Int?', fk: true },
      { name: 'quarter', type: 'String' },
      { name: 'total_budget', type: 'Decimal' },
      { name: 'created_at', type: 'DateTime' },
    ],
  },
  {
    name: 'PIRActivityReview',
    table: 'pir_activity_reviews',
    color: '#f97316',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'pir_id', type: 'Int', fk: true },
      { name: 'aip_activity_id', type: 'Int', fk: true },
      { name: 'physical_target', type: 'Decimal' },
      { name: 'financial_target', type: 'Decimal' },
      { name: 'physical_accomplished', type: 'Decimal' },
      { name: 'financial_accomplished', type: 'Decimal' },
    ],
  },
  {
    name: 'PIRFactor',
    table: 'pir_factors',
    color: '#ec4899',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'pir_id', type: 'Int', fk: true },
      { name: 'factor_type', type: 'String' },
      { name: 'facilitating_factors', type: 'String' },
      { name: 'hindering_factors', type: 'String' },
    ],
  },
  {
    name: 'Deadline',
    table: 'deadlines',
    color: '#64748b',
    fields: [
      { name: 'id', type: 'Int', pk: true },
      { name: 'year', type: 'Int' },
      { name: 'quarter', type: 'Int' },
      { name: 'date', type: 'DateTime' },
    ],
  },
];

export const RELATIONS = [
  { from: 'Cluster', to: 'School', type: '1:N', label: 'has' },
  { from: 'School', to: 'User', type: '1:1', label: 'account' },
  { from: 'School', to: 'AIP', type: '1:N', label: 'creates' },
  { from: 'Program', to: 'AIP', type: '1:N', label: 'has' },
  { from: 'User', to: 'Program', type: 'M:N', label: 'monitors' },
  { from: 'School', to: 'Program', type: 'M:N', label: 'restricted' },
  { from: 'User', to: 'AIP', type: '1:N', label: 'created by' },
  { from: 'User', to: 'PIR', type: '1:N', label: 'created by' },
  { from: 'AIP', to: 'AIPActivity', type: '1:N', label: 'includes' },
  { from: 'AIP', to: 'PIR', type: '1:N', label: 'reviewed in' },
  { from: 'PIR', to: 'PIRActivityReview', type: '1:N', label: 'contains' },
  { from: 'AIPActivity', to: 'PIRActivityReview', type: '1:N', label: 'reviewed as' },
  { from: 'PIR', to: 'PIRFactor', type: '1:N', label: 'reports' },
];

export function buildSchemaSourceText() {
  return MODELS.map((model) => {
    const fields = model.fields.map((field) => {
      const badges = [field.pk && '@id', field.fk && '@fk', field.unique && '@unique']
        .filter(Boolean)
        .join(' ');
      return `  ${field.name.padEnd(24)} ${field.type}${badges ? `  ${badges}` : ''}`;
    }).join('\n');

    return `model ${model.name} {\n${fields}\n}`;
  }).join('\n\n');
}
