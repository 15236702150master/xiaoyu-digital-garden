'use client'

import { useState, useEffect, useRef } from 'react'
import { X, RefreshCw } from 'lucide-react'

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

// 鼓励语
const MESSAGES = {
  encouragement: [
    '你的想法很独特呢 ✨',
    '文字越来越流畅了 📝',
    '坚持就是胜利！💪',
    '每一次创作都是成长 🌱',
    '你的文字很有温度呢 🔥',
    '创作的灵感在夜晚绽放 🌟',
  ],
  healthReminder: [
    '喝口水吧 💧',
    '眼睛休息一下 👀',
    '站起来走走 🚶',
    '深呼吸，放松 🌬️',
    '伸个懒腰吧 🙆',
  ],
  nightCare: [
    '夜深了，记得休息哦 💤',
    '写得真棒！但也要注意身体呀 ❤️',
    '喝杯温水，放松一下吧 🥛',
    '已经很晚了，明天继续加油！🌙',
  ],
}

export default function NightCompanionSimple() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentAnimal, setCurrentAnimal] = useState(ANIMALS[0])
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isFed, setIsFed] = useState(false)
  const [showReaction, setShowReaction] = useState(false)
  const [reactionText, setReactionText] = useState('')
  const [isHappy, setIsHappy] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  
  const dragRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const bubbleTimerRef = useRef<NodeJS.Timeout>()
  const clockTimerRef = useRef<NodeJS.Timeout>()

  // 检查是否是深夜时间（正式模式：22:00-06:00）
  const isNightTime = () => {
    const now = new Date()
    const hour = now.getHours()
    
    // 正式模式：22:00-06:00
    return hour >= 22 || hour < 6
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

  // 智能时间触发器 - 只在关键时刻检查
  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const second = now.getSeconds()

    // 计算到下一个关键时刻的毫秒数
    const calculateNextTrigger = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const target = new Date(now)
      
      // 正式模式：22:00 和 06:00
      if (currentHour >= 6 && currentHour < 22) {
        // 白天时段（06:00-22:00），计算到今晚22:00
        target.setHours(22, 0, 0, 0)
        return target.getTime() - now.getTime()
      } else if (currentHour >= 22) {
        // 深夜时段（22:00-24:00），计算到明天06:00
        target.setDate(target.getDate() + 1)
        target.setHours(6, 0, 0, 0)
        return target.getTime() - now.getTime()
      } else {
        // 凌晨时段（00:00-06:00），计算到今天06:00
        target.setHours(6, 0, 0, 0)
        return target.getTime() - now.getTime()
      }
    }

    const checkAndUpdate = () => {
      const now = new Date()
      const shouldShow = isNightTime()
      
      if (shouldShow && !isVisible) {
        // 时间段开始，自动显示
        const closedUntil = localStorage.getItem('night_companion_closed_until')
        if (closedUntil) {
          const closedTime = new Date(closedUntil).getTime()
          if (now.getTime() < closedTime) {
            // 还在关闭期间，计算到关闭结束的时间
            const nextCheck = closedTime - now.getTime() + 1000
            clockTimerRef.current = setTimeout(checkAndUpdate, nextCheck)
            console.log(`⏰ [智能触发] 关闭期间，${Math.round(nextCheck/1000)}秒后重新检查`)
            return
          }
        }

        const savedPosition = localStorage.getItem('night_companion_position')
        if (savedPosition) {
          setPosition(JSON.parse(savedPosition))
        } else {
          setPosition({ x: window.innerWidth - 100, y: window.innerHeight - 100 })
        }

        setIsVisible(true)
        setMessage(getRandomMessage())
        console.log('⏰ [智能触发] 时间段开始，深夜陪伴自动显示', now.toLocaleTimeString())
        
        // 设置下一个触发点（14:10）
        const nextTrigger = calculateNextTrigger()
        clockTimerRef.current = setTimeout(checkAndUpdate, nextTrigger)
        console.log(`⏰ [智能触发] 下次检查时间：${Math.round(nextTrigger/1000)}秒后`)
        
      } else if (!shouldShow && isVisible) {
        // 时间段结束，自动隐藏
        setIsVisible(false)
        setShowMenu(false)
        setShowBubble(false)
        console.log('⏰ [智能触发] 时间段结束，深夜陪伴自动隐藏', now.toLocaleTimeString())
        
        // 设置下一个触发点（明天14:00）
        const nextTrigger = calculateNextTrigger()
        clockTimerRef.current = setTimeout(checkAndUpdate, nextTrigger)
        console.log(`⏰ [智能触发] 下次检查时间：${Math.round(nextTrigger/1000)}秒后`)
        
      } else {
        // 状态正常，设置下一个触发点
        const nextTrigger = calculateNextTrigger()
        clockTimerRef.current = setTimeout(checkAndUpdate, nextTrigger)
        console.log(`⏰ [智能触发] 下次检查时间：${Math.round(nextTrigger/1000)}秒后`)
      }
    }

    // 立即执行一次检查
    checkAndUpdate()

    return () => {
      if (clockTimerRef.current) {
        clearTimeout(clockTimerRef.current)
      }
    }
  }, [isVisible])

  // 自动弹出气泡对话（每2分钟）
  useEffect(() => {
    if (!isVisible) return

    const showAutoBubble = () => {
      if (!showMenu && !isDragging) {
        setMessage(getRandomMessage())
        setShowBubble(true)
        console.log('💬 自动弹出对话气泡')
        
        // 5秒后自动隐藏气泡
        setTimeout(() => {
          setShowBubble(false)
        }, 5000)
      }
    }

    // 初始延迟10秒后第一次显示
    const initialTimer = setTimeout(showAutoBubble, 10000)

    // 之后每2分钟显示一次
    bubbleTimerRef.current = setInterval(showAutoBubble, 2 * 60 * 1000)

    return () => {
      clearTimeout(initialTimer)
      if (bubbleTimerRef.current) {
        clearInterval(bubbleTimerRef.current)
      }
    }
  }, [isVisible, showMenu, isDragging])


  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && 
          dragRef.current && !dragRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  // 拖动处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (showMenu) return // 菜单打开时不拖动
    
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

      const maxX = window.innerWidth - 80
      const maxY = window.innerHeight - 80

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
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

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu(!showMenu)
  }

  // 悬浮显示叫声
  const handleMouseEnter = () => {
    if (!showMenu && !isDragging) {
      setReactionText(currentAnimal.sound)
      setShowReaction(true)
    }
  }

  const handleMouseLeave = () => {
    setShowReaction(false)
  }

  // 点击动物
  const handleClickAnimal = () => {
    if (!showMenu) {
      setReactionText(currentAnimal.sound)
      setShowReaction(true)
      setTimeout(() => setShowReaction(false), 2000)
    }
  }

  // 切换动物
  const handleSwitchAnimal = () => {
    const currentIndex = ANIMALS.findIndex(a => a.id === currentAnimal.id)
    const nextIndex = (currentIndex + 1) % ANIMALS.length
    const nextAnimal = ANIMALS[nextIndex]
    
    setCurrentAnimal(nextAnimal)
    setReactionText(nextAnimal.sound)
    setShowReaction(true)
    setTimeout(() => setShowReaction(false), 2000)
    setShowMenu(false)
  }

  // 刷新消息
  const handleRefreshMessage = () => {
    setMessage(getRandomMessage())
    setReactionText('✨')
    setShowReaction(true)
    setTimeout(() => setShowReaction(false), 1500)
    setShowMenu(false)
  }

  // 喂食
  const handleFeed = () => {
    setIsFed(true)
    setIsHappy(true)
    setReactionText(`${currentAnimal.foodEmoji} 好吃！`)
    setShowReaction(true)
    setShowMenu(false)
    
    setTimeout(() => {
      setShowReaction(false)
      setIsFed(false)
      setIsHappy(false)
    }, 3000)
  }

  // 关闭
  const handleClose = () => {
    const closeUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    localStorage.setItem('night_companion_closed_until', closeUntil)
    setIsVisible(false)
    setShowMenu(false)
  }

  if (!isVisible) return null

  return (
    <>
      {/* 小动物 */}
      <div
        ref={dragRef}
        className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onClick={handleClickAnimal}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative">
          <div
            className={`text-6xl select-none transition-transform ${
              isHappy ? 'animate-bounce' : 'hover:scale-110'
            } ${!isDragging && 'animate-sway'}`}
          >
            {currentAnimal.emoji}
          </div>
          
          {/* 悬浮叫声气泡 */}
          {showReaction && (
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-yellow-100 rounded-full px-3 py-1 text-sm shadow-lg whitespace-nowrap">
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
      </div>

      {/* 自动对话气泡 */}
      {showBubble && !showMenu && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-2xl p-3 border-2 border-purple-200 animate-fade-in"
          style={{
            left: `${position.x + 80}px`,
            top: `${position.y}px`,
            maxWidth: '250px',
          }}
        >
          <div className="relative">
            {/* 小三角 */}
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white"></div>
            
            <p className="text-sm text-gray-700 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      )}

      {/* 右键菜单 */}
      {showMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white rounded-lg shadow-2xl p-2 border border-gray-200"
          style={{
            left: `${position.x + 80}px`,
            top: `${position.y}px`,
          }}
        >
          {/* 消息显示 */}
          <div className="px-3 py-2 mb-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <p className="text-xs text-gray-700 text-center max-w-[200px]">
              {message}
            </p>
          </div>

          {/* 按钮 */}
          <button
            onClick={handleSwitchAnimal}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-700 transition-colors"
          >
            <span className="text-lg">🔄</span>
            <span>换一只</span>
          </button>

          <button
            onClick={handleRefreshMessage}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>换一句</span>
          </button>

          <button
            onClick={handleFeed}
            disabled={isFed}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
              isFed ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="text-lg">{currentAnimal.foodEmoji}</span>
            <span>喂食</span>
          </button>

          <div className="border-t border-gray-200 my-1"></div>

          <button
            onClick={handleClose}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded text-sm text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>关闭</span>
          </button>
        </div>
      )}

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

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
