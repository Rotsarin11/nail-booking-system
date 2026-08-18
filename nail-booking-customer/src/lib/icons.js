// Maps a service's `icon` name (from mock data) to a lucide-react component.
import { Droplet, Footprints, Hand, Paintbrush, Palette, Sparkles } from 'lucide-react'

export const SERVICE_ICONS = {
  paintbrush: Paintbrush,
  sparkles: Sparkles,
  palette: Palette,
  droplet: Droplet,
  hand: Hand,
  footprints: Footprints,
}

// Resolve a lucide icon component for a service; falls back to Sparkles.
export function serviceIcon(name) {
  return SERVICE_ICONS[name] || Sparkles
}
