'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/types';
import MovieCard from './MovieCard';
import { movieService } from '@/services/movieService';

interface MovieListProps {
  initialMovies?: Movie[];
  type?: 'now-showing' | 'coming-soon' | 'all';
}

export default function MovieList({ initialMovies, type = 'all' }: MovieListProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies || []);
  const [loading, setLoading] = useState(!initialMovies);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialMovies) {
      fetchMovies();
    }
  }, [type]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      let data: Movie[];
      
      switch (type) {
        case 'now-showing':
          data = await movieService.getNowShowingMovies();
          break;
        case 'coming-soon':
          data = await movieService.getComingSoonMovies();
          break;
        default:
          const response = await movieService.getAllMovies(0, 20);
          data = response.content;
      }
      
      setMovies(data);
    } catch (err) {
      setError('Không thể tải danh sách phim');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-300 aspect-[2/3] rounded-lg mb-4"></div>
            <div className="bg-gray-300 h-4 rounded mb-2"></div>
            <div className="bg-gray-300 h-3 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchMovies}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không có phim nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
