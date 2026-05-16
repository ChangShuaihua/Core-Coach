import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classNames from 'classnames'
import StepIndicator from '@/components/Step'
import StepRenderer from '@/pages/wizard/components/StepRenderer'
import type { StepConfig } from '@/pages/wizard/components/StepRenderer'

export interface SkillStepConfig {
  steps: StepConfig[]
  resultCard?: {
    title: string
    previewTemplate: string
    actions?: Array<{ label: string; action: string; api?: string }>
  }
}

export interface WizardProps {
  stepConfig: SkillStepConfig
  onFinish?: (data: Record<string, any>) => void
}

/**
 * Wizard - 动态多步骤向导容器组件
 *
 * 根据 JSON 配置动态渲染不同的组件
 *
 * 支持的组件类型：
 * - selector: 道具/动作选择（通用选择器）
 * - template_grid: 模板选择
 * - param_settings: 参数设置
 * - upload: 文件上传
 */
export default function Wizard({ stepConfig, onFinish }: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState<Record<string, any>>({})

  const steps = stepConfig.steps || []
  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const validateCurrentStep = (): boolean => {
    if (!currentStep) return false

    // 如果步骤不是必填，直接通过
    if (!currentStep.required) {
      return true
    }

    // 根据步骤类型进行验证
    switch (currentStep.type) {
      case 'selector': {
        const fieldKey = `step_${currentStep.step}`
        const selectedValue = data[fieldKey]

        if (currentStep.multiple) {
          if (!Array.isArray(selectedValue) || selectedValue.length === 0) {
            Taro.showToast({
              title: `请选择${currentStep.title}`,
              icon: 'none',
              duration: 2000,
            })
            return false
          }
          if (currentStep.maxSelect && selectedValue.length > currentStep.maxSelect) {
            Taro.showToast({
              title: `最多只能选择${currentStep.maxSelect}项`,
              icon: 'none',
              duration: 2000,
            })
            return false
          }
        } else {
          if (!selectedValue) {
            Taro.showToast({
              title: `请选择${currentStep.title}`,
              icon: 'none',
              duration: 2000,
            })
            return false
          }
        }
        return true
      }

      case 'template_grid': {
        const fieldKey = `step_${currentStep.step}`
        if (!data[fieldKey]) {
          Taro.showToast({
            title: `请选择${currentStep.title}`,
            icon: 'none',
            duration: 2000,
          })
          return false
        }
        return true
      }

      case 'param_settings': {
        const requiredFields = ['gameName', 'age', 'playerCount', 'gameType']
        for (const field of requiredFields) {
          if (!data[field]) {
            Taro.showToast({
              title: `请完成所有必填项`,
              icon: 'none',
              duration: 2000,
            })
            return false
          }
        }
        return true
      }

      case 'upload': {
        const fieldKey = `step_${currentStep.step}`
        if (!data[fieldKey]) {
          Taro.showToast({
            title: `请上传${currentStep.title}`,
            icon: 'none',
            duration: 2000,
          })
          return false
        }
        return true
      }

      default:
        return true
    }
  }

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return
    }

    if (isLastStep) {
      console.log('📊 最终提交数据:', data)
      onFinish?.(data)
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const updateData = (newData: Record<string, any>) => {
    setData((prev) => ({
      ...prev,
      ...newData,
    }))
  }

  if (!currentStep) {
    return (
      <View className="p-4">
        <Text>没有步骤配置</Text>
      </View>
    )
  }

  // 转换为 StepIndicator 需要的格式
  const indicatorSteps = steps.map((step) => ({
    id: step.step,
    label: step.title,
    description: `第${step.step}步`,
  }))

  return (
    <View className="w-full h-full flex flex-col bg-gray-50">
      {/* 顶部步骤条 */}
      <View className="flex-shrink-0 bg-white px-4 py-6 border-b border-gray-200">
        <StepIndicator
          steps={indicatorSteps}
          currentStep={currentStep.step}
          size="medium"
          showDescription
        />
      </View>

      {/* 中间内容区 - 根据 JSON 配置动态渲染组件 */}
      <View className="flex-1 overflow-y-auto px-4 py-6">
        <View className="max-w-2xl mx-auto">
          <StepRenderer config={currentStep} value={data} onChange={updateData} />
        </View>
      </View>

      {/* 底部按钮栏 */}
      <View className="flex-shrink-0 bg-white px-4 py-4 border-t border-gray-200">
        <View className="max-w-2xl mx-auto flex gap-3">
          {!isFirstStep && (
            <View
              className="flex-1 py-3 px-4 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 bg-white text-center cursor-pointer hover:bg-gray-50"
              onClick={handlePrev}
            >
              <Text>上一步</Text>
            </View>
          )}

          <View
            className={classNames(
              'flex-1 py-3 px-4 rounded-lg font-semibold text-white text-center cursor-pointer transition',
              {
                'bg-orange-500 hover:bg-orange-600': !isLastStep,
                'bg-green-500 hover:bg-green-600': isLastStep,
              }
            )}
            onClick={handleNext}
          >
            <Text className="text-white">{isLastStep ? '生成' : '下一步'}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
