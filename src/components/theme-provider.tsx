'use client'

import * as React from "react"

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme | undefined
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children, defaultTheme = 'dark' }: { children: React.ReactNode, defaultTheme?: Theme }) {
  const [theme, setThemeState] = React.useState<Theme | undefined>(undefined)

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme || defaultTheme
    setThemeState(savedTheme)
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [defaultTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
