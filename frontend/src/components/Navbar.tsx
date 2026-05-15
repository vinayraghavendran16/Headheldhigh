import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, LogOut, User } from 'lucide-react';

interface NavbarProps {
  userId?: number;
}

export default function Navbar({ userId }: NavbarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('userId');
    navigate('/');
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-indigo-600 rounded-lg p-1.5">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">HeadHeldHigh</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/talent-pool" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
              Talent Pool
            </Link>
            {userId && (
              <Link to={`/dashboard/${userId}`} className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {userId ? (
              <>
                <Link
                  to={`/dashboard/${userId}`}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">My Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <Link
                to="/onboarding"
                className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
