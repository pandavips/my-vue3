import { ShapeFlags } from "../shared/ShapeFlags";

export function initSlots(instance: any, children: any) {
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}

function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const val = children[key];
    slots[key] =
      typeof val === "function"
        ? (props) => {
            return normalizeSlotValue(val(props));
          }
        : normalizeSlotValue(val);
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
