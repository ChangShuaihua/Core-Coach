import { TAB_PAGES } from './config/routes'

export default defineAppConfig({
  pages: [...TAB_PAGES],
  subPackages: [
    {
      root: 'pages/login',
      pages: ['index'],
    },
    {
      root: 'pages/wizard',
      pages: ['index'],
    },
    {
      root: 'pages/edit-info',
      pages: ['index'],
    },
    {
      root: 'pages/account-settings',
      pages: ['index'],
    },
    {
      root: 'pages/about',
      pages: ['index'],
    },
    {
      root: 'pages/favorite-games',
      pages: ['index'],
    },
    {
      root: 'pages/more',
      pages: ['index'],
    },
    {
      root: 'pages/detail',
      pages: ['index'],
    },
    {
      root: 'pages/result',
      pages: ['index'],
    },
    {
      root: 'pages/test-subscribe',
      pages: ['index'],
    },
  ],
  window: {
    navigationStyle: 'custom',
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    custom: true,
    color: '#999999',
    selectedColor: '#fe6601',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/chat/index',
        text: '问答',
      },
      {
        pagePath: 'pages/creation/index',
        text: '创作',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ],
  },
})
