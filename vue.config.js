const fs = require('fs-extra');
module.exports = {
    // transpileDependencies: ['vue-echarts', 'echarts', 'vue-amap', 'vue-pdf', 'vue-baidu-map', 'crypto-js'],
    publicPath: './',
    lintOnSave: false, // eslint 是否在保存时检查
    configureWebpack: (config) => {
        config.module.rules.push({
            test: /\.md$/,
            use: [
                {
                    loader: require.resolve('./src/plugins/markdownLoader')
                }
            ]
        });
    },
    chainWebpack: (config) => {
        const processArgs = require('minimist')(process.argv.slice(2));
        if (processArgs.target == 'lib') {
            config.externals({
                vue: 'Vue',
                d3: 'd3',
                lodash: 'lodash'
            });
            config.plugin('buildPackagePlugin').use({
                apply(compiler) {
                    // 在构建结束时删除 demo.html 文件
                    compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
                        const outputPath = compiler.options.output.path;
                        const deleteFile = [
                            'moon-hierarchy.common.js',
                            'demo.html',
                            'moon-hierarchy.common.js.map',
                            'moon-hierarchy.umd.js',
                            'moon-hierarchy.umd.js.map',
                            'moon-hierarchy.umd.min.js.map'
                        ];
                        function del(filePath) {
                            fs.pathExists(filePath).then((exists) => {
                                if (exists) {
                                    fs.remove(filePath);
                                }
                            });
                        }
                        setTimeout(() => {
                            deleteFile.forEach((f) => {
                                del(outputPath + '/' + f);
                            });
                        }, 3000);
                    });
                }
            });
        }
    }
};
