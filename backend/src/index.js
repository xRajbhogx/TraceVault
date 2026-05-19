const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { supabase } = require('./db');
const { generatePDF } = require('./pdf');
const { uploadToS3, getFromS3 } = require('./s3');
const { generateHash, verifyHash } = require('./hash');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // screenshots bade hote hain

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ✅ Evidence capture — extension aur app dono yahi call karenge
app.post('/evidence/capture', async (req, res) => {
  try {
    const {
      captured_at,
      platform_url,
      sender_id,
      screenshot_base64,
      page_content,
      sha256_hash,
      device,
      user_id,
    } = req.body;

    // Evidence ID generate karo
    const evidenceId = `EV-${Date.now()}`;

    // S3 pe screenshot upload karo
    const imageUrl = await uploadToS3(screenshot_base64, evidenceId, user_id);

    // Hash verify karo
    const hashValid = verifyHash(screenshot_base64, sha256_hash);

    // Response bhejo
    res.json({
      success: true,
      evidence_id: evidenceId,
      image_url: imageUrl,
      hash_valid: hashValid,
      message: 'Evidence captured successfully',
    });

  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Hash verify karo
app.post('/verify/hash', async (req, res) => {
  try {
    const { screenshot_base64, client_hash } = req.body;
    const isValid = verifyHash(screenshot_base64, client_hash);

    res.json({
      valid: isValid,
      message: isValid ? 'Evidence is untampered ✅' : 'Evidence has been tampered ❌',
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Server start karo
const PORT = process.env.PORT || 3000;
// ✅ PDF generate aur download karo
app.get('/report/:evidenceId', async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const { user_id, platform_url, sender_id, captured_at, sha256_hash, device, hash_valid } = req.query;

    const evidenceData = {
      evidence_id: evidenceId,
      user_id,
      platform_url,
      sender_id,
      captured_at,
      sha256_hash,
      device,
      hash_valid: hash_valid === 'true',
    };

    const pdfBuffer = await generatePDF(evidenceData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TraceVault-${evidenceId}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// ✅ Evidence save karna database mein
app.post('/evidence/capture', async (req, res) => {
  try {
    const {
      captured_at,
      platform_url,
      platform_name,
      sender_id,
      screenshot_base64,
      page_content,
      page_title,
      sha256_hash,
      device,
      user_id,
      notes,
    } = req.body;

    const evidenceId = `EV-${Date.now()}`;

    // S3 pe screenshot upload karo
    const imageUrl = await uploadToS3(screenshot_base64, evidenceId, user_id);
    const s3Key = `evidence/${user_id}/${evidenceId}.png`;

    // Hash verify karo
    const hashValid = verifyHash(screenshot_base64, sha256_hash);

    // Supabase mein save karo
    const { data, error } = await supabase
      .from('evidence')
      .insert([{
        id: evidenceId,
        user_id,
        image_url: imageUrl,
        s3_image_key: s3Key,
        platform_url,
        platform_name,
        sender_id,
        page_content,
        page_title,
        sha256_hash,
        hash_valid: hashValid,
        integrity_flag: hashValid ? 'clean' : 'modified',
        device,
        notes,
        captured_at,
      }]);

    if (error) throw error;

    res.json({
      success: true,
      evidence_id: evidenceId,
      image_url: imageUrl,
      hash_valid: hashValid,
      message: 'Evidence captured successfully',
    });

  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ User ki saari evidence fetch karo
app.get('/evidence/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, evidence: data });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Single evidence fetch karo
app.get('/evidence/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, evidence: data });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Evidence delete karo
app.delete('/evidence/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('evidence')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Evidence deleted' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.listen(PORT, () => {
  console.log(`TraceVault backend running on port ${PORT}`);
});