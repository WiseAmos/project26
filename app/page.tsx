'use client'

import { useState, useEffect, useCallback } from 'react'
import Scene from '@/components/Scene'
import IntroOverlay from '@/components/IntroOverlay'
import WishInput from '@/components/WishInput'
import FadingText from '@/components/FadingText'
import { db } from '@/lib/firebase'
import { useConfig } from '@/components/ConfigContext'

export default function Home() {
  const { config, isLoaded } = useConfig()
  const [mode, setMode] = useState<'LOADING' | 'INTRO' | 'FOLDING' | 'WISH' | 'VOID'>('LOADING')
  const [selectedWish, setSelectedWish] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isReturningUser, setIsReturningUser] = useState(false)

  // Folding progress state (from FoldingStage)
  const [foldStep, setFoldStep] = useState(0)
  const [foldProgress, setFoldProgress] = useState(0)
  const [foldComplete, setFoldComplete] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [isSettling, setIsSettling] = useState(false)

  // Last submitted wish (for the user's crane interaction)
  const [lastWish, setLastWish] = useState<string | null>(null)

  // Default to first color in config immediately if available
  const [craneColor, setCraneColor] = useState(() => {
    // If config is already hydrated (from localStorage), user it
    if (config?.craneColors?.length > 0) return config.craneColors[0].color
    return '#808080'
  })

  // Sync Color with Config (if default became invalid due to palette change)
  useEffect(() => {
    if (config?.craneColors?.length > 0) {
      const isValid = config.craneColors.some(c => c.color === craneColor)
      if (!isValid) {
        setCraneColor(config.craneColors[0].color)
      }
    }
  }, [config, craneColor])

  // Check Local Storage on Mount - BUT WAIT FOR CONFIG
  useEffect(() => {
    if (!isLoaded) return // Wait for remote config to be ready

    const checkVisit = () => {
      const lastVisit = localStorage.getItem('paper_cranes_last_visit')
      const now = Date.now()

      if (lastVisit) {
        setIsReturningUser(true) // They have visited before
        const daysSince = (now - parseInt(lastVisit)) / (1000 * 60 * 60 * 24)
        if (daysSince < 14) {
          // Returning user within 14 days -> Skip Intro
          setMode('FOLDING')
        } else {
          // Has been a while -> Show Intro
          setMode('INTRO')
        }
      } else {
        // New user -> Show Intro
        setMode('INTRO')
      }

      // Update visit time
      localStorage.setItem('paper_cranes_last_visit', now.toString())
    }

    checkVisit()
  }, [isLoaded])

  const handleFoldComplete = () => {
    setMode('WISH')
  }

  const handleWishSend = async (message: string) => {
    setLastWish(message) // Store for the "Hero" crane

    // 1. Save to Firestore via API (Secure)
    try {
      const res = await fetch('/api/make-wish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, color: craneColor })
      })
      if (!res.ok) {
        const data = await res.json()
        console.error("Failed to save wish:", data.error)
        // We could show a toast here, but for now console error is enough as per UI simplicity
      }
    } catch (err) {
      console.error("Error sending wish:", err)
    }

    // 2. Start Release Animation regardless of API success (Optimistic UI) 
    // OR should we fail? Better to show animation so user doesn't feel broken, 
    // unless it's rate limit. But for the art experience, optimistic is better.
    // If rate limited, the wish just "flies away" but doesn't land in DB. 
    // That's acceptable for a poetic anti-spam.

    setIsReleasing(true)

    // 3. Wait for animation, then switch to Void
    setTimeout(() => {
      setMode('VOID')
      setIsReleasing(false)

      // 4. Lock controls briefly to allow clean entry
      setIsSettling(true)
      setTimeout(() => setIsSettling(false), 1800)
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
      case 0: return "Drag right to start folding"
      case 1: return "Folding..."
      case 2: return "Folding..."
      case 3: return "Ready" // Should not be seen if logic flows correctly
      default: return null
    }
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* 3D SCENE (Always mounted, revealed by fade) */}
      <div
        className="fixed inset-0 w-screen h-screen"
        style={{ zIndex: 0 }}
      >
        <Scene
          mode={mode}
          onFoldComplete={handleFoldComplete}
          onSelectWish={handleSelectWish}
          onFoldProgress={handleFoldProgress}
          isReleasing={isReleasing}
          isSettling={isSettling}
          lastWish={lastWish}
          craneColor={craneColor}
        />
      </div>

      {/* INTRO OVERLAY */}
      {mode === 'INTRO' && (
        <IntroOverlay
          onComplete={() => setMode('FOLDING')}
          onGallery={() => setMode('VOID')}
        />
      )}

      {/* FADE CURTAIN (For Returning Users / Initial Load) */}
      {/* If LOADING, it's solid. If FOLDING, it fades out. If INTRO, it's not rendered (IntroOverlay takes over) */}
      {mode !== 'INTRO' && (
        <div
          className={`fixed inset-0 z-[60] bg-[#f4f1ea] pointer-events-none transition-opacity duration-[2000ms] ease-in-out ${mode === 'LOADING' ? 'opacity-100' : 'opacity-0'}`}
          onTransitionEnd={(e) => {
            // Optional: remove from DOM if we wanted better perf, but opacity 0 pointer-events-none is fine for now
            if (mode === 'FOLDING') {
              // e.currentTarget.style.display = 'none' 
            }
          }}
        />
      )}

      {/* VIEW GALLERY SHORTCUT (For Returning Users in Folding Stage) */}
      {mode === 'FOLDING' && isReturningUser && (
        <button
          onClick={() => setMode('VOID')}
          style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 50 }}
          className="group flex items-center gap-3 cursor-pointer bg-transparent border-none shadow-none outline-none p-0 m-0"
        >
          <span className="font-serif italic text-lg text-[#333]/60 group-hover:text-[#333] transition-colors duration-500">
            view gallery
          </span>
          <div className="w-8 h-[1px] bg-[#333]/30 group-hover:w-12 group-hover:bg-[#333] transition-all duration-500"></div>
        </button>
      )}

      {/* FOLDING INSTRUCTIONS - DOM overlay (not drei Html) */}
      {mode === 'FOLDING' && !foldComplete && (
        <div
          className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-start pt-36 md:pt-24 pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <div className="text-center">
            <p className="text-[#333] text-xs tracking-[0.3em] uppercase">
              <FadingText text={getFoldInstruction() || ""} />
            </p>
          </div>
        </div>
      )}

      {/* WISH INPUT */}
      {mode === 'WISH' && (
        <WishInput
          onSend={handleWishSend}
          onColorChange={setCraneColor}
          selectedColor={craneColor}
        />
      )}

      {/* VOID MODE INSTRUCTIONS - Centered */}
      {mode === 'VOID' && !selectedWish && (
        <div
          className="fixed bottom-12 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: 20 }}
        >
          <div className={`transition-all duration-1000 transform ${showInstructions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-6 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl">
              <div className="flex flex-col items-center gap-1 opacity-60">
                <span className="text-[10px] uppercase tracking-widest text-[#333] font-bold">Look</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              </div>
              <div className="w-[1px] h-8 bg-[#333]/10"></div>
              <div className="flex flex-col items-center gap-1 opacity-60">
                <span className="text-[10px] uppercase tracking-widest text-[#333] font-bold">Zoom</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="M11 8v6M8 11h6" /></svg>
              </div>
              <div className="w-[1px] h-8 bg-[#333]/10"></div>
              <div className="flex flex-col items-center gap-1 opacity-60">
                <span className="text-[10px] uppercase tracking-widest text-[#333] font-bold">Discover</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WISH MODAL - Premium Design */}
      {selectedWish && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen flex items-center justify-center"
          style={{ zIndex: 100, backgroundColor: 'rgba(244, 241, 234, 0.4)' }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCloseWish()
          }}
        >
          {/* Modal card */}
          <div
            className="relative w-[90vw] md:w-auto md:min-w-[360px] md:max-w-lg bg-[#fdfbf6]/90 backdrop-blur-xl px-8 py-12 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] border border-white/50 rounded-[2rem] flex flex-col items-center text-center"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header: Storytelling */}
            <div className="mb-6 opacity-40">
              <p className="text-[0.6rem] md:text-xs tracking-[0.2em] font-sans text-[#333]">
                an unwished wish
              </p>
              <div className="w-[1px] h-6 bg-[#333] mx-auto mt-3"></div>
            </div>

            {/* Wish content */}
            <div className="relative z-10 w-full px-2 md:max-w-[400px]">
              <p className="text-[#333] font-serif italic text-2xl md:text-3xl leading-relaxed tracking-wide break-words">
                "{selectedWish}"
              </p>
            </div>

            {/* Footer: Context */}
            <div className="mt-8 opacity-40">
              <div className="w-[1px] h-6 bg-[#333] mx-auto mb-3"></div>
              <p className="text-[0.6rem] md:text-xs tracking-[0.2em] font-sans text-[#333]">
                released to the fold
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}


