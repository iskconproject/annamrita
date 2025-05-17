import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Home,
  ShoppingCart,
  ClipboardList,
  BarChart2,
  Settings,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <Home className="w-5 h-5" />,
      showFor: ['admin', 'staff']
    },
    {
      name: 'POS',
      path: '/pos',
      icon: <ShoppingCart className="w-5 h-5" />,
      showFor: ['admin', 'staff']
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: <ClipboardList className="w-5 h-5" />,
      showFor: ['admin', 'staff']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChart2 className="w-5 h-5" />,
      showFor: ['admin']
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
      showFor: ['admin']
    }
  ];

  const filteredNavItems = navItems.filter(item =>
    item.showFor.includes(user?.role || '')
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-white bg-iskcon-primary rounded-md hover:bg-iskcon-dark focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:bg-white md:border-r md:border-gray-200 md:pt-5 md:w-20 md:items-center md:overflow-y-auto">
        <div className="flex items-center justify-center flex-shrink-0 px-4 mb-8">
          <Link to="/" className="text-xl font-bold text-iskcon-primary">
            <span className="text-2xl">🪔</span>
          </Link>
        </div>
        <div className="flex flex-col items-center flex-1 space-y-4 px-2">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "text-iskcon-primary border-iskcon-primary"
                  : "text-gray-600 hover:text-iskcon-primary hover:bg-iskcon-light"
              )}
            >
              {React.cloneElement(item.icon, {
                className: cn(
                  "w-5 h-5",
                  location.pathname === item.path ? "text-iskcon-primary" : ""
                )
              })}
              <span className={cn(
                "mt-1 text-xs",
                location.pathname === item.path ? "font-semibold" : ""
              )}>{item.name}</span>
            </Link>
          ))}
        </div>
        {user && (
          <div className="flex flex-col items-center pb-5 mt-6">
            <div className="w-10 h-10 rounded-full bg-iskcon-light flex items-center justify-center text-iskcon-primary font-bold mb-2">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <Button
              onClick={() => logout()}
              variant="ghost"
              className="w-14 h-14 rounded-lg flex flex-col items-center justify-center text-gray-600 hover:text-iskcon-primary hover:bg-iskcon-light"
            >
              <LogOut className="w-5 h-5" />
              <span className="mt-1 text-xs">Logout</span>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={toggleMobileMenu}></div>
          <div className="relative flex flex-col w-64 max-w-xs pt-5 pb-4 bg-white">
            <div className="flex items-center justify-between px-4 mb-6">
              <Link to="/" className="text-xl font-bold text-iskcon-primary flex items-center gap-2">
                <span className="text-iskcon-secondary">🪔</span> Annamrita POS
              </Link>
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-500 rounded-md hover:text-iskcon-primary focus:outline-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col flex-1 px-4 space-y-2">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={toggleMobileMenu}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "text-iskcon-primary border-l-4 border-iskcon-primary"
                      : "text-gray-600 hover:text-iskcon-primary hover:bg-iskcon-light"
                  )}
                >
                  {React.cloneElement(item.icon, {
                    className: cn(
                      "w-5 h-5",
                      location.pathname === item.path ? "text-iskcon-primary" : ""
                    )
                  })}
                  <span className={cn(
                    "ml-3",
                    location.pathname === item.path ? "font-semibold" : ""
                  )}>{item.name}</span>
                </Link>
              ))}
            </div>
            {user && (
              <div className="px-4 pt-4 pb-2 border-t border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-iskcon-light flex items-center justify-center text-iskcon-primary font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    logout();
                    toggleMobileMenu();
                  }}
                  variant="iskconSecondary"
                  className="w-full justify-start text-left"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
