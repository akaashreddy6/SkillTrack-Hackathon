export const skills = [
  { name: "HTML & Semantics", shortName: "HTML", level: "Advanced", score: 92, target: 90, focus: "Accessibility + structure" },
  { name: "CSS Layout", shortName: "CSS", level: "Advanced", score: 84, target: 88, focus: "Responsive design systems" },
  { name: "JavaScript", shortName: "JavaScript", level: "Intermediate", score: 68, target: 80, focus: "DOM + async logic" },
  { name: "React", shortName: "React", level: "Intermediate", score: 76, target: 85, focus: "Component architecture" },
  { name: "Java", shortName: "Java", level: "Foundational", score: 52, target: 75, focus: "OOP and classes" },
  { name: "Problem Solving", shortName: "Logic", level: "Strong", score: 80, target: 85, focus: "Logical reasoning" },
];

export const assessments = [
  { id: "frontend", name: "Frontend Fundamentals", skill: "HTML/CSS", score: 92, date: "12 Aug 2026", status: "Passed" },
  { id: "javascript", name: "JavaScript Logic Test", skill: "JavaScript", score: 68, date: "08 Aug 2026", status: "In Review" },
  { id: "react", name: "React Components Quiz", skill: "React", score: 78, date: "03 Aug 2026", status: "Passed" },
  { id: "java", name: "Java OOP Assessment", skill: "Java", score: 57, date: "29 Jul 2026", status: "Needs Review" },
  { id: "design", name: "UX Thinking Challenge", skill: "Design", score: 86, date: "22 Jul 2026", status: "Passed" },
];

export const assessmentQuestions = [
  { id: 1, category: "Variables", text: "Which declaration creates a block-scoped variable that can be reassigned?", options: ["var", "let", "const", "static"], answer: 1 },
  { id: 2, category: "Functions", text: "What does a function return when it has no return statement?", options: ["null", "false", "undefined", "0"], answer: 2 },
  { id: 3, category: "Arrays", text: "Which method creates a new array with items that pass a test?", options: ["forEach", "filter", "reduce", "findIndex"], answer: 1 },
  { id: 4, category: "Async JavaScript", text: "Which keyword pauses an async function until a Promise settles?", options: ["defer", "pause", "await", "yield"], answer: 2 },
  { id: 5, category: "Promises", text: "Which Promise method runs when the Promise is fulfilled?", options: ["catch", "then", "finally", "resolve"], answer: 1 },
  { id: 6, category: "DOM", text: "Which API selects the first element matching a CSS selector?", options: ["getElement", "querySelector", "selectNode", "find"], answer: 1 },
  { id: 7, category: "ES6", text: "Which syntax is used to unpack values from an array?", options: ["Destructuring", "Hoisting", "Coercion", "Chaining"], answer: 0 },
  { id: 8, category: "Objects", text: "What does Object.keys() return?", options: ["Values", "Entries", "A string", "An array of property names"], answer: 3 },
  { id: 9, category: "Events", text: "Which method attaches an event handler without replacing others?", options: ["listen", "on", "addEventListener", "observe"], answer: 2 },
  { id: 10, category: "Modules", text: "Which keyword makes a binding available to other modules?", options: ["share", "export", "public", "expose"], answer: 1 },
];

export const learningResources = [
  { id: 1, title: "JavaScript Advanced Concepts", description: "Build confidence with asynchronous flows, APIs, and modern language patterns.", skill: "JavaScript", level: "Intermediate", progress: 35, time: "6 hours" },
  { id: 2, title: "React Fundamentals", description: "Strengthen component composition, state management, and accessible UI patterns.", skill: "React", level: "Beginner", progress: 70, time: "4 hours" },
  { id: 3, title: "Data Structures", description: "Practice the structures and algorithms used in technical interviews and real products.", skill: "Problem Solving", level: "Intermediate", progress: 20, time: "8 hours" },
];

export const jobs = [
  { id: 1, title: "Frontend Developer", company: "Nova Labs", location: "Remote", experience: "1-3 years", match: 92, skills: ["React", "JavaScript", "CSS"], missing: ["TypeScript"], status: "Not applied" },
  { id: 2, title: "UI Engineer", company: "BrightPath", location: "London / Hybrid", experience: "0-2 years", match: 88, skills: ["HTML", "CSS", "Accessibility"], missing: ["Design systems"], status: "Interview" },
  { id: 3, title: "React Developer", company: "TechFlow", location: "Remote", experience: "2-4 years", match: 84, skills: ["React", "JavaScript", "APIs"], missing: ["Testing"], status: "Shortlisted" },
  { id: 4, title: "Full Stack Intern", company: "SkillNest", location: "On-site", experience: "Entry level", match: 81, skills: ["JavaScript", "React", "Java"], missing: ["SQL"], status: "Not applied" },
];

export const applications = [
  { id: 1, title: "Frontend Developer", company: "Nova Labs", date: "18 Aug 2026", status: "Applied" },
  { id: 2, title: "UI Engineer", company: "BrightPath", date: "14 Aug 2026", status: "Interview" },
  { id: 3, title: "React Developer", company: "TechFlow", date: "10 Aug 2026", status: "Shortlisted" },
];

export const certifications = [
  { name: "HTML Fundamentals", skill: "HTML", score: "92%", date: "12 Aug 2026", status: "Verified" },
  { name: "CSS Advanced", skill: "CSS", score: "84%", date: "05 Aug 2026", status: "Verified" },
  { name: "JavaScript Basics", skill: "JavaScript", score: "78%", date: "28 Jul 2026", status: "Verified" },
];

export const candidateMatches = [
  { name: "Alicia Stone", match: 92, experience: "2 years", score: 82, status: "Review" },
  { name: "Marcus Chen", match: 88, experience: "3 years", score: 79, status: "Shortlisted" },
  { name: "Priya Nair", match: 84, experience: "1 year", score: 76, status: "New" },
];
