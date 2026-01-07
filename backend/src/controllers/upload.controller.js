import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function bufferToDataURI(file) {
  const b64 = file.buffer.toString("base64");
  const mime = file.mimetype || "application/octet-stream";
  return `data:${mime};base64,${b64}`;
}

export const uploadPortfolio = async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: "No files" });
  try {
    const uploads = await Promise.all(
      req.files.map(async (f) => {
        const result = await cloudinary.uploader.upload(bufferToDataURI(f), {
          folder: `kapdaco/portfolios/${req.user.id}`,
          resource_type: "auto",
        });
        return { url: result.secure_url, public_id: result.public_id, bytes: result.bytes, format: result.format };
      })
    );
    res.status(201).json({ files: uploads });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Upload failed" });
  }
};
