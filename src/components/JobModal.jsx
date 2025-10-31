import { useState, useEffect } from "react";

export default function JobModal({ job, onSave, onClose }) {
  const [title, setTitle] = useState(job?.title ?? "");
  const [slug, setSlug] = useState(job?.slug ?? "");
  const [status, setStatus] = useState(job?.status ?? "active");
  const [tags, setTags] = useState(job?.tags?.join(", ") ?? "");

  useEffect(() => {
    if (title && !job?.id) {
      const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      setSlug(autoSlug);
    }
  }, [title, job?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      slug,
      status,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    const url = job?.id ? `/api/jobs/${job.id}` : "/api/jobs";
    const method = job?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Save failed");
      return;
    }
    const saved = await res.json();
    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{job?.id ? "Edit" : "Create"} Job</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Title *</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} className="border w-full p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Slug *</label>
            <input required value={slug} onChange={e => setSlug(e.target.value)} className="border w-full p-2 rounded" />
          </div>
          <div>
            <label className="block font-medium">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="border w-full p-2 rounded">
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Tags (comma separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} className="border w-full p-2 rounded" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}