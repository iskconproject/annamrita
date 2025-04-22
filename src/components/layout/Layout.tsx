import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { useAuthStore } from '../../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {user && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-iskcon-primary bg-iskcon-light">
        &copy; {new Date().getFullYear()} ISKCON Asansol. All rights reserved.
      </footer>
    </div>
  );
};
