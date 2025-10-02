'use client'

import { useState, useEffect, useRef } from 'react'
import { X, RefreshCw, Heart } from 'lucide-react'

// 小动物配置
interface Animal {
  id: string
  emoji: string
  name: string
  sound: string
  food: string
  foodEmoji: string
}

const ANIMALS: Animal[] = [
  { id: 'cat', emoji: '🐱', name: '猫咪', sound: '喵~', food: '小鱼干', foodEmoji: '🐟' },
  { id: 'rabbit', emoji: '🐰', name: '兔子', sound: '蹦蹦跳跳~', food: '胡萝卜', foodEmoji: '🥕' },
  { id: 'owl', emoji: '🦉', name: '猫头鹰', sound: '咕咕咕~', food: '小虫子', foodEmoji: '🐛' },
  { id: 'bear', emoji: '🐻', name: '小熊', sound: '呼噜噜~', food: '蜂蜜', foodEmoji: '🍯' },
  { id: 'fox', emoji: '🦊', name: '小狐狸', sound: '嗷呜~', food: '小鸡腿', foodEmoji: '🍗' },
]

// 鼓励语分类
const MESSAGES = {
  timeReminder: [
    { time: 22, message: '夜晚好！开始创作了吗？✨' },
    { time: 23, message: '已经11点了，注意休息哦 💤' },
    { time: 0, message: '午夜了！夜猫子加油 🌙' },
    { time: 1, message: '凌晨1点，该睡觉啦 😴' },
    { time: 2, message: '太晚了！明天再写吧 🌃' },
    { time: 3, message: '凌晨3点...真的要休息了 💤' },
    { time: 4, message: '快天亮了，睡一会儿吧 🌅' },
    { time: 5, message: '早安！早起的鸟儿有虫吃 🐦' },
  ],
  encouragement: [
    '你的想法很独特呢 ✨',
    '文字越来越流畅了 📝',
    '坚持就是胜利！💪',
    '每一次创作都是成长 🌱',
    '你的文字很有温度呢 🔥',
    '创作的灵感在夜晚绽放 🌟',
    '每一个字都是你的足迹 👣',
    '写得真棒！继续加油 🎉',
    '你的坚持让人感动 💖',
    '灵感正在涌现 💡',
  ],
  healthReminder: [
    '喝口水吧 💧',
    '眼睛休息一下 👀',
    '站起来走走 🚶',
    '深呼吸，放松 🌬️',
    '伸个懒腰吧 🙆',
    '看看远处，保护眼睛 👁️',
    '活动一下手指 ✋',
    '记得定时保存哦 💾',
  ],
  nightCare: [
    '夜深了，记得休息哦 💤',
    '写得真棒！但也要注意身体呀 ❤️',
    '喝杯温水，放松一下吧 🥛',
    '已经很晚了，明天继续加油！🌙',
    '别熬太晚，身体最重要 💕',
    '夜晚的灵感很珍贵，但健康更重要 🌟',
  ],
}

