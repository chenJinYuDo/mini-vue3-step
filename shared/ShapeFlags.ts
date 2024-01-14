export const enum ShapeFlags {
  ELEMENT = 1, // 普通元素
  STATEFUL_COMPONENT = 1 << 1, // 有状态组件
  TEXT_CHILDREN = 1 << 2, // 文本子节点
  ARRAY_CHILDREN = 1 << 3, // 数组子节点
  SLOT_CHILDREN = 1 << 4, // 插槽子节点
}
