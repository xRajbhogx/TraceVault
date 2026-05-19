const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Screenshot ko S3 pe upload karna
const uploadToS3 = async (base64Image, evidenceId, userId) => {
  // base64 string se actual image data nikalna
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `evidence/${userId}/${evidenceId}.png`,
    Body: buffer,
    ContentType: 'image/png',
  };

  const result = await s3.upload(params).promise();
  return result.Location; // uploaded image ka URL return karega
};

// S3 se image fetch karna (PDF generation ke liye)
const getFromS3 = async (userId, evidenceId) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `evidence/${userId}/${evidenceId}.png`,
  };

  const result = await s3.getObject(params).promise();
  return result.Body; // image buffer return karega
};

module.exports = { uploadToS3, getFromS3 };