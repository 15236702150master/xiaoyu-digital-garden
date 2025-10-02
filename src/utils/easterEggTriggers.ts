import { 
  getEasterEggState, 
  saveEasterEggState, 
  isEasterEggInCooldown, 
  setEasterEggCooldown,
  recordTriggeredEgg,
  updateLastActiveDate,
  calculateConsecutiveDays
} from './easterEggManager'
import { getEasterEggContent } from '@/config/easterEggContents'
import { EasterEggMode } from '@/types/easterEgg'
import { triggerConfettiByType, basicConfetti } from './confettiEffects'

// 触发彩蛋的回调函数类型
type EasterEggCallback = (title: string, content: string, icon: string) => void

let easterEggCallback: EasterEggCallback | null = null

// 设置彩蛋触发回调
export function setEasterEggCallback(callback: EasterEggCallback) {
  easterEggCallback = callback
}

// 触发彩蛋
function triggerEasterEgg(eggId: string, params?: Record<string, unknown>) {
  console.log('🎯 尝试触发彩蛋:', eggId)
  
  const state = getEasterEggState()
  
  // 检查是否启用彩蛋
  if (!state.easterEggEnabled) {
    console.log('❌ 彩蛋系统已禁用')
    return
  }
  
  // 检查是否已触发过（所有彩蛋只触发一次）
  if (state.triggeredEggs.some(e => e.id === eggId)) {
    console.log('⚠️ 彩蛋已触发过:', eggId)
    return // 已触发过，不再触发
  }
  
  console.log('✅ 准备触发彩蛋:', eggId)
  
  // 获取当前角色模式
  const mode = state.easterEggMode
  
  // 获取对应的彩蛋内容
  const eggContent = getEasterEggContent(eggId, mode)
  
  if (!eggContent) return
  
  // 记录触发
  recordTriggeredEgg(eggId, eggContent.content, mode)
  
  // 触发五彩纸屑效果
  if (typeof window !== 'undefined') {
    // 根据彩蛋类型选择不同的纸屑效果
    if (eggId.startsWith('milestone')) {
      triggerConfettiByType('milestone')
    } else if (eggId === 'birthday') {
      triggerConfettiByType('birthday')
    } else if (eggId.includes('consecutive') || eggId.includes('daily')) {
      triggerConfettiByType('achievement')
    } else {
      basicConfetti()
    }
  }
  
  // 触发回调显示弹窗
  if (easterEggCallback) {
    easterEggCallback(eggContent.title, eggContent.content, eggContent.icon)
  }
  
  // 触发自定义事件，用于更新进度指示器
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('easterEggUnlocked'))
  }
}

// 检查笔记数量里程碑
export function checkNoteMilestone(totalNotes: number) {
  console.log('📝 检查笔记里程碑，当前笔记数:', totalNotes)
  
  const milestones = [1, 5, 10, 20, 30, 50, 100, 200]
  const state = getEasterEggState()
  
  console.log('🎯 已达成的里程碑:', state.milestonesReached)
  
  for (const milestone of milestones) {
    if (totalNotes === milestone && !state.milestonesReached.includes(milestone)) {
      console.log('✨ 达成新里程碑:', milestone)
      triggerEasterEgg(`milestone_${milestone}`)
      state.milestonesReached.push(milestone)
      saveEasterEggState(state)
      break // 一次只触发一个里程碑
    }
  }
}

