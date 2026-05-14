import { ALL_PAGES } from './config/routes'

export default defineAppConfig({
  pages: ALL_PAGES,
  window: {
    navigationStyle: 'custom',
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    custom: true, // 使用自定义 tabBar
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
        pagePath: 'pages/creation-home/index',
        text: '创作',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
      },
    ],
  },
})
