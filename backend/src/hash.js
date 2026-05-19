const crypto = require('crypto');

// Screenshot ka SHA-256 hash banana
const generateHash = (base64Image) => {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  return hash;
};

// Client ka bheja hash aur server pe bana hash compare karna
const verifyHash = (base64Image, clientHash) => {
  const serverHash = generateHash(base64Image);
  return serverHash === clientHash;
};

module.exports = { generateHash, verifyHash };