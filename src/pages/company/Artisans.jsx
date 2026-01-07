import React from 'react';
import { motion } from 'framer-motion';
import { Users, Award, Heart, MapPin } from 'lucide-react';
import { KCCard } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const Artisans = () => {
  const artisanStories = [
    {
      name: 'Rajesh Kumar',
      craft: 'Hand Block Printing',
      location: 'Jaipur, Rajasthan',
      experience: '25 years',
      story: 'Rajesh comes from a family of block printers spanning four generations. His intricate designs have been featured in our Heritage Collection.',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=400&fit=crop',
    },
    {
      name: 'Priya Sharma',
      craft: 'Embroidery',
      location: 'Lucknow, Uttar Pradesh',
      experience: '18 years',
      story: 'Priya specializes in chikankari embroidery, a traditional technique passed down through her family. Her work adorns many of our premium pieces.',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop',
    },
    {
      name: 'Mohammed Ali',
      craft: 'Weaving',
      location: 'Varanasi, Uttar Pradesh',
      experience: '30 years',
      story: 'A master weaver of Banarasi silk, Mohammed creates luxurious fabrics that form the foundation of our premium collections.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    },
  ];

  const impact = [
    {
      icon: Users,
      number: '150+',
      label: 'Artisan Partners',
    },
    {
      icon: Award,
      number: '12',
      label: 'Traditional Crafts Preserved',
    },
    {
      icon: Heart,
      number: '100%',
      label: 'Fair Trade Certified',
    },
    {
      icon: MapPin,
      number: '8',
      label: 'States Represented',
    },
  ];

  return (
    <div className="kc-container py-16 md:py-24">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mb-12 text-center"
      >
        <div className="mb-4 flex justify-center">
          <Users className="text-[var(--kc-gold-1)]" size={48} />
        </div>
        <h1 className="mb-4 text-4xl font-serif text-[var(--kc-ink)] md:text-5xl">Our Artisans</h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--kc-ink-2)]">
          Meet the skilled craftspeople who bring our designs to life, preserving traditional techniques for future generations.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-16"
      >
        <KCCard className="p-8 md:p-12 bg-[var(--kc-gold-1)]/5 border-[var(--kc-gold-1)]/20">
          <h2 className="mb-6 text-3xl font-serif text-[var(--kc-ink)]">Preserving Heritage Through Partnership</h2>
          <p className="mb-4 leading-relaxed text-[var(--kc-ink-2)]">
            At The Kapda Co., we work directly with master artisans across India, ensuring fair compensation and supporting the preservation of traditional crafts. Each piece in our collection tells a story of skill, dedication, and cultural heritage.
          </p>
          <p className="leading-relaxed text-[var(--kc-ink-2)]">
            Our partnerships go beyond transactions—we invest in artisan communities, provide training opportunities, and help sustain crafts that have been passed down through generations. When you purchase from The Kapda Co., you're supporting these artisans and helping preserve India's rich textile heritage.
          </p>
        </KCCard>
      </motion.div>

      <div className="mb-16 grid gap-4 md:grid-cols-4">
        {impact.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={index * 0.1}
            >
              <KCCard className="p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] bg-[var(--kc-gold-1)]/10 text-[var(--kc-gold-1)]">
                    <Icon size={24} />
                  </div>
                </div>
                <p className="mb-1 text-3xl font-bold text-[var(--kc-ink)]">{item.number}</p>
                <p className="text-sm text-[var(--kc-ink-2)]">{item.label}</p>
              </KCCard>
            </motion.div>
          );
        })}
      </div>

      <div className="mb-12">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8 text-center text-3xl font-serif text-[var(--kc-ink)]"
        >
          Artisan Stories
        </motion.h2>
        <div className="grid gap-8 md:grid-cols-3">
          {artisanStories.map((artisan, index) => (
            <motion.div
              key={artisan.name}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={index * 0.1}
            >
              <KCCard className="overflow-hidden p-0">
                <div className="h-64 w-full overflow-hidden">
                  <img
                    src={artisan.image}
                    alt={artisan.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-[var(--kc-ink)]">{artisan.name}</h3>
                  </div>
                  <p className="mb-2 text-sm font-medium text-[var(--kc-gold-1)]">{artisan.craft}</p>
                  <div className="mb-3 flex items-center gap-4 text-xs text-[var(--kc-ink-2)]">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{artisan.location}</span>
                    </div>
                    <span>{artisan.experience}</span>
                  </div>
                  <p className="text-sm text-[var(--kc-ink-2)]">{artisan.story}</p>
                </div>
              </KCCard>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <KCCard className="p-8 bg-[var(--kc-gold-1)]/5 border-[var(--kc-gold-1)]/20 text-center">
          <h3 className="mb-4 text-2xl font-serif text-[var(--kc-ink)]">Become an Artisan Partner</h3>
          <p className="mb-6 text-[var(--kc-ink-2)]">
            Are you a skilled artisan interested in partnering with us? We'd love to hear from you.
          </p>
          <a href="/contact" className="kc-button kc-button-gold inline-flex">
            Get in Touch
          </a>
        </KCCard>
      </motion.div>
    </div>
  );
};

export default Artisans;

