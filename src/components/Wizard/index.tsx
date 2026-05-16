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
    template: string
    actions?: Array<{ label: string; action: string }>
  }
}

export interface WizardProps {
  stepConfig: SkillStepConfig
  onFinish?: (data: Record<string, any>) => void
}

/**
 * Wizard - 动态多步骤向导容器组件
 *
 * 职责：
 * - 管理当前步骤索引
 * - 管理表单数据状态
 * - 验证当前步骤的数据
 * - 处理上一步/下一步/完成逻辑
 * - 协调 StepIndicator 和 StepRenderer 的交互
 */
export default function Wizard({ stepConfig, onFinish }: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // 初始化默认值
  const initializeDefaultValues = () => {
    const defaultData: Record<string, any> = {}

    stepConfig.steps?.forEach((step) => {
      if (step.type === 'form' && step.fields) {
        step.fields.forEach((field) => {
          if (field.default !== undefined) {
            defaultData[field.key] = field.default
          }
        })
      }
    })

    return defaultData
  }

  const [data, setData] = useState<Record<string, any>>(initializeDefaultValues())

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
      // form 类型：检查所有必填字段
      case 'form': {
        if (!currentStep.fields) return true

        for (const field of currentStep.fields) {
          // 如果字段标记为必填或表单本身必填，则检查
          if (field.required !== false) {
            const fieldValue = data[field.key]
            if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
              Taro.showToast({
                title: `请填写${field.label}`,
                icon: 'none',
                duration: 2000,
              })
              return false
            }
          }
        }
        return true
      }

      // selector 类型：检查是否有选择
      case 'selector': {
        const fieldKey = `step_${currentStep.step}`
        const selectedValue = data[fieldKey]

        if (currentStep.multiple) {
          // 多选：检查是否有选择
          if (!Array.isArray(selectedValue) || selectedValue.length === 0) {
            Taro.showToast({
              title: `请选择${currentStep.title}`,
              icon: 'none',
              duration: 2000,
            })
            return false
          }
          // 检查是否超过最大选择数
          if (currentStep.maxSelect && selectedValue.length > currentStep.maxSelect) {
            Taro.showToast({
              title: `最多只能选择${currentStep.maxSelect}项`,
              icon: 'none',
              duration: 2000,
            })
            return false
          }
        } else {
          // 单选：检查是否有选择
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

      // template_grid 类型：检查是否有选择
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

      // radio_group 类型：检查是否有选择
      case 'radio_group': {
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

      // slider 类型：通常不需要验证，但可以检查是否有值
      case 'slider': {
        return true
      }

      // textarea 类型：检查是否有内容
      case 'textarea': {
        const fieldKey = `step_${currentStep.step}`
        if (!data[fieldKey]) {
          Taro.showToast({
            title: `请输入${currentStep.title}`,
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

      {/* 中间内容区 */}
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
