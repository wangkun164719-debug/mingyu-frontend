import { useState } from "react";
import { ChevronIcon } from "./Icons";

export default function FAQAccordion({ items, initialOpen = 0, onExpand }) {
  const [openIndex, setOpenIndex] = useState(initialOpen);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <article
            key={item.question}
            className="panel overflow-hidden transition duration-300 hover:border-gold-400/30"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
              onClick={() => {
                const nextIndex = isOpen ? -1 : index;
                setOpenIndex(nextIndex);

                if (nextIndex !== -1) {
                  onExpand?.(item, index);
                }
              }}
            >
              <span className="text-base font-semibold text-white sm:text-lg">{item.question}</span>
              <ChevronIcon
                className={`h-5 w-5 shrink-0 text-gold-300 transition duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-60"}`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-gold-500/10 px-5 py-5 text-sm leading-7 text-mist-300 sm:px-6">
                  {item.answer}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
