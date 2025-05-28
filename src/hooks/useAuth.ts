import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';

  return { user, isLoggedIn, logout, isAdmin, isUser };
}
