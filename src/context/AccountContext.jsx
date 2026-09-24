import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as accountService from '../services/accountService';
import { onStorageChange } from '../services/storage';
import { useAuth } from './AuthContext';

const AccountContext = createContext(null);
const EMPTY = { orders: [], projects: [], notifications: [] };

export function AccountProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!userId) return;
    setData(await accountService.getAccount(userId));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setData(EMPTY);
    refresh();
  }, [refresh]);

  // When staff update this customer's order in another tab, show it right away.
  useEffect(() => {
    if (!userId) return undefined;
    return onStorageChange((key) => key === `account.${userId}`, refresh);
  }, [userId, refresh]);

  const placeOrder = useCallback(
    async (payload) => {
      const order = await accountService.placeOrder(userId, payload);
      await refresh();
      return order;
    },
    [userId, refresh]
  );

  const submitProject = useCallback(
    async (payload) => {
      const project = await accountService.submitProject(userId, payload);
      await refresh();
      return project;
    },
    [userId, refresh]
  );

  const advanceStatus = useCallback(
    async (ref) => {
      const item = await accountService.advanceStatus(userId, ref);
      await refresh();
      return item;
    },
    [userId, refresh]
  );

  const markRead = useCallback(
    async (ids = null) => {
      const notifications = await accountService.markNotificationsRead(userId, ids);
      setData((d) => ({ ...d, notifications }));
    },
    [userId]
  );

  const findByRef = useCallback(
    (ref) => {
      const clean = ref.trim().toUpperCase();
      return [...data.orders, ...data.projects].find((i) => i.ref === clean) ?? null;
    },
    [data]
  );

  const value = useMemo(
    () => ({
      ...data,
      loading,
      unreadCount: data.notifications.filter((n) => !n.read).length,
      refresh,
      placeOrder,
      submitProject,
      advanceStatus,
      markRead,
      findByRef,
    }),
    [data, loading, refresh, placeOrder, submitProject, advanceStatus, markRead, findByRef]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export const useAccount = () => useContext(AccountContext);
