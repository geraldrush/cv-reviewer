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
  process.env.OPENAI_API_KEY ? 'Present' : 'Missing (Premium features disabled)'
);

// Initialize CVAnalyzer - safe even without API key (free tier uses basic analysis)
let cvAnalyzer;
try {
  cvAnalyzer = new CVAnalyzer(process.env.OPENAI_API_KEY || '');
} catch (error) {
  console.warn('CVAnalyzer initialization warning:', error.message);
  // Will still work for basic analysis
}

let enhancedIntelligence;
try {
  enhancedIntelligence = new EnhancedCVIntelligence(process.env.OPENAI_API_KEY || '');
} catch (error) {
  console.warn('EnhancedCVIntelligence initialization warning:', error.message);
}

const pdfGenerator = new PDFGenerator();
const userTierService = new UserTierService();

// Auth and payment services are optional
let authService;
try {
  authService = new AuthService();
} catch (error) {
  console.warn('AuthService not available:', error.message);
}

let payFastService;
try {
  payFastService = new PayFastService();
} catch (error) {
  console.warn('PayFastService not available:', error.message);
}

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  session({
    name: 'cv-reviewer-session',
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
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
    if (!authService) {
      return res.status(503).json({ error: 'Authentication service not available', requiresEnv: 'GOOGLE_CLIENT_SECRET' });
    }
    
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

  if (!authService) {
    return res.status(503).json({ error: 'Authentication service not available' });
  }

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

  if (!payFastService || !authService) {
    return res.status(503).json({ error: 'Payment service not available', requiresEnv: 'PAYFAST_MERCHANT_ID' });
  }

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
    let analysis;

    if (userTierService.canUseAI(tier)) {
      // Premium: Full analysis with all metrics
      analysis = await cvAnalyzer.analyzeCV(cvText, jobDescription);
      analysis.userTier = 'premium';
    } else {
      // Free: Basic analysis first
      analysis = await cvAnalyzer.analyzeCV(cvText, jobDescription);
      // Then enhance it with friendly summary for free tier
      analysis = userTierService.getEnhancedFreeTierAnalysis(analysis);
      analysis.userTier = 'free';
    }

    analysis.id = uuidv4();

    res.json({ success: true, analysis, extractedCvText: cvText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Analysis failed', message: error.message });
  }
});

/* =========================
   CV REWRITING
========================= */

app.post('/api/rewrite-cv', upload.single('cv'), async (req, res) => {
  try {
    console.log('🔄 Rewrite CV endpoint called');
    
    const { jobDescription, targetRole, companyName } = req.body;
    if (!req.file || !jobDescription) return res.status(400).json({ error: 'CV file and job description required' });

    console.log('📄 Extracting CV text...');
    const cvText = await extractCvText(req.file);
    if (!cvText || cvText.length < 50) return res.status(400).json({ error: 'CV text extraction failed' });

    // Try to rewrite, but provide fallback
    let rewritten = cvText;
    let improvements = { improvements: [] };

    try {
      if (cvAnalyzer && cvAnalyzer.analyzeCV) {
        console.log('🔍 Analyzing CV...');
        const analysis = await cvAnalyzer.analyzeCV(cvText, jobDescription, targetRole || 'Professional');
        
        if (cvAnalyzer.cvRewriter && cvAnalyzer.cvRewriter.rewriteEntireCV) {
          console.log('✏️ Rewriting CV...');
          rewritten = await cvAnalyzer.cvRewriter.rewriteEntireCV(cvText, jobDescription, analysis);
        }
        
        if (cvAnalyzer.intelligenceLayer && analysis.intelligenceAnalysis?.bullets?.bulletAnalysis) {
          console.log('💡 Generating improvements...');
          improvements = await cvAnalyzer.intelligenceLayer.generateBulletRecommendations(analysis.intelligenceAnalysis.bullets.bulletAnalysis);
        }
      } else {
        console.warn('⚠️ CVAnalyzer or methods not fully available, returning original CV');
      }
    } catch (analyzeError) {
      console.error('⚠️ Analysis error:', analyzeError.message);
      console.error('⚠️ Full error:', analyzeError);
      console.error('⚠️ Stack:', analyzeError.stack);
      // Return the detailed error instead of swallowing it
      return res.status(500).json({ 
        error: 'Rewrite failed',
        message: analyzeError.message,
        details: analyzeError.toString(),
        stack: analyzeError.stack
      });
    }

    console.log('✅ Rewrite complete');
    res.json({ success: true, rewritten, improvements });
  } catch (error) {
    console.error('❌ Rewrite error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Rewrite failed', 
      message: error.message,
      details: error.toString()
    });
  }
});

