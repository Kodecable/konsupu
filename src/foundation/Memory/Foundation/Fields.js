export function Field(target, key, value, enumerable = true) {
  Object.defineProperty(target, key, {
    value,
    enumerable,
    writable: false,
    configurable: true,
  });
}
export function InstallFields(target, fields, reserved = []) {
  if (fields === null || typeof fields !== "object") {
    throw new TypeError("fields must be an object");
  }
  const entries = Reflect.ownKeys(fields).map((key) => {
    const d = Object.getOwnPropertyDescriptor(fields, key);
    const conflict = reserved.includes(key) || Object.hasOwn(target, key);
    if (conflict || !d || !("value" in d)) {
      throw new TypeError("Invalid semantic data property");
    }
    return [key, d];
  });
  for (const [key, d] of entries) {
    Field(target, key, d.value, d.enumerable);
  }
}
