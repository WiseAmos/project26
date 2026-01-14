'use client'

import { useState, useEffect, useCallback } from 'react'
import Scene from '@/components/Scene'
import IntroOverlay from '@/components/IntroOverlay'
import WishInput from '@/components/WishInput'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'

export default function Home() {
  const [mode, setMode] = useState<'INTRO' | 'FOLDING' | 'WISH' | 'VOID'>('INTRO')
  const [selectedWish, setSelectedWish] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Folding progress state (from FoldingStage)
  const [foldStep, setFoldStep] = useState(0)
  const [foldProgress, setFoldProgress] = useState(0)
  const [foldComplete, setFoldComplete] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)

  const handleFoldComplete = () => {
    setMode('WISH')
  }

  const handleWishSend = (message: string) => {
    // 1. Save to Firestore (Async - don't await blocking animation)
    addDoc(collection(db, 'wishes'), {
      message: message,
      timestamp: Date.now()
    }).catch(err => console.error("Error saving wish:", err)) // Keep catch for error logging

    // 2. Start Release Animation
    setIsReleasing(true)

    // 3. Wait for animation, then switch to Void
    setTimeout(() => {
      setMode('VOID')
      setIsReleasing(false)
    }, 2500)
  }

  const handleSelectWish = (wish: string | null) => {
    setSelectedWish(wish)
    if (!hasInteracted) {
      setHasInteracted(true)
    }
  }

  const handleCloseWish = () => {
    setSelectedWish(null)
  }

  const handleFoldProgress = useCallback((step: number, progress: number, isComplete: boolean) => {
    setFoldStep(step)
    setFoldProgress(progress)
    setFoldComplete(isComplete)
  }, [])

  // Fade out instructions after interaction or timeout
  useEffect(() => {
    if (mode !== 'VOID') return

    const timer = setTimeout(() => {
      setShowInstructions(false)
    }, 5000)

    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true)
        setTimeout(() => setShowInstructions(false), 1500)
      }
    }

    window.addEventListener('pointerdown', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    window.addEventListener('wheel', handleInteraction)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointerdown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('wheel', handleInteraction)
    }
  }, [mode, hasInteracted])

  // Reset instructions when entering VOID mode
  useEffect(() => {
    if (mode === 'VOID') {
      // Start hidden, then fade in
      setShowInstructions(false)
      setHasInteracted(false)

      const timer = setTimeout(() => {
        setShowInstructions(true)
      }, 500) // Small delay to allow scene to settle before fading in

      return () => clearTimeout(timer)
    }
  }, [mode])

  // Get folding instruction text
  const getFoldInstruction = () => {
    if (foldComplete) return null
    switch (foldStep) {
      case 0: return "Drag right to fold diagonal"
      case 1: return "Drag right to fold in half"
      case 2: return "Drag right to fold wings & head"
      case 3: return "Drag right to release"
      default: return null
    }
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* 3D SCENE (Always mounted, revealed by fade) */}
      <div
        className={`fixed inset-0 w-screen h-screen transition-opacity duration-700 ${mode === 'INTRO' ? 'opacity-0' : 'opacity-100'}`}
        style={{ zIndex: 0 }}
      >
        <Scene
          mode={mode}
          onFoldComplete={handleFoldComplete}
          onSelectWish={handleSelectWish}
          onFoldProgress={handleFoldProgress}
          isReleasing={isReleasing}
        />
      </div>

      {/* INTRO OVERLAY */}
      {mode === 'INTRO' && (
        <IntroOverlay
          onComplete={() => setMode('FOLDING')}
          onGallery={() => setMode('VOID')}
        />
      )}

      {/* FOLDING INSTRUCTIONS - DOM overlay (not drei Html) */}
      {mode === 'FOLDING' && !foldComplete && (
        <div
          className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-start pt-32 pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <div className="text-center">
            <p className="text-[#333] text-xs tracking-[0.3em] uppercase animate-pulse">
              {getFoldInstruction()}
            </p>
            <div className="w-32 h-1 bg-black/10 mx-auto mt-4 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#333] transition-all duration-75"
                style={{ width: `${foldProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* WISH INPUT */}
      {mode === 'WISH' && (
        <WishInput onSend={handleWishSend} />
      )}

      {/* VOID MODE INSTRUCTIONS - Centered */}
      {mode === 'VOID' && !selectedWish && showInstructions && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen flex items-center justify-center pointer-events-none"
          style={{ zIndex: 20 }}
        >
          <div className={`transition-opacity duration-1000 ${showInstructions ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-[#333]/60 text-xs md:text-sm tracking-wide text-center px-6 py-3 bg-white/50 backdrop-blur-md rounded-full shadow-lg">
              Drag to look around • Scroll to zoom • Tap a crane
            </p>
          </div>
        </div>
      )}

      {/* WISH MODAL - Premium Design */}
      {selectedWish && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen flex items-center justify-center"
          style={{ zIndex: 100, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCloseWish()
          }}
        >
          <div
            className="relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/20 blur-2xl scale-110 rounded-2xl"></div>

            {/* Modal card */}
            <div className="relative bg-gradient-to-b from-[#fefefe] to-[#f8f6f2] backdrop-blur-xl px-8 py-10 md:px-14 md:py-14 shadow-2xl border border-white/60 max-w-[85vw] md:max-w-lg rounded-2xl">

              {/* Decorative crane silhouette */}
              <div className="absolute top-4 right-4 opacity-10">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-[#333]">
                  <path d="M12 2L8 8H4L8 12L4 20H12L16 12L20 8H16L12 2Z" />
                </svg>
              </div>

              {/* Quote marks */}
              <div className="text-6xl md:text-7xl text-[#333]/10 font-serif absolute -top-2 left-4 leading-none">"</div>

              {/* Wish text */}
              <p className="text-[#333] font-serif italic text-xl md:text-2xl lg:text-3xl leading-relaxed tracking-wide text-center pt-4 pb-8">
                {selectedWish}
              </p>

              {/* Divider */}
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#333]/20 to-transparent mx-auto mb-6"></div>

              {/* Close button */}
              <button
                type="button"
                className="block mx-auto text-xs uppercase tracking-[0.25em] text-[#333]/50 hover:text-[#333] transition-all duration-300 py-2 px-6 rounded-full hover:bg-[#333]/5"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCloseWish()
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
