<template>
  <div ref="svg">
    <div
      ref="CoustomView"
      v-show="showCustomView"
      class="moon-hierarchy-custom-view"
    >
      <slot />
    </div>
  </div>
</template>
<script>
import { intersection } from "lodash-es";
import mixins from "./mixins";
import * as d3 from "d3";
function isNonEmptyArray(arr) {
  return arr && arr.length;
}
export default {
  mixins: [mixins],
  inheritAttrs: false,
  props: {
    layout: {
      type: String,
      default: "tb", //tb bt
    },
  },
  computed: {
    nodeConfig() {
      let nodeconfig = {
        padding: 10, //间距
        nodeWidth: 168, //节点宽度
        nodeHeight: 68, //节点高度
        lineHeight: 10, //字体行距
        separation: 1.5, //节点间距
        exShaps: [], //额外图形
        ...(this.config?.node || {}),
        rect: {
          attrs: {},
          show: true,
          on: {},
          ...(this.config.node?.rect || {}),
        }, //矩形配置
        text: {
          attrs: {},
          show: true,
          on: {},
          ...(this.config.node?.text || {}),
        }, //文本配置
        plus: {
          attrs: {},
          show: true,
          on: {},
          ...(this.config.node?.plus || {}),
        }, //图表配置
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

      let fontSize = nodeconfig.text.attrs["font-size"] || 16; //字体
      nodeconfig.text.attrs["font-size"] = fontSize;

      let fontFamily = nodeconfig.text.attrs["font-family"] || null; //字体
      nodeconfig.text.attrs["font-family"] = fontFamily;

      let lineHeight = nodeconfig.text.attrs["line-height"] || 10; //字体行距
      nodeconfig.text.attrs["line-height"] = lineHeight;

      let separation = nodeconfig.separation;

      const rectShap = {
        name: "rect",
        attrs: {
          ...nodeconfig.rect.attrs,
          class: (d) => this.setShapClass(d, "rect", nodeconfig),
          height: nodeHeight,
          width: (d) => d.data._nodeConfig.nodeWidth,
        },
      };

      // 最外层的rect，用于响应点击
      const frontRectShap = {
        name: "rect",
        attrs: {
          stroke: "none",
          fill: "black",
          "fill-opacity": 0,
          "stroke-width": "0",
          height: nodeHeight,
          width: (d) => d.data._nodeConfig.nodeWidth,
        },
        on: nodeconfig.rect.on,
      };
      const textShap = {
        name: "g",
        attrs: {
          transform: (d) =>
            `translate(${nodeWidth / 2},${
              nodeHeight / 2 -
              (d.data._name[1] ? (fontSize + lineHeight) / 2 : 0) //   若有第二行则向上偏移
            })`,
        },
        on: nodeconfig.text.on,
        children: [
          {
            name: "text",
            attrs: {
              ...nodeconfig.text.attrs,
              class: (d) => this.setShapClass(d, "text", nodeconfig),
              "font-size": fontSize,
              "text-anchor": "middle",
              "dominant-baseline": "middle",
            },
            children: [
              {
                name: "tspan",
                attrs: {},
                compose: {
                  text(d) {
                    return d.data._name[0];
                  },
                },
              },
              {
                name: "tspan",
                attrs: {
                  x: 0,
                  dy: fontSize + lineHeight,
                },
                compose: {
                  text(d) {
                    return d.data._name[1];
                  },
                },
              },
            ],
          },
        ],
      };
      const plusShap = {
        name: "g",
        attrs: {
          ...nodeconfig.plus.attrs,
          class: (d) => this.setShapClass(d, "plus", nodeconfig),
          transform: (d) =>
            `translate(${d.data._nodeConfig.nodeWidth / 2},${
              (d.data._sign == 1 ? nodeHeight : 0) +
              (d.data._sign * plusCircleWidth) / 2
            })`,
        },
        on: nodeconfig.plus.on,
        children: [
          {
            name: "circle",
            attrs: {
              r: plusCircleWidth / 2,
            },
          },
          {
            name: "line",
            attrs: {
              x1: -plusCircleWidth / 4,
              y1: "0",
              x2: plusCircleWidth / 4,
              y2: "0",
            },
          },
          {
            name: "line",
            attrs: {
              x1: "0",
              y1: -plusCircleWidth / 4,
              x2: "0",
              y2: plusCircleWidth / 4,
            },
          },
        ],
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
          ...nodeconfig.exShaps,
        ],
      };
    },
  },
  methods: {
    setSign() {
      // 依据从根节点过滤出负方向的ids
      const negativeIds =
        (
          this.treeDataFactory.treeData[0].children ||
          this.treeDataFactory.treeData[0]._children
        )
          ?.filter((v) => this.negativeIds.includes(v[this.symbolKey]))
          .map((v) => v[this.symbolKey]) || [];
      this.treeDataFactory.flatData.forEach((item) => {
        item._sign = 1;
        if (this.layout == "bt") {
          item._sign = -1;
        }
        if (this.layout == "bf") {
          // 对应的所有子节点，都视作一致
          item._sign =
            intersection(item.track, negativeIds).length > 0 ? -1 : 1;
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
      if (!d) d = { x: 0, y: 0, data: { _nodeConfig: { nodeWidth: 0 } } };
      if (d.data._sign == 1)
        return `translate(${d.x - d.data._nodeConfig.nodeWidth / 2},${
          d.y
        }) scale(1)`;
      if (d.data._sign == -1) {
        return `translate(${
          d.x - d.data._nodeConfig.nodeWidth / 2
        },${-d.y}) scale(1)`;
      }
    },
    // 节点收起结束位置
    onNodeFoldTranslate(d, source) {
      // 初次渲染，起始位置
      if (!d) {
        if (source.data._sign == -1)
          return `translate(0,${this.nodeConfig.nodeHeight}) scale(0)`;
        else return `translate(0,${this.nodeConfig.nodeHeight}) scale(0)`;
      }
      //收起时，起点是子节点，终点是点击的节点
      if (source.data._sign == -1)
        return `translate(${d.x},${d.y * d.data._sign}) scale(0)`;
      else
        return `translate(${d.x},${d.y + this.nodeConfig.nodeHeight}) scale(0)`;
    },
    addLinks(links) {
      const getLinkId = this.getLinkId;
      const symbolKey = this.symbolKey;
      if (!this.linksContainer)
        this.linksContainer = this.container
          .append("g")
          .attr("class", "moon-hierarchy-links");
      let path = this.linksContainer.selectAll().data(links).join("path");

      this.setAttrByOpt(path, this.linkConifg);

      path.attr("id", ({ source, target }) =>
        getLinkId(source.data[symbolKey], target.data[symbolKey])
      );

      path
        .attr("d", (d) => {
          return this.setLinkPath(d);
        })
        .attr("transform", ({ target }) => {
          return this.onNodeFoldTranslate(this.lastClickNode, target);
        })
        .transition()
        .duration(this.duration)
        .attr(
          "transform",
          ({ target }) =>
            `translate(0,${this.getTranslateOffset(target)}) scale(1)`
        );
    },
    updateLinks(links) {
      for (let i = 0; i < links.length; i++) {
        let item = links[i];
        const id = this.getLinkId(
          item.source.data[this.symbolKey],
          item.target.data[this.symbolKey]
        );
        const path = this.svg.select(`#${id}`);
        path
          .transition()
          .duration(this.duration)
          .attr(
            "transform",
            ` translate(0,${this.getTranslateOffset(item.target)} )  scale(1)`
          )
          .attr("d", () => {
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
        x: node.x + node.data._nodeConfig.nodeWidth / 2,
        y: node.data._sign * node.y + this.nodeConfig.nodeHeight / 2,
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
        item._nodeConfig = {
          ...this.nodeConfig,
          nodeWidth: this.nodeConfig.nodeWidth,
        };
        item["_" + this.inner_treeOptions.name] = this.getFormatTextArr(item);
        if (isNonEmptyArray(item.children))
          this.addNodeWidthToData(item.children);
      }
    },

    getTranslateOffset(d) {
      if (
        d.data._sign == -1 &&
        d.data[this.symbolKey] != this.hierarchyLayoutData.data[this.symbolKey]
      )
        return this.nodeConfig.nodeHeight;
      return 0;
    },
    setLoadingIcon(source, flag = true) {
      const nodeId = this.getNodeId(source[this.symbolKey]);
      const x = (d) =>
        d.data._nodeConfig.nodeWidth / 2 - this.defsNodeConfig.loadingSize / 2;
      const y = (d) =>
        d.data._sign == 1
          ? this.nodeConfig.nodeHeight + this.nodeConfig.plusCircleWidth
          : -this.defsNodeConfig.loadingSize - this.nodeConfig.plusCircleWidth;

      if (flag) {
        source._loading = flag;
        const use = d3
          .select(`#${nodeId}`)
          .append("use")
          .attr("class", "moon-hierarchy-loading")
          .attr("xlink:href", "#loading");
        use
          .attr("x", x)
          .attr("y", y)
          .attr(
            "transform-origin",
            (d) =>
              `${x(d) + this.defsNodeConfig.loadingSize / 2} ${
                y(d) + this.defsNodeConfig.loadingSize / 2
              }`
          );
      } else {
        delete source._loading;
        this.svg.select(`#${nodeId}`).select("use").remove();
      }
    },
    // 构建无极分层
    getFormatTextArr(item, lineNum = 2, ellipse = "…") {
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
      textSplit(
        text,
        textWidth,
        this.nodeConfig.fontSize,
        this.nodeConfig.fontFamily,
        lineList
      );
      //截取
      if (lineNum && lineList.length > lineNum) {
        lineList = lineList.slice(0, lineNum);
        const str = lineList[lineNum - 1];
        for (let i = str.length; i >= 0; i--) {
          const str2 = str.slice(0, i) + ellipse;
          const tw2 = calculateTextWidth(
            str2,
            this.nodeConfig.fontSize,
            this.nodeConfig.fontFamily
          );
          if (textWidth >= tw2) {
            lineList[lineNum - 1] = str2;
            break;
          }
        }
      }
      //补全空位
      if (lineList.length < lineNum) {
        for (let i = lineList.length + 1; i <= lineNum; i++) {
          lineList.push("");
        }
      }
      return lineList;
    },
    drawCustomView(e, d, width, height, priority, duration) {
      // 不指width, height时使用全局配置
      width = width || this.config?.customView?.width || 100;
      height = height || this.config?.customView?.height || 50;
      // priority 优先出现位置
      priority = priority ||
        this.config?.customView?.priority || ["rb", "rt", "lb", "lt"];
      const svgRect = this.svg.node().getBoundingClientRect();
      const nodeId = this.getNodeId(d.data[this.symbolKey]);
      // 获取矩形元素的边界框
      const elementRect = this.svg
        .select(`#${nodeId}`)
        .node()
        .getBoundingClientRect();

      // 判断是否有足够的视图区域显示。
      let mapObjJudge = {
        rb:
          svgRect.bottom - elementRect.bottom >= height &&
          svgRect.right - elementRect.right >= width,
        rt:
          elementRect.top - svgRect.top >= height &&
          svgRect.right - elementRect.right >= width,
        lb:
          svgRect.bottom - elementRect.bottom >= height &&
          elementRect.left - svgRect.left >= width,
        lt:
          elementRect.top - svgRect.top >= height &&
          elementRect.left - svgRect.left >= width,
      };
      let mapPath = priority.find((p) => mapObjJudge[p]) || "rb";
      let transform = "";
      let transform_begin = "";
      let { nodeHeight, nodeWidth } = d.data._nodeConfig;
      // 目标节点的四个点的坐标
      let xy_node = {
        positive: {
          // 右上
          rt: [d.x + nodeWidth / 2, d.y],
          // 左上
          lt: [d.x - nodeWidth / 2, d.y],
          // 右下
          rb: [d.x + nodeWidth / 2, d.y + nodeHeight],
          // 左下
          lb: [d.x - nodeWidth / 2, d.y + nodeHeight],
        },
        negative: {
          // 右上
          rt: [d.x + nodeWidth / 2, -d.y],
          // 右下
          rb: [d.x + nodeWidth / 2, -d.y + nodeHeight],
          // 左上
          lt: [d.x - nodeWidth / 2, -d.y],
          // 左下
          lb: [d.x - nodeWidth / 2, -d.y + nodeHeight],
        },
      };

      // customview 节点的四个点的坐标
      let xy = {
        positive: {
          // 右上
          rt: [d.x + nodeWidth / 2, d.y - height],
          // 左上
          lt: [d.x - nodeWidth / 2 - width, d.y - height],
          // 右下
          rb: [d.x + nodeWidth / 2, d.y + nodeHeight],
          // 左下
          lb: [d.x - nodeWidth / 2 - width, d.y + nodeHeight],
        },
        negative: {
          // 右上
          rt: [d.x + nodeWidth / 2, -d.y - height],
          // 右下
          rb: [d.x + nodeWidth / 2, -d.y + nodeHeight],
          // 左上
          lt: [d.x - nodeWidth / 2 - width, -d.y - height],
          // 左下
          lb: [d.x - nodeWidth / 2 - width, -d.y + nodeHeight],
        },
      };

      if (d.data._sign == 1) {
        transform_begin = `translate(${xy_node.positive[mapPath][0]},${xy_node.positive[mapPath][1]}) scale(0)`;
        // 右下角
        transform = `translate(${xy.positive[mapPath][0]},${xy.positive[mapPath][1]}) scale(1)`;
      }
      if (d.data._sign == -1) {
        transform_begin = `translate(${xy_node.negative[mapPath][0]},${xy_node.negative[mapPath][1]}) scale(0)`;
        transform = `translate(${xy.negative[mapPath][0]},${xy.negative[mapPath][1]}) scale(1)`;
      }
      // 判断当前目标节点是否与上次一致，一致的话则不触发动画
      let hasChangeNode =
        d.data[this.symbolKey] !=
        this.drawCustomViewLastConfig?.d?.data?.[this.symbolKey];
      this.drawCustomViewLastConfig = {
        e,
        d,
        width,
        height,
        priority,
      };
      this.createOrUpdateForeignObject({
        width,
        height,
        transform,
        transform_begin,
        hasChangeNode,
        duration,
      });
    },
  },
};
</script>
<style lang="scss" scoped></style>
