import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  switchRole: (role: UserRole) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    email: 'akim@saryarka.gov.kz',
    full_name: 'Аманжолов Нурлан Серикович',
    role: 'akim',
    department: 'Аппарат Акима Сарыаркинской области',
    phone: '+7 (701) 111-22-33'
  });
  const [currentRole, setCurrentRole] = useState<UserRole>('akim');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Получение текущего пользователя при загрузке
    api.getMe()
      .then(user => {
        if (user) {
          setCurrentUser(user);
          setCurrentRole(user.role);
        }
      })
      .catch(() => {});
  }, []);

  const switchRole = async (role: UserRole) => {
    setLoading(true);
    try {
      const res = await api.switchRole(role);
      setCurrentUser(res.user);
      setCurrentRole(role);
    } catch (e) {
      // Fallback
      setCurrentRole(role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, currentRole, switchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
