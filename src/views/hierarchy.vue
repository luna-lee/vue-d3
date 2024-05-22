<template>
    <div>
        <div class="pannel">
            <div>
                <button @click="$refs.hierarchy.moveToCenter()">移动到中心</button>
                <button @click="$refs.hierarchy.zoom(1.5)">放大</button>
                <button @click="$refs.hierarchy.zoom(0.5)">缩小</button>
                <button @click="$refs.hierarchy.pauseZoom()">暂停缩放</button>
                <button @click="$refs.hierarchy.continueZoom()">恢复缩放</button>
            </div>
            <div style="margin-top: 10px">
                <input type="radio" id="h" value="h" v-model="mode" />
                <label for="h">水平模式</label>
                <input type="radio" id="v" value="v" v-model="mode" />
                <label for="v">垂直模式</label>
            </div>
            <div class="item" v-if="mode == 'h'">
                <div><input type="radio" id="h-lr" value="lr" v-model="layout" /> <label for="h-lr">左-右布局</label></div>
                <div><input type="radio" id="h-rl" value="rl" v-model="layout" /> <label for="h-rl">右-左布局</label></div>
                <div><input type="radio" id="h-bf" value="bf" v-model="layout" /> <label for="h-bf">蝴蝶布局</label></div>
            </div>
            <div class="item" v-if="mode == 'v'">
                <div><input type="radio" id="tb" value="tb" v-model="layout" /> <label for="tb">上-下布局</label></div>
                <div><input type="radio" id="bt" value="bt" v-model="layout" /> <label for="bt">下-上布局</label></div>
                <div><input type="radio" id="v-bf" value="bf" v-model="layout" /> <label for="v-bf">蝴蝶布局</label></div>
            </div>
        </div>
        <div class="document">
            <!-- <router-link to="/md-view" target="_blank">文档</router-link> -->
            <a href="https://github.com/luna-lee/moon-hierarchy" target="_blank">github地址</a>
        </div>

        <hierarchy
            ref="hierarchy"
            :mode="mode"
            :treeData="treeData"
            :treeOptions="{ id: 'code', pId: 'pcode' }"
            :layout="layout"
            :negativeIds="['qydak', 'root1', 'root2', 'root3']"
            :config="config"
            :width="width"
            :height="height"
            @draw-done="onDrawDone"
        >
            <div class="contextmenu">
                <button @click="onAdd">新增</button>
                <button @click="onRemove">移除</button>
                <button @click="onUpdate">更新数据</button>
            </div>
        </hierarchy>
    </div>
