import { useAuth } from './useAuth';
import { USER_ROLES } from '../utils/constants';

export const usePrivateAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const isAuthorized = isAuthenticated && 
    (user?.role === USER_ROLES.MEMBER || user?.role === USER_ROLES.ADMIN);

  return { isAuthorized, isLoading, user };
};
