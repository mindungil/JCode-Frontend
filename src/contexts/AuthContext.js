import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { requireApiUrl } from '../config/runtimeConfig';
import { getCurrentToken, isValidToken, refreshTokenRequest, removeToken } from '../utils/tokenUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      let token = getCurrentToken();
      if (!isValidToken(token)) {
        token = await refreshTokenRequest();
      }

      try {
        const decodedToken = jwtDecode(token);
        
        setUser({
          email: decodedToken.sub,
          role: decodedToken.role,
          assistantCourses: decodedToken.assistantCourses || []
        });
      } catch (error) {
        setUser(null);
        removeToken();
      }
    } catch (error) {
      setUser(null);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => {
    window.location.href = `${requireApiUrl()}/oauth2/authorization/keycloak`;
  };

  const logout = async () => {
    try {
      setUser(null);
      await authService.logout();
    } catch (error) {
      //console.error('로그아웃 실패:', error);
      // 실패해도 로컬 상태는 정리
      removeToken();
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    checkAuth,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
