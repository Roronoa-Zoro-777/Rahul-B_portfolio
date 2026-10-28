/**
 * CERTIFICATES & CREDENTIALS DATA REPOSITORY
 * 
 * Edit certificate titles, issuers, years, or image paths below.
 * Images are placed at /certificates/cert-1.jpg through cert-8.jpg.
 */

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  year: string;
  image: string; // e.g. /certificates/cert-1.jpg
  platform?: string;
  issueDate?: string;
  thumbnailUrl?: string;
  pdfUrl?: string;
  verificationUrl?: string;
  verificationCode?: string;
  description?: string;
  skills?: string[];
  category?: "Google" | "IBM" | "Industry Simulation" | "Full Stack";
}

// Backward-compatible alias
export type CertificateItem = Certificate;

export const certificatesList: Certificate[] = [
  {
    id: "google-capstone",
    title: "Google Data Analytics Capstone: Complete a Case Study",
    issuer: "Google",
    platform: "Coursera",
    year: "2026",
    issueDate: "August 2026",
    image: "/certificates/cert-1.jpg",
    thumbnailUrl: "/certificates/cert-1.jpg",
    pdfUrl: "/certificates/Google Data Analytics Capstone.pdf",
    verificationUrl: "https://coursera.org/verify/62ONS5LC4H8E",
    verificationCode: "62ONS5LC4H8E",
    description:
      "End-to-end data analytics case study executing data cleaning, exploration, visualization, and strategic business recommendations.",
    skills: ["Case Study", "Data Analysis", "R", "Tableau", "SQL", "Spreadsheets"],
    category: "Google",
  },
  {
    id: "google-data-everywhere",
    title: "Foundations: Data, Data, Everywhere",
    issuer: "Google",
    platform: "Coursera",
    year: "2026",
    issueDate: "August 2026",
    image: "/certificates/cert-2.jpg",
    thumbnailUrl: "/certificates/cert-2.jpg",
    pdfUrl: "/certificates/Data everywhere.pdf",
    verificationUrl: "https://coursera.org/verify/62ONS5LC4H8E",
    verificationCode: "Google Career Certificates",
    description:
      "Core grounding in data lifecycles, structured analytical thinking, data ethics, spreadsheets, and SQL query fundamentals.",
    skills: ["Data Ecosystem", "Analytical Thinking", "Data Ethics", "SQL Basics", "Spreadsheets"],
    category: "Google",
  },
  {
    id: "google-ask-questions",
    title: "Ask Questions to Make Data-Driven Decisions",
    issuer: "Google",
    platform: "Coursera",
    year: "2026",
    issueDate: "August 2026",
    image: "/certificates/cert-3.jpg",
    thumbnailUrl: "/certificates/cert-3.jpg",
    pdfUrl: "/certificates/ask questions.pdf",
    verificationUrl: "https://coursera.org/verify/XZMZ3CW9V4K4",
    verificationCode: "XZMZ3CW9V4K4",
    description:
      "Mastery of structured problem-solving, SMART questioning frameworks, stakeholder collaboration, metrics, and KPI formulation.",
    skills: ["Problem Solving", "Metrics & KPIs", "Stakeholder Alignment", "Structured Thinking"],
    category: "Google",
  },
  {
    id: "google-prepare-data",
    title: "Prepare Data for Exploration",
    issuer: "Google",
    platform: "Coursera",
    year: "2026",
    issueDate: "August 2026",
    image: "/certificates/cert-4.jpg",
    thumbnailUrl: "/certificates/cert-4.jpg",
    pdfUrl: "/certificates/prepare data for exploration.pdf",
    verificationUrl: "https://coursera.org/verify/UJN293ZUSIMH",
    verificationCode: "UJN293ZUSIMH",
    description:
      "Advanced data extraction, transformation, database security, data integrity, metadata structures, and SQL queries for exploration.",
    skills: ["Data Extraction", "Data Cleaning", "Data Integrity", "SQL", "Database Security"],
    category: "Google",
  },
  {
    id: "ibm-da0101en",
    title: "Data Analysis with Python (DA0101EN)",
    issuer: "IBM",
    platform: "Cognitive Class",
    year: "2026",
    issueDate: "April 2026",
    image: "/certificates/cert-5.jpg",
    thumbnailUrl: "/certificates/cert-5.jpg",
    pdfUrl: "/certificates/ibm.pdf",
    verificationCode: "DA0101EN",
    description:
      "End-to-end Python data pipeline: data wrangling with Pandas, numerical computing with NumPy, exploratory data analysis, and predictive model evaluation.",
    skills: ["Python", "Pandas", "NumPy", "Scikit-Learn", "Regression Modeling", "EDA"],
    category: "IBM",
  },
  {
    id: "deloitte-simulation",
    title: "Data Analytics Job Simulation",
    issuer: "Deloitte Australia",
    platform: "Forage",
    year: "2026",
    issueDate: "June 2026",
    image: "/certificates/cert-6.jpg",
    thumbnailUrl: "/certificates/cert-6.jpg",
    pdfUrl: "/certificates/delloite.pdf",
    verificationCode: "mLzhx6MHx4Bytyh7i",
    description:
      "Industry simulation solving corporate challenges through forensic technology, data quality assessment, and business intelligence.",
    skills: ["Data Analysis", "Forensic Technology", "Data Integrity", "Business Consulting"],
    category: "Industry Simulation",
  },
  {
    id: "quantium-simulation",
    title: "Data Analytics Job Simulation",
    issuer: "Quantium",
    platform: "Forage",
    year: "2026",
    issueDate: "June 2026",
    image: "/certificates/cert-7.jpg",
    thumbnailUrl: "/certificates/cert-7.jpg",
    pdfUrl: "/certificates/quatium data analytics.pdf",
    verificationCode: "d3Xk6BycieMsqSmK9",
    description:
      "Retail and consumer data analytics, customer segment analysis, experimentation and uplift testing, and executive data presentation.",
    skills: ["Customer Analytics", "Uplift Testing", "Data Preparation", "Commercial Insights"],
    category: "Industry Simulation",
  },
  {
    id: "suprmentor-fullstack",
    title: "Full Stack Development Program",
    issuer: "SuprMentor",
    platform: "SuprMentor",
    year: "2026",
    issueDate: "September 2026",
    image: "/certificates/cert-8.jpg",
    thumbnailUrl: "/certificates/cert-8.jpg",
    pdfUrl: "/certificates/suprmentr full stack.pdf",
    verificationCode: "SM-FSD-2026",
    description:
      "Full stack engineering program covering modern frontend architectures, backend APIs, cloud deployment, and scalable web solutions.",
    skills: ["Full Stack", "JavaScript / TypeScript", "React", "Node.js", "System Architecture"],
    category: "Full Stack",
  },
];
