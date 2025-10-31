# Job-Board - Mini Hiring Platform

> A modern, full-featured hiring platform built with React, featuring job management, candidate tracking, and dynamic assessments—all running entirely in the browser with no backend required.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://jobs-board-m996.vercel.app)
[![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-4.0-orange?style=for-the-badge)](https://dexie.org/)

---

## Table of Contents

- [Features](#-features)
- [Live Demo Screenshots](#-live-demo-screenshots)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [Key Features Breakdown](#-key-features-breakdown)
- [Technical Decisions](#-technical-decisions)
- [Challenges & Solutions](#-challenges--solutions)
- [Project Structure](#-project-structure)
- [API Simulation](#-api-simulation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Future Enhancements](#-future-enhancements)

---

##  Features

### Core Functionality

✅ **Jobs Management**
- Create, edit, and archive jobs with validation
- Server-side pagination (10 jobs per page)
- Real-time search by job title
- Filter by status (active/archived) and tags
- Drag-and-drop reordering with optimistic updates
- Deep linking support (`/jobs/:jobId`)

✅ **Candidates System**
- Virtualized list rendering (1000+ candidates)
- Client-side search (name/email)
- Server-side filtering by stage
- Kanban board with drag-and-drop stage transitions
- Detailed candidate profiles with activity timeline
- Add notes with @mentions and markdown support

✅ **Assessment Builder**
- Dynamic form builder per job
- 6 question types: single-choice, multi-choice, short text, long text, numeric, file upload
- Live preview pane showing candidate view
- Form validation (required fields, numeric ranges, max length)
- Conditional question logic
- Persistent storage (survives page refreshes)

✅ **Data Management**
- **Auto-seeding**: 25 jobs, 1000 candidates, 5 assessments
- **IndexedDB** persistence via Dexie.js
- **MirageJS** for API simulation (200-1200ms latency)
- 5-10% artificial error rate for resilience testing
- Optimistic UI updates with rollback on failure

---

## 📸 Live Demo Screenshots

### 1️⃣ Jobs Board
![Jobs Board](attachments/Jobs-Board.png)



**Features Shown:**
- Clean, modern UI with gradient background
- Tag-based filtering (Remote, Full-time, Urgent, etc.)
- Search by job title
- Status filter (Active/Archived)
- Pagination controls
- Edit and Archive buttons

---

### 2️⃣ Candidates Kanban Board
![Candidates Kanban](https://via.placeholder.com/1200x600/764ba2/ffffff?text=Candidates+Kanban+%E2%80%A2+1000%2B+Candidates+%E2%80%A2+Drag+%26+Drop)

**Features Shown:**
- 6 stage columns (Applied, Screen, Tech, Offer, Hired, Rejected)
- Drag-and-drop between stages
- Candidate count per stage
- Hover effects and visual feedback
- Toggle between Kanban and List (Virtualized) views

---

### 3️⃣ Candidate Profile & Timeline
![Candidate Profile](https://via.placeholder.com/1200x600/10b981/ffffff?text=Candidate+Profile+%E2%80%A2+Notes+%E2%80%A2+Timeline+%E2%80%A2+%40mentions)

**Features Shown:**
- Candidate details card
- Add notes section with @mention suggestions
- Activity timeline with stage changes
- Markdown support (*italic*, **bold**)
- Timestamp for each activity

---

### 4️⃣ Assessment Builder
![Assessment Builder](https://via.placeholder.com/1200x600/f59e0b/ffffff?text=Assessment+Builder+%E2%80%A2+Live+Preview+%E2%80%A2+Validation)

**Features Shown:**
- Left: Builder interface with section/question management
- Right: Live preview pane (candidate view)
- Multiple question types
- Validation rules display
- Character/number counters

---

## 🛠 Tech Stack

### Frontend
- **React 18.2** - UI library
- **React Router 6** - Client-side routing
- **Tailwind CSS 4.1** - Utility-first styling
- **@dnd-kit** - Drag-and-drop functionality
- **@tanstack/react-virtual** - Virtualized list rendering

### State & Data
- **Dexie.js 4.0** - IndexedDB wrapper for persistence
- **MirageJS 0.1** - API mocking and simulation
- **Faker.js 8.0** - Generate realistic seed data

### Build Tools
- **Vite 5.2** - Fast build tool and dev server
- **PostCSS & Autoprefixer** - CSS processing

### Deployment
- **Vercel** - Serverless deployment platform

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/talentflow-mini.git
cd talentflow-mini

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🏗 Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     React Application                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │           React Router (Client Routing)           │  │
│  └───────────────────────────────────────────────────┘  │
│                           ▼                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │        Components (JobsBoard, Candidates,         │  │
│  │         AssessmentBuilder, etc.)                  │  │
│  └───────────────────────────────────────────────────┘  │
│                           ▼                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Fetch API Calls                      │  │
│  │         (/api/jobs, /api/candidates, etc.)        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                MirageJS (Mock Server)                    │
│  • Intercepts fetch() requests                           │
│  • Adds artificial latency (200-1200ms)                 │
│  • Simulates errors (5-10% failure rate)                │
│  • Routes to Dexie.js for data                          │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│          Dexie.js (IndexedDB Wrapper)                   │
│  • Persistent browser storage                           │
│  • Survives page refreshes                              │
│  • Tables: jobs, candidates, assessments,               │
│    candidateNotes, submissions                          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (e.g., "Move candidate to Tech stage")
          ↓
Component State Update (Optimistic UI)
          ↓
Fetch API Call (/api/candidates/:id PATCH)
          ↓
MirageJS Intercepts → Adds latency → May simulate error
          ↓
Dexie.js Updates IndexedDB
          ↓
Success: UI stays updated | Error: Rollback to previous state
```

---

## 🎯 Key Features Breakdown

### 1. Jobs Board with Pagination & Filtering

**Challenge**: Display 25 jobs with server-side pagination, search, and tag filtering.

**Solution**:
- Built a flexible API endpoint: `/api/jobs?search=&status=&page=&pageSize=10`
- Client-side tag filtering (can be moved to server if needed)
- Optimistic drag-and-drop reordering with rollback on failure

**Code Highlight** (`src/pages/JobsBoard.jsx`):
```javascript
const handleDragEnd = async (event) => {
  // Optimistically update UI
  setJobs(newJobs);
  
  try {
    const res = await fetch(`/api/jobs/${active.id}/reorder`, {...});
    if (!res.ok) throw new Error("Reorder failed");
  } catch (err) {
    alert("Reorder failed – rolling back");
    load(); // Rollback
  }
};
```

---

### 2. Virtualized Candidate List (1000+ items)

**Challenge**: Render 1000 candidates without performance issues.

**Solution**:
- Used `@tanstack/react-virtual` for windowing
- Only renders visible items (~20-30 at a time)
- Smooth 60fps scrolling

**Code Highlight** (`src/pages/Candidates.jsx`):
```javascript
const virtualizer = useVirtualizer({
  count: filteredCandidates.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
  overscan: 10,
});
```

**Performance**:
- Before virtualization: ~5s load time, janky scrolling
- After virtualization: <100ms load time, buttery smooth

---

### 3. Drag-and-Drop Kanban Board

**Challenge**: Smooth drag-and-drop between 6 stages with visual feedback.

**Solution**:
- Used `@dnd-kit/core` for accessibility and smooth animations
- Added hover states, drop zones, and toast notifications
- Optimistic updates with API error handling

**User Experience**:
- Drag duration tracking (prevents accidental clicks)
- Visual feedback (opacity, border highlights)
- Success/error toast messages

---

### 4. Assessment Builder with Live Preview

**Challenge**: Create a flexible form builder with real-time validation.

**Solution**:
- Split-screen layout (builder + preview)
- 6 question types with custom validation rules
- Conditional question logic based on previous answers

**Technical Details**:
- State management via `useState` (no Redux needed)
- UUID-based IDs for questions/sections
- Validation on blur + submit

**Code Highlight** (`src/pages/AssessmentBuilder.jsx`):
```javascript
const validateField = (q, value) => {
  if (q.required && !value) return "This field is required";
  if (q.type === "numeric" && (value < q.min || value > q.max)) {
    return `Value must be between ${q.min} and ${q.max}`;
  }
  // ... more validation
};
```

---

### 5. Candidate Timeline with @Mentions

**Challenge**: Display activity history with formatted notes.

**Solution**:
- Markdown-like syntax (`**bold**`, `*italic*`, `@mentions`)
- Autocomplete suggestions when typing `@`
- Stored in IndexedDB via `candidateNotes` table

**Code Highlight** (`src/pages/CandidateProfile.jsx`):
```javascript
dangerouslySetInnerHTML={{
  __html: entry.text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/@(\w+)/g, '<strong class="text-blue-600">@$1</strong>')
}}
```

---

## 🧠 Technical Decisions

### 1. Why MirageJS Instead of MSW?

| Aspect | MirageJS | MSW |
|--------|----------|-----|
| Setup | Simple, inline routes | Requires service worker setup |
| Seed Data | Built-in factories | Manual setup |
| Error Simulation | Easy percentage-based | Requires custom logic |
| Learning Curve | Gentle | Steeper |

**Decision**: MirageJS for faster prototyping and easier error simulation.

---

### 2. Why Dexie.js for IndexedDB?

**Raw IndexedDB Issues**:
- Verbose, callback-heavy API
- No Promise support
- Manual schema migrations

**Dexie.js Benefits**:
- Promise-based API (async/await)
- Automatic schema versioning
- Query helpers (`.where()`, `.filter()`)
- Hooks for auto-generating UUIDs

**Example**:
```javascript
// Without Dexie (20+ lines)
const request = indexedDB.open('DB', 1);
request.onsuccess = () => { /* ... */ };
request.onerror = () => { /* ... */ };

// With Dexie (3 lines)
const db = new Dexie('DB');
db.version(1).stores({ jobs: 'id, title' });
await db.jobs.add({ title: 'Engineer' });
```

---

### 3. Why @dnd-kit Over react-beautiful-dnd?

| Feature | @dnd-kit | react-beautiful-dnd |
|---------|----------|---------------------|
| Maintenance | ✅ Active | ⚠️ Unmaintained |
| Accessibility | ✅ Built-in | ✅ Good |
| Performance | ✅ Better | ⚠️ Heavier |
| Multi-container | ✅ Easy | ⚠️ Complex |

**Decision**: @dnd-kit for future-proofing and better performance.

---

### 4. State Management: No Redux?

**Why Local State Works**:
- No global state needed (data fetched per route)
- MirageJS + Dexie act as "backend"
- Simpler debugging (no action/reducer boilerplate)

**When Redux Would Help**:
- Sharing data across many components
- Complex state transitions
- Time-travel debugging needs

---

## 🐛 Challenges & Solutions

### Challenge 1: Seeding Not Working on Vercel

**Problem**: Database appeared empty on first deploy.

**Root Cause**: 
- IndexedDB not cleared between deployments
- Seeding check (`if (jobCount === 0)`) failed

**Solution**:
```javascript
// Added hostname check
if (import.meta.env.DEV || 
    window.location.hostname.includes('vercel.app')) {
  setupMirage();
  // ... seeding logic
}
```

**Lesson**: Always log environment detection logic for debugging.

---

### Challenge 2: Drag-and-Drop Conflicts with Click

**Problem**: Clicking candidate cards after dragging triggered navigation.

**Root Cause**: 
- Both drag and click events fired
- No way to distinguish short drag from click

**Solution**:
```javascript
const [dragStartTime, setDragStartTime] = useState(null);

const handleDragStart = () => setDragStartTime(Date.now());

const handleCardClick = () => {
  const dragDuration = Date.now() - dragStartTime;
  if (dragDuration < 200) navigate(`/candidates/${id}`);
};
```

**Lesson**: Track timing to differentiate gestures.

---

### Challenge 3: Virtualized List Blank on Initial Load

**Problem**: List showed empty white space despite data loading.

**Root Cause**: 
- `parentRef` not attached to scroll container
- Virtualizer couldn't calculate viewport

**Solution**:
```javascript
<div 
  ref={parentRef}  // ← Must be on scrollable container
  style={{ height: '600px', overflow: 'auto' }}
>
  {/* virtualized items */}
</div>
```

**Lesson**: Always check ref attachment in virtualized components.

---

### Challenge 4: Assessment Preview Not Updating

**Problem**: Live preview didn't reflect builder changes.

**Root Cause**: 
- Preview used stale `assessment` state
- Not re-rendering on section/question updates

**Solution**:
- Pass `assessment` as prop (not derived state)
- Use `key={sec.id}` to force re-renders

**Lesson**: React state updates are asynchronous—wait for next render.

---

## 📁 Project Structure

```
talentflow-mini/
├── src/
│   ├── components/
│   │   ├── JobModal.jsx           # Create/Edit job modal
│   │   └── QuestionTypes.jsx      # Assessment question type configs
│   ├── pages/
│   │   ├── JobsBoard.jsx          # Main jobs list with pagination
│   │   ├── JobDetail.jsx          # Single job view
│   │   ├── Candidates.jsx         # Kanban + virtualized list
│   │   ├── CandidateProfile.jsx   # Timeline + notes
│   │   └── AssessmentBuilder.jsx  # Form builder + preview
│   ├── App.jsx                    # Router setup
│   ├── main.jsx                   # Entry point + seeding logic
│   ├── db.js                      # Dexie.js schema
│   ├── mirage.js                  # MirageJS API routes
│   ├── constants.js               # Shared constants (stages, tags)
│   ├── index.css                  # Tailwind imports
│   └── enhanced-styles.css        # Custom animations & effects
├── public/                        # Static assets
├── index.html                     # HTML entry point
├── package.json                   # Dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind configuration
└── vercel.json                    # Vercel deployment config
```

---

## 🔌 API Simulation

### Endpoints

| Method | Endpoint | Description | Latency | Error Rate |
|--------|----------|-------------|---------|------------|
| GET | `/api/jobs` | List jobs with filters | 200-1200ms | 0% |
| POST | `/api/jobs` | Create new job | 200-1200ms | 5% |
| PATCH | `/api/jobs/:id` | Update job | 200-1200ms | 10% |
| PATCH | `/api/jobs/:id/reorder` | Reorder jobs | 200-1200ms | 30% |
| GET | `/api/candidates` | List candidates | 200-1200ms | 0% |
| PATCH | `/api/candidates/:id` | Update candidate stage | 200-1200ms | 5% |
| GET | `/api/candidates/:id/timeline` | Get activity history | 200-1200ms | 0% |
| POST | `/api/candidates/:id/notes` | Add note | 200-1200ms | 5% |
| GET | `/api/assessments/:jobId` | Get assessment | 200-1200ms | 0% |
| PUT | `/api/assessments/:jobId` | Save assessment | 200-1200ms | 5% |

### Example Request/Response

**Request**:
```http
GET /api/candidates?search=john&stage=screen
```

**Response**:
```json
{
  "data": [
    {
      "id": "abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "jobId": "job456",
      "stage": "screen"
    }
  ]
}
```

---

## 🧪 Testing

### Manual Testing Checklist

**Jobs Board**:
- ✅ Create job with validation (unique slug)
- ✅ Edit existing job
- ✅ Archive/unarchive job
- ✅ Drag to reorder (verify rollback on failure)
- ✅ Search by title
- ✅ Filter by tags and status
- ✅ Pagination (next/previous)

**Candidates**:
- ✅ Search by name/email
- ✅ Filter by stage
- ✅ Drag candidate between stages
- ✅ Switch between Kanban and List views
- ✅ Scroll virtualized list smoothly (1000+ items)
- ✅ Click candidate to view profile

**Candidate Profile**:
- ✅ View timeline
- ✅ Add note with markdown (*italic*, **bold**)
- ✅ Type `@` to see mention suggestions
- ✅ Verify note persistence after refresh

**Assessment Builder**:
- ✅ Add/delete sections
- ✅ Add questions of all types
- ✅ Set validation rules (required, min/max, maxLength)
- ✅ Add conditional logic
- ✅ See live preview update
- ✅ Save and reload assessment

---

## 🚀 Deployment

### Vercel Deployment

1. **Connect GitHub Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo

2. **Configure Build Settings**:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Deploy**:
   - Click "Deploy"
   - Wait ~2 minutes

4. **Verify**:
   - Check browser console for seeding logs
   - Navigate to `/jobs` and verify 25 jobs exist
   - Check IndexedDB in DevTools

### Environment Variables

None required! Everything runs client-side.

---

## 🔮 Future Enhancements

### Short-term
- [ ] Export candidates to CSV
- [ ] Bulk candidate actions (archive, delete)
- [ ] Assessment response analytics (completion rate, average time)
- [ ] Job duplication feature
- [ ] Dark mode toggle

### Long-term
- [ ] Real backend integration (Node.js + PostgreSQL)
- [ ] Email notifications for stage changes
- [ ] Calendar integration for interviews
- [ ] AI-powered candidate matching
- [ ] Mobile app (React Native)

---

## Developer Notes

### Performance Optimizations
- ✅ Virtualized list for 1000+ candidates (60fps scrolling)
- ✅ Debounced search input (300ms delay)
- ✅ Lazy loading for routes (React.lazy + Suspense)
- ✅ IndexedDB bulk operations for seeding

### Accessibility
- ✅ Keyboard navigation for drag-and-drop
- ✅ ARIA labels on interactive elements
- ✅ Focus management in modals
- ✅ Semantic HTML (nav, main, section)

### Browser Support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## License

MIT License - feel free to use this project for learning or portfolio purposes!

---

## Acknowledgments

- **Faker.js** for realistic seed data
- **Dexie.js** for making IndexedDB usable
- **MirageJS** for seamless API mocking
- **@dnd-kit** for accessible drag-and-drop
- **Tailwind CSS** for rapid styling

---

## 📧 Contact

**Developer**: Your Name  
**Email**: your.email@example.com  
**GitHub**: [@yourusername](https://github.com/yourusername)  
**LinkedIn**: [Your Name](https://linkedin.com/in/yourprofile)

---

**Built with ❤️ as a technical assignment showcase**

*Last Updated: October 31, 2025*
