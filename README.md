# Core Strength 核心力量·训练助手

一款基于 Taro 框架开发的跨平台小程序应用，专注于为核心力量训练提供智能辅助支持。

## 项目简介

Core Strength 是一款核心力量训练助手小程序，为用户提供 AI 智能对话、训练计划创作以及个人中心管理等功能。应用基于 Taro 4.x 框架开发，支持微信小程序、H5 等多平台运行。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Taro 4.x |
| UI 库 | NutUI |
| 语言 | TypeScript |
| 状态管理 | Zustand |
| 数据请求 | TanStack React Query |
| 表单验证 | React Hook Form + Zod |
| 样式 | Tailwind CSS + Sass |
| 包管理 | pnpm |

## 项目结构

```
core-strength/
├── config/                 # Taro 编译配置
├── src/
│   ├── assets/            # 静态资源
│   │   └── images/        # 图片资源
│   ├── components/        # 公共组件
│   │   ├── Card/          # 卡片组件
│   │   └── Layout/        # 布局组件（Header、TabBar）
│   ├── config/            # 路由配置
│   ├── constants/         # 常量定义
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 第三方库配置
│   ├── pages/             # 页面
│   │   ├── chat/          # AI 聊天页面
│   │   ├── creation/      # 创作页面
│   │   ├── login/         # 登录页面
│   │   └── profile/       # 个人中心页面
│   ├── schemas/           # Zod 数据模型
│   ├── services/          # API 服务层
│   ├── store/             # Zustand 状态库
│   ├── app.config.ts      # 小程序全局配置
│   ├── app.scss           # 全局样式
│   └── app.tsx            # 应用入口
├── package.json
└── tsconfig.json
```

## 功能模块

### 1. AI 助手（聊天页面）

核心功能模块，提供智能对话服务：

- **消息列表**：展示用户与 AI 的对话记录
- **快捷操作**：预设常用训练相关快捷指令
- **欢迎界面**：首次访问或无消息时展示欢迎内容
- **模拟回复**：当前为模拟 AI 回复，后续将接入 Coze 工作流

### 2. 创作中心

训练计划创作功能模块（开发中）

### 3. 个人中心

用户信息管理与设置：

- **用户信息卡片**：展示用户头像、昵称等基本信息
- **菜单列表**：主要功能入口
- **退出登录**：清除用户登录状态

### 4. 登录模块

用户身份认证（开发中）

## 开发环境

### 安装依赖

```bash
pnpm install
```

### 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm dev:weapp` | 微信小程序开发模式 |
| `pnpm dev:h5` | H5 开发模式 |
| `pnpm dev:alipay` | 支付宝小程序开发模式 |
| `pnpm dev:tt` | 抖音小程序开发模式 |

### 构建命令

| 命令 | 说明 |
|------|------|
| `pnpm build:weapp` | 构建微信小程序 |
| `pnpm build:h5` | 构建 H5 |
| `pnpm build:alipay` | 构建支付宝小程序 |
| `pnpm build:rn` | 构建 React Native |

## 路由配置

项目使用 Taro 原生路由系统，页面配置位于 `src/app.config.ts`。

| 路径 | 页面 |
|------|------|
| `/pages/chat/index` | AI 助手（首页） |
| `/pages/creation/index` | 创作中心 |
| `/pages/profile/index` | 个人中心 |
| `/pages/login/index` | 登录页 |

## 环境变量

开发环境配置位于 `config/dev.ts`，生产环境配置位于 `config/prod.ts`。

## 代码规范

- 使用 ESLint + Prettier 进行代码格式化
- 使用 Husky + lint-staged 进行提交前检查
- 遵循 Taro 框架开发规范

## 许可证

本项目为私有项目，未经授权不可使用。