export default function NightCompanion() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentAnimal, setCurrentAnimal] = useState(ANIMALS[0])
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isFed, setIsFed] = useState(false)
  const [showReaction, setShowReaction] = useState(false)
  const [reactionText, setReactionText] = useState('')
  const [isHappy, setIsHappy] = useState(false)
  
  const dragRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0 })

  // 检查是否是深夜时间（测试模式：14:00-14:10）
  const isNightTime = () => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    // 测试模式：14:00-14:10
    return hour === 14 && minute < 10
    
    // 正式模式：22:00-06:00（测试完成后恢复）
    // return hour >= 22 || hour < 6
  }

  // 获取当前时间对应的提醒
  const getTimeMessage = () => {
    const hour = new Date().getHours()
    const timeMsg = MESSAGES.timeReminder.find(m => m.time === hour)
    return timeMsg ? timeMsg.message : null
  }

  // 随机获取鼓励语
  const getRandomMessage = () => {
    const categories = [
      MESSAGES.encouragement,
      MESSAGES.healthReminder,
      MESSAGES.nightCare,
    ]
    const category = categories[Math.floor(Math.random() * categories.length)]
    return category[Math.floor(Math.random() * category.length)]
  }

  // 初始化
  useEffect(() => {
    // 检查是否是深夜
    if (isNightTime()) {
      // 从 localStorage 读取位置
      const savedPosition = localStorage.getItem('night_companion_position')
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition))
      } else {
        // 默认位置：右上角
        setPosition({ x: window.innerWidth - 250, y: 80 })
      }

      // 检查是否被关闭
      const closedUntil = localStorage.getItem('night_companion_closed_until')
      if (closedUntil) {
        const closedTime = new Date(closedUntil).getTime()
        const now = new Date().getTime()
        if (now < closedTime) {
          return // 还在关闭期间
        }
      }

      setIsVisible(true)
      
      // 显示时间提醒或随机消息
      const timeMsg = getTimeMessage()
      setMessage(timeMsg || getRandomMessage())
    }
  }, [])

  // 定时更新消息（每5分钟）
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      const timeMsg = getTimeMessage()
      setMessage(timeMsg || getRandomMessage())
    }, 5 * 60 * 1000) // 5分钟

    return () => clearInterval(interval)
  }, [isVisible])

  // 定时检查时间段（每分钟检查一次）
  useEffect(() => {
    const checkTimeInterval = setInterval(() => {
      const shouldShow = isNightTime()
      
      if (!shouldShow && isVisible) {
        // 时间段结束，自动隐藏
        setIsVisible(false)
        console.log('⏰ 时间段结束，深夜陪伴自动隐藏')
      } else if (shouldShow && !isVisible) {
        // 检查是否在关闭期间
        const closedUntil = localStorage.getItem('night_companion_closed_until')
        if (closedUntil) {
          const closedTime = new Date(closedUntil).getTime()
          const now = new Date().getTime()
          if (now >= closedTime) {
            // 关闭期已过，重新显示
            setIsVisible(true)
            const timeMsg = getTimeMessage()
            setMessage(timeMsg || getRandomMessage())
            console.log('⏰ 时间段开始，深夜陪伴自动显示')
          }
        } else {
          // 没有关闭记录，直接显示
          setIsVisible(true)
          const timeMsg = getTimeMessage()
          setMessage(timeMsg || getRandomMessage())
          console.log('⏰ 时间段开始，深夜陪伴自动显示')
        }
      }
    }, 60 * 1000) // 每分钟检查一次

    return () => clearInterval(checkTimeInterval)
  }, [isVisible])

  // 拖动处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return // 点击按钮时不拖动
    
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.current.x
      const newY = e.clientY - dragStart.current.y

      // 限制在窗口范围内
      const maxX = window.innerWidth - 250
      const maxY = window.innerHeight - 300

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        // 保存位置
        localStorage.setItem('night_companion_position', JSON.stringify(position))
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, position])

  // 切换动物
  const handleSwitchAnimal = () => {
    const currentIndex = ANIMALS.findIndex(a => a.id === currentAnimal.id)
    const nextIndex = (currentIndex + 1) % ANIMALS.length
    const nextAnimal = ANIMALS[nextIndex]
    
    setCurrentAnimal(nextAnimal)
    setReactionText(nextAnimal.sound)
    setShowReaction(true)
    setTimeout(() => setShowReaction(false), 2000)
  }

  // 刷新消息
  const handleRefreshMessage = () => {
    setMessage(getRandomMessage())
    setReactionText('✨')
    setShowReaction(true)
    setTimeout(() => setShowReaction(false), 1500)
  }

  // 喂食
  const handleFeed = () => {
    setIsFed(true)
    setIsHappy(true)
    setReactionText(`${currentAnimal.foodEmoji} 好吃！`)
    setShowReaction(true)
    
    setTimeout(() => {
      setShowReaction(false)
      setIsFed(false)
      setIsHappy(false)
    }, 3000)
  }

  // 点击动物
  const handleClickAnimal = () => {
    setReactionText(currentAnimal.sound)
    setShowReaction(true)
    setTimeout(() => setShowReaction(false), 2000)
  }

  // 关闭（5分钟后再出现）
  const handleClose = () => {
    const closeUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    localStorage.setItem('night_companion_closed_until', closeUntil)
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div
      ref={dragRef}
      className={`fixed z-50 transition-opacity duration-500 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: isVisible ? 1 : 0,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 w-64 border-2 border-purple-200">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-600 font-medium">🌙 深夜陪伴</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* 小动物 */}
        <div className="relative flex justify-center mb-3">
          <div
            onClick={handleClickAnimal}
            className={`text-6xl cursor-pointer select-none transition-transform ${
              isHappy ? 'animate-bounce' : 'hover:scale-110'
            } ${!isDragging && 'animate-sway'}`}
          >
            {currentAnimal.emoji}
          </div>
          
          {/* 反应气泡 */}
          {showReaction && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-100 rounded-full px-3 py-1 text-sm animate-bounce shadow-lg">
              {reactionText}
            </div>
          )}

          {/* 喂食效果 */}
          {isFed && (
            <div className="absolute top-0 right-0 text-3xl animate-ping">
              ❤️
            </div>
          )}
        </div>

        {/* 动物名称 */}
        <div className="text-center mb-3">
          <span className="text-sm font-medium text-gray-700">{currentAnimal.name}</span>
        </div>

        {/* 对话气泡 */}
        <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 mb-3">
          {/* 小三角 */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-50" />
          
          {/* 消息文字 */}
          <p className="text-sm text-gray-700 text-center leading-relaxed">
            {message}
          </p>
        </div>

        {/* 按钮组 */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleSwitchAnimal}
            className="flex flex-col items-center gap-1 p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-xs text-purple-700"
            title="切换动物"
          >
            <span className="text-lg">🔄</span>
            <span>换一只</span>
          </button>

          <button
            onClick={handleRefreshMessage}
            className="flex flex-col items-center gap-1 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs text-blue-700"
            title="刷新消息"
          >
            <RefreshCw className="w-4 h-4" />
            <span>换一句</span>
          </button>

          <button
            onClick={handleFeed}
            disabled={isFed}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-xs ${isFed ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-pink-50 hover:bg-pink-100 text-pink-700'}`}
            title={`喂${currentAnimal.food}`}
          >
            <span className="text-lg">{currentAnimal.foodEmoji}</span>
            <span>喂食</span>
          </button>
        </div>

        {/* 提示文字 */}
        <div className="mt-3 text-center text-xs text-gray-400">
          可以拖动我到任意位置哦 ✨
        </div>
      </div>

      {/* CSS 动画 */}
      <style jsx>{`
        @keyframes sway {
          0%, 100% {
            transform: rotate(-2deg);
          }
          50% {
            transform: rotate(2deg);
          }
        }

        .animate-sway {
          animation: sway 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
