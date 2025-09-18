# EvalATS - Modern Applicant Tracking System

A comprehensive, modern Applicant Tracking System (ATS) built with Next.js 14, TypeScript, Convex, and Clerk authentication. EvalATS streamlines the hiring process with powerful features for managing candidates, jobs, interviews, and communications.

## 🚀 Features

### Core Functionality
- **📊 Dashboard**: Real-time overview of hiring pipeline and key metrics
- **💼 Job Management**: Create, edit, and manage job postings with full CRUD operations
- **👥 Candidate Tracking**: Comprehensive candidate profiles with evaluation scores
- **📅 Interview Scheduling**: Schedule and manage interviews with calendar integration
- **📧 Email Communications**: Built-in email system with templates and threading
- **📈 Analytics Dashboard**: Hiring funnel analysis, source effectiveness, and time-to-hire metrics
- **🔒 Authentication**: Secure authentication with Clerk, supporting SSO and MFA

### Advanced Features
- **📁 Document Management**: Upload and manage resumes, cover letters, and other candidate documents
- **⭐ Interview Feedback**: Structured feedback collection with multi-criteria ratings
- **🔄 Status Pipeline**: Visual candidate pipeline with quick status updates
- **🔍 Smart Search**: Real-time search and filtering across all data
- **📝 Notes System**: Collaborative notes and comments on candidates
- **📊 Evaluation Scoring**: Multi-dimensional candidate evaluation system
- **🎯 Source Tracking**: Track and analyze candidate sources for ROI
- **📨 Email Templates**: Pre-built and custom email templates with variable substitution

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Convex (Real-time database and serverless functions)
- **Authentication**: Clerk (with Convex integration)
- **UI Components**: Custom components with shadcn/ui patterns
- **File Storage**: Convex File Storage
- **State Management**: React hooks with Convex real-time queries
- **Styling**: Tailwind CSS with dark mode support

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Convex account (free tier available)
- Clerk account (free tier available)

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/evalats.git
cd evalats/frontend
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up Convex**
```bash
npx convex dev
```
This will prompt you to log in to Convex and set up a new project.

4. **Configure environment variables**
Create a `.env.local` file with:
```env
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOYMENT=your_convex_deployment

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_JWT_ISSUER_DOMAIN=your_clerk_jwt_issuer_domain
```

5. **Seed the database (optional)**
```bash
npx convex run emailSeeds:seedEmailTemplates
```

6. **Start the development server**
```bash
pnpm dev
```

Visit `http://localhost:3000` to see the application.

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js 14 app router pages
│   │   ├── (auth)/          # Authentication pages
│   │   ├── analytics/       # Analytics dashboard
│   │   ├── candidates/      # Candidate management
│   │   ├── interviews/      # Interview scheduling
│   │   ├── jobs/           # Job postings
│   │   └── settings/       # Application settings
│   ├── components/          # React components
│   │   ├── layout/         # Layout components (AppShell, etc.)
│   │   ├── modals/         # Modal components
│   │   ├── emails/         # Email-related components
│   │   └── ui/             # Base UI components
│   ├── lib/                # Utility functions
│   └── providers/          # Context providers
├── convex/                 # Convex backend
│   ├── _generated/         # Auto-generated Convex files
│   ├── schema.ts          # Database schema
│   ├── auth.config.ts     # Authentication configuration
│   └── *.ts               # Convex functions (mutations/queries)
├── public/                # Static assets
└── package.json          # Dependencies
```

## 🔧 Configuration

### Company configuration

- Company level settings are loaded from `config/company.yaml` by default. You can point to a different file by setting the `COMPANY_CONFIG_PATH` environment variable to an absolute path or a path relative to the project root.
- The configuration file is validated and merged with sensible defaults at runtime, so you only need to provide the fields you wish to override.

### Database Schema
The application uses Convex with the following main tables:
- `candidates` - Candidate information and evaluation scores
- `jobs` - Job postings and requirements
- `interviews` - Interview scheduling and feedback
- `emails` - Email communications and templates
- `timeline` - Candidate activity timeline
- `assessments` - Candidate assessments and tests
- `notes` - Collaborative notes on candidates
- `applications` - Job applications linking candidates to jobs

### Authentication
Clerk is configured with:
- Email/password authentication
- Social login providers (configurable in Clerk dashboard)
- Protected routes via middleware
- JWT tokens for Convex integration

## 🚢 Deployment

### Production Deployment

1. **Deploy to Vercel** (recommended)
```bash
vercel
```

2. **Configure production environment variables** in Vercel dashboard

3. **Deploy Convex to production**
```bash
npx convex deploy
```

4. **Update environment variables** with production URLs

## 📊 Key Features Deep Dive

### Email System
- Compose and send emails directly from candidate profiles
- Email threading for conversation tracking
- Template system with variable substitution
- Delivery status tracking
- CC/BCC support
- File attachments (via Convex storage)

### Analytics Dashboard
- Hiring funnel visualization
- Source effectiveness analysis
- Time-to-hire metrics
- Interview completion rates
- Rating distributions
- Real-time metric updates

### Interview Feedback System
- Structured feedback forms
- Multi-criteria evaluation (technical, cultural fit, communication)
- Star ratings with detailed assessments
- Hiring recommendations
- Feedback aggregation and reporting

## 🔒 Security

- Secure authentication with Clerk
- Row-level security via Convex
- Environment variable protection
- HTTPS enforcement in production
- Input validation and sanitization
- Protected API routes

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Real-time backend by [Convex](https://www.convex.dev/)
- Authentication by [Clerk](https://clerk.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**EvalATS** - Streamlining the hiring process with modern technology 🚀