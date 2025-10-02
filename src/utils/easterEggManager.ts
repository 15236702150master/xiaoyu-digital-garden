import { EasterEggState, EasterEggMode, TriggeredEgg, EasterEggCooldown } from '@/types/easterEgg'

const STORAGE_KEY = 'digital_garden_easter_egg_state'
const COOLDOWN_KEY = 'digital_garden_easter_egg_cooldowns'

// 默认状态
const defaultState: EasterEggState = {
  totalNotes: 0,
  totalWords: 0,
  firstNoteDate: '',
  lastActiveDate: new Date().toISOString(),
  milestonesReached: [],
  consecutiveDays: 0,
  activeDates: [],
  todayNoteCount: 0,
  lastCheckDate: '',
  recentCreateTimes: [],
  triggeredEggs: [],
  hasUsedTag: false,
  hasUsedLink: false,
  hasUploadedImage: false,
  usedFonts: [],
  hasUsedCategory: false,
  hasUsedSearch: false,
  hasExported: false,
  noteEditCounts: {},
  hasLongNote: false,
  hasWeekly5Notes: false,
  tag5NotesTriggered: false,
  hasLink3Notes: false,
  activeMonths: [],
  hasMonthly3Active: false,
  hasCategoryMaster: false,
  hasTagMaster: false,
  hasNoteWithImage: false,
  easterEggMode: 'sunyou',
  easterEggEnabled: true,
}

// 获取彩蛋状态
export function getEasterEggState(): EasterEggState {
  if (typeof window === 'undefined') return defaultState
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultState
    
    const state = JSON.parse(stored)
    return { ...defaultState, ...state }
  } catch (error) {
    console.error('Failed to load easter egg state:', error)
    return defaultState
  }
}

// 保存彩蛋状态
export function saveEasterEggState(state: EasterEggState): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save easter egg state:', error)
  }
}

// 更新彩蛋状态
export function updateEasterEggState(updates: Partial<EasterEggState>): void {
  const state = getEasterEggState()
  const newState = { ...state, ...updates }
  saveEasterEggState(newState)
}

// 获取彩蛋冷却
export function getEasterEggCooldowns(): EasterEggCooldown {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(COOLDOWN_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Failed to load easter egg cooldowns:', error)
    return {}
  }
}

// 保存彩蛋冷却
export function saveEasterEggCooldowns(cooldowns: EasterEggCooldown): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldowns))
  } catch (error) {
    console.error('Failed to save easter egg cooldowns:', error)
  }
}

// 检查彩蛋是否在冷却中
export function isEasterEggInCooldown(eggId: string, cooldownHours: number = 24): boolean {
  const cooldowns = getEasterEggCooldowns()
  const lastTrigger = cooldowns[eggId]
  
  if (!lastTrigger) return false
  
  const now = Date.now()
  const cooldownPeriod = cooldownHours * 60 * 60 * 1000
  
  return now - lastTrigger < cooldownPeriod
}

// 设置彩蛋冷却
export function setEasterEggCooldown(eggId: string): void {
  const cooldowns = getEasterEggCooldowns()
  cooldowns[eggId] = Date.now()
  saveEasterEggCooldowns(cooldowns)
}

// 记录触发的彩蛋
export function recordTriggeredEgg(eggId: string, content: string, mode: EasterEggMode): void {
  const state = getEasterEggState()
  
  const triggered: TriggeredEgg = {
    id: eggId,
    triggeredAt: new Date().toISOString(),
    content,
    mode,
  }
  
  state.triggeredEggs.push(triggered)
  
  // 只保留最近100个彩蛋记录
  if (state.triggeredEggs.length > 100) {
    state.triggeredEggs = state.triggeredEggs.slice(-100)
  }
  
  saveEasterEggState(state)
}

// 更新最后活跃日期
export function updateLastActiveDate(): void {
  const state = getEasterEggState()
  const today = new Date().toISOString().split('T')[0]
  
  state.lastActiveDate = new Date().toISOString()
  
  // 更新活跃日期列表
  if (!state.activeDates.includes(today)) {
    state.activeDates.push(today)
    
    // 只保留最近90天的记录
    if (state.activeDates.length > 90) {
      state.activeDates = state.activeDates.slice(-90)
    }
  }
  
  saveEasterEggState(state)
}

// 计算连续天数
export function calculateConsecutiveDays(): number {
  const state = getEasterEggState()
  const sortedDates = state.activeDates.sort()
  
  if (sortedDates.length === 0) return 0
  
  let consecutive = 1
  for (let i = sortedDates.length - 1; i > 0; i--) {
    const curr = new Date(sortedDates[i])
    const prev = new Date(sortedDates[i - 1])
    const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff === 1) {
      consecutive++
    } else {
      break
    }
  }
  
  return consecutive
}

// 获取已解锁的彩蛋数量（不透露总数）
export function getUnlockedEasterEggCount(): number {
  const state = getEasterEggState()
  // 使用 Set 去重，因为同一个彩蛋可能触发多次
  const uniqueEggs = new Set(state.triggeredEggs.map(e => e.id))
  return uniqueEggs.size
}

// 获取彩蛋进度百分比（神秘显示）
export function getEasterEggProgress(): number {
  const unlocked = getUnlockedEasterEggCount()
  // 总共有约40个不同的彩蛋，但不告诉用户具体数量
  const total = 40
  return Math.min(Math.floor((unlocked / total) * 100), 100)
}

// 重置彩蛋状态（用于测试）
export function resetEasterEggState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(COOLDOWN_KEY)
}
