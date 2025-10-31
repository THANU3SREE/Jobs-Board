import { createServer, Response } from 'miragejs'
import { db } from '../db.js'

const delay = () => Math.random() * 1000 + 200
const shouldFail = () => Math.random() < 0.07

export function setupMirage() {
  createServer({
    routes() {
      this.namespace = '/api'

      this.get('/jobs', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        const { search = '', status = '', page = 1, pageSize = 10 } = req.queryParams
        let jobs = await db.jobs.toArray()

        if (search) jobs = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()))
        if (status) jobs = jobs.filter(j => j.status === status)

        const total = jobs.length
        const start = (page - 1) * pageSize
        const data = jobs.sort((a, b) => a.order - b.order).slice(start, start + pageSize)

        return { data, total, page: +page, pageSize: +pageSize }
      })

      this.post('/jobs', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        if (shouldFail()) return new Response(500, {}, { error: 'Server error' })

        const attrs = JSON.parse(req.requestBody)
        const existing = await db.jobs.where('slug').equals(attrs.slug).first()
        if (existing) return new Response(400, {}, { error: 'Slug must be unique' })

        attrs.order = await db.jobs.count()
        await db.jobs.add(attrs)
        return attrs
      })

      this.patch('/jobs/:id', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        if (shouldFail()) return new Response(500)

        const id = req.params.id
        const changes = JSON.parse(req.requestBody)
        if (changes.slug) {
          const exists = await db.jobs.where('slug').equals(changes.slug).and(j => j.id !== id).first()
          if (exists) return new Response(400, {}, { error: 'Slug taken' })
        }
        await db.jobs.update(id, changes)
        return await db.jobs.get(id)
      })

      this.patch('/jobs/:id/reorder', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        if (Math.random() < 0.3) return new Response(500, {}, { error: 'Reorder failed' })

        const { fromOrder, toOrder } = JSON.parse(req.requestBody)
        const jobs = await db.jobs.orderBy('order').toArray()

        const fromJob = jobs.find(j => j.order === fromOrder)
        const toJob = jobs.find(j => j.order === toOrder)

        if (!fromJob || !toJob) return new Response(404)

        await db.transaction('rw', db.jobs, async () => {
          await db.jobs.update(fromJob.id, { order: toOrder })
          await db.jobs.update(toJob.id, { order: fromOrder })
        })

        return { success: true }
      })

      this.get('/candidates', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        const { search = '', stage = '', page = 1, pageSize = 50 } = req.queryParams
        let candidates = await db.candidates.toArray()

        if (search) {
          const term = search.toLowerCase()
          candidates = candidates.filter(c =>
            c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
          )
        }
        if (stage) candidates = candidates.filter(c => c.stage === stage)

        const total = candidates.length
        const start = (page - 1) * pageSize
        const data = candidates.slice(start, start + pageSize)

        return { data, total }
      })

      this.post('/candidates', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        if (shouldFail()) return new Response(500)
        const attrs = JSON.parse(req.requestBody)
        attrs.id = uuidv4()
        attrs.stage = 'applied'
        await db.candidates.add(attrs)
        return attrs
      })

      this.patch('/candidates/:id', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        if (shouldFail()) return new Response(500)
        const id = req.params.id
        const changes = JSON.parse(req.requestBody)
        await db.candidates.update(id, changes)

        await db.candidateNotes.add({
          candidateId: id,
          text: `Stage changed to **${changes.stage}**`,
          createdAt: new Date().toISOString()
        })

        return await db.candidates.get(id)
      })

      this.get('/candidates/:id/timeline', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        return await db.candidateNotes.where('candidateId').equals(req.params.id).sortBy('createdAt')
      })

      this.get('/assessments/:jobId', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        const assessment = await db.assessments.get(req.params.jobId)
        return assessment || { jobId: req.params.jobId, sections: [] }
      })

      this.put('/assessments/:jobId', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        if (shouldFail()) return new Response(500)
        const data = JSON.parse(req.requestBody)
        await db.assessments.put(data)
        return data
      })

      this.post('/assessments/:jobId/submit', async (_, req) => {
        await new Promise(r => setTimeout(r, delay()))
        if (shouldFail()) return new Response(500)
        const { candidateId, responses } = JSON.parse(req.requestBody)
        await db.submissions.add({ jobId: req.params.jobId, candidateId, responses, submittedAt: new Date() })
        return { success: true }
      })
    }
  })
}