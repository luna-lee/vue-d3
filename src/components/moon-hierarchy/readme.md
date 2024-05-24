# moon-hierarchy

### 预览地址

### 	https://www.fste.top/demo/html/d3/hierarchy/#/

### 开发目的

- 使用 d3 开发层级数据展示图。且支持各种自定义功能。

### 安装 npm i moon-hierarchy -S

### vue 文件中使用

```javascript
- import hierarchy from 'moon-hierarchy';
- import 'moon-hierarchy/dist/moon-hierarchy.css';
  components: {  hierarchy  }
```

### Props

| 参数             | 说明                                                         | 类型                  | 可选值  | 默认值                               |
| ---------------- | ------------------------------------------------------------ | --------------------- | ------- | ------------------------------------ |
| width            | svg 宽度                                                     | Number                | -       | 1300                                 |
| height           | svg 高度                                                     | Number                | -       | 800                                  |
| mode             | 渲染模式：水平方向 h，垂直方向 v                             | String                | h,v     | h                                    |
| layout           | 布局：水平方向-左右，右左，蝴蝶，垂直->上下，下上，蝴蝶      | String                | -       | tb/bt/bf, lr/rl/bf                   |
| limit            | 水平模式，子节点最大展示数，多余的出收起按钮 ，-1 时全部展出 | Number                | -1；1+  | 3                                    |
| treeData         | 扁平化树数据，外部修改后，会触发画布重绘。但内置新增、修改、删除方法不会触发重绘，且会修改treeData数据 | Array                 | -       | []                                   |
| treeOptions      | 树数据选项                                                   | Object                | -       | { id: 'id',pId: 'pId',name: 'name',} |
| duration         | 动画过渡时间                                                 | Number                |         | 400                                  |
| defaultOpenLevel | 默认展开层级，-1 时全部展开                                  | Number                | -1 ，1+ | 2                                    |
| negativeIds      | 蝴蝶模型，指定负向数据对应的 id，必须是根节点的直接子节点    | Array                 | -       | []                                   |
| config           | 配置节点连线，详情见下方说明                                 | Object                | -       | {}                                   |
| canExpendFold    | 点击当前节点，展开和收缩子节点 ,传入函数，则接受当前节点数据，返回一个 boolean | Boolean, (d)=>boolean | -       | true                                 |
| expendShape      | 指定点击展开的元素，必须同时设置 foldShape 才起作用，可以是 id，class 或元素,默认整个节点 | string                | -       | -                                    |
| foldShape        | 指定点击闭合的元素，必须同时设置 expendShape 才起作用，可以是 id，class 或元素 ,默认整个节点 | string                | -       | -                                    |

#### Props.config

| 参数       | 说明           |
| ---------- | -------------- |
| node       | 节点配置       |
| arrow      | 箭头配置       |
| link       | 连线配置       |
| zoom       | 缩放配置       |
| customView | 自定义节点视图 |

#### Props.config.node 配置

| 参数       | 说明                                                                                    | 默认值     |
| ---------- | --------------------------------------------------------------------------------------- | ---------- |
| attrs      | 设置节点除 id，transform 其他的所有属性                                                 | -          |
| on         | 节点监听 ，详情见下方说明                                                               | Object     |
| padding    | 内容区域到边框的距离，详情见下                                                          | h:15,v:10  |
| nodeWidth  | 布局的节点宽度，水平模式，实际的节点宽度依据内容确定。在数据 data.\_nodeConfig 中可查看 | h:60,v:168 |
| nodeHeight | 布局的节点高度,水平模式，实际的节点高度，还会加上 padding 值                            | h:16,v:68  |
| separation | 节点间距                                                                                | 1.5        |
| rect       | 矩形配置                                                                                | -          |
| text       | 文本配置                                                                                | -          |
| plus       | 折叠图标配置                                                                            | -          |
| exShaps    | 自定义图型配置,                                                                         | []         |

- #### node.on 节点监听


