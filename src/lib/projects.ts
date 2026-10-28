/**
 * PORTFOLIO PROJECTS REPOSITORY
 * 
 * High-impact Data Analytics, Data Science, and Engineering case studies.
 */

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: "Business Intelligence" | "Machine Learning" | "SQL & Engineering" | "Analytics";
  description: string;
  impactMetrics: { label: string; value: string }[];
  techStack: string[];
  featured: boolean;
  year: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  image?: string;
}

export const projectsList: Project[] = [
  {
    id: "ecommerce-executive-kpi",
    title: "E-Commerce Executive KPI & Revenue Engine",
    subtitle: "Enterprise Business Intelligence & Cohort Retention",
    category: "Business Intelligence",
    year: "2026",
    description:
      "Architected an end-to-end interactive analytics suite tracking cross-channel revenues, customer acquisition costs, and cohort retention across 120,000+ customer orders.",
    impactMetrics: [
      { label: "Margin Gain", value: "+18.4%" },
      { label: "Revenue Tracked", value: "$2.4M" },
      { label: "Orders Analyzed", value: "120K+" },
    ],
    techStack: ["Power BI", "SQL", "DAX", "Data Modeling", "Excel"],
    featured: true,
    githubUrl: "https://github.com",
    liveDemoUrl: "https://github.com",
  },
  {
    id: "customer-churn-prediction",
    title: "Customer Churn Prediction & Retention Engine",
    subtitle: "Supervised Machine Learning & Uplift Modeling",
    category: "Machine Learning",
    year: "2026",
    description:
      "Trained gradient-boosted predictive models on multi-dimensional customer behavioral logs, identifying high-risk churn segments and recommending intervention playbooks.",
    impactMetrics: [
      { label: "ROC-AUC Score", value: "88.6%" },
      { label: "Churn Reduction", value: "14.2%" },
      { label: "Profiles Scored", value: "45K" },
    ],
    techStack: ["Python", "Scikit-Learn", "XGBoost", "Pandas", "Matplotlib"],
    featured: true,
    githubUrl: "https://github.com",
    liveDemoUrl: "https://github.com",
  },
  {
    id: "fraud-anomaly-detection",
    title: "Financial Transaction Anomaly & Fraud Engine",
    subtitle: "Forensic Data Analysis & High-Throughput SQL",
    category: "SQL & Engineering",
    year: "2026",
    description:
      "Engineered automated anomaly detection queries scanning half a million transactions for velocity spikes, geographical discrepancies, and fraudulent transaction chains.",
    impactMetrics: [
      { label: "Precision Rate", value: "99.1%" },
      { label: "Audit Volume", value: "500K+" },
      { label: "Query Speed", value: "<180ms" },
    ],
    techStack: ["PostgreSQL", "SQL", "Python", "Statistical Testing", "ETL"],
    featured: true,
    githubUrl: "https://github.com",
    liveDemoUrl: "https://github.com",
  },
  {
    id: "supply-chain-optimization",
    title: "Logistics Throughput & Fleet Optimization",
    subtitle: "Geospatial Operations & Bottleneck Analytics",
    category: "Analytics",
    year: "2026",
    description:
      "Consolidated multi-warehouse shipping logs into a centralized executive dashboard, isolating transit bottlenecks and cutting delivery turnaround times.",
    impactMetrics: [
      { label: "Transit Delay", value: "-22.5%" },
      { label: "Hubs Monitored", value: "35 Sites" },
      { label: "Annual Cost Savings", value: "$340K" },
    ],
    techStack: ["Tableau", "Python", "GeoPandas", "SQL", "Logistics Modeling"],
    featured: true,
    githubUrl: "https://github.com",
    liveDemoUrl: "https://github.com",
  },
];
