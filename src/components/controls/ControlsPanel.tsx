import { AdjustSection } from './Adjustments'
import { A11ySection } from './ContrastReport'
import { PaletteSection } from './Palette'
import { PresetSection } from './PresetPicker'
import { RolesSection } from './RoleSlots'
import { Section } from './Section'
import { WallpaperSection } from './UploadZone'

export const SECTIONS = [
  { id: 'wallpaper', title: 'Wallpaper', tab: 'Image', Component: WallpaperSection },
  { id: 'palette', title: 'Palette', tab: 'Palette', Component: PaletteSection },
  { id: 'roles', title: 'Roles', tab: 'Palette', Component: RolesSection },
  { id: 'preset', title: 'Preset', tab: 'Preset', Component: PresetSection },
  { id: 'adjust', title: 'Adjustments', tab: 'Adjust', Component: AdjustSection },
  { id: 'a11y', title: 'Accessibility', tab: 'A11y', Component: A11ySection },
] as const

export const SHEET_TABS = ['Image', 'Palette', 'Preset', 'Adjust', 'A11y'] as const

export function ControlsPanel() {
  return (
    <div>
      {SECTIONS.map(({ id, title, Component }, i) => (
        <Section key={id} n={i + 1} title={title}>
          <Component />
        </Section>
      ))}
    </div>
  )
}
