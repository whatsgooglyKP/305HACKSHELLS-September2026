export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Contract' | 'Remote' | 'Hybrid';
  postedAgo: string;
  description: string;
  requirements: string[];
  skills: string[];
  matchScore?: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  matchReasons?: string[];
  missingSkills?: string[];
  url?: string;
  companyFollowers?: number;
}

export interface TailoredResumeExperience {
  company: string;
  title: string;
  dates: string;
  location?: string;
  bullets: string[];
}

export interface TailoredResumeEducation {
  school: string;
  degree: string;
  dates: string;
}

export interface TailoredResumePackage {
  header: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    title?: string;
  };
  summary: string;
  skills: string[];
  experience: TailoredResumeExperience[];
  education: TailoredResumeEducation[];
}

export interface TailoredApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'Saved' | 'Tailored' | 'Applied' | 'Interviewing';
  createdAt: string;
  tailoredResumeSummary: string;
  tailoredResume?: TailoredResumePackage;
  fullTailoredResumeText?: string;
  optimizedBullets?: {
    original: string;
    tailored: string;
    reasoning: string;
  }[];
  coverLetter: string;
  matchScore: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

export interface UserProfile {
  name: string;
  title: string;
  email: string;
  location: string;
  experienceYears: number;
  skills: string[];
  rawResumeText: string;
}

export interface CareerMetrics {
  totalScraped: number;
  highMatchJobs: number;
  tailoredCount: number;
  appliedCount: number;
  averageMatchScore: number;
  topInDemandSkills: { skill: string; count: number }[];
}
