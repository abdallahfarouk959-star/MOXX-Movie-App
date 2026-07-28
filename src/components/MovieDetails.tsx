import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdb, Movie, getImageUrl } from '../services/tmdb';
import { Play, Plus, Check, Star, Clock, Calendar, ArrowLeft, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFavorites } from '../FavoritesContext';
import MovieRow from './MovieRow';

export default function MovieDetails() {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<any>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    if (!id || !type) return;
    setLoading(true);
    
    Promise.all([
      tmdb.getDetails(type, Number(id)),
      tmdb.getCredits(type, Number(id)),
      tmdb.getVideos(type, Number(id))
    ]).then(([details, credits, videos]) => {
      setMovie(details);
      if (credits && credits.cast) {
        setCast(credits.cast.slice(0, 10));
      }
      if (videos && videos.results) {
        const youtubeTrailer = videos.results.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
        setTrailer(youtubeTrailer?.key || null);
      }
      setLoading(false);
      window.scrollTo(0, 0);
    }).catch(err => {
      console.error('Error fetching movie details:', err);
      setLoading(false);
    });
  }, [id, type]);

  if (loading) return <div className="pt-32 px-8 text-center text-gray-400">Loading details...</div>;
  if (!movie) return <div className="pt-32 px-8 text-center text-gray-400">Movie not found.</div>;

  return (
    <div className="min-h-screen bg-netflix-black pb-20">
      <div className="relative h-[60vh] sm:h-[80vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={getImageUrl(movie.backdrop_path)} 
            alt={movie.title || movie.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/40 to-transparent" />
        </div>
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-24 left-4 sm:left-8 z-40 bg-black/40 p-2 rounded-full hover:bg-black/60 transition-colors backdrop-blur-md"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 sm:-mt-64 z-20">
        <div className="flex flex-col md:flex-row gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-none w-64 hidden md:block rounded-xl overflow-hidden shadow-2xl border border-white/10"
          >
            <img src={getImageUrl(movie.poster_path)} alt={movie.title} className="w-full h-full object-cover" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm font-medium text-gray-400">
              <span className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" /> {movie.vote_average.toFixed(1)}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {movie.runtime || movie.episode_run_time?.[0]} min</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-display font-black mb-6 leading-tight">
              {movie.title || movie.name}
            </h1>

            <div className="flex flex-wrap gap-2 mb-8">
              {movie.genres?.map((g: any) => (
                <span key={g.id} className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold border border-white/10">
                  {g.name}
                </span>
              ))}
            </div>

            <p className="text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed max-w-3xl">
              {movie.overview}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-16">
              {trailer && (
                <a 
                  href={`https://www.youtube.com/watch?v=${trailer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold hover:bg-white/80 transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" /> Watch Trailer
                </a>
              )}
              <button 
                onClick={() => toggleFavorite(movie)}
                className={`flex items-center gap-2 px-8 py-3 rounded font-bold transition-colors border-2 ${isFavorite(movie.id) ? 'bg-red-500 border-red-500 text-white' : 'bg-transparent border-white/20 hover:border-white'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorite(movie.id) ? 'fill-current' : ''}`} /> 
                {isFavorite(movie.id) ? 'Favorited' : 'Add to Favorites'}
              </button>
            </div>

            <div className="mb-16">
              <h2 className="text-2xl font-display font-bold mb-6">Top Cast</h2>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                {cast.map(person => (
                  <div key={person.id} className="flex-none w-32 text-center">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-3 border-2 border-white/10">
                      <img 
                        src={person.profile_path ? getImageUrl(person.profile_path) : `https://ui-avatars.com/api/?name=${person.name}`} 
                        alt={person.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-bold truncate">{person.name}</p>
                    <p className="text-xs text-gray-500 truncate">{person.character}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-20">
          <MovieRow 
            title="Similar Titles" 
            fetchAction={() => tmdb.getSimilar(type, Number(id))} 
          />
        </div>
      </div>
    </div>
  );
}
