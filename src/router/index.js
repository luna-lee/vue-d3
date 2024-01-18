import Vue from 'vue';
import VueRouter from 'vue-router';
import Index from '../views/index.vue';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Index',
        component: Index
    },
    {
        path: '/md-view',
        name: 'md-view',
        component: () => import('@/views/md-view.vue')
    }
];

const router = new VueRouter({
    routes
});

export default router;
