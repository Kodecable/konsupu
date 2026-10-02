export const Brand = (key) => Symbol.for(key);
export function IsObject(value) {
  if (value === null) return false;
  return typeof value === "object" || typeof value === "function";
}
export function OwnBrand(Type) {
  const d = Object.getOwnPropertyDescriptor(Type, "BRAND");
  if (!d || typeof d.value !== "symbol" || Symbol.keyFor(d.value) === void 0) {
    throw new TypeError("Semantic class must own a global BRAND");
  }
  return d.value;
}
export function HasInstance(Type, value) {
  const brand = OwnBrand(Type);
  if (!IsObject(value)) return false;
  return Object.getOwnPropertyDescriptor(value, brand)?.value === true;
}
export function Final(Type, target) {
  if (target !== Type) {
    throw new TypeError("Concrete semantic class cannot be extended");
  }
}
export function InstallBrands(value, Type, Base) {
  const brands = /* @__PURE__ */ new Set();
  for (;;) {
    if (typeof Type !== "function") {
      throw new TypeError("Invalid semantic inheritance");
    }
    const brand = OwnBrand(Type);
    if (brands.has(brand)) {
      throw new TypeError("Duplicate BRAND in class ancestry");
    }
    brands.add(brand);
    if (Type === Base) break;
    Type = Object.getPrototypeOf(Type);
  }
  for (const brand of brands) {
    Object.defineProperty(value, brand, { value: true });
  }
}
