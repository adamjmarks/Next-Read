import React, { useState } from 'react';
import { Book, PredictionResult } from '../types';
import { getBookPrediction } from '../services/geminiService';
import { Search, Sparkles, AlertCircle, Book as BookIcon, Share2, Check } from 'lucide-react';
import { StarRating } from './StarRating';

interface PredictViewProps {
  history: Book[];
}

export const PredictView: React.FC<PredictViewProps> = ({ history }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (history.length < 3) {
      setError("Please add at least 3 books to your library first so I can understand your taste!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const prediction = await getBookPrediction(history, query);
      setResult(prediction);
    } catch (err) {
      setError("Oops! I couldn't analyze that book right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    
    const shareText = `I got a ${result.matchPercentage}% match for "${query}" on NextRead! 📚✨\n\nPredicted Rating: ${result.likelyRating}/5\nReason: ${result.reasoning.substring(0, 100)}...`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NextRead Prediction',
          text: shareText,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy", err);
      }
    }
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-slate-800 mb-3">Will you like it?</h2>
        <p className="text-slate-500">
          Enter a book title below, and I'll predict if it's your cup of tea based on your {history.length} read books.
        </p>
      </div>

      <form onSubmit={handlePredict} className="relative mb-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Project Hail Mary"
          className="w-full pl-5 pr-14 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-lg transition-all"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-2 bottom-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-xl px-4 flex items-center justify-center transition-colors"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="animate-fade-in space-y-6">
          {/* Main Score Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-brand-100/50 border border-slate-100 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-300 via-purple-300 to-indigo-300"></div>
            
             <button 
                onClick={handleShare}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all"
                title="Share Result"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
              </button>

            <p className="text-slate-400 font-medium tracking-wide uppercase text-xs mb-2">Match Probability</p>
            <div className={`text-6xl font-serif font-bold mb-2 ${
               result.matchPercentage >= 70 ? 'text-brand-600' : 'text-slate-700'
            }`}>
              {result.matchPercentage}%
            </div>
            
            <div className="flex justify-center mb-6">
               <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                 <span className="text-slate-500 text-sm">Predicted Rating:</span>
                 <StarRating rating={result.likelyRating} readonly size="sm" />
               </div>
            </div>

            <div className="text-left bg-slate-50 rounded-xl p-5 mb-4 border border-slate-100">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    Why you might {result.matchPercentage > 50 ? 'like' : 'dislike'} it
                </h4>
                <p className="text-slate-600 leading-relaxed text-sm">
                    {result.reasoning}
                </p>
            </div>

            {result.similarBooksFromHistory.length > 0 && (
                <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Similar to your favorites</h4>
                    <div className="flex flex-wrap gap-2">
                        {result.similarBooksFromHistory.map((book, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-sm shadow-sm">
                                <BookIcon className="w-3 h-3 text-slate-400" />
                                {book}
                            </span>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};