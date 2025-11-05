import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute = ({ children }) => {
  const { currentUser } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};