/* =========================
   IMPROVEMENTS
========================= */

app.post('/api/apply-improvements', async (req, res) => {
  try {
    const { originalCV, improvements, jobDescription } = req.body;
    if (!originalCV || !improvements) return res.status(400).json({ error: 'CV text and improvements required' });

    const improvedCV = await cvAnalyzer.cvRewriter.applyUserImprovements(originalCV, improvements, jobDescription);

    res.json({ success: true, improvedCV });
  } catch (error) {
    console.error('Improvement error:', error);
    res.status(500).json({ error: 'Failed to apply improvements', message: error.message });
  }
});

/* =========================
   PDF GENERATION
========================= */

app.post('/api/download-cv', async (req, res) => {
  try {
    const { cvText, format, structured } = req.body;
    if (!cvText || !format) return res.status(400).json({ error: 'CV text and format required' });

    let buffer;
    if (format === 'pdf') {
      const pdfResult = pdfGenerator.generateATSOptimizedPDF(cvText);
      // pdfResult is already a Uint8Array or Buffer from the PDF generator
      buffer = Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="cv.pdf"');
    } else if (format === 'txt') {
      buffer = Buffer.from(cvText);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="cv.txt"');
    } else {
      return res.status(400).json({ error: 'Unsupported format' });
    }

    res.send(buffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'PDF generation failed', message: error.message });
  }
});

/* =========================
   CV BUILDER
========================= */

app.get('/api/cv-questions', (req, res) => {
  try {
    const questions = [
      { id: 'fullName', section: 'Personal', label: 'Full Name', type: 'text' },
      { id: 'email', section: 'Personal', label: 'Email', type: 'email' },
      { id: 'phone', section: 'Personal', label: 'Phone', type: 'tel' },
      { id: 'location', section: 'Personal', label: 'Location', type: 'text' },
      { id: 'linkedIn', section: 'Personal', label: 'LinkedIn Profile', type: 'url' },
      { id: 'targetRole', section: 'Professional', label: 'Target Role', type: 'text' },
      { id: 'keySkills', section: 'Professional', label: 'Key Skills (comma-separated)', type: 'textarea' },
      { id: 'experience', section: 'Professional', label: 'Years of Experience', type: 'number' },
      { id: 'companies', section: 'Experience', label: 'Previous Companies', type: 'textarea' },
      { id: 'accomplishments', section: 'Experience', label: 'Key Accomplishments', type: 'textarea' }
    ];
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions', message: error.message });
  }
});

app.post('/api/build-cv', async (req, res) => {
  try {
    const { fullName, email, phone, location, linkedIn, targetRole, keySkills, experience, companies, accomplishments } = req.body;
    
    if (!fullName || !email || !targetRole) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cvText = await cvAnalyzer.cvBuilder.generateCV({
      fullName,
      email,
      phone,
      location,
      linkedIn,
      targetRole,
      keySkills: keySkills ? keySkills.split(',') : [],
      experience,
      companies,
      accomplishments
    });

    const structured = {
      fullName,
      email,
      phone,
      location,
      linkedIn,
      targetRole,
      keySkills: keySkills ? keySkills.split(',') : [],
      experience
    };

    res.json({ success: true, cvText, structured });
  } catch (error) {
    console.error('CV build error:', error);
    res.status(500).json({ error: 'CV build failed', message: error.message });
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
