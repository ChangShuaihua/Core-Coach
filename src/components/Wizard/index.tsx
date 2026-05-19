import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
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
  onGenerate?: (data: Record<string, any>) => Promise<Record<string, any> | null>
}

export default function Wizard({ stepConfig, onFinish, onGenerate }: WizardProps) {
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

  // ✅ 增强的动态校验逻辑，支持从步骤配置中动态读取必填项
  const validateCurrentStep = (): boolean => {
    if (!currentStep) return false
    if (!currentStep.required) return true

    const fieldKey = `step_${currentStep.step}`
    const selectedValue = data[fieldKey]

    switch (currentStep.type) {
      case 'selector':
        if (currentStep.multiple) {
          if (!Array.isArray(selectedValue) || selectedValue.length === 0) {
            showToast(`请选择${currentStep.title}`)
            return false
          }
          if (currentStep.maxSelect && selectedValue.length > currentStep.maxSelect) {
            showToast(`最多只能选择${currentStep.maxSelect}项`)
            return false
          }
        } else {
          if (!selectedValue) {
            showToast(`请选择${currentStep.title}`)
            return false
          }
        }
        return true

      case 'template_grid':
      case 'upload':
        if (!data[fieldKey]) {
          showToast(
            currentStep.type === 'upload'
              ? `请上传${currentStep.title}`
              : `请选择${currentStep.title}`
          )
          return false
        }
        return true

      case 'param_settings': {
        const requiredFields = ['age', 'playerCount', 'gameType']
        for (const field of requiredFields) {
          const val = data[field]
          // 严格校验：值不存在、为 null、或者为空字符串时拦截
          if (val === undefined || val === null || val === '') {
            showToast(`请完成所有必填项`)
            return false
          }
        }
        return true
      }

      default:
        return true
    }
  }

  const showToast = (title: string) => {
    Taro.showToast({ title, icon: 'none', duration: 2000 })
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return

    if (isLastStep) {
      console.log('📊 最终提交数据:', data)
      onFinish?.(data)
    } else {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const updateData = (newData: Record<string, any>) => {
    setData((prev) => ({ ...prev, ...newData }))
  }

  if (steps.length === 0 || !currentStep) {
    return (
      <View className="p-4 text-center text-gray-400">
        <Text>没有步骤配置</Text>
      </View>
    )
  }

  const indicatorSteps = steps.map((step) => ({
    id: step.step,
    label: step.title,
    description: `第${step.step}步`,
  }))

  return (
    <View className="w-full h-full flex flex-col bg-gray-50">
      {/* 顶部步骤条 */}
      <View className="flex-shrink-0 bg-white px-4 py-3 border-b border-gray-200">
        <StepIndicator
          steps={indicatorSteps}
          currentStep={currentStep.step}
          size="medium"
          clickable={false}
        />
      </View>

      {/* 中间内容区 */}
      <View className="flex-1 overflow-y-auto bg-white">
        <View className="max-w-2xl mx-auto">
          <StepRenderer config={currentStep} value={data} onChange={updateData} />
        </View>
      </View>

      {/* 底部按钮栏 */}
      <View className="flex-shrink-0 bg-white px-4 py-4 border-t border-gray-200">
        <View className="max-w-2xl mx-auto flex flex-row gap-3">
          {/* 情况 A：只要不是第一步，无论什么时候都要允许用户返回“上一步” */}
          {!isFirstStep && (
            <View
              className="flex-1 py-3 px-4 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 bg-white text-center cursor-pointer flex items-center justify-center"
              onClick={handlePrev}
            >
              <Text>上一步</Text>
            </View>
          )}

          {/* 右侧主按钮/操作按钮分流 */}
          {isLastStep ? (
            // 情况 B-1：最后一步（生成结果页）
            <>
              <View
                className="flex-1 py-3 px-4 rounded-lg font-semibold border-2 border-orange-500 text-orange-500 bg-white text-center cursor-pointer flex items-center justify-center"
                onClick={() => Taro.showToast({ title: '重新生成开发中', icon: 'none' })}
              >
                <Text className="text-orange-500">重新生成</Text>
              </View>
              <View
                className="flex-1 py-3 px-4 rounded-lg font-semibold border-2 border-orange-500 text-orange-500 bg-white text-center cursor-pointer flex items-center justify-center"
                onClick={() => Taro.showToast({ title: '分享功能开发中', icon: 'none' })}
              >
                <Text className="text-orange-500">分享图片</Text>
              </View>
              <View
                className="flex-1 py-3 px-4 rounded-lg font-semibold text-white text-center cursor-pointer bg-orange-500 flex items-center justify-center"
                onClick={() => Taro.showToast({ title: '收藏成功', icon: 'success' })}
              >
                <Text className="text-white">收藏</Text>
              </View>
            </>
          ) : steps.length === 2 && isFirstStep ? (
            // 情况 B-2：两步流程的第一步，显示"生成结果"按钮
            <View
              className="flex-1 py-3 px-4 rounded-lg font-semibold text-white text-center cursor-pointer bg-orange-500 flex items-center justify-center"
              onClick={async () => {
                if (!validateCurrentStep()) return
                if (onGenerate) {
                  const result = await onGenerate(data)
                  if (result) {
                    // 将生成结果合并到 data 中
                    setData((prev) => ({ ...prev, ...result }))
                    setCurrentStepIndex((prev) => prev + 1)
                  }
                }
              }}
            >
              <Text className="text-white">生成结果</Text>
            </View>
          ) : (
            // 情况 B-3：普通推进步骤
            <View
              className="flex-1 py-3 px-4 rounded-lg font-semibold text-white text-center cursor-pointer bg-orange-500 flex items-center justify-center"
              onClick={handleNext}
            >
              <Text className="text-white">下一步</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
