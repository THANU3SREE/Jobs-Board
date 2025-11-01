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

      this.patch("/jobs/:id", async (schema, request) => {
        await new Promise(r => setTimeout(r, faker.number.int({ min: 200, max: 1200 })));
        if (Math.random() < 0.1) {
          console.error("❌ PATCH /jobs/:id - Simulated failure");
          return new Response(500, {}, { error: "Failed to update job" });
        }

        const id = request.params.id;
        const attrs = JSON.parse(request.requestBody);
        
        console.log(`📝 PATCH /jobs/${id} - Updating with:`, attrs);
        
        // Check if slug is being updated and if it's unique
        if (attrs.slug) {
          const existing = await db.jobs.where('slug').equals(attrs.slug).first();
          if (existing && existing.id !== id) {
            console.error(`❌ Slug conflict: ${attrs.slug} already exists`);
            return new Response(400, {}, { error: "Slug already taken" });
          }
        }
        
        // CRITICAL FIX: Actually update the database
        const updatedCount = await db.jobs.update(id, attrs);
        
        if (updatedCount === 0) {
          console.error(`❌ Failed to update job ${id} - job not found`);
          return new Response(404, {}, { error: "Job not found" });
        }
        
        const updatedJob = await db.jobs.get(id);
        console.log(`✅ PATCH /jobs/${id} - Successfully updated:`, updatedJob);
        
        return updatedJob;
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

        await db.jobs.update(fromJob.id, { order: toOrder });
        await db.jobs.update(toJob.id, { order: fromOrder });

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
        
        await db.candidates.update(id, changes);
        
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
