import React, { useState, useEffect } from 'react';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { getImageUrl } from '../services/tmdb';
import { Play, Trash2 } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export default function Watchlist() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    // الاستماع لحالة الـ Auth أولاً وتأكيد وجود المستخدم
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      
      if (!user) {
        setItems([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const path = `users/${currentUser.uid}/watchlist`;
    const q = query(collection(db, path), orderBy('addedAt', 'desc'));

    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
        setLoading(false);
      }
    );

    return () => unsubscribeSnapshot();
  }, [currentUser]);

  const removeItem = async (tmdbId: number) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}/watchlist/${tmdbId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  if (loading) {
    return <div className="pt-32 px-8 text-center text-gray-400">Loading your list...</div>;
  }

  if (!currentUser) {
    return <div className="pt-32 px-8 text-center text-gray-400">Please sign in to view your watchlist.</div>;
  }

  return (
    <div className="pt-24 sm:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <h1 className="text-3xl sm:text-4xl font-display font-black mb-8">My List</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl">You haven't added anything to your list yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {items.map((item) => (
            <div key={item.tmdbId || item.id} className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-netflix-dark">
              <img
                src={getImageUrl(item.posterPath || item.poster_path)}
                alt={item.title || item.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-4">
                <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/80 transition-colors">
                  <Play className="w-6 h-6 fill-current" />
                </button>
                <button
                  onClick={() => removeItem(item.tmdbId || item.id)}
                  className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <p className="text-xs font-bold text-center px-2 line-clamp-2">{item.title || item.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}