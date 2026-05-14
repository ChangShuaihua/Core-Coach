import { useState } from 'react'
import { View, Button, Text } from '@tarojs/components'
import classNames from 'classnames'
import type { WizardConfig } from '@/pages/creation/types/wizard'
import StepIndicator from './StepIndicator'

export interface WizardPageProps {
  config: WizardConfig
  onFinish?: (data: Record<string, any>) => void
  finishButtonText?: string
}

/**
 * WizardPage - 终极通用页面
 *
 * 4 块结构：
 * 1. 页面容器（最外层）
 * 2. 顶部步骤条（进度条）
 * 3. 中间内容区（动态切换卡片）
 * 4. 底部按钮栏（上一步 / 下一步）
 *
 * 所有多步骤页面（游戏、教案、问卷...）都用这个！
 */
export default function WizardPage({
  config,
  onFinish,
  finishButtonText = '完成',
}: WizardPageProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState<Record<string, any>>({})

  const currentStep = config.steps[currentStepIndex]
  const CurrentComponent = config.contentComponents[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === config.steps.length - 1

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      onFinish?.(data)
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const updateData = (key: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <View className="page-container w-full h-screen flex flex-col bg-gray-50">
      {/* 1️⃣ 顶部步骤条 - 固定不动 */}
      <View className="flex-shrink-0 bg-white px-4 py-6 border-b border-gray-200 shadow-sm">
        <StepIndicator
          steps={config.steps}
          currentStep={currentStep.id}
          size="medium"
          showDescription
        />
      </View>

      {/* 2️⃣ 中间内容区 - 动态切换卡片 */}
      <View className="flex-1 overflow-y-auto px-4 py-6">
        <View className="max-w-2xl mx-auto">
          {CurrentComponent && (
            <CurrentComponent data={data} updateData={updateData} currentStep={currentStep} />
          )}
        </View>
      </View>

      {/* 3️⃣ 底部按钮栏 - 固定不动 */}
      <View className="flex-shrink-0 bg-white px-4 py-4 border-t border-gray-200 shadow-lg">
        <View className="max-w-2xl mx-auto flex gap-3">
          {/* 上一步 */}
          <Button
            className={classNames(
              'flex-1 py-3 px-4 rounded-lg font-semibold transition-all border-2',
              {
                'border-gray-300 text-gray-700 bg-white': !isFirstStep,
                'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed': isFirstStep,
              }
            )}
            onClick={handlePrev}
            disabled={isFirstStep}
          >
            <Text>上一步</Text>
          </Button>

          {/* 下一步 / 完成 */}
          <Button
            className={classNames(
              'flex-1 py-3 px-4 rounded-lg font-semibold transition-all text-white',
              {
                'bg-orange-500': !isLastStep,
                'bg-green-500': isLastStep,
              }
            )}
            onClick={handleNext}
          >
            <Text>{isLastStep ? finishButtonText : '下一步'}</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
