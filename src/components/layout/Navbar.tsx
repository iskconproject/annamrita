import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const Navbar = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-indigo-600">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-xl font-bold text-white">
                Annamrita POS
              </Link>
            </div>
            
            {user && (
              <div className="hidden md:block">
                <div className="flex items-baseline ml-10 space-x-4">
                  <Link
                    to="/"
                    className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-500"
                  >
                    Dashboard
                  </Link>
                  
                  <Link
                    to="/pos"
                    className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-500"
                  >
                    POS
                  </Link>
                  
                  <Link
                    to="/orders"
                    className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-500"
                  >
                    Orders
                  </Link>
                  
                  {user.role === 'admin' && (
                    <>
                      <Link
                        to="/menu"
                        className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-500"
                      >
                        Menu
                      </Link>
                      
                      <Link
                        to="/reports"
                        className="px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-indigo-500"
                      >
                        Reports
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {user && (
            <div className="hidden md:block">
              <div className="flex items-center ml-4 md:ml-6">
                <span className="text-sm font-medium text-white">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={() => logout()}
                  className="px-3 py-2 ml-4 text-sm font-medium text-white bg-indigo-700 rounded-md hover:bg-indigo-800"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
          
          {/* Mobile menu button */}
          <div className="flex -mr-2 md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 text-indigo-200 bg-indigo-600 rounded-md hover:text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className="block w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className="hidden w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className="md:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/"
            className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
          >
            Dashboard
          </Link>
          
          <Link
            to="/pos"
            className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
          >
            POS
          </Link>
          
          <Link
            to="/orders"
            className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
          >
            Orders
          </Link>
          
          {user?.role === 'admin' && (
            <>
              <Link
                to="/menu"
                className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
              >
                Menu
              </Link>
              
              <Link
                to="/reports"
                className="block px-3 py-2 text-base font-medium text-white rounded-md hover:bg-indigo-500"
              >
                Reports
              </Link>
            </>
          )}
        </div>
        
        {user && (
          <div className="pt-4 pb-3 border-t border-indigo-700">
            <div className="flex items-center px-5">
              <div className="ml-3">
                <div className="text-base font-medium text-white">{user.name}</div>
                <div className="text-sm font-medium text-indigo-300">{user.email}</div>
              </div>
            </div>
            <div className="px-2 mt-3 space-y-1">
              <button
                onClick={() => logout()}
                className="block w-full px-3 py-2 text-base font-medium text-left text-white rounded-md hover:bg-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
