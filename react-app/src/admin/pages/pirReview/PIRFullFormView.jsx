import React from 'react';
import { PIRDocument } from '../../../components/docs/PIRDocument.jsx';

const DIVISION_SIGNATORY_PREFIX = {
  SGOD: 'sgod',
  CID: 'cid',
  OSDS: 'osds',
};

const DIVISION_ROLES = new Set([
  'Division Personnel',
  'CES-SGOD',
  'CES-CID',
  'CES-ASDS',
]);

function resolveFunctionalDivision({ pir, sub }) {
  return pir?.functionalDivision
    ?? sub?.functional_division
    ?? sub?.aip?.program?.division
    ?? '';
}

function resolveSignatory({ config, functionalDivision, sub }) {
  if (!config) return { name: '', title: '' };

  const role = sub?.created_by?.role;

  if (role === 'School' && config.cluster_head_name) {
    return {
      name: config.cluster_head_name,
      title: config.cluster_head_title ?? 'Cluster Coordinator',
    };
  }

  if (role === 'Cluster Coordinator' && config.cid_noted_by_name) {
    return {
      name: config.cid_noted_by_name,
      title: config.cid_noted_by_title ?? 'Chief Education Supervisor, CID',
    };
  }

  if (DIVISION_ROLES.has(role) && functionalDivision) {
    const prefix = DIVISION_SIGNATORY_PREFIX[functionalDivision];
    const name = prefix ? config[`${prefix}_noted_by_name`] : '';
    if (name) {
      return {
        name,
        title: config[`${prefix}_noted_by_title`] ?? '',
      };
    }
  }

  return {
    name: config.supervisor_name ?? '',
    title: config.supervisor_title ?? '',
  };
}

export function PIRFullFormView({ pir, signatoryConfig, sub }) {
  const functionalDivision = resolveFunctionalDivision({ pir, sub });
  const signatory = resolveSignatory({ config: signatoryConfig, functionalDivision, sub });
  const school = pir?.school ?? sub?.aip?.school?.name ?? 'Division';
  const usesSchoolTerminology = Boolean(sub?.aip?.school) || school !== 'Division';

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-3 shadow-sm dark:border-dark-border dark:bg-dark-base">
      <div className="mx-auto min-w-[330.2mm] max-w-[330.2mm] bg-white p-8 text-black shadow-lg ring-1 ring-slate-200">
        <PIRDocument
          quarter={pir?.quarter}
          supervisorName={signatory.name}
          supervisorTitle={signatory.title}
          program={pir?.program}
          school={school}
          owner={pir?.owner}
          budgetFromDivision={pir?.budgetFromDivision}
          budgetFromCoPSF={pir?.budgetFromCoPSF}
          functionalDivision={functionalDivision}
          usesSchoolTerminology={usesSchoolTerminology}
          indicatorTargets={pir?.indicatorQuarterlyTargets ?? []}
          activities={pir?.activities ?? []}
          factors={pir?.factors ?? {}}
          actionItems={pir?.actionItems ?? []}
        />
      </div>
    </div>
  );
}
