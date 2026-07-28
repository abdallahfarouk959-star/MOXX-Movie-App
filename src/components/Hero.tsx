import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdb, Movie, getImageUrl } from '../services/tmdb';
import { Play, Info, Plus, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function Hero() {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    tmdb.getTrending('movie').then(data => {
      if (data && data.results && data.results.length > 0) {
        const movies = data.results;
        const selected = movies[Math.floor(Math.random() * movies.length)];
        setMovie(selected);
        
        if (selected) {
          tmdb.getVideos('movie', selected.id).then(videos => {
            if (videos && videos.results) {
              const ytTrailer = videos.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer');
              setTrailer(ytTrailer?.key || null);
            }
          }).catch(err => console.error('Error fetching hero trailer:', err));
        }
      }
    }).catch(err => console.error('Error fetching hero movie:', err));
  }, []);

  useEffect(() => {
    if (!movie || !auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/watchlist/${movie.id}`;
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      setInWatchlist(docSnap.exists());
    }, (err) => handleFirestoreError(err, OperationType.GET, path));
    return () => unsubscribe();
  }, [movie]);

  const toggleWatchlist = async () => {
    if (!auth.currentUser || !movie) return;
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

  if (!movie) return <div className="h-[80vh] bg-netflix-black animate-pulse" />;

  return (
    <div className="relative h-[80vh] sm:h-[90vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src={getImageUrl(movie.backdrop_path)} 
          alt={movie.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black mb-4 leading-tight">
            {movie.title || movie.name}
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 line-clamp-3 sm:line-clamp-4 max-w-xl">
            {movie.overview}
          </p>
          
          <div className="flex flex-wrap items-center gap-4">
            {trailer ? (
              <a 
                href={`https://www.youtube.com/watch?v=${trailer}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-black px-6 sm:px-8 py-2 sm:py-3 rounded font-bold hover:bg-white/80 transition-colors"
              >
                <Play className="w-5 h-5 fill-current" /> Play Trailer
              </a>
            ) : (
              <button className="flex items-center gap-2 bg-white text-black px-6 sm:px-8 py-2 sm:py-3 rounded font-bold hover:bg-white/80 transition-colors">
                <Play className="w-5 h-5 fill-current" /> Play
              </button>
            )}
            <button 
              onClick={() => navigate(`/details/movie/${movie.id}`)}
              className="flex items-center gap-2 bg-gray-500/50 text-white px-6 sm:px-8 py-2 sm:py-3 rounded font-bold hover:bg-gray-500/30 transition-colors backdrop-blur-sm"
            >
              <Info className="w-5 h-5" /> More Info
            </button>
            <button 
              onClick={toggleWatchlist}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/40 hover:border-white transition-colors"
            >
              {inWatchlist ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
