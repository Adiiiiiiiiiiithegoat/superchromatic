import { RotateCcw, Shuffle } from 'lucide-react'
import { LayoutGroup, motion } from 'motion/react'
import { useState } from 'react'
import { toHex } from '../../lib/theme/oklch'
import { ROLES, type Role } from '../../lib/types'
import { useRoles, useThemeStore } from '../../store/useThemeStore'
import { btn } from '../ui'
import { ROLE_LABEL } from './Palette'

/** Which role slot (if any) is under a viewport point. */
function roleAt(x: number, y: number): Role | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const slot = el.closest('[data-role-slot]')
    if (slot) return slot.getAttribute('data-role-slot') as Role
  }
  return null
}

export function RolesSection() {
  const { assignment, colors } = useRoles()
  const swatches = useThemeStore((s) => s.swatches)
  const selected = useThemeStore((s) => s.selected)
  const overrides = useThemeStore((s) => s.overrides)
  const setRole = useThemeStore((s) => s.setRole)
  const shuffleRoles = useThemeStore((s) => s.shuffleRoles)
  const resetRoles = useThemeStore((s) => s.resetRoles)
  const [target, setTarget] = useState<Role | null>(null)
  const draggable = swatches.filter((s) => selected.includes(s.id))

  // Shared-layout ids: a swatch's chip glides between slots when roles change.
  const seen = new Set<string>()
  const chipId = (role: Role) => {
    const id = assignment[role]
    if (!id || seen.has(id)) return `derived-${role}`
    seen.add(id)
    return `chip-${id}`
  }

  return (
    <div className="space-y-3">
      {draggable.length > 0 && (
        <div>
          <p className="mb-1.5 text-[12px] text-ink-subtle">Drag a colour onto a role (or use the menu under each swatch).</p>
          <ul className="flex flex-wrap gap-1.5">
            {draggable.map((s) => (
              <li key={s.id}>
                <motion.div
                  drag
                  dragSnapToOrigin
                  dragElastic={0.7}
                  whileDrag={{ scale: 1.2, zIndex: 50, cursor: 'grabbing' }}
                  onDrag={(_, info) => setTarget(roleAt(info.point.x - scrollX, info.point.y - scrollY))}
                  onDragEnd={(_, info) => {
                    const role = roleAt(info.point.x - scrollX, info.point.y - scrollY)
                    if (role) setRole(role, s.id)
                    setTarget(null)
                  }}
                  aria-label={`${s.hex}, draggable`}
                  title={s.hex}
                  className="relative size-8 cursor-grab touch-none rounded-full ring-2 ring-panel max-sm:size-11"
                  style={{ background: s.hex }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <LayoutGroup id="roles">
        <ul className="grid grid-cols-2 gap-2">
          {ROLES.map((role) => {
            const hex = toHex(colors[role])
            const derived = assignment[role] === null
            return (
              <li
                key={role}
                data-role-slot={role}
                data-testid={`role-${role}`}
                className={`rounded-lg border p-2 transition-colors ${target === role ? 'border-ink bg-hover' : 'border-line'}`}
              >
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium">{ROLE_LABEL[role]}</span>
                  {derived && <span className="text-[10.5px] text-ink-subtle" title="No colour picked for this role, so it's derived from Primary by hue rotation">derived</span>}
                  {!derived && overrides[role] !== undefined && <span className="text-[10.5px] text-ink-subtle">manual</span>}
                </div>
                <motion.div
                  layoutId={chipId(role)}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className={`mt-1.5 h-9 rounded-md ${derived ? 'border border-dashed border-line-strong' : 'ring-1 ring-line'}`}
                  style={{ background: hex }}
                />
                <p className="mt-1 font-mono text-[11px] text-ink-muted">{hex}</p>
              </li>
            )
          })}
        </ul>
      </LayoutGroup>

      <div className="flex gap-2">
        <button type="button" className={btn} onClick={shuffleRoles} disabled={draggable.length < 2}>
          <Shuffle aria-hidden className="size-3.5" /> Shuffle roles
        </button>
        <button type="button" className={btn} onClick={resetRoles} disabled={Object.keys(overrides).length === 0}>
          <RotateCcw aria-hidden className="size-3.5" /> Reset to auto
        </button>
      </div>
    </div>
  )
}
