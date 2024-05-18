<template>
    <div ref="svg"></div>
</template>
<script>
import { intersection } from 'lodash';
import mixins from './mixins';
import * as d3 from 'd3';
function isNonEmptyArray(arr) {
    return arr && arr.length;
}
export default {
    inheritAttrs: false,
    name: '',
    mixins: [mixins],
    props: {
        layout: {
            type: String,
            default: 'tb' //tb bt
        }
    },
    components: {},
    created() {},
    watch: {},
    computed: {
        nodeConfig() {
            let nodeconfig = {
                padding: 10, //间距
                nodeWidth: 168, //节点宽度
                nodeHeight: 68, //节点高度
                lineHeight: 10, //字体行距
                separation: 1.5, //节点间距
                exShaps: () => [], //额外图形
                ...(this.config?.node || {}),
                rect: { attrs: {}, show: true, on: {}, ...(this.config.node?.rect || {}) }, //矩形配置
                text: { attrs: {}, show: true, on: {}, ...(this.config.node?.text || {}) }, //文本配置
                plus: { attrs: {}, show: true, on: {}, ...(this.config.node?.plus || {}) } //图表配置
            };

            // padding格式化
            nodeconfig.padding = this.setPaddingFormat(nodeconfig.padding);

            let nodeWidth = nodeconfig.nodeWidth;
            let nodeHeight = nodeconfig.nodeHeight;

            let plusCircleWidth = 0;
            if (nodeconfig.plus.show) {
                plusCircleWidth = (nodeconfig.plus.attrs?.r || 10) * 2; //plus宽度
                nodeconfig.plus.attrs.r = plusCircleWidth / 2;
            }

            let fontSize = nodeconfig.text.attrs['font-size'] || 16; //字体
            nodeconfig.text.attrs['font-size'] = fontSize;

            let fontFamily = nodeconfig.text.attrs['font-family'] || null; //字体
            nodeconfig.text.attrs['font-family'] = fontFamily;

            let lineHeight = nodeconfig.text.attrs['line-height'] || 10; //字体行距
            nodeconfig.text.attrs['line-height'] = lineHeight;

            let separation = nodeconfig.separation;

            const rectShap = {
                name: 'rect',
                attrs: {
                    class: 'moon-hierarchy-rect',
                    stroke: 'rgb(216, 216, 216)',
                    'stroke-width': '0.5',
                    ...nodeconfig.rect,
                    height: nodeHeight,
                    width: (d) => d.data._nodeWidth
                }
            };

            // 最外层的rect，用于响应点击
            const frontRectShap = {
                name: 'rect',
                attrs: {
                    stroke: 'none',
                    fill: 'black',
                    'fill-opacity': 0,
                    'stroke-width': '0',
                    height: nodeHeight,
                    width: (d) => d.data._nodeWidth
                },
                on: nodeconfig.rect.on
            };
            const textShap = {
                name: 'g',
                attrs: {
                    transform: (d) =>
                        `translate(${nodeWidth / 2},${
                            nodeHeight / 2 - (d.data._name[1] ? (fontSize + lineHeight) / 2 : 0) //   若有第二行则向上偏移
                        })`
                },
                on: nodeconfig.text.on,
                children: [
                    {
                        name: 'text',
                        attrs: {
                            class: 'moon-hierarchy-text',
                            fill: (d) => {
                                if (d.data.track.length == 1) return '#fff';
                                else if (isNonEmptyArray(d.data.children)) return 'rgb(18, 139, 237)';
                                else return 'rgb(51, 51, 51)';
                            },
                            ...nodeconfig.text,
                            'font-size': fontSize,
                            'text-anchor': 'middle',
                            'dominant-baseline': 'middle'
                        },
                        children: [
                            {
                                name: 'tspan',
                                attrs: {},
                                compose: {
                                    text(d) {
                                        return d.data._name[0];
                                    }
                                }
                            },
                            {
                                name: 'tspan',
                                attrs: {
                                    x: 0,
                                    dy: fontSize + lineHeight
                                },
                                compose: {
                                    text(d) {
                                        return d.data._name[1];
                                    }
                                }
                            }
                        ]
                    }
                ]
            };
            const plusShap = {
                name: 'g',
                attrs: {
                    class: 'moon-hierarchy-plus',
                    stroke: 'rgb(153, 153, 153)',
                    fill: ' rgb(234, 242, 255)',
                    'stroke-width': 1,
                    ...nodeconfig.plus,
                    display: (d) => {
                        if (
                            (!isNonEmptyArray(d.data.children) && !isNonEmptyArray(d.data._children) && !d.data._hasChildren) ||
                            d.data.track.length == 1
                        ) {
                            return 'none';
                        }
                    },
                    transform: (d) =>
                        `translate(${d.data._nodeWidth / 2},${
                            (d.data._sign == 1 ? nodeHeight : 0) + (d.data._sign * plusCircleWidth) / 2
                        })`
                },
                on: nodeconfig.plus.on,
                children: [
                    {
                        name: 'circle',
                        attrs: {
                            r: plusCircleWidth / 2
                        }
                    },
                    {
                        name: 'line',
                        attrs: {
                            x1: -plusCircleWidth / 4,
                            y1: '0',
                            x2: plusCircleWidth / 4,
                            y2: '0'
                        }
                    },
                    {
                        name: 'line',
                        attrs: {
                            class: 'moon-hierarchy-plus-line2',
                            display: (d) => {
                                if (isNonEmptyArray(d.data.children)) {
                                    return 'none';
                                }
                            },
                            x1: '0',
                            y1: -plusCircleWidth / 4,
                            x2: '0',
                            y2: plusCircleWidth / 4
                        }
                    }
                ]
            };

            return {
                fontSize,
                padding: nodeconfig.padding,
                nodeHeight,
                nodeWidth,
                nodeSize: [nodeWidth, nodeHeight * 2],
                separation,
                plusCircleWidth,
                shaps: [
                    ...(nodeconfig.rect.show ? [rectShap] : []),
                    ...(nodeconfig.text.show ? [textShap] : []),
                    ...(nodeconfig.plus.show ? [plusShap] : []),
                    ...(nodeconfig.rect.show ? [frontRectShap] : []),
                    ...nodeconfig.exShaps(nodeconfig)
                ]
            };
        }
    },
    methods: {
        setSign() {
            // 依据从根节点过滤出负方向的ids
            const negativeIds =
                (this.treeDataFactory.treeData[0].children || this.treeDataFactory.treeData[0]._children)
                    ?.filter((v) => this.negativeIds.includes(v[this.symbolKey]))
                    .map((v) => v[this.symbolKey]) || [];
            this.treeDataFactory.flatData.forEach((item) => {
                item._sign = 1;
                if (this.layout == 'bt') {
                    item._sign = -1;
                }
                if (this.layout == 'bf') {
                    // 对应的所有子节点，都视作一致
                    item._sign = intersection(item.track, negativeIds).length > 0 ? -1 : 1;
                }
            });
            this.treeDataFactory.treeData[0]._sign = 1;
        },

        initLayoutData() {
            this.addNodeWidthToData(this.treeDataFactory.treeData);
            this.setLayoutData();
        },
        // 节点展开 动画
        onNodeExpendTranslate(d) {
            if (!d) d = { x: 0, y: 0, data: { _nodeWidth: 0 } };
            if (d.data._sign == 1) return `translate(${d.x - d.data._nodeWidth / 2},${d.y}) scale(1)`;
            if (d.data._sign == -1) {
                return `translate(${d.x - d.data._nodeWidth / 2},${-d.y}) scale(1)`;
            }
        },
        // 节点收起结束位置
        onNodeFoldTranslate(d, source) {
            // 初次渲染，起始位置
            if (!d) {
                if (source.data._sign == -1) return `translate(0,${this.nodeConfig.nodeHeight}) scale(0)`;
                else return `translate(0,${this.nodeConfig.nodeHeight}) scale(0)`;
            }
            //收起时，起点是子节点，终点是点击的节点
            if (source.data._sign == -1) return `translate(${d.x},${d.y * d.data._sign}) scale(0)`;
            else return `translate(${d.x},${d.y + this.nodeConfig.nodeHeight}) scale(0)`;
        },
        addLinks(links) {
            const getLinkId = this.getLinkId;
            const symbolKey = this.symbolKey;
            if (!this.linksContainer) this.linksContainer = this.container.append('g').attr('class', 'moon-hierarchy-links');
            let path = this.linksContainer.selectAll().data(links).join('path');

            this.setAttrByOpt(path, this.linkConifg);

            path.attr('id', ({ source, target }) => getLinkId(source.data[symbolKey], target.data[symbolKey]));

            path.attr('d', (d) => {
                return this.setLinkPath(d);
            })
                .attr('transform', ({ target }) => {
                    return this.onNodeFoldTranslate(this.lastClickNode, target);
                })
                .transition()
                .duration(this.duration)
                .attr('transform', ({ target }) => `translate(0,${this.getTranslateOffset(target)}) scale(1)`);
        },
        updateLinks(links) {
            for (let i = 0; i < links.length; i++) {
                let item = links[i];
                const id = this.getLinkId(item.source.data[this.symbolKey], item.target.data[this.symbolKey]);
                const path = d3.select(`#${id}`);
                path.transition()
                    .duration(this.duration)
                    .attr('transform', ` translate(0,${this.getTranslateOffset(item.target)} )  scale(1)`)
                    .attr('d', () => {
                        return this.setLinkPath(item);
                    });
            }
        },
        setLinkPath({ source, target }) {
            let x0 = source.x,
                y0 = target.data._sign * (source.y + this.nodeConfig.nodeHeight),
                x1 = target.x,
                y1 = target.data._sign * target.y;
            let insertW = x1 - x0;
            let inserH = y1 - y0;
            return `M${x0},${y0}v${inserH / 2}h${insertW}v${inserH / 2}`;
        },
        // 节点坐标到画布中央，转换规则
        nodeToCenterXY(node) {
            return {
                x: node.x + node.data._nodeWidth / 2,
                y: node.data._sign * node.y + this.nodeConfig.nodeHeight / 2
            };
        },

        treeLayout(data) {
            return d3
                .tree()
                .separation(() => this.nodeConfig.separation)
                .nodeSize(this.nodeConfig.nodeSize)(data);
        },
        // 添加节点宽度,文字属性
        addNodeWidthToData(list) {
            for (let i = 0; i < list.length; i++) {
                let item = list[i];
                item._nodeWidth = this.nodeConfig.nodeWidth;
                item['_' + this.inner_treeOptions.name] = this.getFormatTextArr(item);
                if (isNonEmptyArray(item.children)) this.addNodeWidthToData(item.children);
            }
        },

        getTranslateOffset(d) {
            if (d.data._sign == -1 && d.data[this.symbolKey] != this.treeLayoutData.data[this.symbolKey])
                return this.nodeConfig.nodeHeight;
            return 0;
        },
        setLoadingIcon(source, flag = true) {
            const nodeId = this.getNodeId(source[this.symbolKey]);
            const x = (d) => d.data._nodeWidth / 2 - this.defsNodeConfig.loadingSize / 2;
            const y = (d) =>
                d.data._sign == 1
                    ? this.nodeConfig.nodeHeight + this.nodeConfig.plusCircleWidth
                    : -this.defsNodeConfig.loadingSize - this.nodeConfig.plusCircleWidth;

            if (flag) {
                source._loading = flag;
                const use = d3
                    .select(`#${nodeId}`)
                    .append('use')
                    .attr('class', 'moon-hierarchy-loading')
                    .attr('xlink:href', '#loading');
                use.attr('x', x)
                    .attr('y', y)
                    .attr(
                        'transform-origin',
                        (d) => `${x(d) + this.defsNodeConfig.loadingSize / 2} ${y(d) + this.defsNodeConfig.loadingSize / 2}`
                    );
            } else {
                delete source._loading;
                let use = d3.select(`#${nodeId}`).select('use');
                use.remove();
            }
        },
        // 构建无极分层
        getFormatTextArr(item, lineNum = 2, ellipse = '…') {
            const text = item[this.inner_treeOptions.name];
            const padding = this.nodeConfig.padding(item);
            const textWidth = this.nodeConfig.nodeWidth - padding[1] - padding[3];
            let lineList = [];
            const calculateTextWidth = this.calculateTextWidth;
            function textSplit(text, maxWidth, fontSize, fontFamily, lineList = []) {
                for (let i = text.length; i >= 0; i--) {
                    const str = text.slice(0, i);
                    const tw = calculateTextWidth(str, fontSize, fontFamily);
                    if (maxWidth >= tw) {
                        lineList.push(str);
                        let nextStr = text.slice(i);
                        if (nextStr) {
                            textSplit(nextStr, maxWidth, fontSize, fontFamily, lineList);
                        }
                        break;
                    }
                }
            }
            textSplit(text, textWidth, this.nodeConfig.fontSize, this.nodeConfig.fontFamily, lineList);
            //截取
            if (lineNum && lineList.length > lineNum) {
                lineList = lineList.slice(0, lineNum);
                const str = lineList[lineNum - 1];
                for (let i = str.length; i >= 0; i--) {
                    const str2 = str.slice(0, i) + ellipse;
                    const tw2 = calculateTextWidth(str2, this.nodeConfig.fontSize, this.nodeConfig.fontFamily);
                    if (textWidth >= tw2) {
                        lineList[lineNum - 1] = str2;
                        break;
                    }
                }
            }
            //补全空位
            if (lineList.length < lineNum) {
                for (let i = lineList.length + 1; i <= lineNum; i++) {
                    lineList.push('');
                }
            }
            return lineList;
        }
    }
};
</script>
<style lang="scss" scoped></style>
