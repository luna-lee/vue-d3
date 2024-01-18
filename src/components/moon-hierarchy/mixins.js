import * as d3 from 'd3'
import { flatToTree } from '@/utils.js'
function isNonEmptyArray(arr) {
  return arr && arr.length
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
    //监听
    listener: {
      type: Object,
      default: () => ({}),
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
    this.currentScale = this.config?.zoom?.defaultScale || 1
    this.drawSvg()
    this.$watch(
      () => [this.treeData, this.layout],
      () => {
        if (isNonEmptyArray(this.treeData)) this.drawContainer()
      },
      {
        deep: true,
        immediate: true,
      }
    )
  },
  data() {
    return {
      svg: null,
      zoom: null,
      container: null,
      treeLayoutData: null,
      lastClickNode: null,
      nodesContainer: null,
      linksContainer: null,
      currentScale: 1,
      treeDataFactory: { treeData: [], leafs: [], objById: {}, flatData: [] },
      exceptListener: ['click', 'clickFetchChildren', 'mouseover', 'mouseout'],
    }
  },
  computed: {
    symbolKey() {
      return this.inner_treeOptions.id
    },
    inner_treeOptions() {
      return {
        id: 'id',
        pId: 'pId',
        name: 'name',
        ...this.treeOptions,
      }
    },
    centerPosition() {
      return { x: this.width / 2, y: this.height / 2 }
    },
    linkConifg() {
      return {
        stroke: '#D8D8D8',
        fill: 'none',
        'stroke-opacity': '1',
        'stroke-width': '1',
        ...(this.config?.link || {}),
        class: 'moon-hierarchy-link',
        'marker-end': 'url(#arrow)',
      }
    },
    defsNodeConfig() {
      const loadingSize = 16
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
              fill: '#128BED',
              orient: 'auto-start-reverse',
              ...(this.config.arrow?.attrs || {}),
              id: 'arrow',
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
      }
    },
    // 节点配置中有class属性的节点信息。组成一个map对象.他们都会在节点更新时，重新更新其属性。
    needUpdataShapsByClassMap() {
      let mapObj = {}
      function iterator(arr) {
        arr.forEach(item => {
          if (item.attrs.class) {
            mapObj[item.attrs.class] = item
          }
          if (isNonEmptyArray(item.children)) {
            iterator(item.children)
          }
        })
      }
      iterator(this.nodeConfig.shaps)
      return mapObj
    },
  },
  methods: {
    initTreeData() {
      this.treeDataFactory = flatToTree(
        this.treeData,
        this.inner_treeOptions.id,
        this.inner_treeOptions.pId
      )
      this.setSign()
    },
    createSvg() {
      this.svg = d3
        .create('svg')
        .attr('class', 'moon-hierarchy-svg')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('cursor', 'move')
    },
    createContainDom() {
      this.container = this.svg
        .append('g')
        .attr('class', 'moon-hierarchy-container')
        .attr('font-family', 'sans-serif')
        .attr(
          'transform',
          `translate(${this.width / 2},${this.height / 2}) scale(1)`
        )
    },
    drawSvg() {
      this.$watch(
        () => [this.width, this.height],
        () => {
          if (this.svg) {
            this.svg.attr('width', this.width).attr('height', this.height)
            this.moveToCenter()
          } else this.createSvg()
        },
        {
          deep: true,
          immediate: true,
        }
      )
      this.addDefs()
      this.appendSvg()
    },
    drawContainer() {
      // reset
      this.container && this.container.remove()
      Object.assign(this.$data, this.$options.data(), { svg: this.svg })

      this.createContainDom()
      this.initTreeData()
      this.defaultExpendLevel()
      this.drawView()
      this.initZoom()
      this.moveToCenter()
    },
    defaultExpendLevel() {
      if (this.defaultOpenLevel > 0)
        this.treeDataFactory.flatData.forEach(item => {
          if (item.level >= this.defaultOpenLevel) {
            item._children = item.children
            item.children = null
          }
        })
    },
    setLayoutData() {
      let root = this.treeDataFactory.treeData[0]
      this.treeLayoutData = this.treeLayout(d3.hierarchy(root))
      // 蝴蝶模型，左边右边单独计算
      if (this.layout == 'bf' && root.children) {
        let positive = root.children.filter(v => v._sign == 1)
        let negative = root.children.filter(v => v._sign == -1)
        let _positive = this.treeLayout(
          d3.hierarchy({ ...root, children: positive })
        )
        let _negative = this.treeLayout(
          d3.hierarchy({ ...root, children: negative })
        )

        this.treeLayoutData.children = [
          ...(_positive?.children || []),
          ...(_negative?.children || []),
        ]
      }
    },
    addNode(nodeList) {
      const getNodeId = this.getNodeId
      const symbolKey = this.symbolKey
      const lastClickNode = this.lastClickNode
      if (!this.nodesContainer)
        this.nodesContainer = this.container
          .append('g')
          .attr('stroke-linejoin', 'round')
          .attr('stroke-width', 3)
          .attr('class', 'moon-hierarchy-nodes')

      const nodes = this.nodesContainer
        .selectAll()
        .data(nodeList)
        .join('g')
        .attr('class', d =>
          typeof d.data._isexpend == 'boolean' ? 'moon-hierarchy-node moon-hierarchy-expend-button' : 'moon-hierarchy-node'
        )
        .attr('cursor', 'pointer')
        .attr('id', d => getNodeId(d.data[symbolKey]))
        .attr('transform', d => {
          // 初始位置
          return this.onNodeFoldTranslate(lastClickNode, d)
        })
        .on('click', (_, d) => {
          this.onNodeClick(d)
          this.listener['click']?.(_, d)
        })
        .on('mouseover', (_, d) => {
          this.onNodeMouseOver(d)
          this.listener['mouseover']?.(_, d)
        })
        .on('mouseout', (_, d) => {
          this.onNodeMouseOut(d)
          this.listener['mouseout']?.(_, d)
        })
      this.addListener(nodes, this.listener, this.exceptListener)
      nodes
        .transition()
        .duration(this.duration)
        .attr('transform', d => {
          // 结束位置
          return this.onNodeExpendTranslate(d)
        })
      this.iteratorAddNode(nodes, this.nodeConfig.shaps)
      this.addShapEexpendFold(nodes)
    },
    updateNode(nodeList) {
      for (let i = 0; i < nodeList.length; i++) {
        let item = nodeList[i]
        const id = this.getNodeId(item.data[this.symbolKey])
        const node = d3.select(`#${id}`)
        this.addListener(node, this.listener, this.exceptListener, item)
        node
          .on('click', () => {
            this.onNodeClick(item)
            this.listener['click']?.(item)
          })
          .on('mouseover', () => {
            this.onNodeMouseOver(item)
            this.listener['mouseover']?.(item)
          })
          .on('mouseout', () => {
            this.onNodeMouseOut(item)
            this.listener['mouseout']?.(item)
          })
          .transition()
          .duration(this.duration)
          .attr('transform', () => {
            // 结束位置
            return this.onNodeExpendTranslate(item)
          })
        // 更新节点配置中有class属性的节点信息。
        Object.keys(this.needUpdataShapsByClassMap).forEach(keyClass => {
          const { attrs, compose, on } =
            this.needUpdataShapsByClassMap[keyClass]
          const shapNode = node.select('.' + keyClass)
          this.setAttrByOpt(shapNode, attrs)
          this.addListener(shapNode, on)
          this.setComposeOpt(shapNode, compose)
        })
        this.addShapEexpendFold(node, item)
      }
    },
    addShapEexpendFold(node, qt) {
      if (this.expendShape != this.foldShape) {
        if (this.expendShape) {
          node.select(this.expendShape).on('click', (e, d) => {
            e.stopPropagation()
            this.onNodeExpendOrFold(qt || d, true)
          })
        }
        if (this.foldShape) {
          node.select(this.foldShape).on('click', (e, d) => {
            e.stopPropagation()
            this.onNodeExpendOrFold(qt || d, false)
          })
        }
      } else {
        if (this.expendShape) {
          node.select(this.expendShape).on('click', (e, d) => {
            e.stopPropagation()
            const id = qt ? qt.data[this.symbolKey] : d.data[this.symbolKey]
            const sourceData = this.treeDataFactory.objById[id]
            this.onNodeExpendOrFold(
              qt || d,
              !isNonEmptyArray(sourceData.children)
            )
          })
        }
      }
    },
    addListener(node, listener = {}, except = [], qd) {
      Object.keys(listener).forEach(key => {
        if (!except.includes(key))
          node.on(key, (e, d) => listener[key](e, qd || d))
      })
    },
    addOrUpdateNode() {
      const nodeList = this.treeLayoutData.descendants()
      let addList = []
      let updateList = []
      for (let i = 0; i < nodeList.length; i++) {
        let item = nodeList[i]
        const id = this.getNodeId(item.data[this.symbolKey])
        const node = d3.select(`#${id}`)
        if (node.node()) {
          updateList.push(item)
        } else {
          addList.push(item)
        }
      }
      this.addNode(addList)
      this.updateNode(updateList)
    },
    async onNodeClick(d) {
      this.lastClickNode = d
      const symbolKey = this.symbolKey
      const sourceData =
        this.treeDataFactory.objById[this.lastClickNode.data[symbolKey]]

      if (isNonEmptyArray(sourceData.children)) {
        if (!this.foldShape) this.onNodeExpendOrFold(d, false)
      } else if (!this.expendShape) this.onNodeExpendOrFold(d, true)
      //点击展开收起节点
      if (typeof sourceData._isexpend === 'boolean') {
        this.onLimitNodeExpendOrFold && this.onLimitNodeExpendOrFold(sourceData)
      }
    },
    async onNodeExpendOrFold(d, expend = false) {
      if (typeof this.canExpendFold == 'boolean' && !this.canExpendFold) return
      if (
        typeof this.canExpendFold == 'function' &&
        !this.canExpendFold(sourceData)
      )
        return
      const symbolKey = this.symbolKey
      this.lastClickNode = d
      const sourceData =
        this.treeDataFactory.objById[this.lastClickNode.data[symbolKey]]
      if (expend) {
        // 展开
        if (isNonEmptyArray(sourceData._children)) {
          sourceData.children = sourceData._children
          sourceData._children = undefined
        } else {
          if (sourceData._hasChildren) {
            await this.onClickFetchChildren(sourceData)
            // 动态新增的节点，从新计算限制值
            this.setLimtNode && this.setLimtNode()
          }
        }
      }
      // 收起
      else if (isNonEmptyArray(sourceData.children)) {
        sourceData._children = sourceData.children
        sourceData.children = undefined
      }
      //点击展开收起节点
      this.drawView()

      // _children有值时为收起
      let isFold = isNonEmptyArray(sourceData._children)
      // 找到重新计算后的node。
      const afterCalcuNode = this.treeLayoutData
        .descendants()
        .find(n => n.data[symbolKey] == this.lastClickNode.data[symbolKey])
      // 收起
      if (isFold) {
        this.foldLinksAndNodes(this.lastClickNode, afterCalcuNode)
      }
      this.moveToCenter({
        ...this.nodeToCenterXY(afterCalcuNode),
        d: this.duration,
      })
    },
    onNodeMouseOver(d) {
      d.links().forEach(link => {
        const id = this.getLinkId(
          link.source.data[this.symbolKey],
          link.target.data[this.symbolKey]
        )
        d3.select(`#${id}`).attr('class', 'moon-hierarchy-link-custom')
      })
    },
    onNodeMouseOut(d) {
      d.links().forEach(link => {
        const id = this.getLinkId(
          link.source.data[this.symbolKey],
          link.target.data[this.symbolKey]
        )
        let line = d3.select(`#${id}`)
        // 获取虚线的总长度
        line.classed('moon-hierarchy-link-custom', false) // 过渡的持续时间，单位毫秒
      })
    },
    async onClickFetchChildren(sourceData) {
      if (sourceData._hasChildren && !sourceData._loading) {
        try {
          this.setLoadingIcon(sourceData)
          await this.listener['clickFetchChildren']?.(sourceData)
          sourceData?.children?.forEach(v => {
            let id = v[this.symbolKey]
            v[this.inner_treeOptions.pId] = sourceData[this.symbolKey]
            v.track = [...sourceData.track, id]
            v.level = sourceData.level + 1
            v._sign = sourceData._sign
            this.treeDataFactory.objById[id] = v
            this.treeDataFactory.flatData.push(v)
          })
          this.setLoadingIcon(sourceData, false)
        } catch (error) {
          this.setLoadingIcon(sourceData, false)
          console.error(error)
        }
      }
    },
    addOrUpdateLinks() {
      const links = this.treeLayoutData.links()
      let addList = []
      let updateList = []
      for (let i = 0; i < links.length; i++) {
        let item = links[i]
        const id = this.getLinkId(
          item.source.data[this.symbolKey],
          item.target.data[this.symbolKey]
        )
        const node = d3.select(`#${id}`)
        if (node.node()) {
          updateList.push(item)
        } else {
          addList.push(item)
        }
      }
      this.addLinks(addList)
      this.updateLinks(updateList)
    },
    //收起节点对应的所有子节点和线
    foldLinksAndNodes(node, newNode, filter) {
      const getLinkId = this.getLinkId
      const getNodeId = this.getNodeId
      const symbolKey = this.symbolKey
      node.links().forEach(link => {
        // 过滤link
        if (typeof filter == 'function' && !filter(link)) {
          return
        }

        const nodeId = getNodeId(link.target.data[symbolKey])
        d3.select(`#${nodeId}`)
          .transition()
          .duration(this.duration)
          .attr('transform', () => {
            return this.onNodeFoldTranslate(newNode, link.target)
          })

        const linkId = getLinkId(
          link.source.data[symbolKey],
          link.target.data[symbolKey]
        )
        d3.select(`#${linkId}`)
          .transition()
          .duration(this.duration)
          .attr('transform', () => {
            return this.onNodeFoldTranslate(newNode, link.target)
          })
      })
    },
    drawView() {
      this.initLayoutData()
      this.addOrUpdateLinks()
      this.addOrUpdateNode()
    },
    addDefs() {
      const defs = this.svg.append('defs')
      this.iteratorAddNode(defs, this.defsNodeConfig.nodeList)
    },
    iteratorAddNode(parrentNodes, nodeConfigList) {
      nodeConfigList.forEach(shap => {
        const node = parrentNodes.append(shap.name)
        this.setAttrByOpt(node, shap.attrs)
        this.setComposeOpt(node, shap.compose)
        this.addListener(node, shap.on)
        if (shap.children) this.iteratorAddNode(node, shap.children)
      })
    },
    moveToCenter(opt) {
      if (!opt) {
        let rootNode = this.treeLayoutData
        opt = {
          ...this.nodeToCenterXY(rootNode),
          d: this.duration,
        }
      }
      let { x, y, d } = opt
      const inverseScale = 1 / this.currentScale
      let _x = this.centerPosition.x * inverseScale - x
      let _y = this.centerPosition.y * inverseScale - y
      let xw = d3.zoomIdentity.scale(this.currentScale).translate(_x, _y)
      xw.d = d //duration
      this.svg.call(this.zoom.transform, xw)
    },
    appendSvg() {
      this.$refs.svg.append(this.svg.node())
    },
    initZoom() {
      let scaleRange = this.config?.zoom?.scaleRange || [0.2, 2]
      this.zoom = d3
        .zoom()
        .scaleExtent(scaleRange)
        .on('zoom', e => {
          let zoom = e.transform
          this.currentScale = zoom.k
          this.container
            .transition()
            .duration(zoom.d)
            .attr(
              'transform',
              `translate(${Number(zoom.x)},${zoom.y}) scale(${zoom.k})`
            )
        })

      //动画持续时间
      this.svg.call(this.zoom).on('dblclick.zoom', null)
    },
    setAttrByOpt(node, opt = {}) {
      Object.keys(opt).map(key => {
        node.attr(key, opt[key])
      })
    },
    setComposeOpt(node, opt = {}) {
      Object.keys(opt).reduce((n, key) => {
        if (Array.isArray(opt[key])) n[key](...opt[key])
        else n[key](opt[key])
        return n
      }, node)
    },
    getNodeId(id) {
      return 'node-' + id
    },

    getLinkId(sId, tId) {
      return 'link-' + sId + '-' + tId
    },
    // padding 格式化
    setPaddingFormat(inputValue) {
      let padding = () => [0, 0, 0, 0]
      let paddingValue = inputValue
      if (typeof paddingValue == 'number') {
        padding = () => [paddingValue, paddingValue, paddingValue, paddingValue]
      }
      // 长度为2的数组，对应上下，左右
      if (Array.isArray(paddingValue)) {
        if (paddingValue.length == 2) {
          padding = () => [
            paddingValue[0],
            paddingValue[1],
            paddingValue[0],
            paddingValue[1],
          ]
        }
        if (paddingValue.length == 4) {
          padding = () => paddingValue
        }
      }
      if (typeof paddingValue == 'function') {
        padding = paddingValue
      }
      return padding
    },
    // 获取字符串像素
    calculateTextWidth(text, fontSize, fontFamily) {
      // 创建一个虚拟的 Canvas 元素
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      // 设置字体样式
      context.font = `${fontSize}px ${fontFamily}`
      // 使用 measureText 方法测量文本宽度
      const textWidth = context.measureText(text).width
      return textWidth
    },
  },
}
