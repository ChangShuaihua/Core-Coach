module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 灰色系
        gray: {
          1: 'var(--gray-1)',
          2: 'var(--gray-2)',
          3: 'var(--gray-3)',
          4: 'var(--gray-4)',
          5: 'var(--gray-5)',
          6: 'var(--gray-6)',
          7: 'var(--gray-7)',
          8: 'var(--gray-8)',
          9: 'var(--gray-9)',
          10: 'var(--gray-10)',
          // Tailwind 标准命名（可选，兼容 Tailwind 默认习惯）
          100: 'var(--gray-1)',
          200: 'var(--gray-2)',
          300: 'var(--gray-3)',
          400: 'var(--gray-4)',
          500: 'var(--gray-5)',
          600: 'var(--gray-6)',
          700: 'var(--gray-7)',
          800: 'var(--gray-8)',
          900: 'var(--gray-9)',
        },
        // 蓝色系
        blue: {
          1: 'var(--blue-1)',
          2: 'var(--blue-2)',
          3: 'var(--blue-3)',
          4: 'var(--blue-4)',
          5: 'var(--blue-5)',
          6: 'var(--blue-6)',
          7: 'var(--blue-7)',
          8: 'var(--blue-8)',
          9: 'var(--blue-9)',
          10: 'var(--blue-10)',
          100: 'var(--blue-1)',
          200: 'var(--blue-2)',
          300: 'var(--blue-3)',
          400: 'var(--blue-4)',
          500: 'var(--blue-5)',
          600: 'var(--blue-6)',
          700: 'var(--blue-7)',
          800: 'var(--blue-8)',
          900: 'var(--blue-9)',
        },
        // 橙色系
        orange: {
          1: 'var(--orange-1)',
          2: 'var(--orange-2)',
          3: 'var(--orange-3)',
          4: 'var(--orange-4)',
          5: 'var(--orange-5)',
          6: 'var(--orange-6)',
          7: 'var(--orange-7)',
          8: 'var(--orange-8)',
          9: 'var(--orange-9)',
          10: 'var(--orange-10)',
          100: 'var(--orange-1)',
          200: 'var(--orange-2)',
          300: 'var(--orange-3)',
          400: 'var(--orange-4)',
          500: 'var(--orange-5)',
          600: 'var(--orange-6)',
          700: 'var(--orange-7)',
          800: 'var(--orange-8)',
          900: 'var(--orange-9)',
        },
        // 绿色系
        green: {
          1: 'var(--green-1)',
          2: 'var(--green-2)',
          3: 'var(--green-3)',
          4: 'var(--green-4)',
          5: 'var(--green-5)',
          6: 'var(--green-6)',
          7: 'var(--green-7)',
          8: 'var(--green-8)',
          9: 'var(--green-9)',
          10: 'var(--green-10)',
          100: 'var(--green-1)',
          200: 'var(--green-2)',
          300: 'var(--green-3)',
          400: 'var(--green-4)',
          500: 'var(--green-5)',
          600: 'var(--green-6)',
          700: 'var(--green-7)',
          800: 'var(--green-8)',
          900: 'var(--green-9)',
        },
        // 主色系
        primary: {
          DEFAULT: 'var(--primary-color)',
          1: 'var(--primary-color-1)',
          2: 'var(--primary-color-2)',
          3: 'var(--primary-color-3)',
          4: 'var(--primary-color-4)',
          5: 'var(--primary-color-5)',
          6: 'var(--primary-color-6)',
          7: 'var(--primary-color-7)',
          8: 'var(--primary-color-8)',
          9: 'var(--primary-color-9)',
          10: 'var(--primary-color-10)',
          100: 'var(--primary-color-1)',
          200: 'var(--primary-color-2)',
          300: 'var(--primary-color-3)',
          400: 'var(--primary-color-4)',
          500: 'var(--primary-color-5)',
          600: 'var(--primary-color-6)',
          700: 'var(--primary-color-7)',
          800: 'var(--primary-color-8)',
          900: 'var(--primary-color-9)',
        },
        // 语义化颜色
        success: 'var(--success-color)',
        danger: 'var(--danger-color)',
        warning: 'var(--warning-color)',
        text: 'var(--text-color)',
        active: 'var(--active-color)',
        background: 'var(--background-color)',
        'background-light': 'var(--background-color-light)',
        'text-link': 'var(--text-link-color)',
      },
      fontSize: {
        xxxs: 'var(--font-size-xxxs)',
        xxs: 'var(--font-size-xxs)',
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        md: 'var(--font-size-md)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
      },
      lineHeight: {
        xs: 'var(--line-height-xs)',
        sm: 'var(--line-height-sm)',
        base: 'var(--line-height-base)',
        md: 'var(--line-height-md)',
        lg: 'var(--line-height-lg)',
      },
      borderRadius: {
        sm: 'var(--border-radius-sm)',
        md: 'var(--border-radius-md)',
        lg: 'var(--border-radius-lg)',
        max: 'var(--border-radius-max)',
      },
      borderColor: {
        DEFAULT: 'var(--border-color)',
      },
      borderWidth: {
        DEFAULT: 'var(--border-width-base)',
      },
      spacing: {
        base: 'var(--padding-base)',
        xs: 'var(--padding-xs)',
        sm: 'var(--padding-sm)',
        md: 'var(--padding-md)',
        lg: 'var(--padding-lg)',
        xl: 'var(--padding-xl)',
      },
      fontFamily: {
        base: 'var(--base-font-family)',
        price: 'var(--price-integer-font-family)',
      },
      transitionDuration: {
        base: 'var(--animation-duration-base)',
        fast: 'var(--animation-duration-fast)',
      },
      transitionTimingFunction: {
        enter: 'var(--animation-timing-function-enter)',
        leave: 'var(--animation-timing-function-leave)',
      },
      spacing: (() => {
        const map = {}
        // Tailwind spacing 1 ~ 100 对应 px 单位（Taro 自动转 rpx）
        for (let i = 1; i <= 100; i++) {
          map[i] = `${i * 4}px` // 1 -> 4px, 2 -> 8px ...
        }
        return map
      })(),
      width: (() => {
        const map = {}
        for (let i = 1; i <= 100; i++) {
          map[i] = `${i * 4}px`
        }
        return map
      })(),
      height: (() => {
        const map = {}
        for (let i = 1; i <= 100; i++) {
          map[i] = `${i * 4}px` // 12 -> 48px
        }
        return map
      })(),
      fontSize: (() => {
        const map = {}
        for (let i = 12; i <= 48; i += 2) {
          map[i] = `${i}px` // 16 -> 16px
        }
        return map
      })(),
    },
  },
  plugins: [
      require('tailwindcss/plugin')(({ addUtilities }) => {
      // 禁用 last:、hover: 等特殊选择器的转义，或者用小程序兼容写法
    })
  ],
  corePlugins: {
    preflight: false, // 禁用 Tailwind 的基础样式重置，避免和小程序冲突
    backdropFilter: false, // 禁用可能不兼容的特性
    backgroundClip: false,
  },
  safelist: [],
}
