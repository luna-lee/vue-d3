import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path, { resolve } from 'path'
import type { UserConfig, ConfigEnv } from 'vite'
function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir)
}
// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env: Partial<ImportMetaEnv> = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    base: './',
    css: {},
    resolve: {
      alias: [
        // /@/xxxx => src/xxxx
        {
          find: /@\//,
          replacement: pathResolve('src') + '/',
        },
        // /#/xxxx => types/xxxx
        {
          find: /#\//,
          replacement: pathResolve('types') + '/',
        },
      ],
    },
    publicDir: '', // 指定静态资源目录
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          // 压缩选项
          drop_console: true, // 移除console
          drop_debugger: true, // 移除debugger
        },
        output: {
          // 输出选项
          comments: false, // 移除注释
        },
      },
      target: 'modules',
      outDir: '../packages/vue3',
      lib: {
        entry: path.resolve(
          __dirname,
          './src/components/moon-hierarchy/index.vue'
        ), //指定组件编译入口文件
        name: 'moon-hierarchy',
        formats: ['es'],
        fileName: () => `moon-hierarchy.js`,
      }, //库编译模式配置
      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: ['vue', 'lodash-es', 'd3'],
        output: {
          // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
          globals: {
            vue: 'Vue',
          },
          assetFileNames: assetInfo => {
            // 如果是 CSS 文件，指定输出的文件名
            if (assetInfo.name === 'style.css') {
              return 'moon-hierarchy.css'
            }
            // 其它静态资源保持默认文件名
            return assetInfo.name
          },
        },
      },
    },
    plugins: [vue(), vueJsx()],
    server: {
      cors: true,
      open: true,
      port: 9000,
      host: '0.0.0.0',
      proxy:
        mode === 'development' &&
        env.VITE_DEV_PROXY === 'true' &&
        env.VITE_DEV_PROXY_NAME
          ? {
              [env.VITE_DEV_PROXY_NAME]: {
                target: env.VITE_DEV_PROXY_API, //代理接口
                changeOrigin: true,
                rewrite: path => {
                  return path.replace(
                    new RegExp(`^${env.VITE_DEV_PROXY_NAME}`),
                    ''
                  )
                },
              },
            }
          : undefined,
    },
  }
})
