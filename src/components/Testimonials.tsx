'use client';
import React from 'react';

// Hardcoded reviews tailored to your specific business model
const reviews = [
  {
    name: "Sarah O.",
    role: "Home Chef",
    avatarBg: "bg-pink-100 text-pink-700",
    initials: "SO",
    rating: 5,
    text: "The freshness is absolutely unbelievable. I ordered a basket of tomatoes and peppers yesterday, and they arrived this morning looking like they were just plucked from the farm!"
  },
  {
    name: "Iya Basira",
    role: "Restaurant Owner",
    avatarBg: "bg-blue-100 text-blue-700",
    initials: "IB",
    rating: 5,
    text: "The bulk purchase option has saved my catering business so much money. The quality is incredibly consistent, and the wholesale prices are simply unbeatable."
  },
  {
    name: "Chuks E.",
    role: "Group Buyer",
    avatarBg: "bg-green-100 text-green-700",
    initials: "CE",
    rating: 5,
    text: "I joined a group deal for a 50kg bag of rice. It was so seamless! We hit the target in hours, and my share was delivered the exact same week. Highly recommend!"
  }
];

export default function Testimonials() {
  return (
    <section className="w-full mt-16 mb-20">
      
      {/* HEADER */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-[#1A4331] tracking-tight mb-3">
          Loved by Thousands
        </h2>
        <p className="text-gray-500 font-medium text-sm md:text-base max-w-2xl mx-auto">
          Don't just take our word for it. Here is what our community of food lovers, chefs, and smart shoppers have to say.
        </p>
      </div>

      {/* MOBILE SLIDER / DESKTOP GRID */}
      <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-4 md:gap-6 pb-6 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {reviews.map((review, index) => (
          <div 
            key={index} 
            className="flex-none w-[85%] md:w-auto snap-center bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow relative"
          >
            {/* LARGE DECORATIVE QUOTE MARK */}
            <div className="absolute top-6 right-6 text-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-12 h-12" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>

            {/* STAR RATING */}
            <div className="flex gap-1 mb-4">
              {[...Array(review.rating)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-400">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                </svg>
              ))}
            </div>

            {/* REVIEW TEXT */}
            <p className="text-gray-600 font-medium text-sm md:text-base leading-relaxed mb-8 relative z-10">
              "{review.text}"
            </p>

            {/* USER PROFILE */}
            <div className="flex items-center gap-3">
              {/* Dynamic Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${review.avatarBg}`}>
                {review.initials}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm leading-tight">{review.name}</h4>
                <p className="text-xs text-gray-500 font-medium">{review.role}</p>
              </div>
            </div>

          </div>
        ))}
        
      </div>
    </section>
  );
}