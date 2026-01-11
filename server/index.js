const express = require('express');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const PDFGenerator = require('./services/PDFGenerator');
const UserTierService = require('./services/UserTierService');
const AuthService = require('./services/AuthService');
const PayFastService = require('./services/PayFastService');
const CVAnalyzer = require('./services/CVAnalyzer');
const EnhancedCVIntelligence = require('./services/EnhancedCVIntelligence');

const app = express();

/* =========================
   INITIALIZE SERVICES
========================= */

console.log(
  'Initializing CV Analyzer with OpenAI API key:',
  process.env.OPENAI_API_KEY ? 'Present' : 'Missing'
);

const cvAnalyzer = new CVAnalyzer(process.env.OPENAI_API_KEY);
const enhancedIntelligence = new EnhancedCVIntelligence(process.env.OPENAI_API_KEY);
const pdfGenerator = new PDFGenerator();
const userTierService = new UserTierService();
const authService = new AuthService();
const payFastService = new PayFastService();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  session({
    name: 'cv-reviewer-session',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // REQUIRED for Vercel
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

/* =========================
   FILE UPLOAD CONFIG
========================= */

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, and TXT files are allowed'), false);
  }
});

/* =========================
   TEXT EXTRACTION HELPERS
========================= */

function cleanText(text) {
  return text
    .replace(/\x00/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractPDFText(buffer) {
  try {
    const data = await pdfParse(buffer);
    if (data.text && data.text.length > 50) return cleanText(data.text);
  } catch (_) {}

  try {
    const data = await pdfParse(buffer, { disableCombineTextItems: true });
    if (data.text && data.text.length > 20) return cleanText(data.text);
  } catch (_) {}

  return '';
}

async function extractCvText(file) {
  if (!file) throw new Error('No file uploaded');

  switch (file.mimetype) {
    case 'application/pdf':
      return await extractPDFText(file.buffer);

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return cleanText(result.value);
    }

    case 'text/plain':
      return cleanText(file.buffer.toString('utf-8'));

    default:
      throw new Error(`Unsupported file type: ${file.mimetype}`);
  }
}

/* =========================
   HEALTH CHECK
========================= */

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/* =========================
   AUTH ROUTES
========================= */

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Google token required' });

    const user = await authService.verifyGoogleToken(token);
    req.session.userId = user.id;

    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', message: error.message });
  }
});

app.get('/api/auth/user', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const user = authService.getUser(req.session.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ success: true, user });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

/* =========================
   PAYMENTS
========================= */

app.post('/api/payment/create', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Authentication required' });

  const user = authService.getUser(req.session.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    success: true,
    paymentUrl: payFastService.getPaymentUrl(),
    paymentData: payFastService.generatePaymentData(user.id, user.email)
  });
});

/* =========================
   CV ANALYSIS
========================= */

app.post('/api/analyze-cv', upload.single('cv'), async (req, res) => {
  try {
    const { jobDescription, userTier } = req.body;
    if (!req.file || !jobDescription)
      return res.status(400).json({ error: 'CV file and job description required' });

    const cvText = await extractCvText(req.file);
    if (!cvText || cvText.length < 50)
      return res.status(400).json({ error: 'CV text extraction failed' });

    const tier = userTierService.getUserTier(userTier);
    const analysis = userTierService.canUseAI(tier)
      ? await cvAnalyzer.analyzeCV(cvText, jobDescription)
      : userTierService.getBasicAnalysis(cvText, jobDescription);

    analysis.id = uuidv4();
    analysis.userTier = tier;

    res.json({ success: true, analysis });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Analysis failed', message: error.message });
  }
});

/* =========================
   ERROR HANDLER
========================= */

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (max 5MB)' });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error', message: error.message });
});

/* =========================
   EXPORT (NO listen!)
========================= */

module.exports = app;
