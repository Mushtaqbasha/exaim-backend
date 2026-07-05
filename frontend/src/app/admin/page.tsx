"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Search, ChevronDown, Check, FileText, Layers, X, FileSearch, LogOut, ArrowLeft, Trash2, Download } from "lucide-react";
import FuturisticCursor from "../../components/FuturisticCursor";

interface GradedAnswer {
  id: number;
  rollNumber: string;
  marks: number;
  feedback: string;
  detailed_marks?: string; 
}

const STREAMS = [
  {
    category: "BNU - Undergraduate (UG)",
    options: [
      { value: "BCA_BNU", label: "BCA" },
      { value: "BBA_BNU", label: "BBA" },
      { value: "BCOM_BNU", label: "B.Com" },
    ]
  },
  {
    category: "BNU - Postgraduate (PG)",
    options: [
      { value: "MCA_BNU", label: "MCA" },
      { value: "MCOM_BNU", label: "M.Com" },
      { value: "MBA_BNU", label: "MBA" },
    ]
  }
];

export default function AdminPage() {
  const router = useRouter();
  
  const [classStream, setClassStream] = useState("BCA_BNU");
  const [subject, setSubject] = useState("");
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [studentAnswerFiles, setStudentAnswerFiles] = useState<File[]>([]);
  
  const [isGrading, setIsGrading] = useState(false);
  const [gradingProgress, setGradingProgress] = useState({ current: 0, total: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [gradedAnswers, setGradedAnswers] = useState<GradedAnswer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<GradedAnswer | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("exaim_admin_token");
    window.location.href = "/"; 
  };

  useEffect(() => {
    const token = localStorage.getItem("exaim_admin_token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    let animationFrameId: number;

    const fetchHistory = async () => {
      try {
        const res = await axios.get("https://examai-bw1i.onrender.com/api/history");
        setGradedAnswers(res.data);
      } catch (error) {
        console.error("Could not load history", error);
      }
    };
    fetchHistory();

    const handleMove = (e: MouseEvent) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
      });
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mousedown", handleClickOutside);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const submitForGrading = async () => {
    if (!questionPaperFile || studentAnswerFiles.length === 0 || !subject) {
      alert("Please upload the Master Question Paper and at least one Student Answer PDF."); 
      return;
    }
    
    setIsGrading(true);
    setGradingProgress({ current: 0, total: studentAnswerFiles.length });

    for (let i = 0; i < studentAnswerFiles.length; i++) {
      const currentFile = studentAnswerFiles[i];
      setGradingProgress({ current: i + 1, total: studentAnswerFiles.length });

      const extractedRollNumber = currentFile.name.split('_')[0].split('.')[0].toUpperCase();

      const formData = new FormData();
      formData.append("class_stream", classStream);
      formData.append("subject", subject);
      formData.append("roll_number", extractedRollNumber);
      formData.append("question_paper", questionPaperFile);
      formData.append("student_answer", currentFile);

      try {
        const res = await axios.post("https://examai-bw1i.onrender.com/api/grade", formData);
        setGradedAnswers(prev => [{
          id: res.data.id,
          rollNumber: extractedRollNumber,
          marks: res.data.marks_awarded,
          feedback: res.data.feedback,
          detailed_marks: res.data.detailed_marks 
        }, ...prev]);
      } catch (e) { 
        console.error(`Failed to grade ${currentFile.name}`);
      }
    }
    
    setIsGrading(false);
    setStudentAnswerFiles([]); 
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this evaluation? This action cannot be undone and will permanently remove it from the student's portal.");
    
    if (!isConfirmed) return;

    try {
      await axios.delete(`https://examai-bw1i.onrender.com/api/evaluation/${id}`);
      setGradedAnswers(prev => prev.filter(ans => ans.id !== id));
    } catch (error) {
      console.error("Failed to delete evaluation", error);
      alert("Error: Could not delete the evaluation.");
    }
  };

  // --- NEW: CSV EXPORT HANDLER ---
  const exportToCSV = () => {
    if (gradedAnswers.length === 0) {
      alert("No evaluation data to export.");
      return;
    }

    const headers = ["ID", "Roll Number", "Score", "AI Feedback"];
    const csvRows = [headers.join(",")];

    gradedAnswers.forEach(ans => {
      // Escape commas and quotes to ensure formatting doesn't break
      const safeFeedback = `"${ans.feedback.replace(/"/g, '""')}"`;
      csvRows.push(`${ans.id},${ans.rollNumber},${ans.marks},${safeFeedback}`);
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EXAIM_Batch_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredAnswers = gradedAnswers.filter(ans => 
    ans.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentStreamLabel = STREAMS.flatMap(group => group.options).find(opt => opt.value === classStream)?.label || "Select Stream";

  const getParsedDetails = (detailsString?: string) => {
    if (!detailsString) return [];
    try { return JSON.parse(detailsString); } catch { return []; }
  };

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <div className="bg-glow" />
      <FuturisticCursor />

      {/* --- THE BREAKDOWN MODAL --- */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                <div>
                  <h2 className="text-2xl font-black text-emerald-400">Score Breakdown</h2>
                  <p className="text-slate-400 font-mono text-sm mt-1">Student: <span className="text-white">{selectedStudent.rollNumber}</span> | Total: <span className="text-white">{selectedStudent.marks}</span></p>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {getParsedDetails(selectedStudent.detailed_marks).length === 0 ? (
                  <p className="text-slate-500 text-center font-mono py-10">No detailed breakdown available for this evaluation.</p>
                ) : (
                  getParsedDetails(selectedStudent.detailed_marks).map((q: any, i: number) => (
                    <div key={i} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-blue-400">Question {q.q_no}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-black ${q.awarded === q.max ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {q.awarded}
                          </span>
                          <span className="text-slate-600 font-mono text-sm">/ {q.max} marks</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
                        {q.reason}
                      </p>
                      {q.counted === false && (
                        <div className="mt-3 inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs font-bold uppercase tracking-wider">
                          Excluded from Total (Extra Attempt)
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-7xl mx-auto p-8">
        
        {/* --- HEADER --- */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-6">
            <motion.button 
              whileHover={{ x: -3, scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors shadow-lg"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            
            <div>
              <h1 id="hero-title" className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">EXAIM HUB</h1>
              <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-[0.4em]">Autonomous Evaluator v2.0</p>
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 rounded-xl transition-colors font-bold text-xs uppercase tracking-widest self-start"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </motion.button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="relative z-50 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
              <h3 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                01. Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative" ref={dropdownRef}>
                  <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700 outline-none hover:border-blue-500/50 text-sm transition-all">
                    <span className="truncate text-slate-300 font-medium">{currentStreamLabel}</span>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isDropdownOpen ? "rotate-180 text-blue-400" : "text-slate-500"}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {STREAMS.map((group, idx) => (
                            <div key={idx} className="pb-1">
                              <div className="px-4 pt-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky top-0 backdrop-blur-md">{group.category}</div>
                              {group.options.map((stream) => (
                                <button key={stream.value} onClick={() => { setClassStream(stream.value); setIsDropdownOpen(false); }} className="w-full flex items-center justify-between p-3 pl-6 text-sm text-left hover:bg-slate-800 transition-colors">
                                  <span className={classStream === stream.value ? "text-blue-400 font-bold" : "text-slate-400"}>{stream.label}</span>
                                  {classStream === stream.value && <Check className="w-4 h-4 text-blue-400" />}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <input type="text" placeholder="Subject Name" value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 outline-none focus:border-blue-500 text-sm transition-all" />
              </div>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/70 hover:border-blue-500/50 transition-all group">
                <FileText className="w-6 h-6 text-slate-500 mb-2 group-hover:text-blue-400 transition-colors" />
                <p className="text-sm text-slate-400 font-mono">{questionPaperFile ? <span className="text-blue-400 font-bold">{questionPaperFile.name}</span> : "Upload Master Question Paper (PDF)"}</p>
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setQuestionPaperFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
              <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                02. Bulk Evaluation
              </h3>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-4 text-xs text-slate-400 font-mono">
                <span className="text-emerald-400 font-bold">INFO:</span> Name your files with the student's Roll Number (e.g., <span className="text-white">U03CJ21S0015.pdf</span>).
              </div>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/70 hover:border-emerald-500/50 transition-all mb-6 group relative overflow-hidden">
                <Layers className={`w-8 h-8 mb-2 transition-colors ${studentAnswerFiles.length > 0 ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"}`} />
                <p className="text-sm text-slate-400 font-mono text-center px-4">
                  {studentAnswerFiles.length > 0 ? (
                    <span className="text-emerald-400 font-bold text-lg">{studentAnswerFiles.length} files queued</span>
                  ) : "Highlight & Upload Student Answers (PDFs)"}
                </p>
                <input type="file" multiple className="hidden" accept="image/*,application/pdf" onChange={(e) => {
                  if (e.target.files) setStudentAnswerFiles(Array.from(e.target.files));
                }} />
              </label>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submitForGrading} disabled={isGrading || studentAnswerFiles.length === 0} className="w-full bg-emerald-600/90 py-4 rounded-xl font-bold text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:bg-slate-800 disabled:shadow-none transition-all flex justify-center items-center gap-3">
                {isGrading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {`PROCESSING BATCH: ${gradingProgress.current} OF ${gradingProgress.total}...`}
                  </>
                ) : "INITIATE AI BATCH GRADING"}
              </motion.button>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[650px] shadow-2xl relative z-0">
            <div className="p-6 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-bold text-slate-200">Batch Log</h2>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" placeholder="Search Roll No..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-800 text-sm rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200 placeholder:text-slate-600 transition-all shadow-inner" />
                </div>
                {/* --- THE NEW EXPORT BUTTON --- */}
                <button 
                  onClick={exportToCSV}
                  className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 p-2.5 rounded-lg transition-colors flex items-center justify-center"
                  title="Export to CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-950/90 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-4 font-semibold tracking-wider w-1/4">Roll No</th>
                    <th className="p-4 font-semibold tracking-wider w-1/4">Score</th>
                    <th className="p-4 font-semibold tracking-wider w-1/2">AI Summary</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredAnswers.length === 0 ? (
                    <tr><td colSpan={3} className="text-center p-12 text-slate-500 font-mono text-xs">{searchQuery ? "NO MATCHING ROLL NUMBERS FOUND." : "AWAITING FIRST BATCH EVALUATION."}</td></tr>
                  ) : (
                    filteredAnswers.map(ans => (
                      <tr key={ans.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                        <td className="p-4 font-mono text-blue-400 group-hover:text-blue-300">{ans.rollNumber}</td>
                        <td className="p-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-xl font-black text-emerald-500">{ans.marks}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <button onClick={() => setSelectedStudent(ans)} className="text-[10px] uppercase tracking-widest font-bold text-blue-500 hover:text-blue-300 flex items-center gap-1 transition-colors bg-blue-500/10 px-2 py-1 rounded hover:bg-blue-500/20">
                                <FileSearch className="w-3 h-3" /> View
                              </button>
                              <button onClick={() => handleDelete(ans.id)} className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-300 flex items-center gap-1 transition-colors bg-red-500/10 px-2 py-1 rounded hover:bg-red-500/20" title="Delete Evaluation">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[11px] text-slate-400 leading-relaxed pr-8">{ans.feedback}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}