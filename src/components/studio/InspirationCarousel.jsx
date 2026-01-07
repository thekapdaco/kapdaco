import React from 'react';
import { motion } from 'framer-motion';

const InspirationCarousel = ({ items }) => (
  <section className="kc-container space-y-4 py-12 text-white">
    <header className="flex items-center justify-between">
      <div>
        <p className="kc-pill bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-2)]">Inspiration from Designers</p>
        <h2 className="mt-2 text-2xl font-semibold">Curated looks from the Kapda Co. collective</h2>
      </div>
    </header>

    <div className="overflow-x-auto overflow-y-hidden pb-4 kc-scroll-hide">
      <div className="flex gap-4 px-2 sm:px-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            className="w-64 flex-shrink-0 space-y-3 rounded-[var(--kc-radius-lg)] border border-white/10 bg-white/5 p-4 shadow-[var(--kc-shadow-sm)]"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative overflow-hidden rounded-[var(--kc-radius)] border border-white/10">
              <img src={item.image} alt={item.title} className="h-40 w-full object-cover" loading="lazy" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-xs uppercase tracking-[0.32em] text-white/60">{item.category}</p>
              <h3 className="text-white">{item.title}</h3>
              <p className="text-white/60">{item.designer}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default InspirationCarousel;
