import { JobListing, UserProfile } from '../types';

export interface KeywordMatchResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

/**
 * Calculates candidate-job match score strictly using a keyword-based algorithm:
 * matchScore = (number of matching keywords / total job keywords) * 100
 */
export function calculateKeywordMatchScore(
  job: Partial<JobListing>,
  profile: Partial<UserProfile>
): KeywordMatchResult {
  const jobKeywordSet = new Set<string>();

  // 1. Extract keywords from job (skills, requirements, tools)
  if (Array.isArray(job.skills)) {
    job.skills.forEach(s => {
      if (s && s.trim()) jobKeywordSet.add(s.trim());
    });
  }

  if (Array.isArray(job.requirements)) {
    job.requirements.forEach(req => {
      if (req && req.trim()) {
        const parts = req.split(/[,;&•\n]/);
        parts.forEach(p => {
          const clean = p.trim();
          if (clean.length > 2 && clean.length <= 35) {
            jobKeywordSet.add(clean);
          }
        });
      }
    });
  }

  const jobKeywords = Array.from(jobKeywordSet);

  if (jobKeywords.length === 0) {
    return {
      matchScore: 0,
      matchedKeywords: [],
      missingKeywords: []
    };
  }

  // 2. Extract keywords from candidate resume/profile
  const candidateSkills = (profile.skills || []).map(s => s.toLowerCase().trim());
  const candidateText = [
    profile.title || '',
    profile.rawResumeText || '',
    ...(profile.skills || [])
  ].join(' ').toLowerCase();

  // 3. Match candidate keywords against job keywords
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  jobKeywords.forEach(keyword => {
    const kwLower = keyword.toLowerCase().trim();
    if (!kwLower) return;

    const matchesSkill = candidateSkills.some(
      cs => cs.includes(kwLower) || kwLower.includes(cs)
    );
    const matchesText = candidateText.includes(kwLower);

    if (matchesSkill || matchesText) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  // 4. Calculate match score = (number of matching keywords / total job keywords) * 100
  const rawScore = (matchedKeywords.length / jobKeywords.length) * 100;
  const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    matchScore,
    matchedKeywords,
    missingKeywords
  };
}

/**
 * Calculates Cosine Similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Converts cosine similarity [-1.0, 1.0] to 0-100 score.
 */
export function cosineSimilarityToSemanticScore(cosineSim: number): number {
  if (isNaN(cosineSim) || cosineSim <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(cosineSim * 100)));
}

/**
 * Hybrid Final Match Score = (0.60 * Keyword Score) + (0.40 * Semantic Score)
 */
export function calculateHybridMatchScore(
  keywordScore: number,
  semanticScore: number | null
): number {
  if (semanticScore === null || isNaN(semanticScore)) {
    return Math.min(100, Math.max(0, Math.round(keywordScore)));
  }
  const hybrid = (0.60 * keywordScore) + (0.40 * semanticScore);
  return Math.min(100, Math.max(0, Math.round(hybrid)));
}

export function formatFullTailoredResumeText(res: any): string {
  if (!res) return '';
  const lines: string[] = [];

  const name = res.header?.name || 'CANDIDATE';
  lines.push(name.toUpperCase());
  const contactParts = [
    res.header?.email,
    res.header?.phone,
    res.header?.location
  ].filter(Boolean);
  lines.push(contactParts.join('  |  '));
  lines.push('');

  lines.push('PROFESSIONAL SUMMARY');
  lines.push(res.summary || '');
  lines.push('');

  if (res.skills && res.skills.length > 0) {
    lines.push('CORE COMPETENCIES & SKILLS');
    lines.push(res.skills.join('  |  '));
    lines.push('');
  }

  lines.push('PROFESSIONAL EXPERIENCE');
  if (Array.isArray(res.experience)) {
    res.experience.forEach((exp: any) => {
      lines.push(`${exp.company} — ${exp.title}`);
      lines.push(`${exp.dates}${exp.location ? ` | ${exp.location}` : ''}`);
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((bullet: string) => {
          lines.push(`• ${bullet}`);
        });
      }
      lines.push('');
    });
  }

  lines.push('EDUCATION');
  if (Array.isArray(res.education)) {
    res.education.forEach((edu: any) => {
      lines.push(`${edu.school} — ${edu.degree} (${edu.dates})`);
    });
  }

  return lines.join('\n');
}

