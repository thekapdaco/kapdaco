import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Mail, Download } from 'lucide-react';
import { KCCard, KCButton } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const Press = () => {
  const pressKit = [
    {
      title: 'Brand Assets',
      description: 'High-resolution logos, brand guidelines, and visual assets.',
      icon: Download,
    },
    {
      title: 'Press Releases',
      description: 'Latest news, announcements, and company updates.',
      icon: FileText,
    },
    {
      title: 'Media Contact',
      description: 'Get in touch with our press team for interviews and inquiries.',
      icon: Mail,
    },
  ];

  const recentNews = [
    {
      date: 'March 2024',
      title: 'The Kapda Co. Launches Sustainable Collection',
      excerpt: 'New line features 100% organic materials and carbon-neutral production.',
    },
    {
      date: 'February 2024',
      title: 'Partnership with Artisan Communities',
      excerpt: 'Expanding support for traditional craftspeople across India.',
    },
    {
      date: 'January 2024',
      title: 'Custom Atelier Platform Launch',
      excerpt: 'Revolutionary customization tool allows customers to design unique pieces.',
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
          <FileText className="text-[var(--kc-gold-1)]" size={48} />
        </div>
        <h1 className="mb-4 text-4xl font-serif text-[var(--kc-ink)] md:text-5xl">Press & Media</h1>
        <p className="mx-auto max-w-2xl text-lg text-[var(--kc-ink-2)]">
          Resources for journalists, bloggers, and media professionals covering The Kapda Co.
        </p>
      </motion.div>

      <div className="mb-12 grid gap-6 md:grid-cols-3">
        {pressKit.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={index * 0.1}
            >
              <KCCard className="h-full p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] bg-[var(--kc-gold-1)]/10 text-[var(--kc-gold-1)]">
                    <Icon size={24} />
                  </div>
                </div>
                <h3 className="mb-3 text-lg font-semibold text-[var(--kc-ink)]">{item.title}</h3>
                <p className="mb-4 text-sm text-[var(--kc-ink-2)]">{item.description}</p>
                <KCButton variant="ghost" className="w-full">
                  Download
                </KCButton>
              </KCCard>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-12"
      >
        <KCCard className="p-8">
          <h2 className="mb-6 text-2xl font-serif text-[var(--kc-ink)]">Recent News</h2>
          <div className="space-y-6">
            {recentNews.map((news, index) => (
              <div key={index} className="border-b border-[var(--kc-border)] pb-6 last:border-0 last:pb-0">
                <p className="mb-2 text-sm font-medium text-[var(--kc-gold-1)]">{news.date}</p>
                <h3 className="mb-2 text-xl font-semibold text-[var(--kc-ink)]">{news.title}</h3>
                <p className="text-[var(--kc-ink-2)]">{news.excerpt}</p>
              </div>
            ))}
          </div>
        </KCCard>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <KCCard className="p-8 bg-[var(--kc-gold-1)]/5 border-[var(--kc-gold-1)]/20">
          <h3 className="mb-4 text-2xl font-serif text-[var(--kc-ink)]">Media Inquiries</h3>
          <p className="mb-6 text-[var(--kc-ink-2)]">
            For press inquiries, interview requests, or media partnerships, please contact our press team.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:press@thekapdaco.com" className="kc-button kc-button-gold inline-flex">
              <Mail size={18} className="mr-2" />
              press@thekapdaco.com
            </a>
            <a href="/contact" className="kc-button kc-button-ghost inline-flex">
              Contact Form
            </a>
          </div>
        </KCCard>
      </motion.div>
    </div>
  );
};

export default Press;

