import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../lib/api.js";
import { KCButton, KCInput, KCCard, KCAlert } from "../../components/ui";
import { cn } from "../../lib/cn";
import { Loader2 } from "lucide-react";

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
const colorOptions = ["Black", "White", "Beige", "Navy", "Red", "Green"];

const previewBackgrounds = {
  tshirt: "bg-gradient-to-b from-[#eaeaea] to-[#dcdcdc]",
  hoodie: "bg-gradient-to-b from-[#e6edf5] to-[#d7e3f0]",
  cap: "bg-gradient-to-b from-[#f2efe6] to-[#e6e0cf]",
};

export default function DesignerNewProduct() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subtitle: "",
    category: "tshirt",
    subcategory: "",
    gender: "unisex",
    description: "",
    tags: "",
    styleTags: "",
    slug: "", // SEO-friendly URL slug
    designFile: "",
    designType: "image",
    placement: "front-center",
    mockups: [],
    colorVariants: [],
    sizes: [],
    material: "Cotton",
    fabricComposition: "",
    fitType: "Oversized",
    fit: "oversized",
    pattern: "",
    neckType: "",
    sleeveLength: "",
    season: "all-season",
    occasion: [],
    careInstructions: "",
    sizeChart: "",
    priceBase: "",
    priceDiscount: "",
    compareAtPrice: "",
    weight: "",
    dimensions: "",
    deliveryEstimate: "",
    dispatchTimeRange: "",
    shippingTimeEstimate: "",
    returnPolicy: "",
    returnPolicySummary: "",
    returnWindowDays: 7,
    cashOnDeliveryAvailable: true,
    badges: [],
    availabilityStatus: "in_stock",
    seoTitle: "",
    seoDescription: "",
    shippingIsFree: true,
    shippingFlatRate: "",
    shippingDispatchDays: 3,
    royaltyPercent: "",
    rightsConfirmed: false,
  });
  const [inventory, setInventory] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "designer") {
      navigate("/");
    }
  }, [user, navigate]);

  const pushNotification = (message, variant = "danger") => {
    setNotifications([{ message, variant }]);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Auto-generate slug from product name
      if (name === 'name' && value) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const toggleSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((item) => item !== size)
        : [...prev.sizes, size],
    }));
  };

  const toggleColor = (color) => {
    setFormData((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.includes(color)
        ? prev.colorVariants.filter((item) => item !== color)
        : [...prev.colorVariants, color],
    }));
  };

  useEffect(() => {
    setInventory((prev) => {
      const next = { ...prev };
      formData.colorVariants.forEach((color) => {
        if (!next[color]) next[color] = {};
        const relevantSizes = formData.category === "cap" ? ["Free"] : formData.sizes;
        relevantSizes.forEach((size) => {
          if (next[color][size] == null) next[color][size] = 0;
        });
      });

      Object.keys(next).forEach((color) => {
        if (!formData.colorVariants.includes(color)) {
          delete next[color];
        } else {
          Object.keys(next[color]).forEach((size) => {
            const allowedSizes = formData.category === "cap" ? ["Free"] : formData.sizes;
            if (!allowedSizes.includes(size)) {
              delete next[color][size];
            }
          });
        }
      });

      return next;
    });
  }, [formData.colorVariants, formData.sizes, formData.category]);

  const uploadImage = async (file) => {
    if (!file) return "";
    if (file.size > 10 * 1024 * 1024) {
      pushNotification("Please upload files under 10MB.");
      return "";
    }
    if (!file.type.startsWith("image/")) {
      pushNotification("Only image uploads are supported.");
      return "";
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("images", file);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
      const uploadUrl = API_BASE_URL ? `${API_BASE_URL}/api/uploads/products` : "/api/uploads/products";
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      return data?.files?.[0]?.url || "";
    } catch (err) {
      pushNotification(err.message || "Upload failed");
      return "";
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e, key) => {
    const file = e?.target?.files?.[0];
    const url = await uploadImage(file);
    if (url) {
      setFormData((prev) => ({ ...prev, [key]: url }));
    }
  };

  const handleMockupUpload = async (e) => {
    const files = Array.from(e?.target?.files || []);
    const uploaded = [];
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) uploaded.push(url);
    }
    if (uploaded.length) {
      setFormData((prev) => ({ ...prev, mockups: [...prev.mockups, ...uploaded] }));
    }
  };

  const validate = () => {
    if (!formData.name || formData.name.length < 3 || formData.name.length > 80) {
      pushNotification("Name must be 3–80 characters.");
      return false;
    }
    if (!formData.description || formData.description.length < 30 || formData.description.length > 800) {
      pushNotification("Description must be 30–800 characters.");
      return false;
    }
    if (!formData.designFile) {
      pushNotification("Upload your primary design before submitting.");
      return false;
    }
    if (!formData.rightsConfirmed) {
      pushNotification("Please confirm you hold rights to this design.");
      return false;
    }
    return true;
  };

  const submitProduct = async (status) => {
    if (!token) {
      navigate("/designer/login");
      return;
    }
    if (!validate()) return;

    try {
      setSubmitting(true);
      const tags = (formData.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);
      const priceBase = Number(formData.priceBase || 0);
      const discountPct = Number(formData.priceDiscount || 0);

      // Map form data to product schema
      const sizes = formData.category === "cap" ? ["Free"] : formData.sizes;
      
      // Build variants array with proper structure
      const variants = [];
      formData.colorVariants.forEach(color => {
        sizes.forEach(size => {
          variants.push({
            color,
            size,
            stock: inventory[color]?.[size] || 0,
            price: priceBase // Can be overridden per variant if needed
          });
        });
      });

      const payload = {
        title: formData.name,
        description: formData.description,
        category: formData.category,
        tags,
        price: priceBase,
        discountPrice: discountPct ? Math.round(priceBase * (1 - discountPct / 100)) : undefined,
        mainImage: formData.designFile,
        images: formData.mockups.length > 0 ? [formData.designFile, ...formData.mockups] : [formData.designFile],
        colors: formData.colorVariants,
        sizes: sizes,
        material: formData.material,
        variants: variants,
        stock: variants.reduce((sum, v) => sum + (v.stock || 0), 0), // Total stock
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        dimensions: formData.dimensions || undefined,
        deliveryEstimateDays: formData.deliveryEstimate || undefined,
        returnPolicy: formData.returnPolicy || undefined,
        slug: formData.slug || undefined,
        // Commission settings (default 30% percentage)
        commissionType: "percentage",
        commissionRate: formData.royaltyPercent ? Number(formData.royaltyPercent) : 30,
        status, // "draft" or "pending_review"
      };

      await api("/api/designer/products", { method: "POST", body: payload, token });
      alert(
        status === "draft"
          ? "Draft saved. You can publish anytime from your dashboard."
          : "Submitted for review. We’ll notify you when it’s live."
      );
      navigate("/designer/dashboard");
    } catch (err) {
      pushNotification(err.message || "We couldn’t save the product.");
    } finally {
      setSubmitting(false);
    }
  };

  const finalPrice = useMemo(() => {
    const base = Number(formData.priceBase || 0);
    const discount = Number(formData.priceDiscount || 0);
    return discount ? Math.round(base * (1 - discount / 100)) : base;
  }, [formData.priceBase, formData.priceDiscount]);

  return (
    <div className="min-h-screen bg-[var(--kc-bg)] py-16">
      <div className="kc-container max-w-5xl">
        <div className="mb-8 space-y-3 text-center">
          <p className="kc-pill mx-auto bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-2)]">Designer Studio</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--kc-ink)] md:text-[2.4rem]">
            Add a New Product
          </h1>
          <p className="text-sm text-[var(--kc-ink-2)]">
            Upload your artwork, choose variants, and launch a collection that reflects your signature style.
          </p>
        </div>

        <KCCard className="space-y-8 p-8">
          {notifications.map((note, idx) => (
            <KCAlert key={idx} variant={note.variant} className="text-sm">
              {note.message}
            </KCAlert>
          ))}

          <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
            <section className="space-y-6">
              <header>
                <h2 className="text-lg font-semibold text-[var(--kc-ink)]">Basic Information</h2>
                <p className="text-sm text-[var(--kc-ink-2)]">Give shoppers clarity about what makes this piece special.</p>
              </header>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Name *</label>
                  <KCInput
                    name="name"
                    value={formData.name}
                    onChange={handleFieldChange}
                    placeholder="Midnight Bloom Graphic Tee"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        category: value,
                        sizes: value === "cap" ? [] : prev.sizes,
                        fitType: value === "cap" ? undefined : prev.fitType || "Oversized",
                      }));
                    }}
                    className="kc-input"
                  >
                    <option value="tshirt">T-Shirt</option>
                    <option value="hoodie">Hoodie</option>
                    <option value="cap">Cap</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Subcategory</label>
                  <KCInput
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleFieldChange}
                    placeholder="Graphic, Minimal, Collaboration"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Tags</label>
                  <KCInput
                    name="tags"
                    value={formData.tags}
                    onChange={handleFieldChange}
                    placeholder="streetwear, summer, limited"
                  />
                  <p className="text-xs text-[var(--kc-ink-2)]">Use commas to separate tags.</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--kc-ink)]">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFieldChange}
                  placeholder="Share fabric details, fit guidance, design story, and styling notes."
                  className="kc-input min-h-[140px] resize-y"
                />
                <p className="text-xs text-[var(--kc-ink-2)]">30–800 characters.</p>
              </div>
            </section>

            <section className="space-y-6">
              <header>
                <h2 className="text-lg font-semibold text-[var(--kc-ink)]">Design & Media</h2>
                <p className="text-sm text-[var(--kc-ink-2)]">Upload your hero artwork and optional mockups to elevate the presentation.</p>
              </header>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Design File *</label>
                  <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "designFile")} disabled={uploading} />
                  <p className="text-xs text-[var(--kc-ink-2)]">PNG or JPG, up to 10MB.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Design Type *</label>
                  <select name="designType" value={formData.designType} onChange={handleFieldChange} className="kc-input">
                    <option value="image">Image</option>
                    <option value="text">Text</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Placement *</label>
                  <select name="placement" value={formData.placement} onChange={handleFieldChange} className="kc-input">
                    <option value="front-center">Front Center</option>
                    <option value="back">Back</option>
                    <option value="left-sleeve">Left Sleeve</option>
                    <option value="right-sleeve">Right Sleeve</option>
                    <option value="cap-front">Cap Front</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Mockups (optional)</label>
                  <input type="file" accept="image/*" multiple onChange={handleMockupUpload} />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-[minmax(240px,280px)_1fr]">
                <div
                  className={cn(
                    "relative flex h-80 items-center justify-center overflow-hidden rounded-[var(--kc-radius-lg)] border border-[var(--kc-border)]",
                    previewBackgrounds[formData.category]
                  )}
                >
                  {formData.designFile ? (
                    <img
                      src={formData.designFile}
                      alt="Design preview"
                      className={cn(
                        "max-h-[60%] max-w-[60%] object-contain drop-shadow-xl",
                        formData.placement === "left-sleeve" && "absolute left-6 top-1/3 rotate-[-10deg]",
                        formData.placement === "right-sleeve" && "absolute right-6 top-1/3 rotate-[10deg]",
                        formData.placement === "back" && "opacity-90",
                        formData.placement === "cap-front" && "max-h-[45%] max-w-[50%]"
                      )}
                    />
                  ) : (
                    <span className="text-xs uppercase tracking-[0.35em] text-[var(--kc-ink-2)]">
                      Preview updates once you add artwork
                    </span>
                  )}
                </div>
                <div className="space-y-4 text-sm text-[var(--kc-ink-2)]">
                  <p>
                    Drag-and-drop print areas help customers visualize the final fit. We apply color-accurate DTG
                    printing—ensure files are 300 DPI and on transparent background.
                  </p>
                  {formData.mockups.length ? (
                    <div className="flex flex-wrap gap-3">
                      {formData.mockups.map((mockup) => (
                        <img
                          key={mockup}
                          src={mockup}
                          alt="Mockup"
                          className="h-16 w-16 rounded-[var(--kc-radius)] border border-[var(--kc-border)] object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <header>
                <h2 className="text-lg font-semibold text-[var(--kc-ink)]">Variants</h2>
                <p className="text-sm text-[var(--kc-ink-2)]">Offer multiple colors and fits to widen appeal.</p>
              </header>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Colors</label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => {
                      const isActive = formData.colorVariants.includes(color);
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => toggleColor(color)}
                          className={cn(
                            "kc-pill border border-[var(--kc-border)] bg-[var(--kc-card)] text-sm font-medium transition",
                            isActive && "border-[var(--kc-gold-1)] bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-2)]"
                          )}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Sizes</label>
                  {formData.category === "cap" ? (
                    <div className="kc-pill bg-[var(--kc-card)] text-sm text-[var(--kc-ink-2)]">One Size (Free)</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((size) => {
                        const isActive = formData.sizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={cn(
                              "kc-pill border border-[var(--kc-border)] bg-[var(--kc-card)] text-sm font-medium transition",
                              isActive && "border-[var(--kc-ink)] bg-[rgba(27,27,27,0.08)] text-[var(--kc-ink)]"
                            )}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {formData.colorVariants.length > 0 && (formData.category === "cap" || formData.sizes.length > 0) ? (
                <div className="overflow-hidden rounded-[var(--kc-radius)] border border-[var(--kc-border)]">
                  <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(80px,1fr))] bg-[var(--kc-card)] text-xs font-semibold uppercase tracking-[0.28em] text-[var(--kc-ink-2)]">
                    <div className="border-r border-[var(--kc-border)] px-4 py-3">Colour / Size</div>
                    {(formData.category === "cap" ? ["Free"] : formData.sizes).map((size) => (
                      <div key={size} className="border-r border-[var(--kc-border)] px-4 py-3">
                        {size}
                      </div>
                    ))}
                  </div>
                  {formData.colorVariants.map((color) => (
                    <div
                      key={color}
                      className="grid grid-cols-[160px_repeat(auto-fit,minmax(80px,1fr))] border-t border-[var(--kc-border)] text-sm"
                    >
                      <div className="border-r border-[var(--kc-border)] bg-[var(--kc-card)] px-4 py-3 font-medium text-[var(--kc-ink)]">
                        {color}
                      </div>
                      {(formData.category === "cap" ? ["Free"] : formData.sizes).map((size) => (
                        <div key={`${color}-${size}`} className="border-r border-[var(--kc-border)] px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            value={inventory[color]?.[size] ?? 0}
                            onChange={(e) => {
                              const value = Math.max(0, Number(e.target.value || 0));
                              setInventory((prev) => ({
                                ...prev,
                                [color]: { ...(prev[color] || {}), [size]: value },
                              }));
                            }}
                            className="kc-input h-10"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="space-y-6">
              <header>
                <h2 className="text-lg font-semibold text-[var(--kc-ink)]">Material & Fit</h2>
                <p className="text-sm text-[var(--kc-ink-2)]">Share tactile details that help set expectations.</p>
              </header>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Material *</label>
                  <select name="material" value={formData.material} onChange={handleFieldChange} className="kc-input">
                    <option value="Cotton">Cotton</option>
                    <option value="Fleece">Fleece</option>
                    <option value="Polyester">Polyester</option>
                    <option value="Denim">Denim</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                {formData.category !== "cap" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--kc-ink)]">Fit Type *</label>
                    <select name="fitType" value={formData.fitType} onChange={handleFieldChange} className="kc-input">
                      <option value="Oversized">Oversized</option>
                      <option value="Regular">Regular</option>
                      <option value="Slim">Slim</option>
                    </select>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--kc-ink)]">Size Chart (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "sizeChart")} />
                {formData.sizeChart ? (
                  <img
                    src={formData.sizeChart}
                    alt="Size chart"
                    className="mt-3 max-h-40 rounded-[var(--kc-radius)] border border-[var(--kc-border)] object-contain"
                  />
                ) : null}
              </div>
            </section>

            <section className="space-y-6">
              <header>
                <h2 className="text-lg font-semibold text-[var(--kc-ink)]">Pricing & Shipping</h2>
                <p className="text-sm text-[var(--kc-ink-2)]">
                  Transparent pricing builds trust. We auto-calc discount pricing where needed.
                </p>
              </header>
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Base Price (₹) *</label>
                  <KCInput
                    type="number"
                    min="0"
                    step="0.01"
                    name="priceBase"
                    value={formData.priceBase}
                    onChange={handleFieldChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Discount (%)</label>
                  <KCInput
                    type="number"
                    min="0"
                    max="90"
                    name="priceDiscount"
                    value={formData.priceDiscount}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Final Price</label>
                  <div className="kc-input bg-[var(--kc-card)] text-[var(--kc-ink)]">₹{finalPrice || 0}</div>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Shipping</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, shippingIsFree: true }))}
                      className={cn(
                        "kc-pill border border-[var(--kc-border)] bg-[var(--kc-card)] text-sm font-medium",
                        formData.shippingIsFree && "border-[var(--kc-gold-1)] bg-[rgba(211,167,95,0.14)] text-[var(--kc-gold-2)]"
                      )}
                    >
                      Free shipping
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, shippingIsFree: false }))}
                      className={cn(
                        "kc-pill border border-[var(--kc-border)] bg-[var(--kc-card)] text-sm font-medium",
                        !formData.shippingIsFree && "border-[var(--kc-ink)] bg-[rgba(27,27,27,0.08)] text-[var(--kc-ink)]"
                      )}
                    >
                      Flat rate
                    </button>
                    {!formData.shippingIsFree ? (
                      <KCInput
                        type="number"
                        min="0"
                        placeholder="₹"
                        value={formData.shippingFlatRate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, shippingFlatRate: e.target.value }))}
                        className="w-28"
                      />
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Dispatch Days (1–10) *</label>
                  <KCInput
                    type="number"
                    min="1"
                    max="10"
                    value={formData.shippingDispatchDays}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shippingDispatchDays: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <header>
                <h2 className="text-lg font-semibold text-[var(--kc-ink)]">Designer & Compliance</h2>
                <p className="text-sm text-[var(--kc-ink-2)]">
                  Confirm the essentials so we can protect your work and our community.
                </p>
              </header>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Designer Name</label>
                  <div className="kc-input bg-[var(--kc-card)] text-[var(--kc-ink)]">{user?.name || "—"}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Designer ID</label>
                  <div className="kc-input bg-[var(--kc-card)] text-[var(--kc-ink)]">{user?.id || user?._id || "—"}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--kc-ink)]">Royalty Percent (0–50)</label>
                  <KCInput
                    type="number"
                    min="0"
                    max="50"
                    value={formData.royaltyPercent}
                    onChange={(e) => setFormData((prev) => ({ ...prev, royaltyPercent: e.target.value }))}
                  />
                  <p className="text-xs text-[var(--kc-ink-2)]">Optional. Default contracts allocate platform royalty automatically.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-start gap-3 text-sm text-[var(--kc-ink)]">
                    <input
                      type="checkbox"
                      checked={formData.rightsConfirmed}
                      onChange={(e) => setFormData((prev) => ({ ...prev, rightsConfirmed: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-[var(--kc-border)] text-[var(--kc-ink)] focus:ring-[var(--kc-gold-1)]"
                    />
                    I confirm this design is original and I hold commercial rights to license, sell, and distribute it.
                  </label>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 md:flex-row md:justify-end">
              <KCButton
                type="button"
                variant="secondary"
                className="px-6"
                disabled={submitting || uploading}
                onClick={() => submitProduct("draft")}
                icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                Save Draft
              </KCButton>
              <KCButton
                type="button"
                className="px-8"
                disabled={submitting || uploading}
                onClick={() => submitProduct("pending_review")}
                icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                Submit for Review
              </KCButton>
            </div>
          </form>
        </KCCard>
      </div>
    </div>
  );
}


