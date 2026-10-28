export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Rahul B",
    jobTitle: "Data Analyst & Data Scientist",
    url: "https://rahulb.dev",
    description:
      "Data Analyst specializing in SQL, Python, Power BI dashboards, predictive machine learning, and data engineering.",
    knowsAbout: [
      "Data Analysis",
      "SQL",
      "Python",
      "Power BI",
      "Tableau",
      "Machine Learning",
      "TensorFlow",
      "Predictive Modeling",
      "Data Engineering",
    ],
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        name: "Google Data Analytics Professional Certificate",
        credentialCategory: "Professional Certificate",
        recognizedBy: {
          "@type": "Organization",
          name: "Google",
        },
      },
      {
        "@type": "EducationalOccupationalCredential",
        name: "Python for Data Science and AI - IBM",
        credentialCategory: "Professional Certificate",
        recognizedBy: {
          "@type": "Organization",
          name: "IBM",
        },
      },
      {
        "@type": "EducationalOccupationalCredential",
        name: "Deloitte Technology Job Simulation",
        credentialCategory: "Job Simulation",
        recognizedBy: {
          "@type": "Organization",
          name: "Deloitte / Forage",
        },
      },
      {
        "@type": "EducationalOccupationalCredential",
        name: "Accenture Data Analytics Simulation",
        credentialCategory: "Job Simulation",
        recognizedBy: {
          "@type": "Organization",
          name: "Accenture / Forage",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
