import React from 'react';
import { Book } from '../types';
import { StarRating } from './StarRating';
import { BookOpen, Plus, Trash2, Download } from 'lucide-react';

interface LibraryViewProps {
  books: Book[];
  onAddClick: () => void;
  onImportClick: () => void;
  onRemoveBook: (id: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ books, onAddClick, onImportClick, onRemoveBook }) => {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="bg-brand-100 p-6 rounded-full mb-6">
          <BookOpen className="w-12 h-12 text-brand-600" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">Your library is empty</h2>
        <p className="text-slate-500 mb-8 max-w-sm">
          Start by adding books you've already read and rated. This helps the AI understand your taste!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
            onClick={onImportClick}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 px-6 py-3 rounded-full font-medium transition-colors"
            >
            <Download className="w-5 h-5" />
            Import
            </button>
            <button
            onClick={onAddClick}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-brand-200"
            >
            <Plus className="w-5 h-5" />
            Add Manually
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 px-1 gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">My Library</h2>
          <p className="text-sm text-slate-500">{books.length} books read</p>
        </div>
        <div className="flex gap-2">
            <button
            onClick={onImportClick}
            className="bg-white border border-brand-200 hover:bg-brand-50 text-brand-700 px-4 py-2 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
            >
            <Download className="w-4 h-4" />
            Import
            </button>
            <button
            onClick={onAddClick}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-full shadow-md transition-colors flex items-center gap-2 font-medium text-sm"
            >
            <Plus className="w-4 h-4" />
            Add Book
            </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.slice().reverse().map((book) => (
          <div key={book.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative group">
             <button 
                onClick={() => onRemoveBook(book.id)}
                className="absolute top-3 right-3 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Remove book"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-2">{book.title}</h3>
            <p className="text-slate-500 text-sm mb-3 line-clamp-1">by {book.author}</p>
            <div className="mt-auto">
              <StarRating rating={book.rating} readonly size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};