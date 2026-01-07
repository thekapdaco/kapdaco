import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Mail } from 'lucide-react';
import { KCCard, KCButton } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Shield,
      title: 'Information We Collect',
      content: [
        'Personal Information: Name, email address, phone number, shipping address, billing information, and payment details.',
        'Account Information: Username, password (encrypted), profile preferences, and order history.',
        'Usage Data: Browser type, device information, IP address, pages visited, time spent on site, and interaction patterns.',
        'Cookies: We use cookies and similar tracking technologies to enhance your experience, analyze site traffic, and personalize content.',
      ],
    },
    {
      icon: Lock,
      title: 'How We Use Your Information',
      content: [
        'To process and fulfill your orders, including payment processing and shipping.',
        'To communicate with you about your orders, account, and our services.',
        'To send you marketing communications (with your consent) about new products, promotions, and designer collections.',
        'To improve our website, services, and user experience through analytics and feedback.',
        'To detect and prevent fraud, security threats, and unauthorized access.',
        'To comply with legal obligations and enforce our terms of service.',
      ],
    },
    {
      icon: Eye,
      title: 'Data Sharing and Disclosure',
      content: [
        'Service Providers: We share data with trusted third-party service providers who assist in operations (payment processors, shipping companies, email services).',
        'Designers and Brands: When you purchase from a designer or brand, they receive necessary order information to fulfill your purchase.',
        'Legal Requirements: We may disclose information if required by law, court order, or government regulation.',
        'Business Transfers: In the event of a merger, acquisition, or sale, your data may be transferred to the new entity.',
        'We do not sell your personal information to third parties for marketing purposes.',
      ],
    },
    {
      icon: FileText,
      title: 'Your Rights and Choices',
      content: [
        'Access: You can request access to the personal information we hold about you.',
        'Correction: You can update or correct your account information at any time through your account settings.',
        'Deletion: You can request deletion of your account and associated data, subject to legal and contractual obligations.',
        'Opt-Out: You can unsubscribe from marketing emails at any time using the link in our emails or your account preferences.',
        'Cookies: You can manage cookie preferences through your browser settings.',
        'Data Portability: You can request a copy of your data in a portable format.',
      ],
    },
    {
      icon: Mail,
      title: 'Contact Us',
      content: [
        'If you have questions, concerns, or requests regarding your privacy, please contact us:',
        'Email: privacy@thekapdaco.com',
        'Address: The Kapda Co., Mumbai, India',
        'We will respond to your inquiry within 30 days.',
      ],
    },
  ];

  return (
    <main className="space-y-16 pb-24 pt-24">
      <section className="premium-noise">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="kc-container text-center text-white"
        >
          <div className="mb-6 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
              <Shield size={32} />
            </span>
          </div>
          <h1 className="text-[clamp(2.8rem,4vw,4.6rem)] leading-tight">
            Privacy Policy <span className="kc-text-brand">Archive</span>
          </h1>
          <p className="mt-3 text-white/70">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>
      </section>

      <section className="kc-container space-y-8 text-white">
        <KCCard className="border-white/15 bg-white/10 p-8 shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
          <p className="mb-4 text-lg leading-relaxed text-white/80">
            At The Kapda Co., we are committed to safeguarding your data across every atelier touchpoint. This policy outlines how we collect, use, and protect personal information throughout our platform.
          </p>
          <p className="text-sm leading-relaxed text-white/65">
            By using our services, you consent to the practices described below. We encourage you to review this document regularly to stay informed.
          </p>
        </KCCard>

        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ delay: index * 0.08 }}
              >
                <KCCard className="border-white/15 bg-white/10 p-8 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] border border-white/25 bg-white/10 text-[var(--kc-beige)]">
                      <Icon size={22} />
                    </div>
                    <h2 className="text-2xl font-serif">{section.title}</h2>
                  </div>
                  <ul className="space-y-3 text-white/75">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-3 leading-relaxed">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--kc-beige)]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </KCCard>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center"
        >
          <KCCard className="border-white/15 bg-white/10 p-8 text-white shadow-[var(--kc-shadow-md)] backdrop-blur-2xl">
            <p className="mb-4 text-sm leading-relaxed text-white/75">
              We may update this Privacy Policy periodically. When we do, we’ll adjust the “Last Updated” date and notify you where required.
            </p>
            <KCButton as="a" href="/contact" variant="secondary">
              Contact Our Privacy Team
            </KCButton>
          </KCCard>
        </motion.div>
      </section>
    </main>
  );
};

export default PrivacyPolicy;

