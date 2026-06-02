'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export default function NewLandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-linear-to-b from-[#e0f2fe] via-[#ede9fe] to-[#fce7f3]">
      
      {/* Background Decorations with Framer Motion */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50" 
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50" 
      />
      <motion.div 
        animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-10 left-1/3 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50" 
      />
      
      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full">
        
        {/* Animated Mascot / Illustration */}
        <motion.div
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1
          }}
          className="relative w-56 h-56 md:w-80 md:h-80 mb-8"
        >
          {/* Main Mascot image, we use the existing one */}
          <motion.div
            animate={{ y: [-10, 5, -10] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full relative mix-blend-multiply"
          >
            <Image 
              src="/images/math_mascot.png" 
              alt="Anak Belajar Matematika" 
              fill
              className="object-contain"
              priority
            />
          </motion.div>

          {/* Floating Math Symbols */}
          <motion.div 
            animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-2 -left-2 md:-top-4 md:-left-4 bg-white rounded-xl p-2 md:p-3 shadow-xl border-2 border-blue-200 text-blue-500 font-black text-xl md:text-2xl"
          >
            ➕
          </motion.div>
          <motion.div 
            animate={{ y: [10, -10, 10], rotate: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute top-10 -right-6 md:-right-8 bg-white rounded-xl p-2 md:p-3 shadow-xl border-2 border-pink-200 text-pink-500 font-black text-xl md:text-2xl"
          >
            ➖
          </motion.div>
          <motion.div 
            animate={{ y: [-15, 15, -15], rotate: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-10 -left-6 md:-left-8 bg-white rounded-xl p-2 md:p-3 shadow-xl border-2 border-emerald-200 text-emerald-500 font-black text-xl md:text-2xl"
          >
            ✖️
          </motion.div>
          <motion.div 
            animate={{ y: [15, -15, 15], rotate: [0, -15, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute bottom-4 -right-2 md:-right-4 bg-white rounded-xl p-2 md:p-3 shadow-xl border-2 border-amber-200 text-amber-500 font-black text-xl md:text-2xl"
          >
            ➗
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-black mb-3">
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-violet-600">
              FUN
            </span>
            <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-600 to-pink-500">
              -MATH
            </span>
          </h1>
          <p className="text-base md:text-xl text-slate-700 font-bold max-w-sm mx-auto mb-10 px-4 leading-relaxed">
            Cara paling seru buat belajar dan berlatih matematika! 🎉
          </p>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={() => router.push('/pilih-siswa')}
            size="lg"
            className="text-xl md:text-2xl px-10 py-8 md:px-12 md:py-8 rounded-full bg-linear-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white font-black shadow-[0_10px_25px_-5px_rgba(59,130,246,0.5)] border-4 border-white/30 gap-3"
          >
            <Play className="w-6 h-6 md:w-8 md:h-8 fill-current" />
            MULAI
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
