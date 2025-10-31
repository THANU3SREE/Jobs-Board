import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

// NEW: Team members for @mentions
const TEAM_MEMBERS = ["@HR", "@Engineer", "@Manager", "@Recruiter", "@Designer"];

export default function CandidateProfile() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [noteText, setNoteText] = useState(""); // NEW: Note input
  const [showMentions, setShowMentions] = useState(false); // NEW: Show mention suggestions
  const [mentionSuggestions, setMentionSuggestions] = useState([]); // NEW: Filtered suggestions
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  // NEW: Fetch both candidate and timeline from API
  async function fetchData() {
    setLoading(true);
    try {
      // Fetch candidate details
      const candidateRes = await fetch(`/api/candidates/${id}`);
      const candidateData = await candidateRes.json();
      setCandidate(candidateData);

      // FIXED: Fetch timeline from API instead of localStorage
      const timelineRes = await fetch(`/api/candidates/${id}/timeline`);
      const timelineData = await timelineRes.json();
      setTimeline(timelineData);
    } catch (err) {
      console.error("Failed to load candidate data:", err);
    } finally {
      setLoading(false);
    }
  }

  // NEW: Handle note text changes and detect @mentions
  const handleNoteChange = (e) => {
    const value = e.target.value;
    setNoteText(value);

    // Detect @ symbol and show suggestions
    const lastWord = value.split(/\s/).pop();
    if (lastWord.startsWith('@')) {
      const query = lastWord.substring(1).toLowerCase();
      const filtered = TEAM_MEMBERS.filter(member => 
        member.toLowerCase().includes(query)
      );
      setMentionSuggestions(filtered);
      setShowMentions(filtered.length > 0);
    } else {
      setShowMentions(false);
    }
  };

  // NEW: Insert mention when clicked
  const insertMention = (mention) => {
    const words = noteText.split(/\s/);
    words[words.length - 1] = mention + ' ';
    setNoteText(words.join(' '));
    setShowMentions(false);
  };

  // NEW: Submit note
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      // Add note to timeline via API (this will trigger the mirage endpoint)
      const res = await fetch(`/api/candidates/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: noteText,
          createdAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        // Refresh timeline
        fetchData();
        setNoteText("");
      }
    } catch (err) {
      console.error("Failed to add note:", err);
      alert("Failed to add note. Please try again.");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!candidate) return <div className="p-6 text-center text-red-600">Candidate not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Candidate Info Card */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h1 className="text-2xl font-bold">{candidate.name}</h1>
        <p className="text-gray-600">{candidate.email}</p>
        <p className="mt-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {candidate.stage}
          </span>
        </p>
      </div>

      {/* NEW: Add Note Section */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Add Note</h2>
        <form onSubmit={handleNoteSubmit} className="relative">
          <textarea
            value={noteText}
            onChange={handleNoteChange}
            placeholder="Type a note... Use @ to mention team members"
            rows={3}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
          
          {/* NEW: Mention suggestions dropdown */}
          {showMentions && (
            <div className="absolute left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-10">
              {mentionSuggestions.map((member, idx) => (
                <div
                  key={idx}
                  onClick={() => insertMention(member)}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                >
                  <span className="font-medium text-blue-600">{member}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-500">
              Tip: Use *text* for emphasis and @name for mentions
            </p>
            <button
              type="submit"
              disabled={!noteText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Add Note
            </button>
          </div>
        </form>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Activity Timeline</h2>
        <div className="space-y-3">
          {timeline.length === 0 ? (
            <p className="text-gray-500">No activity yet.</p>
          ) : (
            timeline.map((entry, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div
                    className="text-sm text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: entry.text
                        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // **bold**
                        .replace(/\*([^*]+)\*/g, '<em>$1</em>') // *italic*
                        .replace(/@(\w+)/g, '<strong class="text-blue-600">@$1</strong>') // @mentions
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}