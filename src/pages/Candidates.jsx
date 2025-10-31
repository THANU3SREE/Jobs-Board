import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVirtualizer } from '@tanstack/react-virtual';

const stages = ["applied", "screen", "tech", "offer", "hired", "rejected"];

// Toast Notification Component
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

export default function Candidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [draggedCandidate, setDraggedCandidate] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const [toast, setToast] = useState(null);
  const [dragStartTime, setDragStartTime] = useState(null);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" or "list"
  
  const parentRef = useRef(null);

  // Virtualization for list view
  const virtualizer = useVirtualizer({
    count: filteredCandidates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Client-side filtering
  useEffect(() => {
    let filtered = candidates;
    
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
      );
    }
    
    if (stageFilter) {
      filtered = filtered.filter(c => c.stage === stageFilter);
    }
    
    setFilteredCandidates(filtered);
  }, [candidates, search, stageFilter]);

  async function fetchCandidates() {
    setLoading(true);
    const res = await fetch(`/api/candidates`);
    const json = await res.json();
    setCandidates(json.data);
    setFilteredCandidates(json.data);
    setLoading(false);
  }

  const handleDragStart = (e, candidate) => {
    setDraggedCandidate(candidate);
    setDragStartTime(Date.now());
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    const column = e.currentTarget;
    const stage = column.getAttribute('data-stage');
    if (stage) {
      setOverStage(stage);
    }
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget === e.target) {
      setOverStage(null);
    }
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    e.stopPropagation();
    
    setOverStage(null);
    
    if (!draggedCandidate || draggedCandidate.stage === targetStage) {
      setDraggedCandidate(null);
      return;
    }

    const fromStage = draggedCandidate.stage;
    const candidateId = draggedCandidate.id;

    // OPTIMISTIC UPDATE
    const updated = candidates.map(c =>
      c.id === candidateId ? { ...c, stage: targetStage } : c
    );
    setCandidates(updated);

    const fromStageName = fromStage.charAt(0).toUpperCase() + fromStage.slice(1);
    const toStageName = targetStage.charAt(0).toUpperCase() + targetStage.slice(1);
    setToast(`${draggedCandidate.name} moved from ${fromStageName} to ${toStageName}`);

    setDraggedCandidate(null);

    // API CALL
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      
      if (!res.ok) throw new Error('Failed to update');
    } catch (err) {
      console.error("Failed to update stage:", err);
      setToast(`Failed to move ${draggedCandidate.name}. Rolling back...`);
      fetchCandidates(); // rollback
    }
  };

  const handleDragEnd = () => {
    setDraggedCandidate(null);
    setOverStage(null);
  };

  const handleCardClick = (e, candidateId) => {
    const dragDuration = Date.now() - (dragStartTime || Date.now());
    if (dragDuration < 200) {
      navigate(`/candidates/${candidateId}`);
    }
    setDragStartTime(null);
  };

  const byStage = {};
  stages.forEach(s => {
    byStage[s] = filteredCandidates.filter(c => c.stage === s);
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Candidates ({filteredCandidates.length})</h1>
          
          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-4 py-2 rounded transition ${
                viewMode === "kanban" ? "bg-white shadow" : "hover:bg-gray-300"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded transition ${
                viewMode === "list" ? "bg-white shadow" : "hover:bg-gray-300"
              }`}
            >
              List (Virtualized)
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Stages</option>
            {stages.map(s => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading candidates...</div>
        ) : viewMode === "kanban" ? (
          // KANBAN VIEW
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stages.map(stage => (
              <div
                key={stage}
                data-stage={stage}
                onDrop={(e) => handleDrop(e, stage)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex-1 bg-gray-50 p-4 rounded-xl min-h-96 border-2 transition-all ${
                  overStage === stage ? "border-blue-500 bg-blue-50 shadow-lg" : "border-gray-300"
                }`}
              >
                <h3 className="font-bold text-sm uppercase text-gray-700 mb-3">
                  {stage.charAt(0).toUpperCase() + stage.slice(1)} ({byStage[stage].length})
                </h3>
                <div className="space-y-2 min-h-32">
                  {byStage[stage].length === 0 ? (
                    <div className="text-gray-400 text-sm text-center py-8">Drop candidates here</div>
                  ) : null}
                  {byStage[stage].map(c => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => handleCardClick(e, c.id)}
                      className={`bg-white p-3 rounded-lg shadow-sm cursor-pointer mb-2 border hover:border-blue-400 transition-all ${
                        draggedCandidate?.id === c.id ? "opacity-30" : ""
                      }`}
                    >
                      <div className="font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-sm text-gray-600 truncate">{c.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // VIRTUALIZED LIST VIEW
          <div 
            ref={parentRef}
            className="bg-white rounded-xl shadow border overflow-auto"
            style={{ height: '600px' }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const candidate = filteredCandidates[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                    className="absolute top-0 left-0 w-full hover:bg-gray-50 cursor-pointer border-b"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{candidate.name}</div>
                        <div className="text-sm text-gray-600">{candidate.email}</div>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {candidate.stage}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </div>

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