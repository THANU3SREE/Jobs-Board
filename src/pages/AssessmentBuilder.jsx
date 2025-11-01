import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const questionTypes = [
  { value: "single-choice", label: "Single Choice" },
  { value: "multi-choice", label: "Multi Choice" },
  { value: "short-text", label: "Short Text" },
  { value: "long-text", label: "Long Text" },
  { value: "numeric", label: "Numeric" },
  { value: "file-upload", label: "File Upload" },
];

function PreviewForm({ assessment, responses, setResponses }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const evaluateCondition = (cond, qId) => {
    if (!cond) return true;
    const val = responses[cond.questionId];
    if (Array.isArray(val)) return val.includes(cond.value);
    return val === cond.value;
  };

  const validateField = (q, value) => {
    if (q.required) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return "This field is required";
      }
      if (typeof value === 'string' && !value.trim()) {
        return "This field is required";
      }
    }

    if (q.type === "numeric" && value) {
      const num = Number(value);
      if (isNaN(num)) return "Please enter a valid number";
      if (q.min !== undefined && num < q.min) {
        return `Value must be at least ${q.min}`;
      }
      if (q.max !== undefined && num > q.max) {
        return `Value must be at most ${q.max}`;
      }
    }

    if ((q.type === "short-text" || q.type === "long-text") && value && q.maxLength) {
      if (value.length > q.maxLength) {
        return `Maximum ${q.maxLength} characters allowed`;
      }
    }

    return null;
  };

  const handleBlur = (qId, q) => {
    setTouched(prev => ({ ...prev, [qId]: true }));
    const error = validateField(q, responses[qId]);
    setErrors(prev => ({ ...prev, [qId]: error }));
  };

  const handleChange = (qId, value, q) => {
    setResponses(prev => ({ ...prev, [qId]: value }));
    if (touched[qId]) {
      const error = validateField(q, value);
      setErrors(prev => ({ ...prev, [qId]: error }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    let hasErrors = false;

    assessment.sections.forEach(sec => {
      sec.questions.forEach(q => {
        if (evaluateCondition(q.condition, q.id)) {
          const error = validateField(q, responses[q.id]);
          if (error) {
            newErrors[q.id] = error;
            hasErrors = true;
          }
        }
      });
    });

    setErrors(newErrors);
    setTouched(Object.fromEntries(Object.keys(newErrors).map(k => [k, true])));

    if (hasErrors) {
      alert("Please fix the errors before submitting");
      return;
    }

    alert("Assessment submitted successfully! (This is a preview - no data saved)");
  };

  const renderQuestion = (q) => {
    if (q.condition && !evaluateCondition(q.condition)) return null;

    const error = touched[q.id] ? errors[q.id] : null;
    const value = responses[q.id];

    return (
      <div key={q.id} className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <label className="block font-medium text-gray-800 mb-2">
          {q.label}
          {q.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {q.type === "single-choice" && (
          <div className="space-y-2">
            {q.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={q.id}
                  value={opt}
                  checked={value === opt}
                  onChange={e => handleChange(q.id, e.target.value, q)}
                  onBlur={() => handleBlur(q.id, q)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        )}

        {q.type === "multi-choice" && (
          <div className="space-y-2">
            {q.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt}
                  checked={value?.includes(opt) ?? false}
                  onChange={e => {
                    const arr = value ?? [];
                    const newValue = e.target.checked ? [...arr, opt] : arr.filter(v => v !== opt);
                    handleChange(q.id, newValue, q);
                  }}
                  onBlur={() => handleBlur(q.id, q)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        )}

        {q.type === "short-text" && (
          <div>
            <input
              type="text"
              maxLength={q.maxLength}
              value={value ?? ""}
              onChange={e => handleChange(q.id, e.target.value, q)}
              onBlur={() => handleBlur(q.id, q)}
              placeholder="Your answer"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-500' : ''
              }`}
            />
            {q.maxLength && (
              <p className="text-xs text-gray-500 mt-1">
                {(value?.length || 0)} / {q.maxLength} characters
              </p>
            )}
          </div>
        )}

        {q.type === "long-text" && (
          <div>
            <textarea
              rows={4}
              maxLength={q.maxLength}
              value={value ?? ""}
              onChange={e => handleChange(q.id, e.target.value, q)}
              onBlur={() => handleBlur(q.id, q)}
              placeholder="Your answer"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                error ? 'border-red-500' : ''
              }`}
            />
            {q.maxLength && (
              <p className="text-xs text-gray-500 mt-1">
                {(value?.length || 0)} / {q.maxLength} characters
              </p>
            )}
          </div>
        )}

        {q.type === "numeric" && (
          <div>
            <input
              type="number"
              min={q.min}
              max={q.max}
              value={value ?? ""}
              onChange={e => handleChange(q.id, e.target.value, q)}
              onBlur={() => handleBlur(q.id, q)}
              placeholder="Enter number"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-500' : ''
              }`}
            />
            {(q.min !== undefined || q.max !== undefined) && (
              <p className="text-xs text-gray-500 mt-1">
                Range: {q.min ?? '−∞'} to {q.max ?? '∞'}
              </p>
            )}
          </div>
        )}

        {q.type === "file-upload" && (
          <div>
            <input type="file" disabled className="w-full p-3 border rounded-lg bg-gray-50" />
            <p className="text-xs text-gray-500 mt-1">File upload is a stub – not saved</p>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {assessment.sections.map(sec => (
        <div key={sec.id} className="bg-gray-50 p-6 rounded-xl shadow">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{sec.title}</h3>
          <div className="space-y-4">
            {sec.questions.map(renderQuestion)}
          </div>
        </div>
      ))}
      
      {assessment.sections.length > 0 && (
        <div className="sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500">
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Submit Assessment (Preview)
          </button>
        </div>
      )}
    </form>
  );
}

export default function AssessmentBuilder() {
  const { jobId } = useParams();
  const [assessment, setAssessment] = useState({ jobId, sections: [] });
  const [responses, setResponses] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [optionInput, setOptionInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/assessments/${jobId}`)
      .then(r => r.json())
      .then(data => {
        setAssessment(data);
        setLoading(false);
        console.log("Assessment loaded:", data);
      })
      .catch(err => {
        console.error("Failed to load assessment:", err);
        setLoading(false);
      });
  }, [jobId]);

  const save = async () => {
    try {
      const res = await fetch(`/api/assessments/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assessment)
      });
      if (res.ok) {
        showToast("✅ Assessment saved successfully!");
      } else {
        showToast("❌ Failed to save assessment");
      }
    } catch (err) {
      console.error("Save error:", err);
      showToast("❌ Error saving assessment");
    }
  };

  const addSection = () => {
    const newSec = { id: uuidv4(), title: "New Section", questions: [] };
    setAssessment(prev => ({ ...prev, sections: [...prev.sections, newSec] }));
    setSelectedSection(newSec);
    setSelectedQuestion(null);
    console.log("Section added:", newSec);
  };

  const addQuestion = (type) => {
    if (!selectedSection) {
      alert("Please select a section first!");
      return;
    }

    const newQ = {
      id: uuidv4(),
      type,
      label: "New Question",
      required: false,
      options: type.includes("choice") ? ["Option 1"] : undefined,
    };
    
    setAssessment(prev => {
      const secs = prev.sections.map(s =>
        s.id === selectedSection.id
          ? { ...s, questions: [...s.questions, newQ] }
          : s
      );
      return { ...prev, sections: secs };
    });
    
    setSelectedSection(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQ]
    }));
    
    setSelectedQuestion(newQ);
    console.log("Question added:", newQ);
  };

  const updateQuestion = (field, value) => {
    setAssessment(prev => {
      const secs = prev.sections.map(s =>
        s.id === selectedSection.id
          ? {
              ...s,
              questions: s.questions.map(q =>
                q.id === selectedQuestion.id ? { ...q, [field]: value } : q
              )
            }
          : s
      );
      return { ...prev, sections: secs };
    });
    setSelectedQuestion(prev => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    if (!optionInput.trim()) return;
    const newOption = optionInput.trim();
    if (selectedQuestion.options?.includes(newOption)) {
      alert("Option already exists!");
      return;
    }
    updateQuestion("options", [...(selectedQuestion.options || []), newOption]);
    setOptionInput("");
  };

  const removeOption = (opt) => {
    updateQuestion("options", selectedQuestion.options.filter(o => o !== opt));
  };

  const deleteQuestion = (sectionId, questionId) => {
    if (!confirm("Delete this question?")) return;
    
    setAssessment(prev => {
      const secs = prev.sections.map(s =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter(q => q.id !== questionId) }
          : s
      );
      return { ...prev, sections: secs };
    });
    
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(null);
    }
  };

  const deleteSection = (sectionId) => {
    if (!confirm("Delete this entire section?")) return;
    
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
    
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
      setSelectedQuestion(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex gap-8 max-w-7xl mx-auto">
      {/* Builder */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
        <h2 className="text-2xl font-bold mb-4">Assessment Builder – Job {jobId.slice(0, 8)}...</h2>

        <div className="flex gap-2 mb-6">
          <button 
            onClick={addSection} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            + Section
          </button>
          <button 
            onClick={save} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            💾 Save
          </button>
        </div>

        {assessment.sections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <p className="text-gray-500 mb-4">No sections yet. Click "+ Section" to get started.</p>
          </div>
        ) : null}

        {assessment.sections.map(sec => (
          <div key={sec.id} className="mb-6 border-2 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <input
                value={sec.title}
                onChange={e => {
                  setAssessment(prev => ({
                    ...prev,
                    sections: prev.sections.map(s => s.id === sec.id ? { ...s, title: e.target.value } : s)
                  }));
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-lg font-semibold flex-1 p-2 border-b focus:border-blue-500 outline-none bg-white rounded"
                placeholder="Section Title"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSection(sec.id);
                }}
                className="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
              >
                🗑️ Delete
              </button>
            </div>
            
            {sec.questions.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed rounded">
                No questions yet. Click below to add one.
              </div>
            ) : null}
            
            {sec.questions.map(q => (
              <div
                key={q.id}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Question clicked:", q);
                  setSelectedSection(sec); 
                  setSelectedQuestion(q);
                }}
                className={`p-3 mb-2 rounded cursor-pointer transition border-2 ${
                  selectedQuestion?.id === q.id 
                    ? "bg-blue-100 border-blue-500 ring-2 ring-blue-300 shadow-md" 
                    : "bg-white hover:bg-gray-100 border-gray-300 hover:border-blue-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{q.label}</div>
                    <div className="text-sm text-gray-600">
                      {q.type} {q.options ? `(${q.options.length} options)` : ""} {q.required ? "• Required" : ""}
                    </div>
                    <div className="mt-1">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-500">
                        ID: {q.id.slice(0, 8)}...
                      </code>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteQuestion(sec.id, q.id);
                    }}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("Add question clicked for section:", sec);
                setSelectedSection(sec);
                setSelectedQuestion(null);
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium mt-3 py-2 border-2 border-dashed border-blue-300 rounded hover:bg-blue-50 transition"
            >
              + Add Question to "{sec.title}"
            </button>
          </div>
        ))}

        {selectedSection && !selectedQuestion && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="font-bold mb-3">Add Question to "{selectedSection.title}"</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {questionTypes.map(t => (
                <button
                  key={t.value}
                  onClick={() => addQuestion(t.value)}
                  className="p-3 bg-white rounded border hover:bg-blue-50 transition font-medium"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedQuestion && (
          <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border-2 border-blue-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg">✏️ Edit Question</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">Question ID:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-blue-600">
                    {selectedQuestion.id}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedQuestion.id);
                      showToast("📋 Question ID copied!");
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  showToast("💾 Changes saved!");
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
              >
                💾 Save Question
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Question Label</label>
                <input
                  value={selectedQuestion.label}
                  onChange={e => updateQuestion("label", e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter question text"
                />
              </div>

              {selectedQuestion.type.includes("choice") && (
                <div>
                  <label className="block font-medium mb-1">Options</label>
                  <div className="space-y-2 mb-3">
                    {selectedQuestion.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex-1 p-2 bg-gray-100 rounded">{opt}</span>
                        <button
                          onClick={() => removeOption(opt)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={optionInput}
                      onChange={e => setOptionInput(e.target.value)}
                      onKeyPress={e => e.key === "Enter" && (e.preventDefault(), addOption())}
                      placeholder="Type option and press Enter"
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      onClick={addOption}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {(selectedQuestion.type === "short-text" || selectedQuestion.type === "long-text") && (
                <div>
                  <label className="block font-medium mb-1">Max Length (characters)</label>
                  <input
                    type="number"
                    value={selectedQuestion.maxLength ?? ""}
                    onChange={e => updateQuestion("maxLength", +e.target.value || undefined)}
                    className="w-32 p-2 border rounded"
                    placeholder="No limit"
                  />
                </div>
              )}

              {selectedQuestion.type === "numeric" && (
                <>
                  <div>
                    <label className="block font-medium mb-1">Min Value</label>
                    <input
                      type="number"
                      value={selectedQuestion.min ?? ""}
                      onChange={e => updateQuestion("min", e.target.value ? +e.target.value : undefined)}
                      className="w-32 p-2 border rounded"
                      placeholder="No min"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Max Value</label>
                    <input
                      type="number"
                      value={selectedQuestion.max ?? ""}
                      onChange={e => updateQuestion("max", e.target.value ? +e.target.value : undefined)}
                      className="w-32 p-2 border rounded"
                      placeholder="No max"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required-checkbox"
                  checked={selectedQuestion.required ?? false}
                  onChange={e => updateQuestion("required", e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="required-checkbox" className="cursor-pointer">Required Field</label>
              </div>

              <div>
                <label className="block font-medium mb-1">Conditional Logic (Show only if...)</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      placeholder="Paste Question ID here"
                      value={selectedQuestion.condition?.questionId ?? ""}
                      onChange={e => updateQuestion("condition", { ...selectedQuestion.condition, questionId: e.target.value })}
                      className="flex-1 p-2 border rounded font-mono text-sm"
                    />
                    <input
                      placeholder="Expected Value"
                      value={selectedQuestion.condition?.value ?? ""}
                      onChange={e => updateQuestion("condition", { ...selectedQuestion.condition, value: e.target.value })}
                      className="flex-1 p-2 border rounded"
                    />
                    {selectedQuestion.condition?.questionId && (
                      <button
                        onClick={() => updateQuestion("condition", undefined)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                    <p className="font-medium text-blue-900 mb-1">💡 How it works:</p>
                    <ol className="text-blue-800 space-y-1 ml-4 list-decimal">
                      <li>Click a question above to see its ID</li>
                      <li>Copy the ID and paste it here</li>
                      <li>Enter the value that should trigger this question</li>
                      <li>This question will only show when that condition is met</li>
                    </ol>
                    {selectedQuestion.condition?.questionId && (
                      <p className="mt-2 text-blue-900 font-medium">
                        ✓ This question shows when question <code className="bg-blue-100 px-1 rounded">{selectedQuestion.condition.questionId.slice(0, 8)}...</code> equals "{selectedQuestion.condition.value}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
        <div className="sticky top-0 bg-white pb-4 z-10">
          <h3 className="font-bold text-xl">👁️ Live Preview</h3>
          <p className="text-sm text-gray-600">This is how candidates will see the form</p>
        </div>
        <div className="bg-gray-100 p-6 rounded-xl min-h-96">
          {assessment.sections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Add sections and questions to see preview
            </div>
          ) : (
            <PreviewForm assessment={assessment} responses={responses} setResponses={setResponses} />
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideIn">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{toast}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
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
