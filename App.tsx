import React, { useState, useEffect } from 'react';
import { Book, AppView } from './types';
import { LibraryView } from './components/LibraryView';
import { PredictView } from './components/PredictView';
import { AddBookView } from './components/AddBookView';
import { ImportView } from './components/ImportView';
import { Library, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'nextread_library';

function App() {
  const [view, setView] = useState<AppView>(AppView.LIBRARY);
  const [books, setBooks] = useState<Book[]>([]);

  // Load books from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBooks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }
  }, []);

  // Save books whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  const handleAddBook = (book: Book) => {
    setBooks(prev => [...prev, book]);
    setView(AppView.LIBRARY);
  };

  const handleImportBooks = (newBooks: Book[]) => {
      setBooks(prev => {
        // Create a map of existing books by ID for fast lookup/updates
        const bookMap = new Map(prev.map(b => [b.id, b]));
        
        // Upsert new books: overwrite if ID exists, add if not
        newBooks.forEach(b => {
          bookMap.set(b.id, b);
        });
        
        // Convert map back to array
        return Array.from(bookMap.values());
      });
      setView(AppView.LIBRARY);
  }

  const handleRemoveBook = (id: string) => {
    if (window.confirm("Are you sure you want to remove this book?")) {
        setBooks(prev => prev.filter(b => b.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2" onClick={() => setView(AppView.LIBRARY)}>
                 <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl cursor-pointer shadow-brand-200 shadow-lg">
                    N
                 </div>
                 <h1 className="font-serif font-bold text-xl tracking-tight cursor-pointer">NextRead</h1>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {view === AppView.LIBRARY && (
          <LibraryView 
            books={books} 
            onAddClick={() => setView(AppView.ADD_BOOK)} 
            onImportClick={() => setView(AppView.IMPORT)}
            onRemoveBook={handleRemoveBook}
          />
        )}
        {view === AppView.PREDICT && (
          <PredictView history={books} />
        )}
        {view === AppView.ADD_BOOK && (
          <AddBookView 
            onAdd={handleAddBook} 
            onCancel={() => setView(AppView.LIBRARY)} 
          />
        )}
        {view === AppView.IMPORT && (
          <ImportView 
            onImportComplete={handleImportBooks}
            onCancel={() => setView(AppView.LIBRARY)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {(view === AppView.LIBRARY || view === AppView.PREDICT) && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full shadow-2xl shadow-slate-200 px-6 py-3 flex items-center gap-8 z-50">
          <button
            onClick={() => setView(AppView.LIBRARY)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              view === AppView.LIBRARY ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Library className={`w-6 h-6 ${view === AppView.LIBRARY ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Library</span>
          </button>
          
          <div className="w-px h-8 bg-slate-200"></div>

          <button
            onClick={() => setView(AppView.PREDICT)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              view === AppView.PREDICT ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles className={`w-6 h-6 ${view === AppView.PREDICT ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Predict</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;