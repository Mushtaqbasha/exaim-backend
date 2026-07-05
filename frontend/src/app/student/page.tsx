"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { LogOut, Calendar, FileSearch, X, Award, ArrowLeft, Trophy, Target, BarChart3, Activity, TableProperties } from "lucide-react";
import FuturisticCursor from "../../components/FuturisticCursor";

interface Evaluation {
  id: number;
  class_stream: string;
  subject: string;
  marks: number;
  feedback: string;
  detailed_marks?: string;
  timestamp: string;
}

function StudentDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const rollNumber = searchParams.get("roll");
  const studentName = searchParams.get("name");

  const [results, setResults] = useState<Evaluation[]>([]);
  const [selectedResult, setSelectedResult] = useState<Evaluation | null>(null);
  
  // Tab State for Assessments
  const [activeAssessment, setActiveAssessment] = useState<"assessment1" | "assessment2" | "finals">("assessment1");

  useEffect(() => {
    if (!rollNumber) {
      router.push("/"); 
      return;
    }
    const fetchResults = async () => {
      try {
        const res = await axios.get(`https://examai-bw1i.onrender.com/api/student/results/${rollNumber}`);
        setResults(res.data);
      } catch (error) {
        console.error("Could not fetch student results", error);
      }
    };
    fetchResults();
  }, [rollNumber, router]);

  const handleLogout = () => {
    window.close();
    router.push("/"); 
  };

  const getParsedDetails = (detailsString?: string) => {
    if (!detailsString) return [];
    try { return JSON.parse(detailsString); } catch { return []; }
  };

  // --- DYNAMIC MARKS CALCULATION ---
  // Helper to dynamically calculate the maximum marks for a specific subject based on the AI's breakdown
  const getSubjectMax = (evalRecord: Evaluation) => {
    const details = getParsedDetails(evalRecord.detailed_marks);
    let max = 0;
    if (details && details.length > 0) {
      details.forEach((q: any) => {
        // Only sum max marks for questions that are officially counted
        if (q.counted !== false) {
          max += (Number(q.max) || 0);
        }
      });
    }
    // Fallback to 30 if parsing fails or breakdown is empty, as per your structure
    return max > 0 ? max : 30; 
  };

  // For the demo, we map the fetched results to Assessment 1
  const displayedResults = activeAssessment === "assessment1" ? results : [];

  // Calculate totals for the currently selected assessment tab
  let calculatedTotalMarks = 0;
  let calculatedMaxMarks = 0;

  displayedResults.forEach(res => {
    calculatedTotalMarks += res.marks;
    calculatedMaxMarks += getSubjectMax(res);
  });

  const percentage = calculatedMaxMarks > 0 ? Math.round((calculatedTotalMarks / calculatedMaxMarks) * 100) : 0;
  const estimatedRank = percentage >= 90 ? "#4 (Distinction)" : percentage >= 75 ? "#34 (Excellent)" : percentage >= 60 ? "#82 (Good)" : "Evaluating...";

  return (
    <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8">
      
      {/* --- THE BREAKDOWN MODAL --- */}
      <AnimatePresence>
        {selectedResult && (
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
                  <p className="text-slate-400 font-mono text-sm mt-1">{selectedResult.subject} | Total: <span className="text-white">{selectedResult.marks} / {getSubjectMax(selectedResult)}</span></p>
                </div>
                <button onClick={() => setSelectedResult(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {getParsedDetails(selectedResult.detailed_marks).length === 0 ? (
                  <p className="text-slate-500 text-center font-mono py-10">No detailed breakdown available for this evaluation.</p>
                ) : (
                  getParsedDetails(selectedResult.detailed_marks).map((q: any, i: number) => {
                    const isGrace = q.q_no === "GRACE";
                    
                    return (
                    <div key={i} className={`bg-slate-950/50 border rounded-2xl p-5 transition-all ${isGrace ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-amber-500/5' : 'border-slate-800 hover:border-emerald-500/30'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`font-bold flex items-center gap-2 ${isGrace ? 'text-amber-400 text-lg uppercase tracking-wider' : 'text-blue-400'}`}>
                          {isGrace ? <><Award className="w-5 h-5 text-amber-500"/> Empathetic Grace Marks</> : `Question ${q.q_no}`}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-black ${isGrace ? 'text-amber-400' : q.awarded === q.max ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isGrace ? `+${q.awarded}` : q.awarded}
                          </span>
                          <span className="text-slate-600 font-mono text-sm">/ {q.max} marks</span>
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed p-3 rounded-xl border ${isGrace ? 'bg-amber-950/30 text-amber-200/80 border-amber-500/20' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                        {q.reason}
                      </p>
                      {q.counted === false && (
                        <div className="mt-3 inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-xs font-bold uppercase tracking-wider">
                          Excluded from Total (Extra Attempt)
                        </div>
                      )}
                    </div>
                  )})
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-5">
          <motion.button 
            whileHover={{ x: -3, scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => window.close()}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors shadow-inner"
            title="Close Tab"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-3">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{studentName || "Student"}</span>
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" /> Roll No: <span className="text-white font-bold">{rollNumber}</span>
            </p>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 rounded-xl transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </motion.button>
      </header>

      {/* --- CONSOLIDATED PERFORMANCE DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest">Total Marks</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">{calculatedTotalMarks}</span>
            <span className="text-slate-500 font-mono text-lg">/ {calculatedMaxMarks || "0"}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest">Overall Average</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-emerald-400">{percentage}%</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest">Class Rank</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{results.length > 0 ? estimatedRank : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* --- ASSESSMENT TABS --- */}
      <div className="flex items-center gap-4 border-b border-slate-800 mb-8 pb-4 overflow-x-auto">
        <button 
          onClick={() => setActiveAssessment("assessment1")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeAssessment === "assessment1" 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" /> Assessment 1
        </button>
        <button 
          onClick={() => setActiveAssessment("assessment2")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeAssessment === "assessment2" 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" /> Assessment 2
        </button>
        <button 
          onClick={() => setActiveAssessment("finals")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeAssessment === "finals" 
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
            : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          }`}
        >
          <Award className="w-4 h-4" /> Final Exams
        </button>
      </div>

      {/* --- NEW: SUBJECT WISE SUMMARY TABLE --- */}
      {displayedResults.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl mb-8 overflow-x-auto"
        >
          <h3 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <TableProperties className="w-4 h-4" /> Overall Subject Summary
          </h3>
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest">
                <th className="p-4 font-semibold">Subject</th>
                <th className="p-4 font-semibold">Stream</th>
                <th className="p-4 font-semibold text-center">Score</th>
                <th className="p-4 font-semibold text-center">Percentage</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {displayedResults.map(res => {
                const subjectMax = getSubjectMax(res);
                const subjPercent = subjectMax > 0 ? Math.round((res.marks / subjectMax) * 100) : 0;
                return (
                  <tr key={`table-${res.id}`} className="border-b border-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-slate-200">{res.subject}</td>
                    <td className="p-4 text-slate-500 font-mono text-xs">{res.class_stream}</td>
                    <td className="p-4 text-center">
                      <span className="font-black text-emerald-400 text-lg">{res.marks}</span>
                      <span className="text-slate-500 font-mono text-xs"> / {subjectMax}</span>
                    </td>
                    <td className="p-4 text-center text-slate-300 font-medium">{subjPercent}%</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedResult(res)} 
                        className="text-[10px] uppercase tracking-widest font-bold text-blue-500 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-md hover:bg-blue-500/20"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* --- DETAILED SUBJECT CARDS --- */}
      <div>
        <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 mt-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {activeAssessment.replace('assessment', 'Assessment ')} Subject Reports
        </h3>

        {displayedResults.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl"
          >
            <Award className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-300">No records found</h3>
            <p className="text-slate-500 text-sm mt-2">Evaluations for this assessment have not been processed yet. Check back later.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedResults.map((evalRecord) => (
              <motion.div 
                key={`card-${evalRecord.id}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -5 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-emerald-500/50 transition-colors group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-950 px-2 py-1 rounded-md mb-2 inline-block">
                      {evalRecord.class_stream}
                    </span>
                    <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">{evalRecord.subject}</h3>
                    <p className="text-slate-500 text-xs mt-1 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" /> Evaluated: {new Date(evalRecord.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl w-20 h-20 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-3xl font-black text-emerald-400">{evalRecord.marks}</span>
                    <span className="text-[10px] text-slate-500 font-mono">/ {getSubjectMax(evalRecord)}</span>
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex-1 mb-6">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">AI Educator Feedback</h4>
                  <p className="text-sm text-slate-400 line-clamp-3">
                    {evalRecord.feedback}
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedResult(evalRecord)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-400 text-slate-300 border border-slate-700 hover:border-emerald-500/30 py-4 rounded-xl font-bold text-sm transition-all mt-auto"
                >
                  <FileSearch className="w-5 h-5" /> View Detailed Report
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentPage() {
  useEffect(() => {
    let animationFrameId: number;
    const handleMove = (e: MouseEvent) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
      });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <div className="bg-glow" />
      <FuturisticCursor />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      }>
        <StudentDashboard />
      </Suspense>
    </main>
  );
}