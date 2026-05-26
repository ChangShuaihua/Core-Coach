import Taro from '@tarojs/taro'

interface ShareImageData {
  gameName: string
  gameType: string
  age: number
  content: string
}

/**
 * 生成分享图片并保存到相册
 */
export async function generateAndSaveImage(data: ShareImageData): Promise<boolean> {
  try {
    // 获取设备信息，用于计算尺寸
    const systemInfo = Taro.getSystemInfoSync()
    const screenWidth = systemInfo.screenWidth
    const canvasWidth = screenWidth * 0.9
    const canvasHeight = canvasWidth * 1.4

    // 创建离屏 Canvas
    const query = Taro.createSelectorQuery()
    const canvasRes = await new Promise<any>((resolve) => {
      query
        .select('#shareCanvas')
        .fields({ node: true, size: true })
        .exec((res) => resolve(res[0]))
    })

    if (!canvasRes?.node) {
      console.error('Canvas 节点未找到')
      return false
    }

    const canvas = canvasRes.node
    const ctx = canvas.getContext('2d')

    // 设置 Canvas 尺寸
    const dpr = systemInfo.pixelRatio
    canvas.width = canvasWidth * dpr
    canvas.height = canvasHeight * dpr
    ctx.scale(dpr, dpr)

    // 绘制背景
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 绘制顶部橙色条
    ctx.fillStyle = '#FF7A2F'
    ctx.fillRect(0, 0, canvasWidth, 8)

    // 绘制标题
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText(data.gameName || '新生成游戏', 20, 50)

    // 绘制标签
    ctx.fillStyle = '#FF7A2F'
    ctx.font = '12px sans-serif'
    ctx.fillText(data.gameType || '团队游戏', 20, 75)

    // 绘制基本信息
    ctx.fillStyle = '#6B7280'
    ctx.font = '14px sans-serif'
    ctx.fillText(`适合年龄：${data.age}岁`, 20, 110)

    // 绘制分隔线
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, 130)
    ctx.lineTo(canvasWidth - 20, 130)
    ctx.stroke()

    // 绘制内容（自动换行）
    ctx.fillStyle = '#374151'
    ctx.font = '14px sans-serif'
    const maxWidth = canvasWidth - 40
    const lineHeight = 22
    let y = 160

    // 简单的内容截取和换行
    const content = data.content || '暂无详细内容'
    const lines = wrapText(ctx, content, maxWidth, 6) // 最多显示6行
    lines.forEach((line) => {
      ctx.fillText(line, 20, y)
      y += lineHeight
    })

    // 绘制底部水印
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '12px sans-serif'
    ctx.fillText('来自「核心力量助手」', 20, canvasHeight - 20)

    // 转为图片
    const tempFilePath = await new Promise<string>((resolve, reject) => {
      Taro.canvasToTempFilePath({
        canvas,
        success: (res) => resolve(res.tempFilePath),
        fail: reject,
      })
    })

    // 保存到相册
    await Taro.saveImageToPhotosAlbum({
      filePath: tempFilePath,
    })

    return true
  } catch (error) {
    console.error('生成分享图片失败:', error)
    return false
  }
}

/**
 * 文字自动换行
 */
function wrapText(ctx: any, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = []
  let currentLine = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const testLine = currentLine + char
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = char

      if (lines.length >= maxLines) {
        lines[lines.length - 1] += '...'
        return lines
      }
    } else {
      currentLine = testLine
    }
  }

  if (currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine)
  }

  return lines
}
