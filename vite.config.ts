import { defineApplicationConfig } from '@vben/vite-config';

export default defineApplicationConfig({
  overrides: {
    optimizeDeps: {
      include: [
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'qrcode',
        '@iconify/iconify',
        'ant-design-vue/es/locale/zh_CN',
        'ant-design-vue/es/locale/en_US',
      ],
    },
    server: {
      proxy: {
        // 开发时不需要代理，因为 VITE_GLOB_API_URL 已经是完整 URL
        // 保留 /upload 代理（文件上传可能需要）
        '/upload': {
          target: 'https://dghs.gddogootech.com',
          changeOrigin: true,
          secure: false,
        },
      },
      warmup: {
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
    },
  },
});
