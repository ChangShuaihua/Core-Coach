module.exports = {
  extends: ['taro/react', 'prettier'],
  plugins: ['prettier', 'import'],
  rules: {
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'prettier/prettier': 'error',

    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'object',
          'type',
        ],
        pathGroups: [
          // React 最先
          {
            pattern: 'react',
            group: 'builtin',
            position: 'before',
          },
          {
            pattern: 'react-**',
            group: 'builtin',
            position: 'before',
          },
          // Taro 紧随其后
          {
            pattern: '@tarojs/**',
            group: 'external',
            position: 'before',
          },
          // 内部模块
          {
            pattern: '@/**',
            group: 'internal',
          },
          // 样式文件放最后
          {
            pattern: './**/*.{css,scss,sass,less}',
            group: 'object',
            position: 'after',
          },
          {
            pattern: '*.{css,scss,sass,less}',
            group: 'object',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['react', 'builtin'],
        'newlines-between': 'never', // 关键：不要空行
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        warnOnUnassignedImports: false, // 不警告副作用导入
      },
    ],
  },
}
