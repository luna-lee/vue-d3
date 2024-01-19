<template>
    <div ref="svg"></div>
</template>
<script>
import * as d3 from 'd3';
export default {
    inheritAttrs: false,
    name: '',
    props: {
        width: {
            type: Number,
            default: 1366
        },
        height: {
            type: Number,
            default: 768
        }
    },
    components: {},
    created() {},
    async mounted() {
        let _this = this;
        let res = await fetch('https://www.1724956493.top/files/d3335980e04011ed91b4f7437d34c747/dataTree.js').then(
            (response) => {
                return response.text();
            }
        );
        this.nodes = eval(res);

        this.draw();
    },
    data() {
        return {
            svg: null,
            container: null,
            nodes: [],
            links: [{ source: 'root', target: 'root1' }],
            currentScale: 1
        };
    },
    watch: {},
    computed: {
        centerPosition() {
            return { x: this.width / 2, y: this.height / 2 };
        },
        nodeConfig() {
            const rectShap = {
                name: 'rect',
                attrs: {
                    stroke: 'rgb(216, 216, 216)',
                    fill: '#fff',
                    'stroke-width': '0.5',
                    height: 50,
                    width: 100
                }
            };
            const textShap = {
                name: 'text',
                attrs: {
                    class: 'moon-hierarchy-text',
                    'font-size': 12
                },
                compose: {
                    text(d) {
                        return d.name;
                    }
                }
            };
            return {
                shaps: [textShap]
            };
        }
    },
    methods: {
        init() {
            var nodes = [
                { id: 'Start' },
                { id: 'Step1', parent: 'Start' },
                { id: 'Step2', parent: 'Start' },
                { id: 'Step3', parent: 'Start' },
                { id: 'End', parents: ['Step2', 'Step3'] }
            ];
            const root = d3
                .stratify()
                .id((d) => d.id)
                .parentId((d) => d.parent)(nodes);
            console.log(root);
            // this.addNodes(simulation.nodes());
        },
        draw() {
            this.createSvg();
            this.createContainDom();
            this.appendSvg();
            this.init();
            this.initZoom();
            this.moveToCenter();
        },
        createSvg() {
            this.svg = d3
                .create('svg')
                .attr('class', 'moon-hierarchy-svg')
                .attr('width', this.width)
                .attr('height', this.height)
                .attr('cursor', 'move');
        },
        createContainDom() {
            this.container = this.svg
                .append('g')
                .attr('font-family', 'sans-serif')
                .attr('transform', `translate(${this.width / 2},${this.height / 2}) scale(1)`);
        },
        appendSvg() {
            this.$refs.svg.append(this.svg.node());
        },
        addNodes(nodeList) {
            if (!this.nodesContainer)
                this.nodesContainer = this.container.append('g').attr('stroke-linejoin', 'round').attr('stroke-width', 3);
            const nodes = this.container
                .selectAll()
                .data(nodeList)
                .join('g')
                .attr('transform', (d) => `translate(${d.x},${d.y})`);
            this.iteratorAddNode(nodes, this.nodeConfig.shaps);
        },
        iteratorAddNode(parrentNodes, nodeConfigList) {
            nodeConfigList.forEach((shap) => {
                const node = parrentNodes.append(shap.name);
                this.setAttrByOpt(node, shap.attrs);
                this.setComposeOpt(node, shap.compose);
                if (shap.children) this.iteratorAddNode(node, shap.children);
            });
        },
        setAttrByOpt(node, opt = {}) {
            Object.keys(opt).map((key) => {
                node.attr(key, opt[key]);
            });
        },
        setComposeOpt(node, opt = {}) {
            Object.keys(opt).reduce((n, key) => {
                if (Array.isArray(opt[key])) n[key](...opt[key]);
                else n[key](opt[key]);
                return n;
            }, node);
        },

        initZoom() {
            let scaleRange = [0.2, 2];
            this.zoom = d3
                .zoom()
                .scaleExtent(scaleRange)
                .on('zoom', (e) => {
                    let zoom = e.transform;
                    this.currentScale = zoom.k;
                    this.container.attr('transform', `translate(${Number(zoom.x)},${zoom.y}) scale(${zoom.k})`);
                });

            //动画持续时间
            this.svg.call(this.zoom).on('dblclick.zoom', null);
        },
        moveToCenter(opt) {
            let _x = this.centerPosition.x;
            let _y = this.centerPosition.y;
            let xw = d3.zoomIdentity.scale(this.currentScale).translate(_x, _y);
            this.svg.call(this.zoom.transform, xw);
        }
    }
};
</script>
<style lang="scss" scoped></style>
