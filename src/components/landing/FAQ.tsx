"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Why is this free?",
    answer:
      "We're building something. Free audits help us validate the tool and connect with website owners who might need help down the road. No strings attached.",
  },
  {
    question: "How long does it take?",
    answer:
      "Usually under 5 minutes. Complex sites might take a bit longer.",
  },
  {
    question: "What do I get?",
    answer:
      "A detailed PDF report with category scores, critical issues flagged, and specific recommendations for each problem.",
  },
  {
    question: "Is my data safe?",
    answer:
      "We analyze publicly available information on your website. We don't store your site content - just enough to generate your report.",
  },
  {
    question: "Will you try to sell me something?",
    answer:
      "Not in the report. If you want help implementing recommendations, we're happy to chat. But the audit stands on its own.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-5xl px-6 scroll-mt-20 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/40 to-white pointer-events-none" />

      <div className="relative z-10 max-w-[680px] mx-auto">
        {/* Section Tag */}
        <div className="flex justify-center mb-4">
          <span className="inline-block px-4 py-1.5 text-sm font-semibold tracking-wide uppercase text-wc-blue bg-wc-blue/10 rounded-full border border-wc-blue/20">
            FAQ
          </span>
        </div>
        {/* Section Title */}
        <h2 className="text-section font-semibold text-gray-900 text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-body-lg text-gray-500 text-center mb-12">
          Everything you need to know about our audit process
        </p>

        {/* Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl px-6 shadow-sm data-[state=open]:shadow-lg data-[state=open]:border-wc-cyan/30 data-[state=open]:bg-white transition-all duration-300"
            >
              <AccordionTrigger className="text-left text-gray-900 hover:no-underline hover:text-wc-blue py-5 text-base font-medium transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 text-body pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
