import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, Award, Sparkles } from 'lucide-react';
import { KCCard } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const About = () => {
  const values = [
    {
      icon: Heart,
      title: 'Heritage Craftsmanship',
      description: 'We honor traditional techniques while embracing modern design, creating pieces that bridge generations.',
    },
    {
      icon: Users,
      title: 'Artisan Partnership',
      description: 'Every piece tells a story of collaboration with skilled artisans who bring decades of expertise.',
    },
    {
      icon: Award,
      title: 'Quality First',
      description: 'Premium materials and meticulous attention to detail ensure each garment exceeds expectations.',
    },
    {
      icon: Sparkles,
      title: 'Bespoke Expression',
      description: 'Your style, your story. Our Custom Atelier empowers you to create truly unique pieces.',
    },
  ];

  const story = {
    title: 'Our Story',
    content: [
      'The Kapda Co. was born from a vision to celebrate India\'s rich textile heritage while making it accessible to the modern world. Founded in 2020, we set out to bridge the gap between traditional craftsmanship and contemporary design.',
      'What started as a small atelier in Mumbai has grown into a global platform connecting artisans, designers, and style enthusiasts. We work directly with master craftspeople across India, ensuring fair trade practices and preserving age-old techniques.',
      'Today, The Kapda Co. offers everything from ready-to-wear collections to fully customized pieces through our Custom Atelier. Every garment carries the mark of quality, sustainability, and authentic craftsmanship.',
    ],
  };

  return (
    <div className="kc-container py-16 md:py-24">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mb-16 text-center"
      >
        <h1 className="mb-4 text-4xl font-serif text-[var(--kc-ink)] md:text-5xl">About The Kapda Co.</h1>
        <p className="mx-auto max-w-3xl text-lg text-[var(--kc-ink-2)]">
          Crafted Heritage. Modern Silhouettes. A designer-led marketplace celebrating couture craftsmanship and bespoke expressions.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-16"
      >
        <KCCard className="p-8 md:p-12">
          <h2 className="mb-6 text-3xl font-serif text-[var(--kc-ink)]">{story.title}</h2>
          <div className="space-y-4 text-[var(--kc-ink-2)]">
            {story.content.map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </KCCard>
      </motion.div>

      <div className="mb-16">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8 text-center text-3xl font-serif text-[var(--kc-ink)]"
        >
          Our Values
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={index * 0.1}
              >
                <KCCard className="h-full p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[var(--kc-radius)] bg-[var(--kc-gold-1)]/10 text-[var(--kc-gold-1)]">
                      <Icon size={32} />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-[var(--kc-ink)]">{value.title}</h3>
                  <p className="text-sm text-[var(--kc-ink-2)]">{value.description}</p>
                </KCCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <KCCard className="p-8 bg-[var(--kc-gold-1)]/5 border-[var(--kc-gold-1)]/20">
          <h3 className="mb-4 text-2xl font-serif text-[var(--kc-ink)]">Join Our Journey</h3>
          <p className="mb-6 text-[var(--kc-ink-2)]">
            Whether you're a designer, artisan, or style enthusiast, we'd love to connect.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/contact" className="kc-button kc-button-gold">
              Get in Touch
            </a>
            <a href="/careers" className="kc-button kc-button-ghost">
              View Careers
            </a>
          </div>
        </KCCard>
      </motion.div>
    </div>
  );
};

export default About;

