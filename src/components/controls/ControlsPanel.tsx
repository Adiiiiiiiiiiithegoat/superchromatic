import { AdjustSection } from './Adjustments'
import type { ComponentType } from 'react'
import { A11yChip, A11ySection } from './ContrastReport'
import { PaletteSection } from './Palette'
import { PresetSection } from './PresetPicker'
import { RolesSection } from './RoleSlots'
import { Section } from './Section'
import { WallpaperSection } from './UploadZone'

export const SHEET_TABS = ['Image', 'Palette', 'Preset', 'Adjust', 'A11y'] as const

export const SECTIONS: { id: string; title: string; tab: (typeof SHEET_TABS)[number]; Component: ComponentType; Aside?: ComponentType }[] = [
  { id: 'wallpaper', title: 'Wallpaper', tab: 'Image', Component: WallpaperSection },
  { id: 'palette', title: 'Palette', tab: 'Palette', Component: PaletteSection },
  { id: 'roles', title: 'Roles', tab: 'Palette', Component: RolesSection },
  { id: 'preset', title: 'Preset', tab: 'Preset', Component: PresetSection },
  { id: 'adjust', title: 'Adjustments', tab: 'Adjust', Component: AdjustSection },
  { id: 'a11y', title: 'Accessibility', tab: 'A11y', Component: A11ySection, Aside: A11yChip },
]

export function ControlsPanel() {
  return (
    <div>
      {SECTIONS.map(({ id, title, Component, Aside }, i) => (
        <Section key={id} n={i + 1} title={title} aside={Aside && <Aside />}>
          <Component />
        </Section>
      ))}
    </div>
  )
}
