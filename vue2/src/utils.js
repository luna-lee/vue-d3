import { cloneDeep, flattenDeep } from 'lodash-es';
import { nanoid } from 'nanoid';
/**
 * @description 类型判断
 * @author 闰月飞鸟
 * @param obj 校验对象
 * @param type 校验类型，可以是字符串或数组，数组为或结果。值为所有类型的实例化名。如Object，Number...
 *  */
export const isType = (obj, type) => {
    if (typeof type === 'string') return Object.prototype.toString.call(obj) == `[object ${type}]`;
    if (Array.isArray(type)) return type.some((t) => Object.prototype.toString.call(obj) == `[object ${t}]`);
};
/**
 * @description 利用nanoID得到一个uuid
 * @param prefix id前缀
 *  */
export const getUUID = (prefix = 'uuid') => {
    return prefix + nanoid();
};

/**
 * @description 设置window 或document事件监听,同时当所在的vue实例销毁时自动移除监听
 * @author 闰月飞鸟
 * @param binder 指定window 或document  必传
 * @param vm vue实例 必传
 * @param evtName  事件名 必传
 * @param listener  监听函数 必传
 * @param options 监听本身参数
 * @return 返回一个移除监听函数
 *  */
export const setEventListener = (binder, vm, evtName, listener, options) => {
    if (!binder || !vm || !evtName || !listener) {
        return;
    }
    // 只有在当前视图下的vm才触发响应
    const _listener = (...arg) => {
        let { width, height } = vm.$el.getBoundingClientRect();
        if (!width || !height) return;
        listener(...arg);
    };
    const remove = () => {
        binder.removeEventListener(evtName, _listener);
    };
    const add = () => {
        remove();
        binder.addEventListener(evtName, _listener, options);
    };
    add();
    vm.$on('hook:mounted', add);
    vm.$on('hook:activated', add);
    vm.$on('hook:deactivated', remove);
    vm.$once('hook:beforeDestroy', () => {
        remove();
    });
    return remove;
};

/**
 * @description 监听当前实例对应的路由，避免在keepalive模式下重复调用监听函数。
 * @author 闰月飞鸟
 * @param vm vue实例 必传
 * @param fun 路由变化触发回调函数，参数为当前路由对象
 *  */
export const setWatchRoute = (vm, fun) => {
    // 记录当前实例对应的路由
    vm.__memory_route__ = { name: '' };
    vm.__unwatch__ = null;
    function setWatch() {
        if (!vm.__unwatch__)
            vm.__unwatch__ = vm.$watch(
                '$route',
                () => {
                    // 初始化
                    if (!vm.__memory_route__.name) {
                        vm.__memory_route__ = vm.$route;
                        fun(vm.$route);
                    } else {
                        // 当前路由的name，与实例对应的路由的name不一致时，不做任何处理
                        if (vm.__memory_route__.name == vm.$route.name) {
                            //只有参数发生改变时才执行回调,避免缓存失效
                            let jsonStr = JSON.stringify([vm.__memory_route__.params, vm.__memory_route__.query]);
                            let jsonStr2 = JSON.stringify([vm.$route.params, vm.$route.query]);
                            // 当前路由的name，与实例对应的路由的name一致时，且参数不一样时触发回调函数
                            if (jsonStr != jsonStr2) {
                                vm.__memory_route__ = vm.$route;
                                fun(vm.$route);
                            }
                        }
                    }
                },
                { deep: true, immediate: true }
            );
    }
    function offWatch() {
        vm.__unwatch__ && vm.__unwatch__();
        vm.__unwatch__ = null;
    }
    setWatch();
    vm.$on('hook:activated', () => setWatch());
    vm.$on('hook:deactivated', () => offWatch());
};

/**
 * @description  树形数据格式化
 * @author 闰月飞鸟
 * @param {*} source
 * @param {*} id
 * @param {*} pId
 * @param {*} children
 * @param {*} deepClone
 * @return {treeData,leafs,objById,flatData}
 * @description  treeData 格式化后的树数据
 * @description  leafs 所有叶子节点
 * @description  objById 以id为key的对象
 * @description  flatData  原始扁平数组，由于格式化是同一个引用，扁平数组中也有层级
 * @return  返回的数组对象中，对象属性新增两个属性
 * @return {track} 所有当前节点的父节点id，包括自身ID
 * @return {trigger} 所有当前节点的子节点id，不包含自身ID
 */
