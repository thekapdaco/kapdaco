import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, ShoppingBag, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { KCCard, KCButton } from '../../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const TermsOfService = () => {
  const sections = [
    {
      icon: CheckCircle,
      title: 'Acceptance of Terms',
      content: [
        'By accessing and using The Kapda Co. website and services, you accept and agree to be bound by these Terms of Service.',
        'If you do not agree to these terms, please do not use our services.',
        'We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.',
        'You must be at least 18 years old to use our services or have parental consent if under 18.',
      ],
    },
    {
      icon: ShoppingBag,
      title: 'Products and Services',
      content: [
        'Product Descriptions: We strive for accuracy but do not warrant that product descriptions, images, or other content are error-free.',
        'Pricing: All prices are in INR (Indian Rupees) unless otherwise stated. Prices are subject to change without notice.',
        'Availability: Product availability is subject to change. We reserve the right to limit quantities and refuse orders.',
        'Customization: Custom products are made to order and may have longer processing times. Custom orders are non-refundable unless defective.',
        'Designer Products: Products from independent designers are subject to their own policies and availability.',
      ],
    },
    {
      icon: CreditCard,
      title: 'Orders and Payment',
      content: [
        'Order Acceptance: Your order is an offer to purchase. We reserve the right to accept or reject any order.',
        'Payment: Payment must be made at the time of order. We accept credit cards, debit cards, UPI, and other approved payment methods.',
        'Order Confirmation: You will receive an email confirmation once your order is placed. This does not guarantee acceptance.',
        'Cancellation: Orders can be cancelled within 24 hours of placement, subject to order status. Custom orders cannot be cancelled.',
        'Refunds: Refunds are processed according to our Return and Refund Policy.',
      ],
    },
    {
      icon: AlertCircle,
      title: 'User Accounts and Conduct',
      content: [
        'Account Responsibility: You are responsible for maintaining the confidentiality of your account credentials.',
        'Prohibited Activities: You agree not to use our services for any illegal purpose or to violate any laws.',
        'User Content: You retain ownership of content you submit but grant us a license to use it for service provision.',
        'Prohibited Content: You may not submit content that is illegal, harmful, threatening, abusive, or violates others\' rights.',
        'Account Termination: We reserve the right to suspend or terminate accounts that violate these terms.',
      ],
    },
    {
      icon: Scale,
      title: 'Intellectual Property',
      content: [
        'Ownership: All content on our website, including text, graphics, logos, images, and software, is the property of The Kapda Co. or its licensors.',
        'Designer Rights: Designers retain intellectual property rights to their designs. Purchasing a product does not grant design rights.',
        'Limited License: You may view and download content for personal, non-commercial use only.',
        'Prohibited Use: You may not reproduce, distribute, modify, or create derivative works without written permission.',
        'Trademarks: "The Kapda Co." and related marks are trademarks. Unauthorized use is prohibited.',
      ],
    },
    {
      icon: FileText,
      title: 'Limitation of Liability',
      content: [
        'Disclaimer: Our services are provided "as is" without warranties of any kind, express or implied.',
        'Limitation: To the maximum extent permitted by law, we shall not be liable for indirect, incidental, or consequential damages.',
        'Maximum Liability: Our total liability shall not exceed the amount you paid for the product or service in question.',
        'Force Majeure: We are not liable for delays or failures due to circumstances beyond our reasonable control.',
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
              <FileText size={32} />
            </span>
          </div>
          <h1 className="text-[clamp(2.8rem,4vw,4.6rem)] leading-tight">
            Terms of Service <span className="kc-text-brand">Charter</span>
          </h1>
          <p className="mt-3 text-white/70">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>
      </section>

      <section className="kc-container space-y-8 text-white">
        <KCCard className="border-white/15 bg-white/10 p-8 shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
          <p className="mb-4 text-lg leading-relaxed text-white/80">
            Welcome to The Kapda Co. These terms govern how you engage with our ateliers, designers, and digital services. By continuing, you agree to the rules outlined below.
          </p>
          <p className="text-sm leading-relaxed text-white/65">
            If you have any questions, our legal and concierge teams are available to guide you.
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
            <h3 className="mb-4 text-xl font-serif">Questions about these terms?</h3>
            <p className="mb-6 text-sm text-white/70">
              Email <a className="text-[var(--kc-beige)] hover:underline" href="mailto:legal@thekapdaco.com">legal@thekapdaco.com</a> or connect through our contact page.
            </p>
            <KCButton as="a" href="/contact" variant="secondary">
              Contact Legal Concierge
            </KCButton>
          </KCCard>
        </motion.div>
      </section>
    </main>
  );
};

export default TermsOfService;

