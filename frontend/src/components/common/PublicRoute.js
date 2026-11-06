import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { getHomeForRole } from '../../utils/roleRoutes';

// For pages like /login and /register: signed-in users go straight to their own portal.
const PublicRoute = ({ children }) => {
  const { user, isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated && user) {
    const home = getHomeForRole(user.role);
    if (home !== '/login') {
      return <Navigate to={home} replace />;
    }
  }

  return children;
};

export default PublicRoute;
