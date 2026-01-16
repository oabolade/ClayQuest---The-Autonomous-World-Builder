# ClayQuest: 2小时 Demo-Show 开发路线图

## 目标
在2小时内将 Next.js 模板扩展为可演示的 ClayQuest Demo，最大化集成赞助商产品以提高获奖概率。

---

## 赞助商集成优先级

| 优先级 | 赞助商 | 集成方式 | 原因 |
|--------|--------|----------|------|
| **P0 必须** | Anthropic Claude | 故事生成 (Vision API) | 核心功能，分析粘土照片生成故事 |
| **P0 必须** | ElevenLabs | 语音旁白 | 差异化体验，让故事"活"起来 |
| **P0 必须** | Freepik | 插图生成 | 视觉吸引力，生成绘本插图 |
| **P1 加分** | Auth0 | 登录按钮 | 快速集成，展示"保存故事"入口 |
| **P1 加分** | Macroscope | API 监控 | 添加到 API 路由，展示可观测性 |
| **P2 可选** | AWS | 部署 | 如果时间充裕，部署到 Amplify |

---

## 里程碑时间线

### Milestone 1: 基础架构 (0:00 - 0:30)

**目标**: 项目结构就绪，可以点击完整流程（使用假数据）

**任务清单**:
1. 安装依赖
   ```bash
   cd app && npm install @anthropic-ai/sdk zustand lucide-react
   ```

2. 创建 `.env.local`
   ```
   ANTHROPIC_API_KEY=
   ELEVENLABS_API_KEY=
   FREEPIK_API_KEY=
   ```

3. 创建目录结构
   ```
   app/src/
   ├── components/
   │   ├── WelcomeScreen.tsx
   │   ├── CaptureScreen.tsx
   │   ├── LoadingScreen.tsx
   │   └── BookViewer.tsx
   ├── lib/
   │   └── store.ts (Zustand状态管理)
   └── app/api/
       ├── generate-story/route.ts
       ├── generate-image/route.ts
       └── generate-audio/route.ts
   ```

4. 实现 Zustand store 和页面导航骨架
5. API 路由返回 mock 数据

**验收标准**: 点击 "Start Adventure" -> 显示相机占位 -> 点击拍照 -> 显示加载 -> 显示故事（假数据）

---

### Milestone 2: 相机捕获 + Claude 故事生成 (0:30 - 1:00)

**目标**: 真实拍照 -> Claude 生成真实故事

**任务清单**:
1. `CaptureScreen.tsx`:
   - 请求摄像头权限
   - 显示视频流
   - 拍照按钮捕获帧
   - 预览 + 重拍/确认按钮
   - **降级方案**: 添加文件上传入口

2. `/api/generate-story/route.ts`:
   - 接收 base64 图片
   - 调用 Claude Vision API
   - Prompt 要求: 分析粘土角色 -> 生成3-5页儿童故事 -> 每页包含文字和插图描述
   - 返回结构化 JSON

3. 连接前端到 API，处理加载状态

**验收标准**: 拍摄粘土照片 -> 等待 -> 看到 Claude 生成的故事文本

---

### Milestone 3: 图片生成 + 音频旁白 (1:00 - 1:30)

**目标**: 故事有配图和语音

**任务清单**:
1. `/api/generate-image/route.ts`:
   - 接收插图描述 prompt
   - 调用 Freepik API 生成儿童风格插图
   - 并行生成所有页面的图片
   - **降级方案**: 使用占位图 + 纯文字模式

2. `/api/generate-audio/route.ts`:
   - 接收页面文字
   - 调用 ElevenLabs API 生成温暖的旁白
   - 选择适合儿童的声音
   - **降级方案**: 使用浏览器 Web Speech API

3. `LoadingScreen.tsx`:
   - 显示进度状态: "正在创作故事..." -> "正在绘制插图..." -> "正在添加旁白..."
   - 有趣的等待动画

4. `BookViewer.tsx`:
   - 全屏插图显示
   - 自动播放音频
   - 左右滑动/点击翻页
   - 页码指示器

**验收标准**: 完整体验 - 拍照 -> 故事+插图+语音 -> 可以翻页阅读

