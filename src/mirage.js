import { createServer, Model, Factory, association, RestSerializer } from "miragejs";
import { db } from "./db.js";
import { faker } from "@faker-js/faker";

export function setupMirage() {
  createServer({
    serializers: {
      application: RestSerializer,
    },

    models: {
      job: Model,
      candidate: Model,
      assessment: Model,
    },

    factories: {
      job: Factory.extend({
        title() { return faker.company.catchPhrase(); },
        slug() { return faker.helpers.slugify(this.title).toLowerCase(); },
        status() { return faker.helpers.arrayElement(["active", "archived"]); },
        tags() { return faker.helpers.arrayElements(["Remote", "Full-time", "Urgent", "Senior", "Junior"], { min: 0, max: 3 }); },
        order() { return faker.number.int({ min: 0, max: 100 }); },
      }),
      candidate: Factory.extend({
        name() { return faker.person.fullName(); },
        email() { return faker.internet.email(); },
        stage() { return faker.helpers.arrayElement(["applied", "screen", "tech", "offer", "hired", "rejected"]); },
        jobId() { return faker.string.uuid(); },
      }),
    },

    seeds(server) {
      // No seeds here — we use Dexie auto-seed in main.jsx
    },

    routes() {
      this.namespace = "api";

      // === JOBS ===
      this.get("/jobs", async (schema, request) => {
        const { search = "", status = "", page = 1, pageSize = 10 } = request.queryParams;
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));

        let jobs = await db.jobs.toArray();
        
        // Apply search filter
        if (search) {
          jobs = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));
        }
        
        // Apply status filter
        if (status) {
          jobs = jobs.filter(j => j.status === status);
        }
        
        jobs.sort((a, b) => a.order - b.order);

        const total = jobs.length;
        const start = (page - 1) * pageSize;
        const data = jobs.slice(start, start + pageSize);

        console.log(`📋 GET /jobs - Found ${total} jobs (status: ${status || 'all'}, search: ${search || 'none'})`);

        return { data, total, page: +page, pageSize: +pageSize };
      });

      this.post("/jobs", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        if (Math.random() < 0.05) throw new Error("Failed to create job");

        const attrs = JSON.parse(request.requestBody);
        
        // Check for duplicate slug
        const existing = await db.jobs.where('slug').equals(attrs.slug).first();
        if (existing) {
          return new Response(400, {}, { error: "Slug must be unique" });
        }

        const id = faker.string.uuid();
        const job = { id, ...attrs, order: (await db.jobs.count()) };
        await db.jobs.add(job);
        
        console.log(`✅ POST /jobs - Created job: ${job.title}`);
        return job;
      });

      // 🔥 FIXED: Corrected PATCH endpoint with proper response handling
      this.patch("/jobs/:id", async (schema, request) => {
        const delay = faker.number.int({ min: 100, max: 400 });
        await new Promise(r => setTimeout(r, delay));
        
        // DISABLE error simulation for debugging
        // if (Math.random() < 0.03) {
        //   console.error("❌ PATCH /jobs/:id - Simulated failure");
        //   return new Response(500, {}, { error: "Failed to update job" });
        // }

        const id = request.params.id;
        const changes = JSON.parse(request.requestBody);
        
        console.log(`\n========================================`);
        console.log(`📝 PATCH /jobs/${id}`);
        console.log(`📦 Changes requested:`, JSON.stringify(changes, null, 2));
        
        // CRITICAL: Get the existing job first
        const existingJob = await db.jobs.get(id);
        
        if (!existingJob) {
          console.error(`❌ Job ${id} not found in database`);
          console.log(`========================================\n`);
          return new Response(404, {}, { error: "Job not found" });
        }
        
        console.log(`📌 Current job state:`, JSON.stringify(existingJob, null, 2));
        
        // Check if slug is being updated and if it's unique
        if (changes.slug && changes.slug !== existingJob.slug) {
          const existing = await db.jobs.where('slug').equals(changes.slug).first();
          if (existing && existing.id !== id) {
            console.error(`❌ Slug conflict: ${changes.slug} already exists`);
            console.log(`========================================\n`);
            return new Response(400, {}, { error: "Slug already taken" });
          }
        }
        
        // 🔥 FIX: Create updated job object
        const updatedJob = { 
          ...existingJob, 
          ...changes,
          id: existingJob.id,
          order: existingJob.order
        };
        
        console.log(`🔧 Merged job object:`, JSON.stringify(updatedJob, null, 2));
        
        try {
          // Use transaction for atomic update
          await db.transaction('rw', db.jobs, async () => {
            await db.jobs.put(updatedJob);
          });
          console.log(`✅ Database transaction completed`);
        } catch (err) {
          console.error(`❌ Database put failed:`, err);
          console.log(`========================================\n`);
          return new Response(500, {}, { error: "Database update failed: " + err.message });
        }
        
        // Verify the update by reading it back
        const verifiedJob = await db.jobs.get(id);
        console.log(`🔍 Verified job from DB:`, JSON.stringify(verifiedJob, null, 2));
        
        // Double-check status if it was changed
        if (changes.status) {
          if (verifiedJob.status !== changes.status) {
            console.error(`❌ STATUS MISMATCH! Expected: ${changes.status}, Got: ${verifiedJob.status}`);
            console.log(`🔄 Attempting direct modification...`);
            
            await db.jobs.where('id').equals(id).modify({ status: changes.status });
            const finalVerify = await db.jobs.get(id);
            
            console.log(`🔍 Final verification:`, JSON.stringify(finalVerify, null, 2));
            console.log(`========================================\n`);
            return finalVerify;
          } else {
            console.log(`✅ Status correctly updated to: ${verifiedJob.status}`);
          }
        }
        
        console.log(`✅ PATCH completed successfully`);
        console.log(`========================================\n`);
        
        return verifiedJob;
      });

      this.patch("/jobs/:id/reorder", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        if (Math.random() < 0.1) {
          console.error("❌ Reorder failed (simulated)");
          return new Response(500, {}, { error: "Failed to reorder" });
        }

        const { fromOrder, toOrder } = JSON.parse(request.requestBody);
        const jobs = await db.jobs.toArray();
        const fromJob = jobs.find(j => j.order === fromOrder);
        const toJob = jobs.find(j => j.order === toOrder);

        if (!fromJob || !toJob) {
          return new Response(404, {}, { error: "Jobs not found" });
        }

        await db.jobs.put({ ...fromJob, order: toOrder });
        await db.jobs.put({ ...toJob, order: fromOrder });

        console.log(`✅ Reordered job ${fromJob.id} from ${fromOrder} to ${toOrder}`);
        return { success: true };
      });

      this.get("/jobs/:id", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        const job = await db.jobs.get(request.params.id);
        
        if (!job) {
          return new Response(404, {}, { error: "Job not found" });
        }
        
        return job;
      });

      // === CANDIDATES ===
      this.get("/candidates", async (schema, request) => {
        const { search = "", stage = "" } = request.queryParams;
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));

        let candidates = await db.candidates.toArray();
        
        if (search) {
          const term = search.toLowerCase();
          candidates = candidates.filter(c =>
            c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
          );
        }
        
        if (stage) {
          candidates = candidates.filter(c => c.stage === stage);
        }

        return { data: candidates };
      });

      this.get("/candidates/:id", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        const candidate = await db.candidates.get(request.params.id);
        
        if (!candidate) {
          return new Response(404, {}, { error: "Candidate not found" });
        }
        
        return candidate;
      });

      this.patch("/candidates/:id", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        if (Math.random() < 0.05) {
          return new Response(500, {}, { error: "Failed to move candidate" });
        }

        const id = request.params.id;
        const changes = JSON.parse(request.requestBody);
        
        const existing = await db.candidates.get(id);
        if (!existing) {
          return new Response(404, {}, { error: "Candidate not found" });
        }
        
        await db.candidates.put({ ...existing, ...changes });
        
        if (changes.stage) {
          const stageName = changes.stage.charAt(0).toUpperCase() + changes.stage.slice(1);
          await db.candidateNotes.add({
            candidateId: id,
            text: `Stage changed to **${stageName}**`,
            createdAt: new Date().toISOString()
          });
        }
        
        return await db.candidates.get(id);
      });

      this.get("/candidates/:id/timeline", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        
        const candidateId = request.params.id;
        
        try {
          const notes = await db.candidateNotes
            .where('candidateId')
            .equals(candidateId)
            .toArray();
          
          if (notes.length === 0) {
            const seedNotes = [
              { 
                candidateId, 
                text: "**Applied** via website", 
                createdAt: faker.date.recent({ days: 10 }).toISOString() 
              },
              { 
                candidateId, 
                text: "Moved to *screen* by @HR", 
                createdAt: faker.date.recent({ days: 7 }).toISOString() 
              },
              { 
                candidateId, 
                text: "Tech interview scheduled with @Engineer", 
                createdAt: faker.date.recent({ days: 3 }).toISOString() 
              },
            ];
            
            for (const note of seedNotes) {
              await db.candidateNotes.add(note);
            }
            
            return seedNotes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          }
          
          return notes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } catch (error) {
          console.error("Error fetching timeline:", error);
          return [];
        }
      });

      this.post("/candidates/:id/notes", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        
        if (Math.random() < 0.05) {
          return new Response(500, {}, { error: "Failed to add note" });
        }

        const candidateId = request.params.id;
        const { text, createdAt } = JSON.parse(request.requestBody);
        
        try {
          const noteId = await db.candidateNotes.add({
            candidateId,
            text,
            createdAt: createdAt || new Date().toISOString()
          });
          
          return { success: true, message: "Note added successfully", id: noteId };
        } catch (error) {
          console.error("Error adding note:", error);
          return new Response(500, {}, { error: "Failed to save note to database" });
        }
      });

      // === ASSESSMENTS ===
      this.get("/assessments/:jobId", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        const assessment = await db.assessments.get(request.params.jobId);
        return assessment || { jobId: request.params.jobId, sections: [] };
      });

      this.put("/assessments/:jobId", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        if (Math.random() < 0.05) {
          return new Response(500, {}, { error: "Failed to save assessment" });
        }

        const assessment = JSON.parse(request.requestBody);
        await db.assessments.put(assessment);
        return assessment;
      });

      this.post("/assessments/:jobId/submit", () => {
        return { success: true, message: "Assessment submitted locally" };
      });
    },
  });
}