// 检查时间相关彩蛋
export function checkTimeBasedEasterEgg() {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()
  
  // 周一早上 (7-9点)
  if (day === 1 && hour >= 7 && hour < 9) {
    if (!isEasterEggInCooldown('monday_morning', 24)) {
      triggerEasterEgg('monday_morning')
      setEasterEggCooldown('monday_morning')
    }
  }
  
  // 周五下午 (16-18点)
  if (day === 5 && hour >= 16 && hour < 18) {
    if (!isEasterEggInCooldown('friday_afternoon', 24)) {
      triggerEasterEgg('friday_afternoon')
      setEasterEggCooldown('friday_afternoon')
    }
  }
  
  // 深夜 (2-5点)
  if (hour >= 2 && hour < 5) {
    if (!isEasterEggInCooldown('late_night', 24)) {
      triggerEasterEgg('late_night')
      setEasterEggCooldown('late_night')
    }
  }
  
  // 午夜12点
  if (hour === 0) {
    if (!isEasterEggInCooldown('midnight', 24)) {
      triggerEasterEgg('midnight')
      setEasterEggCooldown('midnight')
    }
  }
  
  // 午休时间 (12-14点)
  if (hour >= 12 && hour < 14) {
    if (!isEasterEggInCooldown('lunch_break', 24)) {
      triggerEasterEgg('lunch_break')
      setEasterEggCooldown('lunch_break')
    }
  }
  
  // 周末早上 (周六日 8-11点)
  if ((day === 0 || day === 6) && hour >= 8 && hour < 11) {
    if (!isEasterEggInCooldown('weekend_morning', 24)) {
      triggerEasterEgg('weekend_morning')
      setEasterEggCooldown('weekend_morning')
    }
  }
  
  // 工作日晚上 (周一至周五 19-22点)
  if (day >= 1 && day <= 5 && hour >= 19 && hour < 22) {
    if (!isEasterEggInCooldown('workday_evening', 24)) {
      triggerEasterEgg('workday_evening')
      setEasterEggCooldown('workday_evening')
    }
  }
  
  // 早起鸟 (6点前)
  if (hour >= 5 && hour < 6) {
    if (!isEasterEggInCooldown('early_bird', 24)) {
      triggerEasterEgg('early_bird')
      setEasterEggCooldown('early_bird')
    }
  }
  
  // 夜猫子 (凌晨1点后)
  if (hour >= 1 && hour < 2) {
    if (!isEasterEggInCooldown('night_owl', 24)) {
      triggerEasterEgg('night_owl')
      setEasterEggCooldown('night_owl')
    }
  }
  
  // 生日当天（11月5日）
  const birthday = '11-05' // 月-日格式
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  const todayMD = `${month}-${date}`
  
  if (todayMD === birthday) {
    if (!isEasterEggInCooldown('birthday', 24)) {
      triggerEasterEgg('birthday')
      setEasterEggCooldown('birthday')
    }
  }
}

// 检查关键词触发彩蛋
export function checkKeywordEasterEgg(title: string, content: string) {
  const text = (title + ' ' + content).toLowerCase()
  
  const keywords: Record<string, string> = {
    '摆烂': 'keyword_bailan',
    'emo': 'keyword_emo',
    '开心': 'keyword_happy',
    '减肥': 'keyword_diet',
    '生日': 'keyword_birthday',
    '加班': 'keyword_overtime',
    '考试': 'keyword_exam',
    '旅行': 'keyword_travel',
    '旅游': 'keyword_travel',
    '失眠': 'keyword_insomnia',
  }
  
  for (const [keyword, eggId] of Object.entries(keywords)) {
    if (text.includes(keyword)) {
      if (!isEasterEggInCooldown(eggId, 24)) {
        triggerEasterEgg(eggId)
        setEasterEggCooldown(eggId)
        break // 一次只触发一个关键词彩蛋
      }
    }
  }
}

// 检查快速连续创建笔记
export function checkRapidCreate() {
  const state = getEasterEggState()
  const now = Date.now()
  
  // 添加当前时间
  state.recentCreateTimes.push(now)
  
  // 只保留5分钟内的记录
  state.recentCreateTimes = state.recentCreateTimes.filter(t => now - t < 5 * 60 * 1000)
  
  // 5分钟内创建了3个笔记
  if (state.recentCreateTimes.length >= 3) {
    if (!isEasterEggInCooldown('rapid_create', 24)) {
      triggerEasterEgg('rapid_create')
      setEasterEggCooldown('rapid_create')
    }
    state.recentCreateTimes = [] // 重置
  }
  
  saveEasterEggState(state)
}

// 检查长时间未活跃
export function checkInactive() {
  const state = getEasterEggState()
  if (!state.lastActiveDate) return
  
  const lastActive = new Date(state.lastActiveDate)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff >= 7) {
    if (!isEasterEggInCooldown('long_inactive', 168)) { // 7天冷却
      triggerEasterEgg('long_inactive', { days: daysDiff })
      setEasterEggCooldown('long_inactive')
    }
  }
}

// 检查连续天数写作
export function checkConsecutiveDays() {
  const state = getEasterEggState()
  const today = new Date().toISOString().split('T')[0]
  
  if (!state.activeDates.includes(today)) {
    state.activeDates.push(today)
    
    // 计算连续天数
    const consecutive = calculateConsecutiveDays()
    state.consecutiveDays = consecutive
    
    if (consecutive === 3) {
      triggerEasterEgg('consecutive_3days')
    }
    
    if (consecutive === 7) {
      triggerEasterEgg('consecutive_7days')
    }
    
    if (consecutive === 14) {
      triggerEasterEgg('consecutive_14days')
    }
    
    if (consecutive === 30) {
      triggerEasterEgg('consecutive_30days')
    }
    
    saveEasterEggState(state)
  }
}

