/* ============================================
   CSS Optimization Plan
   基于 styles-original/ 进行优化
   ============================================ */

## 发现的问题

### 1. 重复定义
- **block-2.css** 和 **block-3.css** 前7行完全相同
  - `.app[data-module="bag"] .backdrop` 定义了3次（日间+夜间）
  
### 2. 压缩格式
- 所有CSS都是压缩格式，一行一个规则
- 难以阅读和维护

### 3. 硬编码颜色
- 大量重复的颜色值
- 没有使用CSS变量统一管理

## 优化方案

### 结构调整

```
styles-optimized/
├── 01-tokens.css       - CSS变量定义（从block-1中提取）
├── 02-base.css         - 基础样式（从block-1中提取）
├── 03-app-core.css     - App核心样式（从block-1中提取）
├── 04-backgrounds.css  - 背景系统（合并block-2和block-3）
├── 05-portrait.css     - 竖屏适配（合并block-4-6）
├── 06-dex.css          - 图鉴微调（合并block-7-9）
├── 07-bag-layout.css   - 背包布局（block-10）
├── 08-box.css          - 盒子样式（block-11）
└── 09-relations.css    - 人际关系（block-12）
```

### 优化规则

1. **保持CSS规则完全不变** - 只做结构调整
2. **保持加载顺序** - 确保优先级不变
3. **去除重复** - 合并block-2和block-3
4. **格式化** - 展开为可读格式
5. **提取变量** - 仅提取已存在的变量定义

## 执行计划

- [ ] 格式化block-1.css（使用prettier或手动）
- [ ] 合并block-2和block-3（去除重复的前7行）
- [ ] 合并block-4-6（竖屏微调）
- [ ] 合并block-7-9（图鉴微调）
- [ ] 保持block-10-12不变
- [ ] 创建index-optimized.html
- [ ] 浏览器验证
