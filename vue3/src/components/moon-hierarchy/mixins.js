import * as d3 from 'd3';
import { flatToTree, arrayRemoveItem } from './utils.js';
function isNonEmptyArray(arr) {
  return arr && arr.length;
}
export default {
  props: {
    width: {
      type: Number,
      default: 1366,
    },
    height: {
      type: Number,
      default: 768,
    },
    treeData: {
      type: Array,
      default: () => [],
    },
    treeOptions: {
      type: Object,
      default: () => ({}),
    },
    defaultOpenLevel: {
      type: Number,
      default: 2,
    },
    duration: {
      type: Number,
      default: 400,
    },
    //蝴蝶模型，指定负向数据对应的id 必须是根节点的直接子节点
    negativeIds: {
      type: Array,
      default: () => [],
    },
    config: {
      type: Object,
      default: () => ({}),
    },
    canExpendFold: {
      type: [Boolean, Function],
      default: true,
    },
    expendShape: {
      type: String,
    },
    foldShape: {
      type: String,
    },
  },
  mounted() {
    this.currentScale = this.config?.zoom?.defaultScale || 1;
    this.drawSvg();
    this.$watch(
      () => [this.treeData, this.layout],
      () => {
        if (isNonEmptyArray(this.treeData)) this.drawContainer();
      },
      {
        deep: true,
        immediate: true,
      },
    );
  },
  data() {
    return {
      svg: null,
      zoom: null,
      container: null,
      hierarchyLayoutData: null,
      lastClickNode: null,
      nodesContainer: null,
      linksContainer: null,
      currentScale: 1,
      treeDataFactory: { treeData: [], leafs: [], objById: {}, flatData: [] },
      exceptListener: ['click', 'clickFetchChildren', 'mouseover', 'mouseout'],
      showCustomView: false,
      InnerChangeTreeData: false, //为true时，下次更新不触发重绘
    };
  },
  computed: {
    nodeListener() {
      return this.config?.node?.on || {};
    },
    symbolKey() {
      return this.inner_treeOptions.id;
    },
    inner_treeOptions() {
      return {
        id: 'id',
        pId: 'pId',
        name: 'name',
        ...this.treeOptions,
      };
    },
    centerPosition() {
      return { x: this.width / 2, y: this.height / 2 };
    },
    linkConifg() {
      return {
        fill: 'none',
        ...(this.config?.link || {}),
        class: 'moon-hierarchy-link',
        'marker-end': this.config?.arrow?.show === false ? 'none' : 'url(#moon-hierarchy-arrow)',
      };
    },
    defsNodeConfig() {
      const loadingSize = 16;
      return {
        loadingSize,
        nodeList: [
          {
            name: 'marker',
            attrs: {
              viewBox: '0 0 10 10',
              refX: '10',
              refY: '5',
              markerWidth: '6',
              markerHeight: '6',
              orient: 'auto-start-reverse',
              ...(this.config.arrow?.attrs || {}),
              id: 'moon-hierarchy-arrow',
              class: 'moon-hierarchy-arrow',
            },
            children: [
              {
                name: 'path',
                attrs: {
                  d: this.config.arrow?.path || 'M 0 0 L 10 5 L 0 10 z',
                },
              },
            ],
          },
          {
            name: 'symbol',
            attrs: {
              viewBox: '0 0 1024 1024',
              width: '16',
              height: '16',
              id: 'loading',
            },
            children: [
              {
                name: 'path',
                attrs: {
                  d: 'M475.428571 97.52381h73.142858v219.428571h-73.142858z m0 609.523809h73.142858v219.428571h-73.142858zM926.47619 475.428571v73.142858h-219.428571v-73.142858z m-609.523809 0v73.142858H97.52381v-73.142858zM779.215238 193.072762l51.712 51.687619-155.136 155.184762-51.736381-51.736381zM348.208762 624.054857l51.736381 51.736381-155.160381 155.136-51.712-51.687619zM193.097143 244.784762l51.687619-51.712 155.184762 155.136-51.736381 51.736381z m430.982095 431.006476l51.736381-51.736381 155.136 155.160381-51.687619 51.712z',
                },
              },
            ],
          },
        ],
      };
    },
  },
  methods: {
    // 格式化数据
    formatToArray(target) {
      if (target) {
        if (Array.isArray(target)) return target;
        else return [target];
      } else return [];
    },
    initTreeData() {
      this.treeDataFactory = flatToTree(this.treeData, this.inner_treeOptions.id, this.inner_treeOptions.pId);

      // 移除treeDataFactory.flatData,treeDataFactory.objById中的所有非root子节点的数据
      let removedId = [];
      if (this.treeDataFactory.treeData.length > 1) {
        this.treeDataFactory.treeData.slice(1).forEach((item) => {
          removedId.push(item[this.symbolKey], ...item.trigger);
        });
      }
      arrayRemoveItem(this.treeDataFactory.flatData, (item) => {
        return removedId.includes(item[this.symbolKey]);
      });
      removedId.forEach((id) => {
        delete this.treeDataFactory.objById[id];
      });
      this.setSign();
    },
    createSvg() {
      this.svg = d3.create('svg').attr('class', 'moon-hierarchy-svg').attr('width', this.width).attr('height', this.height).attr('cursor', 'move');
    },
    createContainDom() {
      this.container = this.svg
        .append('g')
        .attr('class', 'moon-hierarchy-container')
        .attr('font-family', 'sans-serif')
        .attr('transform', `translate(${this.width / 2},${this.height / 2}) scale(1)`);
    },
    drawSvg() {
      this.$watch(
        () => [this.width, this.height],
        () => {
          if (this.svg) {
            this.svg.attr('width', this.width).attr('height', this.height);
            if (this.treeData?.length && this.treeLayout) this.moveToCenter();
          } else this.createSvg();
        },
        {
          deep: true,
          immediate: true,
        },
      );
      this.addDefs();
      // 挂载
      this.$refs.svg.append(this.svg.node());
    },
    drawContainer() {
      if (this.InnerChangeTreeData) {
        this.InnerChangeTreeData = false;
        return;
      }
      // reset
      this.container && this.container.remove();
      Object.assign(this.$data, this.$options.data(), { svg: this.svg });

      this.createContainDom();
      this.initTreeData();
      this.defaultExpendLevel();
      this.drawView();
      this.initZoom();
      this.moveToCenter();
      this.$emit('draw-done', {
        svg: this.svg,
        container: this.container,
      });
    },

    defaultExpendLevel() {
      if (this.defaultOpenLevel > 0)
        this.treeDataFactory.flatData.forEach((item) => {
          if (item.level >= this.defaultOpenLevel) {
            item._children = item.children;
            item.children = null;
          }
        });
    },
    setLayoutData() {
      let root = this.treeDataFactory.treeData[0];
      this.hierarchyLayoutData = this.treeLayout(d3.hierarchy(root));
      // 蝴蝶模型，左边右边单独计算
      if (this.layout == 'bf' && root.children) {
        let positive = root.children.filter((v) => v._sign == 1);
        let negative = root.children.filter((v) => v._sign == -1);
        let _positive = this.treeLayout(d3.hierarchy({ ...root, children: positive }));
        let _negative = this.treeLayout(d3.hierarchy({ ...root, children: negative }));

        this.hierarchyLayoutData.children = [...(_positive?.children || []), ...(_negative?.children || [])];
      }
    },
    setNodeClassAttr(selectionNode) {
      const customNodeAttrs = this.config.node?.attrs || {};
      selectionNode.attr('class', function (d) {
        const currentClass = d3.select(this).attr('class') || '';
        const classList = currentClass.split(' ');
        classList.push('moon-hierarchy-node');
        if (d.data.track.length == 1) classList.push('moon-hierarchy-node-root');
        if (typeof d.data._isexpend == 'boolean') classList.push('moon-hierarchy-node-limit-button');
        if (isNonEmptyArray(d.data.children)) classList.push('moon-hierarchy-node-expend');
        else arrayRemoveItem(classList, (item) => item == 'moon-hierarchy-node-expend');
        if (isNonEmptyArray(d.data.children) || isNonEmptyArray(d.data._children) || d.data._hasChildren) classList.push('moon-hierarchy-node-haschildren');
        let classContent = customNodeAttrs.class;
        if (classContent) {
          if (typeof classContent == 'function') {
            classList.push(classContent(d) || '');
          }
          if (typeof classContent == 'string') return classList.push(classContent);
        }
        return [...new Set(classList)].join(' ');
      });
    },
    setNodeDefaultAttr(selectionNode) {
      const getNodeId = this.getNodeId;
      const symbolKey = this.symbolKey;
      const lastClickNode = this.lastClickNode;
      const customNodeAttrs = this.config.node?.attrs || {};
      // 默认节点属性
      const nodeDefaultAttrs = {
        cursor: 'pointer',
        ...customNodeAttrs,
        id: (d) => getNodeId(d.data[symbolKey]),
        transform: (d) => {
          // 初始位置
          return this.onNodeFoldTranslate(lastClickNode, d);
        },
      };
      // 设置节点属性
      Object.keys(nodeDefaultAttrs).reduce((_, attr) => {
        return _.attr(attr, nodeDefaultAttrs[attr]);
      }, selectionNode);

      this.setNodeClassAttr(selectionNode);
    },
    addNode(nodeList) {
      if (!this.nodesContainer) this.nodesContainer = this.container.append('g').attr('stroke-linejoin', 'round').attr('stroke-width', 3).attr('class', 'moon-hierarchy-nodes');
      const selectionNode = this.nodesContainer
        .selectAll()
        .data(nodeList)
        .join('g')
        .on('click', (_, d) => {
          _.stopPropagation();
          this.onNodeClick(d);
          // 展开按钮不出外部设置事件
          if (typeof d.data._isexpend == 'boolean') return;

          const id = this.getNodeId(d.data[this.symbolKey]);
          const node = this.svg.select(`#${id}`);
          this.nodeListener['click']?.(_, d, node, this.svg);
        })
        .on('mouseover', (_, d) => {
          // 展开按钮不出外部设置事件
          if (typeof d.data._isexpend == 'boolean') return;

          this.onNodeMouseOver(d);
          const id = this.getNodeId(d.data[this.symbolKey]);
          const node = this.svg.select(`#${id}`);
          this.nodeListener['mouseover']?.(_, d, node, this.svg);
        })
        .on('mouseout', (_, d) => {
          // 展开按钮不出外部设置事件
          if (typeof d.data._isexpend == 'boolean') return;

          this.onNodeMouseOut(d);
          const id = this.getNodeId(d.data[this.symbolKey]);
          const node = this.svg.select(`#${id}`);
          this.nodeListener['mouseout']?.(_, d, node, this.svg);
        });
      //自定义属性，除了id与transform
      this.setNodeDefaultAttr(selectionNode);
      this.addListener(selectionNode, this.nodeListener, this.exceptListener);
      selectionNode
        .transition()
        .duration(this.duration)
        .attr('transform', (d) => {
          // 结束位置
          return this.onNodeExpendTranslate(d);
        });
      this.iteratorAddNode(selectionNode, this.nodeConfig.shaps);
      this.addShapEexpendFold(selectionNode);
    },
    updateNodeByData(dataList) {
      dataList = this.formatToArray(dataList);
      // 不更新的属性项
      let exAttrs = [this.inner_treeOptions.id, this.inner_treeOptions.pId, 'children', 'level', 'track', 'trigger'];

      dataList.forEach((data) => {
        let old = this.treeDataFactory.objById[data[this.symbolKey]];
        if (!old) {
          throw `moon-hierarchy组件：画布中没有匹配到${this.symbolKey}=${data[this.symbolKey]}的节点`;
        }
        let backup = Object.keys(old).reduce((obj, key) => {
          if (exAttrs.includes(key) || key.startsWith('_')) obj[key] = old[key];
          return obj;
        }, {});
        Object.assign(old, data, backup);

        // 内部修改数据不触发重绘,
        this.InnerChangeTreeData = true;
        let sourceData = this.treeData.find((v) => v[this.symbolKey] == data[this.symbolKey]);
        Object.keys(sourceData).forEach((key) => {
          sourceData[key] = old[key];
        });
      });
      this.drawView();
    },
    updateNode(nodeList) {
      for (let i = 0; i < nodeList.length; i++) {
        let node = nodeList[i];
        const id = this.getNodeId(node.data[this.symbolKey]);
        const selectionNode = this.svg.select(`#${id}`);
        this.addListener(selectionNode, this.nodeListener, this.exceptListener, node);
        selectionNode
          .on('click', (_) => {
            _.stopPropagation();
            this.onNodeClick(node);
            // 展开按钮不出外部设置事件
            if (typeof node.data._isexpend == 'boolean') return;
            this.nodeListener['click']?.(_, node, selectionNode, this.svg);
          })
          .on('mouseover', (_) => {
            if (typeof node.data._isexpend == 'boolean') return;

            this.onNodeMouseOver(node);
            this.nodeListener['mouseover']?.(_, node, selectionNode, this.svg);
          })
          .on('mouseout', (_) => {
            if (typeof node.data._isexpend == 'boolean') return;

            this.onNodeMouseOut(node);
            this.nodeListener['mouseout']?.(_, node, selectionNode, this.svg);
          })
          .transition()
          .duration(this.duration)
          .attr('transform', () => {
            // 结束位置
            return this.onNodeExpendTranslate(node);
          });
        // 移除所有形状
        selectionNode.selectAll('*').remove();
        this.setNodeClassAttr(selectionNode);
        // 重新添加形状
        this.iteratorAddNode(selectionNode, this.nodeConfig.shaps);
        this.addShapEexpendFold(selectionNode, node);
      }
    },
    removeNode(targetNodeId, redraw = true, canRemoveExpendNode = false) {
      if (!targetNodeId) throw `moon-hierarchy组件：请传入目标节点数据中${this.symbolKey}的值`;

      let rootId = this.hierarchyLayoutData.data[this.symbolKey];
      if (targetNodeId == rootId) {
        throw `moon-hierarchy组件：根节点不能删除`;
      }
      const sourceData = this.treeDataFactory.objById[targetNodeId];
      if (!sourceData) {
        throw `moon-hierarchy组件：画布中没有匹配到${this.symbolKey}=${targetNodeId}的节点`;
      }

      if (typeof sourceData._isexpend == 'boolean' && !canRemoveExpendNode) {
        throw `moon-hierarchy组件：展开/收起节点不能手动删除！`;
      }

      let toRemoveId = [...sourceData.trigger, targetNodeId];
      for (let i = 0; i < toRemoveId.length; i++) {
        let n = this.treeDataFactory.objById[toRemoveId[i]];
        this.svg.select(`#${this.getNodeId(n[this.symbolKey])}`).remove();
        const id = this.getLinkId(n[this.inner_treeOptions.pId], n[this.symbolKey]);
        this.svg.select(`#${id}`).remove();
      }

      // 处理父节点
      let parentNode = this.treeDataFactory.objById[sourceData[this.inner_treeOptions.pId]];
      if (parentNode) {
        // 从父节点中_exChildren中移除
        if (parentNode._exChildren) {
          let index = parentNode._exChildren.findIndex((v) => v[this.symbolKey] == targetNodeId);
          if (index >= 0) parentNode._exChildren.splice(index, 1);
        }
        // 从父节点中children,_children中移除
        const pChildren = (childrenName) => {
          let arr = parentNode[childrenName];
          if (arr) {
            // 移除当前节点
            arr.splice(
              arr.findIndex((v) => v[this.symbolKey] == targetNodeId),
              1,
            );
            // 判断是否需要移除展开按钮节点,
            if (this.limit > 0 && parentNode._exChildren) {
              // 判断当前展示项是否小于限定数，若小于，则需要从折叠项中提取差量项插入
              let _sameList = parentNode._exChildren.filter((v) => v._sign == sourceData._sign);
              let sameList = arr.filter((v) => v._sign == sourceData._sign && typeof v._isexpend != 'boolean');
              if (sameList.length < this.limit) {
                let insert = _sameList.slice(0, this.limit - sameList.length);
                let expendNodeIndex = arr.findIndex((v) => typeof v._isexpend == 'boolean' && v._sign == sourceData._sign);
                arr.splice(expendNodeIndex, 0, ...insert);
                arrayRemoveItem(parentNode._exChildren, (item) => {
                  return insert.find((v) => v[this.symbolKey] == item[this.symbolKey]);
                });
              }

              // 判断是否需要移除展开按钮节点,
              // 找到同向的节点，
              _sameList = parentNode._exChildren.filter((v) => v._sign == sourceData._sign);
              sameList = arr.filter((v) => v._sign == sourceData._sign && typeof v._isexpend != 'boolean');
              if (sameList.length + _sameList.length <= this.limit) {
                //  移除展开节点
                let expendNode = arr.find((v) => typeof v._isexpend == 'boolean' && v._sign == sourceData._sign);
                if (expendNode) this.removeNode(expendNode[this.symbolKey], false, true);
              }
            }
          }
        };
        pChildren('children');
        pChildren('_children');
      }

      // 移除treeDataFactory中所有节点 以及所有子节点
      arrayRemoveItem(this.treeDataFactory.flatData, (item) => {
        return [...sourceData.trigger, targetNodeId].includes(item[this.symbolKey]);
      });
      [...sourceData.trigger, targetNodeId].forEach((id) => {
        delete this.treeDataFactory.objById[id];
      });

      // 所有的父节点trigger中都需要移除对应的id
      parentNode.track.map((id) => {
        arrayRemoveItem(this.treeDataFactory.objById[id].trigger, (_id) => {
          return [...sourceData.trigger, targetNodeId].includes(_id);
        });
      });

      // 内部修改数据不触发重绘
      this.InnerChangeTreeData = true;
      arrayRemoveItem(this.treeData, (item) => {
        return [...sourceData.trigger, targetNodeId].includes(item[this.symbolKey]);
      });

      if (redraw) this.drawView();
    },
    removeNodeById(ids) {
      ids = this.formatToArray(ids);
      ids.forEach((id) => {
        this.removeNode(id, false);
      });
      this.drawView();
    },

    addShapEexpendFold(selectionNode, qt) {
      if (this.expendShape != this.foldShape) {
        if (this.expendShape) {
          selectionNode.select(this.expendShape).on('click.customEvent', (e, d) => {
            e.stopPropagation();
            this.onNodeExpendOrFold(qt || d, true);
          });
        }
        if (this.foldShape) {
          selectionNode.select(this.foldShape).on('click.customEvent', (e, d) => {
            e.stopPropagation();
            this.onNodeExpendOrFold(qt || d, false);
          });
        }
      } else {
        if (this.expendShape) {
          selectionNode.select(this.expendShape).on('click.customEvent', (e, d) => {
            e.stopPropagation();
            const id = qt ? qt.data[this.symbolKey] : d.data[this.symbolKey];
            const sourceData = this.treeDataFactory.objById[id];
            this.onNodeExpendOrFold(qt || d, !isNonEmptyArray(sourceData.children));
          });
        }
      }
    },
    addListener(selectionNode, listener = {}, except = [], qd) {
      Object.keys(listener).forEach((key) => {
        if (!except.includes(key)) {
          let svg = this.svg;
          // selectionNode可能是一个数组
          selectionNode.on(key, function (e, d) {
            if (qd) d = qd;
            // 展开收起按钮节点不绑定自定义节点事件
            if (typeof d.data._isexpend == 'boolean') return;
            // 此处的this即为当前的selection对象
            listener[key](e, d, this, svg);
          });
        }
      });
    },
    addOrUpdateNode() {
      const nodeList = this.hierarchyLayoutData.descendants();
      let addList = [];
      let updateList = [];
      for (let i = 0; i < nodeList.length; i++) {
        let item = nodeList[i];
        const id = this.getNodeId(item.data[this.symbolKey]);
        const selectionNode = this.svg.select(`#${id}`);
        if (selectionNode.node()) {
          updateList.push(item);
        } else {
          addList.push(item);
        }
      }
      this.addNode(addList);
      this.updateNode(updateList);
    },
    async onNodeClick(d) {
      this.lastClickNode = d;
      const symbolKey = this.symbolKey;
      const sourceData = this.treeDataFactory.objById[this.lastClickNode.data[symbolKey]];
      if (isNonEmptyArray(sourceData.children)) {
        if (!this.foldShape) this.onNodeExpendOrFold(d, false);
      } else if (!this.expendShape) this.onNodeExpendOrFold(d, true);
      //点击展开收起节点
      if (typeof sourceData._isexpend === 'boolean') {
        this.onLimitNodeExpendOrFold && this.onLimitNodeExpendOrFold(sourceData);
      }
    },
    async onNodeExpendOrFold(node, expend = false) {
      if (typeof this.canExpendFold == 'boolean' && !this.canExpendFold) return;
      if (typeof this.canExpendFold == 'function' && !this.canExpendFold(sourceData)) return;

      const symbolKey = this.symbolKey;
      this.lastClickNode = node;
      const sourceData = this.treeDataFactory.objById[this.lastClickNode.data[symbolKey]];

      if (expend) {
        // 展开
        if (isNonEmptyArray(sourceData._children)) {
          sourceData.children = sourceData._children;
          sourceData._children = undefined;
        } else {
          if (sourceData._hasChildren) {
            await this.onClickFetchChildren(sourceData);
            // 动态新增的节点，从新计算限制值
            this.setLimtNode && this.setLimtNode();
          }
        }
      }
      // 收起
      else if (isNonEmptyArray(sourceData.children)) {
        sourceData._children = sourceData.children;
        sourceData.children = undefined;
      }
      //点击展开收起节点
      this.drawView();

      // _children有值时为收起
      let isFold = isNonEmptyArray(sourceData._children);
      // 找到重新计算后的node。
      const afterCalcuNode = this.hierarchyLayoutData.find((n) => n.data[symbolKey] == this.lastClickNode.data[symbolKey]);
      // 收起
      if (isFold) {
        this.foldLinksAndNodes(this.lastClickNode, afterCalcuNode);
      }
      this.moveToCenter({
        ...this.nodeToCenterXY(afterCalcuNode),
        d: this.duration,
      });
    },
    onNodeMouseOver(node) {
      node.links().forEach((link) => {
        const id = this.getLinkId(link.source.data[this.symbolKey], link.target.data[this.symbolKey]);
        this.svg.select(`#${id}`).classed('moon-hierarchy-node-hover-link', true);
      });
    },
    onNodeMouseOut(node) {
      node.links().forEach((link) => {
        const id = this.getLinkId(link.source.data[this.symbolKey], link.target.data[this.symbolKey]);
        let line = this.svg.select(`#${id}`);
        // 获取虚线的总长度
        line.classed('moon-hierarchy-node-hover-link', false); // 过渡的持续时间，单位毫秒
      });
    },
    // 向目标节点添加子节点，childrenList是一个扁平化的树数据
    addNodeToTargetNode(targetNodeId, childrenList, _sign) {
      if (!targetNodeId) throw `moon-hierarchy组件：请传入目标节点数据中${this.symbolKey}的值`;
      const sourceData = this.treeDataFactory.objById[targetNodeId];
      if (!sourceData) {
        throw `moon-hierarchy组件：画布中没有匹配到${this.symbolKey}=${targetNodeId}的节点`;
      }
      if (typeof sourceData._isexpend == 'boolean') {
        throw '展开/收起节点不能新增子节点！';
      }
      // 若目标节点时根节点，
      // 蝴蝶布局，可以传入第3个参数，控制新增的节点的方向。否则与当前节点方向一致
      // 下-上，右-左布局，_sign设置为-1，其他情况设置为1
      let root = this.treeDataFactory.treeData[0];
      if (targetNodeId == root[this.symbolKey]) {
        if (this.layout == 'bf' && [-1, 1].includes(_sign)) _sign = _sign || sourceData._sign;
        else if (this.layout == 'bt' || this.layout == 'rl') _sign = -1;
        else _sign = 1;
      } else _sign = sourceData._sign;

      // 获取当前布局节点，
      let node = this.hierarchyLayoutData.find((item) => item.data[this.symbolKey] == targetNodeId);
      // 设置新增节点动画的起点
      this.lastClickNode = node;
      // 不是数组时构造一个数组
      childrenList = this.formatToArray(childrenList);
      if (childrenList.length) {
        // 所有的父节点trigger中都需要添加新增的字节id
        sourceData.track.map((id) => {
          this.treeDataFactory.objById[id].trigger.push(...childrenList.map((v) => v[this.symbolKey]));
        });

        let list = childrenList.map((v) => {
          v._sign = _sign;
          v[this.inner_treeOptions.pId] = sourceData[this.symbolKey];
          return v;
        });
        // 判断列表是否有当前数据
        let rootIndex = list.findIndex((v) => v[this.symbolKey] == sourceData[this.symbolKey]);
        //有则移除
        if (rootIndex != -1) list.splice(rootIndex, 1);
        // 重新拷贝一份当前数据，清空里面的children，用做后面重新构建一个树结构数据。
        const copySourceData = { ...sourceData };
        copySourceData.children = [];
        list.push(copySourceData);
        // 重新构建一个树结构数据。
        let { objById, flatData } = flatToTree(list, this.symbolKey, this.inner_treeOptions.pId);

        let sutTree = objById[sourceData[this.symbolKey]].children;
        if (sourceData._exChildren?.length) {
          let children = sourceData.children || sourceData._children;
          // 展开节点
          let lastExpendNodeIndex = children.findIndex((v) => typeof v._isexpend == 'boolean' && v._sign == _sign);
          let lastExpendNode = children[lastExpendNodeIndex];
          sourceData._exChildren.push(...sutTree);
          // 若处于展开状态，也要添加在children中,插入到展开按钮前
          if (lastExpendNode?._isexpend) {
            sourceData.children.splice(lastExpendNodeIndex, 0, ...sutTree);
          }
          // 展开限制隐藏的项
          if (!lastExpendNode._isexpend) {
            lastExpendNode._isexpend = true;
            children.splice(children.indexOf(lastExpendNode), 0, ...node.data._exChildren.filter((v) => v._sign == lastExpendNode._sign));
          }
        } else {
          if (sourceData.children) {
            sourceData.children.push(...sutTree);
          } else if (sourceData._children) {
            sourceData._children.push(...sutTree);
          } else sourceData.children = sutTree;
        }
        // 将新数据插入treeDataFactory中
        flatData
          .filter((v) => v[this.symbolKey] != sourceData[this.symbolKey])
          .forEach((v) => {
            let id = v[this.symbolKey];
            this.treeDataFactory.objById[id] = v;
            this.treeDataFactory.flatData.push(v);
          });
      }
      this.onNodeExpendOrFold(node, true);
      // 内部修改数据不触发重绘
      this.InnerChangeTreeData = true;
      this.treeData.push(...childrenList);
    },
    async onClickFetchChildren(sourceData) {
      if (sourceData._hasChildren && !sourceData._loading) {
        try {
          this.setLoadingIcon(sourceData);
          let childrenList = await this.nodeListener['clickFetchChildren']?.(sourceData, this.svg.select(`#${this.getNodeId(sourceData[this.symbolKey])}`), this.svg);
          childrenList = this.formatToArray(childrenList);
          if (childrenList.length) {
            // 所有的父节点trigger中都需要添加新增的字节id
            sourceData.track.map((id) => {
              this.treeDataFactory.objById[id].trigger.push(...childrenList.map((v) => v[this.symbolKey]));
            });

            let list = childrenList.map((v) => {
              v._sign = sourceData._sign;
              // 没有设置pid的自动设置当前的pid
              if (!v[this.inner_treeOptions.pId]) v[this.inner_treeOptions.pId] = sourceData[this.symbolKey];
              return v;
            });
            // 判断是否有当前数据的列表
            let rootIndex = list.findIndex((v) => v[this.symbolKey] == sourceData[this.symbolKey]);
            //有则移除
            if (rootIndex != -1) list.splice(rootIndex, 1);

            list.push(sourceData);
            let { objById, flatData } = flatToTree(list, this.symbolKey, this.inner_treeOptions.pId);
            sourceData.children = objById[sourceData[this.symbolKey]].children;
            // 将新数据插入treeDataFactory中
            flatData
              .filter((v) => v[this.symbolKey] != sourceData[this.symbolKey])
              .forEach((v) => {
                let id = v[this.symbolKey];
                this.treeDataFactory.objById[id] = v;
                this.treeDataFactory.flatData.push(v);
              });
          }
          this.setLoadingIcon(sourceData, false);
        } catch (error) {
          this.setLoadingIcon(sourceData, false);
          throw error;
        }
      }
    },
    addOrUpdateLinks() {
      const links = this.hierarchyLayoutData.links();
      let addList = [];
      let updateList = [];
      for (let i = 0; i < links.length; i++) {
        let item = links[i];
        const id = this.getLinkId(item.source.data[this.symbolKey], item.target.data[this.symbolKey]);
        const selectionNode = this.svg.select(`#${id}`);
        if (selectionNode.node()) {
          updateList.push(item);
        } else {
          addList.push(item);
        }
      }
      this.addLinks(addList);
      this.updateLinks(updateList);
    },
    //收起节点对应的所有子节点和线
    foldLinksAndNodes(node, newNode, filter) {
      const getLinkId = this.getLinkId;
      const getNodeId = this.getNodeId;
      const symbolKey = this.symbolKey;
      node.links().forEach((link) => {
        // 过滤link
        if (typeof filter == 'function' && !filter(link)) {
          return;
        }

        const nodeId = getNodeId(link.target.data[symbolKey]);
        const selectionNode = this.svg.select(`#${nodeId}`);
        selectionNode
          .transition()
          .duration(this.duration)
          .attr('transform', () => {
            return this.onNodeFoldTranslate(newNode, link.target);
          });

        const linkId = getLinkId(link.source.data[symbolKey], link.target.data[symbolKey]);
        // 折叠连线后，将路径置空
        const selectionLink = this.svg.select(`#${linkId}`);
        selectionLink
          .transition()
          .duration(this.duration)
          .attr('transform', () => {
            return this.onNodeFoldTranslate(newNode, link.target);
          })
          .on('end', () => {
            selectionLink.attr('d', null);
          });
      });
    },
    drawView() {
      this.initLayoutData();
      this.addOrUpdateLinks();
      this.addOrUpdateNode();
      this.updateCustomView();
    },
    addDefs() {
      const defs = this.svg.append('defs');
      this.iteratorAddNode(defs, this.defsNodeConfig.nodeList);
    },
    iteratorAddNode(selectionNode, nodeConfigList) {
      nodeConfigList.forEach((shap) => {
        const selectionShap = selectionNode.append(shap.name);
        this.setAttrByOpt(selectionShap, shap.attrs);
        this.setComposeOpt(selectionShap, shap.compose);
        this.addListener(selectionShap, shap.on);
        if (shap.children) this.iteratorAddNode(selectionShap, shap.children);
      });
    },
    moveToCenter(opt) {
      if (!opt) {
        let rootNode = this.hierarchyLayoutData;
        opt = {
          ...this.nodeToCenterXY(rootNode),
          d: this.duration,
        };
      }
      let { x, y, d } = opt;
      const inverseScale = 1 / this.currentScale;
      let _x = this.centerPosition.x * inverseScale - x;
      let _y = this.centerPosition.y * inverseScale - y;
      let xw = d3.zoomIdentity.scale(this.currentScale).translate(_x, _y);
      xw.d = d; //duration
      this.svg.call(this.zoom.transform, xw);
    },
    initZoom() {
      let scaleRange = this.config?.zoom?.scaleRange || [0.2, 2];
      let zoomEvent = (e) => {
        if (this.config?.zoom?.callback) {
          this.config?.zoom?.callback(e);
        }
        let zoom = e.transform;
        this.currentScale = zoom.k;
        this.container
          .transition()
          .duration(zoom.d)
          .attr('transform', `translate(${Number(zoom.x)},${zoom.y}) scale(${zoom.k})`);
      };
      this.zoom = d3.zoom().scaleExtent(scaleRange).on('zoom', zoomEvent);
      this.zoom.zoomEvent = zoomEvent;
      this.zoom.scaleRange = scaleRange;
      //禁止双击缩放
      this.svg.call(this.zoom).on('dblclick.zoom', null);
    },
    pauseZoom() {
      this.zoom.scaleExtent([this.currentScale, this.currentScale]);
    },
    continueZoom() {
      this.zoom.scaleExtent(this.zoom.scaleRange);
    },
    // 手动缩放
    scale(scale) {
      if (typeof scale === 'number') {
        this.currentScale = this.currentScale * Math.abs(scale);
        let scaleRange = this.config?.zoom?.scaleRange || [0.2, 2];
        if (this.currentScale < scaleRange[0]) this.currentScale = scaleRange[0];
        if (this.currentScale > scaleRange[1]) this.currentScale = scaleRange[1];
        this.moveToCenter();
      } else throw '缩放参数必须数字';
    },
    setAttrByOpt(selectionNode, opt = {}) {
      Object.keys(opt).map((key) => {
        selectionNode.attr(key, opt[key]);
      });
    },
    setComposeOpt(selectionNode, opt = {}) {
      Object.keys(opt).reduce((n, key) => {
        if (Array.isArray(opt[key])) n[key](...opt[key]);
        else n[key](opt[key]);
        return n;
      }, selectionNode);
    },
    getNodeById(id) {
      return { data: this.treeDataFactory.objById[id], el: this.svg.select(`#${this.getNodeId(id)}`) };
    },
    getAllNode() {
      const idList = Object.keys(this.treeDataFactory.objById);
      const nodeList = [];
      for (let i = 0; i < idList.length; i++) {
        const id = idList[i];
        let data = this.treeDataFactory.objById[id];
        if (typeof data._isexpend != 'boolean') nodeList.push({ data, el: this.svg.select(`#${this.getNodeId(id)}`) });
      }
      return nodeList;
    },
    getNodeId(id) {
      return 'node-' + id;
    },

    getLinkId(sId, tId) {
      return 'link-' + sId + '-' + tId;
    },
    // padding 格式化
    setPaddingFormat(inputValue) {
      let padding = () => [0, 0, 0, 0];
      let paddingValue = inputValue;
      if (typeof paddingValue == 'number') {
        padding = () => [paddingValue, paddingValue, paddingValue, paddingValue];
      }
      // 长度为2的数组，对应上下，左右
      if (Array.isArray(paddingValue)) {
        if (paddingValue.length == 2) {
          padding = () => [paddingValue[0], paddingValue[1], paddingValue[0], paddingValue[1]];
        }
        if (paddingValue.length == 4) {
          padding = () => paddingValue;
        }
      }
      if (typeof paddingValue == 'function') {
        padding = paddingValue;
      }
      return padding;
    },
    // 设置默认图形上的class,配置相中自定以的class以追加的方式添加。
    setShapClass(d, sharpName, nodeconfig) {
      let classContent = nodeconfig[sharpName].attrs.class;
      let defaultClass = `moon-hierarchy-${sharpName}`;
      if (typeof classContent == 'function') return `${defaultClass} ${classContent(d) || ''}`;
      if (typeof classContent == 'string' && classContent) {
        return `${defaultClass} ${classContent}`;
      }
      return defaultClass;
    },
    // 获取字符串像素
    calculateTextWidth(text, fontSize, fontFamily) {
      // 创建一个虚拟的 Canvas 元素
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      // 设置字体样式
      context.font = `${fontSize}px ${fontFamily}`;
      // 使用 measureText 方法测量文本宽度
      const textWidth = context.measureText(text).width;
      return textWidth;
    },
    createOrUpdateForeignObject(attrs) {
      attrs = {
        width: 100,
        height: 50,
        transform_begin: 'translate(0,0) scale(0)',
        transform: 'translate(0,0) scale(1)',
        ...attrs,
      };
      if (!this.foreignObject) {
        this.foreignObject = this.container.append('foreignObject');
      }
      this.showCustomView = true;
      // 设置节点属性
      Object.keys(attrs).reduce((_, attr) => {
        if (attr != 'transform') return _.attr(attr, attrs[attr]);
        else return _;
      }, this.foreignObject);
      if (attrs.hasChangeNode) this.foreignObject.attr('transform', attrs.transform_begin);
      this.foreignObject
        .transition()
        .duration(attrs.duration || this.config?.customView?.duration || this.duration)
        .attr('transform', attrs.transform);
      this.foreignObject.on('click', (e) => e.stopPropagation());
      this.foreignObject.node().append(this.$refs.CoustomView);
    },
    updateCustomView() {
      // 若当前自定义视图开启，且依据节点绘制，则在画图重绘制时也重绘
      if (this.foreignObject && this.drawCustomViewLastConfig.d) {
        let item = this.drawCustomViewLastConfig.d;
        // 判断目标节点是否被移除
        const selectionNode = this.svg.select(`#${this.getNodeId(item.data[this.symbolKey])}`);
        if (selectionNode.node()) {
          let id = this.drawCustomViewLastConfig.d.data[this.symbolKey];
          let node = this.hierarchyLayoutData.find((item) => item.data[this.symbolKey] == id);
          let { e, width, height, priority } = this.drawCustomViewLastConfig;
          if (node) {
            this.drawCustomView(e, node, width, height, priority);
          } else {
            this.hiddenCustomView();
          }
        } else {
          this.hiddenCustomView();
        }
      }
    },
    hiddenCustomView() {
      this.showCustomView = false;
      this.drawCustomViewLastConfig = {};
      if (this.foreignObject) {
        this.foreignObject.remove();
        this.foreignObject = null;
      }
    },
    expendAllNode() {
      this.lastClickNode = this.hierarchyLayoutData;
      this.treeDataFactory.flatData.forEach((item) => {
        if (item._children) {
          item.children = item._children;
          item._children = null;
        }
        if (typeof item._isexpend == 'boolean' && item._isexpend === false) {
          item._isexpend = true;
          let p = this.treeDataFactory.objById[item[this.inner_treeOptions.pId]];
          let children = p.children || p._children;
          // 操作父节点，将_exChildren内容插入到children中
          if (p._exChildren?.length) {
            let c = p._exChildren.filter((v) => v._sign == item._sign);
            children.splice(children.indexOf(item), 0, ...c);
          }
        }
      });
      this.drawView();
    },
    foldAllNode() {
      let foldTargetNode = [];

      this.treeDataFactory.flatData.forEach((item) => {
        let obj = {};
        if (this.defaultOpenLevel > 0) {
          if (item.level >= this.defaultOpenLevel) {
            if (item.children) {
              item._children = item.children;
              item.children = null;
            }
          }
          if (item.level == this.defaultOpenLevel) {
            let node = this.hierarchyLayoutData.find((v) => v.data[this.symbolKey] == item[this.symbolKey]);
            obj.node = node;
          }
        }

        if (typeof item._isexpend == 'boolean' && item._isexpend) {
          item._isexpend = false;
          let p = this.treeDataFactory.objById[item[this.inner_treeOptions.pId]];
          let children = p.children || p._children;

          let exChildrenIds = p._exChildren.filter((v) => v._sign == item._sign).map((v) => v[this.symbolKey]);
          if (item.level == this.defaultOpenLevel) {
            obj.parentNode = this.hierarchyLayoutData.find((v) => v.data[this.symbolKey] == p[this.symbolKey]);
            obj.exChildrenIds = exChildrenIds;
          }
          arrayRemoveItem(children, (v) => exChildrenIds.includes(v[this.symbolKey]));
        }
        if (obj.node) foldTargetNode.push(obj);
      });
      this.drawView();
      if (foldTargetNode.length)
        foldTargetNode.forEach(({ node: oldNode, parentNode, exChildrenIds }) => {
          let node = this.hierarchyLayoutData.find((v) => v.data[this.symbolKey] == oldNode.data[this.symbolKey]);
          this.foldLinksAndNodes(oldNode, node);
          // 若有限制节点，则需要收缩到父节点
          if (parentNode && exChildrenIds) {
            node = this.hierarchyLayoutData.find((v) => v.data[this.symbolKey] == parentNode.data[this.symbolKey]);
            this.foldLinksAndNodes(parentNode, node, (link) => {
              return exChildrenIds.includes(link.target.data[this.symbolKey]);
            });
          }
        });
      else this.foldLinksAndNodes(this.hierarchyLayoutData, this.hierarchyLayoutData);
      this.moveToCenter();
    },
    expendToNode(sourceData) {
      sourceData.track.forEach((id, index) => {
        if (id != sourceData[this.symbolKey]) {
          let node = this.treeDataFactory.objById[id]; // this.hierarchyLayoutData.find((item) => item.data[this.symbolKey] == id);
          if (!this.lastClickNode) {
            // 设置动画起始节点,即第一个折叠的节点
            if (isNonEmptyArray(node._children)) {
              this.lastClickNode = this.hierarchyLayoutData.find((item) => item.data[this.symbolKey] == id);
            }
          }
          // 展开节点
          if (isNonEmptyArray(node._children)) {
            node.children = node._children;
            node._children = undefined;
          }
          if (index < sourceData.track.length - 1) {
            // 若下个节点在_exChildren中时
            let nextId = sourceData.track[index + 1];
            let children = node.children || node._children;
            // 若在限制收起节点中找到，则当前节点需要处于展开状态
            let ifInExChildren = node?._exChildren?.find((v) => v[this.symbolKey] == nextId);
            if (ifInExChildren) {
              // 找到同向的展开节点
              let expendNode = children.find((v) => typeof v._isexpend == 'boolean' && v._sign == ifInExChildren._sign);
              // 若当前节点状态为收起，则需要展开
              if (!expendNode._isexpend) {
                expendNode._isexpend = true;
                children.splice(children.indexOf(expendNode), 0, ...node._exChildren.filter((v) => v._sign == expendNode._sign));
              }
            }
          }
        }
      });
      this.drawView();
    },
    // 将画布中心移动到指定节点
    moveToNode(targetNodeId, eventList = []) {
      if (!targetNodeId) throw `moon-hierarchy组件：请传入目标节点数据中${this.symbolKey}的值`;
      const sourceData = this.treeDataFactory.objById[targetNodeId];
      if (!sourceData) {
        throw `moon-hierarchy组件：画布中没有匹配到${this.symbolKey}=${targetNodeId}的节点`;
      }

      let node = this.hierarchyLayoutData.find((item) => item.data[this.symbolKey] == sourceData[this.symbolKey]);
      // 若画布中没有指定节点。则使用expendToNode
      if (!node) {
        this.expendToNode(sourceData);
        node = this.hierarchyLayoutData.find((item) => item.data[this.symbolKey] == sourceData[this.symbolKey]);
      }

      this.moveToCenter({
        ...this.nodeToCenterXY(node),
        d: this.duration,
      });

      eventList = this.formatToArray(eventList);
      // 触发指定事件
      if (eventList.length) {
        let selectionNode = this.svg.select(`#${this.getNodeId(targetNodeId)}`);
        eventList.forEach((event) => {
          const _ = {
            preventDefault() {},
          };
          // this.nodeListener[event]?.(null, node);
          if (event == 'clickFetchChildren') {
            this.onClickFetchChildren(sourceData);
            return;
          }
          if (event == 'click') {
            console.log('click');
            this.nodeListener['click']?.(_, node, selectionNode, this.svg);
            return;
          }
          if (event == 'mouseover') {
            this.onNodeMouseOver(node);
            this.nodeListener['mouseover']?.(_, node, selectionNode, this.svg);
            return;
          }
          if (event == 'mouseover') {
            this.onNodeMouseOut(node);
            this.nodeListener['mouseout']?.(_, node, selectionNode, this.svg);
            return;
          }
          this.nodeListener[event]?.(_, node, node, this.svg);
        });
      }
    },
  },
};
