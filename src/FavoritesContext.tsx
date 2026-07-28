import React, { createContext, useContext, useState, useEffect } from 'react';
import { Movie } from './services/tmdb';
import { auth, db, OperationType, handleFirestoreError } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface FavoritesContextType {
  favorites: Movie[];
  toggleFavorite: (movie: Movie) => void;
  isFavorite: (id: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // المزامنة مع Firestore عند تسجيل الدخول
  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }

    const path = `users/${currentUser.uid}/watchlist`;
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.tmdbId || Number(d.id),
            title: data.title,
            poster_path: data.posterPath,
            media_type: data.mediaType || 'movie',
            ...data,
          } as Movie;
        });
        setFavorites(docs);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, path)
    );

    return () => unsubscribe();
  }, [currentUser]);

  const toggleFavorite = async (movie: Movie) => {
    if (!currentUser) {
      alert('Please sign in to add items to your watchlist.');
      return;
    }

    const path = `users/${currentUser.uid}/watchlist/${movie.id}`;
    const exists = favorites.some((m) => m.id === movie.id);

    try {
      if (exists) {
        await deleteDoc(doc(db, path));
      } else {
        await setDoc(doc(db, path), {
          tmdbId: movie.id,
          title: movie.title || movie.name || '',
          posterPath: movie.poster_path || '',
          mediaType: movie.media_type || 'movie',
          addedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, exists ? OperationType.DELETE : OperationType.CREATE, path);
    }
  };

  const isFavorite = (id: number) => favorites.some((m) => m.id === id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}