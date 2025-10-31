import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast";
import './enhanced-styles.css';
import { BrowserRouter } from "react-router-dom";
import { setupMirage } from "./mirage.js";
import { db } from "./db.js";
import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

// AUTO-SEED - Works in development AND production
const shouldSeed = import.meta.env.DEV || 
                   window.location.hostname.includes('vercel.app') || 
                   window.location.hostname === 'localhost';

console.log("🔍 Seeding check:", {
  isDev: import.meta.env.DEV,
  hostname: window.location.hostname,
  shouldSeed
});

if (shouldSeed) {
  setupMirage();

  db.on("ready", async () => {
    try {
      const jobCount = await db.jobs.count();
      
      console.log("📊 Current database state:", {
        jobs: jobCount,
        assessments: await db.assessments.count(),
        candidates: await db.candidates.count()
      });

      if (jobCount === 0) {
        console.log("🌱 Starting database seeding...");

        const stages = ["applied", "screen", "tech", "offer", "hired", "rejected"];
        const tags = ["Remote", "Full-time", "Urgent", "Senior", "Junior", "Contract"];

        // 25 Jobs
        console.log("📝 Creating 25 jobs...");
        for (let i = 0; i < 25; i++) {
          const title = faker.company.catchPhrase();
          await db.jobs.add({
            id: uuidv4(),
            title,
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50),
            status: Math.random() > 0.3 ? "active" : "archived",
            tags: faker.helpers.arrayElements(tags, { min: 0, max: 3 }),
            order: i,
          });
        }

        const jobs = await db.jobs.where("status").equals("active").toArray();
        console.log(`✅ Created ${jobs.length} active jobs`);

        // 1000 Candidates
        console.log("👥 Creating 1000 candidates...");
        const candidateBatch = [];
        for (let i = 0; i < 1000; i++) {
          const job = faker.helpers.arrayElement(jobs);
          candidateBatch.push({
            id: uuidv4(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            jobId: job.id,
            stage: faker.helpers.arrayElement(stages),
          });
        }
        await db.candidates.bulkAdd(candidateBatch);
        console.log("✅ Created 1000 candidates");

        // 5 Assessments with 17 questions each (meeting requirement of 10+)
        console.log("📋 Creating 5 assessments...");
        const assessmentJobs = jobs.slice(0, 5);
        
        for (const job of assessmentJobs) {
          const sections = [
            {
              id: uuidv4(),
              title: "Personal Information",
              questions: [
                { 
                  id: uuidv4(), 
                  type: "short-text", 
                  label: "Full Name", 
                  required: true,
                  maxLength: 100
                },
                { 
                  id: uuidv4(), 
                  type: "short-text", 
                  label: "Phone Number", 
                  required: true,
                  maxLength: 20
                },
                { 
                  id: uuidv4(), 
                  type: "single-choice", 
                  label: "Are you legally eligible to work in this country?", 
                  options: ["Yes", "No", "Require Sponsorship"], 
                  required: true 
                },
                { 
                  id: uuidv4(), 
                  type: "single-choice", 
                  label: "Are you willing to relocate?", 
                  options: ["Yes", "No", "Maybe"], 
                  required: false 
                },
              ],
            },
            {
              id: uuidv4(),
              title: "Professional Background",
              questions: [
                { 
                  id: uuidv4(), 
                  type: "numeric", 
                  label: "Years of Professional Experience", 
                  min: 0, 
                  max: 50, 
                  required: true 
                },
                { 
                  id: uuidv4(), 
                  type: "multi-choice", 
                  label: "Which technologies are you proficient in?", 
                  options: ["React", "Node.js", "Python", "Java", "TypeScript", "Go", "Ruby"], 
                  required: true 
                },
                { 
                  id: uuidv4(), 
                  type: "long-text", 
                  label: "Describe your most challenging project", 
                  maxLength: 1000,
                  required: true
                },
                { 
                  id: uuidv4(), 
                  type: "single-choice", 
                  label: "Preferred work arrangement", 
                  options: ["Remote", "Hybrid", "On-site"], 
                  required: true 
                },
              ],
            },
            {
              id: uuidv4(),
              title: "Technical Assessment",
              questions: [
                { 
                  id: uuidv4(), 
                  type: "single-choice", 
                  label: "Have you worked with microservices architecture?", 
                  options: ["Yes, extensively", "Yes, somewhat", "No, but interested", "No"], 
                  required: true 
                },
                { 
                  id: "q-cloud-" + uuidv4().slice(0, 8),
                  type: "single-choice", 
                  label: "Do you have experience with cloud platforms?", 
                  options: ["Yes", "No"], 
                  required: true 
                },
                { 
                  id: uuidv4(), 
                  type: "multi-choice", 
                  label: "Which cloud platforms have you used?", 
                  options: ["AWS", "Azure", "Google Cloud", "DigitalOcean", "Heroku"],
                  required: false,
                  condition: { questionId: "q-cloud-" + uuidv4().slice(0, 8), value: "Yes" }
                },
                { 
                  id: uuidv4(), 
                  type: "numeric", 
                  label: "Rate your SQL proficiency (1-10)", 
                  min: 1, 
                  max: 10, 
                  required: true 
                },
                { 
                  id: uuidv4(), 
                  type: "short-text", 
                  label: "What is your GitHub username?", 
                  maxLength: 50,
                  required: false 
                },
                { 
                  id: uuidv4(), 
                  type: "file-upload", 
                  label: "Upload your resume/CV",
                  required: false
                },
              ],
            },
            {
              id: uuidv4(),
              title: "Additional Information",
              questions: [
                { 
                  id: uuidv4(), 
                  type: "long-text", 
                  label: "Why do you want to join our company?", 
                  maxLength: 500,
                  required: true
                },
                { 
                  id: uuidv4(), 
                  type: "single-choice", 
                  label: "How did you hear about this position?", 
                  options: ["LinkedIn", "Job Board", "Referral", "Company Website", "Other"], 
                  required: true 
                },
                { 
                  id: uuidv4(), 
                  type: "numeric", 
                  label: "Expected salary (in thousands)", 
                  min: 30, 
                  max: 500, 
                  required: false 
                },
              ],
            },
          ];
          
          const totalQuestions = sections.reduce((sum, sec) => sum + sec.questions.length, 0);
          console.log(`   ✓ Assessment for "${job.title.slice(0, 30)}..." (${job.id.slice(0, 8)}...) → ${totalQuestions} questions`);
          
          await db.assessments.put({ jobId: job.id, sections });
        }

        const finalStats = {
          jobs: await db.jobs.count(),
          candidates: await db.candidates.count(),
          assessments: await db.assessments.count()
        };

        console.log("\n✅ DATABASE SEEDED SUCCESSFULLY!");
        console.log(`   • ${finalStats.jobs} jobs (${jobs.length} active)`);
        console.log(`   • ${finalStats.candidates} candidates`);
        console.log(`   • ${finalStats.assessments} assessments with 17 questions each`);
        
        // Only show alert in production
        if (!import.meta.env.DEV) {
          alert(`✅ Database seeded! ${finalStats.jobs} jobs, ${finalStats.candidates} candidates, ${finalStats.assessments} assessments created.`);
        }
      } else {
        console.log("✓ Database already seeded, skipping...");
        console.log("📊 Current counts:", {
          jobs: await db.jobs.count(),
          candidates: await db.candidates.count(),
          assessments: await db.assessments.count()
        });
      }
    } catch (err) {
      console.error("❌ Seeding failed:", err);
      alert("⚠️ Error seeding database. Check console for details.");
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#10b981',
            color: 'white',
            fontWeight: '500',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
