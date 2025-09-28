# 🌱 数字花园 (Digital Garden)

一个基于 Next.js 15 构建的现代化个人知识管理系统，让你的想法和知识像花园一样自然生长。

![Digital Garden](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ 特性

### 📝 强大的编辑功能
- **富文本编辑器**：支持 Markdown 语法和可视化编辑
- **内联编辑**：双击即可编辑，所见即所得
- **语法高亮**：代码块自动高亮显示
- **表格支持**：可视化表格编辑和管理

### 🗂️ 智能组织系统
- **树状分类**：层级化的分类管理，支持无限嵌套
- **标签系统**：灵活的标签管理，自动提取和统计
- **双向链接**：笔记间的智能关联和反向链接
- **全局搜索**：快速搜索笔记内容（支持 Ctrl+K 快捷键）

### 🎨 个性化定制
- **主题定制**：自定义背景颜色和字体
- **响应式设计**：完美适配桌面和移动设备
- **可调整布局**：三栏布局，支持面板大小调整

### 📋 模板系统
- **预设模板**：多种笔记模板快速创建
- **自定义模板**：创建和管理个人模板
- **一键应用**：从模板快速生成新笔记

### 💾 数据管理
- **本地存储**：数据安全存储在浏览器本地
- **备份恢复**：支持数据导出和导入
- **多格式导出**：支持 Markdown、JSON 等格式

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn 或 pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/15236702150master/digital-garden.git
cd digital-garden
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

4. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建部署

```bash
# 构建生产版本
npm run build

# 导出静态文件（用于静态部署）
npm run export

# 一键构建和导出
npm run deploy
```

## 📖 使用指南

### 基本操作

1. **创建笔记**
   - 点击左侧分类旁的 `+` 按钮
   - 或使用快捷键 `Ctrl+N`

2. **编辑笔记**
   - 双击笔记内容进入编辑模式
   - 支持 Markdown 语法和富文本编辑

3. **管理分类**
   - 右键点击分类可进行重命名、删除等操作
   - 支持拖拽移动笔记到不同分类

4. **添加标签**
   - 在笔记中使用 `#标签名` 格式自动创建标签
   - 点击顶部标签按钮管理所有标签

### 高级功能

- **双向链接**：使用 `[[笔记标题]]` 创建笔记间的链接
- **模板使用**：点击模板按钮选择或创建模板
- **全局搜索**：使用 `Ctrl+K` 快速搜索所有笔记
- **数据备份**：定期导出数据进行备份

## 🛠️ 技术栈

- **前端框架**：Next.js 15 (App Router)
- **开发语言**：TypeScript
- **样式方案**：Tailwind CSS
- **UI 组件**：Lucide React Icons
- **代码高亮**：React Syntax Highlighter
- **构建工具**：Next.js 内置构建系统

## 📁 项目结构

```
digital-garden/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css     # 全局样式
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 主页面
│   ├── components/         # React 组件
│   │   ├── TreeNavigation.tsx    # 树状导航
│   │   ├── NoteDetailView.tsx    # 笔记详情
│   │   ├── RichTextEditor.tsx    # 富文本编辑器
│   │   └── ...
│   ├── lib/               # 工具库
│   │   ├── storage.ts     # 本地存储
│   │   └── utils.ts       # 工具函数
│   └── types/             # TypeScript 类型定义
├── public/                # 静态资源
├── next.config.js         # Next.js 配置
├── tailwind.config.ts     # Tailwind 配置
└── package.json          # 项目配置
```

## 🎯 核心功能详解

### 笔记管理
- 支持 Markdown 和富文本混合编辑
- 自动保存，防止数据丢失
- 版本历史记录（计划中）

### 分类系统
- 无限层级的分类结构
- 拖拽排序和移动
- 分类统计和管理

### 搜索功能
- 全文搜索支持
- 标签筛选
- 快捷键操作

### 数据安全
- 本地存储，数据隐私有保障
- 支持数据导出备份
- 跨设备同步（计划中）

## 🔧 自定义配置

### 主题定制
在设置中可以自定义：
- 背景颜色
- 字体样式
- 布局偏好

### 扩展开发
项目采用模块化设计，易于扩展：
- 新增组件到 `src/components/`
- 扩展存储功能到 `src/lib/storage.ts`
- 添加新的笔记类型到 `src/types/`

## 📝 注意事项

1. **数据存储**：数据存储在浏览器的 localStorage 中，清除浏览器数据会导致笔记丢失，请定期备份
2. **浏览器兼容性**：建议使用现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）
3. **性能优化**：大量笔记时建议定期整理和归档
4. **移动端使用**：响应式设计，支持移动设备，但桌面端体验更佳

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 强大的 React 框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用的 CSS 框架
- [Lucide](https://lucide.dev/) - 美观的图标库
- [React Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) - 代码高亮

---

**开始你的数字花园之旅吧！🌱**

如果这个项目对你有帮助，请给个 ⭐️ 支持一下！