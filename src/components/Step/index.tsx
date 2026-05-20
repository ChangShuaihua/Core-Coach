import { View, Text } from '@tarojs/components'

export interface Step {
  id: string | number
  label: string
  description?: string
}

export interface StepIndicatorProps {
  steps: Step[]
  currentStep: string | number
  onStepClick?: (stepId: string | number) => void
  size?: 'small' | 'medium' | 'large'
  clickable?: boolean
}

export default function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  size = 'small',
  clickable = false,
}: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep)

  const isStepCompleted = (index: number) => index < currentStepIndex
  const isStepActive = (index: number) => index === currentStepIndex

  const handleStepClick = (stepId: string | number) => {
    if (clickable && onStepClick) {
      onStepClick(stepId)
    }
  }

  // 统一动态尺寸
  const dimensions = {
    small: { circle: 32, font: 12, labelFont: 12 },
    medium: { circle: 40, font: 14, labelFont: 14 },
    large: { circle: 56, font: 18, labelFont: 16 },
  }[size] || { circle: 40, font: 14, labelFont: 14 }

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      <View
        style={{
          position: 'absolute',
          // 顶距 = 圆心所在高度。即：(圆形大小 / 2) + 外层上边距(16px)
          top: `${dimensions.circle / 2 + 8}px`,
          // 左右缩进距离为 1/steps.length 的一半，正好落在两端圆形的中心
          left: `${100 / steps.length / 2}%`,
          right: `${100 / steps.length / 2}%`,
          height: '2px',
          backgroundColor: '#e5e6eb',
          zIndex: 1,
        }}
      >
        <View
          style={{
            width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            height: '100%',
            backgroundColor: '#ffa052',
            transition: 'width 0.3s ease',
          }}
        />
      </View>

      <View style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 2 }}>
        {steps.map((step, index) => {
          const active = isStepActive(index)
          const completed = isStepCompleted(index)

          return (
            <View
              key={step.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
              onClick={() => handleStepClick(step.id)}
            >
              {/* 步骤数字圆圈 */}
              <View
                style={{
                  width: `${dimensions.circle}px`,
                  height: `${dimensions.circle}px`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxSizing: 'border-box',
                  // 未激活时为图中的白底灰边效果
                  backgroundColor: active ? '#fe6601' : completed ? '#ffa052' : '#ffffff',
                  border: active || completed ? 'none' : '2px solid #e5e6eb',
                  color: active || completed ? '#ffffff' : '#86909c',
                  cursor: clickable ? 'pointer' : 'default',
                }}
              >
                <Text style={{ fontSize: `${dimensions.font}px`, lineHeight: 1 }}>{index + 1}</Text>
              </View>

              {/* 步骤文案 */}
              <Text
                style={{
                  marginTop: '10px',
                  fontSize: `${dimensions.labelFont}px`,
                  fontWeight: active ? 'bold' : 'normal',
                  color: active ? '#fe6601' : completed ? '#ffa052' : '#86909c',
                }}
              >
                {step.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
