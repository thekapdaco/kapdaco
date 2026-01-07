import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { KCCard, KCButton } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const ReturnRefundPolicy = () => {
  const returnEligibility = [
    {
      icon: CheckCircle,
      title: 'Eligible for Return',
      items: [
        'Items must be unworn, unwashed, and in original condition with tags attached.',
        'Returns must be initiated within 14 days of delivery.',
        'Original packaging and accessories must be included.',
        'Items must not be damaged, altered, or personalized.',
        'Proof of purchase (order number or receipt) is required.',
      ],
    },
    {
      icon: XCircle,
      title: 'Not Eligible for Return',
      items: [
        'Custom-made or personalized items (unless defective).',
        'Items damaged due to misuse or normal wear.',
        'Items returned after the 14-day return window.',
        'Items without original tags or packaging.',
        'Final sale items (clearly marked at time of purchase).',
        'Intimate apparel, swimwear, or items that cannot be resold for hygiene reasons.',
      ],
    },
  ];

  const returnProcess = [
    {
      step: 1,
      title: 'Initiate Return',
      description: 'Log into your account, go to "My Orders", and select the item you wish to return. Click "Return Item" and provide the reason for return.',
    },
    {
      step: 2,
      title: 'Get Authorization',
      description: 'We will review your request within 1-2 business days. Once approved, you will receive a Return Authorization (RA) number and return shipping label via email.',
    },
    {
      step: 3,
      title: 'Pack and Ship',
      description: 'Securely pack the item in its original packaging with all tags and accessories. Attach the provided return label and ship via the designated carrier.',
    },
    {
      step: 4,
      title: 'Receive Refund',
      description: 'Once we receive and inspect the returned item (typically 5-7 business days), we will process your refund to the original payment method within 3-5 business days.',
    },
  ];

  const refundTimeline = [
    { stage: 'Return Request Submitted', time: 'Immediate' },
    { stage: 'Return Authorization', time: '1-2 business days' },
    { stage: 'Item Received & Inspected', time: '5-7 business days after shipment' },
    { stage: 'Refund Processed', time: '3-5 business days after approval' },
    { stage: 'Refund Reflected in Account', time: '5-10 business days (varies by payment method)' },
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
              <RotateCcw size={32} />
            </span>
          </div>
          <h1 className="text-[clamp(2.8rem,4vw,4.6rem)] leading-tight">
            Return & Refund <span className="kc-text-brand">Policy</span>
          </h1>
          <p className="mt-3 text-white/70">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>
      </section>

      <section className="kc-container space-y-8 text-white">
        <KCCard className="border-white/15 bg-white/10 p-8 shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
          <p className="mb-4 text-lg leading-relaxed text-white/80">
            We want every atelier piece to feel perfect. If something isn’t right, our return path is clear and concierge-led.
          </p>
          <p className="text-sm leading-relaxed text-white/65">
            Review the eligibility and steps below before initiating a return.
          </p>
        </KCCard>

        {/* Return Eligibility */}
          <div className="mb-8 grid gap-6 md:grid-cols-2">
            {returnEligibility.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  transition={{ delay: index * 0.1 }}
                >
                  <KCCard className="h-full border-white/15 bg-white/10 p-6 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-[var(--kc-radius)] ${
                          section.icon === CheckCircle
                            ? 'border border-green-400/30 bg-green-400/15 text-green-200'
                            : 'border border-red-400/30 bg-red-400/15 text-red-200'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <h2 className="text-xl font-serif">{section.title}</h2>
                    </div>
                    <ul className="space-y-2 text-sm text-white/75">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex gap-2 leading-relaxed">
                          <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-white/50" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </KCCard>
                </motion.div>
              );
            })}
          </div>

          {/* Return Process */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <KCCard className="border-white/15 bg-white/10 p-8 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] border border-white/25 bg-white/10 text-[var(--kc-beige)]">
                  <Package size={22} />
                </div>
                <h2 className="text-2xl font-serif">Return Process</h2>
              </div>
              <div className="space-y-6">
                {returnProcess.map((step, index) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg font-serif text-[var(--kc-beige)]">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-medium">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-white/75">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </KCCard>
          </motion.div>

          {/* Refund Timeline */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <KCCard className="border-white/15 bg-white/10 p-8 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] border border-white/25 bg-white/10 text-[var(--kc-beige)]">
                  <Clock size={22} />
                </div>
                <h2 className="text-2xl font-serif">Refund Timeline</h2>
              </div>
              <div className="space-y-3">
                {refundTimeline.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-white/12 pb-3 text-sm last:border-0">
                    <span className="text-white/70">{item.stage}</span>
                    <span className="font-medium text-[var(--kc-beige)]">{item.time}</span>
                  </div>
                ))}
              </div>
            </KCCard>
          </motion.div>

          {/* Important Notes */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ delay: 0.6 }}
          >
            <KCCard className="border-white/15 bg-white/10 p-8 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
              <div className="mb-4 flex items-center gap-3">
                <AlertCircle size={22} className="text-[var(--kc-beige)]" />
                <h3 className="text-xl font-serif">Important Notes</h3>
              </div>
              <ul className="space-y-2 text-sm leading-relaxed text-white/75">
                <li>• Return shipping is customer-covered unless the item is defective or incorrect.</li>
                <li>• Refunds route to the original payment method.</li>
                <li>• For exchanges, return the original item and place a fresh order.</li>
                <li>• Damaged/incorrect goods are replaced or refunded with complimentary shipping.</li>
                <li>• Reach out immediately if an incorrect item arrives—we’ll fast-track the fix.</li>
              </ul>
              <div className="mt-6 border-t border-white/12 pt-4">
                <p className="text-sm text-white/70">
                  Questions? Email{' '}
                  <a href="mailto:returns@thekapdaco.com" className="text-[var(--kc-beige)] hover:underline">
                    returns@thekapdaco.com
                  </a>{' '}
                  or call +91 98765 43210.
                </p>
              </div>
              <div className="mt-6 flex justify-center">
                <KCButton as="a" href="/contact" variant="secondary">
                  Contact Returns Concierge
                </KCButton>
              </div>
            </KCCard>
          </motion.div>
      </section>
    </main>
  );
};

export default ReturnRefundPolicy;

