import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    fetch(`/api/jobs/${id}`).then(r => r.json()).then(setJob);
  }, [id]);

  if (!job) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
      <p className="text-sm text-gray-600 mb-2">Slug: <code>{job.slug}</code></p>
      <p className="mb-4">Status: <span className={`px-2 py-1 rounded text-xs ${job.status === "active" ? "bg-green-100" : "bg-gray-100"}`}>{job.status}</span></p>
      {job.tags?.length ? <p className="mb-4">Tags: {job.tags.join(", ")}</p> : null}
      <Link to={`/assessments/${job.id}`} className="inline-block px-4 py-2 bg-blue-600 text-white rounded">
        Open Assessment Builder
      </Link>
    </div>
  );
}