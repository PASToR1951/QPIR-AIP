import React, { useMemo, useState } from 'react';
import { getClusterLogoPath, getUploadedLogoUrl } from '../../lib/clusterLogo';

export function SchoolAvatar({
  clusterNumber,
  schoolLogo = null,
  clusterLogo = null,
  name = '',
  size = 40,
  className = '',
  rounded = 'rounded-full',
}) {
  const bundledClusterLogo = getClusterLogoPath(clusterNumber);
  const logoSources = useMemo(
    () => [schoolLogo, clusterLogo, bundledClusterLogo].map(getUploadedLogoUrl).filter(Boolean),
    [schoolLogo, clusterLogo, bundledClusterLogo],
  );
  const logoKey = logoSources.join('|');
  const [failedState, setFailedState] = useState({ key: '', srcs: [] });
  const failedSrcs = failedState.key === logoKey ? failedState.srcs : [];
  const logoSrc = logoSources.find(src => !failedSrcs.includes(src));
  const initial = name?.[0]?.toUpperCase() || 'S';

  if (logoSrc) {
    return (
      <img
        src={logoSrc}
        alt={name ? `${name} logo` : 'School logo'}
        onError={() => setFailedState(state => {
          const srcs = state.key === logoKey ? state.srcs : [];
          return srcs.includes(logoSrc)
            ? { key: logoKey, srcs }
            : { key: logoKey, srcs: [...srcs, logoSrc] };
        })}
        style={{ width: size, height: size }}
        className={`object-contain overflow-hidden bg-transparent border border-slate-200 dark:border-dark-border ${rounded} ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`flex items-center justify-center bg-indigo-100 text-indigo-600 font-black border border-indigo-200 ${rounded} ${className}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{initial}</span>
    </div>
  );
}
