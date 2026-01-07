import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Recycle, Heart, Users, Award } from 'lucide-react';
import { KCCard } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const Sustainability = () => {
  const commitments = [
    {
      icon: Leaf,
      title: 'Sustainable Materials',
      description: 'We prioritize organic cotton, recycled fibers, and eco-friendly dyes. Over 70% of our materials are sustainably sourced.',
    },
    {
      icon: Recycle,
      title: 'Circular Fashion',
      description: 'Our take-back program allows customers to return old garments for recycling, reducing textile waste.',
    },
    {
      icon: Heart,
      title: 'Fair Trade Practices',
      description: 'We ensure fair wages, safe working conditions, and support for artisan communities across India.',
    },
    {
      icon: Users,
      title: 'Local Production',
      description: 'By manufacturing locally, we reduce carbon footprint and support regional economies.',
    },
    {
      icon: Award,
      title: 'Quality Over Quantity',
      description: 'We create timeless pieces designed to last, reducing the need for frequent replacements.',
    },
  ];

  const initiatives = [
    {
      title: 'Carbon Neutral Shipping',
      content: 'All our shipping is carbon-neutral through partnerships with eco-friendly logistics providers and carbon offset programs.',
    },
    {
      title: 'Water Conservation',
      content: 'Our production processes use 40% less water than industry standards through innovative dyeing and finishing techniques.',
    },
    {
      title: 'Packaging Innovation',
      content: 'We use 100% recyclable and biodegradable packaging materials, eliminating single-use plastics.',
    },
    {
      title: 'Artisan Empowerment',
      content: 'Direct partnerships with artisans ensure fair compensation and help preserve traditional crafts for future generations.',
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
          <Leaf className="text-[var(--kc-gold-1)]" size={48} />
        </div>
        <h1 className="mb-4 text-4xl font-serif text-[var(--kc-ink)] md:text-5xl">Sustainability</h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--kc-ink-2)]">
          Our commitment to ethical practices, environmental responsibility, and social impact.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-16"
      >
        <KCCard className="p-8 md:p-12 bg-[var(--kc-gold-1)]/5 border-[var(--kc-gold-1)]/20">
          <h2 className="mb-6 text-3xl font-serif text-[var(--kc-ink)]">Our Mission</h2>
          <p className="leading-relaxed text-[var(--kc-ink-2)]">
            At The Kapda Co., we believe fashion should be beautiful, ethical, and sustainable. Our commitment extends beyond creating exceptional garments—we're dedicated to preserving traditional craftsmanship, supporting artisan communities, and minimizing our environmental impact. Every piece we create is a step toward a more sustainable future for fashion.
          </p>
        </KCCard>
      </motion.div>

      <div className="mb-16">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8 text-center text-3xl font-serif text-[var(--kc-ink)]"
        >
          Our Commitments
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {commitments.map((commitment, index) => {
            const Icon = commitment.icon;
            return (
              <motion.div
                key={commitment.title}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={index * 0.1}
              >
                <KCCard className="h-full p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] bg-[var(--kc-gold-1)]/10 text-[var(--kc-gold-1)]">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--kc-ink)]">{commitment.title}</h3>
                  </div>
                  <p className="text-sm text-[var(--kc-ink-2)]">{commitment.description}</p>
                </KCCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-center text-3xl font-serif text-[var(--kc-ink)]"
        >
          Key Initiatives
        </motion.h2>
        {initiatives.map((initiative, index) => (
          <motion.div
            key={initiative.title}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={(commitments.length + index) * 0.1}
          >
            <KCCard className="p-6 md:p-8">
              <h3 className="mb-3 text-xl font-semibold text-[var(--kc-ink)]">{initiative.title}</h3>
              <p className="text-[var(--kc-ink-2)]">{initiative.content}</p>
            </KCCard>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mt-12"
      >
        <KCCard className="p-8 bg-[var(--kc-gold-1)]/5 border-[var(--kc-gold-1)]/20 text-center">
          <h3 className="mb-4 text-2xl font-serif text-[var(--kc-ink)]">Join Us in Making a Difference</h3>
          <p className="mb-6 text-[var(--kc-ink-2)]">
            Every purchase supports sustainable practices and artisan communities. Together, we can create a more ethical fashion industry.
          </p>
          <a href="/shop" className="kc-button kc-button-gold inline-flex">
            Shop Sustainable
          </a>
        </KCCard>
      </motion.div>
    </div>
  );
};

export default Sustainability;

