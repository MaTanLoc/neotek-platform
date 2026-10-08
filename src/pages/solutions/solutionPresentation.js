import { Briefcase04Icon, Blockchain04Icon, Settings01Icon, FolderManagementIcon } from '@hugeicons/core-free-icons'
import { buildSolutionDetailPath } from '../../config/solutionRoutes'

// Public group labels and the CMS selector share the actual icon source.
export const GROUP_ICONS = {
  business: Briefcase04Icon,
  supplyChain: Blockchain04Icon,
  operations: Settings01Icon,
  management: FolderManagementIcon,
}

export function moduleDetailPath(slug, language = 'vi', available = false) {
  if (!available || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) return null
  return buildSolutionDetailPath(slug, language)
}

export function moduleIconSource(icon) {
  return icon && (/^(https?:|\/)/.test(icon) ? icon : `/assets/SolutionPageIcon/${icon}`)
}
