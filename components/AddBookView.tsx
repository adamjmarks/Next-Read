import React, { useState } from 'react';
import { Book } from '../types';
import { StarRating } from './StarRating';
import { ChevronLeft, Check, BookOpen } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Note: using a simple generator instead of uuid lib for simplicity if needed, but I'll implement a simple one below to avoid external deps if preferred, OR just use Date.now()

interface AddBookViewProps {
  onAdd: (book: Book) => void;
  onCancel: () => void;
}

export const AddBookView: React.FC<AddBookViewProps> = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || rating === 0) {
      setError('Please fill in all fields and give a rating.');
      return;
    }

    const newBook: Book = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim(),
      rating,
      dateAdded: Date.now(),
    };

    onAdd(newBook);
  };

  return (
    <div className="max-w-md mx-auto">
      <button 
        onClick={onCancel}
        className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back to Library
      </button>

      <div className="bg-white rounded-2xl shadow-xl shadow-brand-100/20 border border-slate-100 p-8">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-brand-100 p-3 rounded-full">
                <BookOpen className="w-6 h-6 text-brand-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">Add a Read Book</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Book Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. The Great Gatsby"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. F. Scott Fitzgerald"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">My Rating</label>
            <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <StarRating rating={rating} onRate={setRating} size="lg" />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3.5 rounded-xl shadow-lg shadow-brand-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Check className="w-5 h-5" />
            Save to Library
          </button>
        </form>
      </div>
    </div>
  );
};