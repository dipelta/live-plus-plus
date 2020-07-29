module.exports = {
  pluginOptions: {
    electronBuilder: {
      webSecurity: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      backgroundThrottling: false,
      disableMainProcessTypescript: false,
      mainProcessTypeChecking: false,
      builderOptions: {
        appId: 'cn.dipelta.liveplus',
        productName: 'live++',
        extraResources: [
          'build/**/*'
        ],
        directories: {
          output: './dist_electron',
          buildResources: 'build'
        },
        win: {
          icon: './build/win/logo.ico',
          target: [
            {
              target: 'nsis',
              arch: ['x64', 'ia32']
            }
          ]
        },
        nsis: {
          oneClick: false, // 是否一键安装
          allowElevation: true, // 允许请求提升。 如果为false，则用户必须使用提升的权限重新启动安装程序。
          allowToChangeInstallationDirectory: true, // 允许修改安装目录
          installerIcon: './build/win/logo.ico', // 安装图标
          uninstallerIcon: './build/win/logo.ico', // 卸载图标
          installerHeaderIcon: './build/win/logo.ico', // 安装时头部图标
          createDesktopShortcut: false, // 创建桌面图标
          createStartMenuShortcut: true, // 创建开始菜单图标
          shortcutName: 'live++' // 图标名称
        },
        mac: {
          category: 'public.app-category.entertainment',
          target: 'dmg',
          icon: './build/mac/Icon.icns'
        },
        linux: {
          target: {
            target: 'AppImage',
            arch: ['x64', 'ia32']
          },
          icon: './build/linux/logo_256x256.png'
        }
      }
    }
  },
  devServer: {
    host: '0.0.0.0',
    port: 9843
  },
  transpileDependencies: [
    'vuetify'
  ]
}
