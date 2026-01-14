'use client'

import { ConfigProvider } from './ConfigContext'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ConfigProvider>
            {children}
        </ConfigProvider>
    )
}
