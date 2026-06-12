const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

let isMock = false;

if (!cloudName || !apiKey || !apiSecret || cloudName.includes('mock') || apiKey.includes('mock') || apiSecret.includes('mock')) {
  console.log('Cloudinary configuration missing or set to mock. Running Cloudinary in Mock Mode.');
  isMock = true;
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
}

const uploadImage = async (filePath) => {
  if (isMock) {
    // Return a beautiful cosmetic placeholder image from Unsplash
    return {
      secure_url: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600&auto=format&fit=crop',
      public_id: `mock_upload_${Date.now()}`
    };
  }
  
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'lumora_beauty',
      resource_type: 'image'
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error, falling back to mock:', error.message);
    return {
      secure_url: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600&auto=format&fit=crop',
      public_id: `mock_upload_fallback_${Date.now()}`
    };
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  isMock
};
