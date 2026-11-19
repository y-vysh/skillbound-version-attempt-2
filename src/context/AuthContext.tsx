import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { apiRequest, getStoredToken, setStoredToken } from '../services/api';
import type { Skill, User, UserLevelInfo } from '../types';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AuthContextValue {
  user: User | null;
  teachSkills: Skill[];
  learnSkills: Skill[];
  profileCompletion: number;
  levelInfo: UserLevelInfo | null;
  loading: boolean;
  socket: Socket | null;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  login: (email: string, password: string) => Promise<User>;
  register: (formData: FormData) => Promise<User>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [teachSkills, setTeachSkills] = useState<Skill[]>([]);
  const [learnSkills, setLearnSkills] = useState<Skill[]>([]);
  const [profileCompletion, setProfileCompletion] = useState<number>(0);
  const [levelInfo, setLevelInfo] = useState<UserLevelInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [socketState, setSocketState] = useState<Socket | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3400);
  }, []);

  const connectSocket = useCallback((token: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    const s = io({
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = s;
    setSocketState(s);
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketState(null);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest<{
        user: User;
        teachSkills: Skill[];
        learnSkills: Skill[];
        profileCompletion: number;
        levelInfo: UserLevelInfo;
      }>('/auth/me');
      setUser(data.user);
      setTeachSkills(data.teachSkills);
      setLearnSkills(data.learnSkills);
      setProfileCompletion(data.profileCompletion);
      setLevelInfo(data.levelInfo);
      if (!socketRef.current) {
        connectSocket(token);
      }
    } catch {
      setStoredToken(null);
      setUser(null);
      disconnectSocket();
    } finally {
      setLoading(false);
    }
  }, [connectSocket, disconnectSocket]);

  useEffect(() => {
    refreshMe();
    return () => {
      disconnectSocket();
    };
  }, [refreshMe, disconnectSocket]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setStoredToken(data.token);
      connectSocket(data.token);
      await refreshMe();
      return data.user;
    },
    [connectSocket, refreshMe]
  );

  const register = useCallback(
    async (formData: FormData) => {
      const data = await apiRequest<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: formData,
      });
      setStoredToken(data.token);
      connectSocket(data.token);
      await refreshMe();
      return data.user;
    },
    [connectSocket, refreshMe]
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setTeachSkills([]);
    setLearnSkills([]);
    disconnectSocket();
    showToast('Signed out of SkillBound', 'info');
  }, [disconnectSocket, showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        teachSkills,
        learnSkills,
        profileCompletion,
        levelInfo,
        loading,
        socket: socketState,
        toast,
        showToast,
        login,
        register,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
