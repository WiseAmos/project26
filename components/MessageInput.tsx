'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { motion, AnimatePresence } from 'framer-motion'

export default function MessageInput({ visible, onComplete }: { visible: boolean, onComplete: () => void }) {
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return

        setIsSubmitting(true)
        try {
            // Save to Firestore
            await addDoc(collection(db, 'cranes'), {
                message: message.trim(),
                createdAt: serverTimestamp(),
                // Random simple attributes for visual variety later
                color: Math.floor(Math.random() * 16777215).toString(16)
            })

            setMessage('')
            onComplete()
        } catch (error) {
            console.error("Error saving crane:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md p-8 bg-black/80 border border-white/10 shadow-2xl rounded-sm">
                        <h2 className="text-2xl font-light text-white mb-6 tracking-wider">MAKE A WISH</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                maxLength={140}
                                placeholder="Write your message on the wing..."
                                className="w-full h-32 bg-transparent border-b border-white/20 text-white text-lg font-light focus:outline-none focus:border-white transition-colors resize-none placeholder-white/30"
                                autoFocus
                            />
                            <div className="flex justify-between items-center text-sm text-white/40">
                                <span>{message.length}/140</span>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !message.trim()}
                                    className="px-6 py-2 border border-white/20 hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                                >
                                    {isSubmitting ? 'Folding...' : 'Release Crane'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
