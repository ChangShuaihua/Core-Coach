import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Refresh, Photograph, StarFill } from '@nutui/icons-react-taro'
import StepIndicator from '@/components/Step'
import WaitingPage from '@/components/WaitingPage'
import StepRenderer from '@/pages/wizard/components/StepRenderer'
import type { StepConfig } from '@/pages/wizard/components/StepRenderer'
import { useTaskStore } from '@/store/taskStore'

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
  onGenerate?: (
    data: Record<string, any>
  ) => Promise<{ recordId: number; businessType: string } | null>
}

export default function Wizard({ stepConfig, onFinish, onGenerate }: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState<Record<string, any>>({})
  const [subPageActive, setSubPageActive] = useState(false)

  const { status, result, startTask, reset: resetTask } = useTaskStore()

  const steps = stepConfig.steps || []
  const currentStep = steps[currentStepIndex]

  // 监听任务完成，自动跳转到结果步骤
  useEffect(() => {
    if (status === 'completed' && result) {
      const resultData = {
        generatedResults: [
          {
            ...result,
            businessType: useTaskStore.getState().businessType,
          },
        ],
      }
      setData((prev) => ({ ...prev, ...resultData }))
      setCurrentStepIndex(steps.length - 1) // 跳到最后一步（结果页）
      resetTask()
    }
  }, [status, result, resetTask, steps.length])

  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

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
        const requiredFields = ['age', 'gameType']
        for (const field of requiredFields) {
          const val = data[field]
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

  // 任务进行中，显示等待页面
  if (status === 'pending' || status === 'processing') {
    return <WaitingPage title="游戏" />
  }

  return (
    <View className="w-full h-full flex flex-col">
      {/* 顶部步骤条 */}
      {!subPageActive && (
        <View className="flex-shrink-0 bg-white border-b py-2">
          <StepIndicator steps={indicatorSteps} currentStep={currentStep.step} clickable={false} />
        </View>
      )}

      {/* 中间内容区 */}
      <View className="flex-1 overflow-y-auto bg-white">
        <View className="max-w-2xl mx-auto">
          <StepRenderer
            config={currentStep}
            value={data}
            onChange={updateData}
            onSubPageChange={setSubPageActive}
          />
        </View>
      </View>

      {/* 底部按钮栏 */}
      {!subPageActive && (
        <View className="flex-shrink-0 bg-white py-4 border-t border-gray-200">
          <View className="max-w-2xl mx-auto flex flex-row gap-2">
            {!isFirstStep && (
              <View
                className="flex-1 flex flex-row items-center justify-center gap-1 py-2 px-2 rounded-full bg-white border border-gray-200"
                onClick={handlePrev}
              >
                <View style={{ transform: 'scaleX(-1)' }}>
                  <Refresh color="#4B5563" size={14} />
                </View>
                <Text className="text-sm font-medium text-gray-700">上一步</Text>
              </View>
            )}

            {isLastStep ? (
              <>
                <View
                  className="flex-1 flex flex-row items-center justify-center gap-1 py-2 px-2 rounded-full"
                  style={{ backgroundColor: '#FFF7F2' }}
                  onClick={() => Taro.showToast({ title: '重新生成开发中', icon: 'none' })}
                >
                  <Refresh color="#FF7A2F" size={14} />
                  <Text className="text-sm font-medium" style={{ color: '#FF7A2F' }}>
                    重新生成
                  </Text>
                </View>

                <View
                  className="flex-1 flex flex-row items-center justify-center gap-1 py-2 px-2 rounded-full"
                  style={{ backgroundColor: '#F3F0FF' }}
                  onClick={() => Taro.showToast({ title: '分享功能开发中', icon: 'none' })}
                >
                  <Photograph color="#7C5CFC" size={14} />
                  <Text className="text-sm font-medium" style={{ color: '#7C5CFC' }}>
                    分享图片
                  </Text>
                </View>

                <View
                  className="flex-1 flex flex-row items-center justify-center gap-1 py-2 px-2 rounded-full"
                  style={{ backgroundColor: '#FF7A2F' }}
                  onClick={() => Taro.showToast({ title: '收藏成功', icon: 'success' })}
                >
                  <StarFill color="#fff" size={14} />
                  <Text className="text-sm font-semibold text-white">收藏</Text>
                </View>
              </>
            ) : steps.length === 2 && isFirstStep ? (
              <View
                className="flex-1 flex items-center justify-center py-3 rounded-full"
                style={{ backgroundColor: '#FF7A2F' }}
                onClick={async () => {
                  if (!validateCurrentStep()) return
                  if (onGenerate) {
                    const genResult = await onGenerate(data)
                    if (genResult) {
                      startTask(genResult.recordId, genResult.businessType)
                    }
                  }
                }}
              >
                <Text className="text-base font-semibold text-white">生成结果</Text>
              </View>
            ) : (
              <View
                className="flex-1 flex items-center justify-center py-3 rounded-full"
                style={{ backgroundColor: '#FF7A2F' }}
                onClick={handleNext}
              >
                <Text className="text-base font-semibold text-white">下一步</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
