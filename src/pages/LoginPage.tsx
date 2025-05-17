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
    // Only redirect if we're sure the user is logged in (and we're not still loading)
    if (user && !isLoading) {
      // Check if there's a saved path to redirect to
      const redirectPath = localStorage.getItem('redirectPath');
      if (redirectPath) {
        console.log('User is logged in, redirecting to:', redirectPath);
        // Don't clear the redirectPath here - we'll keep it for page refreshes
        navigate(redirectPath);
      } else {
        console.log('User is logged in, redirecting to dashboard');
        navigate('/');
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Left side - Primary color background */}
      <div className="hidden md:block md:w-1/2 bg-iskcon-primary relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-iskcon-secondary/20 blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}>
        </div>

        {/* Content */}
        <div className="h-full w-full flex items-center justify-center relative z-20">
          <div className="p-12 max-w-md text-center">
            <h1 className="text-4xl font-bold text-white mb-6">Annamrita POS</h1>
            <p className="text-white/90 text-lg mb-8">
              Prasadam Distribution Management System
            </p>
            <div className="mt-12 p-6 border border-white/20 rounded-lg bg-white/5 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-iskcon-primary px-4 text-white/80 text-sm">
                Maha Mantra
              </div>
              <p className="text-white/90 text-lg font-medium leading-relaxed">
                Hare Krishna Hare Krishna<br />
                Krishna Krishna Hare Hare<br />
                Hare Rama Hare Rama<br />
                Rama Rama Hare Hare
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