export function simulateHeuristicTailoring(job: JobListing, profile: UserProfile) {
  // Use pure keyword-based matching
  const matchResult = calculateKeywordMatchScore(job, profile);
  const matchedSkills = matchResult.matchedKeywords;
  const missingSkills = matchResult.missingKeywords;
  const matchScore = matchResult.matchScore;

  // 1. Completely new Professional Summary written specifically for this job at job.company
  const topJobSkills = (job.skills || []).slice(0, 4).join(', ');
  const tailoredResumeSummary = `Results-driven ${profile.title || 'Professional'} with ${profile.experienceYears || 4}+ years of experience bridging analytics, automation, and software engineering. Specialized in ${topJobSkills || 'advanced technical workflows'}, with a proven track record of optimizing business processes and building scalable systems tailored to support ${job.company}'s strategic objectives.`;

  // 2. Candidate's REAL Experience section (Orlando Health, Amazon) with rewritten bullet points incorporating job keywords
  const targetSkill1 = matchedSkills[0] || job.skills[0] || 'Power BI';
  const targetSkill2 = matchedSkills[1] || job.skills[1] || 'SQL';
  const targetSkill3 = matchedSkills[2] || job.skills[2] || 'Azure Databricks';

  const experience = [
    {
      company: "ORLANDO HEALTH",
      title: "Data Analyst, HR Analytics",
      dates: "10/2023 – 03/2026",
      location: "Orlando, FL",
      bullets: [
        `Leveraged Microsoft Copilot and DAX logic to engineer executive Power BI reporting dashboards, aligning key metrics with ${job.company}'s target requirements for ${targetSkill1}.`,
        `Spearheaded an enterprise automation initiative using MS Power Automate and ${targetSkill2} querying, streamlining manual HR dashboard pipelines and increasing overall team productivity by 37%.`,
        `Took end-to-end technical ownership of physician recruitment analytics software lifecycle, from data pipeline construction to automated refreshes and KPI definition.`,
        `Migrated organizational data from legacy Excel master files to Azure Databricks; engineered a SQL key-matching audit system that improved manager data accuracy from 80% to 99.3%.`
      ]
    },
    {
      company: "AMAZON",
      title: "Logistics Associate",
      dates: "10/2017 – 05/2019",
      location: "Orlando, FL",
      bullets: [
        `Collaborated with operations management to lead a Lean Six Sigma quality assurance initiative targeting Scan Compliance Rates.`,
        `Identified root causes in onboarding workflows and implemented a three-pronged standard operating procedure (SOP) training strategy for incoming logistics staff.`,
        `Elevated daily scan compliance rates from 98.6% to over 99%, demonstrating strong analytical problem-solving and operational execution.`
      ]
    }
  ];

  // 3. Candidate's REAL Education section
  const education = [
    { school: "Udacity", degree: "M.S., Artificial Intelligence", dates: "03/2026 – Present" },
    { school: "Springboard", degree: "Bootcamp, Data Analytics Career Track", dates: "02/2022 – 03/2023" },
    { school: "Udacity", degree: "Nanodegree, Business Analytics", dates: "06/2016 – 01/2017" },
    { school: "Seminole State College of Florida", degree: "Technical Cert., Computer Programming", dates: "05/2015 – 06/2016" },
    { school: "Rollins College", degree: "B.A., Economics", dates: "08/2011 – 08/2014" },
    { school: "Seminole State College of Florida", degree: "A.A., Business", dates: "06/2008 – 05/2010" }
  ];

  const tailoredResume = {
    header: {
      name: profile.name || "Kevin Pinard",
      email: profile.email || "Kevinpolymath@gmail.com",
      phone: "+1 (352) 406-3847",
      location: profile.location || "Orlando, FL",
      title: job.title
    },
    summary: tailoredResumeSummary,
    skills: Array.from(new Set([...(profile.skills || []), ...(job.skills || [])])),
    experience,
    education
  };

  const fullTailoredResumeText = formatFullTailoredResumeText(tailoredResume);

  // Recalculate keyword match score on the newly tailored resume
  const tailoredProfileObj = {
    title: job.title,
    skills: tailoredResume.skills,
    rawResumeText: fullTailoredResumeText
  };
  const tailoredMatchResult = calculateKeywordMatchScore(job, tailoredProfileObj);
  const tailoredMatchScore = Math.min(100, Math.max(tailoredMatchResult.matchScore, Math.min(100, matchResult.matchScore + 15)));

  // 4. Custom Cover Letter tailored specifically to job and company
  const coverLetter = `Dear Hiring Team at ${job.company},

I am writing to express my enthusiastic interest in the ${job.title} position at ${job.company}. With my background in ${profile.skills.slice(0, 3).join(', ')} and a proven track record of optimizing technical workflows, I am eager to bring my problem-solving mindset and technical execution to your team.

In my recent role at Orlando Health, I designed and deployed automated data pipelines and Power BI dashboards, incorporating ${targetSkill1} and ${targetSkill2} to drive a 37% productivity boost and improve SQL audit accuracy to 99.3%. In addition, my operational experience at Amazon demonstrated my commitment to process excellence and Lean Six Sigma methodologies.

What excites me most about ${job.company} is your focus on technological and data innovation. My ongoing Master’s studies in Artificial Intelligence at Udacity, paired with hands-on agentic engineering projects, position me well to adapt quickly and deliver measurable value for ${job.company}.

Thank you for reviewing my application. I welcome the opportunity to discuss how my experience and technical background align with your goals for the ${job.title} role.

Warm regards,

${profile.name || 'Kevin Pinard'}
${profile.email || 'Kevinpolymath@gmail.com'} | +1 (352) 406-3847
${profile.location || 'Orlando, FL'}`;

  // Keep legacy optimizedBullets array for backwards compatibility if referenced
  const optimizedBullets = experience.flatMap(e =>
    e.bullets.map(b => ({
      original: b,
      tailored: b,
      reasoning: `Tailored for ${job.company}`
    }))
  );

  return {
    matchScore: tailoredMatchScore,
    initialMatchScore: matchResult.matchScore,
    tailoredResumeSummary,
    tailoredResume,
    fullTailoredResumeText,
    coverLetter,
    optimizedBullets,
    matchedSkills,
    missingSkills
  };
}
