<template>
    <div>
        <horizontal v-if="mode == 'h'" ref="MoonHierarchy" v-bind="$attrs" v-on="$listeners"></horizontal>
        <vertical v-else ref="MoonHierarchy" v-bind="$attrs" v-on="$listeners"></vertical>
    </div>
</template>
<script>
import horizontal from './h.vue';
import vertical from './v.vue';

export default {
    inheritAttrs: false,
    name: 'MoonHierarchy',
    props: {
        mode: {
            type: String,
            default: 'h' // h:horizontal,v: vertical
        }
    },
    components: { horizontal, vertical },
    created() {},
    mounted() {},
    data() {
        return {};
    },
    watch: {},
    computed: {},
    methods: {
        getNodeById(id) {
            return this.$refs.MoonHierarchy.getNodeById(id);
        },
        getAllNode() {
            return this.$refs.MoonHierarchy.getAllNode();
        }
    }
};
</script>
<style lang="scss">
.moon-hierarchy-node {
    &:not(.moon-hierarchy-expend-button):hover {
        .moon-hierarchy-rect {
            stroke: rgb(18, 137, 239);
        }
    }
}
.moon-hierarchy-node-hover-link {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: moon-hierarchy-link-run 20s linear infinite;
}
.moon-hierarchy-loading {
    animation: moon-hierarchy-rotate 3s linear infinite;
}
@keyframes moon-hierarchy-rotate {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes moon-hierarchy-link-run {
    from {
        stroke-dasharray: 10, 5;
    }
    to {
        stroke-dasharray: 20, 5;
    }
}
</style>
<style lang="scss" scoped></style>
