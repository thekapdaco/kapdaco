import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  FileImage,
  Loader2,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../lib/api.js";
import { KCButton } from "../../components/ui";
import {
  Stepper,
  StudioCard,
  GoldButton,
  TagChip,
  Badge,
} from "../../components/designers";

const steps = ["Basics", "Style & Skills", "Pricing & Policies", "Verify & Submit"];
const storageKey = "kc-designer-application";

const initialForm = {
  fullName: "",
  lastName: "",
  brandName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  city: "",
  country: "India",
  website: "",
  experience: "emerging",
  specialties: [],
  techniques: [],
  styleTags: [],
  bio: "",
  longBio: "",
  designStyle: "",
  inspiration: "",
  instagramHandle: "",
  instagram: "",
  behance: "",
  dribbble: "",
  priceRange: "atelier",
  turnaround: "4 weeks",
  revisions: "2",
  shipping: "global",
  policies: "",
  availability: "accepting",
  social: "",
  businessType: "individual",
  profileImage: "",
  bannerImage: "",
  agreeTerms: false,
  agreeToCommission: false,
  ageConfirmation: false,
};

const specialtyOptions = [
  "Minimalist",
  "Handloom",
  "Typographic",
  "Streetwear",
  "Heritage",
  "Experimental",
  "Sustainable",
  "Luxury Basics",
];

const techniqueOptions = [
  "Embroidery",
  "Screen Printing",
  "DTG",
  "Block Print",
  "Appliqué",
  "Patchwork",
  "Beading",
  "Digital Illustration",
];

