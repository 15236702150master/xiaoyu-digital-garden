// 彩蛋角色模式
export type EasterEggMode = 'sunyou' | 'father' | 'nagging' | 'dushe' | 'jitang' | 'shadian' | 'random'

// 彩蛋状态
export interface EasterEggState {
  // 基础统计
  totalNotes: number
  totalWords: number
  firstNoteDate: string
  lastActiveDate: string
  
  // 里程碑记录
  milestonesReached: number[]
  
  // 行为统计
  consecutiveDays: number
  activeDates: string[]
  todayNoteCount: number
  lastCheckDate: string
  recentCreateTimes: number[]
  
  // 彩蛋触发记录
  triggeredEggs: TriggeredEgg[]
  
  // 功能使用记录
  hasUsedTag: boolean
  hasUsedLink: boolean
  hasUploadedImage: boolean
  usedFonts: string[]
  hasUsedCategory: boolean
  hasUsedSearch: boolean
  hasExported: boolean
  
  // 笔记编辑统计
  noteEditCounts: Record<string, number>
  
  // 新增彩蛋状态
  hasLongNote: boolean
  hasWeekly5Notes: boolean
  tag5NotesTriggered: boolean
  hasLink3Notes: boolean
  activeMonths: string[]
  hasMonthly3Active: boolean
  hasCategoryMaster: boolean
  hasTagMaster: boolean
  hasNoteWithImage: boolean
  
  // 用户设置
  easterEggMode: EasterEggMode
  easterEggEnabled: boolean
}

// 触发的彩蛋记录
export interface TriggeredEgg {
  id: string
  triggeredAt: string
  content: string
  mode: EasterEggMode
}

// 彩蛋冷却
export interface EasterEggCooldown {
  [eggId: string]: number
}

// 彩蛋内容
export interface EasterEggContent {
  id: string
  title: string
  content: string
  icon: string
}
