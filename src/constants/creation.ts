// 创作任务状态映射：0=失败, 1=成功, 2=排队中, 3=生成中
export const STATUS_CONFIG: Record<number, { text: string; icon: string }> = {
  0: { text: '生成失败', icon: '😢' },
  1: { text: '', icon: '' },
  2: { text: '排队中', icon: '⏳' },
  3: { text: '生成中', icon: '✨' },
}
