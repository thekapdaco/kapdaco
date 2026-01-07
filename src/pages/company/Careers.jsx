import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, ArrowRight } from 'lucide-react';
import { KCCard, KCButton } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const Careers = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'Design', 'Operations', 'Marketing', 'Technology'];

  const positions = [
    {
      title: 'Senior Fashion Designer',
      category: 'Design',
      location: 'Mumbai, India',
      type: 'Full-time',
      description: 'Lead design initiatives for our seasonal collections and custom atelier pieces.',
    },
    {
      title: 'Product Manager',
      category: 'Operations',
      location: 'Remote',
      type: 'Full-time',
      description: 'Oversee product development lifecycle and coordinate with artisans and designers.',
    },
    {
      title: 'Digital Marketing Specialist',
      category: 'Marketing',
      location: 'Mumbai, India',
      type: 'Full-time',
      description: 'Drive brand awareness and engagement across digital channels.',
    },
    {
      title: 'Frontend Developer',
      category: 'Technology',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build beautiful, responsive interfaces for our e-commerce platform.',
    },
    {
      title: 'Textile Designer',
      category: 'Design',
      location: 'Delhi, India',
      type: 'Full-time',
      description: 'Create original textile patterns and collaborate with production teams.',
    },
    {
      title: 'Customer Experience Manager',
      category: 'Operations',
      location: 'Mumbai, India',
      type: 'Full-time',
      description: 'Ensure exceptional customer service and manage support operations.',
    },
  ];

  const filteredPositions = selectedCategory === 'all'
    ? positions
    : positions.filter(pos => pos.category === selectedCategory);

  return (
    <div className="kc-container py-16 md:py-24">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mb-12 text-center"
      >
        <div className="mb-4 flex justify-center">
          <Briefcase className="text-[var(--kc-gold-1)]" size={48} />
        </div>
        <h1 className="mb-4 text-4xl font-serif text-[var(--kc-ink)] md:text-5xl">Careers at The Kapda Co.</h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--kc-ink-2)]">
          Join a team passionate about craftsmanship, innovation, and creating exceptional experiences.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-8 flex flex-wrap justify-center gap-3"
      >
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-[var(--kc-gold-1)] text-[var(--kc-ink)]'
                : 'bg-white/50 text-[var(--kc-ink-2)] hover:bg-white/70'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </motion.div>

      <div className="space-y-4">
        {filteredPositions.length > 0 ? (
          filteredPositions.map((position, index) => (
            <motion.div
              key={position.title}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={index * 0.05}
            >
              <KCCard className="p-6 transition-all hover:shadow-lg">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-[var(--kc-ink)]">{position.title}</h3>
                      <span className="rounded-full bg-[var(--kc-gold-1)]/10 px-3 py-1 text-xs font-medium text-[var(--kc-gold-1)]">
                        {position.category}
                      </span>
                    </div>
                    <p className="mb-3 text-[var(--kc-ink-2)]">{position.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--kc-ink-2)]">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{position.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{position.type}</span>
                      </div>
                    </div>
                  </div>
                  <KCButton className="md:ml-4">
                    Apply Now
                    <ArrowRight size={18} className="ml-2" />
                  </KCButton>
                </div>
              </KCCard>
            </motion.div>
          ))
        ) : (
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <KCCard className="p-8 text-center">
              <p className="text-[var(--kc-ink-2)]">No positions available in this category at the moment.</p>
            </KCCard>
          </motion.div>
        )}
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mt-12"
      >
        <KCCard className="p-8 bg-[var(--kc-gold-1)]/5 border-[var(--kc-gold-1)]/20 text-center">
          <h3 className="mb-4 text-2xl font-serif text-[var(--kc-ink)]">Don't see a role that fits?</h3>
          <p className="mb-6 text-[var(--kc-ink-2)]">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <a href="/contact" className="kc-button kc-button-gold inline-flex">
            Send Your Resume
          </a>
        </KCCard>
      </motion.div>
    </div>
  );
};

export default Careers;

