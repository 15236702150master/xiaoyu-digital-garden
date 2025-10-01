import { NoteTemplate } from '../types'

const TEMPLATES_KEY = 'digital-garden-templates'

export class TemplateStorage {
  // 系统预设模板
  static getSystemTemplates(): NoteTemplate[] {
    return [
      {
        id: 'system-diary',
        name: '日记',
        description: '记录每日生活和思考',
        content: `# ${new Date().toLocaleDateString('zh-CN')} 日记

## 今日天气
☀️ 

## 今日心情
😊 

## 今日重要事件
- 

## 今日感悟
> 

## 明日计划
- [ ] 
- [ ] 
- [ ] 

---
*记录于 ${new Date().toLocaleString('zh-CN')}*`,
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'system-meeting',
        name: '会议记录',
        description: '会议纪要和行动项目',
        content: `# 会议记录

## 会议信息
- **会议主题**: 
- **会议时间**: ${new Date().toLocaleString('zh-CN')}
- **会议地点**: 
- **参会人员**: 
- **会议主持**: 

## 会议议程
1. 
2. 
3. 

## 讨论要点
### 议题一
- **讨论内容**: 
- **决议**: 
- **负责人**: 
- **截止时间**: 

### 议题二
- **讨论内容**: 
- **决议**: 
- **负责人**: 
- **截止时间**: 

## 行动项目
- [ ] **任务**: | **负责人**: | **截止时间**: 
- [ ] **任务**: | **负责人**: | **截止时间**: 

## 下次会议
- **时间**: 
- **议题**: `,
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'system-project',
        name: '项目规划',
        description: '项目计划和进度跟踪',
        content: `# 项目规划

## 项目概述
- **项目名称**: 
- **项目目标**: 
- **开始时间**: 
- **预计完成**: 
- **项目负责人**: 

## 项目背景
### 问题描述


### 解决方案


## 项目范围
### 包含内容
- 
- 
- 

### 不包含内容
- 
- 

## 项目阶段
### 阶段一: 
- **时间**: 
- **目标**: 
- **交付物**: 
- **里程碑**: 

### 阶段二: 
- **时间**: 
- **目标**: 
- **交付物**: 
- **里程碑**: 

## 风险评估
| 风险 | 影响程度 | 发生概率 | 应对措施 |
|------|----------|----------|----------|
|      |          |          |          |

## 资源需求
- **人力资源**: 
- **技术资源**: 
- **预算**: 

## 成功标准
- [ ] 
- [ ] 
- [ ] `,
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'system-study',
        name: '学习笔记',
        description: '知识学习和总结',
        content: `# 学习笔记

## 学习主题


## 学习目标
- [ ] 
- [ ] 
- [ ] 

## 核心概念
### 概念一
**定义**: 

**要点**: 
- 
- 

**示例**: 


### 概念二
**定义**: 

**要点**: 
- 
- 

**示例**: 


## 重点内容
> 💡 **关键洞察**
> 

## 实践应用
### 应用场景


### 实际案例


## 疑问和思考
❓ **问题**: 

💭 **思考**: 

## 相关资源
- 📚 **参考资料**: 
- 🔗 **相关链接**: 
- 👥 **讨论交流**: 

## 学习总结
### 已掌握
- ✅ 
- ✅ 

### 待深入
- 🔄 
- 🔄 

### 下一步计划
- [ ] 
- [ ] 

---
*学习时间: ${new Date().toLocaleString('zh-CN')}*`,
        isSystem: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }

  static getTemplates(): NoteTemplate[] {
    try {
      const stored = localStorage.getItem(TEMPLATES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('获取模板失败:', error)
      return []
    }
  }

  static getAllTemplates(): NoteTemplate[] {
    return [...this.getSystemTemplates(), ...this.getTemplates()]
  }

  static saveTemplates(templates: NoteTemplate[]): void {
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
    } catch (error) {
      console.error('保存模板失败:', error)
    }
  }

  static createTemplate(templateData: Omit<NoteTemplate, 'id' | 'createdAt' | 'updatedAt'>): NoteTemplate {
    const template: NoteTemplate = {
      ...templateData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const templates = this.getTemplates()
    templates.push(template)
    this.saveTemplates(templates)
    
    return template
  }

  static updateTemplate(templateData: Partial<NoteTemplate> & { id: string }): NoteTemplate | null {
    const templates = this.getTemplates()
    const index = templates.findIndex(t => t.id === templateData.id)
    
    if (index === -1) return null

    const updatedTemplate = {
      ...templates[index],
      ...templateData,
      updatedAt: new Date().toISOString()
    }

    templates[index] = updatedTemplate
    this.saveTemplates(templates)
    
    return updatedTemplate
  }

  static deleteTemplate(id: string): boolean {
    const templates = this.getTemplates()
    const filteredTemplates = templates.filter(t => t.id !== id)
    
    if (filteredTemplates.length === templates.length) return false

    this.saveTemplates(filteredTemplates)
    return true
  }
}
