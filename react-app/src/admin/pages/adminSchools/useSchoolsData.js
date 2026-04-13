import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api.js';

export function useSchoolsData() {
  const [clusters, setClusters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAll = useCallback(() => {
    setLoading(true);
    return Promise.all([api.get('/api/admin/clusters'), api.get('/api/admin/programs')])
      .then(([cr, pr]) => { setFetchError(null); setClusters(cr.data); setPrograms(pr.data); })
      .catch(e => { console.error(e); setFetchError('Failed to load data. Please refresh and try again.'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Cluster actions
  const addCluster = async (clusterForm) => {
    setActionLoading(true); setFormError('');
    try {
      const num = Number(clusterForm.cluster_number);
      const res = await api.post('/api/admin/clusters', { cluster_number: num, name: String(num) });
      await fetchAll();
      return { ok: true, id: res.data.id };
    } catch (e) { setFormError(e.friendlyMessage ?? 'Operation failed'); return { ok: false }; }
    finally { setActionLoading(false); }
  };

  const editCluster = async (clusterId, clusterForm) => {
    setActionLoading(true); setFormError('');
    try {
      const num = Number(clusterForm.cluster_number);
      await api.patch(`/api/admin/clusters/${clusterId}`, { cluster_number: num, name: String(num) });
      await fetchAll();
      return { ok: true };
    } catch (e) { setFormError(e.friendlyMessage ?? 'Operation failed'); return { ok: false }; }
    finally { setActionLoading(false); }
  };

  const deleteCluster = async (clusterId) => {
    setActionLoading(true); setFormError('');
    try {
      await api.delete(`/api/admin/clusters/${clusterId}`);
      fetchAll(); return { ok: true };
    } catch (e) { setFormError(e.friendlyMessage ?? 'Operation failed'); return { ok: false }; }
    finally { setActionLoading(false); }
  };

  const uploadClusterLogo = async (clusterId, file, onUpdate) => {
    setLogoUploading(true); setFormError('');
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await api.post(`/api/admin/clusters/${clusterId}/logo`, formData);
      onUpdate(res.data.logo ?? null);
      await fetchAll();
      return { ok: true };
    } catch (e) { return { ok: false, message: e.friendlyMessage ?? 'Upload failed.' }; }
    finally { setLogoUploading(false); }
  };

  const removeClusterLogo = async (clusterId, onUpdate) => {
    setLogoUploading(true); setFormError('');
    try {
      await api.delete(`/api/admin/clusters/${clusterId}/logo`);
      onUpdate(null);
      await fetchAll();
      return { ok: true };
    } catch (e) { return { ok: false, message: e.friendlyMessage ?? 'Failed to remove cluster logo.' }; }
    finally { setLogoUploading(false); }
  };

  const assignClusterHead = async (clusterId, userId) => {
    try {
      await api.patch(`/api/admin/clusters/${clusterId}/head`, { user_id: userId });
      fetchAll(); return { ok: true };
    } catch (e) { return { ok: false, message: e?.friendlyMessage || 'Failed to assign cluster head.' }; }
  };

  // School actions
  const addSchool = async (schoolForm, clusterId) => {
    setActionLoading(true); setFormError('');
    try {
      const res = await api.post('/api/admin/schools', { ...schoolForm, cluster_id: clusterId });
      await fetchAll();
      return { ok: true, id: res.data.id };
    } catch (e) { setFormError(e.friendlyMessage ?? 'Operation failed'); return { ok: false }; }
    finally { setActionLoading(false); }
  };

  const editSchool = async (schoolId, schoolForm, clusterId, existingUser, schoolHeadForm) => {
    setActionLoading(true); setFormError('');
    try {
      const patchSchool = api.patch(`/api/admin/schools/${schoolId}`, { name: schoolForm.name, abbreviation: schoolForm.abbreviation, level: schoolForm.level, cluster_id: clusterId });
      const patchUser = existingUser
        ? api.patch(`/api/admin/users/${existingUser.id}`, { salutation: schoolHeadForm.salutation || null, first_name: schoolHeadForm.first_name || null, middle_initial: schoolHeadForm.middle_initial || null, last_name: schoolHeadForm.last_name || null, position: schoolHeadForm.position || null })
        : Promise.resolve();
      await Promise.all([patchSchool, patchUser]);
      await fetchAll();
      return { ok: true };
    } catch (e) { setFormError(e.friendlyMessage ?? 'Operation failed'); return { ok: false }; }
    finally { setActionLoading(false); }
  };

  const deleteSchool = async (schoolId) => {
    setActionLoading(true); setFormError('');
    try {
      await api.delete(`/api/admin/schools/${schoolId}`);
      fetchAll(); return { ok: true };
    } catch (e) { setFormError(e.friendlyMessage ?? 'Operation failed'); return { ok: false }; }
    finally { setActionLoading(false); }
  };

  const saveRestrictions = async (schoolId, restrictedIds) => {
    setActionLoading(true); setFormError('');
    try {
      await api.patch(`/api/admin/schools/${schoolId}/restrictions`, { restricted_program_ids: restrictedIds });
      fetchAll(); return { ok: true };
    } catch (e) { setFormError(e.friendlyMessage ?? 'Operation failed'); return { ok: false }; }
    finally { setActionLoading(false); }
  };

  const uploadSchoolLogo = async (schoolId, file, onUpdate) => {
    setLogoUploading(true); setFormError('');
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await api.post(`/api/admin/schools/${schoolId}/logo`, formData);
      onUpdate(res.data.logo ?? null);
      fetchAll();
      return { ok: true };
    } catch (e) { return { ok: false, message: e.friendlyMessage ?? 'Upload failed.' }; }
    finally { setLogoUploading(false); }
  };

  const removeSchoolLogo = async (schoolId, onUpdate) => {
    setLogoUploading(true); setFormError('');
    try {
      await api.delete(`/api/admin/schools/${schoolId}/logo`);
      onUpdate(null);
      fetchAll();
      return { ok: true };
    } catch (e) { return { ok: false, message: e.friendlyMessage ?? 'Failed to remove logo.' }; }
    finally { setLogoUploading(false); }
  };

  return {
    clusters, programs, loading, fetchError, actionLoading, logoUploading, formError, setFormError,
    fetchAll,
    addCluster, editCluster, deleteCluster, uploadClusterLogo, removeClusterLogo, assignClusterHead,
    addSchool, editSchool, deleteSchool, saveRestrictions, uploadSchoolLogo, removeSchoolLogo,
  };
}
