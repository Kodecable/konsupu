export function Ancestors(situation, parents) {
  const result = [];
  for (let current = situation; current !== null;) {
    result.push(current);
    if (parents && !parents.has(current)) {
      throw new TypeError("Situation is outside Input");
    }
    current = parents ? parents.get(current) : current.situated;
  }
  return result;
}
export function IsAncestor(ancestor, situated) {
  return Ancestors(situated).includes(ancestor);
}
export function CanImport(destination, source) {
  if (source.situated === destination) return true;
  const tree = new Set(Ancestors(destination));
  return !Ancestors(source).some((node) => tree.has(node));
}
