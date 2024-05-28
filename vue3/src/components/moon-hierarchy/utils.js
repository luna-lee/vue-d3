import { cloneDeep, flattenDeep } from 'lodash-es'
import { nanoid } from 'nanoid'
/**
 * @description 类型判断
 * @author 闰月飞鸟
 * @param obj 校验对象
 * @param type 校验类型，可以是字符串或数组，数组为或结果。值为所有类型的实例化名。如Object，Number...
 *  */
export const isType = (obj, type) => {
  if (typeof type === 'string')
    return Object.prototype.toString.call(obj) == `[object ${type}]`
  if (Array.isArray(type))
    return type.some(
      t => Object.prototype.toString.call(obj) == `[object ${t}]`
    )
}
/**
 * @description 利用nanoID得到一个uuid
 * @param prefix id前缀
 *  */
export const getUUID = (prefix = 'uuid') => {
  return prefix + nanoid()
}

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
export const flatToTree = (
  source,
  id = 'id',
  pId = 'pId',
  children = 'children',
  deepClone = true
) => {
  if (!isType(source, 'Array')) {
    console.error('数据源必须是数组')
    return
  }
  let flatData = deepClone
    ? cloneDeep(source)
    : // 当不深度克隆时，移除原始节点中的 children以及track与trigger
      source.map(v => {
        delete v.children
        delete v.track
        delete v.trigger
        return v
      })
  try {
    let treeData = flatData.reduce((arr, item) => {
      // 判断数组项是否符合 树结构类型
      if (!item.hasOwnProperty(id))
        throw `${JSON.stringify(
          item
        )}树形结构数据不准确,数据项中没有指定的id:${id}`
      item[children] = item[children] || []
      item.track = item.track || [item[id]]
      item.trigger = item.trigger || []
      let parent = flatData.find(node => node[id] == item[pId])
      if (!parent) arr.push(item)
      else {
        // track:所有父id，包括自己
        parent.track = parent.track || [parent[id]]
        item.track.push(parent.track)
        // trigger:所有子id
        parent.trigger = parent.trigger || []
        parent.trigger.push(item[id])
        parent.trigger.push(item.trigger)
        parent[children] = parent[children]
          ? [...parent[children], item]
          : [item]
      }
      return arr
    }, [])
    let leafs = []
    // id 为key的对象。将trigger扁平化,获取所有子节点
    let objById = flatData.reduce((obj, item) => {
      item.trigger = flattenDeep(item.trigger)
      item.track = flattenDeep(item.track).reverse()
      item.level = item.track.length
      obj[item[id]] = item
      if (!item[children].length) leafs.push(item)
      return obj
    }, {})

    return {
      treeData,
      leafs,
      objById,
      flatData,
    }
  } catch (error) {
    console.error(error)
    return {
      treeData: [],
      leafs: [],
      objById: {},
      flatData: [],
    }
  }
}
 
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
      return !fun(v, i)
    })
    arr.splice(0, arr.length)
    stay.forEach(v => {
      arr.push(v)
    })
  } else throw 'arrayRemoveItem 参数类型不正确，arr必须是数组，fun必须是函数'
}