| 名称               | 说明                                                         | 类型                                                         |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| clickFetchChildren | 点击后异步加载子节点。父节点上需要有\_hasChildren 标记 ,返回一个数组，可以是层级结构的数据。data:当前节点源数据信息；el:当前节点对应的 d3 元素对象；svg:画布元素 | (data:treeData,el:selection,svg:d3Selection)=>object[]\|object |
| click              | 鼠标事件,禁止冒泡;                                           | (e:MouseEvent,d:d3Node,svg:d3Selection)=>object[]            |
| mouseover          | 鼠标事件                                                     | (e:MouseEvent,d:d3Node,svg:d3Selection)=>object[]            |
| mouseout           | 鼠标事件                                                     | (e:MouseEvent,d:d3Node,svg:d3Selection)=>object[]            |
| 其他事件           | 其他事件                                                     | (e:MouseEvent,d:d3Node,svg:d3Selection)=>object[]            |

### 

- #### node.padding

  -   可以是数字，数组，函数， 函数时接受一个当前节点数据的参数，动态返回一个数组

  - <!-- 数据类型 -->

  - ```javascript
    type=[number,number,number,number]|number|(d:d3Node)=>{return [number,number,number,number]}
    ```


- ### node.rect 默认组件

  - <!-- 数据类型 -->

  - ```javascript
    {
      attrs:object,
      on:object,
      show:boolean
    }
    ```


  - | 参数  | 说明                                               | 默认值                  |
    | ----- | -------------------------------------------------- | ----------------------- |
    | attrs | 组件样式配置                                       | { attrs:{ } ,show:true} |
    | show  | 是否显示，设置为 false 后可以通过 exShaps 自己指定 | true                    |

- ### node.text 默认组件

  - <!-- 数据类型 -->


  - ```javascript
    {
      attrs:object,
      on:object,
      compose:object,// mode 水平模式可配置
      show:boolean
    }
    ```


  - | 参数  | 说明                                               | 默认值                                           |
    | ----- | -------------------------------------------------- | ------------------------------------------------ |
    | attrs | 组件配置                                           | v:{font-size:16,line-height:10} h:{font-size:10} |
    | show  | 是否显示，设置为 false 后可以通过 exShaps 自己指定 | true                                             |

- ### node.plus 默认组件

  - <!-- 数据类型 -->


  - ```javascript
    {
      attrs:object,
      on:object,
      show:boolean
    }
    ```


  - | 参数  | 说明                                               | 默认值         |
    | ----- | -------------------------------------------------- | -------------- |
    | attrs | 组件配置                                           | { r: v:10;h:6} |
    | show  | 是否显示，设置为 false 后可以通过 exShaps 自己指定 | true           |

- ### node.exShaps 自定义图形配置

  -   一个图形数组。

  -   图形嵌套，通过指定 children 实现

  -   具体配置如下：


```javascript
exShaps = [
    {
        name: 'g',
        // 属性配置
        attrs: {
            stroke: 'rgb(153, 153, 153)',
            fill: 'rgb(234, 242, 255)',
            'stroke-width': 1
        },
        // 链式函数配置。如text
        compose: {
            text(d) {
                return d.name;
            }
        },
        // 监听事件配置。
        on: {
            click(e, d) {}
        },
        children: [
            {
                name: 'circle',
                attrs: {
                    r: 20
                }
            }
        ]
    }
];
```



#### Props.config.arrow 箭头

<!-- 数据类型 -->

```javascript
{
  attrs:object,
  path: string,
  show:true
}
```

