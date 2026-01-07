import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { KCButton, KCInput, KCCard } from '../../components/ui';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const contactMethods = [
    { icon: Mail, title: 'Email Us', content: 'hello@thekapdaco.com', link: 'mailto:hello@thekapdaco.com' },
    { icon: Phone, title: 'Call Us', content: '+91 98765 43210', link: 'tel:+919876543210' },
    { icon: MapPin, title: 'Visit Us', content: 'Mumbai • London • Dubai', link: null },
  ];

  return (
    <main className="space-y-16 pb-24 pt-28">
      <section className="premium-noise">
        <div className="kc-container text-center text-white">
          <span className="kc-pill mx-auto bg-white/15 backdrop-blur text-xs tracking-[0.4em] text-white">
            Concierge
          </span>
          <h1 className="mt-6 text-[clamp(2.8rem,4vw,4.8rem)] leading-tight">
            Couture Support, <span className="kc-text-brand">On Call</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-white/80">
            Reach our atelier crew for fittings, bespoke commissions, or logistics. A dedicated liaison replies within 24 hours.
          </p>
        </div>
      </section>

      <section className="kc-container grid gap-10 lg:grid-cols-3">
        <div className="space-y-6">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <div key={method.title}>
                <KCCard className="border-white/20 bg-white/10 p-6 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[var(--kc-radius)] border border-white/30 bg-white/10 text-[var(--kc-beige)]">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-lg font-semibold">{method.title}</h3>
                  </div>
                  {method.link ? (
                    <a href={method.link} className="text-white/85">
                      {method.content}
                    </a>
                  ) : (
                    <p className="text-white/70">{method.content}</p>
                  )}
                </KCCard>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2">
          <div className="form-container">
            <div className="form-card">
              <div className="mb-6 flex items-center gap-3">
                <MessageSquare style={{ color: 'var(--kc-gold)' }} size={24} />
                <h2 className="form-heading" style={{ fontSize: '32px', margin: 0 }}>Send us a Message</h2>
              </div>
              <p className="form-subtitle" style={{ marginBottom: '32px' }}>
                We usually respond within 24 hours. All fields marked with * are required.
              </p>

              {isSubmitted ? (
                <div style={{ 
                  borderRadius: '14px', 
                  border: '2px solid #2E7D32', 
                  background: 'rgba(46, 125, 50, 0.15)', 
                  padding: '24px', 
                  textAlign: 'center',
                  color: 'var(--kc-cream-100)'
                }}>
                  <p style={{ marginBottom: '8px', fontWeight: 600, fontSize: '16px' }}>Message Sent Successfully!</p>
                  <p style={{ fontSize: '14px', color: 'var(--kc-text-on-dark-subtle)' }}>We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="form-field-group">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                    <div className="form-field">
                      <label htmlFor="name" className="form-label">
                        Name *
                      </label>
                      <KCInput
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your name"
                        variant="ghost"
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="email" className="form-label">
                        Email *
                      </label>
                      <KCInput
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                        variant="ghost"
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="phone" className="form-label">
                      Phone
                    </label>
                    <KCInput
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      variant="ghost"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="subject" className="form-label">
                      Subject *
                    </label>
                    <KCInput
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="What is this regarding?"
                      variant="ghost"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="message" className="form-label">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="form-textarea"
                      placeholder="Tell us how we can help..."
                    />
                    <p className="form-character-count">
                      {formData.message.length} characters
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--kc-gray-500)', marginTop: '6px' }}>
                      Please include order number if applicable.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="form-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Sending…'
                    ) : (
                      <>
                        <Send size={18} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;

