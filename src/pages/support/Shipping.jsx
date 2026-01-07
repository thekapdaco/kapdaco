import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, Globe, Clock, Shield, MapPin } from 'lucide-react';
import { KCCard, KCButton } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const Shipping = () => {
  const shippingOptions = [
    {
      icon: Package,
      title: 'Standard Shipping',
      duration: '5-7 business days',
      price: 'Free on orders over ₹2,000',
      description: 'Reliable delivery to most locations. Orders are processed within 1-2 business days.',
    },
    {
      icon: Clock,
      title: 'Express Shipping',
      duration: '2-3 business days',
      price: '₹299',
      description: 'Priority processing and faster delivery. Perfect for last-minute needs.',
    },
    {
      icon: Globe,
      title: 'International Shipping',
      duration: '10-15 business days',
      price: 'Varies by location',
      description: 'We ship to over 50 countries. Customs duties may apply and are the customer\'s responsibility.',
    },
  ];

  const shippingInfo = [
    {
      icon: Truck,
      title: 'Order Processing',
      content: [
        'Standard items: Processed within 1-2 business days',
        'Custom items: Processed after design approval (6-8 business days production)',
        'You\'ll receive an email confirmation once your order ships',
        'All orders include tracking information',
      ],
    },
    {
      icon: MapPin,
      title: 'Delivery Locations',
      content: [
        'Domestic: All major cities and towns across India',
        'International: Over 50 countries worldwide',
        'Remote areas may have extended delivery times',
        'PO Boxes and APO/FPO addresses are supported',
      ],
    },
    {
      icon: Shield,
      title: 'Shipping Protection',
      content: [
        'All shipments are fully insured',
        'Secure packaging to protect your items',
        'Signature required for high-value orders',
        'Free replacement if items arrive damaged',
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
              <Truck size={32} />
            </span>
          </div>
          <h1 className="text-[clamp(2.8rem,4vw,4.6rem)] leading-tight">
            Elevated Shipping, <span className="kc-text-brand">Worldwide</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-white/75">
            Insured logistics, concierge tracking, and white-glove delivery across 50+ countries.
          </p>
        </motion.div>
      </section>

      <section className="kc-container mb-8 grid gap-6 md:grid-cols-3">
        {shippingOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.div
              key={option.title}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={index * 0.1}
            >
              <KCCard className="h-full border-white/15 bg-white/10 p-6 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] border border-white/25 bg-white/10 text-[var(--kc-beige)]">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold">{option.title}</h3>
                </div>
                <p className="mb-2 text-sm font-semibold text-[var(--kc-beige)] uppercase tracking-[0.35em]">{option.duration}</p>
                <p className="mb-3 text-sm font-medium text-white/85">{option.price}</p>
                <p className="text-sm text-white/70">{option.description}</p>
              </KCCard>
            </motion.div>
          );
        })}
      </section>

      <section className="kc-container space-y-6">
        {shippingInfo.map((info, index) => {
          const Icon = info.icon;
          return (
            <motion.div
              key={info.title}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={(shippingOptions.length + index) * 0.1}
            >
              <KCCard className="border-white/15 bg-white/10 p-6 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] border border-white/25 bg-white/10 text-[var(--kc-beige)]">
                    <Icon size={22} />
                  </div>
                  <h2 className="text-2xl font-serif">{info.title}</h2>
                </div>
                <ul className="space-y-3">
                  {info.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3 text-white/75">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--kc-beige)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </KCCard>
            </motion.div>
          );
        })}
      </section>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="kc-container text-center"
      >
        <KCCard className="border-white/15 bg-white/10 p-8 text-white shadow-[var(--kc-shadow-md)] backdrop-blur-2xl">
          <h3 className="mb-3 text-xl font-semibold">Need help with shipping?</h3>
          <p className="mb-6 text-white/75">Track your order or speak with our concierge for bespoke delivery requests.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <KCButton as="a" href="/track-order">
              Track Order
            </KCButton>
            <KCButton as="a" href="/contact" variant="secondary">
              Contact Us
            </KCButton>
          </div>
        </KCCard>
      </motion.div>
    </main>
  );
};

export default Shipping;

