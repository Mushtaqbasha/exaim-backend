"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { User, GraduationCap, ArrowRight, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import FuturisticCursor from ".././components/FuturisticCursor";

function LandingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if the page was opened in a new tab with a specific role
  const urlRole = searchParams.get("role") as "educator" | "student" | null;

  // If a role exists in the URL, skip the splash screen entirely
  const [showSplash, setShowSplash] = useState(!urlRole);
  const [activeTab, setActiveTab] = useState<"educator" | "student" | null>(urlRole);
  
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [studentName, setStudentName] = useState(""); 
  const [pin, setPin] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Only run the splash screen timer if we are on the main root page
    if (!urlRole) {
      const splashTimer = setTimeout(() => {
        setShowSplash(false);
      }, 2500);
      return () => clearTimeout(splashTimer);
    }
  }, [urlRole]);

  // --- SUBMIT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      if (activeTab === "educator") {
        if (isSignup) {
          const res = await axios.post("https://examai-bw1i.onrender.com/api/educator/signup", { email, password });
          alert(res.data.message);
          setIsSignup(false); 
        } else {
          const res = await axios.post("https://examai-bw1i.onrender.com/api/educator/login", { email, password });
          if (res.data.success) {
            localStorage.setItem("exaim_admin_token", res.data.token);
            // Since we are already in a new tab, route normally
            router.push("/admin"); 
          }
        }
      } else if (activeTab === "student") {
        if (isSignup) {
          const res = await axios.post("https://examai-bw1i.onrender.com/api/student/signup", { 
            roll_number: rollNumber, 
            name: studentName, 
            pin 
          });
          alert(res.data.message);
          setIsSignup(false); 
        } else {
          const res = await axios.post("https://examai-bw1i.onrender.com/api/student/login", { 
            roll_number: rollNumber, 
            pin 
          });
          if (res.data.success) {
            // Since we are already in a new tab, route normally
            router.push(`/student?roll=${rollNumber}&name=${res.data.name}`);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabSwitch = (tab: "educator" | "student") => {
    // NEW LOGIC: Open the login form in a brand new tab
    window.open(`/?role=${tab}`, "_blank");
  };

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        /* ========================================= */
        /* --- THE CINEMATIC SPLASH ANIMATION --- */
        /* ========================================= */
        <motion.div
          key="splash"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "circOut" }}
            className="absolute top-1/2 left-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent -translate-y-1/2 opacity-30 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
          />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400 tracking-tighter drop-shadow-2xl relative z-10"
          >
            EXAIM
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}
            className="text-slate-500 font-mono text-xs md:text-sm tracking-[0.5em] mt-4 uppercase relative z-10 flex items-center gap-3"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Initializing AI Engine...
          </motion.div>
        </motion.div>
      ) : !activeTab ? (
        /* ========================================= */
        /* --- GATEWAY SELECTION SCREEN --- */
        /* ========================================= */
        <motion.div 
          key="selection"
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} 
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} 
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-4xl text-center"
        >
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400 mb-4 tracking-tight drop-shadow-2xl">
            EXAIM HUB
          </h1>
          <p className="text-slate-400 font-mono text-sm uppercase tracking-[0.3em] mb-16">
            Autonomous AI-Driven Academic Evaluation
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <motion.button 
              whileHover={{ y: -10, scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleTabSwitch("educator")}
              className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-3xl text-left overflow-hidden shadow-2xl hover:border-blue-500/50 transition-colors"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              <User className="w-12 h-12 text-blue-400 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">Educator Portal</h2>
              <p className="text-slate-500 text-sm mb-8">Access the AI batch grading engine and manage student evaluations securely.</p>
              <div className="flex items-center text-blue-400 font-bold text-sm tracking-wider uppercase">
                Enter Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.button>

            <motion.button 
              whileHover={{ y: -10, scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleTabSwitch("student")}
              className="group relative bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-10 rounded-3xl text-left overflow-hidden shadow-2xl hover:border-emerald-500/50 transition-colors"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              <GraduationCap className="w-12 h-12 text-emerald-400 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">Student Portal</h2>
              <p className="text-slate-500 text-sm mb-8">View your automated evaluation results and detailed AI score breakdowns.</p>
              <div className="flex items-center text-emerald-400 font-bold text-sm tracking-wider uppercase">
                Enter Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.button>
          </div>
        </motion.div>
      ) : (
        /* ========================================= */
        /* --- LOGIN / SIGNUP FORM SCREEN --- */
        /* ========================================= */
        <motion.div 
          key="form"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <button 
              onClick={() => {
                // Return to root if they want to go back
                router.push("/");
                setActiveTab(null);
              }} 
              className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 mb-8 flex items-center gap-2 transition-colors"
            >
              &larr; Back to Roles
            </button>

            <div className="flex items-center gap-3 mb-6">
              {activeTab === "educator" ? <ShieldCheck className="w-8 h-8 text-blue-500" /> : <GraduationCap className="w-8 h-8 text-emerald-500" />}
              <h2 className="text-3xl font-black text-white">
                {activeTab === "educator" ? "Educator" : "Student"} {isSignup ? "Sign Up" : "Login"}
              </h2>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm mb-6 font-mono text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "educator" && (
                <>
                  <input 
                    type="email" required placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder:text-slate-600"
                  />
                  <input 
                    type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder:text-slate-600 font-mono"
                  />
                </>
              )}

              {activeTab === "student" && (
                <>
                  <input 
                    type="text" required placeholder="Roll Number (e.g., U03CJ21S0015)" value={rollNumber} onChange={(e) => setRollNumber(e.target.value.toUpperCase())} 
                    className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-white placeholder:text-slate-600 uppercase font-mono"
                  />
                  {isSignup && (
                    <input 
                      type="text" required placeholder="Full Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} 
                      className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-white placeholder:text-slate-600"
                    />
                  )}
                  <input 
                    type="password" required placeholder="Secure PIN" value={pin} onChange={(e) => setPin(e.target.value)} 
                    className="w-full bg-slate-950/50 border border-slate-800 p-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-white placeholder:text-slate-600 font-mono tracking-widest"
                  />
                </>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 mt-4 ${
                  activeTab === "educator" ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignup ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                    {isSignup ? "CREATE ACCOUNT" : "AUTHORIZE"}
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center border-t border-slate-800 pt-6">
              <p className="text-sm text-slate-400">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button 
                  onClick={() => { setIsSignup(!isSignup); setErrorMsg(""); }} 
                  className={`font-bold hover:underline transition-colors ${
                    activeTab === "educator" ? "text-blue-400" : "text-emerald-400"
                  }`}
                >
                  {isSignup ? "Log In here" : "Sign Up here"}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LandingPage() {
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
    <main className="relative min-h-screen bg-slate-950 text-slate-200 overflow-hidden flex items-center justify-center p-4">
      <div className="bg-glow" />
      <FuturisticCursor />
      
      {/* Suspense is required here because we are reading useSearchParams() */}
      <Suspense fallback={<div className="flex items-center justify-center"><span className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>}>
        <LandingContent />
      </Suspense>
    </main>
  );
}