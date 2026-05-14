import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classNames from 'classnames'
import StepIndicator from '@/components/Step'
import type { WizardConfig } from '@/pages/wizard/types/wizard'

export interface WizardPageProps {
  config: WizardConfig
  onFinish?: (data: Record<string, any>) => void
  finishButtonText?: string
}

/**
 * WizardPage - 单页面多步骤组件
 *
 * 通过改变 currentStepIndex 来切换显示不同的内容卡片，不需要页面跳转
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
    console.log('handlePrev called')
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const validateCurrentStep = (): boolean => {
    console.log('validateCurrentStep called')
    console.log('currentStep:', currentStep)
    console.log('data:', data)

    if (currentStep.validate) {
      const validationResult = currentStep.validate(data)
      if (!validationResult.isValid) {
        Taro.showToast({
          title: validationResult.message || '请完成当前步骤',
          icon: 'none',
          duration: 2000,
        })
        return false
      }
      return true
    }

    if (currentStep.requiredFields && currentStep.requiredFields.length > 0) {
      for (const field of currentStep.requiredFields) {
        console.log(`Checking field: ${field}, value:`, data[field])
        if (!data[field]) {
          Taro.showToast({
            title: currentStep.validationMessage || '请完成当前步骤的必填项',
            icon: 'none',
            duration: 2000,
          })
          return false
        }
      }
    }

    return true
  }

  const handleNext = () => {
    console.log('=== handleNext called ===')
    console.log('currentStepIndex:', currentStepIndex)
    console.log('data:', data)

    if (!validateCurrentStep()) {
      console.log('Validation failed')
      return
    }

    console.log('Validation passed')

    if (isLastStep) {
      console.log('Last step, calling onFinish')
      onFinish?.(data)
    } else {
      console.log('Moving to next step:', currentStepIndex + 1)
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const updateData = (key: string, value: any) => {
    console.log('updateData called:', key, value)
    setData((prev) => {
      const newData = {
        ...prev,
        [key]: value,
      }
      console.log('Data updated:', newData)
      return newData
    })
  }

  return (
    <View className="w-full h-full flex flex-col bg-gray-50">
      {/* 顶部步骤条 */}
      <View className="flex-shrink-0 bg-white px-4 py-6 border-b border-gray-200">
        <StepIndicator
          steps={config.steps}
          currentStep={currentStep.id}
          size="medium"
          showDescription
        />
      </View>

      {/* 中间内容区 */}
      <View className="flex-1 overflow-y-auto px-4 py-6">
        <View className="max-w-2xl mx-auto">
          {CurrentComponent && (
            <CurrentComponent data={data} updateData={updateData} currentStep={currentStep} />
          )}
        </View>
      </View>

      {/* 底部按钮栏 */}
      <View className="flex-shrink-0 bg-white px-4 py-4 border-t border-gray-200">
        <View className="max-w-2xl mx-auto flex gap-3">
          {!isFirstStep && (
            <View
              className="flex-1 py-3 px-4 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 bg-white text-center"
              onClick={handlePrev}
            >
              <Text>上一步</Text>
            </View>
          )}

          <View
            className={classNames(
              'flex-1 py-3 px-4 rounded-lg font-semibold text-white text-center',
              {
                'bg-orange-500': !isLastStep,
                'bg-green-500': isLastStep,
              }
            )}
            onClick={() => {
              console.log('=== Button onClick triggered ===')
              handleNext()
            }}
          >
            <Text className="text-white">{isLastStep ? finishButtonText : '下一步'}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
