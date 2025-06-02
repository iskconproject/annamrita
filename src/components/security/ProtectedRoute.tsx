import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types/auth';
import { hasPermission, auditLogger } from '../../utils/security';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: UserRole[];
  requiredPermission?: string;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/login'
}) => {
  const { user, isLoading } = useAuthStore();
  const location = window.location;

  // If we're still loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-iskcon-light">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-iskcon-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-iskcon-primary font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    // Save the current path to localStorage before redirecting
    if (location.pathname !== '/login') {
      localStorage.setItem('redirectPath', location.pathname);
    }

    // Audit log unauthorized access attempt
    auditLogger.log({
      userId: 'anonymous',
      action: 'unauthorized_access_attempt',
      resource: location.pathname,
      success: false,
      details: {
        path: location.pathname,
        reason: 'no_user_session'
      }
    });

    return <Navigate to={fallbackPath} replace />;
  }

  // Check role-based access
  if (requiredRole && !requiredRole.includes(user.role)) {
    // Audit log insufficient role access attempt
    auditLogger.log({
      userId: user.id,
      action: 'insufficient_role_access_attempt',
      resource: location.pathname,
      success: false,
      details: {
        userRole: user.role,
        requiredRoles: requiredRole,
        path: location.pathname
      }
    });

    return <Navigate to="/" replace />;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    // Audit log insufficient permission access attempt
    auditLogger.log({
      userId: user.id,
      action: 'insufficient_permission_access_attempt',
      resource: location.pathname,
      success: false,
      details: {
        userRole: user.role,
        requiredPermission,
        path: location.pathname
      }
    });

    return <Navigate to="/" replace />;
  }

  // Audit log successful access
  auditLogger.log({
    userId: user.id,
    action: 'route_access',
    resource: location.pathname,
    success: true,
    details: {
      userRole: user.role,
      path: location.pathname
    }
  });

  // If all checks pass, render the children
  return children;
};

// Higher-order component for easier usage
export const withRoleProtection = (
  Component: React.ComponentType<any>,
  requiredRole: UserRole[]
) => {
  return (props: any) => (
    <ProtectedRoute requiredRole={requiredRole}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Higher-order component for permission-based protection
export const withPermissionProtection = (
  Component: React.ComponentType<any>,
  requiredPermission: string
) => {
  return (props: any) => (
    <ProtectedRoute requiredPermission={requiredPermission}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Admin-only route wrapper
export const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <ProtectedRoute requiredRole={['admin']}>
    {children}
  </ProtectedRoute>
);

// Volunteer+ route wrapper (volunteer, kitchen, admin)
export const VolunteerRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <ProtectedRoute requiredRole={['volunteer', 'kitchen', 'admin']}>
    {children}
  </ProtectedRoute>
);

// Kitchen+ route wrapper (kitchen, admin)
export const KitchenRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <ProtectedRoute requiredRole={['kitchen', 'admin']}>
    {children}
  </ProtectedRoute>
);