// 检查单日创建多个笔记
export function checkDailyNoteCount() {
  const state = getEasterEggState()
  const today = new Date().toISOString().split('T')[0]
  
  if (state.lastCheckDate !== today) {
    state.todayNoteCount = 0
    state.lastCheckDate = today
  }
  
  state.todayNoteCount++
  
  if (state.todayNoteCount === 3) {
    triggerEasterEgg('daily_3notes')
  }
  
  if (state.todayNoteCount === 5) {
    triggerEasterEgg('daily_5notes')
  }
  
  saveEasterEggState(state)
}

// 检查总字数突破
export function checkTotalWords(totalWords: number) {
  const milestones = [10000, 50000, 100000]
  const state = getEasterEggState()
  
  for (const milestone of milestones) {
    if (totalWords >= milestone && state.totalWords < milestone) {
      triggerEasterEgg(`words_${milestone}`)
    }
  }
  
  state.totalWords = totalWords
  saveEasterEggState(state)
}

// 检查频繁修改笔记
export function checkFrequentEdit(noteId: string) {
  const state = getEasterEggState()
  state.noteEditCounts[noteId] = (state.noteEditCounts[noteId] || 0) + 1
  
  if (state.noteEditCounts[noteId] === 10) {
    if (!isEasterEggInCooldown('frequent_edit', 24)) {
      triggerEasterEgg('frequent_edit', { count: 10 })
      setEasterEggCooldown('frequent_edit')
    }
  }
  
  saveEasterEggState(state)
}

// 检查第一次使用标签
export function checkFirstTagUse() {
  const state = getEasterEggState()
  if (!state.hasUsedTag) {
    triggerEasterEgg('first_tag')
    state.hasUsedTag = true
    saveEasterEggState(state)
  }
}

// 检查第一次使用双向链接
export function checkFirstLinkUse() {
  const state = getEasterEggState()
  if (!state.hasUsedLink) {
    triggerEasterEgg('first_link')
    state.hasUsedLink = true
    saveEasterEggState(state)
  }
}

// 检查第一次上传图片
export function checkFirstImageUpload() {
  const state = getEasterEggState()
  if (!state.hasUploadedImage) {
    triggerEasterEgg('first_image')
    state.hasUploadedImage = true
    saveEasterEggState(state)
  }
}

// 检查使用了所有字体
export function checkAllFontsUsed(fontValue: string) {
  const state = getEasterEggState()
  const allFonts = [
    'Inter, system-ui, -apple-system, sans-serif',
    'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    '"Microsoft YaHei", "PingFang SC", sans-serif',
    '"Source Han Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif',
    '"STXingkai", "华文行楷", "AR PL UKai CN", cursive',
    '"STLiti", "华文隶书", "LiSu", cursive',
    '"STXingshu", "华文行书", "FZShuSong-Z01S", "AR PL UKai CN", cursive',
    '"Dymon Handwriting", "呆萌手写体", "STYuanti", "华文幼圆", "YouYuan", fantasy',
    '"FZPaoPao", "泡泡糖体", "STCaiyun", "华文彩云", fantasy',
    '"FZMianhua", "棉花糖体", "STXingkai", cursive',
    '"FZLanTingHei-R-GBK", "方正兰亭黑", "Microsoft YaHei", sans-serif',
    '"FZShuTi", "方正舒体", "STCaiyun", "华文彩云", cursive',
    '"FZQingKeBenYueSongS-R-GB", "方正清刻本悦宋", "STSong", serif',
    '"FZJingLeiS-R-GB", "方正静蕾简体", "STXingkai", cursive',
    '"FZCuSong-B09S", "方正粗宋", "STHeiti", "华文黑体", serif',
  ]
  
  if (!state.usedFonts.includes(fontValue)) {
    state.usedFonts.push(fontValue)
    
    if (state.usedFonts.length === allFonts.length) {
      triggerEasterEgg('all_fonts_used')
    }
    
    saveEasterEggState(state)
  }
}

// 随机彩蛋（1%概率）
export function checkRandomEasterEgg() {
  if (Math.random() < 0.01) { // 1%概率
    if (!isEasterEggInCooldown('random_lucky', 168)) { // 7天冷却
      triggerEasterEgg('random_lucky')
      setEasterEggCooldown('random_lucky')
    }
  }
}

