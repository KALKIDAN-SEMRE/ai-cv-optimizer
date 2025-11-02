# AI CV Optimizer

A modern web application that uses AI to optimize your resume/CV for specific job descriptions. Upload your resume, provide a job description, and get an AI-powered, professionally optimized CV tailored for your target role.

![AI CV Optimizer](https://img.shields.io/badge/AI-Powered-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![React](https://img.shields.io/badge/React-18.3-61dafb)

## ✨ Features

- **AI-Powered Optimization**: Uses Google Gemini AI to analyze and optimize your resume
- **Multiple File Formats**: Supports PDF, DOCX, and TXT file uploads
- **Smart Parsing**: Automatically extracts text from PDF and DOCX files
- **Professional Output**: Generates optimized CVs in PDF and DOCX formats
- **User Authentication**: Secure signup/login with Supabase Auth
- **Dashboard**: View and manage all your optimized CVs
- **Free Trial**: 3 free optimizations for anonymous users
- **Job Match Scoring**: AI calculates how well your resume matches the job description

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Database + Edge Functions)
- **AI Provider**: Google Gemini API
- **File Processing**: pdfjs-dist, mammoth, jspdf, docx
- **State Management**: React Hooks + TanStack Query

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed
- A **Supabase** account (free tier works)
- A **Google Gemini API key** (free tier available)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-cv-optimizer.git
cd ai-cv-optimizer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to **Settings** → **API** and copy:
   - Project URL
   - anon/public key

#### Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `supabase/migrations/20251101205108_b5625c42-a810-41da-87cc-69545d0cdd98.sql`
4. Click **Run**
5. Repeat with `supabase/migrations/20251101205342_d4bea73f-3416-4af4-b332-341a2d6d7e60.sql`
6. Verify tables were created in **Table Editor**

#### Deploy Edge Function

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to **Edge Functions** → **Create Function**
2. Name it: `optimize-cv`
3. Copy the entire contents of `supabase/functions/optimize-cv/index.ts`
4. Paste into the code editor
5. Click **Deploy**

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy function
npx supabase functions deploy optimize-cv --no-verify-jwt
```

#### Configure Edge Function Secrets

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add new secret:
   - Name: `GEMINI_API_KEY`
   - Value: Your Google Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

**Using CLI:**
```bash
npx supabase secrets set GEMINI_API_KEY=AIza-your-key-here
```

**Note**: `SUPABASE_URL` and `SERVICE_ROLE_KEY` are automatically provided by Supabase.

### 4. Configure Environment Variables

1. Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
```

2. Get your credentials from **Supabase Dashboard** → **Settings** → **API**

### 5. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Get API Key**
3. Create a new API key
4. Copy the key (starts with `AIza...`)
5. Add it as a secret in Supabase (see step 3 above)

### 6. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 📁 Project Structure

```
ai-cv-optimizer/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── CVPreview.tsx    # CV preview component
│   │   ├── JobDescriptionInput.tsx
│   │   └── ResumeUpload.tsx
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Main page
│   │   ├── Auth.tsx         # Authentication
│   │   ├── Dashboard.tsx    # User dashboard
│   │   └── NotFound.tsx
│   ├── lib/                 # Utility functions
│   │   ├── apiUtils.ts      # API helpers
│   │   ├── fileGenerator.ts # PDF/DOCX generation
│   │   └── fileParser.ts    # File parsing
│   └── integrations/
│       └── supabase/        # Supabase client & types
├── supabase/
│   ├── functions/
│   │   └── optimize-cv/     # Edge function
│   └── migrations/          # Database migrations
└── package.json
```

## 🔧 Configuration

### Supabase Settings

1. **Disable JWT Verification** for anonymous access:
   - Go to **Edge Functions** → **optimize-cv** → **Settings**
   - Disable "Verify JWT" or use `--no-verify-jwt` flag when deploying

2. **Email Confirmation** (Optional):
   - Configure in **Authentication** → **Settings**
   - If enabled, users must confirm email before accessing dashboard

## 🎯 Usage

### For Users

1. **Upload Resume**: Paste text or upload PDF/DOCX/TXT file (max 10MB)
2. **Add Job Description**: Enter the job description and role
3. **Optimize**: Click "Optimize My CV" and wait for AI processing
4. **Review**: Preview the optimized CV
5. **Download**: Save as PDF or DOCX

### For Developers

#### Running Locally

```bash
npm run dev
```

#### Building for Production

```bash
npm run build
```

#### Preview Production Build

```bash
npm run preview
```

## 🔐 Environment Variables

### Required

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

### Edge Function Secrets (in Supabase)

- `GEMINI_API_KEY` - Your Google Gemini API key
- `SERVICE_ROLE_KEY` - Auto-provided by Supabase
- `SUPABASE_URL` - Auto-provided by Supabase

## 📝 API Reference

### Edge Function: `optimize-cv`

**Endpoint**: `https://your-project.supabase.co/functions/v1/optimize-cv`

**Method**: POST

**Headers**:
```
Content-Type: application/json
Authorization: Bearer YOUR_ANON_KEY (if JWT verification enabled)
```

**Request Body**:
```json
{
  "resumeText": "Your resume text here",
  "jobDescription": "Job description text",
  "jobRole": "Software Engineer"
}
```

**Response**:
```json
{
  "header": {
    "name": "Full Name",
    "contact": "email@example.com | phone | location"
  },
  "summary": "Professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [...],
  "education": [...],
  "matchScore": 85
}
```

## 🐛 Troubleshooting

### Edge Function Errors

**"Failed to send a request to the Edge Function"**
- Verify the function is deployed: Check Supabase Dashboard → Edge Functions
- Ensure `GEMINI_API_KEY` secret is set correctly
- Check function logs for detailed errors

**"Gemini API key not configured"**
- Set `GEMINI_API_KEY` in Supabase secrets
- Redeploy the function after setting secrets

### Authentication Issues

**"Email not confirmed"**
- Check email inbox for confirmation link
- Verify email confirmation is enabled in Supabase
- Check spam folder

**"Account already registered"**
- Sign in instead of signing up
- Check if email is already in use

### File Upload Issues

**PDF parsing errors**
- Ensure PDF is not corrupted
- Check file size (max 10MB)
- Verify PDF is text-based (not scanned image)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - AI provider
- [Supabase](https://supabase.com/) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vite](https://vitejs.dev/) - Build tool

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review Supabase Edge Function logs
3. Open an issue on GitHub

## 🔮 Future Enhancements

- [ ] Support for multiple AI providers
- [ ] Resume templates customization
- [ ] Cover letter generation
- [ ] LinkedIn profile optimization
- [ ] Export to multiple formats
- [ ] Batch processing for multiple job applications

---

**Made with ❤️ using React, TypeScript, and AI**
