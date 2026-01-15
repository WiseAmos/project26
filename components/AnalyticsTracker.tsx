'use client'

import { useEffect, useRef } from 'react'

export function AnalyticsTracker() {
    const hasLogged = useRef(false)

    useEffect(() => {
        // Prevent double logging in React Strict Mode or re-renders
        if (hasLogged.current) return

        // Check session storage to avoid logging every refresh in the same session
        const sessionKey = 'paper_cranes_visit_logged'
        if (sessionStorage.getItem(sessionKey)) {
            hasLogged.current = true
            return
        }

        const logVisit = async () => {
            try {
                await fetch('/api/analytics/log', { method: 'POST' })
                sessionStorage.setItem(sessionKey, 'true')
                hasLogged.current = true
            } catch (err) {
                // Ignore analytics errors
                console.warn('Analytics failed', err)
            }
        }

        logVisit()
    }, [])

    return null
}
