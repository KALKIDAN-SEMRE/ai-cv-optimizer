# AI CV Optimizer

A modern web application that uses AI to optimize your resume/CV for specific job descriptions. Upload your resume, provide a job description, and get an AI-powered, professionally optimized CV tailored for your target role.

![AI CV Optimizer](https://img.shields.io/badge/AI-Powered-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![React](https://img.shields.io/badge/React-18.3-61dafb)

## Features

- **AI-Powered Optimization**: Uses Google Gemini AI to analyze and optimize your resume
- **Multiple File Formats**: Supports PDF, DOCX, and TXT file uploads
- **Smart Parsing**: Automatically extracts text from PDF and DOCX files
- **Professional Output**: Generates optimized CVs in PDF and DOCX formats
- **User Authentication**: Secure signup/login with Supabase Auth
- **Dashboard**: View and manage all your optimized CVs
- **Free Trial**: 3 free optimizations for anonymous users
- **Job Match Scoring**: AI calculates how well your resume matches the job description

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Database + Edge Functions)
- **AI Provider**: Google Gemini API
- **File Processing**: pdfjs-dist, mammoth, jspdf, docx
- **State Management**: React Hooks + TanStack Query


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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
