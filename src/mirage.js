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

    routes() {
      this.namespace = "api";

      // === JOBS ===
      this.get("/jobs", async (schema, request) => {
        const { search = "", status = "", page = 1, pageSize = 10 } = request.queryParams;
        await new Promise(r => setTimeout(r, 300)); // Reduced delay

        let jobs = await db.jobs.toArray();
        
        if (search) {
          jobs = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));
        }
        
        if (status) {
          jobs = jobs.filter(j => j.status === status);
        }
        
        jobs.sort((a, b) => a.order - b.order);

        const total = jobs.length;
        const start = (page - 1) * pageSize;
        const data = jobs.slice(start, start + pageSize);

        console.log(`📋 GET /jobs - Found ${total} jobs (status: ${status || 'all'})`);
        return { data, total, page: +page, pageSize: +pageSize };
      });

      this.post("/jobs", async (schema, request) => {
        await new Promise(r => setTimeout(r, 300));
        const attrs = JSON.parse(request.requestBody);
        
        const existing = await db.jobs.where('slug').equals(attrs.slug).first();
        if (existing) {
          return new Response(400, {}, { error: "Slug must be unique" });
        }

        const id = faker.string.uuid();
        const job = { id, ...attrs, order: (await db.jobs.count()) };
        await db.jobs.add(job);
        
        console.log(`✅ POST /jobs - Created: ${job.title}`);
        return job;
      });

      // 🔥 CRITICAL: This is the main fix
      this.patch("/jobs/:id", async (schema, request) => {
        await new Promise(r => setTimeout(r, 200)); // Fast response

        const id = request.params.id;
        const changes = JSON.parse(request.requestBody);
        
        console.log(`\n========================================`);
        console.log(`📝 PATCH /api/jobs/${id}`);
        console.log(`📦 Requested changes:`, changes);
        
        // Get existing job
        const existingJob = await db.jobs.get(id);
        
        if (!existingJob) {
          console.error(`❌ Job ${id} not found`);
          console.log(`========================================\n`);
          return new Response(404, {}, { error: "Job not found" });
        }
        
        console.log(`📌 Current status: ${existingJob.status}`);
        
        // Check slug uniqueness if slug is being changed
        if (changes.slug && changes.slug !== existingJob.slug) {
          const existing = await db.jobs.where('slug').equals(changes.slug).first();
          if (existing && existing.id !== id) {
            console.error(`❌ Slug conflict`);
            console.log(`========================================\n`);
            return new Response(400, {}, { error: "Slug already taken" });
          }
        }
        
        // Merge changes
        const updatedJob = { 
          ...existingJob, 
          ...changes
        };
        
        console.log(`🔧 New status will be: ${updatedJob.status}`);
        
        // Update database using transaction
        try {
          await db.transaction('rw', db.jobs, async () => {
            await db.jobs.put(updatedJob);
          });
          console.log(`✅ Database updated`);
        } catch (err) {
          console.error(`❌ Database error:`, err);
          console.log(`========================================\n`);
          return new Response(500, {}, { error: "Database update failed" });
        }
        
        // Verify update
        const verified = await db.jobs.get(id);
        console.log(`🔍 Verified status: ${verified.status}`);
        
        if (verified.status !== changes.status && changes.status) {
          console.error(`❌ VERIFICATION FAILED!`);
          console.error(`   Expected: ${changes.status}`);
          console.error(`   Got: ${verified.status}`);
          console.log(`========================================\n`);
          return new Response(500, {}, { error: "Status verification failed" });
        }
        
        console.log(`✅ PATCH successful`);
        console.log(`========================================\n`);
        
        return verified;
      });

      this.patch("/jobs/:id/reorder", async (schema, request) => {
        await new Promise(r => setTimeout(r, 300));

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
        await new Promise(r => setTimeout(r, 300));
        const job = await db.jobs.get(request.params.id);
        
        if (!job) {
          return new Response(404, {}, { error: "Job not found" });
        }
        
        return job;
      });

      // === CANDIDATES ===
      this.get("/candidates", async (schema, request) => {
        const { search = "", stage = "" } = request.queryParams;
        await new Promise(r => setTimeout(r, 300));

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
        await new Promise(r => setTimeout(r, 300));
        const candidate = await db.candidates.get(request.params.id);
        
        if (!candidate) {
          return new Response(404, {}, { error: "Candidate not found" });
        }
        
        return candidate;
      });

      this.patch("/candidates/:id", async (schema, request) => {
        await new Promise(r => setTimeout(r, 300));

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
        await new Promise(r => setTimeout(r, 300));
        
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
        await new Promise(r => setTimeout(r, 300));

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
          return new Response(500, {}, { error: "Failed to save note" });
        }
      });

      // === ASSESSMENTS ===
      this.get("/assessments/:jobId", async (schema, request) => {
        await new Promise(r => setTimeout(r, 300));
        const assessment = await db.assessments.get(request.params.jobId);
        return assessment || { jobId: request.params.jobId, sections: [] };
      });

      this.put("/assessments/:jobId", async (schema, request) => {
        await new Promise(r => setTimeout(r, 300));

        const assessment = JSON.parse(request.requestBody);
        await db.assessments.put(assessment);
        return assessment;
      });

      this.post("/assessments/:jobId/submit", () => {
        return { success: true, message: "Assessment submitted" };
      });
    },
  });
}

