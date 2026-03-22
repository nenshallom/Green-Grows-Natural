'use client';
import { useState } from 'react';

// The FAQ Data
const faqs = [
  {
    question: "How does 'Group Buying' work?",
    answer: "Group buying allows multiple people to chip in and buy a bulk product together to share the wholesale discount. Once the target number of buyers is reached, the order is confirmed and processed. If the goal isn't met by the deadline, your slot is fully refunded."
  },
  {
    question: "Are your products organically sourced?",
    answer: "Yes! We partner directly with local, verified farmers who use sustainable and organic farming practices. This ensures that every item you receive is 100% fresh, healthy, and chemical-free."
  },
  {
    question: "What is the minimum order for 'Bulk Purchase'?",
    answer: "Every bulk product has its own minimum threshold, typically indicated by the 🔥 badge on the product card (e.g., Min 5kg). Buying above this threshold automatically applies the discounted wholesale price to your cart."
  },
  {
    question: "How fast is delivery?",
    answer: "Standard and Bulk orders placed before 12 PM are typically delivered the next day to ensure maximum freshness. Group Buy orders are dispatched within 24 hours of the campaign successfully reaching its target."
  },
  {
    question: "What happens if I receive a damaged product?",
    answer: "We have a 100% Freshness Guarantee. If any item arrives damaged or below standard, simply contact our support team within 24 hours of delivery with a photo, and we will issue a replacement or refund immediately."
  }
];

export default function FAQ() {
  // State to track which question is currently open
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Default to the first one open

  const toggleFAQ = (index: number) => {
    // If clicking the already open one, close it. Otherwise, open the new one.
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full mt-24 mb-16 max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-[#1A4331] tracking-tight mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-500 font-medium text-sm md:text-base">
          Everything you need to know about our products, delivery, and deals.
        </p>
      </div>

      {/* ACCORDION CONTAINER */}
      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <div 
              key={index} 
              className={`border rounded-2xl transition-colors duration-300 overflow-hidden ${
                isOpen ? 'border-[#1A4331] bg-[#1A4331]/5' : 'border-gray-200 bg-white hover:border-[#1A4331]/30'
              }`}
            >
              {/* QUESTION BUTTON */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center p-5 md:p-6 text-left focus:outline-none"
              >
                <span className={`font-bold text-base md:text-lg transition-colors ${isOpen ? 'text-[#1A4331]' : 'text-gray-800'}`}>
                  {faq.question}
                </span>
                
                {/* THE PLUS/MINUS ICON */}
                <div className={`flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-[#1A4331] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <svg 
                    className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    {isOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /> // Minus
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /> // Plus
                    )}
                  </svg>
                </div>
              </button>

              {/* ANSWER PANEL (Smooth CSS Grid Animation) */}
              <div 
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="p-5 md:p-6 pt-0 text-gray-600 text-sm md:text-base leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}