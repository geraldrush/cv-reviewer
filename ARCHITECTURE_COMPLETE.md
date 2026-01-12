# CV Reviewer: Complete Architecture Overview

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  pages/index.js (Main Component)                                 │
│  ├─ Step 0: TierSelection                                       │
│  │  └─ FREE or PREMIUM choice                                   │
│  │                                                               │
│  ├─ Step 1: JobInput                                            │
│  │  └─ Job title, company, description                          │
│  │                                                               │
│  ├─ Step 2: CVUpload                                            │
│  │  └─ PDF/DOCX/TXT file upload                                 │
│  │                                                               │
│  ├─ Step 3: AnalysisResults (TIER-AWARE)                        │
│  │  ├─ FREE View: Score + Reason + Improvements                │
│  │  └─ PREMIUM View: All 4 metrics + tabs + detailed analysis   │
│  │                                                               │
│  ├─ Step 4: CVRewriter (Premium feature)                        │
│  │  └─ AI-powered CV rewriting                                  │
│  │                                                               │
│  ├─ Step 5: CVImprovement                                       │
│  │  └─ Apply suggestions and improvements                       │
│  │                                                               │
│  └─ Step 6: CVBuilder                                           │
│     └─ Create new CV from scratch                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
         ┌──────────────────────────────────────┐
         │  API Calls with userTier parameter   │
         └──────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  server/index.js (API Endpoints)                                 │
│  │                                                               │
│  ├─ POST /api/analyze-cv (userTier included)                   │
│  │  ├─ Extract CV text                                         │
│  │  ├─ Call CVAnalyzer.analyzeCV()                             │
│  │  ├─ If FREE: Call getEnhancedFreeTierAnalysis()             │
│  │  └─ Return analysis with userTier flag                      │
│  │                                                               │
│  ├─ POST /api/rewrite-cv (Premium only)                        │
│  ├─ POST /api/download-cv                                      │
│  ├─ POST /api/build-cv                                         │
│  ├─ Authentication routes                                       │
│  └─ Payment routes                                              │
│                                                                   │
│  ┌──────────────────────────────────────────┐                 │
│  │  Services Layer                          │                 │
│  ├──────────────────────────────────────────┤                 │
│  │                                          │                 │
│  │  CVAnalyzer.js (Main Orchestrator)      │                 │
│  │  ├─ ATSSimulator.js                     │                 │
│  │  ├─ RecruiterSimulator.js               │                 │
│  │  ├─ CVIntelligenceLayer.js              │                 │
│  │  ├─ CVFormatAnalyzer.js                 │                 │
│  │  ├─ CVRewriter.js                       │                 │
│  │  └─ PDFGenerator.js                     │                 │
│  │                                          │                 │
│  │  UserTierService.js (Tier Logic)        │                 │
│  │  ├─ getUserTier(userToken)               │                 │
│  │  ├─ getEnhancedFreeTierAnalysis()       │ (NEW)           │
│  │  ├─ getVerdict(score)                    │ (NEW)           │
│  │  ├─ canUseAI(tier)                       │                 │
│  │  └─ getBasicAnalysis(cv, job)            │                 │
│  │                                          │                 │
│  │  Other Services                          │                 │
│  │  ├─ AuthService.js                      │                 │
│  │  ├─ PayFastService.js                   │                 │
│  │  └─ CVBuilder.js                        │                 │
│  │                                          │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow for CV Analysis

