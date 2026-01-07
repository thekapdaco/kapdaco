import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Store, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { KCButton, KCInput } from '../../components/ui';
import {
  Stepper,
  StudioCard,
  GoldButton,
  Badge,
} from '../../components/designers';

const steps = ["Account Info", "Business Details", "Address", "Financial & Store", "Terms & Submit"];
const storageKey = "kc-brand-application";

export default function BrandSignup(){
  const { signup } = useAuth();
  const nav = useNavigate();
  
  // Basic Account Information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState('individual');

  // Business Details
  const [businessName, setBusinessName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandTagline, setBrandTagline] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [aboutBrand, setAboutBrand] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [brandCategory, setBrandCategory] = useState('');
  const [originCountry, setOriginCountry] = useState('India');
  const [originCity, setOriginCity] = useState('');
  const [businessRegNumber, setBusinessRegNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    facebook: '',
    twitter: '',
    website: ''
  });

  // Address Information
  const [businessAddress, setBusinessAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  const [billingAddressSame, setBillingAddressSame] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });

  // Financial Information
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [paymentProcessor, setPaymentProcessor] = useState('stripe');
  const [currency, setCurrency] = useState('USD');

  // Store Setup
  const [storeLogo, setStoreLogo] = useState(null);
  const [storeBanner, setStoreBanner] = useState(null);
  const [returnPolicy, setReturnPolicy] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');

  // Legal Agreements
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeFees, setAgreeFees] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [err, setErr] = useState('');
  const [savingState, setSavingState] = useState('idle');
  const [submitState, setSubmitState] = useState('idle');

  useEffect(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setName(parsed.name || '');
        setEmail(parsed.email || '');
        setBusinessName(parsed.businessName || '');
        setBusinessCategory(parsed.businessCategory || '');
        setBusinessAddress(parsed.businessAddress || businessAddress);
      } catch (error) {
        console.warn('Failed to parse saved application', error);
      }
    }
  }, []);

  useEffect(() => {
    if (submitState === 'success') return;
    setSavingState('saving');
    const id = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({
        name, email, businessName, businessCategory, businessAddress
      }));
      setSavingState('saved');
    }, 600);
    return () => clearTimeout(id);
  }, [name, email, businessName, businessCategory, businessAddress, submitState]);

  const validateStep = (stepIndex) => {
    if (stepIndex === 0) {
      if (!name.trim()) { setErr('Enter your full name'); return false; }
      if (name.length > 50) { setErr('Name must be less than 50 characters'); return false; }
      if (!email.trim()) { setErr('Provide a valid email'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('Invalid email format'); return false; }
      if (!phone.trim()) { setErr('Add a phone number'); return false; }
      if (!/^\+?[1-9]\d{1,14}$/.test(phone)) { setErr('Invalid phone number format'); return false; }
      if (!password || password.length < 8) { setErr('Password must be at least 8 characters'); return false; }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) { setErr('Password must contain uppercase, lowercase, and number'); return false; }
      if (password !== confirmPassword) { setErr('Passwords do not match'); return false; }
    }
    if (stepIndex === 1) {
      if (!businessName.trim()) { setErr('Enter your business name'); return false; }
      if (businessName.length > 100) { setErr('Business name must be less than 100 characters'); return false; }
      if (brandName && brandName.length > 100) { setErr('Brand name must be less than 100 characters'); return false; }
      if (brandTagline && brandTagline.length > 150) { setErr('Brand tagline must be less than 150 characters'); return false; }
      if (!businessDescription.trim() || businessDescription.length < 50) { setErr('Describe your business (min 50 characters)'); return false; }
      if (businessDescription.length > 1000) { setErr('Business description must be less than 1000 characters'); return false; }
      if (aboutBrand && aboutBrand.length > 2000) { setErr('About brand must be less than 2000 characters'); return false; }
      if (!businessCategory) { setErr('Select a business category'); return false; }
      if (originCity && originCity.length > 100) { setErr('Origin city must be less than 100 characters'); return false; }
      if (originCountry && originCountry.length > 100) { setErr('Origin country must be less than 100 characters'); return false; }
      // Social links validation
      if (socialLinks.instagram && !/^https?:\/\/.+\..+/.test(socialLinks.instagram)) { setErr('Invalid Instagram URL'); return false; }
      if (socialLinks.facebook && !/^https?:\/\/.+\..+/.test(socialLinks.facebook)) { setErr('Invalid Facebook URL'); return false; }
      if (socialLinks.twitter && !/^https?:\/\/.+\..+/.test(socialLinks.twitter)) { setErr('Invalid Twitter URL'); return false; }
      if (socialLinks.website && !/^https?:\/\/.+\..+/.test(socialLinks.website)) { setErr('Invalid website URL'); return false; }
      if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) { setErr('Invalid support email format'); return false; }
      if (supportPhone && !/^\+?[1-9]\d{1,14}$/.test(supportPhone)) { setErr('Invalid support phone format'); return false; }
    }
    if (stepIndex === 2) {
      if (!businessAddress.street || !businessAddress.city || !businessAddress.country) {
        setErr('Complete all required address fields'); return false;
      }
    }
    if (stepIndex === 3) {
      if (!returnPolicy.trim() || !shippingPolicy.trim()) {
        setErr('Complete return and shipping policies'); return false;
      }
    }
    if (stepIndex === 4) {
      if (!agreeTerms || !agreePrivacy || !agreeFees) {
        setErr('Please accept all terms and agreements'); return false;
      }
    }
    setErr('');
    return true;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    
    setSubmitState('submitting');
    try {
      // Generate brand slug from brand name or business name
      const generateBrandSlug = (name) => {
        return (name || businessName)
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };

      const brandData = {
        name,
        email,
        password,
        phone,
        accountType,
        role: 'brand',
        businessInfo: {
          businessName,
          brandName: brandName || businessName,
          brandSlug: generateBrandSlug(brandName || businessName),
          brandTagline: brandTagline || undefined,
          businessDescription,
          aboutBrand: aboutBrand || businessDescription,
          businessCategory,
          brandCategory: brandCategory || undefined,
          originCountry: originCountry || 'India',
          originCity: originCity || undefined,
          businessRegNumber,
          taxId,
          yearsInBusiness,
          businessAddress,
          billingAddress: billingAddressSame ? businessAddress : billingAddress,
          bankAccountNumber,
          routingNumber,
          paymentProcessor,
          currency,
          returnPolicy,
          defaultReturnPolicy: returnPolicy || undefined,
          shippingPolicy,
          defaultShippingPolicy: shippingPolicy || undefined,
          storeLogo: typeof storeLogo === 'string' ? storeLogo : undefined,
          storeBanner: typeof storeBanner === 'string' ? storeBanner : undefined,
          heroBanner: typeof storeBanner === 'string' ? storeBanner : undefined,
          socialLinks: {
            instagram: socialLinks.instagram || undefined,
            facebook: socialLinks.facebook || undefined,
            twitter: socialLinks.twitter || undefined,
            website: socialLinks.website || undefined
          },
          supportEmail: supportEmail || undefined,
          supportPhone: supportPhone || undefined
        }
      };
      
      await signup(brandData);
      localStorage.removeItem(storageKey);
      setSubmitState('success');
      setTimeout(() => nav('/brand/login'), 2000);
    } catch (e) { 
      setErr(e.message);
      setSubmitState('idle');
    }
  };

  const handleAddressChange = (type, field, value) => {
    if (type === 'business') {
      setBusinessAddress(prev => ({ ...prev, [field]: value }));
    } else {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileUpload = (file, type) => {
    if (type === 'logo') {
      setStoreLogo(file);
    } else if (type === 'banner') {
      setStoreBanner(file);
    }
  };

  const stepDescription = useMemo(() => {
    switch (currentStep) {
      case 0: return 'Create your brand account and set up credentials.';
      case 1: return 'Tell us about your business and what you sell.';
      case 2: return 'Provide your business and billing addresses.';
      case 3: return 'Configure payment and store policies.';
      case 4: return 'Review terms and finalize your application.';
      default: return '';
    }
  }, [currentStep]);

  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-[var(--kc-navy-900)] pb-32 text-[var(--kc-cream-100)]">
        <section className="relative overflow-hidden border-b border-white/10 bg-[var(--kc-navy-700)] py-24">
          <div className="absolute inset-0 opacity-20" style={{ background: 'var(--kc-hero-glow)' }} />
          <div className="kc-container relative z-10 flex flex-col items-center gap-6 text-center">
            <span className="kc-pill border-white/20 bg-white/10 text-white/75">Application Received</span>
            <h1 className="text-4xl font-semibold drop-shadow-[0_32px_90px_rgba(0,0,0,0.65)]">Welcome to The Kapda Co.</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Your brand account is being set up. You'll receive an email confirmation shortly with next steps to start listing your products.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <GoldButton as={Link} to="/brand/login" icon={<Store size={16} />} iconPosition="right">
                Go to Brand Portal
              </GoldButton>
              <KCButton as={Link} to="/shop" variant="ghost" className="border border-white/14 bg-white/8 px-6 py-3 text-white/80">
                Browse Shop
              </KCButton>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const renderStepContent = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="form-field-group">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <Field label="Full Name *" value={name} onChange={e => setName(e.target.value)} required />
              <Field type="email" label="Email Address *" value={email} onChange={e => setEmail(e.target.value)} required />
              <Field type="tel" label="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} required />
              <Field type="password" label="Password *" value={password} onChange={e => setPassword(e.target.value)} required />
              <Field type="password" label="Confirm Password *" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              <SelectField
                label="Account Type *"
                value={accountType}
                onChange={e => setAccountType(e.target.value)}
                options={[
                  { value: 'individual', label: 'Individual' },
                  { value: 'business', label: 'Business Entity' },
                ]}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="form-field-group">
            <Field label="Business/Store Name *" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
            <Field label="Brand Name" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Your brand name (if different from business name)" />
            <Field label="Brand Tagline" value={brandTagline} onChange={e => setBrandTagline(e.target.value)} placeholder="Short brand tagline" />
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Business Description *</label>
              <textarea
                rows={4}
                className="form-textarea"
                placeholder="Describe what you sell and your business story"
                value={businessDescription}
                onChange={e => setBusinessDescription(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>About Brand (Extended)</label>
              <textarea
                rows={4}
                className="form-textarea"
                placeholder="Extended brand story and values"
                value={aboutBrand}
                onChange={e => setAboutBrand(e.target.value)}
              />
            </div>
            <SelectField
              label="Business Category *"
              value={businessCategory}
              onChange={e => setBusinessCategory(e.target.value)}
              options={[
                { value: '', label: 'Select a category' },
                { value: 'men-tshirts', label: "Men's T-Shirts" },
                { value: 'women-tshirts', label: "Women's T-Shirts" },
                { value: 'hoodies', label: 'Hoodies' },
                { value: 'accessories', label: 'Accessories' },
                { value: 'cups', label: 'Cups' },
              ]}
            />
            <SelectField
              label="Brand Category"
              value={brandCategory}
              onChange={e => setBrandCategory(e.target.value)}
              options={[
                { value: '', label: 'Select brand category' },
                { value: 'streetwear', label: 'Streetwear' },
                { value: 'premium', label: 'Premium' },
                { value: 'luxury', label: 'Luxury' },
                { value: 'sustainable', label: 'Sustainable' },
                { value: 'vintage', label: 'Vintage' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <Field label="Origin Country" value={originCountry} onChange={e => setOriginCountry(e.target.value)} placeholder="India" />
              <Field label="Origin City" value={originCity} onChange={e => setOriginCity(e.target.value)} placeholder="Mumbai" />
            </div>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Social Links</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <Field label="Instagram" type="url" value={socialLinks.instagram} onChange={e => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))} placeholder="https://instagram.com/yourbrand" />
                <Field label="Facebook" type="url" value={socialLinks.facebook} onChange={e => setSocialLinks(prev => ({ ...prev, facebook: e.target.value }))} placeholder="https://facebook.com/yourbrand" />
                <Field label="Twitter" type="url" value={socialLinks.twitter} onChange={e => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))} placeholder="https://twitter.com/yourbrand" />
                <Field label="Website" type="url" value={socialLinks.website} onChange={e => setSocialLinks(prev => ({ ...prev, website: e.target.value }))} placeholder="https://yourbrand.com" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <Field label="Support Email" type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="support@yourbrand.com" />
              <Field label="Support Phone" type="tel" value={supportPhone} onChange={e => setSupportPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
            {accountType === 'business' && (
              <>
                <Field label="Business Registration Number" value={businessRegNumber} onChange={e => setBusinessRegNumber(e.target.value)} />
                <Field label="Tax ID/VAT Number" value={taxId} onChange={e => setTaxId(e.target.value)} />
              </>
            )}
            <SelectField
              label="Years in Business"
              value={yearsInBusiness}
              onChange={e => setYearsInBusiness(e.target.value)}
              options={[
                { value: '', label: 'Select experience' },
                { value: 'new', label: 'Just starting' },
                { value: '1-2', label: '1-2 years' },
                { value: '3-5', label: '3-5 years' },
                { value: '6-10', label: '6-10 years' },
                { value: '10+', label: '10+ years' },
              ]}
            />
          </div>
        );

      case 2:
        return (
          <div className="form-field-group">
            <h4 className="form-label" style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--kc-cream-100)' }}>Business Address *</h4>
            <Field label="Street Address" value={businessAddress.street} onChange={e => handleAddressChange('business', 'street', e.target.value)} required />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Field label="City" value={businessAddress.city} onChange={e => handleAddressChange('business', 'city', e.target.value)} required />
              <Field label="State/Province" value={businessAddress.state} onChange={e => handleAddressChange('business', 'state', e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Field label="Postal Code" value={businessAddress.postalCode} onChange={e => handleAddressChange('business', 'postalCode', e.target.value)} required />
              <SelectField
                label="Country"
                value={businessAddress.country}
                onChange={e => handleAddressChange('business', 'country', e.target.value)}
                options={[
                  { value: '', label: 'Select country' },
                  { value: 'US', label: 'United States' },
                  { value: 'CA', label: 'Canada' },
                  { value: 'UK', label: 'United Kingdom' },
                  { value: 'AU', label: 'Australia' },
                  { value: 'IN', label: 'India' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            </div>
            <div className="form-field">
              <label className="form-checkbox-wrapper" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={billingAddressSame}
                  onChange={e => setBillingAddressSame(e.target.checked)}
                  className="form-checkbox"
                />
                <span style={{ fontSize: '14px', color: 'rgba(248, 244, 238, 0.8)' }}>Billing address is the same as business address</span>
              </label>
            </div>
            {!billingAddressSame && (
              <>
                <h4 className="form-label" style={{ fontSize: '16px', marginTop: '24px', marginBottom: '16px', color: 'var(--kc-cream-100)' }}>Billing Address</h4>
                <Field label="Street Address" value={billingAddress.street} onChange={e => handleAddressChange('billing', 'street', e.target.value)} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <Field label="City" value={billingAddress.city} onChange={e => handleAddressChange('billing', 'city', e.target.value)} />
                  <Field label="State/Province" value={billingAddress.state} onChange={e => handleAddressChange('billing', 'state', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <Field label="Postal Code" value={billingAddress.postalCode} onChange={e => handleAddressChange('billing', 'postalCode', e.target.value)} />
                  <SelectField
                    label="Country"
                    value={billingAddress.country}
                    onChange={e => handleAddressChange('billing', 'country', e.target.value)}
                    options={[
                      { value: '', label: 'Select country' },
                      { value: 'US', label: 'United States' },
                      { value: 'CA', label: 'Canada' },
                      { value: 'UK', label: 'United Kingdom' },
                      { value: 'AU', label: 'Australia' },
                      { value: 'IN', label: 'India' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="form-field-group">
            <h4 className="form-label" style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--kc-cream-100)' }}>Payment Information</h4>
            <Field type="password" label="Bank Account Number *" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} required />
            <Field label="Routing Number *" value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} required />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <SelectField
                label="Payment Processor"
                value={paymentProcessor}
                onChange={e => setPaymentProcessor(e.target.value)}
                options={[
                  { value: 'stripe', label: 'Stripe' },
                  { value: 'paypal', label: 'PayPal' },
                  { value: 'square', label: 'Square' },
                ]}
              />
              <SelectField
                label="Currency"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'GBP', label: 'GBP' },
                  { value: 'CAD', label: 'CAD' },
                  { value: 'AUD', label: 'AUD' },
                  { value: 'INR', label: 'INR' },
                ]}
              />
            </div>
            <h4 className="form-label" style={{ fontSize: '16px', marginTop: '24px', marginBottom: '16px', color: 'var(--kc-cream-100)' }}>Store Setup</h4>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Store Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload(e.target.files[0], 'logo')}
                className="form-input"
                style={{ padding: '8px' }}
              />
            </div>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Store Banner</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload(e.target.files[0], 'banner')}
                className="form-input"
                style={{ padding: '8px' }}
              />
            </div>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Return Policy *</label>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="Describe your return and refund policy"
                value={returnPolicy}
                onChange={e => setReturnPolicy(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Shipping Policy *</label>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="Describe your shipping policies and timelines"
                value={shippingPolicy}
                onChange={e => setShippingPolicy(e.target.value)}
                required
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-field-group">
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '14px', marginBottom: '24px', border: '1px solid var(--kc-glass-border)' }}>
              <div className="form-field">
                <label className="form-checkbox-wrapper" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    required
                    className="form-checkbox"
                  />
                  <span style={{ fontSize: '14px', color: 'rgba(248, 244, 238, 0.8)' }}>I agree to the <a href="/terms" target="_blank" className="form-link">Terms of Service</a> *</span>
                </label>
              </div>
              <div className="form-field">
                <label className="form-checkbox-wrapper" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={e => setAgreePrivacy(e.target.checked)}
                    required
                    className="form-checkbox"
                  />
                  <span style={{ fontSize: '14px', color: 'rgba(248, 244, 238, 0.8)' }}>I agree to the <a href="/privacy" target="_blank" className="form-link">Privacy Policy</a> *</span>
                </label>
              </div>
              <div className="form-field">
                <label className="form-checkbox-wrapper" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreeFees}
                    onChange={e => setAgreeFees(e.target.checked)}
                    required
                    className="form-checkbox"
                  />
                  <span style={{ fontSize: '14px', color: 'rgba(248, 244, 238, 0.8)' }}>I understand and agree to the commission and fee structure *</span>
                </label>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '14px', border: '1px solid var(--kc-glass-border)' }}>
              <h4 className="form-label" style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--kc-cream-100)' }}>Account Summary</h4>
              <div style={{ fontSize: '14px', color: 'rgba(248, 244, 238, 0.8)', lineHeight: '1.8' }}>
                <SummaryRow label="Name" value={name || '—'} />
                <SummaryRow label="Email" value={email || '—'} />
                <SummaryRow label="Business" value={businessName || '—'} />
                <SummaryRow label="Category" value={businessCategory || '—'} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--kc-navy-900)] pb-32 text-[var(--kc-cream-100)]">
      <section className="relative overflow-hidden border-b border-white/10 bg-[var(--kc-navy-700)]">
        <div className="absolute inset-0 opacity-25" style={{ background: 'var(--kc-hero-glow)' }} />
        <div className="kc-container relative z-10 flex flex-col gap-10 py-20">
          <div className="space-y-6 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="kc-pill border-white/15 bg-white/10 text-white/70">Become a Brand</p>
                <h1 className="mt-4 text-4xl font-semibold drop-shadow-[0_32px_90px_rgba(0,0,0,0.65)] lg:text-[3.2rem]">
                  Launch Your Store
                </h1>
              </div>
              <KCButton
                variant="ghost"
                onClick={() => nav(-1)}
                className="flex items-center gap-2 border border-white/18 bg-white/6 px-4 py-2 text-white/70 hover:text-white"
                icon={<ArrowLeft size={16} />}
              >
                Back
              </KCButton>
            </div>
            <p className="max-w-2xl text-sm text-white/70">
              Start selling your products on our platform. The application takes roughly 10 minutes and auto-saves as you go.
            </p>
          </div>

          <div className="space-y-6">
            <Stepper steps={steps} currentStep={currentStep} />
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
              <span>{stepDescription}</span>
              <span>
                {savingState === 'saving'
                  ? 'Saving…'
                  : savingState === 'saved'
                  ? 'Draft saved'
                  : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="kc-container mt-12 grid gap-10 lg:grid-cols-[1.8fr_1fr]">
        <StudioCard tone="dark" className="bg-white/6 text-white form-container">
          {err && (
            <div className="form-field">
              <span className="form-error">{err}</span>
            </div>
          )}
          {renderStepContent()}
        </StudioCard>

        <StudioCard tone="dark" className="bg-white/6 text-white">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Application Summary</h3>
          <div className="mt-6 space-y-3 text-sm text-white/70">
            <SummaryRow label="Name" value={name || '—'} />
            <SummaryRow label="Email" value={email || '—'} />
            <SummaryRow label="Business" value={businessName || '—'} />
            <SummaryRow label="Category" value={businessCategory || '—'} />
            <SummaryRow label="Type" value={accountType} />
            <SummaryRow label="Location" value={businessAddress.city ? `${businessAddress.city}, ${businessAddress.country}` : '—'} />
            <SummaryRow label="Experience" value={yearsInBusiness || '—'} />
            <SummaryRow label="Policies" value={returnPolicy && shippingPolicy ? 'Complete' : 'Pending'} highlight={returnPolicy && shippingPolicy} />
          </div>

          <div className="mt-8 space-y-3">
            <Badge tone="gold" icon={Shield}>
              Application reviewed manually
            </Badge>
            <p className="text-xs text-white/55">
              Applications are reviewed within 2-3 business days. Approved brands receive access to the brand portal to start listing products.
            </p>
          </div>
        </StudioCard>
      </section>

      <section className="kc-container mt-12 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <KCButton
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="border border-white/18 bg-white/6 px-4 py-2 text-white/70 hover:text-white disabled:opacity-40"
            icon={<ArrowLeft size={16} />}
          >
            Previous
          </KCButton>
          <span className="text-xs uppercase tracking-[0.3em] text-white/60">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        {currentStep < steps.length - 1 ? (
          <GoldButton icon={<ArrowRight size={16} />} iconPosition="right" onClick={nextStep}>
            Next Step
          </GoldButton>
        ) : (
          <GoldButton
            icon={submitState === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={16} />}
            iconPosition="right"
            onClick={submit}
            disabled={submitState === 'submitting'}
          >
            Create Brand Account
          </GoldButton>
        )}
      </section>
    </div>
  );
}

const Field = ({ label, value, onChange, type = 'text', required, placeholder, error }) => (
  <div className="form-field">
    <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{label}</label>
    <KCInput
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant="ghost"
      required={required}
      error={error}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="form-field">
    <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="form-input"
      style={{ appearance: 'auto', paddingRight: '16px' }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} style={{ background: 'var(--kc-navy-700)', color: 'var(--kc-cream-100)' }}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const SummaryRow = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</span>
    <span className={highlight ? 'font-semibold text-[var(--kc-gold-200)]' : 'text-sm'}>{value}</span>
  </div>
);
