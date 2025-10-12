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
  minNotes: number
  maxNotes: number
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

// 植物阶段定义（基于笔记数量）
export const PLANT_STAGES: PlantStageConfig[] = [
  {
    stage: 'seed',
    name: '种子',
    emoji: '🌱',
    minNotes: 0,
    maxNotes: 9,
    color: '#86efac',
    description: '一颗充满希望的种子，等待发芽'
  },
  {
    stage: 'sprout',
    name: '幼苗',
    emoji: '🌿',
    minNotes: 10,
    maxNotes: 49,
    color: '#4ade80',
    description: '嫩绿的幼苗破土而出，开始成长'
  },
  {
    stage: 'pot',
    name: '小盆栽',
    emoji: '🪴',
    minNotes: 50,
    maxNotes: 149,
    color: '#22c55e',
    description: '茁壮成长的小盆栽，充满生机'
  },
  {
    stage: 'tree',
    name: '小树',
    emoji: '🌳',
    minNotes: 150,
    maxNotes: 299,
    color: '#16a34a',
    description: '挺拔的小树，枝繁叶茂'
  },
  {
    stage: 'flower',
    name: '开花',
    emoji: '🌸',
    minNotes: 300,
    maxNotes: 499,
    color: '#ec4899',
    description: '美丽的花朵绽放，散发芬芳'
  },
  {
    stage: 'fruit',
    name: '结果',
    emoji: '🍎',
    minNotes: 500,
    maxNotes: Infinity,
    color: '#dc2626',
    description: '硕果累累，收获满满！'
  }
]
