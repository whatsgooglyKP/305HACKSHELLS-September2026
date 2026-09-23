import { JobListing, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: "Sarah Jenkins",
  title: "Administrative Coordinator & Support Specialist",
  email: "sarah.jenkins.orlando@gmail.com",
  location: "Orlando, FL",
  experienceYears: 5,
  skills: [
    "Office Administration & Operations",
    "Scheduling & Calendar Coordination",
    "Student Support Services",
    "Parent & Community Relations",
    "Database Management (Skyward, MS Excel)",
    "Budget Tracking & Expense Reports",
    "Cross-Functional Collaboration",
    "Empathetic Client Communication",
    "Bilingual (English/Spanish)",
    "Microsoft Office Suite (Word, Excel, PowerPoint, Teams)",
    "MS Teams & Outlook"
  ],
  rawResumeText: `SARAH JENKINS
sarah.jenkins.orlando@gmail.com  |  +1 (407) 555-8319  |  Orlando, FL

SUMMARY
Dedicated, highly organized administrative professional and single mother of two seeking stable, family-friendly career opportunities within Orange County Public Schools (OCPS) or local educational institutions. Bringing 5+ years of experience in office coordination, parent support, scheduling, and database management. Bilingual (English/Spanish) and deeply committed to supporting community-centric educational operations while building a secure and financially stable household.

SKILLS
Office Administration & Operations | Scheduling & Calendar Coordination | Student Support Services | Parent & Community Relations | Database Management (Skyward, MS Excel) | Budget Tracking & Expense Reports | Cross-Functional Collaboration | Empathetic Client Communication | Bilingual (English/Spanish) | Microsoft Office Suite (Word, Excel, PowerPoint, Teams) | MS Teams & Outlook

EXPERIENCE
ORLANDO COMMUNITY CENTER, Office Coordinator, 09/2021 – Present
- Managed reception desk, student registrations, and parent inquiries for a community hub serving 500+ local families.
- Coordinated executive calendars, booked workshop spaces, and processed monthly invoice/billing logs with 100% accuracy.
- Used MS Excel to monitor and audit a monthly program budget of $12,000, recommending cost savings that reduced supply expenses by 15%.
- Maintained bilingual (English/Spanish) communications across parent portals, resolving registration scheduling overlaps.

ORANGE COUNTY YMCA, Youth Program Assistant, 05/2019 – 08/2021
- Assisted in planning and executing calendar logistics for after-school enrichment and summer programs for children aged 5-12.
- Updated student attendance and contact profiles, compiling weekly safety compliance and registration reports.
- Collaborated with local elementary school representatives and program partners to coordinate academic calendars and school-bus dropoffs.

EDUCATION
VALENCIA COLLEGE, Orlando, FL
A.S. in Office Administration (Honors), 2018`
};

export const SAMPLE_JOBS: JobListing[] = [
  {
    id: "ocps-01",
    title: "Program Coordinator (Student Services)",
    company: "Orange County Public Schools (OCPS)",
    location: "Orlando, FL",
    type: "Full-time",
    postedAgo: "Posted 2 days ago",
    description: "Coordinate student intake, parent-school liaison efforts, and administrative scheduling for Orange County's district student support programs. Maintain databases, run student support registrations, and resolve parent queries. This position is fully aligned with the Orange County school calendar, offering highly desirable hours for parents (8:00 AM - 4:00 PM), comprehensive family medical and dental benefits, and a state pension plan.",
    requirements: [
      "Experience in school or community administration",
      "Familiarity with student information platforms or databases (Skyward preferred)",
      "Excellent customer-facing communication and bilingual (English/Spanish) verbal fluency"
    ],
    skills: [
      "Office Administration & Operations",
      "Parent & Community Relations",
      "Scheduling & Calendar Coordination",
      "Bilingual (English/Spanish)"
    ],
    matchScore: 95,
    matchedKeywords: [
      "Office Administration & Operations",
      "Parent & Community Relations",
      "Scheduling & Calendar Coordination",
      "Bilingual (English/Spanish)"
    ],
    missingKeywords: [
      "Database Management (Skyward, MS Excel)"
    ],
    matchReasons: [
      "Matches school calendar hours, eliminating after-school care expenses.",
      "Directly utilizes your bilingual customer-coordination and parent relations experience.",
      "Valencia College alumni hiring path provides strong referral potential."
    ],
    companyFollowers: 12000,
    url: "https://www.ocps.net/departments/human_resources/career_opportunities"
  },
  {
    id: "val-02",
    title: "Administrative Assistant (Admissions)",
    company: "Valencia College",
    location: "Orlando, FL (East Campus)",
    type: "Full-time",
    postedAgo: "Posted 3 days ago",
    description: "Provide comprehensive administrative support to the student admissions and registrar offices. Log prospective applicant profiles, schedule counseling appointments, process academic transcripts, and support orientation workshops. Offers excellent government pension packages, solid standard hours, and tuition-waiver benefits for immediate family members.",
    requirements: [
      "Associate's degree or higher (Valencia graduates highly preferred)",
      "Proficiency with database software, Microsoft Excel, and scheduling calendars",
      "Strong attention to detail in record keeping and customer service"
    ],
    skills: [
      "Office Administration & Operations",
      "Database Management (Skyward, MS Excel)",
      "Scheduling & Calendar Coordination",
      "Microsoft Office Suite (Word, Excel, PowerPoint, Teams)"
    ],
    matchScore: 92,
    matchedKeywords: [
      "Office Administration & Operations",
      "Database Management (Skyward, MS Excel)",
      "Scheduling & Calendar Coordination",
      "Microsoft Office Suite (Word, Excel, PowerPoint, Teams)"
    ],
    missingKeywords: [],
    matchReasons: [
      "Alumni preference gives you a high resume-filtering advantage.",
      "Tuition-waiver benefits support future education funding for your two children.",
      "Predictable, structured, and local campus environment."
    ],
    companyFollowers: 8500,
    url: "https://valenciacollege.edu/about/divisions/human-resources/employment-opportunities.php"
  },
  {
    id: "ocg-03",
    title: "Family Services Intake Coordinator",
    company: "Orange County Government",
    location: "Orlando, FL",
    type: "Hybrid",
    postedAgo: "Posted 1 day ago",
    description: "Review and register applications for local housing, utility, and financial assistance programs. Conduct interviews, verify financial documents, and guide applicants toward appropriate community support resources. This is a stable public sector career offering 2 days of work-from-home hybrid flexibility, government medical coverage, and a daytime work schedule.",
    requirements: [
      "Experience in human services support or office coordinator roles",
      "Detail-oriented management of financial spreadsheets or intake databases",
      "Strong bilingual (English/Spanish) communication skills"
    ],
    skills: [
      "Office Administration & Operations",
      "Budget Tracking & Expense Reports",
      "Bilingual (English/Spanish)",
      "Empathetic Client Communication"
    ],
    matchScore: 89,
    matchedKeywords: [
      "Office Administration & Operations",
      "Budget Tracking & Expense Reports",
      "Bilingual (English/Spanish)",
      "Empathetic Client Communication"
    ],
    missingKeywords: [],
    matchReasons: [
      "Hybrid flexibility provides 2 work-from-home days to balance child-rearing duties.",
      "Leverages your budget tracking skills and empathetic parent-relations background.",
      "Extremely high public service job security and robust medical coverage."
    ],
    companyFollowers: 9500,
    url: "https://www.orangecountyfl.net/Employment/JobOpportunities.aspx"
  }
];

export const INITIAL_APPLICATIONS: import('../types').TailoredApplication[] = [];
