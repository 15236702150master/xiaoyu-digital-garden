'use client'

import { useState, useEffect } from 'react'
import { Sprout, TrendingUp, History, X } from 'lucide-react'
import { 
  getPlantGrowthState, 
  getStageConfig, 
  getNextStageConfig,
  getProgressToNextStage,
  getStageHistory
} from '@/utils/plantGrowthManager'
import { PlantGrowthState, StageAchievement } from '@/types/plantGrowth'

interface PlantGrowthProps {
  onStageChange?: (newStage: string, oldStage: string) => void
}

export default function PlantGrowth({ onStageChange }: PlantGrowthProps) {
  const [state, setState] = useState<PlantGrowthState | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // 加载状态
  useEffect(() => {
    const loadState = () => {
      const newState = getPlantGrowthState()
      setState(newState)
    }

    loadState()

    // 监听状态更新
    const handleUpdate = () => {
      loadState()
    }

    window.addEventListener('plantGrowthUpdated', handleUpdate)
    return () => window.removeEventListener('plantGrowthUpdated', handleUpdate)
  }, [])

  // 监听阶段变化
  useEffect(() => {
    if (state) {
      const handleStageChange = ((event: CustomEvent) => {
        const { newStage, oldStage } = event.detail
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 1000)
        
        if (onStageChange) {
          onStageChange(newStage, oldStage)
        }
      }) as EventListener

      window.addEventListener('plantStageChanged', handleStageChange)
      return () => window.removeEventListener('plantStageChanged', handleStageChange)
    }
  }, [state, onStageChange])

  if (!state) return null

  const currentConfig = getStageConfig(state.currentStage)
  const nextConfig = getNextStageConfig(state.currentStage)
  const progress = getProgressToNextStage(state.totalWords, state.currentStage)
  const history = getStageHistory()

  return (
    <>
      {/* 主显示区域 - 右下角 */}
      <div className="fixed bottom-6 right-6 z-40">
        <div 
          className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl transition-all duration-300 ${
            isExpanded ? 'w-80' : 'w-20'
          } ${isAnimating ? 'animate-bounce' : ''}`}
          style={{ 
            borderColor: currentConfig.color,
            borderWidth: '2px',
            borderStyle: 'solid'
          }}
        >
          {/* 折叠状态 - 只显示植物 */}
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full h-20 flex items-center justify-center hover:scale-110 transition-transform"
              title="点击查看详情"
            >
              <div className={`text-5xl ${isAnimating ? 'animate-pulse' : 'animate-bounce'}`}>
                {currentConfig.emoji}
              </div>
            </button>
          )}

          {/* 展开状态 - 显示详细信息 */}
          {isExpanded && (
            <div className="p-4">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5" style={{ color: currentConfig.color }} />
                  <span className="font-medium text-gray-800">我的花园</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* 植物显示 */}
              <div className="text-center mb-4">
                <div className={`text-6xl mb-2 ${isAnimating ? 'animate-bounce' : ''}`}>
                  {currentConfig.emoji}
                </div>
                <div className="text-lg font-medium" style={{ color: currentConfig.color }}>
                  {currentConfig.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentConfig.description}
                </div>
              </div>

              {/* 字数统计 */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">总字数</span>
                  <span className="font-bold text-gray-800">
                    {state.totalWords.toLocaleString()} 字
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>笔记数量</span>
                  <span>{Object.keys(state.noteWordCounts).length} 篇</span>
                </div>
              </div>

              {/* 进度条 */}
              {nextConfig && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>距离 {nextConfig.name}</span>
                    <span>{nextConfig.minWords - state.totalWords} 字</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: currentConfig.color
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {progress.toFixed(1)}%
                  </div>
                </div>
              )}

              {/* 最高阶段提示 */}
              {!nextConfig && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 mb-3 text-center">
                  <div className="text-2xl mb-1">🎉</div>
                  <div className="text-sm font-medium text-red-600">
                    已达到最高阶段！
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    继续创作，保持这份热情！
                  </div>
                </div>
              )}

              {/* 按钮组 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>成长历程</span>
                </button>
                <button
                  onClick={() => {
                    // 触发五彩纸屑
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('triggerPlantConfetti'))
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm text-white transition-colors"
                  style={{ backgroundColor: currentConfig.color }}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>庆祝一下</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 历史记录弹窗 */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* 头部 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-800">成长历程</h2>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🌱</div>
                  <div className="text-gray-500">还没有达成任何阶段</div>
                  <div className="text-sm text-gray-400 mt-1">开始写作，让植物成长吧！</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((achievement, index) => {
                    const config = getStageConfig(achievement.stage)
                    const date = new Date(achievement.achievedAt)
                    
                    return (
                      <div 
                        key={achievement.stage}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {/* 图标 */}
                        <div className="flex-shrink-0">
                          <div className="text-4xl">{config.emoji}</div>
                        </div>

                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800">{config.name}</span>
                            {index === history.length - 1 && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                当前
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {config.description}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>📅 {date.toLocaleDateString('zh-CN')}</span>
                            <span>🕐 {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>📝 {achievement.totalWords.toLocaleString()} 字</span>
                            <span>📚 {achievement.noteCount} 篇</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 底部统计 */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-around text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{history.length}</div>
                  <div className="text-xs text-gray-600">达成阶段</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{state.totalWords.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">总字数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{Object.keys(state.noteWordCounts).length}</div>
                  <div className="text-xs text-gray-600">笔记数</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