</template>
<script>
import hierarchy from '@/components/moon-hierarchy/index.vue';
import ContextmenuView from './ContextmenuView.vue';
export default {
    inheritAttrs: false,
    name: '',
    props: {},
    components: {
        hierarchy,
        ContextmenuView
    },
    created() {
        this.setWidthHeight();
        window.addEventListener('resize', () => {
            // 窗口大小改变时执行的操作
            this.setWidthHeight();
        });
    },
    mounted() {
        let _this = this;
        fetch('https://www.fste.top/files/d3335980e04011ed91b4f7437d34c747/dataTree.js')
            .then((response) => {
                return response.text();
            })
            .then((data) => {
                _this.treeData = eval(data);
            });
    },
    data() {
        return {
            ContextmenuViewShow: false,
            mode: 'v',
            layout: 'bf',
            treeData: [],
            currentNode: {},
            width: 0,
            height: 0,
            config: {
                node: {
                    on: {
                        clickFetchChildren: (data, node, svg) => {
                            console.log(data, node, svg);
                            return new Promise((r) => {
                                setTimeout(() => {
                                    r([
                                        {
                                            id: '32323',
                                            name: '金融贷款余额test',
                                            code: '980eccec9a23237b49e488c10f8fa70f9c2d'
                                        },
                                        {
                                            id: '3233',
                                            name: '金融贷款余额test',
                                            code: '980444eccec9a23237b49e488c10f8fa70f9c2d'
                                        },
                                        {
                                            id: '323243333',
                                            name: '金融贷款余额test',
                                            code: '1980eccec9a23237b49e488c10f8fa70f9c2d'
                                        },
                                        {
                                            id: '323323',
                                            name: '金融贷款余额test',
                                            code: '2980eccec9a23237b49e488c10f8fa70f9c2d'
                                        },
                                        {
                                            id: '323223',
                                            name: '金融贷款余额test',
                                            code: '3980eccec9a23237b49e488c10f8fa70f9c2d'
                                        },
                                        {
                                            id: '323123',
                                            name: '金融贷款余额test',
                                            code: '480eccec9a23237b49e488c10f8fa70f9c2d'
                                        },
                                        {
                                            id: '323232',
                                            name: '金融贷款余额test',
                                            code: '94580eccec9a23237b49e488c10f8fa70f9c2d'
                                        },
                                        {
                                            id: '3333',
                                            name: 'lv-2',
                                            code: '94580eccec9a23237b49e488c10f8fa70f9c2d11',
                                            pcode: '94580eccec9a23237b49e488c10f8fa70f9c2d'
                                        }
                                    ]);
                                }, 2000);
                            });
                        },
                        click: (e, d, node, svg) => {
                            // console.log(e, d, node, svg);
                            this.$refs.hierarchy.hiddenCustomView();
                        },
                        contextmenu: (e, d, node, svg) => {
                            e.preventDefault();
                            this.currentNode = d.data;
                            this.$refs.hierarchy.showCustomView(e, d);
                        }
                    },
                    exShaps: [
                        {
                            name: 'text',
                            attrs: {
                                fill: (d) => {
                                    if (d.data.children?.length) return 'red';
                                },
                                'font-size': 19,
                                transform: (d) => {
                                    return d.data._sign == 1
                                        ? `translate(${d.data._nodeConfig.nodeWidth},${d.data._nodeConfig.nodeHeight / 2 + 5})`
                                        : `translate(-20,${d.data._nodeConfig.nodeHeight / 2 + 5})`;
                                }
                            },
                            compose: {
                                text(d) {
                                    if (typeof d.data._isexpend == 'boolean') {
                                        return d.data._isexpend ? '🤩' : '🤓';
                                    }
                                    return d.data?.children?.length ? '😝' : '😃';
                                }
                            }
                        }
                    ]
                },
                customView: {
                    width: 120,
                    height: 100
                },
                arrow: {
                    // show: false
                }
            }
        };
    },
    watch: {},
    computed: {},
    methods: {
        setWidthHeight() {
            this.width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) - 10;
            this.height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 30;
        },
        addNew() {
            this.$refs.hierarchy.addNode('root', [
                {
                    id: 'new' + new Date().getTime(),
                    name: '企业信息' + 'new' + new Date().getTime(),
                    code: 'new' + new Date().getTime(),
                    modelType: '',
                    domainId: '',
                    pcode: 'root'
                }
            ]);
        },
        onDrawDone({ svg, container }) {
            svg.on('click', () => {
                console.log('这是画布');
                this.$refs.hierarchy.hiddenCustomView();
            });
            this.svg = svg;
            this.container = container;
        },
        onAdd() {
            this.$refs.hierarchy.addNode(
                this.currentNode.code,
                [
                    {
                        id: 'new' + new Date().getTime(),
                        name: '企业信息' + 'new' + new Date().getTime(),
                        code: 'new' + new Date().getTime(),
                        modelType: '',
                        domainId: '',
                        pcode: this.currentNode.code
                    }
                ],
                -1
            );
        },
        onRemove() {
            this.$refs.hierarchy.removeNodeById(this.currentNode.code);
        },
        onUpdate() {
            this.$refs.hierarchy.updateNodeByData({ ...this.currentNode, name: 'hello', children: [] });
        }
    }
};
</script>
<style lang="scss">
.pannel {
    position: absolute;
    label {
        cursor: pointer;
    }
    .item {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        border: 1px solid;
        background-color: pink;
        div {
            padding: 5px;
        }
    }
}
.document {
    position: absolute;
    right: 10px;
    display: flex;
    gap: 20px;
}
.contextmenu {
    background-color: antiquewhite;
    width: 100%;
    height: 100%;
    background-color: #fff;
    padding: 5px;
    border-radius: 8px;
    box-sizing: border-box;
    box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
}
</style>
