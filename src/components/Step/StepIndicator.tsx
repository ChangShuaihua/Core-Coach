import { View, Text } from '@tarojs/components'
import classNames from 'classnames'

export interface Step {
  id: string | number
  label: string
  description?: string
}

export interface StepIndicatorProps {
  steps: Step[]
  currentStep: string | number
  onStepClick?: (stepId: string | number) => void
  variant?: 'default' | 'compact'
  size?: 'small' | 'medium' | 'large'
  showDescription?: boolean
  clickable?: boolean
}

/**
 * StepIndicator Component
 *
 * A flexible step indicator component that displays progress through a multi-step process.
 *
 * @example
 * ```tsx
 * const steps = [
 *   { id: 1, label: '模板选择', description: '选择模板' },
 *   { id: 2, label: '参数设置', description: '设置参数' },
 *   { id: 3, label: '预览结果', description: '预览结果' },
 * ]
 *
 * <StepIndicator
 *   steps={steps}
 *   currentStep={1}
 *   onStepClick={(id) => setCurrentStep(id)}
 *   showDescription
 *   clickable
 * />
 * ```
 */
export default function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  variant = 'default',
  size = 'medium',
  showDescription = true,
  clickable = false,
}: StepIndicatorProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          circle: 'w-8 h-8',
          text: 'text-xs',
          label: 'text-xs',
          description: 'text-xs',
          line: 'h-0.5',
        }
      case 'large':
        return {
          circle: 'w-14 h-14',
          text: 'text-lg',
          label: 'text-base',
          description: 'text-sm',
          line: 'h-1',
        }
      case 'medium':
      default:
        return {
          circle: 'w-10 h-10',
          text: 'text-sm',
          label: 'text-sm',
          description: 'text-xs',
          line: 'h-0.5',
        }
    }
  }

  const sizeClasses = getSizeClasses()
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const isStepCompleted = (index: number) => index < currentStepIndex
  const isStepActive = (index: number) => index === currentStepIndex
  const isStepUpcoming = (index: number) => index > currentStepIndex

  const handleStepClick = (stepId: string | number) => {
    if (clickable && onStepClick) {
      onStepClick(stepId)
    }
  }

  return (
    <View className="w-full">
      {/* Horizontal Step Indicator */}
      <View className="flex items-center justify-between w-full px-2">
        {steps.map((step, index) => (
          <View key={step.id} className="flex flex-col items-center flex-1">
            {/* Step Circle */}
            <View
              className={classNames(
                sizeClasses.circle,
                'rounded-full flex items-center justify-center font-semibold transition-all duration-300 flex-shrink-0',
                {
                  'bg-orange-500 text-white': isStepActive(index),
                  'bg-orange-400 text-white': isStepCompleted(index),
                  'bg-gray-300 text-gray-600': isStepUpcoming(index),
                  'cursor-pointer': clickable,
                }
              )}
              onClick={() => handleStepClick(step.id)}
            >
              <Text className={sizeClasses.text}>{isStepCompleted(index) ? '✓' : index + 1}</Text>
            </View>

            {/* Step Label */}
            <Text
              className={classNames(sizeClasses.label, 'mt-2 font-medium text-center', {
                'text-orange-500': isStepActive(index),
                'text-orange-400': isStepCompleted(index),
                'text-gray-600': isStepUpcoming(index),
              })}
            >
              {step.label}
            </Text>

            {/* Step Description */}
            {showDescription && step.description && (
              <Text
                className={classNames(sizeClasses.description, 'mt-1 text-center', {
                  'text-orange-400': isStepActive(index),
                  'text-orange-300': isStepCompleted(index),
                  'text-gray-500': isStepUpcoming(index),
                })}
              >
                {step.description}
              </Text>
            )}

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <View
                className={classNames(sizeClasses.line, 'absolute top-5 left-1/2 w-full', {
                  'bg-orange-400': isStepCompleted(index),
                  'bg-gray-300': !isStepCompleted(index),
                })}
                style={{
                  width: `calc(100% - ${sizeClasses.circle === 'w-10 h-10' ? '40px' : sizeClasses.circle === 'w-8 h-8' ? '32px' : '56px'})`,
                }}
              />
            )}
          </View>
        ))}
      </View>

      {/* Compact Variant - Horizontal Line with Dots */}
      {variant === 'compact' && (
        <View className="mt-4 flex items-center justify-between w-full px-2">
          {steps.map((step, index) => (
            <View key={step.id} className="flex flex-col items-center flex-1">
              <View
                className={classNames('w-3 h-3 rounded-full transition-all duration-300', {
                  'bg-orange-500': isStepActive(index),
                  'bg-orange-400': isStepCompleted(index),
                  'bg-gray-300': isStepUpcoming(index),
                })}
              />
              {index < steps.length - 1 && (
                <View
                  className={classNames('h-0.5 flex-1 mx-1', {
                    'bg-orange-400': isStepCompleted(index),
                    'bg-gray-300': !isStepCompleted(index),
                  })}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
