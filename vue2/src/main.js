import Vue from 'vue';
import App from './App.vue';
import router from './router';

import VMdPreview from '@kangc/v-md-editor/lib/preview';
import '@kangc/v-md-editor/lib/style/preview.css';
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/theme/style/github.css';

// highlightjs
import hljs from 'highlight.js';

VMdPreview.use(githubTheme, {
    Hljs: hljs
});

Vue.use(VMdPreview);

Vue.config.productionTip = false;
new Vue({
    router,
    render: (h) => h(App)
}).$mount('#app');
