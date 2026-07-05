"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import FuturisticCursor from "../../components/FuturisticCursor";

type LoginStep = "intro" | "role-select" | "educator-login" | "student-login";

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Show glass intro for 2 seconds then switch to role selection
    const timer = setTimeout(() => setStep("role-select"), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEducatorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/admin"); // Routes to the Evaluation Dashboard we built
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Route to future student dashboard
    alert("Student Portal coming soon! Roll No: " + rollNumber);
  };

  return (
    <main className="relative min-h-screen w-full bg-slate-950 flex items-center justify-center overflow-hidden">
      <div className="bg-glow" />
      <FuturisticCursor />

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 5, opacity: 0, filter: "blur(40px)" }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="z-50"
          >
            <h1 className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              EXAIM
            </h1>
          </motion.div>
        )}

        {step === "role-select" && (
          <motion.div
            key="role-select"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-full max-w-2xl p-1 border border-white/10 rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent backdrop-blur-2xl shadow-2xl"
          >
            <div className="bg-slate-900/90 rounded-[2.4rem] p-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Select Gateway</h2>
              <p className="text-slate-500 text-sm uppercase tracking-widest mb-10">Choose your access level</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Educator Card - OPTIMIZED */}
                <motion.button
                  whileHover={{ scale: 1.05, borderColor: "rgba(59, 130, 246, 0.8)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("educator-login")}
                  className="flex flex-col items-center justify-center p-8 bg-slate-800/80 border border-slate-700 rounded-3xl transition-colors group will-change-transform"
                >
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500/40 transition-colors">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Educator</h3>
                  <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Admin & Evaluator</p>
                </motion.button>

                {/* Student Card - OPTIMIZED */}
                <motion.button
                  whileHover={{ scale: 1.05, borderColor: "rgba(16, 185, 129, 0.8)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("student-login")}
                  className="flex flex-col items-center justify-center p-8 bg-slate-800/80 border border-slate-700 rounded-3xl transition-colors group will-change-transform"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-500/40 transition-colors">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Student</h3>
                  <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Results Portal</p>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "educator-login" && (
          <motion.div
            key="educator-login"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="relative z-10 w-full max-w-md p-1 border border-blue-500/30 rounded-[2.5rem] bg-gradient-to-b from-blue-500/10 to-transparent backdrop-blur-2xl shadow-2xl"
          >
            <div className="bg-slate-900/90 rounded-[2.4rem] p-10">
              <button onClick={() => setStep("role-select")} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 flex items-center transition-colors">
                ← Back to Roles
              </button>
              <h2 className="text-3xl font-bold text-white mb-2">Educator Login</h2>
              <p className="text-blue-400 text-sm uppercase tracking-widest mb-8">Secure Admin Gateway</p>

              <form onSubmit={handleEducatorLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter ml-1">Staff Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-600" placeholder="professor@bnu.edu.in" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter ml-1">Security Key</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-600" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all">AUTHORIZE ACCESS</button>
              </form>
            </div>
          </motion.div>
        )}

        {step === "student-login" && (
          <motion.div
            key="student-login"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="relative z-10 w-full max-w-md p-1 border border-emerald-500/30 rounded-[2.5rem] bg-gradient-to-b from-emerald-500/10 to-transparent backdrop-blur-2xl shadow-2xl"
          >
            <div className="bg-slate-900/90 rounded-[2.4rem] p-10">
              <button onClick={() => setStep("role-select")} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-6 flex items-center transition-colors">
                ← Back to Roles
              </button>
              <h2 className="text-3xl font-bold text-white mb-2">Student Portal</h2>
              <p className="text-emerald-400 text-sm uppercase tracking-widest mb-8">Access Evaluation Results</p>

              <form onSubmit={handleStudentLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter ml-1">Roll Number</label>
                  <input type="text" required value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600 uppercase" placeholder="e.g. U03CJ21S0015" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter ml-1">Date of Birth / PIN</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all">VIEW RESULTS</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}