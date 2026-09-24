import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getSessionUser());

  const login = useCallback(async (credentials) => {
    const u = await authService.login(credentials);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (details) => {
    const u = await authService.signup(details);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (patch) => {
      const u = await authService.updateProfile(user.id, patch);
      setUser(u);
      return u;
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, login, signup, logout, updateProfile, requestPasswordReset: authService.requestPasswordReset }),
    [user, login, signup, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
