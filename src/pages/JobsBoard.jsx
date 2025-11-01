import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import JobModal from "../components/JobModal.jsx";
import { db } from "../db.js";

const AVAILABLE_TAGS = ["Remote", "Full-time", "Urgent", "Senior", "Junior", "Contract"];

// ✅ FIXED: Only the drag handle is draggable, not the entire card
function SortableJob({ job, onEdit, onArchive }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded shadow flex justify-between items-center">
      {/* DRAG HANDLE - Only this part is draggable */}
      <div {...attributes} {...listeners} className="cursor-move pr-4 text-gray-400 hover:text-gray-600">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </div>

      {/* Content - NOT draggable */}
      <div className="flex-1">
        <Link to={`/jobs/${job.id}`} className="font-medium text-blue-600 hover:underline">{job.title}</Link>
        <div className="text-sm text-gray-500">
          {job.tags?.length > 0 ? (
            <div className="flex gap-1 mt-1">
              {job.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">No tags</span>
          )}
        </div>
        <div className="mt-1">
          <span className={`text-xs px-2 py-0.5 rounded ${
            job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {job.status === 'active' ? '● Active' : '○ Archived'}
          </span>
        </div>
      </div>

      {/* Buttons - NOT draggable */}
      <div className="flex gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(job);
          }} 
          className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200 transition"
        >
          Edit
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onArchive(job);
          }} 
          className={`text-xs px-2 py-1 rounded transition ${
            job.status === 'archived' 
              ? 'bg-green-100 hover:bg-green-200 text-green-700' 
              : 'bg-red-100 hover:bg-red-200 text-red-700'
          }`}
        >
          {job.status === "archived" ? "✓ Unarchive" : "✕ Archive"}
        </button>
      </div>
    </div>
  );
}

export default function JobsBoard() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalJob, setModalJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const pageSize = 10;

  const sensors = useSensors(
    useSensor(PointerSensor), 
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?search=${search}&status=${status}&page=${page}&pageSize=${pageSize}`);
      const json = await res.json();
      
      let filteredJobs = json.data;
      if (selectedTags.length > 0) {
        filteredJobs = json.data.filter(job => 
          selectedTags.some(tag => job.tags?.includes(tag))
        );
      }
      
      setJobs(filteredJobs);
      setTotalPages(Math.ceil(json.total / pageSize));
    } catch (err) {
      console.error("Failed to load jobs:", err);
      showToast("Failed to load jobs. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  const checkDatabase = async () => {
    console.log(`\n🔍 [DEBUG] Checking IndexedDB directly...`);
    try {
      const allJobs = await db.jobs.toArray();
      console.log(`📊 [DEBUG] Total jobs in DB:`, allJobs.length);
      allJobs.slice(0, 5).forEach((j, i) => {
        console.log(`   ${i + 1}. ${j.title.slice(0, 30)}... (${j.status})`);
      });
    } catch (err) {
      console.error(`❌ [DEBUG] Failed to read DB:`, err);
    }
  };

  useEffect(() => { 
    load();
    setTimeout(checkDatabase, 1000);
  }, [search, status, page, selectedTags]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = jobs.findIndex(j => j.id === active.id);
    const newIdx = jobs.findIndex(j => j.id === over.id);
    const newJobs = arrayMove(jobs, oldIdx, newIdx).map((j, i) => ({ ...j, order: i }));

    setJobs(newJobs);

    try {
      const res = await fetch(`/api/jobs/${active.id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromOrder: jobs[oldIdx].order, toOrder: jobs[newIdx].order })
      });

      if (!res.ok) {
        throw new Error("Reorder failed");
      }
      showToast("Job reordered successfully");
    } catch (err) {
      showToast("Reorder failed – rolling back", "error");
      load();
    }
  };

  const handleSave = (savedJob) => {
    showToast(`Job "${savedJob.title}" saved successfully`);
    load();
  };

  const handleArchive = async (job) => {
    const newStatus = job.status === "archived" ? "active" : "archived";
    const action = newStatus === "archived" ? "archive" : "unarchive";
    
    console.log(`\n🚀 ===== ${action.toUpperCase()} OPERATION =====`);
    console.log(`Job: ${job.title}`);
    console.log(`Current: ${job.status} → Target: ${newStatus}`);
    
    const previousJobs = [...jobs];
    
    // Optimistic UI update
    setJobs(jobs.map(j => 
      j.id === job.id ? { ...j, status: newStatus } : j
    ));
    console.log(`✨ UI updated optimistically`);
    
    try {
      console.log(`📡 Sending PATCH to /api/jobs/${job.id}`);
      
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      console.log(`📡 Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`📦 Result:`, result);
      
      if (result.status !== newStatus) {
        throw new Error(`Status mismatch: got ${result.status}, expected ${newStatus}`);
      }
      
      console.log(`✅ ${action.toUpperCase()} SUCCESSFUL!`);
      showToast(`Job "${job.title}" ${action}d successfully!`);
      
      setTimeout(() => load(), 400);
      
    } catch (error) {
      console.error(`❌ ${action.toUpperCase()} FAILED:`, error.message);
      setJobs(previousJobs);
      showToast(`Failed to ${action} "${job.title}"`, "error");
      setTimeout(() => load(), 500);
    }
    
    console.log(`========================================\n`);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
    setPage(1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs Board</h1>
        <div className="flex gap-2">
          <button 
            onClick={checkDatabase}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm"
          >
            🔍 Debug DB
          </button>
          <button 
            onClick={() => setModalJob({})} 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            + New Job
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <input 
            placeholder="Search title" 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1); }} 
            className="border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-500 outline-none" 
          />
          <select 
            value={status} 
            onChange={e => { setStatus(e.target.value); setPage(1); }} 
            className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
          {AVAILABLE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded text-sm transition ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="px-3 py-1 text-sm text-red-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No jobs found. {selectedTags.length > 0 && "Try clearing filters."}
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {jobs.map(job => (
                  <SortableJob 
                    key={job.id} 
                    job={job} 
                    onEdit={setModalJob} 
                    onArchive={handleArchive} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-6 flex justify-between items-center">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1} 
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={page >= totalPages}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition"
            >
              Next
            </button>
          </div>
        </>
      )}

      {modalJob !== null && (
        <JobModal 
          job={modalJob.id ? modalJob : null} 
          onSave={handleSave} 
          onClose={() => setModalJob(null)} 
        />
      )}

      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        } text-white`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