// 检查长笔记（超过1000字）
export function checkLongNote(contentLength: number) {
  const state = getEasterEggState()
  if (contentLength >= 1000 && !state.hasLongNote) {
    triggerEasterEgg('long_note')
    state.hasLongNote = true
    saveEasterEggState(state)
  }
}

// 检查第一次使用分类
export function checkFirstCategory() {
  const state = getEasterEggState()
  if (!state.hasUsedCategory) {
    triggerEasterEgg('first_category')
    state.hasUsedCategory = true
    saveEasterEggState(state)
  }
}

// 检查一周创建5个笔记
export function checkWeeklyNotes(weeklyCount: number) {
  const state = getEasterEggState()
  if (weeklyCount === 5 && !state.hasWeekly5Notes) {
    triggerEasterEgg('weekly_5notes')
    state.hasWeekly5Notes = true
    saveEasterEggState(state)
  }
}

// 检查给5个笔记打上同一标签
export function checkTagUsage(tagName: string, noteCount: number) {
  const state = getEasterEggState()
  if (noteCount === 5 && !state.tag5NotesTriggered) {
    triggerEasterEgg('tag_5notes')
    state.tag5NotesTriggered = true
    saveEasterEggState(state)
  }
}

// 检查创建3个双向链接
export function checkLinkCount(linkCount: number) {
  const state = getEasterEggState()
  if (linkCount === 3 && !state.hasLink3Notes) {
    triggerEasterEgg('link_3notes')
    state.hasLink3Notes = true
    saveEasterEggState(state)
  }
}

// 检查连续3个月活跃
export function checkMonthlyActive() {
  const state = getEasterEggState()
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  
  if (!state.activeMonths) {
    state.activeMonths = []
  }
  
  if (!state.activeMonths.includes(currentMonth)) {
    state.activeMonths.push(currentMonth)
    
    // 检查是否连续3个月
    if (state.activeMonths.length >= 3) {
      const recent3Months = state.activeMonths.slice(-3)
      const isConsecutive = checkConsecutiveMonths(recent3Months)
      
      if (isConsecutive && !state.hasMonthly3Active) {
        triggerEasterEgg('monthly_active')
        state.hasMonthly3Active = true
      }
    }
    
    saveEasterEggState(state)
  }
}

// 辅助函数：检查月份是否连续
function checkConsecutiveMonths(months: string[]): boolean {
  if (months.length < 3) return false
  
  const dates = months.map(m => new Date(m + '-01'))
  dates.sort((a, b) => a.getTime() - b.getTime())
  
  for (let i = 1; i < dates.length; i++) {
    const diff = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (diff > 1.5) return false // 允许一些误差
  }
  
  return true
}

// 检查使用所有5个分类
export function checkCategoryMaster(usedCategories: string[]) {
  const state = getEasterEggState()
  const allCategories = ['工作', '学习', '生活', '想法', '其他']
  
  const hasAllCategories = allCategories.every(cat => usedCategories.includes(cat))
  
  if (hasAllCategories && !state.hasCategoryMaster) {
    triggerEasterEgg('category_master')
    state.hasCategoryMaster = true
    saveEasterEggState(state)
  }
}

// 检查创建20个不同标签
export function checkTagMaster(totalTags: number) {
  const state = getEasterEggState()
  if (totalTags >= 20 && !state.hasTagMaster) {
    triggerEasterEgg('tag_master')
    state.hasTagMaster = true
    saveEasterEggState(state)
  }
}

// 检查第一次使用搜索
export function checkFirstSearch() {
  const state = getEasterEggState()
  if (!state.hasUsedSearch) {
    triggerEasterEgg('first_search')
    state.hasUsedSearch = true
    saveEasterEggState(state)
  }
}

// 检查第一次导出笔记
export function checkFirstExport() {
  const state = getEasterEggState()
  if (!state.hasExported) {
    triggerEasterEgg('first_export')
    state.hasExported = true
    saveEasterEggState(state)
  }
}

// 检查笔记中包含图片
export function checkNoteWithImage() {
  const state = getEasterEggState()
  if (!state.hasNoteWithImage) {
    triggerEasterEgg('note_with_image')
    state.hasNoteWithImage = true
    saveEasterEggState(state)
  }
}

// 初始化检查（应用启动时调用）
export function initEasterEggChecks() {
  updateLastActiveDate()
  checkInactive()
  checkTimeBasedEasterEgg()
  checkMonthlyActive()
}