export const flatToTree = (source, id = 'id', pId = 'pId', children = 'children', deepClone = true) => {
    if (!isType(source, 'Array')) {
        console.error('数据源必须是数组');
        return;
    }
    let flatData = deepClone
        ? cloneDeep(source)
        : // 当不深度克隆时，移除原始节点中的 children以及track与trigger
          source.map((v) => {
              delete v.children;
              delete v.track;
              delete v.trigger;
              return v;
          });
    try {
        let treeData = flatData.reduce((arr, item) => {
            // 判断数组项是否符合 树结构类型
            if (!item.hasOwnProperty(id)) throw `${JSON.stringify(item)}树形结构数据不准确,数据项中没有指定的id:${id}`;
            item[children] = item[children] || [];
            item.track = item.track || [item[id]];
            item.trigger = item.trigger || [];
            let parent = flatData.find((node) => node[id] == item[pId]);
            if (!parent) arr.push(item);
            else {
                // track:所有父id，包括自己
                parent.track = parent.track || [parent[id]];
                item.track.push(parent.track);
                // trigger:所有子id
                parent.trigger = parent.trigger || [];
                parent.trigger.push(item[id]);
                parent.trigger.push(item.trigger);
                parent[children] = parent[children] ? [...parent[children], item] : [item];
            }
            return arr;
        }, []);
        let leafs = [];
        // id 为key的对象。将trigger扁平化,获取所有子节点
        let objById = flatData.reduce((obj, item) => {
            item.trigger = flattenDeep(item.trigger);
            item.track = flattenDeep(item.track).reverse();
            item.level = item.track.length;
            obj[item[id]] = item;
            if (!item[children].length) leafs.push(item);
            return obj;
        }, {});

        return {
            treeData,
            leafs,
            objById,
            flatData
        };
    } catch (error) {
        console.error(error);
        return {
            treeData: [],
            leafs: [],
            objById: {},
            flatData: []
        };
    }
};

/**
 * @description   拷贝扁平化的树形结构数据,即更新id与pId
 * @author 闰月飞鸟
 * @param {*} id
 * @param {*} pId
 * @param {*} defaultPid 默认pid,当pid不是当前数组中任何一个对象时设置默值。
 * @param {*} custom 自定义替换对象
 * @param {*} customFunction 自定义替换函数
 *
 */
export const copyFlatData = ({ source, id = 'id', pId = 'pId', defaultPid = '', custom = {}, customFunction }) => {
    if (!isType(source, 'Array')) {
        console.error('数据源必须是数组');
        return;
    }
    let flatData = cloneDeep(source);
    // get id  newId map
    let idMap = flatData.reduce((obj, item) => {
        obj[item[id]] = getUUID();
        return obj;
    }, {});
    idMap = { ...idMap, ...custom };
    return flatData.map((v) => {
        let oldObj = cloneDeep(v);
        v[id] = idMap[v[id]];
        if (v[pId] && idMap[v[pId]]) v[pId] = idMap[v[pId]];
        else v[pId] = defaultPid;
        if (customFunction) customFunction({ current: v, oldObj, idMap });
        return v;
    });
};
/**
 * @description  移除两个字符串的空格换行符tab符号后判断是否相等。
 * @author 闰月飞鸟
 * @param {*} str1 string
 * @param {*} str1 string
 * @return Boolean
 */
export const equalsString = (str1, str2) => {
    return (
        isType(str1, 'String') &&
        isType(str2, 'String') &&
        str1.replace(/\s|\\n|\\r|\\t/gms, '') == str2.replace(/\s|\\n|\\r|\\t/gms, '')
    );
};

//
/**
 * @description  异步添加dom元素
 * @author 闰月飞鸟
 * @param {*} el 元素名
 * @param {*} attrs  元素属性
 * @param {*} appendToElement  添加到的目标元素,默认document.head
 * @return Boolean
 */
export const asyncLoadElement = (elementName, attrs, appendToElement = document.head) => {
    let id = attrs.id;
    if (!elementName || (id && document.getElementById(id))) {
        return false;
    }
    return new Promise((resolve) => {
        let el = document.createElement(elementName);
        Object.keys(attrs).map((key) => {
            el.setAttribute(key, attrs[key]);
        });
        appendToElement.appendChild(el);
        el.onload = () => {
            resolve(true);
        };
    });
};

/**
 * @description  在不修改当前引用的基础上 ，批量移除元素。数组依据条件函数，
 * @author 闰月飞鸟
 * @param {*} arr 目标数组
 * @param {*} fun 移除迭代函数，接受两个参数，当前项item，以及下标index。
 *   @return Boolean,返回true时，代表要移除该项
 */
export const arrayRemoveItem = (arr, fun) => {
    if (isType(arr, 'Array') && isType(fun, 'Function')) {
        let stay = arr.filter((v, i) => {
            return !fun(v, i);
        });
        arr.splice(0, arr.length);
        stay.forEach((v) => {
            arr.push(v);
        });
    } else throw 'arrayRemoveItem 参数类型不正确，arr必须是数组，fun必须是函数';
};
