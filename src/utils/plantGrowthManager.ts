/**
 * 植物生长系统数据管理
 */

import { PlantGrowthState, PlantStage, StageAchievement, PLANT_STAGES } from '@/types/plantGrowth'

const STORAGE_KEY = 'digital_garden_plant_growth'

// 获取默认状态
function getDefaultState(): PlantGrowthState {
  return {
    totalWords: 0,
    currentStage: 'seed',
    achievements: [],
    lastUpdated: new Date().toISOString(),
    noteWordCounts: {}
  }
}

// 获取植物生长状态
export function getPlantGrowthState(): PlantGrowthState {
  if (typeof window === 'undefined') return getDefaultState()
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return getDefaultState()
    
    const state = JSON.parse(stored) as PlantGrowthState
    
    // 确保所有字段都存在
    return {
      ...getDefaultState(),
      ...state,
      noteWordCounts: state.noteWordCounts || {}
    }
  } catch (error) {
    console.error('读取植物生长状态失败:', error)
    return getDefaultState()
  }
}

// 保存植物生长状态
export function savePlantGrowthState(state: PlantGrowthState): void {
  if (typeof window === 'undefined') return
  
  try {
    state.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('保存植物生长状态失败:', error)
  }
}

// 计算文本字数（去除空格和标点）
export function countWords(text: string): number {
  if (!text) return 0
  
  // 移除 Markdown 语法
  const cleanText = text
    // 移除代码块
    .replace(/```[\s\S]*?```/g, '')
    // 移除行内代码
    .replace(/`[^`]*`/g, '')
    // 移除链接
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 移除图片
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // 移除标题标记
    .replace(/^#+\s+/gm, '')
    // 移除列表标记
    .replace(/^[-*+]\s+/gm, '')
    // 移除引用标记
    .replace(/^>\s+/gm, '')
  
  // 计算中文字符数
  const chineseChars = cleanText.match(/[\u4e00-\u9fa5]/g) || []
  
  // 计算英文单词数
  const englishWords = cleanText
    .replace(/[\u4e00-\u9fa5]/g, ' ') // 移除中文
    .match(/[a-zA-Z]+/g) || []
  
  return chineseChars.length + englishWords.length
}

// 根据字数获取当前阶段
export function getStageByWords(words: number): PlantStage {
  for (const stage of PLANT_STAGES) {
    if (words >= stage.minWords && words <= stage.maxWords) {
      return stage.stage
    }
  }
  return 'fruit' // 默认返回最高阶段
}

// 获取阶段配置
export function getStageConfig(stage: PlantStage) {
  return PLANT_STAGES.find(s => s.stage === stage) || PLANT_STAGES[0]
}

// 获取下一阶段配置
export function getNextStageConfig(currentStage: PlantStage) {
  const currentIndex = PLANT_STAGES.findIndex(s => s.stage === currentStage)
  if (currentIndex === -1 || currentIndex === PLANT_STAGES.length - 1) {
    return null // 已经是最高阶段
  }
  return PLANT_STAGES[currentIndex + 1]
}

// 计算到下一阶段的进度
export function getProgressToNextStage(words: number, currentStage: PlantStage): number {
  const nextStage = getNextStageConfig(currentStage)
  if (!nextStage) return 100 // 已经是最高阶段
  
  const currentConfig = getStageConfig(currentStage)
  const currentMin = currentConfig.minWords
  const nextMin = nextStage.minWords
  
  const progress = ((words - currentMin) / (nextMin - currentMin)) * 100
  return Math.min(Math.max(progress, 0), 100)
}

// 更新笔记字数
export function updateNoteWordCount(noteId: string, content: string): {
  state: PlantGrowthState
  stageChanged: boolean
  newStage?: PlantStage
  oldStage?: PlantStage
} {
  const state = getPlantGrowthState()
  const oldStage = state.currentStage
  
  // 计算新字数
  const newWordCount = countWords(content)
  const oldWordCount = state.noteWordCounts[noteId] || 0
  
  // 更新笔记字数记录
  state.noteWordCounts[noteId] = newWordCount
  
  // 更新总字数
  state.totalWords = state.totalWords - oldWordCount + newWordCount
  
  // 检查阶段变化
  const newStage = getStageByWords(state.totalWords)
  const stageChanged = newStage !== oldStage
  
  if (stageChanged) {
    state.currentStage = newStage
    
    // 记录阶段达成
    const achievement: StageAchievement = {
      stage: newStage,
      achievedAt: new Date().toISOString(),
      totalWords: state.totalWords,
      noteCount: Object.keys(state.noteWordCounts).length
    }
    
    // 检查是否已经记录过这个阶段
    const existingIndex = state.achievements.findIndex(a => a.stage === newStage)
    if (existingIndex === -1) {
      state.achievements.push(achievement)
    } else {
      // 更新现有记录
      state.achievements[existingIndex] = achievement
    }
  }
  
  // 保存状态
  savePlantGrowthState(state)
  
  return {
    state,
    stageChanged,
    newStage: stageChanged ? newStage : undefined,
    oldStage: stageChanged ? oldStage : undefined
  }
}

// 删除笔记时更新字数
export function removeNoteWordCount(noteId: string): PlantGrowthState {
  const state = getPlantGrowthState()
  
  // 获取该笔记的字数
  const wordCount = state.noteWordCounts[noteId] || 0
  
  // 从总字数中减去
  state.totalWords = Math.max(0, state.totalWords - wordCount)
  
  // 删除记录
  delete state.noteWordCounts[noteId]
  
  // 更新当前阶段
  state.currentStage = getStageByWords(state.totalWords)
  
  // 保存状态
  savePlantGrowthState(state)
  
  return state
}

// 重新计算所有笔记的字数（用于修复数据）
export function recalculateAllWords(notes: Array<{ id: string; content: string }>): PlantGrowthState {
  const state = getPlantGrowthState()
  
  // 清空现有记录
  state.noteWordCounts = {}
  state.totalWords = 0
  
  // 重新计算
  notes.forEach(note => {
    const wordCount = countWords(note.content)
    state.noteWordCounts[note.id] = wordCount
    state.totalWords += wordCount
  })
  
  // 更新当前阶段
  state.currentStage = getStageByWords(state.totalWords)
  
  // 保存状态
  savePlantGrowthState(state)
  
  return state
}

// 获取阶段历史记录（按时间排序）
export function getStageHistory(): StageAchievement[] {
  const state = getPlantGrowthState()
  return [...state.achievements].sort((a, b) => 
    new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime()
  )
}

// 重置植物生长状态（用于测试）
export function resetPlantGrowth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
