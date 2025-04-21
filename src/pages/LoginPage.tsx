import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuthStore } from '../store/authStore';

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        {isLogin ? <LoginForm /> : <RegisterForm />}

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};
