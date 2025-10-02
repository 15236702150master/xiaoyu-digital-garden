/**
 * 植物生长系统类型定义
 */

// 植物生长阶段
export type PlantStage = 'seed' | 'sprout' | 'pot' | 'tree' | 'flower' | 'fruit'

// 植物阶段配置
export interface PlantStageConfig {
  stage: PlantStage
  name: string
  emoji: string
  minWords: number
  maxWords: number
  color: string
  description: string
}

// 阶段达成记录
export interface StageAchievement {
  stage: PlantStage
  achievedAt: string // ISO 时间戳
  totalWords: number
  noteCount: number
}

// 植物生长状态
export interface PlantGrowthState {
  totalWords: number // 总字数
  currentStage: PlantStage // 当前阶段
  achievements: StageAchievement[] // 阶段达成历史
  lastUpdated: string // 最后更新时间
  noteWordCounts: Record<string, number> // 每个笔记的字数记录 { noteId: wordCount }
}

// 植物阶段定义
export const PLANT_STAGES: PlantStageConfig[] = [
  {
    stage: 'seed',
    name: '种子',
    emoji: '🌱',
    minWords: 0,
    maxWords: 999,
    color: '#86efac',
    description: '一颗充满希望的种子，等待发芽'
  },
  {
    stage: 'sprout',
    name: '幼苗',
    emoji: '🌿',
    minWords: 1000,
    maxWords: 1999,
    color: '#4ade80',
    description: '嫩绿的幼苗破土而出，开始成长'
  },
  {
    stage: 'pot',
    name: '小盆栽',
    emoji: '🪴',
    minWords: 2000,
    maxWords: 4999,
    color: '#22c55e',
    description: '茁壮成长的小盆栽，充满生机'
  },
  {
    stage: 'tree',
    name: '小树',
    emoji: '🌳',
    minWords: 5000,
    maxWords: 9999,
    color: '#16a34a',
    description: '挺拔的小树，枝繁叶茂'
  },
  {
    stage: 'flower',
    name: '开花',
    emoji: '🌸',
    minWords: 10000,
    maxWords: 59999,
    color: '#ec4899',
    description: '美丽的花朵绽放，散发芬芳'
  },
  {
    stage: 'fruit',
    name: '结果',
    emoji: '🍎',
    minWords: 60000,
    maxWords: Infinity,
    color: '#dc2626',
    description: '硕果累累，收获满满！'
  }
]
