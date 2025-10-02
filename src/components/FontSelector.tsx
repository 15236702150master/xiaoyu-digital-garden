'use client'

import { Type } from 'lucide-react'
import { checkAllFontsUsed } from '../utils/easterEggTriggers'

interface FontSelectorProps {
  isDark: boolean
  onFontChange: (font: string) => void
  currentFont: string
}

export default function FontSelector({ isDark, onFontChange, currentFont }: FontSelectorProps) {
  const fonts = [
    { name: '默认字体', value: 'Inter, system-ui, -apple-system, sans-serif', category: '系统字体' },
    { name: '系统字体', value: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif', category: '系统字体' },
    { name: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", sans-serif', category: '现代字体' },
    { name: '思源黑体', value: '"Source Han Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif', category: '现代字体' },
    { name: '行楷', value: '"STXingkai", "华文行楷", "AR PL UKai CN", cursive', category: '传统书法' },
    { name: '隶书', value: '"STLiti", "华文隶书", "LiSu", cursive', category: '传统书法' },
    { name: '书法手写体', value: '"STXingshu", "华文行书", "FZShuSong-Z01S", "AR PL UKai CN", cursive', category: '手写体' },
    { name: '呆萌手写体', value: '"Dymon Handwriting", "呆萌手写体", "STYuanti", "华文幼圆", "YouYuan", fantasy', category: '可爱手写' },
    { name: '泡泡糖体', value: '"FZPaoPao", "泡泡糖体", "STCaiyun", "华文彩云", fantasy', category: '趣味卡通' },
    { name: '棉花糖体', value: '"FZMianhua", "棉花糖体", "STXingkai", cursive', category: '趣味卡通' },
    { name: '遇见台南', value: '"FZLanTingHei-R-GBK", "方正兰亭黑", "Microsoft YaHei", sans-serif', category: '现代简约' },
    { name: '爱情故事', value: '"FZShuTi", "方正舒体", "STCaiyun", "华文彩云", cursive', category: '浪漫手写' },
    { name: '闲月羞花', value: '"FZQingKeBenYueSongS-R-GB", "方正清刻本悦宋", "STSong", serif', category: '优雅细腻' },
    { name: '江南春', value: '"FZJingLeiS-R-GB", "方正静蕾简体", "STXingkai", cursive', category: '清新淡雅' },
    { name: '墨韵飞白', value: '"FZCuSong-B09S", "方正粗宋", "STHeiti", "华文黑体", serif', category: '古典韵味' },
  ]

  return (
    <div className="relative group">
      <button className={`p-2 rounded-lg transition-colors ${
        isDark 
          ? 'bg-[#2a2a2a] text-[#e0e0e0] hover:bg-[#3a3a3a]' 
          : 'bg-white text-[#52575b] hover:bg-gray-50'
      }`}>
        <Type className="w-5 h-5" />
      </button>
      <div className={`absolute right-0 top-full mt-2 w-72 rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${
        isDark 
          ? 'bg-[#2a2a2a] border-[#404040]' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-3">
          <div className={`text-sm font-medium mb-3 ${
            isDark ? 'text-[#e0e0e0]' : 'text-gray-800'
          }`}>
            选择字体
          </div>
          <div className="max-h-80 overflow-y-auto">
            {['系统字体', '现代字体', '传统书法', '手写体', '可爱手写', '趣味卡通', '现代简约', '浪漫手写', '优雅细腻', '清新淡雅', '古典韵味'].map(category => {
              const categoryFonts = fonts.filter(font => font.category === category)
              if (categoryFonts.length === 0) return null
              
              return (
                <div key={category} className="mb-4 last:mb-0">
                  <div className={`text-xs font-medium mb-2 px-1 ${
                    isDark ? 'text-[#a0a0a0]' : 'text-gray-500'
                  }`}>
                    {category}
                  </div>
                  <div className="space-y-1">
                    {categoryFonts.map(font => (
                      <button
                        key={font.value}
                        onClick={() => {
                          onFontChange(font.value)
                          checkAllFontsUsed(font.value)
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          currentFont === font.value 
                            ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600')
                            : (isDark ? 'text-[#e0e0e0] hover:bg-[#3a3a3a]' : 'text-gray-700 hover:bg-gray-100')
                        }`}
                        style={{ fontFamily: font.value }}
                        title={`${font.name} - ${category}`}
                      >
                        <div className="truncate">{font.name}</div>
                        <div className={`text-xs mt-1 opacity-70 ${
                          font.category === '手写体' || font.category === '可爱手写' || font.category === '浪漫手写' || font.category === '趣味卡通' ? 'font-normal' : ''
                        }`} style={{ fontFamily: font.value }}>
                          {font.category === '手写体' && font.name.includes('书法') ? '笔画饱满连贯，墨韵较重' : 
                           font.category === '可爱手写' ? '圆润可爱，稚拙天真' :
                           font.category === '趣味卡通' && font.name.includes('泡泡') ? 'Q弹可爱，甜蜜梦幻' :
                           font.category === '趣味卡通' && font.name.includes('棉花') ? '柔软甜美，云朵般轻盈' :
                           font.category === '趣味卡通' ? '活泼有趣，充满童真' :
                           font.category === '现代简约' ? '简约时尚，清新现代' :
                           font.category === '浪漫手写' ? '温柔流畅，浪漫唯美' :
                           font.category === '优雅细腻' ? '精致典雅，细腻温润' :
                           font.category === '清新淡雅' ? '清新脱俗，淡雅如兰' :
                           font.category === '古典韵味' ? '古朴厚重，墨香悠远' :
                           '预览效果 Aa Bb Cc 123'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
