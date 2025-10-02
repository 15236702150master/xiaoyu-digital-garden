'use client'

import { useState, useEffect } from 'react'
import { Gift, Sparkles, Lock } from 'lucide-react'
import { getUnlockedEasterEggCount, getEasterEggProgress, getEasterEggState } from '@/utils/easterEggManager'

interface EasterEggProgressProps {
  isDark: boolean
}

export default function EasterEggProgress({ isDark }: EasterEggProgressProps) {
  const [unlockedCount, setUnlockedCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    updateProgress()
  }, [])

  const updateProgress = () => {
    const count = getUnlockedEasterEggCount()
    const prog = getEasterEggProgress()
    setUnlockedCount(count)
    setProgress(prog)
  }

  // 监听彩蛋解锁事件
  useEffect(() => {
    const handleEasterEggUnlocked = () => {
      setIsAnimating(true)
      updateProgress()
      setTimeout(() => setIsAnimating(false), 1000)
    }

    window.addEventListener('easterEggUnlocked', handleEasterEggUnlocked)
    return () => window.removeEventListener('easterEggUnlocked', handleEasterEggUnlocked)
  }, [])

  return (
    <div className="relative group">
      <button
        className={`p-2 rounded-lg transition-all duration-300 ${
          isAnimating ? 'scale-110 rotate-12' : 'scale-100'
        } ${
          isDark 
            ? 'bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]' 
            : 'bg-white text-[#52575b] hover:bg-gray-50'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="relative">
          <Gift className={`w-5 h-5 ${isAnimating ? 'animate-bounce' : ''}`} />
          {unlockedCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
          )}
        </div>
      </button>

      {/* 神秘提示框 */}
      <div className={`absolute right-0 top-full mt-2 w-72 rounded-lg shadow-lg border transition-all z-50 ${
        showTooltip ? 'opacity-100 visible' : 'opacity-0 invisible'
      } ${
        isDark 
          ? 'bg-[#2a2a2a] border-[#404040]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-4">
          {/* 标题 */}
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className={`text-sm font-medium ${
              isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
            }`}>
              神秘彩蛋收集
            </span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>

          {/* 进度条 */}
          <div className="mb-3">
            <div className={`h-2 rounded-full overflow-hidden ${
              isDark ? 'bg-[#3a3a3a]' : 'bg-gray-200'
            }`}>
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-500 relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          <div className={`text-xs space-y-2 ${
            isDark ? 'text-[#a0a0a0]' : 'text-gray-600'
          }`}>
            <div className="flex items-center justify-between">
              <span>已解锁彩蛋</span>
              <span className="font-medium text-purple-500">{unlockedCount} 个</span>
            </div>
            <div className="flex items-center justify-between">
              <span>探索进度</span>
              <span className="font-medium text-pink-500">{progress}%</span>
            </div>
          </div>

          {/* 神秘提示 */}
          <div className={`mt-3 pt-3 border-t text-xs ${
            isDark ? 'border-[#404040] text-[#a0a0a0]' : 'border-gray-200 text-gray-500'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-3 h-3" />
              <span className="font-medium">神秘提示</span>
            </div>
            <p className="leading-relaxed">
              {unlockedCount === 0 
                ? '开始写笔记，发现隐藏的惊喜...'
                : unlockedCount < 5
                ? '继续探索，更多惊喜等着你...'
                : unlockedCount < 10
                ? '你已经发现了一些秘密！'
                : '你是真正的彩蛋猎人！🎉'
              }
            </p>
          </div>

          {/* 装饰性元素 */}
          {unlockedCount > 0 && (
            <div className="mt-3 flex justify-center gap-1">
              {Array.from({ length: Math.min(unlockedCount, 10) }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
