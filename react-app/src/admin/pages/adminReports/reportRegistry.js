import { ComplianceReport } from './ComplianceReport.jsx';
import { QuarterlyReport } from './QuarterlyReport.jsx';
import { BudgetReport } from './BudgetReport.jsx';
import { WorkloadReport } from './WorkloadReport.jsx';
import { AccomplishmentReport } from './AccomplishmentReport.jsx';
import { FactorsReport } from './FactorsReport.jsx';
import { BudgetSourcesReport } from './BudgetSourcesReport.jsx';
import { AIPFunnelReport } from './AIPFunnelReport.jsx';
import { ClusterPIRSummary } from './ClusterPIRSummary.jsx';

export const REPORT_COMPONENTS = {
  compliance: ComplianceReport,
  quarterly: QuarterlyReport,
  budget: BudgetReport,
  workload: WorkloadReport,
  accomplishment: AccomplishmentReport,
  factors: FactorsReport,
  sources: BudgetSourcesReport,
  funnel: AIPFunnelReport,
  'cluster-pir': ClusterPIRSummary,
};
