import { useState } from 'react'
import { View, Text, Button, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Refresh } from '@nutui/icons-react-taro'
import StepIndicator from '@/components/Step'
import StepRenderer from '@/pages/wizard/components/StepRenderer'
import type { StepConfig } from '@/pages/wizard/components/StepRenderer'
import { requestTaskCompleteSubscribe } from '@/utils/subscribe'

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
  onTaskSubmitted?: (recordId: number) => void
}

export default function Wizard({ stepConfig, onFinish, onGenerate, onTaskSubmitted }: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState<Record<string, any>>({})
  const [subPageActive, setSubPageActive] = useState(false)

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
    if (!currentStep.required) return true

    if (currentStep.type === 'param_settings') {
      const requiredFields = ['age', 'gameType']
      for (const field of requiredFields) {
        const val = data[field]
        if (val === undefined || val === null || val === '') {
          showToast(`请完成所有必填项`)
          return false
        }
      }
    }

    return true
  }

  const showToast = (title: string) => {
    Taro.showToast({ title, icon: 'none', duration: 2000 })
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return

    if (isLastStep) {
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
    <View className="w-full h-full flex flex-col">
      {/* 隐藏的 Canvas 用于生成分享图片 */}
      <Canvas
        type="2d"
        id="shareCanvas"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '300px',
          height: '420px',
        }}
      />

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
      {!subPageActive && !isLastStep && (
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

            {steps.length === 2 && isFirstStep ? (
              <Button
                className="flex-1 flex items-center justify-center py-3 rounded-full"
                style={{
                  backgroundColor: '#FF7A2F',
                  border: 'none',
                  color: '#fff',
                  lineHeight: '1.5',
                }}
                onClick={() => {
                  if (!validateCurrentStep()) return
                  if (onGenerate) {
                    onGenerate(data).then((genResult) => {
                      if (genResult) {
                        requestTaskCompleteSubscribe()
                        onTaskSubmitted?.(genResult.recordId)
                      }
                    })
                  }
                }}
              >
                <Text className="text-base font-semibold text-white">生成结果</Text>
              </Button>
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
