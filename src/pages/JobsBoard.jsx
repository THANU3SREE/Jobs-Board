import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import JobModal from "../components/JobModal.jsx";

// NEW: Available tags constant
const AVAILABLE_TAGS = ["Remote", "Full-time", "Urgent", "Senior", "Junior", "Contract"];

function SortableJob({ job, onEdit, onArchive }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-4 rounded shadow cursor-move flex justify-between items-center">
      <div>
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
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(job)} className="text-xs px-2 py-1 bg-blue-100 rounded hover:bg-blue-200 transition">
          Edit
        </button>
        <button onClick={() => onArchive(job)} className="text-xs px-2 py-1 bg-red-100 rounded hover:bg-red-200 transition">
          {job.status === "archived" ? "Unarchive" : "Archive"}
        </button>
      </div>
    </div>
  );
}

export default function JobsBoard() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedTags, setSelectedTags] = useState([]); // NEW: Tags filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // NEW: Track total pages
  const [modalJob, setModalJob] = useState(null);
  const [loading, setLoading] = useState(false); // NEW: Loading state
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
      
      // NEW: Filter by tags on client side (or modify API to support it)
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
      alert("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    load(); 
  }, [search, status, page, selectedTags]); // NEW: Added selectedTags

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
    } catch (err) {
      alert("Reorder failed – rolling back");
      load();
    }
  };

  const handleSave = (savedJob) => {
    setJobs(prev => {
      const idx = prev.findIndex(j => j.id === savedJob.id);
      return idx >= 0 ? prev.map((j, i) => (i === idx ? savedJob : j)) : [...prev, savedJob];
    });
    load(); // Refresh to get updated data
  };

  const handleArchive = async (job) => {
    const newStatus = job.status === "archived" ? "active" : "archived";
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) load();
    } catch (err) {
      console.error("Failed to archive job:", err);
      alert("Failed to update job status.");
    }
  };

  // NEW: Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
    setPage(1); // Reset to first page when filtering
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs Board</h1>
        <button 
          onClick={() => setModalJob({})} 
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          + New Job
        </button>
      </div>

      {/* Filters Section */}
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

        {/* NEW: Tags filter */}
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

      {/* Loading State */}
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

          {/* Pagination */}
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
    </div>
  );
}