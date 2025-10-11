# 🚀 GitHub Pages 部署指南

## 📋 部署步骤

### 1. 启用 GitHub Pages

1. 访问仓库设置页面：
   ```
   https://github.com/15236702150master/xiaoyu-digital-garden/settings/pages
   ```

2. 在 **Source** 部分，选择：
   - Source: `GitHub Actions`

3. 保存设置

### 2. 触发部署

GitHub Actions 会在以下情况自动触发部署：
- 推送代码到 `main` 分支
- 创建 Pull Request 到 `main` 分支

你也可以手动触发：
```bash
git commit --allow-empty -m "Trigger deployment"
git push
```

### 3. 查看部署状态

访问 Actions 页面查看部署进度：
```
https://github.com/15236702150master/xiaoyu-digital-garden/actions
```

### 4. 访问网站

部署成功后，访问：
```
https://15236702150master.github.io/xiaoyu-digital-garden/
```

## ⚙️ 配置说明

### next.config.js

```javascript
const nextConfig = {
    output: 'export',              // 静态导出
    basePath: '/xiaoyu-digital-garden',  // GitHub Pages 路径
    trailingSlash: true,           // URL 尾部斜杠
    distDir: 'out',                // 输出目录
    images: {
      unoptimized: true,           // 禁用图片优化（静态导出需要）
    },
};
```

### GitHub Actions 工作流

文件位置：`.github/workflows/deploy.yml`

工作流程：
1. **Build**: 安装依赖并构建项目
2. **Upload**: 上传构建产物
3. **Deploy**: 部署到 GitHub Pages

## 🔧 故障排查

### 问题 1: Actions 失败 - "GitHub Pages has not been enabled"

**解决方案**：
1. 进入仓库设置 → Pages
2. Source 选择 "GitHub Actions"
3. 保存后重新运行 workflow

### 问题 2: 404 错误

**可能原因**：
- basePath 配置不正确
- 缺少 .nojekyll 文件

**解决方案**：
```bash
# 确保 .nojekyll 文件存在
touch .nojekyll
git add .nojekyll
git commit -m "Add .nojekyll"
git push
```

### 问题 3: 样式或资源加载失败

**原因**：路径问题

**解决方案**：
- 检查 `next.config.js` 中的 `basePath` 是否正确
- 确保所有资源路径使用相对路径

## 📝 本地测试

在推送到 GitHub 之前，建议本地测试：

```bash
# 构建项目
npm run build

# 查看输出目录
ls -la out/

# 使用本地服务器测试（可选）
npx serve out -p 3000
```

## 🎯 部署检查清单

- [ ] `next.config.js` 配置正确
- [ ] `.nojekyll` 文件已添加
- [ ] GitHub Actions workflow 文件存在
- [ ] 本地构建成功
- [ ] GitHub Pages 已启用
- [ ] Actions 运行成功
- [ ] 网站可以访问

## 📚 相关链接

- [仓库地址](https://github.com/15236702150master/xiaoyu-digital-garden)
- [在线演示](https://15236702150master.github.io/xiaoyu-digital-garden/)
- [Actions 状态](https://github.com/15236702150master/xiaoyu-digital-garden/actions)
- [GitHub Pages 文档](https://docs.github.com/en/pages)

## 💡 提示

- 首次部署可能需要几分钟时间
- 部署成功后，更新可能需要 1-2 分钟才能生效
- 如果遇到问题，查看 Actions 日志获取详细错误信息
