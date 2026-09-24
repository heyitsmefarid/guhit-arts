import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as adminService from '../services/adminService';
import { onStorageChange } from '../services/storage';
import { useAuth } from './AuthContext';

const AdminContext = createContext(null);
const EMPTY = { orders: [], projects: [], customers: [], products: [], team: [] };

export function AdminProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const actor = user?.fullName ?? '';

  const refresh = useCallback(async () => {
    setData(await adminService.getAdminData());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // New orders, requests, and sign-ups from customers in other tabs appear live.
  useEffect(
    () =>
      onStorageChange(
        (key) => key.startsWith('account.') || key === 'users' || key.startsWith('inventory') || key === 'customProducts',
        refresh
      ),
    [refresh]
  );

  // Wrap each staff action so the lists refresh afterwards.
  const act = useCallback(
    (fn) =>
      async (...args) => {
        const result = await fn(...args);
        await refresh();
        return result;
      },
    [refresh]
  );

  const value = useMemo(
    () => ({
      ...data,
      loading,
      refresh,
      // Status changes record who made them, for the activity feed.
      updateOrderStatus: act((ref, status, note) => adminService.updateOrderStatus(ref, status, note, actor)),
      updateProject: act((ref, patch) => adminService.updateProject(ref, { ...patch, by: actor })),
      updateProduct: act(adminService.updateProduct),
      addProduct: act(adminService.addProduct),
      addTeamMember: act(adminService.addTeamMember),
      updateTeamMember: act(adminService.updateTeamMember),
      findOrder: (ref) => data.orders.find((o) => o.ref === ref) ?? null,
      findProject: (ref) => data.projects.find((p) => p.ref === ref) ?? null,
    }),
    [data, loading, refresh, act, actor]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export const useAdmin = () => useContext(AdminContext);
