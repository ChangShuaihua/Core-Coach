/**
 * Mock 数据 - 技能配置
 * 用于本地开发和测试，模拟后端 API 返回的数据
 */

export const GAME_SKILL_CONFIG = {
  id: 1,
  name: '游戏生成',
  step_config: {
    steps: [
      {
        step: 1,
        title: '参数设置',
        type: 'param_settings',
        required: true,
      },
      {
        step: 2,
        title: '生成结果',
        type: 'result_preview',
        required: false,
        actions: [
          {
            label: '生成游戏',
            action: 'generate',
            api: '/api/generateGame',
          },
          {
            label: '保存草稿',
            action: 'saveDraft',
            api: '/api/saveDraft',
          },
          {
            label: '导出配置',
            action: 'export',
          },
        ],
      },
    ],
    resultCard: {
      title: '生成成功！',
      previewTemplate:
        '游戏名称：{{gameName}}\n难度：{{difficulty}}\n时长：{{duration}}秒\n背景音乐：{{bgm}}',
      actions: [
        {
          label: '生成配音音乐',
          action: 'generateAudio',
          api: '/api/generateAudio',
        },
        {
          label: '保存到游戏库',
          action: 'saveToLibrary',
          api: '/api/saveGame',
        },
        {
          label: '导出图片',
          action: 'exportImage',
        },
        {
          label: '导出PDF',
          action: 'exportPDF',
        },
      ],
    },
  },
}

export const LESSON_SKILL_CONFIG = {
  id: 2,
  name: '教案生成',
  step_config: {
    steps: [
      {
        step: 1,
        title: '选择运动类型',
        type: 'selector',
        options: [
          { label: '跑步', value: 'running', icon: 'https://via.placeholder.com/80?text=running' },
          { label: '跳跃', value: 'jumping', icon: 'https://via.placeholder.com/80?text=jumping' },
          {
            label: '投掷',
            value: 'throwing',
            icon: 'https://via.placeholder.com/80?text=throwing',
          },
          { label: '平衡', value: 'balance', icon: 'https://via.placeholder.com/80?text=balance' },
        ],
        multiple: true,
        maxSelect: 3,
        required: true,
      },
      {
        step: 2,
        title: '选择教学模板',
        type: 'template_grid',
        templates: [
          {
            id: 'beginner',
            name: '初级教学',
            preview: 'https://via.placeholder.com/200x150?text=beginner',
            emoji: '🌱',
            description: '适合初学者，循序渐进',
            isNew: false,
          },
          {
            id: 'intermediate',
            name: '中级教学',
            preview: 'https://via.placeholder.com/200x150?text=intermediate',
            emoji: '🎯',
            description: '进阶训练，提升技能',
            isNew: false,
          },
          {
            id: 'advanced',
            name: '高级教学',
            preview: 'https://via.placeholder.com/200x150?text=advanced',
            emoji: '🏆',
            description: '专业训练，挑战极限',
            isNew: true,
          },
        ],
        required: true,
      },
      {
        step: 3,
        title: '教案信息',
        type: 'param_settings',
        required: true,
      },
    ],
    resultCard: {
      title: '教案生成成功！',
      previewTemplate:
        '教案标题：{{lessonTitle}}\n学生年龄：{{studentAge}}岁\n课程时长：{{lessonDuration}}分钟\n教学方式：{{teachingMethod}}',
      actions: [
        {
          label: '下载教案',
          action: 'downloadLesson',
          api: '/api/downloadLesson',
        },
        {
          label: '保存到教案库',
          action: 'saveToLibrary',
          api: '/api/saveLesson',
        },
        {
          label: '分享教案',
          action: 'shareLesson',
        },
        {
          label: '打印教案',
          action: 'printLesson',
        },
      ],
    },
  },
}

/**
 * 根据 mode 获取对应的 mock 配置
 */
export function getMockSkillConfig(mode: string | null) {
  switch (mode) {
    case 'game':
      return GAME_SKILL_CONFIG
    case 'lesson':
      return LESSON_SKILL_CONFIG
    default:
      return GAME_SKILL_CONFIG
  }
}
