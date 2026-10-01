import { useAuth } from './useAuth';
import { USER_ROLES } from '../utils/constants';

export const usePublicAuth = () => {
  const { user, isLoading } = useAuth();

  const isGuest = user?.role === USER_ROLES.GUEST;

  return { isGuest, isLoading, user };
};