---

### Milestone 4: UI 打磨 + 赞助商展示 (1:30 - 1:50)

**目标**: Demo 级别的视觉效果，突出赞助商

**任务清单**:
1. 应用 PRD 设计系统:
   - 主色: #FF9800 (暖橙)
   - 背景: #FFF8E1 (奶油色)
   - 大按钮 (60px触控区)
   - 圆角、友好字体

2. 添加赞助商 Logo/标识:
   - Loading 页面: "Powered by Claude"
   - 音频控件: "Voice by ElevenLabs"
   - 插图: "Art by Freepik AI"
   - 页脚: 赞助商 logo 条

3. 错误处理:
   - 友好的错误信息
   - 重试按钮
   - API 超时处理

4. **可选快速集成**:
   - Auth0: 添加 "登录以保存故事" 按钮（不需要真正实现，展示入口即可）
   - Macroscope: 在 API 路由添加监控代码

**验收标准**: 视觉美观，赞助商清晰可见

---

### Milestone 5: Demo 准备 (1:50 - 2:00)

**目标**: 准备演示

**任务清单**:
1. 准备一个好看的粘土作品照片作为备用
2. 预热测试所有 API 连接
3. 准备一个预生成的故事作为降级方案
4. 清理浏览器缓存，无痕模式测试
5. 准备演讲要点，突出每个赞助商的使用

---

## 并行开发分工（如果有2人）

```
时间     | 前端开发                    | 后端/API开发
---------|----------------------------|---------------------------
0:00     | 安装依赖，创建组件骨架        | 创建 API 路由结构，配置环境变量
0:15     | Zustand store，导航流程      | Mock API 响应
0:30     | 相机组件 (核心)              | Claude Vision API 集成
0:45     | 加载屏幕，状态管理            | 测试故事生成
1:00     | BookViewer 骨架              | Freepik 图片 API
1:15     | 音频播放器，翻页交互          | ElevenLabs 音频 API
1:30     | UI 打磨，颜色/字体            | 错误处理，重试逻辑
1:45     | 赞助商标识                   | 最终测试
1:55     | Demo 准备                    | Demo 准备
```

---

## 降级策略（时间不够时）

| 功能 | 完整版 | 降级版 |
|------|--------|--------|
| 拍照 | Webcam 实时捕获 | 文件上传 |
| 故事 | Claude Vision 分析 | **必须实现** |
| 插图 | Freepik 生成 | 占位图/emoji |
| 语音 | ElevenLabs | 浏览器 TTS |
| 动画 | 精美过渡 | 简单切换 |

**最小可演示版本**: 上传照片 -> Claude 生成故事文本 -> 纯文字展示

---

## 关键文件清单

需要创建/修改的文件:
- `app/src/app/page.tsx` - 主页面，步骤路由
- `app/src/lib/store.ts` - 状态管理
- `app/src/components/WelcomeScreen.tsx` - 欢迎页
- `app/src/components/CaptureScreen.tsx` - 相机拍照
- `app/src/components/LoadingScreen.tsx` - 加载动画
- `app/src/components/BookViewer.tsx` - 绘本阅读器
- `app/src/app/api/generate-story/route.ts` - Claude API
- `app/src/app/api/generate-image/route.ts` - Freepik API
- `app/src/app/api/generate-audio/route.ts` - ElevenLabs API
- `app/src/app/globals.css` - 设计系统颜色
- `app/.env.local` - API 密钥

---

## 验证方式

1. **功能测试**: 完整走一遍用户流程
   - 打开首页 -> 点击开始 -> 拍照/上传 -> 等待生成 -> 翻页阅读 -> 重新开始

2. **赞助商检查清单**:
   - [ ] Claude API 调用成功，故事相关且有趣
   - [ ] ElevenLabs 音频清晰，声音适合儿童
   - [ ] Freepik 插图风格一致，符合儿童审美
   - [ ] 赞助商标识在 UI 中可见

3. **演示准备检查**:
   - [ ] API 密钥配置正确
   - [ ] 有备用测试数据
   - [ ] 网络稳定
