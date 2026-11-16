'use client';

import React, { useState } from 'react';
import { FiX, FiStar } from 'react-icons/fi';
import { Order } from '@/types';
import { useToast } from '@/context/ToastContext';

interface ProduceReviewModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProduceReviewModal({
  order,
  isOpen,
  onClose,
}: ProduceReviewModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [freshnessRating, setFreshnessRating] = useState<'Crisp & Super Fresh' | 'Good' | 'Fair'>('Crisp & Super Fresh');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Thank you for rating your harvest! Your review has been submitted.');
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close review modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="mb-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            Produce Quality Review
          </span>
          <h2 className="text-xl font-black text-gray-900 mt-1">
            Rate Your Farm Harvest
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Order #{order.tracking_number}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STAR RATING */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Overall Experience
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star`}
                  className="text-2xl p-1 text-gray-300 hover:scale-110 transition-transform cursor-pointer"
                >
                  <FiStar
                    className={`w-7 h-7 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-gray-600 ml-2">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Average' : 'Needs Improvement'}
              </span>
            </div>
          </div>

          {/* FRESHNESS SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Produce Freshness
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Crisp & Super Fresh', 'Good', 'Fair'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFreshnessRating(level)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                    freshnessRating === level
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* COMMENTS */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Feedback & Comments
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us about the produce taste, packaging, and delivery experience..."
              className="w-full p-3 border border-[#E2E8F0] rounded-xl text-xs text-[#2D3748] focus:border-[#0F3024] focus:ring-1 focus:ring-[#0F3024] outline-none resize-none font-sans"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 font-sans">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0F3024] hover:bg-[#153426] text-white font-medium py-3 rounded-full transition-colors cursor-pointer text-sm shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Submitting Review...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
