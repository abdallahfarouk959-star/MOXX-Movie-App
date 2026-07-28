import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import Watchlist from './components/Watchlist';
import Search from './components/Search';
import MovieDetails from './components/MovieDetails';
import { tmdb } from './services/tmdb';
import { FavoritesProvider } from './FavoritesContext';

function Home() {
  return (
    <main className="pb-20">
      <Hero />
      <div className="-mt-16 sm:-mt-32 relative z-20 space-y-4">
        <MovieRow title="Trending Now" fetchAction={() => tmdb.getTrending('all')} />
        <MovieRow title="Popular Movies" fetchAction={() => tmdb.getPopular('movie')} />
        <MovieRow title="Top Rated Movies" fetchAction={() => tmdb.getTopRated('movie')} />
        <MovieRow title="Upcoming Releases" fetchAction={() => tmdb.getUpcoming()} />
        <MovieRow title="Popular TV Shows" fetchAction={() => tmdb.getPopular('tv')} />
      </div>
    </main>
  );
}

// صفحة للأفلام فقط
function MoviesPage() {
  return (
    <main className="pb-20 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-bold text-white mb-6">Movies</h1>
      </div>
      <div className="space-y-4">
        <MovieRow title="Popular Movies" fetchAction={() => tmdb.getPopular('movie')} />
        <MovieRow title="Top Rated Movies" fetchAction={() => tmdb.getTopRated('movie')} />
        <MovieRow title="Upcoming Releases" fetchAction={() => tmdb.getUpcoming()} />
        <MovieRow title="Trending Movies" fetchAction={() => tmdb.getTrending('movie')} />
      </div>
    </main>
  );
}

// صفحة للمسلسلات فقط (TV Shows)
function TVPage() {
  return (
    <main className="pb-20 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-bold text-white mb-6">TV Shows</h1>
      </div>
      <div className="space-y-4">
        <MovieRow title="Popular TV Shows" fetchAction={() => tmdb.getPopular('tv')} />
        <MovieRow title="Top Rated TV Shows" fetchAction={() => tmdb.getTopRated('tv')} />
        <MovieRow title="Trending TV Shows" fetchAction={() => tmdb.getTrending('tv')} />
        <MovieRow title="Airing Today" fetchAction={() => tmdb.getTVShows('airing_today')} />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <FavoritesProvider>
      <Router>
        <div className="min-h-screen bg-netflix-black text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/tv" element={<TVPage />} />
            <Route path="/details/:type/:id" element={<MovieDetails />} />
          </Routes>
          
          <footer className="py-12 border-t border-white/10 text-center text-gray-500 text-sm">
            <div className="max-w-7xl mx-auto px-4">
              <p className="mb-4">© 2026 MOXX Streaming Discovery. All rights reserved.</p>
              <div className="flex justify-center gap-6">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Contact Us</a>
              </div>
              <p className="mt-8 text-xs opacity-50">Build By Abdallah M Farouk.</p>
            </div>
          </footer>
        </div>
      </Router>
    </FavoritesProvider>
  );
}