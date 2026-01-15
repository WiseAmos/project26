'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// -- TYPES --
export interface IntroStep {
    text: string
    duration: number // How long the text fades in/stays visible (usually includes fade time)
    hold: number     // How long to wait AFTER fade out before next step? Or total duration?
    // Let's model it like GSAP: 
    // duration: Fade In time (and visible time combined before fade out start?)
    // Let's stick to the Plan:
    // duration: 2 (Fade In + Stay)
    // hold: 1.5 (Wait before fading out? Or wait before next?)
    // Re-reading plan: "FadeIn Duration, Hold Duration".
    // Actual implementation in IntroOverlay uses: 
    // duration: FadeIn Time. "hold" = Time visible before FadeOut.
    highlight?: boolean // Whether to style this as a "Hero" line (Bold, Caps)
}

export interface AppConfig {
    introSequence: IntroStep[]
    instructions: {
        folding: string[]
        void: string
        wishPlaceholder: string
    }
    appTimings: {
        releaseDelay: number
        settleTime: number
    }
    craneColors: {
        id: string
        color: string
        label: string
        placeholder?: string
    }[]
    security: {
        rateLimitMax: number
        rateLimitWindowMs: number
        blockedIps: string[]
    }
}

const DEFAULT_CONFIG: AppConfig = {
    security: {
        rateLimitMax: 5,
        rateLimitWindowMs: 3600000, // 1 hour
        blockedIps: []
    },
    introSequence: [
        { text: "Legend says that folding one thousand paper cranes grants a single wish.", duration: 2, hold: 1.5 },
        { text: "I am not folding for a wish.", duration: 2, hold: 1.5 },
        { text: "To grieve in silence is to drown.", duration: 2, hold: 1.5 },
        { text: "To fold is to breathe.", duration: 2, hold: 2 }
    ],
    instructions: {
        folding: ["Drag right to start folding", "Folding...", "Ready"],
        void: "Drag to look around • Scroll to zoom • Tap a crane",
        wishPlaceholder: "Tap here to write your unspoken wish..."
    },
    appTimings: {
        releaseDelay: 2500,
        settleTime: 1800
    },
    craneColors: [
        { id: 'grey', color: '#808080', label: 'The Unsent', placeholder: "Write the message you deleted..." },
        { id: 'blue', color: '#A4C2F4', label: 'The Regret', placeholder: "What would you do differently?" },
        { id: 'red', color: '#E06666', label: 'The Yearning', placeholder: "Tell them you miss them..." },
        { id: 'black', color: '#000000', label: 'The Closure', placeholder: "Say your final goodbye..." },
    ]
}

// -- CONTEXT --
interface ConfigContextType {
    config: AppConfig
    updateConfig: (newConfig: AppConfig) => Promise<void>
    resetConfig: () => Promise<void>
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)

    useEffect(() => {
        // Subscribe to Firestore "config/global"
        const unsub = onSnapshot(doc(db, 'config', 'global'), (docSnap) => {
            if (docSnap.exists()) {
                // Merge with default to ensure no missing fields if schema updates
                // Deep merge needed? For now simple spread is okay if structure is flat-ish.
                // But AppConfig is nested. Ideally use deep merge or just trust DB.
                // Let's do a safe shallow merge of top keys.
                const data = docSnap.data() as Partial<AppConfig>
                setConfig(prev => ({
                    ...prev,
                    ...data,
                    instructions: { ...prev.instructions, ...data.instructions },
                    appTimings: { ...prev.appTimings, ...data.appTimings },
                    introSequence: data.introSequence || prev.introSequence,
                    craneColors: data.craneColors || prev.craneColors
                }))
            } else {
                console.log("No config found, using defaults. Creating doc...")
                setDoc(doc(db, 'config', 'global'), DEFAULT_CONFIG).catch(err => console.error(err))
            }
        }, (err) => {
            console.error("Config fetch error:", err)
        })

        return () => unsub()
    }, [])

    const updateConfig = async (newConfig: AppConfig) => {
        // Secure Server-Side Update
        // Optimistic update logic could go here, but we rely on onSnapshot to propagate changes back to us.
        try {
            const res = await fetch('/api/admin/update-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': '26102006'
                },
                body: JSON.stringify(newConfig)
            })
            if (!res.ok) throw new Error("Failed to update config")
        } catch (e) {
            console.error("Config Update Error:", e)
            throw e // Re-throw to let Admin Page handle error state
        }
    }

    const resetConfig = async () => {
        await updateConfig(DEFAULT_CONFIG)
    }

    return (
        <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
            {children}
        </ConfigContext.Provider>
    )
}

export function useConfig() {
    const context = useContext(ConfigContext)
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider')
    }
    return context
}
