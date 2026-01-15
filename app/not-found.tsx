'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#f4f1ea] flex flex-col items-center justify-center p-6 text-[#1a1a1a]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center max-w-md"
            >
                <div className="mb-8 flex justify-center">
                    {/* Abstract paper fold representation or icon */}
                    <div className="w-16 h-16 opacity-20 relative">
                        <div className="absolute inset-0 border-2 border-black rotate-45 transform origin-center" />
                        <div className="absolute inset-0 border-2 border-black rotate-[22.5deg] scale-75 transform origin-center" />
                    </div>
                </div>

                <h1 className="text-8xl font-thin tracking-wide mb-4 opacity-10">404</h1>
                <h2 className="text-2xl font-light mb-6">A Fold in Reality</h2>

                <p className="text-gray-500 mb-12 font-light leading-relaxed">
                    The page you are looking for has been carried away by the wind,
                    or perhaps folded into something new entirely.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] text-[#f4f1ea] rounded text-sm tracking-wide transition-all hover:bg-black hover:scale-105"
                >
                    <ArrowLeft size={16} />
                    <span>Return to the Start</span>
                </Link>
            </motion.div>
        </div>
    )
}
