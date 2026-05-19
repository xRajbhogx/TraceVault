const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { generatePDF } = require('./pdf');
const { uploadToS3, getFromS3, deleteFromS3 } = require('./s3');
const { generateHash, verifyHash } = require('./hash');
const { supabase } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // screenshots bade hote hain

const EVIDENCE_TABLE = process.env.SUPABASE_EVIDENCE_TABLE || 'evidence';

const isMissingColumnError = (error) => {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST204' ||
    message.includes('schema cache') ||
    message.includes('column') ||
    message.includes('does not exist')
  );
};

const extractMissingColumn = (error) => {
  if (!error || !error.message) return null;
  const match = error.message.match(/'([^']+)' column|column "([^"]+)"/i);
  return match ? match[1] || match[2] : null;
};

const insertWithPrune = async (record, protectedColumns) => {
  let current = { ...record };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase
      .from(EVIDENCE_TABLE)
      .insert([current]);

    if (!error) return { error: null, record: current };
    if (!isMissingColumnError(error)) return { error, record: current };

    const missingColumn = extractMissingColumn(error);
    if (!missingColumn || protectedColumns.includes(missingColumn)) {
      return { error, record: current };
    }

    if (!(missingColumn in current)) {
      return { error, record: current };
    }

    const { [missingColumn]: _removed, ...rest } = current;
    current = rest;
  }

  return { error: new Error('Insert failed after retries'), record: current };
};

const insertEvidenceRecord = async (primaryRecord, fallbackRecord) => {
  const primaryResult = await insertWithPrune(primaryRecord, [
    'evidence_id',
    'user_id',
  ]);

  if (!primaryResult.error) return null;

  if (isMissingColumnError(primaryResult.error) && fallbackRecord) {
    const fallbackResult = await insertWithPrune(fallbackRecord, ['id', 'user_id']);
    return fallbackResult.error || null;
  }

  return primaryResult.error;
};

const fetchEvidenceById = async (evidenceId) => {
  let result = await supabase
    .from(EVIDENCE_TABLE)
    .select('*')
    .eq('evidence_id', evidenceId)
    .maybeSingle();

  if (result.error && isMissingColumnError(result.error)) {
    return {
      ...(await supabase
        .from(EVIDENCE_TABLE)
        .select('*')
        .eq('id', evidenceId)
        .maybeSingle()),
      idColumn: 'id',
    };
  }

  if (!result.data) {
    const fallback = await supabase
      .from(EVIDENCE_TABLE)
      .select('*')
      .eq('id', evidenceId)
      .maybeSingle();

    if (!fallback.error || !isMissingColumnError(fallback.error)) {
      return { ...fallback, idColumn: 'id' };
    }
  }

  return { ...result, idColumn: 'evidence_id' };
};

const fetchEvidenceForUser = async (userId) => {
  let result = await supabase
    .from(EVIDENCE_TABLE)
    .select('*')
    .eq('user_id', userId);

  if (result.error && isMissingColumnError(result.error)) {
    result = await supabase
      .from(EVIDENCE_TABLE)
      .select('*')
      .eq('userId', userId);
  }

  return result;
};

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
      platform,
      platform_name,
      sender_id,
      screenshot_base64,
      page_content,
      page_title,
      sha256_hash,
      device,
      user_id,
      userId,
      additional_context,
      notes,
      integrity_flag,
      exif_data,
    } = req.body;

    const effectiveUserId = user_id || userId;
    if (!screenshot_base64 || !effectiveUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: screenshot_base64 or user_id',
      });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Supabase is not configured',
      });
    }

    // Evidence ID generate karo
    const evidenceId = `EV-${Date.now()}`;

    // S3 pe screenshot upload karo
    const imageUrl = await uploadToS3(
      screenshot_base64,
      evidenceId,
      effectiveUserId
    );

    // Hash verify karo
    const hashValid = verifyHash(screenshot_base64, sha256_hash);
    const capturedAt = captured_at || new Date().toISOString();
    const integrityFlag = integrity_flag || (hashValid ? 'clean' : 'modified');
    const resolvedPlatform = platform || platform_name;
    const resolvedNotes = additional_context || notes;
    const s3Key = `evidence/${effectiveUserId}/${evidenceId}.png`;

    const primaryRecord = {
      evidence_id: evidenceId,
      user_id: effectiveUserId,
      platform: resolvedPlatform,
      platform_url,
      sender_id,
      page_content,
      sha256_hash,
      device,
      captured_at: capturedAt,
      image_url: imageUrl,
      additional_context: resolvedNotes,
      integrity_flag: integrityFlag,
      exif_data,
    };

    const fallbackRecord = {
      id: evidenceId,
      user_id: effectiveUserId,
      image_url: imageUrl,
      s3_image_key: s3Key,
      platform_url,
      platform_name: resolvedPlatform,
      sender_id,
      page_content,
      page_title: page_title || resolvedPlatform,
      sha256_hash,
      hash_valid: hashValid,
      integrity_flag: integrityFlag,
      device,
      notes: resolvedNotes,
      captured_at: capturedAt,
    };

    const insertError = await insertEvidenceRecord(primaryRecord, fallbackRecord);
    if (insertError) {
      try {
        await deleteFromS3(effectiveUserId, evidenceId);
      } catch (cleanupError) {
        console.error('S3 cleanup error:', cleanupError);
      }

      throw insertError;
    }

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

// ✅ User ke saare evidence fetch karo
app.get('/evidence/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data, error } = await fetchEvidenceForUser(userId);

    if (error) {
      throw error;
    }

    const records = Array.isArray(data) ? data : [];
    records.sort((a, b) => {
      const aTime = new Date(a.captured_at || a.created_at || 0).getTime();
      const bTime = new Date(b.captured_at || b.created_at || 0).getTime();
      return bTime - aTime;
    });

    res.json({ success: true, evidence: records });
  } catch (error) {
    console.error('Fetch user evidence error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Single evidence fetch karo
app.get('/evidence/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await fetchEvidenceById(id);

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    res.json({ success: true, evidence: data });
  } catch (error) {
    console.error('Fetch evidence error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Evidence delete karo
app.delete('/evidence/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error, idColumn } = await fetchEvidenceById(id);

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    const recordUserId = data.user_id || data.userId;
    const recordId = data.evidence_id || data.id || id;

    if (recordUserId) {
      try {
        await deleteFromS3(recordUserId, recordId);
      } catch (s3Error) {
        console.error('S3 delete error:', s3Error);
      }
    }

    const deleteColumn = idColumn || (data.evidence_id ? 'evidence_id' : 'id');
    const { error: deleteError } = await supabase
      .from(EVIDENCE_TABLE)
      .delete()
      .eq(deleteColumn, id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ success: true, message: 'Evidence deleted' });
  } catch (error) {
    console.error('Delete evidence error:', error);
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
app.listen(PORT, () => {
  console.log(`TraceVault backend running on port ${PORT}`);
});