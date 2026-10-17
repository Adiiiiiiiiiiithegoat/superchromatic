import { AdjustSection } from './Adjustments'
import type { ComponentType } from 'react'
import { A11yChip, A11ySection } from './ContrastReport'
import { PaletteSection } from './Palette'
import { PresetSection } from './PresetPicker'
import { RolesSection } from './RoleSlots'
import { Section } from './Section'
import { WallpaperSection } from './UploadZone'

export const SHEET_TABS = ['Picture', 'Colours', 'Style', 'Tweak', 'Read'] as const

export const SECTIONS: { id: string; title: string; tab: (typeof SHEET_TABS)[number]; Component: ComponentType; Aside?: ComponentType }[] = [
  { id: 'wallpaper', title: 'Picture', tab: 'Picture', Component: WallpaperSection },
  { id: 'palette', title: 'Colours', tab: 'Colours', Component: PaletteSection },
  { id: 'roles', title: 'Where each colour goes', tab: 'Colours', Component: RolesSection },
  { id: 'preset', title: 'Style', tab: 'Style', Component: PresetSection },
  { id: 'adjust', title: 'Fine-tune', tab: 'Tweak', Component: AdjustSection },
  { id: 'a11y', title: 'Easy to read', tab: 'Read', Component: A11ySection, Aside: A11yChip },
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
