import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tmdb, Movie, getImageUrl } from '../services/tmdb';
import { Search as SearchIcon, Filter, Play, Plus, Check, X, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useDebounce } from '../hooks/useDebounce';
import { MovieGridSkeleton } from './Skeleton';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<any[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [year, setYear] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    tmdb.getGenres().then(data => {
      if (data && data.genres) {
        setGenres(data.genres);
      }
    }).catch(err => console.error('Error fetching genres:', err));
  }, []);

  useEffect(() => {
    if (debouncedSearch !== queryParam) {
      setSearchParams({ q: debouncedSearch });
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    if (queryParam) {
      tmdb.search(queryParam).then(data => {
        if (data && data.results) {
          setResults(data.results.filter((r: any) => r.poster_path));
        } else {
          setResults([]);
        }
        setLoading(false);
      }).catch(err => {
        console.error('Error searching movies:', err);
        setResults([]);
        setLoading(false);
      });
    } else {
      tmdb.discover({ 
        with_genres: selectedGenre?.toString() || '',
        sort_by: sortBy,
        primary_release_year: year,
        'vote_average.gte': rating.toString()
      }).then(data => {
        if (data && data.results) {
          setResults(data.results);
        } else {
          setResults([]);
        }
        setLoading(false);
      }).catch(err => {
        console.error('Error discovering movies:', err);
        setResults([]);
        setLoading(false);
      });
    }
  }, [queryParam, selectedGenre, sortBy, year, rating]);

  const clearFilters = () => {
    setSelectedGenre(null);
    setSortBy('popularity.desc');
    setYear('');
    setRating(0);
    setSearchTerm('');
    setSearchParams({});
  };

  return (
    <div className="pt-24 sm:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex-1 max-w-xl relative">
          <input
            type="text"
            placeholder="Search movies, TV shows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-netflix-dark border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-netflix-red transition-all"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        
        <button 
          onClick={() => setShowSidebar(true)}
          className="flex items-center gap-2 bg-netflix-dark border border-white/10 rounded-xl px-6 py-3 hover:bg-white/5 transition-colors"
        >
          <Filter className="w-5 h-5" /> Filters
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSidebar(false)}
                className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed right-0 top-0 bottom-0 w-80 bg-netflix-dark z-[60] p-8 shadow-2xl border-l border-white/10"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-display font-black">Filters</h2>
                  <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-white/5 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider">Genre</label>
                    <div className="flex flex-wrap gap-2">
                      {genres.map(g => (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedGenre === g.id ? 'bg-netflix-red border-netflix-red text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/40'}`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider">Release Year</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 2024"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 focus:outline-none focus:border-netflix-red"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider">Minimum Rating</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        step="0.5"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="flex-1 accent-netflix-red"
                      />
                      <span className="text-lg font-bold text-yellow-500">{rating}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider">Sort By</label>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 focus:outline-none focus:border-netflix-red"
                    >
                      <option value="popularity.desc">Popularity</option>
                      <option value="vote_average.desc">Rating</option>
                      <option value="primary_release_date.desc">Newest</option>
                    </select>
                  </div>

                  <button 
                    onClick={clearFilters}
                    className="w-full py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm font-bold"
                  >
                    Clear All Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1">
          {loading ? (
            <MovieGridSkeleton />
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-xl">No results found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.map(movie => (
                <SearchResultCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchResultCard({ movie }: { movie: Movie, key?: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/watchlist/${movie.id}`;
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      setInWatchlist(docSnap.exists());
    }, (err) => handleFirestoreError(err, OperationType.GET, path));
    return () => unsubscribe();
  }, [movie.id]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/watchlist/${movie.id}`;
    try {
      if (inWatchlist) {
        await deleteDoc(doc(db, path));
      } else {
        await setDoc(doc(db, path), {
          userId: auth.currentUser.uid,
          tmdbId: movie.id,
          title: movie.title || movie.name,
          posterPath: movie.poster_path,
          mediaType: movie.media_type || 'movie',
          addedAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  return (
    <div 
      className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 z-10 hover:z-20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/details/${movie.media_type || 'movie'}/${movie.id}`)}
    >
      <img 
        src={getImageUrl(movie.poster_path)} 
        alt={movie.title} 
        className="w-full h-full object-cover"
      />
      
      <AnimatePresence>
        {isHovered && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 p-4 flex flex-col justify-end gap-3"
          >
            <h3 className="text-sm font-bold line-clamp-2">{movie.title || movie.name}</h3>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/80 transition-colors">
                <Play className="w-4 h-4 fill-current" />
              </button>
              <button 
                onClick={toggleWatchlist}
                className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center hover:border-white transition-colors"
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
