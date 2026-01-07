import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, HelpCircle, ShoppingBag, Truck, RotateCcw, Package } from 'lucide-react';
import { KCCard, KCButton } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqCategories = [
    {
      icon: ShoppingBag,
      title: 'Orders & Products',
      questions: [
        {
          q: 'How do I place an order?',
          a: 'Browse our collection, select your desired items, choose size and color, then proceed to checkout. For custom items, use our Custom Atelier to design your piece.',
        },
        {
          q: 'Can I modify or cancel my order?',
          a: 'Orders can be modified or cancelled within 2 hours of placement. After that, items enter production. Contact us immediately at hello@thekapdaco.com for assistance.',
        },
        {
          q: 'How long does custom production take?',
          a: 'Custom items typically take 6-8 business days for production, plus shipping time. You\'ll receive updates at each stage of the process.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept Visa, Mastercard, American Express, PayPal, and UPI. All payments are processed securely through encrypted channels.',
        },
      ],
    },
    {
      icon: Truck,
      title: 'Shipping & Delivery',
      questions: [
        {
          q: 'What are your shipping options?',
          a: 'We offer standard shipping (5-7 business days), express shipping (2-3 business days), and international shipping. Rates vary by location and order size.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Yes, we ship to over 50 countries. International orders typically take 10-15 business days. Customs duties may apply and are the customer\'s responsibility.',
        },
        {
          q: 'How can I track my order?',
          a: 'Once your order ships, you\'ll receive a tracking number via email. Use our Track Order page or the carrier\'s website to monitor your package.',
        },
        {
          q: 'What if my package is damaged or lost?',
          a: 'Contact us immediately with photos and order details. We\'ll arrange a replacement or full refund. All shipments are insured for their full value.',
        },
      ],
    },
    {
      icon: RotateCcw,
      title: 'Returns & Exchanges',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'Standard items can be returned within 14 days of delivery in original condition with tags. Custom items are final sale unless there\'s a manufacturing defect.',
        },
        {
          q: 'How do I initiate a return?',
          a: 'Log into your account, go to Order History, select the order, and click "Return Item". Follow the instructions and print the prepaid return label.',
        },
        {
          q: 'Are exchanges available?',
          a: 'Yes, you can exchange for a different size or color within 14 days. Exchanges are subject to availability. We\'ll cover return shipping for size exchanges.',
        },
        {
          q: 'When will I receive my refund?',
          a: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will appear in your original payment method.',
        },
      ],
    },
    {
      icon: Package,
      title: 'Sizing & Fit',
      questions: [
        {
          q: 'How do I find my size?',
          a: 'Visit our Size Guide page for detailed measurements and fit information. Each product page includes size charts and model measurements.',
        },
        {
          q: 'What if the size doesn\'t fit?',
          a: 'We offer free size exchanges within 14 days. Simply initiate a return and select "Exchange" when placing your new order.',
        },
        {
          q: 'Do you offer alterations?',
          a: 'Yes, we offer professional alterations through our Atelier Services. Contact us for pricing and availability based on the garment type.',
        },
      ],
    },
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

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
              <HelpCircle size={36} />
            </span>
          </div>
          <h1 className="text-[clamp(2.8rem,4vw,4.6rem)] leading-tight">
            Frequently Asked <span className="kc-text-brand">Questions</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-white/75">
            Everything you need to know about orders, atelier production, shipping, and bespoke services.
          </p>
        </motion.div>
      </section>

      <div className="kc-container space-y-8">
        {faqCategories.map((category, categoryIndex) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.title}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={categoryIndex * 0.1}
            >
              <KCCard className="border-white/15 bg-white/8 p-6 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl md:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] border border-white/20 bg-white/10 text-[var(--kc-beige)]">
                    <Icon size={20} />
                  </div>
                  <h2 className="text-2xl font-serif">{category.title}</h2>
                </div>
                <div className="space-y-4">
                  {category.questions.map((item, questionIndex) => {
                    const key = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openIndex === key;
                    return (
                      <div
                        key={questionIndex}
                        className="rounded-[var(--kc-radius)] border border-white/12 bg-white/8 text-white"
                      >
                        <button
                          type="button"
                          onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                          className="flex w-full items-center justify-between p-4 text-left text-white transition-colors hover:bg-white/12"
                        >
                          <span className="font-semibold">{item.q}</span>
                          <ChevronDown
                            className={`text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            size={20}
                          />
                        </button>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-white/15 p-4 text-sm text-white/75">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </KCCard>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="kc-container text-center"
      >
        <KCCard className="border-white/15 bg-white/10 p-8 text-white shadow-[var(--kc-shadow-md)] backdrop-blur-2xl">
          <h3 className="mb-3 text-xl font-semibold">Need a bespoke answer?</h3>
          <p className="mb-6 text-white/75">Our concierge team is on standby. Reach out via our Contact page.</p>
          <KCButton href="/contact" as="a">
            Contact Us
          </KCButton>
        </KCCard>
      </motion.div>
    </main>
  );
};

export default FAQ;