const DesignerSignup = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [currentStep, setCurrentStep] = useState(0);
  const [samples, setSamples] = useState([]);
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [savingState, setSavingState] = useState("idle");
  const [submitState, setSubmitState] = useState("idle");
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Ensure password fields are always strings (never undefined) to avoid controlled/uncontrolled warnings
        setForm({ ...initialForm, ...parsed.form, password: '', confirmPassword: '' });
        setSamples(parsed.samples || []);
        setPortfolioFiles(parsed.portfolioFiles || []);
      } catch (error) {
        console.warn("Failed to parse saved application", error);
      }
    }
    // Pre-fill email if user is logged in
    if (user?.email) {
      setForm(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  useEffect(() => {
    if (submitState === "success") return;
    setSavingState("saving");
    const id = setTimeout(() => {
      // Don't save password fields to localStorage for security
      const { password, confirmPassword, ...formWithoutPasswords } = form;
      localStorage.setItem(storageKey, JSON.stringify({ form: formWithoutPasswords, samples, portfolioFiles }));
      setSavingState("saved");
    }, 600);
    return () => clearTimeout(id);
  }, [form, samples, portfolioFiles, submitState]);

  const toggleArrayValue = (key, value) => {
    setForm((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists ? prev[key].filter((item) => item !== value) : [...prev[key], value],
      };
    });
  };

  const handleInputChange = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          setErrors(prev => ({ ...prev, samples: "File size must be less than 10MB" }));
          continue;
        }
        
        const formData = new FormData();
        formData.append('files', file);
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        // Use signup endpoint (no auth required) for designer signup
        const uploadUrl = API_BASE_URL 
          ? `${API_BASE_URL}/api/uploads/signup/portfolio`
          : '/api/uploads/signup/portfolio';
        
        const headers = {};
        // Only include auth header if token exists (optional for signup)
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers,
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        if (data.files?.[0]?.url) {
          uploadedUrls.push(data.files[0].url);
        }
      }
      
      setPortfolioFiles(prev => [...prev, ...uploadedUrls].slice(0, 6));
      setSamples(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size }))].slice(0, 6));
      setErrors(prev => ({ ...prev, samples: null }));
    } catch (error) {
      console.error('File upload error:', error);
      setErrors(prev => ({ ...prev, samples: "Failed to upload files. Please try again." }));
    } finally {
      setUploading(false);
    }
  };

  const removeSample = (name) => {
    setSamples((prev) => prev.filter((sample) => sample.name !== name));
  };

  const validateStep = (stepIndex) => {
    const nextErrors = {};

    if (stepIndex === 0) {
      if (!form.fullName.trim()) nextErrors.fullName = "Enter your first name";
      if (form.fullName.length > 50) nextErrors.fullName = "First name must be less than 50 characters";
      if (!form.lastName.trim()) nextErrors.lastName = "Enter your last name";
      if (form.lastName.length > 50) nextErrors.lastName = "Last name must be less than 50 characters";
      if (!form.email.trim()) nextErrors.email = "Provide a contact email";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Invalid email format";
      if (!form.password.trim()) nextErrors.password = "Create a password";
      if (form.password.length < 8) nextErrors.password = "Password must be at least 8 characters";
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) nextErrors.password = "Password must contain uppercase, lowercase, and a number";
      if (!form.confirmPassword.trim()) nextErrors.confirmPassword = "Confirm your password";
      if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
      if (!form.phone.trim()) nextErrors.phone = "Add a phone number";
      if (!/^\+?[1-9]\d{1,14}$/.test(form.phone)) nextErrors.phone = "Invalid phone number format";
      if (!form.city.trim()) nextErrors.city = "Enter your city";
      if (form.city.length > 100) nextErrors.city = "City must be less than 100 characters";
      if (!form.country.trim()) nextErrors.country = "Enter your country";
      if (form.country.length > 100) nextErrors.country = "Country must be less than 100 characters";
      if (form.brandName && form.brandName.length > 100) nextErrors.brandName = "Brand name must be less than 100 characters";
      if (form.website && !/^https?:\/\/.+\..+/.test(form.website)) nextErrors.website = "Invalid website URL";
      if (form.instagram && !/^https?:\/\/.+\..+/.test(form.instagram)) nextErrors.instagram = "Invalid Instagram URL";
      if (form.behance && !/^https?:\/\/.+\..+/.test(form.behance)) nextErrors.behance = "Invalid Behance URL";
      if (form.dribbble && !/^https?:\/\/.+\..+/.test(form.dribbble)) nextErrors.dribbble = "Invalid Dribbble URL";
      if (form.instagramHandle && !/^@?[a-zA-Z0-9._]+$/.test(form.instagramHandle)) 
        nextErrors.instagramHandle = "Invalid Instagram handle format";
    }

    if (stepIndex === 1) {
      if (!form.specialties.length) nextErrors.specialties = "Select at least one signature style";
      if (form.specialties.length > 10) nextErrors.specialties = "Select maximum 10 specialties";
      if (!form.bio.trim() || form.bio.length < 120) nextErrors.bio = "Tell us about your atelier (min 120 characters)";
      if (form.bio.length > 500) nextErrors.bio = "Bio must be less than 500 characters";
      if (form.longBio && form.longBio.length > 2000) nextErrors.longBio = "Extended bio must be less than 2000 characters";
      if (!form.designStyle.trim()) nextErrors.designStyle = "Describe your design style";
      if (form.designStyle.length > 500) nextErrors.designStyle = "Design style must be less than 500 characters";
      if (form.inspiration && form.inspiration.length > 1000) nextErrors.inspiration = "Inspiration must be less than 1000 characters";
      if (form.styleTags.length > 20) nextErrors.styleTags = "Maximum 20 style tags allowed";
    }

    if (stepIndex === 2) {
      if (!form.businessType) nextErrors.businessType = "Select your business type";
      if (!form.policies.trim()) nextErrors.policies = "Describe your commission and shipping policy";
      if (form.policies.length > 2000) nextErrors.policies = "Policies must be less than 2000 characters";
    }

    if (stepIndex === 3) {
      if (portfolioFiles.length < 3) nextErrors.samples = "Upload at least three sample designs";
      if (portfolioFiles.length > 6) nextErrors.samples = "Maximum 6 sample designs allowed";
      if (!form.agreeTerms) nextErrors.agreeTerms = "Agree to the terms to continue";
      if (!form.agreeToCommission) nextErrors.agreeToCommission = "Agree to the commission structure";
      if (!form.ageConfirmation) nextErrors.ageConfirmation = "Confirm your age";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setSubmitState("submitting");
    try {
      // Step 1: Create user account first
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const signupUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/signup` : '/api/auth/signup';
      
      const signupResponse = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${form.fullName} ${form.lastName}`.trim(),
          email: form.email,
          password: form.password,
          role: 'designer',
          phone: form.phone,
          city: form.city,
          country: form.country,
        }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(signupData.message || 'Account creation failed');
      }

      // Step 2: Now submit the designer application with the token from signup
      const applicationToken = signupData.token;
      // Parse location if it's still in old format
      let city = form.city;
      let country = form.country;
      
      // Extract social links
      const socialUrl = form.social || form.website || "";
      let instagram = form.instagram || "";
      let behance = form.behance || "";
      let dribbble = form.dribbble || "";
      
      if (!instagram && socialUrl.includes("instagram.com")) {
        instagram = socialUrl;
      }
      if (!behance && socialUrl.includes("behance.net")) {
        behance = socialUrl;
      }
      if (!dribbble && socialUrl.includes("dribbble.com")) {
        dribbble = socialUrl;
      }

      // Prepare metadata with all required fields
      const metadata = {
        country,
        city,
        phone: form.phone,
        inspiration: form.inspiration || "",
        businessType: form.businessType,
        portfolioFiles: portfolioFiles
      };

      // Helper function to convert empty strings to undefined for optional fields
      const cleanOptionalField = (value) => (value && value.trim() ? value.trim() : undefined);
      
      // Build portfolioLinks only if at least one link exists
      const portfolioLinksObj = {
        behance: cleanOptionalField(behance),
        dribbble: cleanOptionalField(dribbble),
        website: cleanOptionalField(form.website)
      };
      const portfolioLinks = (portfolioLinksObj.behance || portfolioLinksObj.dribbble || portfolioLinksObj.website) 
        ? portfolioLinksObj 
        : undefined;
      
      // Submit application
      const payload = {
        fullName: form.fullName,
        lastName: form.lastName,
        name: form.brandName || form.fullName, // designerName
        email: form.email,
        bio: form.bio,
        longBio: cleanOptionalField(form.longBio),
        portfolioUrl: cleanOptionalField(form.website),
        instagram: cleanOptionalField(instagram),
        instagramHandle: cleanOptionalField(form.instagramHandle),
        behance: cleanOptionalField(behance),
        dribbble: cleanOptionalField(dribbble),
        website: cleanOptionalField(form.website),
        specialties: form.specialties,
        styleTags: form.styleTags || [],
        experience: form.experience,
        designStyle: form.designStyle,
        profileImage: cleanOptionalField(form.profileImage),
        bannerImage: cleanOptionalField(form.bannerImage),
        portfolioLinks,
        metadata
      };

      const applicationResponse = await fetch(API_BASE_URL ? `${API_BASE_URL}/api/designer-app/apply` : '/api/designer-app/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${applicationToken}`
        },
        body: JSON.stringify(payload)
      });

      const applicationData = await applicationResponse.json();
      
      if (!applicationResponse.ok) {
        // Extract detailed validation errors if available
        if (applicationData.errors && Array.isArray(applicationData.errors)) {
          const errorMessages = applicationData.errors.map(err => err.message || err.msg).join(', ');
          throw new Error(errorMessages || applicationData.message || 'Validation failed');
        }
        throw new Error(applicationData.message || 'Failed to submit application');
      }

      setSubmitState("success");
      localStorage.removeItem(storageKey);
      
      // Redirect to designer login after successful submission
      setTimeout(() => {
        navigate("/designer/login");
      }, 2000);
    } catch (error) {
      console.error('Application submission error:', error);
      // Extract detailed error message if available
      let errorMessage = error.message || "Failed to submit application. Please try again.";
      if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map(e => e.msg || e.message).join(', ');
      }
      setErrors({ submit: errorMessage });
      setSubmitState("idle");
    }
  };

  const stepDescription = useMemo(() => {
    switch (currentStep) {
      case 0:
        return "Introduce your atelier and how we can reach you.";
      case 1:
        return "Share your signatures, inspiration, and craftsmanship.";
      case 2:
        return "Outline pricing, timelines, and brand policies.";
      case 3:
        return "Upload sample work and confirm submission.";
      default:
        return "";
    }
  }, [currentStep]);

  if (submitState === "success") {
    return (
      <div className="min-h-screen bg-[var(--kc-navy-900)] pb-32 text-[var(--kc-cream-100)]">
        <section className="relative overflow-hidden border-b border-white/10 bg-[var(--kc-navy-700)] py-24">
          <div className="absolute inset-0 opacity-20" style={{ background: "var(--kc-hero-glow)" }} />
          <div className="kc-container relative z-10 flex flex-col items-center gap-6 text-center">
            <span className="kc-pill border-white/20 bg-white/10 text-white/75">Application Received</span>
            <h1 className="text-4xl font-semibold drop-shadow-[0_32px_90px_rgba(0,0,0,0.65)] text-[var(--kc-cream-100)]">Welcome to The Kapda Co.</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Our atelier onboarding team will review your submission within 3–5 working days. Expect a curated email
              detailing next steps, including portfolio spotlight opportunities and a link to finalise your designer
              portal profile.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <GoldButton as={Link} to="/designer/portal" icon={<Sparkles size={16} />} iconPosition="right">
                Enter Pre-Portal
              </GoldButton>
              <KCButton as={Link} to="/designers" variant="ghost" className="border border-white/14 bg-white/8 px-6 py-3 text-white/80">
                Explore Designers
              </KCButton>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--kc-navy-900)] pb-32 text-[var(--kc-cream-100)]">
      <section className="relative overflow-hidden border-b border-white/10 bg-[var(--kc-navy-700)]">
        <div className="absolute inset-0 opacity-25" style={{ background: "var(--kc-hero-glow)" }} />
        <div className="kc-container relative z-10 flex flex-col gap-10 py-20">
          <div className="space-y-6 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="kc-pill border-white/15 bg-white/10 text-white/70">Become a Designer</p>
                <h1 className="mt-4 text-4xl font-semibold drop-shadow-[0_32px_90px_rgba(0,0,0,0.65)] lg:text-[3.2rem]">
                  Join The Kapda Co. Collective
                </h1>
              </div>
              <KCButton
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 border border-white/18 bg-white/6 px-4 py-2 text-white/70 hover:text-white"
                icon={<ArrowLeft size={16} />}
              >
                Back
              </KCButton>
            </div>
            <p className="max-w-2xl text-sm text-white/70">
              Share your craftsmanship, articulate your practice, and we will curate your placement in our designer
              marketplace. The application takes roughly 10 minutes and auto-saves as you go.
            </p>
          </div>

          <div className="space-y-6">
            <Stepper steps={steps} currentStep={currentStep} />
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
              <span>{stepDescription}</span>
              <span>
                {savingState === "saving"
                  ? "Saving…"
                  : savingState === "saved"
                  ? "Draft saved"
                  : ""}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="kc-container mt-12 grid gap-10 lg:grid-cols-[1.8fr_1fr]">
        <StudioCard tone="dark" className="bg-white/6 text-white form-container">
          {currentStep === 0 ? (
            <div className="form-field-group">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--kc-spacing-xl)' }}>
                <Field
                  label="First name *"
                  value={form.fullName}
                  onChange={handleInputChange("fullName")}
                  error={errors.fullName}
                />
                <Field
                  label="Last name *"
                  value={form.lastName}
                  onChange={handleInputChange("lastName")}
                  error={errors.lastName}
                />
                <Field label="Brand studio name" value={form.brandName} onChange={handleInputChange("brandName")} />
                <Field
                  type="email"
                  label="Contact email *"
                  value={form.email}
                  onChange={handleInputChange("email")}
                  error={errors.email}
                />
                <div className="form-field">
                  <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleInputChange("password")}
                      placeholder="Create a secure password"
                      className="form-input"
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kc-gray-500)', padding: '8px' }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password ? <span className="form-error">{errors.password}</span> : null}
                </div>
                <div className="form-field">
                  <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={handleInputChange("confirmPassword")}
                      placeholder="Confirm your password"
                      className="form-input"
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kc-gray-500)', padding: '8px' }}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword ? <span className="form-error">{errors.confirmPassword}</span> : null}
                </div>
                <Field
                  label="Phone / WhatsApp *"
                  value={form.phone}
                  onChange={handleInputChange("phone")}
                  error={errors.phone}
                />
                <Field
                  label="City *"
                  value={form.city}
                  onChange={handleInputChange("city")}
                  error={errors.city}
                />
                <Field
                  label="Country *"
                  value={form.country}
                  onChange={handleInputChange("country")}
                  error={errors.country}
                />
                <Field label="Website / Portfolio" value={form.website} onChange={handleInputChange("website")} />
                <Field
                  label="Instagram Handle"
                  value={form.instagramHandle}
                  onChange={handleInputChange("instagramHandle")}
                  placeholder="@yourhandle"
                />
                <Field
                  type="url"
                  label="Instagram URL"
                  value={form.instagram}
                  onChange={handleInputChange("instagram")}
                  placeholder="https://instagram.com/yourhandle"
                />
                <Field
                  type="url"
                  label="Behance URL"
                  value={form.behance}
                  onChange={handleInputChange("behance")}
                  placeholder="https://behance.net/yourprofile"
                />
                <Field
                  type="url"
                  label="Dribbble URL"
                  value={form.dribbble}
                  onChange={handleInputChange("dribbble")}
                  placeholder="https://dribbble.com/yourprofile"
                />
              </div>

              <div className="form-field" style={{ marginTop: 'var(--kc-spacing-xl)' }}>
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Experience level</label>
                <div className="flex flex-wrap gap-3">
                  {["emerging", "established", "collective"].map((level) => (
                    <TagChip
                      key={level}
                      active={form.experience === level}
                      onClick={() => setForm((prev) => ({ ...prev, experience: level }))}
                    >
                      {level}
                    </TagChip>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div className="form-field-group">
              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Signature specialties</label>
                <div className="flex flex-wrap gap-2">
                  {specialtyOptions.map((option) => (
                    <TagChip
                      key={option}
                      active={form.specialties.includes(option)}
                      onClick={() => toggleArrayValue("specialties", option)}
                    >
                      {option}
                    </TagChip>
                  ))}
                </div>
                {errors.specialties ? <span className="form-error">{errors.specialties}</span> : null}
              </div>

              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Techniques mastered</label>
                <div className="flex flex-wrap gap-2">
                  {techniqueOptions.map((option) => (
                    <TagChip
                      key={option}
                      active={form.techniques.includes(option)}
                      onClick={() => toggleArrayValue("techniques", option)}
                    >
                      {option}
                    </TagChip>
                  ))}
                </div>
                {errors.techniques ? <span className="form-error">{errors.techniques}</span> : null}
              </div>

              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Atelier story *</label>
                <textarea
                  rows={6}
                  className="form-textarea"
                  value={form.bio}
                  onChange={handleInputChange("bio")}
                  placeholder="Describe your design ethos, signature silhouettes, and atelier process"
                />
                {errors.bio ? <span className="form-error">{errors.bio}</span> : null}
              </div>

              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Style Tags</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.styleTags.join(', ')}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    styleTags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  placeholder="street, minimal, graphic, vintage (separate with commas)"
                />
              </div>

              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Design Style *</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={form.designStyle}
                  onChange={handleInputChange("designStyle")}
                  placeholder="Describe your signature design style and aesthetic"
                />
                {errors.designStyle ? <span className="form-error">{errors.designStyle}</span> : null}
              </div>

              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Extended Bio</label>
                <textarea
                  rows={4}
                  className="form-textarea"
                  value={form.longBio}
                  onChange={handleInputChange("longBio")}
                  placeholder="Extended bio about your design journey, philosophy, and achievements"
                />
              </div>

              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Inspiration & references</label>
                <textarea
                  rows={4}
                  className="form-textarea"
                  value={form.inspiration}
                  onChange={handleInputChange("inspiration")}
                  placeholder="What movements, cultures, or muses shape your work?"
                />
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="form-field-group">
              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Business Type *</label>
                <select
                  value={form.businessType}
                  onChange={handleInputChange("businessType")}
                  className="form-input"
                  style={{ appearance: 'auto', paddingRight: '16px' }}
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business Entity</option>
                </select>
                {errors.businessType ? <span className="form-error">{errors.businessType}</span> : null}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--kc-spacing-xl)' }}>
                <SelectField
                  label="Commission range"
                  value={form.priceRange}
                  onChange={handleInputChange("priceRange")}
                  options={[
                    { value: "access", label: "Ready-to-Wear (₹799 - ₹1499)" },
                    { value: "atelier", label: "Atelier (₹1500 - ₹4999)" },
                    { value: "couture", label: "Couture (₹5000+)" },
                  ]}
                />
                <SelectField
                  label="Typical turnaround"
                  value={form.turnaround}
                  onChange={handleInputChange("turnaround")}
                  options={[
                    { value: "2 weeks", label: "2 weeks" },
                    { value: "4 weeks", label: "4 weeks" },
                    { value: "6 weeks", label: "6 weeks" },
                    { value: "8 weeks", label: "8 weeks" },
                  ]}
                />
                <SelectField
                  label="Included revisions"
                  value={form.revisions}
                  onChange={handleInputChange("revisions")}
                  options={[
                    { value: "1", label: "1" },
                    { value: "2", label: "2" },
                    { value: "3", label: "3" },
                    { value: "4", label: "4" },
                  ]}
                />
                <SelectField
                  label="Shipping"
                  value={form.shipping}
                  onChange={handleInputChange("shipping")}
                  options={[
                    { value: "domestic", label: "Domestic" },
                    { value: "global", label: "Global" },
                    { value: "boutique", label: "Boutique pickup" },
                  ]}
                />
              </div>

              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Policies & notes *</label>
                <textarea
                  rows={5}
                  className="form-textarea"
                  value={form.policies}
                  onChange={handleInputChange("policies")}
                  placeholder="Outline commission terms, shipping policies, and sustainability commitments"
                />
                {errors.policies ? <span className="form-error">{errors.policies}</span> : null}
              </div>

              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Availability toggle</label>
                <div className="flex flex-wrap gap-2">
                  {["accepting", "waitlist", "closed"].map((value) => (
                    <TagChip
                      key={value}
                      active={form.availability === value}
                      onClick={() => setForm((prev) => ({ ...prev, availability: value }))}
                    >
                      {value}
                    </TagChip>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="form-field-group">
              <div className="form-field">
                <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Upload sample designs (min 3)</label>
                <div className="form-file-upload">
                  <CloudUpload className="mx-auto h-10 w-10" style={{ color: 'var(--kc-beige-300)' }} />
                  <p style={{ marginTop: 'var(--kc-spacing-md)', fontSize: '14px', color: 'var(--kc-cream-100)', opacity: 0.7 }}>
                    Drag & drop or select up to six hero pieces showcasing craftsmanship.
                  </p>
                  <div style={{ marginTop: 'var(--kc-spacing-lg)' }}>
                    <label className="form-button" style={{ width: 'auto', padding: 'var(--kc-spacing-md) var(--kc-spacing-xl)', cursor: 'pointer', display: 'inline-block' }}>
                      Select files
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
                {errors.samples ? <span className="form-error">{errors.samples}</span> : null}
                {uploading && <p className="text-sm text-white/70">Uploading files...</p>}
                {portfolioFiles.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {portfolioFiles.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-[var(--kc-radius)] border border-white/14 bg-[var(--kc-glass-01)] px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <FileImage size={18} />
                          <span className="truncate">{samples[index]?.name || `File ${index + 1}`}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
                            setSamples(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-xs uppercase tracking-[0.28em] text-white/50 hover:text-white"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.3em] text-white/60">Profile Images (Optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--kc-spacing-md)' }}>
                  <div className="form-field">
                    <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Profile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploading(true);
                          try {
                            const formData = new FormData();
                            formData.append('files', file);
                            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
                            const uploadUrl = API_BASE_URL ? `${API_BASE_URL}/api/uploads/signup/portfolio` : '/api/uploads/signup/portfolio';
                            const headers = {};
                            if (token) {
                              headers['Authorization'] = `Bearer ${token}`;
                            }
                            const response = await fetch(uploadUrl, {
                              method: 'POST',
                              headers,
                              body: formData
                            });
                            const data = await response.json();
                            if (data.files?.[0]?.url) {
                              setForm(prev => ({ ...prev, profileImage: data.files[0].url }));
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                          } finally {
                            setUploading(false);
                          }
                        }
                      }}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Banner Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploading(true);
                          try {
                            const formData = new FormData();
                            formData.append('files', file);
                            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
                            const uploadUrl = API_BASE_URL ? `${API_BASE_URL}/api/uploads/signup/portfolio` : '/api/uploads/signup/portfolio';
                            const headers = {};
                            if (token) {
                              headers['Authorization'] = `Bearer ${token}`;
                            }
                            const response = await fetch(uploadUrl, {
                              method: 'POST',
                              headers,
                              body: formData
                            });
                            const data = await response.json();
                            if (data.files?.[0]?.url) {
                              setForm(prev => ({ ...prev, bannerImage: data.files[0].url }));
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                          } finally {
                            setUploading(false);
                          }
                        }
                      }}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="form-checkbox-wrapper" style={{ color: 'var(--kc-cream-100)', opacity: 0.8, fontSize: '14px' }}>
                  <input type="checkbox" checked={form.agreeTerms} onChange={handleInputChange("agreeTerms")} className="form-checkbox" />
                  <span>I agree to The Kapda Co. designer terms, including archival documentation and quality inspections. *</span>
                </label>
                {errors.agreeTerms ? <span className="form-error">{errors.agreeTerms}</span> : null}

                <label className="form-checkbox-wrapper" style={{ color: 'var(--kc-cream-100)', opacity: 0.8, fontSize: '14px' }}>
                  <input type="checkbox" checked={form.agreeToCommission} onChange={handleInputChange("agreeToCommission")} className="form-checkbox" />
                  <span>I agree to the commission structure and payment terms. *</span>
                </label>
                {errors.agreeToCommission ? <span className="form-error">{errors.agreeToCommission}</span> : null}

                <label className="form-checkbox-wrapper" style={{ color: 'var(--kc-cream-100)', opacity: 0.8, fontSize: '14px' }}>
                  <input type="checkbox" checked={form.ageConfirmation} onChange={handleInputChange("ageConfirmation")} className="form-checkbox" />
                  <span>I confirm that I am 18 years or older. *</span>
                </label>
                {errors.ageConfirmation ? <span className="form-error">{errors.ageConfirmation}</span> : null}
              </div>

              {errors.submit && (
                <div className="form-error" style={{ marginTop: 'var(--kc-spacing-md)' }}>
                  {errors.submit}
                </div>
              )}
            </div>
          ) : null}
        </StudioCard>

        <StudioCard tone="dark" className="bg-white/6 text-white">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">Application Summary</h3>
          <div className="mt-6 space-y-3 text-sm text-white/70">
            <SummaryRow label="Name" value={form.fullName || "—"} />
            <SummaryRow label="Studio" value={form.brandName || "—"} />
            <SummaryRow label="Location" value={form.location || "—"} />
            <SummaryRow label="Experience" value={form.experience} />
            <SummaryRow label="Specialties" value={form.specialties.join(", ") || "—"} />
            <SummaryRow label="Techniques" value={form.techniques.join(", ") || "—"} />
            <SummaryRow label="Commission range" value={form.priceRange} />
            <SummaryRow label="Turnaround" value={form.turnaround} />
            <SummaryRow label="Availability" value={form.availability} />
            <SummaryRow label="Samples" value={`${portfolioFiles.length} uploaded`} highlight={portfolioFiles.length >= 3} />
          </div>

          <div className="mt-8 space-y-3">
            <Badge tone="gold" icon={Shield}>
              Portfolio reviewed manually
            </Badge>
            <p className="text-xs text-white/55">
              Applications are curated weekly. Approved designers receive bespoke onboarding and access to Pre-Portal to
              finalise pricing, policies, and upload catalogue assets.
            </p>
          </div>
        </StudioCard>
      </section>

      <section className="kc-container mt-12 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <KCButton
            variant="ghost"
            onClick={handlePrev}
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
          <GoldButton icon={<ArrowRight size={16} />} iconPosition="right" onClick={handleNext}>
            Next Step
          </GoldButton>
        ) : (
          <GoldButton
            icon={submitState === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={16} />}
            iconPosition="right"
            onClick={handleSubmit}
            disabled={submitState === "submitting"}
          >
            Submit Application
          </GoldButton>
        )}
      </section>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", error, placeholder }) => (
  <div className="form-field">
    <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3em' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="form-input"
    />
    {error ? <span className="form-error">{error}</span> : null}
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
      {      options.map((option) => (
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
    <span className={highlight ? "font-semibold text-[var(--kc-gold-200)]" : "text-sm text-white/70"}>{value}</span>
  </div>
);


export default DesignerSignup;
