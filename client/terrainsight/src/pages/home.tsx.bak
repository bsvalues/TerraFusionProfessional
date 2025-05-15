import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocation } from 'wouter';
import { MapIcon, ArrowRight, Building, TrendingUp, Layers } from 'lucide-react';

export default function HomePage() {
  const [hasVisited, setHasVisited] = useState(false);
  const [, setLocation] = useLocation();

  // Check if user has visited before
  useEffect(() => {
    const visited = localStorage.getItem('hasVisitedBefore');
    if (visited === 'true') {
      setHasVisited(true);
      // Uncomment to auto-redirect returning users
      // setLocation('/dashboard');
    } else {
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, [setLocation]);

  const handleBeginJourney = () => {
    setLocation('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f8faff] to-[#e6eeff] text-[#111827] 
      flex flex-col items-center justify-center px-6 sm:px-10 md:px-20 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4ff] via-white to-[#f0f4ff] z-0" />
      
      {/* Multiple Glowing Orbs */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-400 rounded-full blur-[140px] opacity-20 z-0" />
      <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-purple-300 rounded-full blur-[120px] opacity-15 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#93c5fd] rounded-full blur-[150px] opacity-20 z-0" />
      
      {/* Radial Gradient Canvas Background - This is what creates the realistic Apple-style depth */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0.9)_100%)]" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
        {/* Floating Animation Cards */}
        <div className="hidden lg:flex w-full justify-between items-stretch mb-10 z-20">
          <motion.div 
            className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-[0_10px_20px_rgba(120,149,253,0.2)] border border-blue-50"
            animate={{ y: [0, -10, 0] }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <div className="flex items-center mb-2">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-blue-900 font-medium">Property Insights</h3>
            </div>
            <p className="text-sm text-gray-600">8,432 properties with detailed analytics</p>
          </motion.div>

          <motion.div 
            className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-[0_10px_20px_rgba(120,149,253,0.2)] border border-blue-50 mx-4"
            animate={{ y: [0, 10, 0] }}
            transition={{ 
              duration: 3.5, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <div className="flex items-center mb-2">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-purple-900 font-medium">Valuation Trends</h3>
            </div>
            <p className="text-sm text-gray-600">Average value up 2.3% this quarter</p>
          </motion.div>

          <motion.div 
            className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-[0_10px_20px_rgba(120,149,253,0.2)] border border-blue-50"
            animate={{ y: [0, -8, 0] }}
            transition={{ 
              duration: 4.5, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          >
            <div className="flex items-center mb-2">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Layers className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-green-900 font-medium">Spatial Analysis</h3>
            </div>
            <p className="text-sm text-gray-600">GIS overlay with 142K data points</p>
          </motion.div>
        </div>

        {/* Icon with Animation */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            repeatType: "reverse", 
            ease: "easeInOut" 
          }}
          className="relative mb-8 z-10"
        >
          <motion.div 
            className="absolute inset-0 bg-blue-200 rounded-full blur-md opacity-70 z-0"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 0.4, 0.7]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <div className="relative z-10 p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-[0_8px_16px_rgba(30,64,175,0.25)]">
            <MapIcon className="h-14 w-14 text-white" />
          </div>
        </motion.div>

        {/* Masked Gradient Title */}
        <div className="relative mb-4 z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-center tracking-tight 
              bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-800"
          >
            GIS_BS
          </motion.h1>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-3xl sm:text-4xl font-medium text-center tracking-tight mb-4 text-gray-800 z-10"
        >
          Spatial Analytics Platform
        </motion.h2>

        <motion.h3
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xl sm:text-2xl font-medium text-center mb-6 text-gray-600 z-10"
        >
          Benton County Property Valuation
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg text-center max-w-xl mb-12 text-gray-600 z-10"
        >
          A sophisticated spatial analysis platform providing deep insights into property valuation 
          and trends across Benton County, Washington.
        </motion.p>

        {/* Button with Animation Effects */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="relative z-10 group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-70 blur-md group-hover:opacity-100 transition duration-300 z-0" />
          <Button 
            onClick={handleBeginJourney}
            className="relative px-8 py-7 text-lg font-medium rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 
              text-white shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 z-10"
          >
            Begin Analysis <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </motion.div>

        {/* Animated Lines */}
        <div className="absolute inset-0 z-5 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(96, 165, 250, 0)" />
                <stop offset="50%" stopColor="rgba(96, 165, 250, 0.5)" />
                <stop offset="100%" stopColor="rgba(96, 165, 250, 0)" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 0,100 Q 250,180 500,100 T 1000,100"
              stroke="url(#line-gradient)"
              strokeWidth={1.5}
              fill="transparent"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, delay: 0.5 }}
            />
            <motion.path
              d="M 0,200 Q 250,280 500,200 T 1000,200"
              stroke="url(#line-gradient)"
              strokeWidth={1.5}
              fill="transparent"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, delay: 0.7 }}
            />
            <motion.path
              d="M 0,300 Q 250,380 500,300 T 1000,300"
              stroke="url(#line-gradient)"
              strokeWidth={1.5}
              fill="transparent"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, delay: 0.9 }}
            />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 text-sm text-gray-500 z-10"
        >
          © 2025 Benton County Assessment & Valuation
        </motion.div>
      </div>
    </main>
  );
}