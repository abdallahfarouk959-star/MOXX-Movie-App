import React, { useState, useEffect } from 'react';
import { auth, signIn, logOut } from '../firebase';
import { User } from 'firebase/auth';
import { Search, Bell, User as UserIcon, LogOut, Bookmark, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoadingAuth(true);
      await signIn();
    } catch (error) {
      console.error("Sign-in failed:", error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogOut = async () => {
    try {
      await logOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Log-out failed:", error);
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-netflix-black shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-netflix-red text-2xl sm:text-3xl font-display font-black tracking-tighter">
            MOXX
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/movies" className="hover:text-white transition-colors">Movies</Link>
            <Link to="/tv" className="hover:text-white transition-colors">TV Shows</Link>
            <Link to="/watchlist" className="hover:text-white transition-colors">My List</Link>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Titles, people, genres"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border border-white/20 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-netflix-red w-48 lg:w-64 transition-all text-white placeholder-gray-400"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </form>

          <button className="text-gray-300 hover:text-white">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`} 
                  alt="Profile" 
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-md object-cover border border-white/10"
                />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-netflix-dark border border-white/10 rounded-lg shadow-2xl overflow-hidden text-white"
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-semibold truncate">{user.displayName || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link to="/watchlist" className="flex items-center gap-3 p-3 text-sm hover:bg-white/5 transition-colors">
                      <Bookmark className="w-4 h-4" /> My List
                    </Link>
                    <button 
                      onClick={handleLogOut}
                      className="w-full flex items-center gap-3 p-3 text-sm hover:bg-white/5 transition-colors text-red-500"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              disabled={isLoadingAuth}
              className="bg-netflix-red text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoadingAuth ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}