import Dexie from 'dexie'
import { v4 as uuidv4 } from 'uuid'

export const db = new Dexie('TalentFlowDB')

db.version(1).stores({
  jobs: 'id, title, slug, status, order, tags',
  candidates: 'id, name, email, jobId, stage',
  candidateNotes: '++id, candidateId, text, createdAt',
  assessments: 'jobId',
  submissions: '++id, jobId, candidateId, responses, submittedAt'
})

db.jobs.hook('creating', (primKey, obj) => { if (!obj.id) obj.id = uuidv4() })
db.candidates.hook('creating', (primKey, obj) => { if (!obj.id) obj.id = uuidv4() })