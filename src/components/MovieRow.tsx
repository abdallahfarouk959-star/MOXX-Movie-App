import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, getImageUrl } from '../services/tmdb';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { MovieCardSkeleton } from './Skeleton';

interface MovieRowProps {
  title: string;
  fetchAction: () => Promise<any>;
}

export default function MovieRow({ title, fetchAction }: MovieRowProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchAction().then(data => {
      if (data && data.results) {
        setMovies(data.results);
      } else {
        setMovies([]);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching movies in MovieRow:', err);
      setMovies([]);
      setLoading(false);
    });
  }, [fetchAction]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="py-8 group relative">
      <h2 className="text-xl sm:text-2xl font-display font-bold mb-4 px-4 sm:px-6 lg:px-8 text-gray-200">
        {title}
      </h2>
      
      <div className="relative">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-40 bg-black/50 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div 
          ref={rowRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 scroll-smooth"
        >
          {loading ? (
            [...Array(10)].map((_, i) => <MovieCardSkeleton key={i} />)
          ) : (
            movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          )}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-40 bg-black/50 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie, key?: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;
    const watchlistPath = `users/${auth.currentUser.uid}/watchlist/${movie.id}`;
    const ratingPath = `users/${auth.currentUser.uid}/ratings/${movie.id}`;

    const unsubWatchlist = onSnapshot(doc(db, watchlistPath), (docSnap) => {
      setInWatchlist(docSnap.exists());
    }, (err) => handleFirestoreError(err, OperationType.GET, watchlistPath));

    const unsubRating = onSnapshot(doc(db, ratingPath), (docSnap) => {
      if (docSnap.exists()) setUserRating(docSnap.data().rating);
    }, (err) => handleFirestoreError(err, OperationType.GET, ratingPath));

    return () => { unsubWatchlist(); unsubRating(); };
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
      className="relative flex-none w-40 sm:w-48 lg:w-56 aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 z-10 hover:z-20"
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
            
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-green-500 font-bold">{Math.round(movie.vote_average * 10)}% Match</span>
              <span>{movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}</span>
            </div>

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
              {userRating && (
                <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                  <Star className="w-3 h-3 fill-current" /> {userRating}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
