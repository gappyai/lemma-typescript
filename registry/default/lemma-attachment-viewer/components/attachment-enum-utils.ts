import type { ColumnSchema } from "lemma-sdk"

const ENUM_PALETTE = [
  { bg: "bg-blue-100 dark:bg-blue-500/15", text: "text-blue-700 dark:text-blue-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-violet-100 dark:bg-violet-500/15", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-orange-100 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-pink-100 dark:bg-pink-500/15", text: "text-pink-700 dark:text-pink-300" },
  { bg: "bg-indigo-100 dark:bg-indigo-500/15", text: "text-indigo-700 dark:text-indigo-300" },
  { bg: "bg-teal-100 dark:bg-teal-500/15", text: "text-teal-700 dark:text-teal-300" },
  { bg: "bg-amber-100 dark:bg-amber-500/15", text: "text-amber-700 dark:text-amber-300" },
] as const

function stableIndex(value: string, count: number): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  }
  return ((Math.abs(hash) % count) + count) % count
}

export function enumColor(optionValue: string, options: string[]) {
  const idx = options.indexOf(optionValue)
  const i = idx >= 0 ? idx % ENUM_PALETTE.length : stableIndex(optionValue, ENUM_PALETTE.length)
  return ENUM_PALETTE[i]
}

export type EnumColorEntry = { bg: string; text: string }
export type EnumColorMap = Record<string, EnumColorEntry>

export function enumPillClasses(optionValue: string, options: string[], colorMap?: EnumColorMap): string {
  if (colorMap?.[optionValue]) {
    const c = colorMap[optionValue]
    return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`
  }
  const c = enumColor(optionValue, options)
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`
}

const EXT_CATEGORY_TINTS: Record<string, { bg: string; text: string }> = {
  image: { bg: "bg-sky-500/10", text: "text-sky-700 dark:text-sky-300" },
  document: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-300" },
  spreadsheet: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300" },
  presentation: { bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-300" },
  archive: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-300" },
  video: { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-300" },
  audio: { bg: "bg-pink-500/10", text: "text-pink-700 dark:text-pink-300" },
  code: { bg: "bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-300" },
  other: { bg: "bg-muted/40", text: "text-muted-foreground" },
}

export function extensionCategoryBadgeClasses(ext: string): string {
  const cat = extensionCategory(ext)
  const tint = EXT_CATEGORY_TINTS[cat] ?? EXT_CATEGORY_TINTS.other
  return `rounded-full border border-border/50 ${tint.bg} px-1.5 py-0.5 text-[9px] font-medium normal-case ${tint.text}`
}

export function extensionCategory(ext: string): string {
  const e = ext.toLowerCase().replace(/^\./, "")
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff|avif)$/.test(e)) return "image"
  if (/^(pdf|doc|docx|txt|rtf|odt|tex)$/.test(e)) return "document"
  if (/^(xls|xlsx|csv|ods|tsv)$/.test(e)) return "spreadsheet"
  if (/^(ppt|pptx|odp|key)$/.test(e)) return "presentation"
  if (/^(zip|rar|7z|tar|gz|bz2|xz|tgz)$/.test(e)) return "archive"
  if (/^(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/.test(e)) return "video"
  if (/^(mp3|wav|ogg|flac|aac|m4a|wma)$/.test(e)) return "audio"
  if (/^(js|ts|jsx|tsx|py|rb|go|rs|java|c|cpp|h|cs|php|sh|sql|html|css|json|yaml|yml|xml|toml)$/.test(e)) return "code"
  return "other"
}
