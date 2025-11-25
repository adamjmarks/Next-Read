import React, { useState } from 'react';
import { Book, ImportResult } from '../types';
import { importBooksFromGoodreads } from '../services/geminiService';
import { ChevronLeft, Download, Globe, FileText, Check, AlertCircle, Loader2, ArrowRight, Upload } from 'lucide-react';
import { StarRating } from './StarRating';

interface ImportViewProps {
  onImportComplete: (books: Book[]) => void;
  onCancel: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({ onImportComplete, onCancel }) => {
  const [mode, setMode] = useState<'url' | 'text' | 'csv'>('csv');
  const [url, setUrl] = useState('https://www.goodreads.com/review/list/190648789-sarah-marks?ref=nav_mybooks');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleScan = async () => {
    const input = mode === 'url' ? url : text;
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await importBooksFromGoodreads(input, mode === 'url');
      if (data.books.length === 0) {
        if (mode === 'url') {
            setError("Google Search couldn't access this list directly (it might be private or not indexed).");
        } else {
            setError("I couldn't identify any books in that text. Please ensure you copied the full page content.");
        }
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Failed to import. Please try uploading the CSV export instead.");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setLoading(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const csvText = event.target?.result as string;
            const books = parseGoodreadsCSV(csvText);
            
            if (books.length === 0) {
                setError("No valid books found in this CSV. Please check the format.");
            } else {
                setResult({ books });
            }
        } catch (err) {
            console.error(err);
            setError("Failed to parse CSV file. Ensure it is a standard Goodreads export.");
        } finally {
            setLoading(false);
        }
    };
    reader.readAsText(file);
  };

  // Helper to parse CSV line respecting quotes
  const parseGoodreadsCSV = (csvText: string): Book[] => {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Simple header normalization
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    
    // Find needed columns
    const idIndex = headers.indexOf('book id');
    const titleIndex = headers.indexOf('title');
    const authorIndex = headers.indexOf('author');
    const ratingIndex = headers.indexOf('my rating');
    const dateAddedIndex = headers.indexOf('date added');

    if (idIndex === -1 || titleIndex === -1 || authorIndex === -1) {
      throw new Error("Invalid Goodreads CSV format. Missing required columns (Book Id, Title, Author).");
    }

    const books: Book[] = [];

    // Robust CSV line parser
    const parseLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for(let i=0; i<line.length; i++) {
            const char = line[i];
            if(char === '"') {
                if(i+1 < line.length && line[i+1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if(char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = parseLine(line);
      if (cols.length < headers.length) continue;

      // Helper to clean quotes
      const clean = (s: string) => s ? s.replace(/^"|"$/g, '').trim() : '';

      const title = clean(cols[titleIndex]);
      const author = clean(cols[authorIndex]);
      const id = clean(cols[idIndex]);
      const ratingStr = clean(cols[ratingIndex]);
      const dateStr = dateAddedIndex > -1 ? clean(cols[dateAddedIndex]) : '';

      if (title && id) {
        books.push({
            id: id, // Use Goodreads ID
            title: title,
            author: author,
            rating: parseInt(ratingStr || '0', 10),
            dateAdded: dateStr ? new Date(dateStr).getTime() : Date.now()
        });
      }
    }
    return books;
  };

  const handleConfirm = () => {
    if (result && result.books.length > 0) {
      onImportComplete(result.books);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <button 
        onClick={onCancel}
        className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back to Library
      </button>

      <div className="bg-white rounded-2xl shadow-xl shadow-brand-100/20 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-brand-100 p-3 rounded-full">
              <Download className="w-6 h-6 text-brand-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">Import Books</h2>
          </div>
          <p className="text-slate-500 text-sm">
            Import your Goodreads library to generate personalized predictions.
          </p>
        </div>

        {!result ? (
          <div className="p-8">
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                onClick={() => { setMode('csv'); setError(null); }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  mode === 'csv' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload CSV
              </button>
              <button
                onClick={() => { setMode('url'); setError(null); }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  mode === 'url' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Globe className="w-4 h-4" />
                Scan URL
              </button>
              <button
                onClick={() => { setMode('text'); setError(null); }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  mode === 'text' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Paste Text
              </button>
            </div>

            {mode === 'csv' && (
                <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-brand-300 transition-colors bg-slate-50">
                        <Upload className="w-8 h-8 text-brand-400 mb-3" />
                        <h3 className="text-slate-800 font-medium mb-1">Upload Goodreads Export</h3>
                        <p className="text-sm text-slate-500 mb-4 max-w-xs">
                            Export your library from Goodreads (My Books &gt; Import/Export) and drop the CSV file here.
                        </p>
                        <label className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-brand-600 px-6 py-2.5 rounded-full text-sm font-medium cursor-pointer shadow-sm transition-all">
                            Choose File
                            <input 
                                type="file" 
                                accept=".csv" 
                                onChange={handleCsvUpload} 
                                className="hidden" 
                            />
                        </label>
                    </div>
                </div>
            )}

            {mode === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Goodreads Profile URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none text-slate-600"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Tip: Search is limited by privacy settings. Uploading a CSV is 100% accurate.
                  </p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={loading || !url}
                    className="mt-6 w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-medium py-3.5 rounded-xl shadow-lg shadow-brand-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                    Scan URL
                </button>
              </div>
            )}

            {mode === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Paste Page Content</label>
                  <p className="text-xs text-slate-500 mb-2">
                    Open your "Read" shelf, press <kbd className="bg-slate-100 px-1 rounded border border-slate-300">Ctrl+A</kbd>, then Copy & Paste.
                  </p>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste text here..."
                    className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono text-slate-600"
                  />
                </div>
                <button
                    onClick={handleScan}
                    disabled={loading || !text}
                    className="mt-6 w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white font-medium py-3.5 rounded-xl shadow-lg shadow-brand-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                    Extract Books
                </button>
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-xl flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium">
                     <AlertCircle className="w-5 h-5 shrink-0" />
                     <p>Import Failed</p>
                </div>
                <p className="ml-7 text-red-500">{error}</p>
                {mode !== 'csv' && (
                    <button 
                        onClick={() => { setMode('csv'); setError(null); }}
                        className="ml-7 mt-1 text-red-700 font-bold hover:underline flex items-center gap-1 w-fit"
                    >
                        Use CSV Upload instead <ArrowRight className="w-3 h-3" />
                    </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Found {result.books.length} Books</h3>
                <button onClick={() => setResult(null)} className="text-sm text-brand-600 font-medium hover:underline">
                    Cancel
                </button>
             </div>

             <div className="bg-slate-50 rounded-xl p-4 max-h-[400px] overflow-y-auto mb-6 space-y-3 border border-slate-200">
                {result.books.slice(0, 100).map((book, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center shadow-sm">
                        <div className="flex-1 min-w-0 pr-2">
                            <p className="font-medium text-slate-800 text-sm line-clamp-1">{book.title}</p>
                            <p className="text-xs text-slate-500 truncate">{book.author}</p>
                        </div>
                        <div className="shrink-0">
                             <StarRating rating={book.rating} readonly size="sm" />
                        </div>
                    </div>
                ))}
                {result.books.length > 100 && (
                    <p className="text-center text-xs text-slate-400 py-2">...and {result.books.length - 100} more</p>
                )}
             </div>

             <button
              onClick={handleConfirm}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3.5 rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Check className="w-5 h-5" />
              Import {result.books.length} Books
            </button>
          </div>
        )}
      </div>
    </div>
  );
};