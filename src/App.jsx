import { Routes, Route, NavLink } from 'react-router-dom'
import JobsBoard from './pages/JobsBoard.jsx'
import JobDetail from './pages/JobDetail.jsx'
import Candidates from './pages/Candidates.jsx'
import CandidateProfile from './pages/CandidateProfile.jsx'
import AssessmentBuilder from './pages/AssessmentBuilder.jsx'

export default function App() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-6 text-sm">
          <NavLink to="/jobs" className={({ isActive }) => isActive ? 'font-bold text-blue-600' : 'text-gray-700'}>Jobs</NavLink>
          <NavLink to="/candidates" className={({ isActive }) => isActive ? 'font-bold text-blue-600' : 'text-gray-700'}>Candidates</NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<JobsBoard />} />
        <Route path="/jobs" element={<JobsBoard />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/candidates/:id" element={<CandidateProfile />} />
        <Route path="/assessments/:jobId" element={<AssessmentBuilder />} />
      </Routes>
    </div>
  )
}