| 参数  | 说明             | 默认值                                                                                                            |
| ----- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| attrs | 箭头 marker 配置 | { viewBox: '0 0 10 10', refX: '10', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse'} |
| path  | path d 配置      | d:’M 0 0 L 10 5 L 0 10 z‘                                                                                         |
| show  | 是否显示         | true                                                                                                              |

#### Props.config.link 连线配置

<!-- 数据类型 -->

```javascript
{
  [string]:any
}
```

| 参数 | 说明         | 默认值                                                                         |
| ---- | ------------ | ------------------------------------------------------------------------------ |
| link | 路径样式配置 | { stroke: '#D8D8D8', fill: 'none', 'stroke-opacity': '1', 'stroke-width': '1'} |

#### Props.config.zoom 缩放配置

<!-- 数据类型 -->

```javascript
{
  defaultScale:number,
  scaleRange:[number,number],
  callback:(e)=>void
}
```

| 参数         | 说明                       | 默认值  |
| ------------ | -------------------------- | ------- |
| defaultScale | 默认缩放值                 | 1       |
| scaleRange   | 可缩放范围                 | [0.2,2] |
| callback     | 缩放回到函数，接受缩放参数 | -       |

#### Props.config.customView 自定视图配置

| 参数     | 说明                                                         | 默认值                   |
| -------- | ------------------------------------------------------------ | ------------------------ |
| width    | 视图宽度                                                     | 100                      |
| height   | 视图高度                                                     | 50                       |
| priority | 相对于布局节点，视图优先出现位置,rb右下，rt右上，lb左下，lt左上 | ['rb', 'rt', 'lb', 'lt'] |
| duration | 动画过渡时间，默认props.duration中的值                       | 400                      |



#### 节点数据说明

-   所有的 attrs，compose 中关于节点属性的属性配置项的值，即可以是字符串，也可以是函数

-   函数接受一个参数，为当前节点数据。其中的 data 属性值为业务数据。

-   如

```
    attrs:{
        display(d){
            if(d.data....)
                return 'none'
        }
    }

```

```javascript
{
"data": {
...业务数据
"_hasChildren": true, //异步加载子节点时，父节点中的判断标记
"_sign": 1, //不同模型下，上下，左右标记。 左、上：-1。 右，下：1
"_nodeConfig": object, //当前节点配置信息。包含节点的高度宽度形状等信息。
"_isexpend":false,//水平模式下，限制节点按钮的展开闭合状态，只有限制节点按钮才有
"_name": []  //垂直模式下，文本的多行节点信息
},
"x": 126, //节点坐标
"y": 136 //节点坐标
}

```

#### 

### Events

| 名称      | 说明                                              | 参数                                    |
| --------- | ------------------------------------------------- | --------------------------------------- |
| draw-done | 画布渲染完成后事件,返回当前画布节点与内容区域节点 | {svg:d3Selection,container:d3Selection} |

### Slot

| 名称    | 说明           |
| ------- | -------------- |
| default | 自定义视图节点 |



### Methods

| 名称        | 说明                                                         | 类型                                           |
| ----------- | ------------------------------------------------------------ | ---------------------------------------------- |
| getNodeById | 依据数据中唯一标识 id，对应 treeOptions 中的 id， 获取对应的数据，以及元素对象 | (id:string)=>({ data: d3Node, el: d3Selection }) |
| getAllNode | 获取所有非展开收起的节点，对应的数据，以及元素对象 | (id:string)=>({ data: d3Node, el: d3Selection }[]) |
| moveToCenter | 移动到中点 | ()=>void |
| zoom | 缩放画布，  大于 1 的为放大，小于 1 大于 0 的为缩小。负数无效 | (scale:number)=>void |
| addNode | 在targetId对应目标节点上新增子节点 ,childrenNode 是一个扁平树数据也可以是单个对象数据。 \_sign 当目标节点为根节点且为 bf 布局时，用于指定添加的方位。会修改treeData数据 | (targetId,childrenNode:treeItem\|treeItem[],\_sign)=>void |
| updateNodeByData | 更新节点对应业务数据。但不能更改组件数据，如id，pId，children，"_"开头的属性。会修改treeData数据 | (dataList:treeItem\|treeItem[])=>void |
| removeNodeById | 依据节点 id，移除该节点以及其所有子节点。会修改treeData数据 | (id:string\|string[])=>void |
| pauseZoom | 暂停缩放功能 | ()=>void |
| continueZoom | 启动缩放功能 | ()=>void |
| showCustomView | 显示slot对应的自定义的view视图,e:鼠标信息，d：布局节点信息，width，height，priority，duration：参考config.customView，优先级高于config.customView中的配置。 | (e, d, width, height, priority,duration)=>void |
| hiddenCustomView | 隐藏slot对应的自定义的view视图, | ()=>void |
| expendToNode | 展开到指定节点所在的层级,eventList指定触发节点事件。move事件将画布移动到指定节点。 | (targetNodeId:string,eventList:string[]\|string)=>void |



### 各个节点，图形默认的 id 和 class

| 名称                                       | class                            | id                                         |
| ------------------------------------------ | -------------------------------- | ------------------------------------------ |
| 节点                                       | moon-hierarchy-node              | 'node'+ 节点数据中的唯一标识字段对应的数据 |
| 节点-根节点                                | moon-hierarchy-node-root         | 'node'+ 节点数据中的唯一标识字段对应的数据 |
| 节点-有子节点的节点                        | moon-hierarchy-node-haschildren  | 'node'+ 节点数据中的唯一标识字段对应的数据 |
| 节点-有子节点的节点，且展开                | moon-hierarchy-node-expend       | 'node'+ 节点数据中的唯一标识字段对应的数据 |
| 节点-限制展开收起的节点                    | moon-hierarchy-node-limit-button | 'node'+ 节点数据中的唯一标识字段对应的数据 |
| rect                                       | moon-hierarchy-rect              | -                                          |
| text                                       | moon-hierarchy-text              | -                                          |
| 展开收起图形                               | moon-hierarchy-plus              | -                                          |
| 连线                                       | moon-hierarchy-link              | 'link'+"起点 id-终点 id"                   |
| 节点鼠标悬浮，该节点对应的所有子节点间连线 | moon-hierarchy-node-hover-link   | 'link'+"起点 id-终点 id"                   |
| 用户自定义视图节点                         | moon-hierarchy-custom-view       | -                                          |

## DefaultStyle

-   可以自行依据项目修改

```CSS
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
```

# Demo

```javascript
   <template>
    <div>
        <div class="pannel">
            <div>
                <button @click="$refs.hierarchy.moveToCenter()">移动到中心</button>
                <button @click="$refs.hierarchy.zoom(1.5)">放大</button>
                <button @click="$refs.hierarchy.zoom(0.5)">缩小</button>
                <button @click="$refs.hierarchy.pauseZoom()">暂停缩放</button>
                <button @click="$refs.hierarchy.continueZoom()">恢复缩放</button>
                <button @click="$refs.hierarchy.expendToNode('qyfxsbpggl', ['click','contextmenu','move'])">展示到指定节点</button>
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
            class="moon-hierarchy"
            :mode="mode"
            :treeData="treeData"
            :treeOptions="treeOptions"
            :layout="layout"
            :negativeIds="['qydak', 'root1', 'root2', 'root3']"
            :config="config"
            :width="width"
            :height="height"
            expendShape=".moon-hierarchy-plus"
            foldShape=".moon-hierarchy-plus"
            @draw-done="onDrawDone"
        >
            <div>
                <ul>
                    <li class="contentmenu-item" @click="onAdd">新增子节点</li>
                    <li class="contentmenu-item" @click="onRemove">删除节点</li>
                    <li class="contentmenu-item" @click="onUpdate">更新数据</li>
                </ul>
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
            treeOptions: { id: 'code', pId: 'pcode' },
            width: 0,
            height: 0
        };
    },
    watch: {},
    computed: {
        config() {
            return {
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
                        click: (e, d, el, svg) => {
                            if (typeof d.data._isexpend == 'boolean') return;
                            svg.selectAll('.active-node').classed('active-node', false);
                            el.classed('active-node', true);
                            this.$emit('node-click', d.data);
                            this.$refs.hierarchy.hiddenCustomView();
                        },
                        contextmenu: (e, d, node, svg) => {
                            e.preventDefault();
                            this.currentNode = d.data;
                            this.$refs.hierarchy.showCustomView(e, d);
                        }
                    },
                    exShaps: this.mode == 'h' ? this.exShaps() : [],
                    plus: {
                        artts: {},
                        show: this.mode != 'h'
                    }
                },
                customView: {
                    width: 120,
                    height: 110,
                    duration: 400
                },
                arrow: {
                    // show: false
                }
            };
        }
    },
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
                this.currentNode[this.treeOptions.id],
                [
                    {
                        id: 'new' + new Date().getTime(),
                        name: '企业信息' + 'new' + new Date().getTime(),
                        code: 'new' + new Date().getTime(),
                        modelType: '',
                        domainId: '',
                        pcode: this.currentNode[this.treeOptions.id]
                    }
                ],
                -1
            );
        },
        onRemove() {
            this.$refs.hierarchy.removeNodeById(this.currentNode[this.treeOptions.id]);
        },
        onUpdate() {
            this.$refs.hierarchy.updateNodeByData({ ...this.currentNode, name: 'hello', children: [] });
        },
        exShaps() {
            let plusCircleWidth = 15;
            function isNonEmptyArray(arr) {
                return arr && arr.length;
            }
            return [
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
                },

                {
                    name: 'g',
                    on: {
                        click: (e) => {
                            console.log('plus click');

                            this.$refs.hierarchy.hiddenCustomView();
                        }
                    },
                    attrs: {
                        class: 'moon-hierarchy-plus',
                        display: (d) => {
                            if (
                                (!isNonEmptyArray(d.data.children) && !isNonEmptyArray(d.data._children)) ||
                                d.data.track.length == 1
                            ) {
                                return 'none';
                            }
                        },
                        transform: (d) =>
                            `translate(${
                                d.data._sign == 1 ? d.data._nodeConfig.nodeWidth + 2 + plusCircleWidth / 2 : -plusCircleWidth
                            },${d.data._nodeConfig.nodeHeight / 2 + 1})`
                    },
                    children: [
                        {
                            name: 'circle',
                            attrs: {
                                class: 'moon-hierarchy-plus-circle',
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
                        /*  {
                            name: 'text',
                            attrs: {
                                display: (d) => {
                                    if (d.data?.children?.length) {
                                        return 'none';
                                    }
                                },
                                x: -4,
                                y: 5
                            },
                            compose: {
                                text(d) {
                                    return 22 + d.data?._children?.length;
                                }
                            }
                        }, */
                        {
                            name: 'line',
                            attrs: {
                                display: (d) => {
                                    if (d.data?.children?.length) {
                                        return 'none';
                                    }
                                },
                                x1: '0',
                                y1: -plusCircleWidth / 4,
                                x2: '0',
                                y2: plusCircleWidth / 4
                            }
                        },
                        {
                            name: 'circle',
                            attrs: {
                                r: plusCircleWidth / 2,
                                'fill-opacity': 0,
                                'stroke-width': '0.5'
                            }
                        }
                    ]
                }
            ];
        }
    }
};
</script>
<style lang="scss" scoped>
.moon-hierarchy {
    ul {
        margin: 0;
        padding: 0;
        list-style: none;
        border: 1px solid;
    }
    li {
        display: list-item;
        text-align: -webkit-match-parent;
        unicode-bidi: isolate;
    }
    .contentmenu-item {
        font-size: 14px;
        position: relative;
        white-space: nowrap;
        overflow: hidden;
        color: #606266;
        height: 34px;
        line-height: 34px;
        box-sizing: border-box;
        cursor: pointer;
        &:hover {
            background-color: #f5f7fa;
        }
    }
    ::v-deep(.moon-hierarchy-node-root) {
        .moon-hierarchy-rect {
            fill: #003bc1;
        }
    }
    ::v-deep(.moon-hierarchy-link) {
        stroke: #1961f5;
        stroke-opacity: 1;
        stroke-width: 1.3;
    }
    ::v-deep(.moon-hierarchy-node) {
        &.moon-hierarchy-node-expend:not(.moon-hierarchy-node-root):not(.active-node) {
            .moon-hierarchy-text {
                fill: rgb(51, 51, 51);
            }
        }
        &.deep-1-node:not(.active-node) {
            .moon-hierarchy-rect {
                fill: #0044fe !important;
            }
            .moon-hierarchy-text {
                fill: #fff !important;
            }
        }
        &.active-node {
            &:not(.moon-hierarchy-node-root) {
                .moon-hierarchy-rect {
                    fill: #003bc1;
                }
                .moon-hierarchy-text {
                    fill: #fff;
                }
            }
        }
        .moon-hierarchy-plus {
            stroke: #1961f5;
            &:hover {
                circle {
                    fill: #5984f1;
                }
                line {
                    stroke: #fff;
                }
            }
        }
    }
    .contentmenu-item {
        font-size: 14px;
        padding: 0 20px;
        position: relative;
        white-space: nowrap;
        overflow: hidden;
        color: #606266;
        height: 34px;
        line-height: 34px;
        box-sizing: border-box;
        cursor: pointer;
        &:hover {
            background-color: #f5f7fa;
        }
    }
}
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


```
