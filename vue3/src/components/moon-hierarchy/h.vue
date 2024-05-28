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
import { getUUID } from "./utils.js";
import { maxBy, intersection } from "lodash-es";
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
      default: "lr", //lr rl
    },
    // 子节点最大展示数，多余的出收起按钮
    limit: {
      type: Number,
      default: 3,
    },
  },
  computed: {
    nodeConfig() {
      let plusCircleWidth = (this.config.node?.plus?.attrs?.r || 6) * 2; //plus宽度
      // 当不显示plus时
      if (
        typeof this.config.node?.plus?.show == "boolean" &&
        !this.config.node?.plus?.show
      )
        plusCircleWidth = 0;
      let nodeconfig = {
        padding: (data) => {
          let value = [15, 15, 15, 15];
          if (data) {
            if (
              isNonEmptyArray(data.children) ||
              isNonEmptyArray(data._children) ||
              data._hasChildren
            ) {
              // 根节点不显示折叠图形
              if (data._sign == 1 && data.track.length > 1)
                value[1] = plusCircleWidth + value[1];
              if (data._sign == -1) value[3] = plusCircleWidth + value[3];
            }
          }
          return value;
        },
        nodeWidth: 60, //节点宽度
        nodeHeight: 16,
        separation: 1.5, //节点间距
        exShaps: [], //额外图形
        ...(this.config.node || {}),
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
          compose: {},
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
      let padding = this.setPaddingFormat(nodeconfig.padding);
      let paddingList = padding();
      nodeconfig.padding = padding;

      let fontSize = nodeconfig.text.attrs["font-size"] || 16; //字体
      nodeconfig.text.attrs["font-size"] = fontSize;

      let fontFamily = nodeconfig.text.attrs["font-family"] || null; //字体
      nodeconfig.text.attrs["font-family"] = fontFamily;

      let nodeHeight = nodeconfig.nodeHeight + paddingList[0] + paddingList[2];

      let nodeWidth = nodeconfig.nodeWidth;

      nodeconfig.plus.attrs.r = plusCircleWidth / 2;

      let separation = nodeconfig.separation;

      let nameKey = this.inner_treeOptions.name;

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
        name: "text",
        attrs: {
          "font-size": fontSize,
          transform: (d) => {
            // 字体文本实际高度
            let textH = fontSize + 4;
            return `translate(${padding(d.data)[3]},${
              (nodeHeight - textH) / 2 + fontSize
            })`;
          },
          ...nodeconfig.text.attrs,
          class: (d) => this.setShapClass(d, "text", nodeconfig),
        },
        compose: {
          text(d) {
            return d.data._isexpend === undefined
              ? d.data[nameKey]
              : d.data._isexpend === true
              ? "收起"
              : "展开";
          },
          ...nodeconfig.text.compose,
        },
        on: nodeconfig.text.on,
      };
      const plusShap = {
        name: "g",
        attrs: {
          ...nodeconfig.plus.attrs,
          class: (d) => this.setShapClass(d, "plus", nodeconfig),
          transform: (d) =>
            `translate(${
              d.data._sign == 1
                ? d.data._nodeConfig.nodeWidth -
                  padding(d.data)[1] +
                  plusCircleWidth
                : padding(d.data)[3] - plusCircleWidth
            },${nodeHeight / 2})`,
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
        padding,
        plusCircleWidth,
        nodeHeight,
        nodeSize: [nodeHeight, nodeWidth],
        separation,
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
        if (this.layout == "rl") {
          item._sign = -1;
        }
        if (this.layout == "bf") {
          // 对应的所有子节点，都视作一致
          item._sign =
            intersection(item.track, negativeIds).length > 0 ? -1 : 1;
        }
      });
      this.treeDataFactory.treeData[0]._sign = 1;
      this.setLimtNode();
    },
    setLimtNode() {
      if (this.limit > 0)
        this.treeDataFactory.flatData.forEach((item) => {
          // 没有子节点或者，最后子节点是收缩按钮
          let flag =
            !item.children ||
            typeof item.children?.[item.children.length - 1]?._isexpend ==
              "boolean";
          if (flag) return;
          let children = [];
          let _exChildren = [];

          const setLimt = (list, _sign = 1) => {
            if (
              list.length > this.limit &&
              typeof list[list.length - 1]._isexpend != "boolean"
            ) {
              let id = getUUID();
              let expendNode = {
                [this.symbolKey]: id,
                [this.inner_treeOptions.name]: "展开",
                [this.inner_treeOptions.pId]: item[this.symbolKey],
                track: [...item.track, id],
                trigger: [],
                level: item.level + 1,
                _isexpend: false,
                _sign,
              };
              item.trigger.push(id);
              this.treeDataFactory.flatData.push(expendNode);
              this.treeDataFactory.objById[id] = expendNode;

              _exChildren.push(...list.slice(this.limit));
              children.push(...list.slice(0, this.limit));
              children.push(expendNode);
            } else children.push(...list);
          };
          // 区分正负
          let p = item.children.filter((v) => v._sign == 1);
          let n = item.children.filter((v) => v._sign == -1);
          setLimt(p, 1);
          setLimt(n, -1);
          item.children = children;
          item._exChildren = _exChildren;
        });
    },
    initLayoutData() {
      this.addNodeWidthToData(this.treeDataFactory.treeData);
      this.addNodeOffset(this.treeDataFactory.treeData);
      this.setLayoutData();
    },

    onLimitNodeExpendOrFold(sourceData) {
      const symbolKey = this.symbolKey;
      // 展开隐藏节点id
      let exChildrenIds = [];
      let exChildrenNode = [];
      //点击展开收起节点
      //将lastClickNode设置为父节点。
      this.lastClickNode = this.lastClickNode.parent;
      sourceData._isexpend = !sourceData._isexpend;
      let parent =
        this.treeDataFactory.objById[this.lastClickNode.data[symbolKey]];
      // 同向的节点展开收起
      if (sourceData._isexpend) {
        // 展开,
        parent.children.splice(
          parent.children.indexOf(sourceData),
          0,
          ...parent._exChildren.filter((v) => v._sign == sourceData._sign)
        );
      } else {
        // 收起
        exChildrenIds = parent._exChildren
          .filter((v) => v._sign == sourceData._sign)
          .map((v) => v[this.symbolKey]);
        exChildrenNode = this.hierarchyLayoutData
          .descendants()
          .filter((n) => exChildrenIds.includes(n.data[symbolKey]));
        parent.children = parent.children.filter(
          (v) => !exChildrenIds.includes(v[this.symbolKey])
        );
      }
      this.drawView();
      // 找到重新计算后的node。
      const afterCalcuNode = this.hierarchyLayoutData.find(
        (n) => n.data[symbolKey] == this.lastClickNode.data[symbolKey]
      );
      // 收起
      if (!sourceData._isexpend) {
        // 若是isexpend节点，
        //收起折叠节点子节点和线
        exChildrenNode.forEach((node) => {
          this.foldLinksAndNodes(node, afterCalcuNode);
        });
        //收起折叠节点
        this.foldLinksAndNodes(this.lastClickNode, afterCalcuNode, (link) => {
          return exChildrenIds.includes(link.target.data[this.symbolKey]);
        });
      }
      this.moveToCenter({
        ...this.nodeToCenterXY(afterCalcuNode),
        d: this.duration,
      });
    },

    // 节点展开 动画
    onNodeExpendTranslate(d) {
      if (!d) d = { x: 0, y: 0, data: { _nodeConfig: { nodeWidth: 0 } } };
      if (d.data._sign == 1) return `translate(${d.y},${d.x}) scale(1)`;
      if (d.data._sign == -1) {
        return `translate(${
          -d.y - d.data._nodeConfig.nodeWidth + this.getTranslateOffset(d)
        },${d.x}) scale(1)`;
      }
    },
    // 节点收起结束位置
    onNodeFoldTranslate(d, source) {
      if (!d) {
        return `translate(${0},${this.nodeConfig.nodeHeight / 2}) scale(0)`;
      }
      //收起时，起点是子节点，终点是点击的节点
      return `translate(${
        (d.y + d.data._nodeConfig.nodeWidth - this.getTranslateOffset(source)) *
        d.data._sign
      },${d.x + this.nodeConfig.nodeHeight / 2}) scale(0)`;
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
            `translate(${this.getTranslateOffset(target)},0) scale(1)`
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
            ` translate(${this.getTranslateOffset(item.target)},0)  scale(1)`
          )
          .attr("d", () => {
            return this.setLinkPath(item);
          });
      }
    },
    setLinkPath({ source, target }) {
      let offsetY = this.nodeConfig.nodeHeight / 2;
      let x0 =
          target.data._sign * (source.y + source.data._nodeConfig.nodeWidth),
        y0 = source.x + offsetY,
        x1 = target.data._sign * target.y,
        y1 = target.x + offsetY;
      // path.attr('dataset-position', `${x0},${y0},${x1},${y1}`)
      // return `M${x0},${y0}H${(x1 - x0) / 2 + x0}V${y0 + (y1 - y0)}H${x1}`
      let insertW = x1 - x0;
      let inserH = y1 - y0;
      let nodeInsertW = target.data._sign * this.nodeConfig.nodeSize[1];
      return `M${x0},${y0}h${insertW - nodeInsertW / 2}v${inserH}h${
        nodeInsertW / 2
      }`;
    },
    // 节点坐标到画布中央，转换规则
    nodeToCenterXY(node) {
      let x = 0;
      if (node.data._sign == 1) {
        x = node.y + node.data._nodeConfig.nodeWidth / 2;
      } else {
        x =
          -node.y -
          node.data._nodeConfig.nodeWidth / 2 +
          this.hierarchyLayoutData.data._nodeConfig.nodeWidth;
      }
      return {
        x,
        y: node.x + this.nodeConfig.nodeHeight / 2,
      };
    },
    treeLayout(data) {
      let layoutData = d3
        .tree()
        .separation(() => this.nodeConfig.separation)
        .nodeSize(this.nodeConfig.nodeSize)(data);
      // 按照nodewidth进行坐标偏移，默认是上下布局。左右布局，加在y坐标上
      function modifyXY(list) {
        for (let i = 0; i < list.length; i++) {
          let item = list[i];
          item.y = item.y + item.data.offset;
          if (isNonEmptyArray(item.children)) modifyXY(item.children);
        }
      }
      modifyXY(layoutData.children || []);
      return layoutData;
    },
    // 添加节点宽度属性
    addNodeWidthToData(list) {
      for (let i = 0; i < list.length; i++) {
        let item = list[i];
        item._nodeConfig = {
          ...this.nodeConfig,
          nodeWidth: this.getNodeWidth(item),
        };
        if (isNonEmptyArray(item.children))
          this.addNodeWidthToData(item.children);
      }
    },
    // 添加节点偏移量
    addNodeOffset(treeData) {
      const findTreeSameLevelData = this.findTreeSameLevelData;
      function iterator(treeList, offset = 0) {
        for (let i = 0; i < treeList.length; i++) {
          let item = treeList[i];
          item.offset = offset;
          if (isNonEmptyArray(item.children)) {
            //  父节点中同层级中最大的nodeWidth 进行偏移
            let maxNode = maxBy(
              findTreeSameLevelData(treeData, item),
              function (o) {
                return o._nodeConfig.nodeWidth;
              }
            );
            iterator(
              item.children,
              item.offset + maxNode._nodeConfig.nodeWidth
            );
          }
        }
      }
      iterator(treeData);
    },
    //找出树数据中同层级的数据
    findTreeSameLevelData(treeList, item) {
      let arr = [];
      let level = item.level;
      let _sign = item._sign;
      function iterator(treeList, level, currentLevel) {
        for (let i = 0; i < treeList.length; i++) {
          let item = treeList[i];
          if (currentLevel == level && item._sign == _sign) {
            arr.push(item);
            continue;
          }
          if (isNonEmptyArray(item.children)) {
            iterator(item.children, level, currentLevel + 1);
          }
        }
      }
      iterator(treeList, level, 1);
      return arr;
    },

    getTranslateOffset(d) {
      if (
        d.data._sign == -1 &&
        d.data[this.symbolKey] != this.hierarchyLayoutData.data[this.symbolKey]
      )
        return this.hierarchyLayoutData.data._nodeConfig.nodeWidth;
      return 0;
    },

    getNodeWidth(item) {
      let width = this.calculateTextWidth(
        item[this.inner_treeOptions.name],
        this.nodeConfig.fontSize,
        this.nodeConfig.fontFamily
      );
      let padding = this.nodeConfig.padding(item);
      return width + padding[1] + padding[3];
    },
    setLoadingIcon(source, flag = true) {
      source._loading = flag;
      const nodeId = this.getNodeId(source[this.symbolKey]);
      const x = (d) =>
        d.data._sign == 1
          ? d.data._nodeConfig.nodeWidth
          : -this.defsNodeConfig.loadingSize;
      const y = () =>
        this.nodeConfig.nodeHeight / 2 - this.defsNodeConfig.loadingSize / 2;
      if (flag) {
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
      } else this.svg.select(`#${nodeId}`).select("use").remove();
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

      let offset = this.getTranslateOffset(d);
      // 目标节点的四个点的坐标
      let xy_node = {
        positive: {
          // 右上
          rt: [d.y + nodeWidth, d.x],
          // 左上
          lt: [d.y, d.x],
          // 右下
          rb: [d.y + nodeWidth, d.x + nodeHeight],
          // 左下
          lb: [d.y, d.x + nodeHeight],
        },
        negative: {
          // 右上
          rt: [-d.y + offset, d.x],
          // 右下
          rb: [-d.y + offset, d.x + nodeHeight],
          // 左上
          lt: [-d.y + offset - nodeWidth, d.x],
          // 左下
          lb: [-d.y + offset - nodeWidth, d.x + nodeHeight],
        },
      };

      // customview 节点的四个点的坐标
      let xy = {
        positive: {
          // 右上
          rt: [d.y + nodeWidth, d.x - height],
          // 左上
          lt: [d.y - width, d.x - height],
          // 右下
          rb: [d.y + nodeWidth, d.x + nodeHeight],
          // 左下
          lb: [d.y - width, d.x + nodeHeight],
        },
        negative: {
          // 右上
          rt: [-d.y + offset, d.x - height],
          // 右下
          rb: [-d.y + offset, d.x + nodeHeight],
          // 左上
          lt: [-d.y + offset - nodeWidth - width, d.x - height],
          // 左下
          lb: [-d.y + offset - nodeWidth - width, d.x + nodeHeight],
        },
      };

      if (d.data._sign == 1) {
        // 右下角
        transform_begin = `translate(${xy_node.positive[mapPath][0]},${xy_node.positive[mapPath][1]}) scale(0)`;
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
