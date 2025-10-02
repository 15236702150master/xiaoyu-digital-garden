'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles } from 'lucide-react'

interface EasterEggModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  icon: string
}

export default function EasterEggModal({ isOpen, onClose, title, content, icon }: EasterEggModalProps) {
  const [show, setShow] = useState(false)
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([])

  useEffect(() => {
    if (isOpen) {
      setShow(true)
      // 生成彩纸效果
      const newConfetti = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
      }))
      setConfetti(newConfetti)
    } else {
      setShow(false)
      setConfetti([])
    }
  }, [isOpen])

  if (!isOpen && !show) return null

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
      show ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 彩纸效果 */}
      {confetti.map((item) => (
        <div
          key={item.id}
          className="absolute top-0 w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'][Math.floor(Math.random() * 6)],
          }}
        />
      ))}
      
      {/* 弹窗内容 */}
      <div className={`relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-500 animate-pulse-glow ${
        show ? 'scale-100 rotate-0' : 'scale-50 rotate-12'
      }`}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* 顶部装饰 */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="text-6xl animate-bounce animate-float">
            {icon}
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="pt-16 pb-8 px-8">
          {/* 标题 */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                彩蛋解锁！
              </h2>
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-lg font-medium text-gray-800">
              {title}
            </p>
          </div>
          
          {/* 内容 */}
          <div className="bg-white rounded-xl p-6 shadow-inner border border-gray-100">
            <div className="text-gray-700 whitespace-pre-line leading-relaxed">
              {content}
            </div>
          </div>
          
          {/* 底部按钮 */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              收下这份惊喜 ✨
            </button>
          </div>
        </div>
        
        {/* 底部装饰波浪 */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-b-2xl" />
      </div>
      
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(236, 72, 153, 0.6);
          }
        }
        
        .animate-confetti {
          animation: confetti 3s linear infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