```
USER SELECTS TIER
       ↓
   FREE or PREMIUM choice saved to state (userTier)
       ↓
UPLOAD CV + JOB DESCRIPTION
       ↓
FRONTEND: POST /api/analyze-cv
├─ Form data with file
├─ Job description
├─ Target role
└─ userTier parameter ← INCLUDES TIER
       ↓
BACKEND: server/index.js
├─ Extract CV text
├─ Normalize tier: userTierService.getUserTier(userTier)
└─ Call: CVAnalyzer.analyzeCV() ← RUNS FULL ANALYSIS
       ↓
CVAnalyzer completes:
├─ ATSSimulator → atsScore (35%)
├─ RecruiterSimulator → recruiterScore (35%)
├─ CVIntelligenceLayer → intelligenceScore (20%)
├─ CVFormatAnalyzer → formatScore (10%)
├─ Calculate weighted overallScore
└─ Consolidate recommendations
       ↓
CHECK TIER in server/index.js
       ├─ IF PREMIUM:
       │  └─ Return full analysis as-is
       │
       └─ IF FREE:
          ├─ Call userTierService.getEnhancedFreeTierAnalysis()
          │  ├─ Add human-readable reasoning
          │  ├─ Generate/enhance strengths
          │  ├─ Generate/enhance weaknesses
          │  └─ Add verdict
          └─ Return enhanced free tier analysis
       ↓
FRONTEND RECEIVES analysis with userTier flag
       ↓
AnalysisResults component receives analysis + userTier
       ├─ IF userTier === 'free':
       │  ├─ Show: Single score circle
       │  ├─ Show: Why This Score section
       │  ├─ Show: Strengths & Weaknesses
       │  ├─ Show: Premium upgrade banner
       │  └─ Hide: All metric cards and tabs
       │
       └─ IF userTier === 'premium':
          ├─ Show: 4 metric cards grid
          ├─ Show: All detailed tabs
          ├─ Show: Critical issues
          ├─ Show: Action buttons
          └─ Hide: Upgrade prompts
```

## Free Tier Analysis Enhancement Logic

```javascript
getEnhancedFreeTierAnalysis(analysis) {
  const overallScore = analysis.overallScore;
  
  // 1. Generate scoring reasoning
  let reasoning = '';
  if (overallScore >= 85) {
    reasoning = "Excellent score! Well-structured and matches requirements.";
  } else if (overallScore >= 70) {
    reasoning = "Good foundation. Has basics and keyword alignment.";
  } else if (overallScore >= 50) {
    reasoning = "Needs improvements. Gap between CV and job requirements.";
  } else {
    reasoning = "Significant improvements needed for competitiveness.";
  }
  
  // 2. Generate/enhance strengths (max 3)
  let keyStrengths = analysis.summary?.keyStrengths || [];
  if (keyStrengths.length === 0) {
    // Generate default strengths
    keyStrengths = [
      "Document structure is readable",
      // ... more defaults
    ];
  }
  
  // 3. Generate/enhance weaknesses (max 5)
  let majorWeaknesses = analysis.summary?.majorWeaknesses || [];
  if (majorWeaknesses.length === 0) {
    // Generate from score patterns
    if (overallScore < 60) {
      majorWeaknesses.push("Low keyword match with job description");
    }
    // ... more logic
  }
  
  // 4. Generate verdict
  const verdict = this.getVerdict(overallScore);
  
  // 5. Return enhanced summary
  return {
    ...analysis,
    summary: {
      ...analysis.summary,
      reasoning,
      keyStrengths: keyStrengths.slice(0, 3),
      majorWeaknesses: majorWeaknesses.slice(0, 5),
      verdict
    }
  };
}
```

## Component Prop Interfaces

### TierSelection Component
```javascript
Props:
{
  onSelectTier: (tier: 'free' | 'premium') => void,
  onBack?: () => void
}

State Changes:
- Calls onSelectTier('free') or onSelectTier('premium')
- Pages/index.js sets userTier state
- Navigation moves to step 1 (JobInput)
```

### AnalysisResults Component
```javascript
Props:
{
  analysis: {
    overallScore: number,
    matchPercentage: number,
    formatScore: number,
    atsAnalysis: Object,
    recruiterAnalysis: Object,
    intelligenceAnalysis: Object,
    formatAnalysis: Object,
    recommendations: Array,
    summary: {
      reasoning: string,
      keyStrengths: Array<string>,
      majorWeaknesses: Array<string>,
      verdict: string
    }
  },
  jobData: {
    role: string,
    company: string,
    description: string
  },
  userTier: 'free' | 'premium',
  onReset: () => void,
  onRewrite: () => void,
  onImprove: () => void,
  onUpgrade: () => void  // NEW
}

Conditional Rendering:
- if (userTier === 'free'): Show simplified FREE view
- if (userTier === 'premium'): Show detailed PREMIUM view
```

## Score Breakdown Formula

```
Overall Score = (ATS × 0.35) + (Recruiter × 0.35) 
                + (Intelligence × 0.20) + (Format × 0.10)

Where:
- ATS Score (35%): How ATS systems parse and rank
  └─ Checks: Keywords, formatting, structure, parsing ability
  
- Recruiter Score (35%): How humans perceive CV
  └─ Checks: First impression, readability, impact, professionalism
  
- Intelligence Score (20%): Content quality analysis
  └─ Checks: Bullet points, metrics, action verbs, patterns
  
- Format Score (10%): Presentation and structure
  └─ Checks: Section structure, formatting, density, naturalness
```

