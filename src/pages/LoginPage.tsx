import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuthStore } from '../store/authStore';

export const LoginPage = () => {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    console.log('LoginPage - Current user:', user);
    if (user && !isLoading) {
      console.log('User is logged in, redirecting to dashboard');
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-iskcon-light to-white">
      <div className="w-full max-w-md">
        <LoginForm />

        <div className="mt-4 text-center">
          <p className="text-sm text-iskcon-primary font-medium">
            Contact admin for account access
          </p>
        </div>
      </div>
    </div>
  );
};
