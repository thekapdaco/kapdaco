// controllers/designerApp.controller.js
import DesignerApplication from "../models/DesignerApplication.js";
import User from "../models/User.js";
import { sendDesignerApplicationNotification } from "../services/email.service.js";

// Submit designer application
export const submitApplication = async (req, res) => {
  try {
    const {
      fullName, lastName, name, email, bio, longBio, portfolioUrl, instagram, instagramHandle,
      behance, dribbble, website, specialties, styleTags, experience, 
      designStyle, profileImage, bannerImage, portfolioLinks, metadata
    } = req.body;

    // Check if user already has an application
    const existing = await DesignerApplication.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "Application already submitted" });
    }

    // Extract all fields from metadata
    const {
      country, city, phone, inspiration, businessType, panNumber,
      accountNumber, ifscCode, portfolioFiles = []
    } = metadata || {};

    // Create application with all collected data
    const appDoc = await DesignerApplication.create({
      userId: req.user.id,
      fullName: fullName || req.user.name.split(' ')[0] || '',
      lastName: lastName || req.user.name.split(' ').slice(1).join(' ') || '',
      email: email || req.user.email,
      phone,
      country,
      city,
      designerName: name,
      bio,
      longBio: longBio || undefined,
      experience,
      designStyle,
      specialties: specialties || [],
      styleTags: styleTags || [],
      inspiration,
      instagram: instagram || undefined,
      instagramHandle: instagramHandle || undefined,
      behance: behance || undefined,
      dribbble: dribbble || undefined,
      website: website || portfolioUrl || undefined,
      portfolioUrl: portfolioUrl || website || undefined,
      portfolioFiles,
      portfolioLinks: portfolioLinks || undefined,
      profileImage: profileImage || undefined,
      bannerImage: bannerImage || undefined,
      businessType,
      panNumber,
      accountNumber,
      ifscCode,
      agreeToTerms: true, // Required from frontend
      agreeToCommission: true,
      ageConfirmation: true,
      status: "pending"
    });

    // Send application confirmation email (fire and forget)
    try {
      const user = await User.findById(req.user.id).select('name email');
      if (user && user.email) {
        sendDesignerApplicationNotification(appDoc, user).catch(err => {
          console.error('Failed to send application notification email:', err.message);
        });
      }
    } catch (emailError) {
      console.error('Error sending application notification email:', emailError.message);
      // Don't fail application submission if email fails
    }

    res.status(201).json({
      message: "Application submitted successfully",
      application: appDoc
    });
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({ message: "Failed to submit application" });
  }
};

// Get user's application status
export const myApplication = async (req, res) => {
  try {
    const doc = await DesignerApplication.findOne({ userId: req.user.id });
    res.json(doc || null);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch application" });
  }
};

// Admin: Get all applications
export const getAllApplications = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status !== 'all') {
      filter.status = status;
    }

    const applications = await DesignerApplication
      .find(filter)
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DesignerApplication.countDocuments(filter);

    res.json({
      applications,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + applications.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

// Admin: Approve application
export const approveApplication = async (req, res) => {
  try {
    const { userId, adminNotes = '' } = req.body;
    
    const application = await DesignerApplication.findOne({ userId });
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status === 'approved') {
      return res.status(400).json({ message: "Application already approved" });
    }

    // Update application status
    application.status = 'approved';
    application.adminNotes = adminNotes;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    await application.save();

    // Update user role and copy designer data
    await User.findByIdAndUpdate(userId, {
      role: 'designer',
      username: application.designerName.toLowerCase().replace(/\s+/g, ''),
      bio: application.bio,
      designerName: application.designerName,
      portfolioUrl: application.website || application.behance || application.dribbble,
      instagram: application.instagram,
      behance: application.behance,
      dribbble: application.dribbble,
      website: application.website,
      phone: application.phone,
      country: application.country,
      city: application.city
    });

    res.json({
      message: "Application approved successfully",
      application
    });
  } catch (error) {
    console.error("Approve application error:", error);
    res.status(500).json({ message: "Failed to approve application" });
  }
};

// Admin: Reject application
export const rejectApplication = async (req, res) => {
  try {
    const { userId, adminNotes = '' } = req.body;
    
    const application = await DesignerApplication.findOne({ userId });
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = 'rejected';
    application.adminNotes = adminNotes;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    await application.save();

    res.json({
      message: "Application rejected",
      application
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject application" });
  }
};