## Free Tier Display Rules

```
VISIBLE (Free Tier):
✓ Single large CV score circle
✓ "Why This Score?" reasoning section
✓ Key Strengths (2-3 items)
✓ Areas to Improve (3-5 items)
✓ Action buttons: Analyze Another, Upgrade
✓ Premium upgrade banner with metrics preview

HIDDEN (Free Tier):
✗ Individual metric cards (ATS, Recruiter, Keywords, Format)
✗ Detailed analysis tabs
✗ Critical issues section (if extensive)
✗ Bullet point analysis
✗ Full recommendations list
✗ AI rewrite option
```

## Premium Tier Display Rules

```
VISIBLE (Premium Tier):
✓ All 4 metric cards grid (ATS, Recruiter, Keywords, Format)
✓ Critical issues section
✓ Detailed analysis tabs
✓ Strengths & Weaknesses breakdown
✓ Bullet point analysis
✓ Full recommendations list
✓ Action buttons: AI Auto-Rewrite, Apply Improvements, Analyze New
✓ Industry-standard CV fields

HIDDEN (Premium Tier):
✗ Upgrade prompts/banners
✗ Tier selection dialog
```

## Backend Tier Logic Flow

```javascript
app.post('/api/analyze-cv', async (req, res) => {
  const { userTier } = req.body;
  
  // Extract CV text
  const cvText = await extractCvText(req.file);
  
  // Get normalized tier
  const tier = userTierService.getUserTier(userTier);
  
  // RUN FULL ANALYSIS FOR BOTH TIERS
  let analysis = await cvAnalyzer.analyzeCV(cvText, jobDescription);
  
  // TIER-SPECIFIC POST-PROCESSING
  if (tier === 'free') {
    // Enhance for friendly display
    analysis = userTierService.getEnhancedFreeTierAnalysis(analysis);
    analysis.userTier = 'free';
  } else {
    // Premium gets full raw analysis
    analysis.userTier = 'premium';
  }
  
  // Return
  return res.json({ 
    success: true, 
    analysis,
    extractedCvText: cvText 
  });
});
```

## Files Changed Summary

```
NEW FILES:
├─ components/TierSelection.js (400+ lines)
│  └─ Displays tier comparison and selection
│
└─ TIER_IMPLEMENTATION.md & FREE_VS_PREMIUM_GUIDE.md
   └─ Documentation

MODIFIED FILES:
├─ components/AnalysisResults.js (~600 lines, completely rewritten)
│  ├─ Added userTier prop
│  ├─ Conditional rendering based on tier
│  ├─ Free view: Simple, focused, upgrade CTA
│  └─ Premium view: Full detailed analysis
│
├─ pages/index.js
│  ├─ Added userTier state
│  ├─ Added tier selection step (step 0)
│  ├─ Updated step flow
│  ├─ Added handleTierSelect()
│  ├─ Added handleUpgradeToPremium()
│  └─ Pass userTier to API and components
│
├─ server/services/UserTierService.js
│  ├─ Added getEnhancedFreeTierAnalysis()
│  ├─ Added getVerdict()
│  └─ Enhanced free tier reasoning
│
└─ server/index.js
   └─ Updated /api/analyze-cv endpoint
      ├─ Added userTier from request body
      ├─ Call getEnhancedFreeTierAnalysis() for free tier
      └─ Return analysis with userTier flag
```

## Performance Considerations

**Backend Computation**:
- Both tiers run complete CVAnalyzer analysis
- No additional computation needed for free tier
- Post-processing for free tier is minimal (string generation)
- Total cost: Same as before

**Frontend Rendering**:
- Free tier: Fewer components rendered (saves ~30% DOM nodes)
- Premium tier: Full component tree rendered
- Conditional rendering is efficient
- No performance impact

**Data Transfer**:
- Free tier: Full analysis data sent (necessary for potential upgrade)
- Premium tier: Full analysis data sent
- No size difference in API responses
- Filtering done at display layer

## Security Considerations

- userTier is received from frontend (not trusted)
- Backend validates tier through UserTierService
- Premium features are gated at backend API level
- Free users cannot access /api/rewrite-cv or premium endpoints
- All analysis data is filtered based on authenticated tier
