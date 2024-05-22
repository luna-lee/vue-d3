<template>
    <div>
        <horizontal v-if="mode == 'h'" ref="MoonHierarchy" v-bind="$attrs" v-on="$listeners"> <slot /></horizontal>
        <vertical v-else ref="MoonHierarchy" v-bind="$attrs" v-on="$listeners"> <slot /></vertical>
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
        return {
            show: false
        };
    },
    watch: {},
    computed: {},
    methods: {
        getNodeById(id) {
            return this.$refs.MoonHierarchy.getNodeById(id);
        },
        getAllNode() {
            return this.$refs.MoonHierarchy.getAllNode();
        },
        moveToCenter() {
            this.$refs.MoonHierarchy.moveToCenter(null);
        },
        zoom(scale) {
            this.$refs.MoonHierarchy.scale(scale);
        },
        addNode(targetNodeId, childrenNode, _sign) {
            this.$refs.MoonHierarchy.addNodeToTargetNode(targetNodeId, childrenNode, _sign);
        },
        // id可以是数组
        removeNodeById(id) {
            this.$refs.MoonHierarchy.removeNodeById(id);
        },
        pauseZoom() {
            this.$refs.MoonHierarchy.pauseZoom();
        },
        continueZoom() {
            this.$refs.MoonHierarchy.continueZoom();
        },
        getTranslateOffset(d) {
            return this.$refs.MoonHierarchy.getTranslateOffset(d);
        },
        showCustomView(e, d, width, height, priority) {
            this.$refs.MoonHierarchy.drawCustomView(e, d, width, height, priority);
        },
        hiddenCustomView() {
            this.$refs.MoonHierarchy.hiddenCustomView();
        },
        // data可以是数组
        updateNodeByData(data) {
            this.$refs.MoonHierarchy.updateNodeByData(data);
        }
    }
};
</script>
<style lang="scss">
.moon-hierarchy-svg {
    .moon-hierarchy-node {
        // 默认rect样式
        .moon-hierarchy-rect {
            fill: #fff;
            stroke: rgb(216, 216, 216);
            stroke-width: 0.5;
        }
        // 默认text样式
        .moon-hierarchy-text {
            fill: rgb(51, 51, 51);
        }
        // 默认plus样式
        .moon-hierarchy-plus {
            stroke: rgb(153, 153, 153);
            fill: rgb(234, 242, 255);
            stroke-width: 1;
        }

        // 根节点样式
        &.moon-hierarchy-node-root {
            .moon-hierarchy-rect {
                fill: rgb(18, 137, 239);
            }
            .moon-hierarchy-text {
                fill: #fff;
            }
            .moon-hierarchy-plus {
                display: none;
            }
        }
        // 没有子节点的样式
        &:not(.moon-hierarchy-node-haschildren) {
            .moon-hierarchy-plus {
                display: none;
            }
        }
        // 非根节点的节点展开后样式
        &.moon-hierarchy-node-expend:not(.moon-hierarchy-node-root) {
            .moon-hierarchy-text {
                fill: rgb(18, 139, 237);
            }
        }
        // 节点展开后样式
        &.moon-hierarchy-node-expend {
            .moon-hierarchy-plus {
                line:nth-of-type(2) {
                    display: none;
                }
            }
        }
        //展开限制节点的按钮型节点样式
        &.moon-hierarchy-node-limit-button {
            .moon-hierarchy-rect {
                fill: rgb(247, 247, 247);
            }
        }
        // 非展开限制节点的按钮型节点得节点鼠标悬停样式
        &:not(.moon-hierarchy-node-limit-button):hover {
            .moon-hierarchy-rect {
                stroke: rgb(18, 137, 239);
            }
        }
    }
    .moon-hierarchy-custom-view {
        width: 100%;
        height: 100%;
        background-color: #fff;
        padding: 5px;
        border-radius: 8px;
        box-sizing: border-box;
        // box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
        cursor: pointer;
    }
    .moon-hierarchy-arrow {
        fill: #128bed;
    }
    .moon-hierarchy-link {
        stroke: #d8d8d8;
        stroke-opacity: 1;
        stroke-width: 1;
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
}
</style>
<style lang="scss" scoped></style>
