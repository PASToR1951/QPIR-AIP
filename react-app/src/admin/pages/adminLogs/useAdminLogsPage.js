import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../../../lib/api.js';
import { parseOpenLogRef } from './formatters.js';

const EMPTY_FACETS = {
  actions: [],
  entity_types: [],
  actor_roles: [],
  severities: [],
};

function buildParams(filters, limit, { includePage = true } = {}) {
  return {
    ...(filters.source !== 'all' ? { source: filters.source } : {}),
    ...(filters.action.length ? { action: filters.action.join(',') } : {}),
    ...(filters.entityType.length ? { entityType: filters.entityType.join(',') } : {}),
    ...(filters.role.length ? { role: filters.role.join(',') } : {}),
    ...(filters.severity.length ? { severity: filters.severity.join(',') } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(filters.ip ? { ip: filters.ip.trim() } : {}),
    ...(filters.q ? { q: filters.q.trim() } : {}),
    ...(includePage ? { page: filters.page, limit } : {}),
  };
}

function buildExportBody(filters) {
  return {
    ...(filters.source !== 'all' ? { source: filters.source } : {}),
    ...(filters.action.length ? { action: filters.action } : {}),
    ...(filters.entityType.length ? { entityType: filters.entityType } : {}),
    ...(filters.role.length ? { role: filters.role } : {}),
    ...(filters.severity.length ? { severity: filters.severity } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(filters.ip ? { ip: filters.ip.trim() } : {}),
    ...(filters.q ? { q: filters.q.trim() } : {}),
  };
}

function getFilenameFromDisposition(contentDisposition) {
  if (!contentDisposition) return 'admin-logs.csv';
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const fallbackMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (fallbackMatch?.[1]) return fallbackMatch[1];
  return 'admin-logs.csv';
}

function downloadBlob(blob, filename) {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
}

async function readBlobErrorMessage(error, fallback) {
  const blob = error?.response?.data;
  if (!(blob instanceof Blob)) return error?.friendlyMessage ?? fallback;

  try {
    const text = await blob.text();
    if (!text) return error?.friendlyMessage ?? fallback;
    try {
      const parsed = JSON.parse(text);
      return parsed?.error ?? error?.friendlyMessage ?? fallback;
    } catch {
      return text;
    }
  } catch {
    return error?.friendlyMessage ?? fallback;
  }
}

export function useAdminLogsPage(filters, { limit = 50 } = {}) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [facets, setFacets] = useState(EMPTY_FACETS);
  const [catalog, setCatalog] = useState({ actions: [] });
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [isVisible, setIsVisible] = useState(() => document.visibilityState !== 'hidden');
  const visibilityReadyRef = useRef(false);

  const listKey = useMemo(() => JSON.stringify({
    source: filters.source,
    action: filters.action,
    entityType: filters.entityType,
    role: filters.role,
    severity: filters.severity,
    from: filters.from,
    to: filters.to,
    ip: filters.ip,
    q: filters.q,
    page: filters.page,
    limit,
    refreshToken,
  }), [
    filters.source,
    filters.action,
    filters.entityType,
    filters.role,
    filters.severity,
    filters.from,
    filters.to,
    filters.ip,
    filters.q,
    filters.page,
    limit,
    refreshToken,
  ]);

  const detailRef = useMemo(() => parseOpenLogRef(filters.open), [filters.open]);

  useEffect(() => {
    let ignore = false;

    api.get('/api/admin/logs/catalog')
      .then((response) => {
        if (!ignore) setCatalog(response.data ?? { actions: [] });
      })
      .catch(() => {
        if (!ignore) setCatalog({ actions: [] });
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState !== 'hidden');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!visibilityReadyRef.current) {
      visibilityReadyRef.current = true;
      return;
    }
    if (isVisible) {
      setRefreshToken((value) => value + 1);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return undefined;
    const timer = window.setInterval(() => {
      setRefreshToken((value) => value + 1);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [isVisible]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get('/api/admin/logs', {
        params: buildParams(filters, limit, { includePage: true }),
      }),
      api.get('/api/admin/logs/facets', {
        params: buildParams(filters, limit, { includePage: false }),
      }),
    ])
      .then(([logsResponse, facetsResponse]) => {
        if (ignore) return;
        setRows(Array.isArray(logsResponse.data?.rows) ? logsResponse.data.rows : []);
        setTotal(Number(logsResponse.data?.total ?? 0));
        setFacets(facetsResponse.data ?? EMPTY_FACETS);
      })
      .catch((requestError) => {
        if (ignore) return;
        setError(requestError.friendlyMessage ?? 'Failed to load admin logs.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [limit, listKey]);

  useEffect(() => {
    if (!detailRef) {
      setDetail(null);
      setDetailLoading(false);
      setDetailError(null);
      return;
    }

    let ignore = false;
    setDetailLoading(true);
    setDetailError(null);

    api.get(`/api/admin/logs/${detailRef.source}/${detailRef.id}`)
      .then((response) => {
        if (!ignore) setDetail(response.data ?? null);
      })
      .catch((requestError) => {
        if (!ignore) {
          setDetail(null);
          setDetailError(requestError.friendlyMessage ?? 'Failed to load this log entry.');
        }
      })
      .finally(() => {
        if (!ignore) setDetailLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [detailRef, refreshToken]);

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  const exportLogs = useCallback(async (reason) => {
    try {
      const response = await api.post(
        '/api/admin/logs/export',
        {
          reason,
          ...buildExportBody(filters),
        },
        { responseType: 'blob' },
      );

      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'text/csv' });
      const filename = getFilenameFromDisposition(response.headers['content-disposition']);
      downloadBlob(blob, filename);
      refresh();
    } catch (requestError) {
      const message = await readBlobErrorMessage(
        requestError,
        'Failed to export admin logs.',
      );
      throw new Error(message);
    }
  }, [filters, refresh]);

  return {
    rows,
    total,
    limit,
    loading,
    error,
    facets,
    catalog,
    detail,
    detailLoading,
    detailError,
    refresh,
    exportLogs,
  };
}
