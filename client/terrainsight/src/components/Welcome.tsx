import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LucideMap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface QuoteType {
  text: string;
  author: string;
}

const insightfulQuotes: QuoteType[] = [
  {
    text: "Understanding the spatial relationships between properties is the key to accurate valuation.",
    author: "TerraInsight Spatial Analytics"
  },
  {
    text: "Data without context is just numbers; spatial analysis provides the context.",
    author: "Geospatial Analytics Principle"
  },
  {
    text: "The value of a property is influenced by its surroundings as much as by its intrinsic qualities.",
    author: "Modern Appraisal Theory"
  },
  {
    text: "Where infrastructure meets property, value emerges. Spatial analysis reveals these intersections.",
    author: "Urban Economics Journal"
  }
];

export function Welcome() {
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteType>(insightfulQuotes[0]);
  const [, setLocation] = useLocation();

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  // Select a random quote
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * insightfulQuotes.length);
    setQuote(insightfulQuotes[randomIndex]);
  }, []);

  const handleEnterApp = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 relative overflow-hidden">
      {/* Sophisticated background pattern */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIwLjUiIGQ9Ik0wIDYwaDYwVjBoLTYweiIvPjwvZz48L3N2Zz4=')]"></div>
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] opacity-30 z-0" />
        <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[130px] opacity-40 z-0" />
        <div className="absolute top-1/2 -left-[10%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[120px] opacity-30 z-0" />
        
        {/* Dotted grid */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMyMTIxMjEiLz48L3N2Zz4=')]"></div>
      </div>
      {loading ? (
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="relative w-28 h-28 mb-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut",
              delay: 0.2
            }}
          >
            {/* Decorative rings */}
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-primary/5"
            />
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-primary/10"
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.6, 0.2, 0.6] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-primary/20"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.7, 0.1, 0.7] 
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
            
            {/* Glow effect */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-primary/5"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.2, 0.7] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-full">
                <LucideMap className="h-12 w-12 text-primary" />
              </div>
            </div>
            
            {/* Rotating dot */}
            <motion.div 
              className="absolute w-3 h-3 rounded-full bg-primary/80 shadow-md"
              style={{ 
                top: '50%', 
                left: '50%', 
                translateX: '-50%', 
                translateY: '-50%',
                x: 0,
                y: 0
              }}
              animate={{
                x: [0, Math.cos(0) * 50, Math.cos(Math.PI/2) * 50, Math.cos(Math.PI) * 50, Math.cos(3*Math.PI/2) * 50, 0],
                y: [0, Math.sin(0) * 50, Math.sin(Math.PI/2) * 50, Math.sin(Math.PI) * 50, Math.sin(3*Math.PI/2) * 50, 0]
              }}
              transition={{
                duration: 5,
                ease: "linear",
                repeat: Infinity
              }}
            />
          </motion.div>
          
          <motion.h1 
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center module-lockup module-insight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span className="prefix">Terra</span><span className="name">Insight</span>
          </motion.h1>
          
          <motion.p 
            className="text-gray-500 text-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Initializing Benton County Property Valuation Platform
          </motion.p>
          
          <motion.div
            className="h-2 w-60 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            {/* Subtle pulse animation overlay */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "linear",
                delay: 1
              }}
            />
            
            {/* Progress bar */}
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ 
                delay: 0.8,
                duration: 1.5,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="mb-8 relative"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0)_70%)] opacity-70"></div>
              <LucideMap className="h-12 w-12 text-primary relative z-10" />
            </div>
            <div className="absolute -bottom-2 w-full h-4 bg-gradient-to-r from-transparent via-primary/10 to-transparent rounded-full blur-sm"></div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Welcome to <span className="module-lockup module-insight">
              <span className="prefix">Terra</span><span className="name">Insight</span>
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-600 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Benton County's Advanced Property Valuation Platform
          </motion.p>
          
          <motion.div
            className="mb-12 p-8 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 relative before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-primary/5 before:to-transparent before:opacity-30"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Quote mark */}
            <div className="absolute -top-3 -left-3 text-5xl text-primary/10 font-serif">"</div>
            <div className="absolute -bottom-5 -right-3 text-5xl text-primary/10 font-serif">"</div>
            
            <div className="relative">
              <p className="text-lg italic text-gray-700 mb-4 leading-relaxed">"{quote.text}"</p>
              <p className="text-sm text-primary font-medium">— {quote.author}</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Button 
              size="lg" 
              onClick={handleEnterApp}
              className="px-8 py-6 text-lg font-medium bg-primary/90 hover:bg-primary shadow-md hover:shadow-lg transition-all duration-300 rounded-xl relative group overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              Enter Platform <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </motion.div>
        </motion.div>
      )}
      
      <motion.p 
        className="absolute bottom-4 text-sm text-gray-400 mt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: loading ? 2 : 0.8, duration: 0.5 }}
      >
        © 2025 Benton County Assessment & Valuation
      </motion.p>
    </div>
  );
}

export default Welcome;