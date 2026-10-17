import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useThemeStore } from '../store/useThemeStore'

export function Toast() {
  const toast = useThemeStore((s) => s.toast)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2400)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center px-4 sm:top-auto sm:bottom-6">
      <AnimatePresence>
        {visible && toast && (
          <motion.p
            key={toast.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-lg border border-line-strong bg-raised px-3 py-2 text-[13px] shadow-xl"
          >
            {toast.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
