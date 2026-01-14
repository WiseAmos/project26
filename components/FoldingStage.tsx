'use client'

import React, { useState, useEffect, useRef } from 'react'
import { PaperFoldingEngine } from './PaperFoldingEngine'

interface FoldingStageProps {
    onComplete?: () => void
    onDragStart?: () => void
    forceFinish?: boolean
    onProgressChange?: (step: number, progress: number, isComplete: boolean) => void
    isReleasing?: boolean
    lastWish?: string | null
    onSelectWish?: (wish: string | null) => void
    craneColor?: string
}

export default function FoldingStage({ onComplete, onDragStart, forceFinish, onProgressChange, isReleasing, lastWish, onSelectWish, craneColor }: FoldingStageProps) {
    const [step, setStep] = useState(0) // 0: Square, 1: Triangle, 2: Diamond, 3: BirdBase, 4: Crane
    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    // Report progress to parent
    useEffect(() => {
        if (onProgressChange) {
            onProgressChange(step, progress, isComplete)
        }
    }, [step, progress, isComplete, onProgressChange])

    // Force finish state if mode dictates (prevents reset on remount)
    useEffect(() => {
        if (forceFinish) {
            setStep(3)
            setProgress(1)
            setIsComplete(true)
        }
    }, [forceFinish])

    // Auto-folding state
    const [isAutoFolding, setIsAutoFolding] = useState(false)

    // Track drag
    const startX = useRef(0)
    const isDragging = useRef(false)

    // Animation Loop for Auto-Fold
    useEffect(() => {
        if (!isAutoFolding || isComplete) return

        let animationFrameId: number
        const speed = 0.015 // Speed of auto-fold

        const animate = () => {
            setProgress(prev => {
                const next = prev + speed
                if (next >= 1) {
                    // Step Complete, Move Next
                    if (step < 3) {
                        // We need to coordinate step changes carefully
                        // We can't set state inside this updater safely for 'step' dependent logic
                        // So we'll handle the step increment in a separate effect or just return 1 and let an effect catch it?
                        // Better: Force the step increment immediately here to avoid frame gaps, but we can't strict mode might complain.
                        // Let's return 1, and handle the transition in a layout effect or immediate effect below.
                        return 1
                    }
                }
                return next
            })
            animationFrameId = requestAnimationFrame(animate)
        }

        animationFrameId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrameId)
    }, [isAutoFolding, isComplete, step])

    // Handle Step Transitions during Auto-Fold
    useEffect(() => {
        if (isAutoFolding && progress >= 1 && !isComplete) {
            if (step < 3) {
                // Move to next step
                // Small delay for visual pacing or instant? User wanted "see all steps happen". 
                // Instant transition creates a seamless flow.
                const nextStep = step + 1
                if (nextStep === 3) {
                    // Check if we need to animate step 3?
                    // Step 0(Manual) -> 1(Auto) -> 2(Auto) -> 3(Auto Finish?)
                    // PaperEngine handles S1->S2(Step1), S2->S3(Step2).
                    // Step 3 is usually "Release". Wait, Step 3 in Engine is just static final state?
                    // Let's check Engine.
                    // Step 1: S1->S2. Step 2: S2->S3.
                    // Step 3: Final.
                    // So we need to animate Step 1 and Step 2. 
                    // When Step 2 progress=1, we are at S3. We are done.
                }
                setStep(nextStep)
                if (nextStep < 3) {
                    setProgress(0)
                } else {
                    setIsComplete(true)
                    setIsAutoFolding(false)
                    if (onComplete) onComplete()
                }
            }
        }
    }, [progress, isAutoFolding, step, isComplete, onComplete])


    useEffect(() => {
        const handleDown = (e: MouseEvent | TouchEvent) => {
            if (isComplete || isAutoFolding) return

            isDragging.current = true
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
            startX.current = clientX
            if (onDragStart) onDragStart()
        }

        const handleMove = (e: MouseEvent | TouchEvent) => {
            // Only allow manual drag for STEP 0
            if (isDragging.current && !isComplete && !isAutoFolding && step === 0) {
                const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
                const delta = clientX - startX.current

                // Drag Sensitivity
                const sensitivity = 0.005
                const newProgress = Math.min(Math.max(delta * sensitivity, 0), 1)

                setProgress(newProgress)

                if (newProgress >= 0.99) {
                    // Step 0 Complete! Start Auto-Fold Sequence
                    isDragging.current = false
                    setStep(1)
                    setProgress(0)
                    setIsAutoFolding(true)
                }
            }
        }

        const handleUp = () => {
            isDragging.current = false
            // Snap back if released early during manual step
            if (step === 0 && progress < 0.99 && !isComplete && !isAutoFolding) {
                setProgress(0)
            }
        }

        window.addEventListener('mousedown', handleDown)
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        window.addEventListener('touchstart', handleDown)
        window.addEventListener('touchmove', handleMove)
        window.addEventListener('touchend', handleUp)

        return () => {
            window.removeEventListener('mousedown', handleDown)
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('touchstart', handleDown)
            window.removeEventListener('touchmove', handleMove)
            window.removeEventListener('touchend', handleUp)
        }
    }, [isComplete, progress, step, onComplete, onDragStart, isAutoFolding])

    // Pure 3D content - no Html overlay (handled by parent page.tsx now)
    return <PaperFoldingEngine step={step} progress={progress} isReleasing={isReleasing} color={craneColor} />
}
