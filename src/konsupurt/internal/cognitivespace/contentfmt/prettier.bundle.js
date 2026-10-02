(() => {
  var __defProp = Object.defineProperty;
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
  var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
  var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
  var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
  var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

  // ../package/standalone.mjs
  var Ru = Object.defineProperty;
  var yt = (t, e3) => {
    for (var r3 in e3) Ru(t, r3, { get: e3[r3], enumerable: true });
  };
  var Su = {};
  yt(Su, { __debug: () => $i, check: () => Vi, doc: () => ar, format: () => Pu, formatWithCursor: () => Ou, getSupportInfo: () => Wi, util: () => fr, version: () => gu });
  var X = (t, e3) => (r3, n, ...u) => r3 | 1 && n == null ? void 0 : (e3.call(n) ?? n[t]).apply(n, u);
  var vu = String.prototype.replaceAll ?? function(t, e3) {
    return t.global ? this.replace(t, e3) : this.split(t).join(e3);
  };
  var Lu = X("replaceAll", function() {
    if (typeof this == "string") return vu;
  });
  var ne = Lu;
  var Ne = class {
    diff(e3, r3, n = {}) {
      let u;
      typeof n == "function" ? (u = n, n = {}) : "callback" in n && (u = n.callback);
      let o = this.castInput(e3, n), i = this.castInput(r3, n), D = this.removeEmpty(this.tokenize(o, n)), s = this.removeEmpty(this.tokenize(i, n));
      return this.diffWithOptionsObj(D, s, n, u);
    }
    diffWithOptionsObj(e3, r3, n, u) {
      var o;
      let i = (C3) => {
        if (C3 = this.postProcess(C3, n), u) {
          setTimeout(function() {
            u(C3);
          }, 0);
          return;
        } else return C3;
      }, D = r3.length, s = e3.length, a = 1, c = D + s;
      n.maxEditLength != null && (c = Math.min(c, n.maxEditLength));
      let p4 = (o = n.timeout) !== null && o !== void 0 ? o : 1 / 0, l3 = Date.now() + p4, m4 = [{ oldPos: -1, lastComponent: void 0 }], f = this.extractCommon(m4[0], r3, e3, 0, n);
      if (m4[0].oldPos + 1 >= s && f + 1 >= D) return i(this.buildValues(m4[0].lastComponent, r3, e3));
      let F3 = -1 / 0, d3 = 1 / 0, E = () => {
        for (let C3 = Math.max(F3, -a); C3 <= Math.min(d3, a); C3 += 2) {
          let h, _3 = m4[C3 - 1], P3 = m4[C3 + 1];
          _3 && (m4[C3 - 1] = void 0);
          let A = false;
          if (P3) {
            let J4 = P3.oldPos - C3;
            A = P3 && 0 <= J4 && J4 < D;
          }
          let B4 = _3 && _3.oldPos + 1 < s;
          if (!A && !B4) {
            m4[C3] = void 0;
            continue;
          }
          if (!B4 || A && _3.oldPos < P3.oldPos ? h = this.addToPath(P3, true, false, 0, n) : h = this.addToPath(_3, false, true, 1, n), f = this.extractCommon(h, r3, e3, C3, n), h.oldPos + 1 >= s && f + 1 >= D) return i(this.buildValues(h.lastComponent, r3, e3)) || true;
          m4[C3] = h, h.oldPos + 1 >= s && (d3 = Math.min(d3, C3 - 1)), f + 1 >= D && (F3 = Math.max(F3, C3 + 1));
        }
        a++;
      };
      if (u) (function C3() {
        setTimeout(function() {
          if (a > c || Date.now() > l3) return u(void 0);
          E() || C3();
        }, 0);
      })();
      else for (; a <= c && Date.now() <= l3; ) {
        let C3 = E();
        if (C3) return C3;
      }
    }
    addToPath(e3, r3, n, u, o) {
      let i = e3.lastComponent;
      return i && !o.oneChangePerToken && i.added === r3 && i.removed === n ? { oldPos: e3.oldPos + u, lastComponent: { count: i.count + 1, added: r3, removed: n, previousComponent: i.previousComponent } } : { oldPos: e3.oldPos + u, lastComponent: { count: 1, added: r3, removed: n, previousComponent: i } };
    }
    extractCommon(e3, r3, n, u, o) {
      let i = r3.length, D = n.length, s = e3.oldPos, a = s - u, c = 0;
      for (; a + 1 < i && s + 1 < D && this.equals(n[s + 1], r3[a + 1], o); ) a++, s++, c++, o.oneChangePerToken && (e3.lastComponent = { count: 1, previousComponent: e3.lastComponent, added: false, removed: false });
      return c && !o.oneChangePerToken && (e3.lastComponent = { count: c, previousComponent: e3.lastComponent, added: false, removed: false }), e3.oldPos = s, a;
    }
    equals(e3, r3, n) {
      return n.comparator ? n.comparator(e3, r3) : e3 === r3 || !!n.ignoreCase && e3.toLowerCase() === r3.toLowerCase();
    }
    removeEmpty(e3) {
      let r3 = [];
      for (let n = 0; n < e3.length; n++) e3[n] && r3.push(e3[n]);
      return r3;
    }
    castInput(e3, r3) {
      return e3;
    }
    tokenize(e3, r3) {
      return Array.from(e3);
    }
    join(e3) {
      return e3.join("");
    }
    postProcess(e3, r3) {
      return e3;
    }
    get useLongestToken() {
      return false;
    }
    buildValues(e3, r3, n) {
      let u = [], o;
      for (; e3; ) u.push(e3), o = e3.previousComponent, delete e3.previousComponent, e3 = o;
      u.reverse();
      let i = u.length, D = 0, s = 0, a = 0;
      for (; D < i; D++) {
        let c = u[D];
        if (c.removed) c.value = this.join(n.slice(a, a + c.count)), a += c.count;
        else {
          if (!c.added && this.useLongestToken) {
            let p4 = r3.slice(s, s + c.count);
            p4 = p4.map(function(l3, m4) {
              let f = n[a + m4];
              return f.length > l3.length ? f : l3;
            }), c.value = this.join(p4);
          } else c.value = this.join(r3.slice(s, s + c.count));
          s += c.count, c.added || (a += c.count);
        }
      }
      return u;
    }
  };
  var At = class extends Ne {
    tokenize(e3) {
      return e3.slice();
    }
    join(e3) {
      return e3;
    }
    removeEmpty(e3) {
      return e3;
    }
  };
  var pr = new At();
  function xt(t, e3, r3) {
    return pr.diff(t, e3, r3);
  }
  var Mu = () => {
  };
  var k = Mu;
  var dr = "cr";
  var Fr = "crlf";
  var Yu = "lf";
  var ju = Yu;
  var Bt = "\r";
  var Er = `\r
`;
  var ze = `
`;
  var Uu = ze;
  function Cr(t) {
    let e3 = t.indexOf(Bt);
    return e3 !== -1 ? t.charAt(e3 + 1) === ze ? Fr : dr : ju;
  }
  function we(t) {
    return t === dr ? Bt : t === Fr ? Er : Uu;
  }
  var Vu = /* @__PURE__ */ new Map([[ze, /\n/g], [Bt, /\r/g], [Er, /\r\n/g]]);
  function Tt(t, e3) {
    let r3 = Vu.get(e3);
    return t.match(r3)?.length ?? 0;
  }
  var Wu = /\r\n?/g;
  function hr(t) {
    return ne(0, t, Wu, ze);
  }
  var ue = /* @__PURE__ */ Symbol.for("comments");
  function $u(t) {
    return this[t < 0 ? this.length + t : t];
  }
  var zu = X("at", function() {
    if (Array.isArray(this) || typeof this == "string") return $u;
  });
  var y = zu;
  var G = "string";
  var U = "array";
  var V = "cursor";
  var I = "indent";
  var R = "align";
  var v = "trim";
  var x = "group";
  var S = "fill";
  var T = "if-break";
  var L = "indent-if-break";
  var M = "line-suffix";
  var Y = "line-suffix-boundary";
  var g = "line";
  var b = "label";
  var N = "break-parent";
  var Ge = /* @__PURE__ */ new Set([V, I, R, v, x, S, T, L, M, Y, g, b, N]);
  function gr(t) {
    let e3 = t.length;
    for (; e3 > 0 && (t[e3 - 1] === "\r" || t[e3 - 1] === `
`); ) e3--;
    return e3 < t.length ? t.slice(0, e3) : t;
  }
  function Fe(t, e3, r3) {
    if (!t.has(e3)) {
      let n = r3(e3);
      t.set(e3, n);
    }
    return t.get(e3);
  }
  function Gu(t) {
    if (typeof t == "string") return G;
    if (Array.isArray(t)) return U;
    if (!t) return;
    let { type: e3 } = t;
    if (Ge.has(e3)) return e3;
  }
  var q = Gu;
  var Ku = (t) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(t);
  function Hu(t) {
    let e3 = t === null ? "null" : typeof t;
    if (e3 !== "string" && e3 !== "object") return `Unexpected doc '${e3}', 
Expected it to be 'string' or 'object'.`;
    if (q(t)) throw new Error("doc is valid.");
    let r3 = Object.prototype.toString.call(t);
    if (r3 !== "[object Object]") return `Unexpected doc '${r3}'.`;
    let n = Ku([...Ge].map((u) => `'${u}'`));
    return `Unexpected doc.type '${t.type}'.
Expected it to be ${n}.`;
  }
  var Nt = class extends Error {
    constructor(e3) {
      super(Hu(e3));
      __publicField(this, "name", "InvalidDocError");
      this.doc = e3;
    }
  };
  var Z = Nt;
  var _r = {};
  function Ju(t, e3, r3, n) {
    let u = [t];
    for (; u.length > 0; ) {
      let o = u.pop();
      if (o === _r) {
        r3(u.pop());
        continue;
      }
      r3 && u.push(o, _r);
      let i = q(o);
      if (!i) throw new Z(o);
      if (e3?.(o) !== false) switch (i) {
        case U:
        case S: {
          let D = i === U ? o : o.parts;
          for (let s = D.length, a = s - 1; a >= 0; --a) u.push(D[a]);
          break;
        }
        case T:
          u.push(o.flatContents, o.breakContents);
          break;
        case x:
          if (n && o.expandedStates) for (let D = o.expandedStates.length, s = D - 1; s >= 0; --s) u.push(o.expandedStates[s]);
          else u.push(o.contents);
          break;
        case R:
        case I:
        case L:
        case b:
        case M:
          u.push(o.contents);
          break;
        case G:
        case V:
        case v:
        case Y:
        case g:
        case N:
          break;
        default:
          throw new Z(o);
      }
    }
  }
  var Oe = Ju;
  function Se(t, e3) {
    if (typeof t == "string") return e3(t);
    let r3 = /* @__PURE__ */ new Map();
    return n(t);
    function n(o) {
      return Fe(r3, o, u);
    }
    function u(o) {
      switch (q(o)) {
        case U:
          return e3(o.map(n));
        case S:
          return e3({ ...o, parts: o.parts.map(n) });
        case T:
          return e3({ ...o, breakContents: n(o.breakContents), flatContents: n(o.flatContents) });
        case x: {
          let { expandedStates: i, contents: D } = o;
          return i ? (i = i.map(n), D = i[0]) : D = n(D), e3({ ...o, contents: D, expandedStates: i });
        }
        case R:
        case I:
        case L:
        case b:
        case M:
          return e3({ ...o, contents: n(o.contents) });
        case G:
        case V:
        case v:
        case Y:
        case g:
        case N:
          return e3(o);
        default:
          throw new Z(o);
      }
    }
  }
  function Ke(t, e3, r3) {
    let n = r3, u = false;
    function o(i) {
      if (u) return false;
      let D = e3(i);
      D !== void 0 && (u = true, n = D);
    }
    return Oe(t, o), n;
  }
  function qu(t) {
    if (t.type === x && t.break || t.type === g && t.hard || t.type === N) return true;
  }
  function xr(t) {
    return Ke(t, qu, false);
  }
  function yr(t) {
    if (t.length > 0) {
      let e3 = y(0, t, -1);
      !e3.expandedStates && !e3.break && (e3.break = "propagated");
    }
    return null;
  }
  function Br(t) {
    let e3 = /* @__PURE__ */ new Set(), r3 = [];
    function n(o) {
      if (o.type === N && yr(r3), o.type === x) {
        if (r3.push(o), e3.has(o)) return false;
        e3.add(o);
      }
    }
    function u(o) {
      o.type === x && r3.pop().break && yr(r3);
    }
    Oe(t, n, u, true);
  }
  function Xu(t) {
    return t.type === g && !t.hard ? t.soft ? "" : " " : t.type === T ? t.flatContents : t;
  }
  function Tr(t) {
    return Se(t, Xu);
  }
  function Ar(t) {
    for (t = [...t]; t.length >= 2 && y(0, t, -2).type === g && y(0, t, -1).type === N; ) t.length -= 2;
    if (t.length > 0) {
      let e3 = Pe(y(0, t, -1));
      t[t.length - 1] = e3;
    }
    return t;
  }
  function Pe(t) {
    switch (q(t)) {
      case I:
      case L:
      case x:
      case M:
      case b: {
        let e3 = Pe(t.contents);
        return { ...t, contents: e3 };
      }
      case T:
        return { ...t, breakContents: Pe(t.breakContents), flatContents: Pe(t.flatContents) };
      case S:
        return { ...t, parts: Ar(t.parts) };
      case U:
        return Ar(t);
      case G:
        return gr(t);
      case R:
      case V:
      case v:
      case Y:
      case g:
      case N:
        break;
      default:
        throw new Z(t);
    }
    return t;
  }
  function He(t) {
    return Pe(Zu(t));
  }
  function Qu(t) {
    switch (q(t)) {
      case S: {
        let { parts: e3 } = t;
        if (e3.every((r3) => r3 === "")) return "";
        if (e3.length === 1) return e3[0];
        break;
      }
      case x:
        if (!t.contents && !t.id && !t.break && !t.expandedStates) return "";
        if (t.contents.type === x && t.contents.id === t.id && t.contents.break === t.break && t.contents.expandedStates === t.expandedStates) return t.contents;
        break;
      case R:
      case I:
      case L:
      case M:
        if (!t.contents) return "";
        break;
      case T:
        if (!t.flatContents && !t.breakContents) return "";
        break;
      case U: {
        let e3 = [];
        for (let r3 of t) {
          if (!r3) continue;
          let [n, ...u] = Array.isArray(r3) ? r3 : [r3];
          typeof n == "string" && typeof y(0, e3, -1) == "string" ? e3[e3.length - 1] += n : e3.push(n), e3.push(...u);
        }
        return e3.length === 0 ? "" : e3.length === 1 ? e3[0] : e3;
      }
      case G:
      case V:
      case v:
      case Y:
      case g:
      case b:
      case N:
        break;
      default:
        throw new Z(t);
    }
    return t;
  }
  function Zu(t) {
    return Se(t, (e3) => Qu(e3));
  }
  function Nr(t, e3 = Je) {
    return Se(t, (r3) => typeof r3 == "string" ? be(e3, r3.split(`
`)) : r3);
  }
  function eo(t) {
    if (t.type === g) return true;
  }
  function wr(t) {
    return Ke(t, eo, false);
  }
  function Ee(t, e3) {
    return t.type === b ? { ...t, contents: e3(t.contents) } : e3(t);
  }
  var w = k;
  var qe = k;
  var Or = k;
  var Pr = k;
  function oe(t) {
    return w(t), { type: I, contents: t };
  }
  function De(t, e3) {
    return Pr(t), w(e3), { type: R, contents: e3, n: t };
  }
  function Sr(t) {
    return De(Number.NEGATIVE_INFINITY, t);
  }
  function Xe(t) {
    return De({ type: "root" }, t);
  }
  function br(t) {
    return De(-1, t);
  }
  function Qe(t, e3, r3) {
    w(t);
    let n = t;
    if (e3 > 0) {
      for (let u = 0; u < Math.floor(e3 / r3); ++u) n = oe(n);
      n = De(e3 % r3, n), n = De(Number.NEGATIVE_INFINITY, n);
    }
    return n;
  }
  var ae = { type: N };
  var ee = { type: V };
  function kr(t) {
    return Or(t), { type: S, parts: t };
  }
  function wt(t, e3 = {}) {
    return w(t), qe(e3.expandedStates, true), { type: x, id: e3.id, contents: t, break: !!e3.shouldBreak, expandedStates: e3.expandedStates };
  }
  function Ir(t, e3) {
    return wt(t[0], { ...e3, expandedStates: t });
  }
  function Rr(t, e3 = "", r3 = {}) {
    return w(t), e3 !== "" && w(e3), { type: T, breakContents: t, flatContents: e3, groupId: r3.groupId };
  }
  function vr(t, e3) {
    return w(t), { type: L, contents: t, groupId: e3.groupId, negate: e3.negate };
  }
  function be(t, e3) {
    w(t), qe(e3);
    let r3 = [];
    for (let n = 0; n < e3.length; n++) n !== 0 && r3.push(t), r3.push(e3[n]);
    return r3;
  }
  function Lr(t, e3) {
    return w(e3), t ? { type: b, label: t, contents: e3 } : e3;
  }
  var Ze = { type: g };
  var Mr = { type: g, soft: true };
  var ke = { type: g, hard: true };
  var W = [ke, ae];
  var Ot = { type: g, hard: true, literal: true };
  var Je = [Ot, ae];
  function Ie(t) {
    return w(t), { type: M, contents: t };
  }
  var Yr = { type: Y };
  var jr = { type: v };
  function te(t) {
    if (!t) return "";
    if (Array.isArray(t)) {
      let e3 = [];
      for (let r3 of t) if (Array.isArray(r3)) e3.push(...te(r3));
      else {
        let n = te(r3);
        n !== "" && e3.push(n);
      }
      return e3;
    }
    return t.type === T ? { ...t, breakContents: te(t.breakContents), flatContents: te(t.flatContents) } : t.type === x ? { ...t, contents: te(t.contents), expandedStates: t.expandedStates?.map(te) } : t.type === S ? { type: "fill", parts: t.parts.map(te) } : t.contents ? { ...t, contents: te(t.contents) } : t;
  }
  function Ur(t) {
    let e3 = /* @__PURE__ */ Object.create(null), r3 = /* @__PURE__ */ new Set();
    return n(te(t));
    function n(o, i, D) {
      if (typeof o == "string") return JSON.stringify(o);
      if (Array.isArray(o)) {
        let s = o.map(n).filter(Boolean);
        return s.length === 1 ? s[0] : `[${s.join(", ")}]`;
      }
      if (o.type === g) {
        let s = D?.[i + 1]?.type === N;
        return o.literal ? s ? "literalline" : "literallineWithoutBreakParent" : o.hard ? s ? "hardline" : "hardlineWithoutBreakParent" : o.soft ? "softline" : "line";
      }
      if (o.type === N) return D?.[i - 1]?.type === g && D[i - 1].hard ? void 0 : "breakParent";
      if (o.type === v) return "trim";
      if (o.type === I) return "indent(" + n(o.contents) + ")";
      if (o.type === R) return o.n === Number.NEGATIVE_INFINITY ? "dedentToRoot(" + n(o.contents) + ")" : o.n < 0 ? "dedent(" + n(o.contents) + ")" : o.n.type === "root" ? "markAsRoot(" + n(o.contents) + ")" : "align(" + JSON.stringify(o.n) + ", " + n(o.contents) + ")";
      if (o.type === T) return "ifBreak(" + n(o.breakContents) + (o.flatContents ? ", " + n(o.flatContents) : "") + (o.groupId ? (o.flatContents ? "" : ', ""') + `, { groupId: ${u(o.groupId)} }` : "") + ")";
      if (o.type === L) {
        let s = [];
        o.negate && s.push("negate: true"), o.groupId && s.push(`groupId: ${u(o.groupId)}`);
        let a = s.length > 0 ? `, { ${s.join(", ")} }` : "";
        return `indentIfBreak(${n(o.contents)}${a})`;
      }
      if (o.type === x) {
        let s = [];
        o.break && o.break !== "propagated" && s.push("shouldBreak: true"), o.id && s.push(`id: ${u(o.id)}`);
        let a = s.length > 0 ? `, { ${s.join(", ")} }` : "";
        return o.expandedStates ? `conditionalGroup([${o.expandedStates.map((c) => n(c)).join(",")}]${a})` : `group(${n(o.contents)}${a})`;
      }
      if (o.type === S) return `fill([${o.parts.map((s) => n(s)).join(", ")}])`;
      if (o.type === M) return "lineSuffix(" + n(o.contents) + ")";
      if (o.type === Y) return "lineSuffixBoundary";
      if (o.type === b) return `label(${JSON.stringify(o.label)}, ${n(o.contents)})`;
      if (o.type === V) return "cursor";
      throw new Error("Unknown doc type " + o.type);
    }
    function u(o) {
      if (typeof o != "symbol") return JSON.stringify(String(o));
      if (o in e3) return e3[o];
      let i = o.description || "symbol";
      for (let D = 0; ; D++) {
        let s = i + (D > 0 ? ` #${D}` : "");
        if (!r3.has(s)) return r3.add(s), e3[o] = `Symbol.for(${JSON.stringify(s)})`;
      }
    }
  }
  var Vr = () => /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
  var Wr = 12288;
  var $r = 65510;
  var zr = [12288, 12288, 65281, 65376, 65504, 65510];
  var Gr = 4352;
  var Kr = 262141;
  var Pt = [4352, 4447, 8986, 8987, 9001, 9002, 9193, 9196, 9200, 9200, 9203, 9203, 9725, 9726, 9748, 9749, 9776, 9783, 9800, 9811, 9855, 9855, 9866, 9871, 9875, 9875, 9889, 9889, 9898, 9899, 9917, 9918, 9924, 9925, 9934, 9934, 9940, 9940, 9962, 9962, 9970, 9971, 9973, 9973, 9978, 9978, 9981, 9981, 9989, 9989, 9994, 9995, 10024, 10024, 10060, 10060, 10062, 10062, 10067, 10069, 10071, 10071, 10133, 10135, 10160, 10160, 10175, 10175, 11035, 11036, 11088, 11088, 11093, 11093, 11904, 11929, 11931, 12019, 12032, 12245, 12272, 12287, 12289, 12350, 12353, 12438, 12441, 12543, 12549, 12591, 12593, 12686, 12688, 12773, 12783, 12830, 12832, 12871, 12880, 42124, 42128, 42182, 43360, 43388, 44032, 55203, 63744, 64255, 65040, 65049, 65072, 65106, 65108, 65126, 65128, 65131, 94176, 94180, 94192, 94198, 94208, 101589, 101631, 101662, 101760, 101874, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110882, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110951, 110960, 111355, 119552, 119638, 119648, 119670, 126980, 126980, 127183, 127183, 127374, 127374, 127377, 127386, 127488, 127490, 127504, 127547, 127552, 127560, 127568, 127569, 127584, 127589, 127744, 127776, 127789, 127797, 127799, 127868, 127870, 127891, 127904, 127946, 127951, 127955, 127968, 127984, 127988, 127988, 127992, 128062, 128064, 128064, 128066, 128252, 128255, 128317, 128331, 128334, 128336, 128359, 128378, 128378, 128405, 128406, 128420, 128420, 128507, 128591, 128640, 128709, 128716, 128716, 128720, 128722, 128725, 128728, 128732, 128735, 128747, 128748, 128756, 128764, 128992, 129003, 129008, 129008, 129292, 129338, 129340, 129349, 129351, 129535, 129648, 129660, 129664, 129674, 129678, 129734, 129736, 129736, 129741, 129756, 129759, 129770, 129775, 129784, 131072, 196605, 196608, 262141];
  var St = (t, e3) => {
    let r3 = 0, n = Math.floor(t.length / 2) - 1;
    for (; r3 <= n; ) {
      let u = Math.floor((r3 + n) / 2), o = u * 2;
      if (e3 < t[o]) n = u - 1;
      else if (e3 > t[o + 1]) r3 = u + 1;
      else return true;
    }
    return false;
  };
  var Hr = 19968;
  var [to, ro] = no(Pt);
  function no(t) {
    let e3 = t[0], r3 = t[1];
    for (let n = 0; n < t.length; n += 2) {
      let u = t[n], o = t[n + 1];
      if (Hr >= u && Hr <= o) return [u, o];
      o - u > r3 - e3 && (e3 = u, r3 = o);
    }
    return [e3, r3];
  }
  var bt = (t) => t < Wr || t > $r ? false : St(zr, t);
  var kt = (t) => t >= to && t <= ro ? true : t < Gr || t > Kr ? false : St(Pt, t);
  var uo = /^(?:[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u2764\u27A1\u2934\u2935\u2B05-\u2B07]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF3\uDFF5\uDFF7]|\uD83D[\uDC3F\uDC41\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])$/;
  var Jr = (t) => uo.test(t);
  var oo = /[^\x20-\x7F]/;
  function io(t) {
    if (!t) return 0;
    if (!oo.test(t)) return t.length;
    let e3 = 0;
    t = t.replace(Vr(), (r3) => (e3 += Jr(r3) ? 1 : 2, ""));
    for (let r3 of t) {
      let n = r3.codePointAt(0);
      n <= 31 || n >= 127 && n <= 159 || n >= 768 && n <= 879 || n >= 65024 && n <= 65039 || (e3 += bt(n) || kt(n) ? 2 : 1);
    }
    return e3;
  }
  var Re = io;
  var so = { type: 0 };
  var Do = { type: 1 };
  var It = { value: "", length: 0, queue: [], get root() {
    return It;
  } };
  function qr(t, e3, r3) {
    let n = e3.type === 1 ? t.queue.slice(0, -1) : [...t.queue, e3], u = "", o = 0, i = 0, D = 0;
    for (let f of n) switch (f.type) {
      case 0:
        c(), r3.useTabs ? s(1) : a(r3.tabWidth);
        break;
      case 3: {
        let { string: F3 } = f;
        c(), u += F3, o += F3.length;
        break;
      }
      case 2: {
        let { width: F3 } = f;
        i += 1, D += F3;
        break;
      }
      default:
        throw new Error(`Unexpected indent comment '${f.type}'.`);
    }
    return l3(), { ...t, value: u, length: o, queue: n };
    function s(f) {
      u += "	".repeat(f), o += r3.tabWidth * f;
    }
    function a(f) {
      u += " ".repeat(f), o += f;
    }
    function c() {
      r3.useTabs ? p4() : l3();
    }
    function p4() {
      i > 0 && s(i), m4();
    }
    function l3() {
      D > 0 && a(D), m4();
    }
    function m4() {
      i = 0, D = 0;
    }
  }
  function Xr(t, e3, r3) {
    if (!e3) return t;
    if (e3.type === "root") return { ...t, root: t };
    if (e3 === Number.NEGATIVE_INFINITY) return t.root;
    let n;
    return typeof e3 == "number" ? e3 < 0 ? n = Do : n = { type: 2, width: e3 } : n = { type: 3, string: e3 }, qr(t, n, r3);
  }
  function Qr(t, e3) {
    return qr(t, so, e3);
  }
  function ao(t) {
    let e3 = 0;
    for (let r3 = t.length - 1; r3 >= 0; r3--) {
      let n = t[r3];
      if (n === " " || n === "	") e3++;
      else break;
    }
    return e3;
  }
  function et(t) {
    let e3 = ao(t);
    return { text: e3 === 0 ? t : t.slice(0, t.length - e3), count: e3 };
  }
  var _t, _e, _n, _u, _r2, _Rt_instances, o_fn, _a;
  var Rt = (_a = class {
    constructor() {
      __privateAdd(this, _Rt_instances);
      __privateAdd(this, _t, []);
      __privateAdd(this, _e, "");
      __privateAdd(this, _n, 0);
      __privateAdd(this, _u, []);
      __privateAdd(this, _r2, []);
    }
    markPosition() {
      if (__privateGet(this, _u).length + __privateGet(this, _r2).length >= 2) throw new Error("There are too many 'cursor' in doc.");
      __privateGet(this, _r2).push(__privateGet(this, _n) + __privateGet(this, _e).length);
    }
    write(e3) {
      __privateSet(this, _e, __privateGet(this, _e) + e3);
    }
    trim() {
      let { text: e3, count: r3 } = et(__privateGet(this, _e));
      return __privateSet(this, _e, e3), __privateMethod(this, _Rt_instances, o_fn).call(this), r3;
    }
    finish() {
      return __privateMethod(this, _Rt_instances, o_fn).call(this), { text: __privateGet(this, _t).join(""), positions: __privateGet(this, _u) };
    }
  }, _t = new WeakMap(), _e = new WeakMap(), _n = new WeakMap(), _u = new WeakMap(), _r2 = new WeakMap(), _Rt_instances = new WeakSet(), o_fn = function() {
    let e3 = __privateGet(this, _e);
    e3 !== "" && (__privateGet(this, _t).push(e3), __privateSet(this, _n, __privateGet(this, _n) + e3.length), __privateSet(this, _e, ""));
    for (let r3 of __privateGet(this, _r2)) __privateGet(this, _u).push(Math.min(r3, __privateGet(this, _n)));
    __privateGet(this, _r2).length = 0;
  }, _a);
  var Zr = Rt;
  var K = /* @__PURE__ */ Symbol("MODE_BREAK");
  var Q = /* @__PURE__ */ Symbol("MODE_FLAT");
  var vt = /* @__PURE__ */ Symbol("DOC_FILL_PRINTED_LENGTH");
  function tt(t, e3, r3, n, u, o) {
    if (r3 === Number.POSITIVE_INFINITY) return true;
    let i = e3.length, D = false, s = [t], a = "";
    for (; r3 >= 0; ) {
      if (s.length === 0) {
        if (i === 0) return true;
        s.push(e3[--i]);
        continue;
      }
      let { mode: c, doc: p4 } = s.pop(), l3 = q(p4);
      switch (l3) {
        case G:
          p4 && (D && (a += " ", r3 -= 1, D = false), a += p4, r3 -= Re(p4));
          break;
        case U:
        case S: {
          let m4 = l3 === U ? p4 : p4.parts, f = p4[vt] ?? 0;
          for (let F3 = m4.length - 1; F3 >= f; F3--) s.push({ mode: c, doc: m4[F3] });
          break;
        }
        case I:
        case R:
        case L:
        case b:
          s.push({ mode: c, doc: p4.contents });
          break;
        case v: {
          let { text: m4, count: f } = et(a);
          a = m4, r3 += f;
          break;
        }
        case x: {
          if (o && p4.break) return false;
          let m4 = p4.break ? K : c, f = p4.expandedStates && m4 === K ? y(0, p4.expandedStates, -1) : p4.contents;
          s.push({ mode: m4, doc: f });
          break;
        }
        case T: {
          let f = (p4.groupId ? u[p4.groupId] || Q : c) === K ? p4.breakContents : p4.flatContents;
          f && s.push({ mode: c, doc: f });
          break;
        }
        case g:
          if (c === K || p4.hard) return true;
          p4.soft || (D = true);
          break;
        case M:
          n = true;
          break;
        case Y:
          if (n) return false;
          break;
      }
    }
    return false;
  }
  function Ce(t, e3) {
    let r3 = /* @__PURE__ */ Object.create(null), n = e3.printWidth, u = we(e3.endOfLine), o = 0, i = [{ indent: It, mode: K, doc: t }], D = false, s = [], a = new Zr();
    for (Br(t); i.length > 0; ) {
      let { indent: f, mode: F3, doc: d3 } = i.pop();
      switch (q(d3)) {
        case G: {
          let E = u !== `
` ? ne(0, d3, `
`, u) : d3;
          E && (a.write(E), i.length > 0 && (o += Re(E)));
          break;
        }
        case U:
          for (let E = d3.length - 1; E >= 0; E--) i.push({ indent: f, mode: F3, doc: d3[E] });
          break;
        case V:
          a.markPosition();
          break;
        case I:
          i.push({ indent: Qr(f, e3), mode: F3, doc: d3.contents });
          break;
        case R:
          i.push({ indent: Xr(f, d3.n, e3), mode: F3, doc: d3.contents });
          break;
        case v:
          o -= a.trim();
          break;
        case x: {
          let E = (function() {
            if (F3 === Q && !D) return { indent: f, mode: d3.break ? K : Q, doc: d3.contents };
            D = false;
            let h = n - o, _3 = s.length > 0, P3 = { indent: f, mode: Q, doc: d3.contents };
            if (!d3.break && tt(P3, i, h, _3, r3)) return P3;
            if (!d3.expandedStates) return { indent: f, mode: K, doc: d3.contents };
            if (!d3.break) for (let A = 1; A < d3.expandedStates.length - 1; A++) {
              let B4 = { indent: f, mode: Q, doc: d3.expandedStates[A] };
              if (tt(B4, i, h, _3, r3)) return B4;
            }
            return { indent: f, mode: K, doc: y(0, d3.expandedStates, -1) };
          })();
          i.push(E), d3.id && (r3[d3.id] = E.mode);
          break;
        }
        case S: {
          let E = n - o, C3 = d3[vt] ?? 0, { parts: h } = d3, _3 = h.length - C3;
          if (_3 === 0) break;
          let P3 = h[C3 + 0], A = h[C3 + 1], B4 = { indent: f, mode: Q, doc: P3 }, J4 = { indent: f, mode: K, doc: P3 }, $e3 = tt(B4, [], E, s.length > 0, r3, true);
          if (_3 === 1) {
            $e3 ? i.push(B4) : i.push(J4);
            break;
          }
          let lr2 = { indent: f, mode: Q, doc: A }, _t5 = { indent: f, mode: K, doc: A };
          if (_3 === 2) {
            $e3 ? i.push(lr2, B4) : i.push(_t5, J4);
            break;
          }
          let bu3 = h[C3 + 2], ku3 = { indent: f, mode: F3, doc: { ...d3, [vt]: C3 + 2 } }, Iu3 = tt({ indent: f, mode: Q, doc: [P3, A, bu3] }, [], E, s.length > 0, r3, true);
          i.push(ku3), Iu3 ? i.push(lr2, B4) : $e3 ? i.push(_t5, B4) : i.push(_t5, J4);
          break;
        }
        case T:
        case L: {
          let E = d3.groupId ? r3[d3.groupId] : F3;
          if (E === K) {
            let C3 = d3.type === T ? d3.breakContents : d3.negate ? d3.contents : oe(d3.contents);
            C3 && i.push({ indent: f, mode: F3, doc: C3 });
          }
          if (E === Q) {
            let C3 = d3.type === T ? d3.flatContents : d3.negate ? oe(d3.contents) : d3.contents;
            C3 && i.push({ indent: f, mode: F3, doc: C3 });
          }
          break;
        }
        case M:
          s.push({ indent: f, mode: F3, doc: d3.contents });
          break;
        case Y:
          s.length > 0 && i.push({ indent: f, mode: F3, doc: ke });
          break;
        case g:
          switch (F3) {
            case Q:
              if (!d3.hard) {
                d3.soft || (a.write(" "), o += 1);
                break;
              }
              D = true;
            case K:
              if (s.length > 0) {
                i.push({ indent: f, mode: F3, doc: d3 }, ...s.reverse()), s.length = 0;
                break;
              }
              d3.literal ? (a.write(u), o = 0, f.root && (f.root.value && a.write(f.root.value), o = f.root.length)) : (a.trim(), a.write(u + f.value), o = f.length);
              break;
          }
          break;
        case b:
          i.push({ indent: f, mode: F3, doc: d3.contents });
          break;
        case N:
          break;
        default:
          throw new Z(d3);
      }
      i.length === 0 && s.length > 0 && (i.push(...s.reverse()), s.length = 0);
    }
    let { text: c, positions: p4 } = a.finish();
    if (p4.length !== 2) return { formatted: c };
    let [l3, m4] = p4;
    return { formatted: c, cursorNodeStart: l3, cursorNodeText: c.slice(l3, m4) };
  }
  function co(t, e3, r3 = 0) {
    let n = 0;
    for (let u = r3; u < t.length; ++u) t[u] === "	" ? n = n + e3 - n % e3 : n++;
    return n;
  }
  var he = co;
  var _Lt_instances, t_fn, e_fn, _a2;
  var Lt = (_a2 = class {
    constructor(e3) {
      __privateAdd(this, _Lt_instances);
      this.stack = [e3];
    }
    get key() {
      let { stack: e3, siblings: r3 } = this;
      return y(0, e3, r3 === null ? -2 : -4) ?? null;
    }
    get index() {
      return this.siblings === null ? null : y(0, this.stack, -2);
    }
    get node() {
      return y(0, this.stack, -1);
    }
    get parent() {
      return this.getNode(1);
    }
    get grandparent() {
      return this.getNode(2);
    }
    get isInArray() {
      return this.siblings !== null;
    }
    get siblings() {
      let { stack: e3 } = this, r3 = y(0, e3, -3);
      return Array.isArray(r3) ? r3 : null;
    }
    get next() {
      let { siblings: e3 } = this;
      return e3 === null ? null : e3[this.index + 1];
    }
    get previous() {
      let { siblings: e3 } = this;
      return e3 === null ? null : e3[this.index - 1];
    }
    get isFirst() {
      return this.index === 0;
    }
    get isLast() {
      let { siblings: e3, index: r3 } = this;
      return e3 !== null && r3 === e3.length - 1;
    }
    get isRoot() {
      return this.stack.length === 1;
    }
    get root() {
      return this.stack[0];
    }
    get ancestors() {
      return [...__privateMethod(this, _Lt_instances, e_fn).call(this)];
    }
    getName() {
      let { stack: e3 } = this, { length: r3 } = e3;
      return r3 > 1 ? y(0, e3, -2) : null;
    }
    getValue() {
      return y(0, this.stack, -1);
    }
    getNode(e3 = 0) {
      let r3 = __privateMethod(this, _Lt_instances, t_fn).call(this, e3);
      return r3 === -1 ? null : this.stack[r3];
    }
    getParentNode(e3 = 0) {
      return this.getNode(e3 + 1);
    }
    call(e3, ...r3) {
      let { stack: n } = this, { length: u } = n, o = y(0, n, -1);
      for (let i of r3) o = o?.[i], n.push(i, o);
      try {
        return e3(this);
      } finally {
        n.length = u;
      }
    }
    callParent(e3, r3 = 0) {
      let n = __privateMethod(this, _Lt_instances, t_fn).call(this, r3 + 1), u = this.stack.splice(n + 1);
      try {
        return e3(this);
      } finally {
        this.stack.push(...u);
      }
    }
    each(e3, ...r3) {
      let { stack: n } = this, { length: u } = n, o = y(0, n, -1);
      for (let i of r3) o = o[i], n.push(i, o);
      try {
        for (let i = 0; i < o.length; ++i) n.push(i, o[i]), e3(this, i, o), n.length -= 2;
      } finally {
        n.length = u;
      }
    }
    map(e3, ...r3) {
      let n = [];
      return this.each((u, o, i) => {
        n[o] = e3(u, o, i);
      }, ...r3), n;
    }
    match(...e3) {
      let r3 = this.stack.length - 1, n = null, u = this.stack[r3--];
      for (let o of e3) {
        if (u === void 0) return false;
        let i = null;
        if (typeof n == "number" && (i = n, n = this.stack[r3--], u = this.stack[r3--]), o && !o(u, n, i)) return false;
        n = this.stack[r3--], u = this.stack[r3--];
      }
      return true;
    }
    findAncestor(e3) {
      for (let r3 of __privateMethod(this, _Lt_instances, e_fn).call(this)) if (e3(r3)) return r3;
    }
    hasAncestor(e3) {
      for (let r3 of __privateMethod(this, _Lt_instances, e_fn).call(this)) if (e3(r3)) return true;
      return false;
    }
  }, _Lt_instances = new WeakSet(), t_fn = function(e3) {
    let { stack: r3 } = this;
    for (let n = r3.length - 1; n >= 0; n -= 2) if (!Array.isArray(r3[n]) && --e3 < 0) return n;
    return -1;
  }, e_fn = function* () {
    let { stack: e3 } = this;
    for (let r3 = e3.length - 3; r3 >= 0; r3 -= 2) {
      let n = e3[r3];
      Array.isArray(n) || (yield n);
    }
  }, _a2);
  var en = Lt;
  function fo(t) {
    return Array.isArray(t) && t.length > 0;
  }
  var rt = fo;
  function lo(t) {
    return t !== null && typeof t == "object";
  }
  var ge = lo;
  function _e2(t) {
    return (e3, r3, n) => {
      if (r3 === false) return false;
      let u = !!n?.backwards, { length: o } = e3, i = r3;
      for (; i >= 0 && i < o; ) {
        let D = e3.charAt(i);
        if (t instanceof RegExp) {
          if (!t.test(D)) return i;
        } else if (!t.includes(D)) return i;
        u ? i-- : i++;
      }
      return i === -1 || i === o ? i : false;
    };
  }
  var tn = _e2(/\s/);
  var j = _e2(" 	");
  var nt = _e2(",; 	");
  var ut = _e2(/[^\n\r]/);
  var rn = (t) => t === `
` || t === "\r" || t === "\u2028" || t === "\u2029";
  function po(t, e3, r3) {
    if (e3 === false) return false;
    let n = !!r3?.backwards, u = t.charAt(e3);
    if (n) {
      if (t.charAt(e3 - 1) === "\r" && u === `
`) return e3 - 2;
      if (rn(u)) return e3 - 1;
    } else {
      if (u === "\r" && t.charAt(e3 + 1) === `
`) return e3 + 2;
      if (rn(u)) return e3 + 1;
    }
    return e3;
  }
  var $ = po;
  function mo(t, e3, r3 = {}) {
    let n = j(t, r3.backwards ? e3 - 1 : e3, r3), u = $(t, n, r3);
    return n !== u;
  }
  var H = mo;
  function* ye(t, e3) {
    let { getVisitorKeys: r3, filter: n = () => true } = e3, u = (o) => ge(o) && n(o);
    for (let o of r3(t)) {
      let i = t[o];
      if (Array.isArray(i)) for (let D of i) u(D) && (yield D);
      else u(i) && (yield i);
    }
  }
  function* nn(t, e3) {
    let r3 = [t];
    for (let n = 0; n < r3.length; n++) {
      let u = r3[n];
      for (let o of ye(u, e3)) yield o, r3.push(o);
    }
  }
  function un(t, e3) {
    return ye(t, e3).next().done;
  }
  function Fo(t, e3, r3) {
    let { filter: n } = r3;
    if (!n) return [];
    let u, o = (r3.getChildren?.(t, r3) ?? [...ye(t, { getVisitorKeys: r3.getVisitorKeys })]).flatMap((s) => (u ?? (u = [t, ...e3]), n(s, u) ? [s] : on(s, u, r3))), { locStart: i, locEnd: D } = r3;
    return o.sort((s, a) => i(s) - i(a) || D(s) - D(a)), o;
  }
  function on(t, e3, r3) {
    return Fe(r3.cache, t, (n) => Fo(n, e3, r3));
  }
  var ot = on;
  function Eo(t) {
    let e3 = t.type || t.kind || "(unknown type)", r3 = String(t.name || t.id && (typeof t.id == "object" ? t.id.name : t.id) || t.key && (typeof t.key == "object" ? t.key.name : t.key) || t.value && (typeof t.value == "object" ? "" : String(t.value)) || t.operator || "");
    return r3.length > 20 && (r3 = r3.slice(0, 19) + "\u2026"), e3 + (r3 ? " " + r3 : "");
  }
  function Mt(t, e3) {
    (t.comments ?? (t.comments = [])).push(e3), e3.printed = false, e3.nodeDescription = Eo(t);
  }
  function ce(t, e3) {
    e3.leading = true, e3.trailing = false, Mt(t, e3);
  }
  function re(t, e3, r3) {
    e3.leading = false, e3.trailing = false, r3 && (e3.marker = r3), Mt(t, e3);
  }
  function fe(t, e3) {
    e3.leading = false, e3.trailing = true, Mt(t, e3);
  }
  var Ut = /* @__PURE__ */ new WeakMap();
  function Dn(t, e3, r3, n, u = []) {
    let { locStart: o, locEnd: i } = r3, D = o(e3), s = i(e3), a = ot(t, u, { cache: Ut, locStart: o, locEnd: i, getVisitorKeys: r3.getVisitorKeys, filter: r3.printer.canAttachComment, getChildren: r3.printer.getCommentChildNodes }), c, p4, l3 = 0, m4 = a.length;
    for (; l3 < m4; ) {
      let f = l3 + m4 >> 1, F3 = a[f], d3 = o(F3), E = i(F3);
      if (d3 <= D && s <= E) return Dn(F3, e3, r3, F3, [F3, ...u]);
      if (E <= D) {
        c = F3, l3 = f + 1;
        continue;
      }
      if (s <= d3) {
        p4 = F3, m4 = f;
        continue;
      }
      throw new Error("Comment location overlaps with node location");
    }
    if (n?.type === "TemplateLiteral") {
      let { quasis: f } = n, F3 = jt(f, e3, r3);
      c && jt(f, c, r3) !== F3 && (c = null), p4 && jt(f, p4, r3) !== F3 && (p4 = null);
    }
    return { enclosingNode: n, precedingNode: c, followingNode: p4 };
  }
  var Yt = () => false;
  function an(t, e3) {
    let { comments: r3 } = t;
    if (delete t.comments, !rt(r3) || !e3.printer.canAttachComment) return;
    let n = [], { printer: { features: { experimental_avoidAstMutation: u }, handleComments: o = {} }, originalText: i } = e3, { ownLine: D = Yt, endOfLine: s = Yt, remaining: a = Yt } = o, c = r3.map((l3, m4) => ({ ...Dn(t, l3, e3), comment: l3, text: i, options: e3, ast: t, isLastComment: r3.length - 1 === m4, placement: void 0 })), p4 = !u;
    for (let [l3, m4] of c.entries()) {
      let { comment: f, precedingNode: F3, enclosingNode: d3, followingNode: E, text: C3, options: h, ast: _3, isLastComment: P3 } = m4, A = Co(C3, h, c, l3) ? "ownLine" : ho(C3, h, c, l3) ? "endOfLine" : "remaining", B4;
      if (u ? (m4.placement = A, B4 = [m4]) : B4 = [f, C3, h, _3, P3], p4 && (f.enclosingNode = d3, f.precedingNode = F3, f.followingNode = E), f.placement = A, A === "ownLine") D(...B4) || (E ? ce(E, f) : F3 ? fe(F3, f) : d3 ? re(d3, f) : re(_3, f));
      else if (A === "endOfLine") s(...B4) || (F3 ? fe(F3, f) : E ? ce(E, f) : d3 ? re(d3, f) : re(_3, f));
      else if (!a(...B4)) if (F3 && E) {
        let J4 = n.length;
        J4 > 0 && n[J4 - 1].followingNode !== E && sn(n, h), n.push(m4);
      } else F3 ? fe(F3, f) : E ? ce(E, f) : d3 ? re(d3, f) : re(_3, f);
    }
    if (sn(n, e3), p4) for (let l3 of r3) delete l3.precedingNode, delete l3.enclosingNode, delete l3.followingNode;
  }
  var cn = (t) => !/[\S\n\u2028\u2029]/.test(t);
  function Co(t, e3, r3, n) {
    let { comment: u, precedingNode: o } = r3[n], { locStart: i, locEnd: D } = e3, s = i(u);
    if (o) for (let a = n - 1; a >= 0; a--) {
      let { comment: c, precedingNode: p4 } = r3[a];
      if (p4 !== o || !cn(t.slice(D(c), s))) break;
      s = i(c);
    }
    return H(t, s, { backwards: true });
  }
  function ho(t, e3, r3, n) {
    let { comment: u, followingNode: o } = r3[n], { locStart: i, locEnd: D } = e3, s = D(u);
    if (o) for (let a = n + 1; a < r3.length; a++) {
      let { comment: c, followingNode: p4 } = r3[a];
      if (p4 !== o || !cn(t.slice(s, i(c)))) break;
      s = D(c);
    }
    return H(t, s);
  }
  function sn(t, e3) {
    let r3 = t.length;
    if (r3 === 0) return;
    let { precedingNode: n, followingNode: u } = t[0], o = e3.locStart(u), i;
    for (i = r3; i > 0; --i) {
      let { comment: D, precedingNode: s, followingNode: a } = t[i - 1];
      k(s, n), k(a, u);
      let c = e3.originalText.slice(e3.locEnd(D), o);
      if (e3.printer.isGap?.(c, e3) ?? /^[\s(]*$/.test(c)) o = e3.locStart(D);
      else break;
    }
    for (let [D, { comment: s }] of t.entries()) D < i ? fe(n, s) : ce(u, s);
    for (let D of [n, u]) D.comments && D.comments.length > 1 && D.comments.sort((s, a) => e3.locStart(s) - e3.locStart(a));
    t.length = 0;
  }
  function jt(t, e3, r3) {
    let n = r3.locStart(e3) - 1;
    for (let u = 1; u < t.length; ++u) if (n < r3.locStart(t[u])) return u - 1;
    return 0;
  }
  function go(t, e3) {
    let r3 = e3 - 1;
    r3 = j(t, r3, { backwards: true }), r3 = $(t, r3, { backwards: true }), r3 = j(t, r3, { backwards: true });
    let n = $(t, r3, { backwards: true });
    return r3 !== n;
  }
  var ve = go;
  var fn = () => true;
  function ln(t, e3) {
    let r3 = t.node;
    return r3.printed = true, e3.printer.printComment(t, e3);
  }
  function _o(t, e3) {
    let r3 = t.node, n = [ln(t, e3)], { printer: u, originalText: o, locStart: i, locEnd: D } = e3;
    if (u.isBlockComment?.(r3)) {
      let c = " ";
      H(o, D(r3)) && (H(o, i(r3), { backwards: true }) ? c = W : c = Ze), n.push(c);
    } else n.push(W);
    let a = $(o, j(o, D(r3)));
    return a !== false && H(o, a) && n.push(W), n;
  }
  function yo(t, e3, r3) {
    let n = t.node, u = ln(t, e3), { printer: o, originalText: i, locStart: D } = e3, s = o.isBlockComment?.(n);
    if (r3?.hasLineSuffix && !r3?.isBlock || H(i, D(n), { backwards: true })) {
      let a = ve(i, D(n));
      return { doc: Ie([W, a ? W : "", u]), isBlock: s, hasLineSuffix: true };
    }
    return !s || r3?.hasLineSuffix ? { doc: [Ie([" ", u]), ae], isBlock: s, hasLineSuffix: true } : { doc: [" ", u], isBlock: s, hasLineSuffix: false };
  }
  function Ao(t, e3, r3) {
    let n = e3[/* @__PURE__ */ Symbol.for("printedComments")], u = r3?.filter ?? fn, o = new Set(t.node?.comments?.filter((i) => !n?.has(i) && i.leading && u(i)));
    return o.size === 0 ? "" : t.map(({ node: i }) => o.has(i) ? _o(t, e3) : "", "comments").filter(Boolean);
  }
  function xo(t, e3, r3) {
    let n = t.node?.comments, u = new Set(n?.filter((c) => c.trailing)), o = e3[/* @__PURE__ */ Symbol.for("printedComments")], i = r3?.filter ?? fn, D = new Set(n?.filter((c) => u.has(c) && !o?.has(c) && i(c)));
    if (D.size === 0) return "";
    let s = [], a;
    return t.each(({ node: c }) => {
      u.has(c) && (a = yo(t, e3, a), D.has(c) && s.push(a.doc));
    }, "comments"), s;
  }
  function pn(t, e3, r3, n) {
    let u = Ao(t, r3, n), o = xo(t, r3, n);
    return u || o ? Ee(e3, (i) => [u, i, o]) : e3;
  }
  function mn(t) {
    let { [ue]: e3, [/* @__PURE__ */ Symbol.for("printedComments")]: r3 } = t;
    for (let n of e3) {
      if (!n.printed && !r3.has(n)) throw new Error('Comment "' + n.value.trim() + '" was not printed. Please report this error!');
      delete n.printed;
    }
  }
  var dn = () => k;
  var Le = class extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "ConfigError");
    }
  };
  var Me = class extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "UndefinedParserError");
    }
  };
  var Bo = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty);
  var le = Bo;
  var Fn = { checkIgnorePragma: { category: "Special", type: "boolean", default: false, description: "Check whether the file's first docblock comment contains '@noprettier' or '@noformat' to determine if it should be formatted.", cliCategory: "Other" }, cursorOffset: { category: "Special", type: "int", default: -1, range: { start: -1, end: 1 / 0, step: 1 }, description: "Print (to stderr) where a cursor at the given position would move to after formatting.", cliCategory: "Editor" }, endOfLine: { category: "Global", type: "choice", default: "lf", description: "Which end of line characters to apply.", choices: [{ value: "lf", description: "Line Feed only (\\n), common on Linux and macOS as well as inside git repos" }, { value: "crlf", description: "Carriage Return + Line Feed characters (\\r\\n), common on Windows" }, { value: "cr", description: "Carriage Return character only (\\r), used very rarely" }, { value: "auto", description: `Maintain existing
(mixed values within one file are normalised by looking at what's used after the first line)` }] }, filepath: { category: "Special", type: "path", description: "Specify the input filepath. This will be used to do parser inference.", cliName: "stdin-filepath", cliCategory: "Other", cliDescription: "Path to the file to pretend that stdin comes from." }, insertPragma: { category: "Special", type: "boolean", default: false, description: "Insert @format pragma into file's first docblock comment.", cliCategory: "Other" }, parser: { category: "Global", type: "choice", default: void 0, description: "Which parser to use.", exception: (t) => typeof t == "string" || typeof t == "function", choices: [{ value: "flow", description: "Flow" }, { value: "babel", description: "JavaScript" }, { value: "babel-flow", description: "Flow" }, { value: "babel-ts", description: "TypeScript" }, { value: "typescript", description: "TypeScript" }, { value: "acorn", description: "JavaScript" }, { value: "espree", description: "JavaScript" }, { value: "meriyah", description: "JavaScript" }, { value: "css", description: "CSS" }, { value: "less", description: "Less" }, { value: "scss", description: "SCSS" }, { value: "json", description: "JSON" }, { value: "json5", description: "JSON5" }, { value: "jsonc", description: "JSON with Comments" }, { value: "json-stringify", description: "JSON.stringify" }, { value: "graphql", description: "GraphQL" }, { value: "markdown", description: "Markdown" }, { value: "mdx", description: "MDX" }, { value: "vue", description: "Vue" }, { value: "yaml", description: "YAML" }, { value: "glimmer", description: "Ember / Handlebars" }, { value: "html", description: "HTML" }, { value: "angular", description: "Angular" }, { value: "lwc", description: "Lightning Web Components" }, { value: "mjml", description: "MJML" }] }, plugins: { type: "path", array: true, default: [{ value: [] }], category: "Global", description: "Add a plugin. Multiple plugins can be passed as separate `--plugin`s.", exception: (t) => typeof t == "string" || typeof t == "object", cliName: "plugin", cliCategory: "Config" }, printWidth: { category: "Global", type: "int", default: 80, description: "The line length where Prettier will try wrap.", range: { start: 0, end: 1 / 0, step: 1 } }, rangeEnd: { category: "Special", type: "int", default: 1 / 0, range: { start: 0, end: 1 / 0, step: 1 }, description: `Format code ending at a given character offset (exclusive).
The range will extend forwards to the end of the selected statement.`, cliCategory: "Editor" }, rangeStart: { category: "Special", type: "int", default: 0, range: { start: 0, end: 1 / 0, step: 1 }, description: `Format code starting at a given character offset.
The range will extend backwards to the start of the first line containing the selected statement.`, cliCategory: "Editor" }, requirePragma: { category: "Special", type: "boolean", default: false, description: "Require either '@prettier' or '@format' to be present in the file's first docblock comment in order for it to be formatted.", cliCategory: "Other" }, tabWidth: { type: "int", category: "Global", default: 2, description: "Number of spaces per indentation level.", range: { start: 0, end: 1 / 0, step: 1 } }, useTabs: { category: "Global", type: "boolean", default: false, description: "Indent with tabs instead of spaces." }, embeddedLanguageFormatting: { category: "Global", type: "choice", default: "auto", description: "Control how Prettier formats quoted code embedded in the file.", choices: [{ value: "auto", description: "Format embedded code if Prettier can automatically identify it." }, { value: "off", description: "Never automatically format embedded code." }] } };
  function it({ plugins: t = [], showDeprecated: e3 = false } = {}) {
    let r3 = t.flatMap((u) => u.languages ?? []), n = [];
    for (let u of No(Object.assign({}, ...t.map(({ options: o }) => o), Fn))) !e3 && u.deprecated || (Array.isArray(u.choices) && (e3 || (u.choices = u.choices.filter((o) => !o.deprecated)), u.name === "parser" && (u.choices = [...u.choices, ...To(u.choices, r3, t)])), u.pluginDefaults = Object.fromEntries(t.filter((o) => o.defaultOptions?.[u.name] !== void 0).map((o) => [o.name, o.defaultOptions[u.name]])), n.push(u));
    return { languages: r3, options: n };
  }
  function* To(t, e3, r3) {
    let n = new Set(t.map((u) => u.value));
    for (let u of e3) if (u.parsers) {
      for (let o of u.parsers) if (!n.has(o)) {
        n.add(o);
        let i = r3.find((s) => s.parsers && le(s.parsers, o)), D = u.name;
        i?.name && (D += ` (plugin: ${i.name})`), yield { value: o, description: D };
      }
    }
  }
  function No(t) {
    let e3 = [];
    for (let [r3, n] of Object.entries(t)) {
      let u = { name: r3, ...n };
      Array.isArray(u.default) && (u.default = y(0, u.default, -1).value), e3.push(u);
    }
    return e3;
  }
  var wo = Array.prototype.toReversed ?? function() {
    return [...this].reverse();
  };
  var Oo = X("toReversed", function() {
    if (Array.isArray(this)) return wo;
  });
  var En = Oo;
  function Po() {
    let t = globalThis, e3 = t.process?.platform;
    if (typeof e3 == "string") return e3.startsWith("win");
    let r3 = t.Deno?.build?.os;
    return typeof r3 == "string" ? r3 === "windows" : t.navigator?.platform?.startsWith("Win") ?? false;
  }
  var So = Po();
  function Cn(t) {
    if (t = t instanceof URL ? t : new URL(t), t.protocol !== "file:") throw new TypeError(`URL must be a file URL: received "${t.protocol}"`);
    return t;
  }
  function bo(t) {
    return t = Cn(t), decodeURIComponent(t.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
  }
  function ko(t) {
    t = Cn(t);
    let e3 = decodeURIComponent(t.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    return t.hostname !== "" && (e3 = `\\\\${t.hostname}${e3}`), e3;
  }
  function Vt(t) {
    return So ? ko(t) : bo(t);
  }
  var hn = (t) => String(t).split(/[/\\]/).pop();
  var gn = (t) => String(t).startsWith("file:");
  function _n2(t, e3) {
    if (!e3) return;
    let r3 = hn(e3).toLowerCase();
    return t.find(({ filenames: n }) => n?.some((u) => u.toLowerCase() === r3)) ?? t.find(({ extensions: n }) => n?.some((u) => r3.endsWith(u)));
  }
  function Io(t, e3) {
    if (e3) return t.find(({ name: r3 }) => r3.toLowerCase() === e3) ?? t.find(({ aliases: r3 }) => r3?.includes(e3)) ?? t.find(({ extensions: r3 }) => r3?.includes(`.${e3}`));
  }
  var Ro = void 0;
  function yn(t, e3) {
    if (e3) {
      if (gn(e3)) try {
        e3 = Vt(e3);
      } catch {
        return;
      }
      if (typeof e3 == "string") return t.find(({ isSupported: r3 }) => r3?.({ filepath: e3 }));
    }
  }
  function vo(t, e3) {
    let r3 = En(0, t.plugins).flatMap((u) => u.languages ?? []);
    return (Io(r3, e3.language) ?? _n2(r3, e3.physicalFile) ?? _n2(r3, e3.file) ?? yn(r3, e3.physicalFile) ?? yn(r3, e3.file) ?? Ro?.(r3, e3.physicalFile))?.parsers[0];
  }
  var st = vo;
  var ie = { key: (t) => /^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(t) ? t : JSON.stringify(t), value(t) {
    if (t === null || typeof t != "object") return JSON.stringify(t);
    if (Array.isArray(t)) return `[${t.map((r3) => ie.value(r3)).join(", ")}]`;
    let e3 = Object.keys(t);
    return e3.length === 0 ? "{}" : `{ ${e3.map((r3) => `${ie.key(r3)}: ${ie.value(t[r3])}`).join(", ")} }`;
  }, pair: ({ key: t, value: e3 }) => ie.value({ [t]: e3 }) };
  var An = new Proxy(String, { get: () => An });
  var z = An;
  var xn = (t, e3, { descriptor: r3 }) => {
    let n = [`${z.yellow(typeof t == "string" ? r3.key(t) : r3.pair(t))} is deprecated`];
    return e3 && n.push(`we now treat it as ${z.blue(typeof e3 == "string" ? r3.key(e3) : r3.pair(e3))}`), n.join("; ") + ".";
  };
  var Dt = /* @__PURE__ */ Symbol.for("vnopts.VALUE_NOT_EXIST");
  var Ae = /* @__PURE__ */ Symbol.for("vnopts.VALUE_UNCHANGED");
  var Bn = " ".repeat(2);
  var Nn = (t, e3, r3) => {
    let { text: n, list: u } = r3.normalizeExpectedResult(r3.schemas[t].expected(r3)), o = [];
    return n && o.push(Tn(t, e3, n, r3.descriptor)), u && o.push([Tn(t, e3, u.title, r3.descriptor)].concat(u.values.map((i) => wn(i, r3.loggerPrintWidth))).join(`
`)), On(o, r3.loggerPrintWidth);
  };
  function Tn(t, e3, r3, n) {
    return [`Invalid ${z.red(n.key(t))} value.`, `Expected ${z.blue(r3)},`, `but received ${e3 === Dt ? z.gray("nothing") : z.red(n.value(e3))}.`].join(" ");
  }
  function wn({ text: t, list: e3 }, r3) {
    let n = [];
    return t && n.push(`- ${z.blue(t)}`), e3 && n.push([`- ${z.blue(e3.title)}:`].concat(e3.values.map((u) => wn(u, r3 - Bn.length).replace(/^|\n/g, `$&${Bn}`))).join(`
`)), On(n, r3);
  }
  function On(t, e3) {
    if (t.length === 1) return t[0];
    let [r3, n] = t, [u, o] = t.map((i) => i.split(`
`, 1)[0].length);
    return u > e3 && u > o ? n : r3;
  }
  var xe = [];
  var Wt = [];
  function at(t, e3, r3) {
    if (t === e3) return 0;
    let n = r3?.maxDistance, u = t;
    t.length > e3.length && (t = e3, e3 = u);
    let o = t.length, i = e3.length;
    for (; o > 0 && t.charCodeAt(~-o) === e3.charCodeAt(~-i); ) o--, i--;
    let D = 0;
    for (; D < o && t.charCodeAt(D) === e3.charCodeAt(D); ) D++;
    if (o -= D, i -= D, n !== void 0 && i - o > n) return n;
    if (o === 0) return n !== void 0 && i > n ? n : i;
    let s, a, c, p4, l3 = 0, m4 = 0;
    for (; l3 < o; ) Wt[l3] = t.charCodeAt(D + l3), xe[l3] = ++l3;
    for (; m4 < i; ) {
      for (s = e3.charCodeAt(D + m4), c = m4++, a = m4, l3 = 0; l3 < o; l3++) p4 = s === Wt[l3] ? c : c + 1, c = xe[l3], a = xe[l3] = c > a ? p4 > a ? a + 1 : p4 : p4 > c ? c + 1 : p4;
      if (n !== void 0) {
        let f = a;
        for (l3 = 0; l3 < o; l3++) xe[l3] < f && (f = xe[l3]);
        if (f > n) return n;
      }
    }
    return xe.length = o, Wt.length = o, n !== void 0 && a > n ? n : a;
  }
  function Pn(t, e3, r3) {
    if (!Array.isArray(e3) || e3.length === 0) return;
    let n = r3?.maxDistance, u = t.length;
    for (let s of e3) if (s === t) return s;
    if (n === 0) return;
    let o, i = Number.POSITIVE_INFINITY, D = /* @__PURE__ */ new Set();
    for (let s of e3) {
      if (D.has(s)) continue;
      D.add(s);
      let a = Math.abs(s.length - u);
      if (a >= i || n !== void 0 && a > n) continue;
      let c = Number.isFinite(i) ? n === void 0 ? i : Math.min(i, n) : n, p4 = c === void 0 ? at(t, s) : at(t, s, { maxDistance: c });
      if (n !== void 0 && p4 > n) continue;
      let l3 = p4;
      if (c !== void 0 && p4 === c && c === n && (l3 = at(t, s)), l3 < i && (i = l3, o = s, i === 0)) break;
    }
    if (!(n !== void 0 && i > n)) return o;
  }
  var ct = (t, e3, { descriptor: r3, logger: n, schemas: u }) => {
    let o = [`Ignored unknown option ${z.yellow(r3.pair({ key: t, value: e3 }))}.`], i = Pn(t, Object.keys(u), { maxDistance: 3 });
    i && o.push(`Did you mean ${z.blue(r3.key(i))}?`), n.warn(o.join(" "));
  };
  var Lo = ["default", "expected", "validate", "deprecated", "forward", "redirect", "overlap", "preprocess", "postprocess"];
  function Mo(t, e3) {
    let r3 = new t(e3), n = Object.create(r3);
    for (let u of Lo) u in e3 && (n[u] = Yo(e3[u], r3, O.prototype[u].length));
    return n;
  }
  var O = class {
    static create(e3) {
      return Mo(this, e3);
    }
    constructor(e3) {
      this.name = e3.name;
    }
    default(e3) {
    }
    expected(e3) {
      return "nothing";
    }
    validate(e3, r3) {
      return false;
    }
    deprecated(e3, r3) {
      return false;
    }
    forward(e3, r3) {
    }
    redirect(e3, r3) {
    }
    overlap(e3, r3, n) {
      return e3;
    }
    preprocess(e3, r3) {
      return e3;
    }
    postprocess(e3, r3) {
      return Ae;
    }
  };
  function Yo(t, e3, r3) {
    return typeof t == "function" ? (...n) => t(...n.slice(0, r3 - 1), e3, ...n.slice(r3 - 1)) : () => t;
  }
  var ft = class extends O {
    constructor(e3) {
      super(e3), this._sourceName = e3.sourceName;
    }
    expected(e3) {
      return e3.schemas[this._sourceName].expected(e3);
    }
    validate(e3, r3) {
      return r3.schemas[this._sourceName].validate(e3, r3);
    }
    redirect(e3, r3) {
      return this._sourceName;
    }
  };
  var lt = class extends O {
    expected() {
      return "anything";
    }
    validate() {
      return true;
    }
  };
  var pt = class extends O {
    constructor({ valueSchema: e3, name: r3 = e3.name, ...n }) {
      super({ ...n, name: r3 }), this._valueSchema = e3;
    }
    expected(e3) {
      let { text: r3, list: n } = e3.normalizeExpectedResult(this._valueSchema.expected(e3));
      return { text: r3 && `an array of ${r3}`, list: n && { title: "an array of the following values", values: [{ list: n }] } };
    }
    validate(e3, r3) {
      if (!Array.isArray(e3)) return false;
      let n = [];
      for (let u of e3) {
        let o = r3.normalizeValidateResult(this._valueSchema.validate(u, r3), u);
        o !== true && n.push(o.value);
      }
      return n.length === 0 ? true : { value: n };
    }
    deprecated(e3, r3) {
      let n = [];
      for (let u of e3) {
        let o = r3.normalizeDeprecatedResult(this._valueSchema.deprecated(u, r3), u);
        o !== false && n.push(...o.map(({ value: i }) => ({ value: [i] })));
      }
      return n;
    }
    forward(e3, r3) {
      let n = [];
      for (let u of e3) {
        let o = r3.normalizeForwardResult(this._valueSchema.forward(u, r3), u);
        n.push(...o.map(Sn));
      }
      return n;
    }
    redirect(e3, r3) {
      let n = [], u = [];
      for (let o of e3) {
        let i = r3.normalizeRedirectResult(this._valueSchema.redirect(o, r3), o);
        "remain" in i && n.push(i.remain), u.push(...i.redirect.map(Sn));
      }
      return n.length === 0 ? { redirect: u } : { redirect: u, remain: n };
    }
    overlap(e3, r3) {
      return e3.concat(r3);
    }
  };
  function Sn({ from: t, to: e3 }) {
    return { from: [t], to: e3 };
  }
  var mt = class extends O {
    expected() {
      return "true or false";
    }
    validate(e3) {
      return typeof e3 == "boolean";
    }
  };
  function kn(t, e3) {
    let r3 = /* @__PURE__ */ Object.create(null);
    for (let n of t) {
      let u = n[e3];
      if (r3[u]) throw new Error(`Duplicate ${e3} ${JSON.stringify(u)}`);
      r3[u] = n;
    }
    return r3;
  }
  function In(t, e3) {
    let r3 = /* @__PURE__ */ new Map();
    for (let n of t) {
      let u = n[e3];
      if (r3.has(u)) throw new Error(`Duplicate ${e3} ${JSON.stringify(u)}`);
      r3.set(u, n);
    }
    return r3;
  }
  function Rn() {
    let t = /* @__PURE__ */ Object.create(null);
    return (e3) => {
      let r3 = JSON.stringify(e3);
      return t[r3] ? true : (t[r3] = true, false);
    };
  }
  function vn(t, e3) {
    let r3 = [], n = [];
    for (let u of t) e3(u) ? r3.push(u) : n.push(u);
    return [r3, n];
  }
  function Ln(t) {
    return t === Math.floor(t);
  }
  function Mn(t, e3) {
    if (t === e3) return 0;
    let r3 = typeof t, n = typeof e3, u = ["undefined", "object", "boolean", "number", "string"];
    return r3 !== n ? u.indexOf(r3) - u.indexOf(n) : r3 !== "string" ? Number(t) - Number(e3) : t.localeCompare(e3);
  }
  function Yn(t) {
    return (...e3) => {
      let r3 = t(...e3);
      return typeof r3 == "string" ? new Error(r3) : r3;
    };
  }
  function $t(t) {
    return t === void 0 ? {} : t;
  }
  function zt(t) {
    if (typeof t == "string") return { text: t };
    let { text: e3, list: r3 } = t;
    return jo((e3 || r3) !== void 0, "Unexpected `expected` result, there should be at least one field."), r3 ? { text: e3, list: { title: r3.title, values: r3.values.map(zt) } } : { text: e3 };
  }
  function Gt(t, e3) {
    return t === true ? true : t === false ? { value: e3 } : t;
  }
  function Kt(t, e3, r3 = false) {
    return t === false ? false : t === true ? r3 ? true : [{ value: e3 }] : "value" in t ? [t] : t.length === 0 ? false : t;
  }
  function bn(t, e3) {
    return typeof t == "string" || "key" in t ? { from: e3, to: t } : "from" in t ? { from: t.from, to: t.to } : { from: e3, to: t.to };
  }
  function dt(t, e3) {
    return t === void 0 ? [] : Array.isArray(t) ? t.map((r3) => bn(r3, e3)) : [bn(t, e3)];
  }
  function Ht(t, e3) {
    let r3 = dt(typeof t == "object" && "redirect" in t ? t.redirect : t, e3);
    return r3.length === 0 ? { remain: e3, redirect: r3 } : typeof t == "object" && "remain" in t ? { remain: t.remain, redirect: r3 } : { redirect: r3 };
  }
  function jo(t, e3) {
    if (!t) throw new Error(e3);
  }
  var Ft = class extends O {
    constructor(e3) {
      super(e3), this._choices = In(e3.choices.map((r3) => r3 && typeof r3 == "object" ? r3 : { value: r3 }), "value");
    }
    expected({ descriptor: e3 }) {
      let r3 = Array.from(this._choices.keys()).map((i) => this._choices.get(i)).filter(({ hidden: i }) => !i).map((i) => i.value).sort(Mn).map(e3.value), n = r3.slice(0, -2), u = r3.slice(-2);
      return { text: n.concat(u.join(" or ")).join(", "), list: { title: "one of the following values", values: r3 } };
    }
    validate(e3) {
      return this._choices.has(e3);
    }
    deprecated(e3) {
      let r3 = this._choices.get(e3);
      return r3 && r3.deprecated ? { value: e3 } : false;
    }
    forward(e3) {
      let r3 = this._choices.get(e3);
      return r3 ? r3.forward : void 0;
    }
    redirect(e3) {
      let r3 = this._choices.get(e3);
      return r3 ? r3.redirect : void 0;
    }
  };
  var Et = class extends O {
    expected() {
      return "a number";
    }
    validate(e3, r3) {
      return typeof e3 == "number";
    }
  };
  var Ct = class extends Et {
    expected() {
      return "an integer";
    }
    validate(e3, r3) {
      return r3.normalizeValidateResult(super.validate(e3, r3), e3) === true && Ln(e3);
    }
  };
  var Ye = class extends O {
    expected() {
      return "a string";
    }
    validate(e3) {
      return typeof e3 == "string";
    }
  };
  var jn = ie;
  var Un = ct;
  var Vn = Nn;
  var Wn = xn;
  var ht = class {
    constructor(e3, r3) {
      let { logger: n = console, loggerPrintWidth: u = 80, descriptor: o = jn, unknown: i = Un, invalid: D = Vn, deprecated: s = Wn, missing: a = () => false, required: c = () => false, preprocess: p4 = (m4) => m4, postprocess: l3 = () => Ae } = r3 || {};
      this._utils = { descriptor: o, logger: n || { warn: () => {
      } }, loggerPrintWidth: u, schemas: kn(e3, "name"), normalizeDefaultResult: $t, normalizeExpectedResult: zt, normalizeDeprecatedResult: Kt, normalizeForwardResult: dt, normalizeRedirectResult: Ht, normalizeValidateResult: Gt }, this._unknownHandler = i, this._invalidHandler = Yn(D), this._deprecatedHandler = s, this._identifyMissing = (m4, f) => !(m4 in f) || a(m4, f), this._identifyRequired = c, this._preprocess = p4, this._postprocess = l3, this.cleanHistory();
    }
    cleanHistory() {
      this._hasDeprecationWarned = Rn();
    }
    normalize(e3) {
      let r3 = {}, u = [this._preprocess(e3, this._utils)], o = () => {
        for (; u.length !== 0; ) {
          let i = u.shift(), D = this._applyNormalization(i, r3);
          u.push(...D);
        }
      };
      o();
      for (let i of Object.keys(this._utils.schemas)) {
        let D = this._utils.schemas[i];
        if (!(i in r3)) {
          let s = $t(D.default(this._utils));
          "value" in s && u.push({ [i]: s.value });
        }
      }
      o();
      for (let i of Object.keys(this._utils.schemas)) {
        if (!(i in r3)) continue;
        let D = this._utils.schemas[i], s = r3[i], a = D.postprocess(s, this._utils);
        a !== Ae && (this._applyValidation(a, i, D), r3[i] = a);
      }
      return this._applyPostprocess(r3), this._applyRequiredCheck(r3), r3;
    }
    _applyNormalization(e3, r3) {
      let n = [], { knownKeys: u, unknownKeys: o } = this._partitionOptionKeys(e3);
      for (let i of u) {
        let D = this._utils.schemas[i], s = D.preprocess(e3[i], this._utils);
        this._applyValidation(s, i, D);
        let a = ({ from: m4, to: f }) => {
          n.push(typeof f == "string" ? { [f]: m4 } : { [f.key]: f.value });
        }, c = ({ value: m4, redirectTo: f }) => {
          let F3 = Kt(D.deprecated(m4, this._utils), s, true);
          if (F3 !== false) if (F3 === true) this._hasDeprecationWarned(i) || this._utils.logger.warn(this._deprecatedHandler(i, f, this._utils));
          else for (let { value: d3 } of F3) {
            let E = { key: i, value: d3 };
            if (!this._hasDeprecationWarned(E)) {
              let C3 = typeof f == "string" ? { key: f, value: d3 } : f;
              this._utils.logger.warn(this._deprecatedHandler(E, C3, this._utils));
            }
          }
        };
        dt(D.forward(s, this._utils), s).forEach(a);
        let l3 = Ht(D.redirect(s, this._utils), s);
        if (l3.redirect.forEach(a), "remain" in l3) {
          let m4 = l3.remain;
          r3[i] = i in r3 ? D.overlap(r3[i], m4, this._utils) : m4, c({ value: m4 });
        }
        for (let { from: m4, to: f } of l3.redirect) c({ value: m4, redirectTo: f });
      }
      for (let i of o) {
        let D = e3[i];
        this._applyUnknownHandler(i, D, r3, (s, a) => {
          n.push({ [s]: a });
        });
      }
      return n;
    }
    _applyRequiredCheck(e3) {
      for (let r3 of Object.keys(this._utils.schemas)) if (this._identifyMissing(r3, e3) && this._identifyRequired(r3)) throw this._invalidHandler(r3, Dt, this._utils);
    }
    _partitionOptionKeys(e3) {
      let [r3, n] = vn(Object.keys(e3).filter((u) => !this._identifyMissing(u, e3)), (u) => u in this._utils.schemas);
      return { knownKeys: r3, unknownKeys: n };
    }
    _applyValidation(e3, r3, n) {
      let u = Gt(n.validate(e3, this._utils), e3);
      if (u !== true) throw this._invalidHandler(r3, u.value, this._utils);
    }
    _applyUnknownHandler(e3, r3, n, u) {
      let o = this._unknownHandler(e3, r3, this._utils);
      if (o) for (let i of Object.keys(o)) {
        if (this._identifyMissing(i, o)) continue;
        let D = o[i];
        i in this._utils.schemas ? u(i, D) : n[i] = D;
      }
    }
    _applyPostprocess(e3) {
      let r3 = this._postprocess(e3, this._utils);
      if (r3 !== Ae) {
        if (r3.delete) for (let n of r3.delete) delete e3[n];
        if (r3.override) {
          let { knownKeys: n, unknownKeys: u } = this._partitionOptionKeys(r3.override);
          for (let o of n) {
            let i = r3.override[o];
            this._applyValidation(i, o, this._utils.schemas[o]), e3[o] = i;
          }
          for (let o of u) {
            let i = r3.override[o];
            this._applyUnknownHandler(o, i, e3, (D, s) => {
              let a = this._utils.schemas[D];
              this._applyValidation(s, D, a), e3[D] = s;
            });
          }
        }
      }
    }
  };
  var Jt;
  function Uo(t, e3, { logger: r3 = false, isCLI: n = false, passThrough: u = false, FlagSchema: o, descriptor: i } = {}) {
    if (n) {
      if (!o) throw new Error("'FlagSchema' option is required.");
      if (!i) throw new Error("'descriptor' option is required.");
    } else i = ie;
    let D = u ? Array.isArray(u) ? (l3, m4) => u.includes(l3) ? { [l3]: m4 } : void 0 : (l3, m4) => ({ [l3]: m4 }) : (l3, m4, f) => {
      let { _: F3, ...d3 } = f.schemas;
      return ct(l3, m4, { ...f, schemas: d3 });
    }, s = Vo(e3, { isCLI: n, FlagSchema: o }), a = new ht(s, { logger: r3, unknown: D, descriptor: i }), c = r3 !== false;
    c && Jt && (a._hasDeprecationWarned = Jt);
    let p4 = a.normalize(t);
    return c && (Jt = a._hasDeprecationWarned), p4;
  }
  function Vo(t, { isCLI: e3, FlagSchema: r3 }) {
    let n = [];
    e3 && n.push(lt.create({ name: "_" }));
    for (let u of t) n.push(Wo(u, { isCLI: e3, optionInfos: t, FlagSchema: r3 })), u.alias && e3 && n.push(ft.create({ name: u.alias, sourceName: u.name }));
    return n;
  }
  function Wo(t, { isCLI: e3, optionInfos: r3, FlagSchema: n }) {
    let { name: u } = t, o = { name: u }, i, D = {};
    switch (t.type) {
      case "int":
        i = Ct, e3 && (o.preprocess = Number);
        break;
      case "string":
        i = Ye;
        break;
      case "choice":
        i = Ft, o.choices = t.choices.map((s) => s?.redirect ? { ...s, redirect: { to: { key: t.name, value: s.redirect } } } : s);
        break;
      case "boolean":
        i = mt;
        break;
      case "flag":
        i = n, o.flags = r3.flatMap((s) => [s.alias, s.description && s.name, s.oppositeDescription && `no-${s.name}`].filter(Boolean));
        break;
      case "path":
        i = Ye;
        break;
      default:
        throw new Error(`Unexpected type ${t.type}`);
    }
    if (t.exception ? o.validate = (s, a, c) => t.exception(s) || a.validate(s, c) : o.validate = (s, a, c) => s === void 0 || a.validate(s, c), t.redirect && (D.redirect = (s) => s ? { to: typeof t.redirect == "string" ? t.redirect : { key: t.redirect.option, value: t.redirect.value } } : void 0), t.deprecated && (D.deprecated = true), e3 && !t.array) {
      let s = o.preprocess || ((a) => a);
      o.preprocess = (a, c, p4) => c.preprocess(s(Array.isArray(a) ? y(0, a, -1) : a), p4);
    }
    return t.array ? pt.create({ ...e3 ? { preprocess: (s) => Array.isArray(s) ? s : [s] } : {}, ...D, valueSchema: i.create(o) }) : i.create({ ...o, ...D });
  }
  var $n = Uo;
  var $o = Array.prototype.findLast ?? function(t) {
    for (let e3 = this.length - 1; e3 >= 0; e3--) {
      let r3 = this[e3];
      if (t(r3, e3, this)) return r3;
    }
  };
  var zo = X("findLast", function() {
    if (Array.isArray(this)) return $o;
  });
  var qt = zo;
  var zn = /* @__PURE__ */ Symbol.for("PRETTIER_IS_FRONT_MATTER");
  var Xt = [];
  function Go(t) {
    return !!t?.[zn];
  }
  var pe = Go;
  var Gn = /* @__PURE__ */ new Set(["yaml", "toml"]);
  var je = ({ node: t }) => pe(t) && Gn.has(t.language);
  async function Qt(t, e3, r3, n) {
    let { node: u } = r3, { language: o } = u;
    if (!Gn.has(o)) return;
    let i = u.value.trim(), D;
    if (i) {
      let s = o === "yaml" ? o : st(n, { language: o });
      if (!s) return;
      D = i ? await t(i, { parser: s }) : "";
    } else D = i;
    return Xe([u.startDelimiter, u.explicitLanguage ?? "", W, D, D ? W : "", u.endDelimiter]);
  }
  function Ko(t, e3) {
    return je({ node: t }) && (delete e3.end, delete e3.raw, delete e3.value), e3;
  }
  var Zt = Ko;
  function Ho({ node: t }) {
    return t.raw;
  }
  var er = Ho;
  var Kn = /* @__PURE__ */ new Set(["tokens", "comments", "parent", "enclosingNode", "precedingNode", "followingNode"]);
  var Jo = (t) => Object.keys(t).filter((e3) => !Kn.has(e3));
  function qo(t, e3) {
    let r3 = t ? (n) => t(n, Kn) : Jo;
    return e3 ? new Proxy(r3, { apply: (n, u, o) => pe(o[0]) ? Xt : Reflect.apply(n, u, o) }) : r3;
  }
  var tr = qo;
  function rr(t, e3) {
    if (!e3) throw new Error("parserName is required.");
    let r3 = qt(0, t, (u) => u.parsers && le(u.parsers, e3));
    if (r3) return r3;
    let n = `Couldn't resolve parser "${e3}".`;
    throw n += " Plugins must be explicitly added to the standalone bundle.", new Le(n);
  }
  function Hn(t, e3) {
    if (!e3) throw new Error("astFormat is required.");
    let r3 = qt(0, t, (u) => u.printers && le(u.printers, e3));
    if (r3) return r3;
    let n = `Couldn't find plugin for AST format "${e3}".`;
    throw n += " Plugins must be explicitly added to the standalone bundle.", new Le(n);
  }
  function Ue({ plugins: t, parser: e3 }) {
    let r3 = rr(t, e3);
    return nr(r3, e3);
  }
  function nr(t, e3) {
    let r3 = t.parsers[e3];
    return typeof r3 == "function" ? r3() : r3;
  }
  async function Jn(t, e3) {
    let r3 = t.printers[e3], n = typeof r3 == "function" ? await r3() : r3;
    return Zo(n);
  }
  function Xo(t) {
    let { features: e3, getVisitorKeys: r3, embed: n, massageAstNode: u, print: o, ...i } = t;
    e3 = ni(e3);
    let D = e3.experimental_frontMatterSupport;
    r3 = tr(r3, D.massageAstNode || D.embed || D.print);
    let s = u;
    u && D.massageAstNode && (s = new Proxy(u, { apply(l3, m4, f) {
      return Zt(...f), Reflect.apply(l3, m4, f);
    } }));
    let a = n;
    if (n) {
      let l3;
      a = new Proxy(n, { get(m4, f, F3) {
        return f === "getVisitorKeys" ? (l3 ?? (l3 = n.getVisitorKeys ? tr(n.getVisitorKeys, D.massageAstNode || D.embed) : r3), l3) : Reflect.get(m4, f, F3);
      }, apply: (m4, f, F3) => D.embed && je(...F3) ? Qt : Reflect.apply(m4, f, F3) });
    }
    let c = o;
    return D.print && (c = new Proxy(o, { apply(l3, m4, f) {
      let [F3] = f;
      return pe(F3.node) ? er(F3) : Reflect.apply(l3, m4, f);
    } })), { features: e3, getVisitorKeys: r3, embed: a, massageAstNode: s, print: c, ...i };
  }
  var Qo = /* @__PURE__ */ new WeakMap();
  function Zo(t) {
    return Fe(Qo, t, Xo);
  }
  var ei = ["clean", "embed", "print"];
  var ti = Object.fromEntries(ei.map((t) => [t, false]));
  function ri(t) {
    return { ...ti, ...t };
  }
  function ni(t) {
    return { experimental_avoidAstMutation: false, ...t, experimental_frontMatterSupport: ri(t?.experimental_frontMatterSupport) };
  }
  var qn = { astFormat: "estree", printer: {}, originalText: void 0, locStart: null, locEnd: null, getVisitorKeys: null };
  async function ui(t, e3 = {}) {
    let r3 = { ...t };
    if (!r3.parser) {
      if (!r3.filepath) throw new Me("No parser and no file path given, couldn't infer a parser.");
      if (r3.parser = st(r3, { physicalFile: r3.filepath }), !r3.parser) throw new Me(`No parser could be inferred for file "${r3.filepath}".`);
    }
    let n = it({ plugins: t.plugins, showDeprecated: true }).options, u = { ...qn, ...Object.fromEntries(n.filter((p4) => p4.default !== void 0).map((p4) => [p4.name, p4.default])) }, o = rr(r3.plugins, r3.parser), i = await nr(o, r3.parser);
    r3.astFormat = i.astFormat, r3.locEnd = i.locEnd, r3.locStart = i.locStart;
    let D = o.printers?.[i.astFormat] ? o : Hn(r3.plugins, i.astFormat), s = await Jn(D, i.astFormat);
    r3.printer = s, r3.getVisitorKeys = s.getVisitorKeys;
    let a = D.defaultOptions ? Object.fromEntries(Object.entries(D.defaultOptions).filter(([, p4]) => p4 !== void 0)) : {}, c = { ...u, ...a };
    for (let [p4, l3] of Object.entries(c)) r3[p4] ?? (r3[p4] = l3);
    return r3.parser === "json" && (r3.trailingComma = "none"), $n(r3, n, { passThrough: Object.keys(qn), ...e3 });
  }
  var se = ui;
  var Xn = /\r\n|[\n\r\u2028\u2029]/;
  function oi(t, e3, r3, n) {
    let u = { column: null, line: -1, ...t.start }, o = { ...u, ...t.end }, { linesAbove: i = 2, linesBelow: D = 3 } = r3 || {}, s = u.line - n, a = u.column, c = o.line - n, p4 = o.column, l3 = Math.max(s - (i + 1), 0), m4 = Math.min(e3.length, c + D);
    s === -1 && (l3 = 0), c === -1 && (m4 = e3.length);
    let f = c - s, F3 = {};
    if (f) for (let d3 = 0; d3 <= f; d3++) {
      let E = d3 + s;
      if (a == null) F3[E] = true;
      else if (d3 === 0) {
        let C3 = e3[E - 1].length;
        F3[E] = [a, C3 - a];
      } else if (d3 === f) F3[E] = [0, p4];
      else {
        let C3 = e3[E - 1].length;
        F3[E] = [0, C3];
      }
    }
    else if (a === p4) a != null ? F3[s] = [a, 0] : F3[s] = true;
    else {
      let d3 = a ?? 0, E = p4 ?? d3;
      F3[s] = [d3, E - d3];
    }
    return { start: l3, end: m4, markerLines: F3 };
  }
  function Qn(t, e3, r3 = {}, n) {
    let { defs: u, highlight: o } = n || { defs: { gutter: String, marker: String, message: String, reset: String }, highlight: String }, i = (r3.startLine || 1) - 1, D = t.split(Xn), { start: s, end: a, markerLines: c } = oi(e3, D, r3, i), p4 = e3.start && typeof e3.start.column == "number", l3 = String(a + i).length, f = o(t).split(Xn, a).slice(s, a).map((F3, d3) => {
      let E = s + 1 + d3, h = ` ${` ${E + i}`.slice(-l3)} |`, _3 = c[E], P3 = !c[E + 1];
      if (_3) {
        let A = "";
        if (Array.isArray(_3)) {
          let B4 = F3.slice(0, _3[0]).replace(/[^\t]/g, " "), J4 = _3[1] || 1;
          A = [`
 `, u.gutter(h.replace(/\d/g, " ")), " ", B4, u.marker("^").repeat(J4)].join(""), P3 && r3.message && (A += " " + u.message(r3.message));
        }
        return [u.marker(">"), u.gutter(h), F3.length > 0 ? ` ${F3}` : "", A].join("");
      } else return ` ${u.gutter(h)}${F3.length > 0 ? ` ${F3}` : ""}`;
    }).join(`
`);
    return r3.message && !p4 && (f = `${" ".repeat(l3 + 1)}${r3.message}
${f}`), u.reset(f);
  }
  function Zn(t, e3, r3 = {}) {
    return Qn(t, e3, r3);
  }
  async function ii(t, e3) {
    let r3 = await Ue(e3), n = r3.preprocess ? await r3.preprocess(t, e3) : t;
    e3.originalText = n;
    let u;
    try {
      u = await r3.parse(n, e3, e3);
    } catch (o) {
      si(o, t);
    }
    return { text: n, ast: u };
  }
  function si(t, e3) {
    let { loc: r3 } = t;
    if (r3) {
      let { start: n, end: u } = r3;
      n && (n = { line: n.line, column: n.column - 1 }), u && (u = { line: u.line, column: u.column - 1 });
      let o = Zn(e3, { start: n, end: u }, { highlightCode: true });
      t.message += `
` + o, t.codeFrame = o;
    }
    throw t;
  }
  var me = ii;
  async function eu(t, e3, r3, n, u) {
    if (r3.embeddedLanguageFormatting !== "auto") return;
    let { printer: o } = r3, { embed: i } = o;
    if (!i) return;
    if (i.length > 2) throw new Error("printer.embed has too many parameters. The API changed in Prettier v3. Please update your plugin. See https://prettier.io/docs/plugins#optional-embed");
    let { hasPrettierIgnore: D } = o, { getVisitorKeys: s } = i, a = [];
    l3();
    let c = t.stack;
    for (let { print: m4, node: f, pathStack: F3 } of a) try {
      t.stack = F3;
      let d3 = await m4(p4, e3, t, r3);
      d3 && u.set(f, d3);
    } catch (d3) {
      if (globalThis.PRETTIER_DEBUG) throw d3;
    }
    t.stack = c;
    function p4(m4, f) {
      return Di(m4, f, r3, n);
    }
    function l3() {
      let { node: m4 } = t;
      if (m4 === null || typeof m4 != "object" || D?.(t)) return;
      for (let F3 of s(m4)) Array.isArray(m4[F3]) ? t.each(l3, F3) : t.call(l3, F3);
      let f = i(t, r3);
      if (f) {
        if (typeof f == "function") {
          a.push({ print: f, node: m4, pathStack: [...t.stack] });
          return;
        }
        u.set(m4, f);
      }
    }
  }
  async function Di(t, e3, r3, n) {
    let u = await se({ ...r3, ...e3, parentParser: r3.parser, originalText: t, cursorOffset: void 0, rangeStart: void 0, rangeEnd: void 0 }, { passThrough: true }), { ast: o } = await me(t, u), i = await n(o, u);
    return He(i);
  }
  function ai(t, e3, r3, n) {
    let { originalText: u, [ue]: o, locStart: i, locEnd: D, [/* @__PURE__ */ Symbol.for("printedComments")]: s } = e3, { node: a } = t, c = i(a), p4 = D(a);
    for (let m4 of o) i(m4) >= c && D(m4) <= p4 && s.add(m4);
    let { printPrettierIgnored: l3 } = e3.printer;
    return l3 ? l3(t, e3, r3, n) : u.slice(c, p4);
  }
  var tu = ai;
  async function Ve(t, e3) {
    ({ ast: t } = await ur(t, e3));
    let r3 = /* @__PURE__ */ new Map(), n = new en(t), u = dn(e3), o = /* @__PURE__ */ new Map();
    await eu(n, D, e3, Ve, o);
    let i = await ru(n, e3, D, void 0, o);
    if (mn(e3), e3.cursorOffset >= 0) {
      if (e3.nodeAfterCursor && !e3.nodeBeforeCursor) return [ee, i];
      if (e3.nodeBeforeCursor && !e3.nodeAfterCursor) return [i, ee];
    }
    return i;
    function D(a, c) {
      return a === void 0 || a === n ? s(c) : Array.isArray(a) ? n.call(() => s(c), ...a) : n.call(() => s(c), a);
    }
    function s(a) {
      u(n);
      let c = n.node;
      if (c == null) return "";
      let p4 = ge(c) && a === void 0;
      if (p4 && r3.has(c)) return r3.get(c);
      let l3 = ru(n, e3, D, a, o);
      return p4 && r3.set(c, l3), l3;
    }
  }
  function ru(t, e3, r3, n, u) {
    let { node: o } = t, { printer: i } = e3, D;
    switch (i.hasPrettierIgnore?.(t) ? D = tu(t, e3, r3, n) : u.has(o) ? D = u.get(o) : D = i.print(t, e3, r3, n), o) {
      case e3.cursorNode:
        D = Ee(D, (s) => [ee, s, ee]);
        break;
      case e3.nodeBeforeCursor:
        D = Ee(D, (s) => [s, ee]);
        break;
      case e3.nodeAfterCursor:
        D = Ee(D, (s) => [ee, s]);
        break;
    }
    return i.printComment && rt(o.comments) && !i.willPrintOwnComments?.(t, e3) && (D = pn(t, D, e3)), D;
  }
  async function ur(t, e3) {
    let r3 = t.comments ?? [];
    e3[ue] = r3, e3[/* @__PURE__ */ Symbol.for("printedComments")] = /* @__PURE__ */ new Set(), an(t, e3);
    let { printer: { preprocess: n } } = e3;
    return t = n ? await n(t, e3) : t, { ast: t, comments: r3 };
  }
  function ci(t, e3) {
    let { cursorOffset: r3, locStart: n, locEnd: u, getVisitorKeys: o } = e3, i = (m4) => n(m4) <= r3 && u(m4) >= r3, D = t, s = [t];
    for (let m4 of nn(t, { getVisitorKeys: o, filter: i })) s.push(m4), D = m4;
    if (un(D, { getVisitorKeys: o })) return { cursorNode: D };
    let a, c, p4 = -1, l3 = Number.POSITIVE_INFINITY;
    for (; s.length > 0 && (a === void 0 || c === void 0); ) {
      D = s.pop();
      let m4 = a !== void 0, f = c !== void 0;
      for (let F3 of ye(D, { getVisitorKeys: o })) {
        if (!m4) {
          let d3 = u(F3);
          d3 <= r3 && d3 > p4 && (a = F3, p4 = d3);
        }
        if (!f) {
          let d3 = n(F3);
          d3 >= r3 && d3 < l3 && (c = F3, l3 = d3);
        }
      }
    }
    return { nodeBeforeCursor: a, nodeAfterCursor: c };
  }
  var or = ci;
  function fi(t, e3) {
    let { printer: r3 } = e3, n = r3.massageAstNode;
    if (!n) return t;
    let { getVisitorKeys: u } = r3, { ignoredProperties: o } = n;
    return i(t);
    function i(D, s) {
      if (!ge(D)) return D;
      if (Array.isArray(D)) return D.map((l3) => i(l3, s)).filter(Boolean);
      let a = {}, c = new Set(u(D));
      for (let l3 in D) !le(D, l3) || o?.has(l3) || (c.has(l3) ? a[l3] = i(D[l3], D) : a[l3] = D[l3]);
      let p4 = n(D, a, s);
      if (p4 !== null) return p4 ?? a;
    }
  }
  var nu = fi;
  var li = Array.prototype.findLastIndex ?? function(t) {
    for (let e3 = this.length - 1; e3 >= 0; e3--) {
      let r3 = this[e3];
      if (t(r3, e3, this)) return e3;
    }
    return -1;
  };
  var pi = X("findLastIndex", function() {
    if (Array.isArray(this)) return li;
  });
  var uu = pi;
  function mi(t, e3) {
    return e3 = new Set(e3), t.find((r3) => su.has(r3.type) && e3.has(r3));
  }
  function ou(t) {
    let e3 = uu(0, t, (r3) => r3.type !== "Program" && r3.type !== "File");
    return e3 === -1 ? t : t.slice(0, e3 + 1);
  }
  function di(t, e3, { locStart: r3, locEnd: n }) {
    let [u, ...o] = t, [i, ...D] = e3;
    if (u === i) return [u, i];
    let s = r3(u);
    for (let c of ou(D)) if (r3(c) >= s) i = c;
    else break;
    let a = n(i);
    for (let c of ou(o)) {
      if (n(c) <= a) u = c;
      else break;
      if (u === i) break;
    }
    return [u, i];
  }
  function ir(t, e3, r3, n, u = [], o, i) {
    let { locStart: D, locEnd: s } = i, a = D(t), c = s(t);
    if (e3 > c || e3 < a || o === "rangeEnd" && e3 === a || o === "rangeStart" && e3 === c) return;
    let p4 = [t, ...u], l3 = ot(t, p4, { cache: Ut, locStart: D, locEnd: s, getVisitorKeys: r3.getVisitorKeys, filter: r3.printer.canAttachComment, getChildren: r3.printer.getCommentChildNodes });
    for (let m4 of l3) {
      let f = ir(m4, e3, r3, n, p4, o, i);
      if (f) return f;
    }
    if (n(t, u[0])) return p4;
  }
  function Fi(t, e3) {
    return e3 !== "DeclareExportDeclaration" && t !== "TypeParameterDeclaration" && (t === "Directive" || t === "TypeAlias" || t === "TSExportAssignment" || t.startsWith("Declare") || t.startsWith("TSDeclare") || t.endsWith("Statement") || t.endsWith("Declaration"));
  }
  var su = /* @__PURE__ */ new Set(["JsonRoot", "ObjectExpression", "ArrayExpression", "StringLiteral", "NumericLiteral", "BooleanLiteral", "NullLiteral", "UnaryExpression", "TemplateLiteral"]);
  var Ei = /* @__PURE__ */ new Set(["OperationDefinition", "FragmentDefinition", "VariableDefinition", "TypeExtensionDefinition", "ObjectTypeDefinition", "FieldDefinition", "DirectiveDefinition", "EnumTypeDefinition", "EnumValueDefinition", "InputValueDefinition", "InputObjectTypeDefinition", "SchemaDefinition", "OperationTypeDefinition", "InterfaceTypeDefinition", "UnionTypeDefinition", "ScalarTypeDefinition"]);
  function iu(t, e3, r3) {
    if (!e3) return false;
    switch (t.parser) {
      case "flow":
      case "hermes":
      case "babel":
      case "babel-flow":
      case "babel-ts":
      case "typescript":
      case "acorn":
      case "espree":
      case "meriyah":
      case "oxc":
      case "oxc-ts":
      case "yuku":
      case "yuku-ts":
      case "__babel_estree":
        return Fi(e3.type, r3?.type);
      case "json":
      case "json5":
      case "jsonc":
      case "json-stringify":
        return su.has(e3.type);
      case "graphql":
        return Ei.has(e3.kind);
      case "vue":
        return e3.tag !== "root";
    }
    return false;
  }
  function Du(t, e3, r3) {
    let { rangeStart: n, rangeEnd: u } = e3;
    k(u > n);
    let o = t.slice(n, u).search(/\S/), i = o === -1;
    if (!i) for (n += o; u > n && !/\S/.test(t[u - 1]); --u) ;
    let D = e3.printer.features?.experimental_locForRangeFormat ?? e3, s = ir(r3, n, e3, (f, F3) => iu(e3, f, F3), [], "rangeStart", D);
    if (!s) return;
    let a = i ? s : ir(r3, u, e3, (f) => iu(e3, f), [], "rangeEnd", D);
    if (!a) return;
    let c, p4;
    if (r3.type === "JsonRoot") {
      let f = mi(s, a);
      c = f, p4 = f;
    } else [c, p4] = di(s, a, e3);
    let { locStart: l3, locEnd: m4 } = D;
    return [Math.min(l3(c), l3(p4)), Math.max(m4(c), m4(p4))];
  }
  var lu = "\uFEFF";
  var au = /* @__PURE__ */ Symbol("cursor");
  async function pu(t, e3, r3 = 0) {
    if (!t || t.trim().length === 0) return { formatted: "", cursorOffset: -1, comments: [] };
    let { ast: n, text: u } = await me(t, e3);
    e3.cursorOffset >= 0 && (e3 = { ...e3, ...or(n, e3) });
    let o = await Ve(n, e3, r3);
    r3 > 0 && (o = Qe([W, o], r3, e3.tabWidth));
    let i = Ce(o, e3);
    if (r3 > 0) {
      let s = i.formatted.trim();
      i.cursorNodeStart !== void 0 && (i.cursorNodeStart -= i.formatted.indexOf(s), i.cursorNodeStart < 0 && (i.cursorNodeStart = 0, i.cursorNodeText = i.cursorNodeText.trimStart()), i.cursorNodeStart + i.cursorNodeText.length > s.length && (i.cursorNodeText = i.cursorNodeText.trimEnd())), i.formatted = s + we(e3.endOfLine);
    }
    let D = e3[ue];
    if (e3.cursorOffset >= 0) {
      let s, a, c, p4;
      if ((e3.cursorNode || e3.nodeBeforeCursor || e3.nodeAfterCursor) && i.cursorNodeText) if (c = i.cursorNodeStart, p4 = i.cursorNodeText, e3.cursorNode) s = e3.locStart(e3.cursorNode), a = u.slice(s, e3.locEnd(e3.cursorNode));
      else {
        if (!e3.nodeBeforeCursor && !e3.nodeAfterCursor) throw new Error("Cursor location must contain at least one of cursorNode, nodeBeforeCursor, nodeAfterCursor");
        s = e3.nodeBeforeCursor ? e3.locEnd(e3.nodeBeforeCursor) : 0;
        let E = e3.nodeAfterCursor ? e3.locStart(e3.nodeAfterCursor) : u.length;
        a = u.slice(s, E);
      }
      else s = 0, a = u, c = 0, p4 = i.formatted;
      let l3 = e3.cursorOffset - s;
      if (a === p4) return { formatted: i.formatted, cursorOffset: c + l3, comments: D };
      let m4 = a.split("");
      m4.splice(l3, 0, au);
      let f = p4.split(""), F3 = xt(m4, f), d3 = c;
      for (let E of F3) if (E.removed) {
        if (E.value.includes(au)) break;
      } else d3 += E.count;
      return { formatted: i.formatted, cursorOffset: d3, comments: D };
    }
    return { formatted: i.formatted, cursorOffset: -1, comments: D };
  }
  async function Ci(t, e3) {
    let { ast: r3, text: n } = await me(t, e3), [u, o] = Du(n, e3, r3) ?? [0, 0], i = n.slice(u, o), D = Math.min(u, n.lastIndexOf(`
`, u) + 1), s = n.slice(D, u).match(/^\s*/)[0], a = he(s, e3.tabWidth), c = await pu(i, { ...e3, rangeStart: 0, rangeEnd: Number.POSITIVE_INFINITY, cursorOffset: e3.cursorOffset > u && e3.cursorOffset <= o ? e3.cursorOffset - u : -1, endOfLine: "lf" }, a), p4 = c.formatted.trimEnd(), { cursorOffset: l3 } = e3;
    l3 > o ? l3 += p4.length - i.length : c.cursorOffset >= 0 && (l3 = c.cursorOffset + u);
    let m4 = n.slice(0, u) + p4 + n.slice(o);
    if (e3.endOfLine !== "lf") {
      let f = we(e3.endOfLine);
      l3 >= 0 && f === `\r
` && (l3 += Tt(m4.slice(0, l3), `
`)), m4 = ne(0, m4, `
`, f);
    }
    return { formatted: m4, cursorOffset: l3, comments: c.comments };
  }
  function sr(t, e3, r3) {
    return typeof e3 != "number" || Number.isNaN(e3) || e3 < 0 || e3 > t.length ? r3 : e3;
  }
  function cu(t, e3) {
    let { cursorOffset: r3, rangeStart: n, rangeEnd: u } = e3;
    return r3 = sr(t, r3, -1), n = sr(t, n, 0), u = sr(t, u, t.length), { ...e3, cursorOffset: r3, rangeStart: n, rangeEnd: u };
  }
  function mu(t, e3) {
    let { cursorOffset: r3, rangeStart: n, rangeEnd: u, endOfLine: o } = cu(t, e3), i = t.charAt(0) === lu;
    if (i && (t = t.slice(1), r3--, n--, u--), o === "auto" && (o = Cr(t)), t.includes("\r")) {
      let D = (s) => Tt(t.slice(0, Math.max(s, 0)), `\r
`);
      r3 -= D(r3), n -= D(n), u -= D(u), t = hr(t);
    }
    return { hasBOM: i, text: t, options: cu(t, { ...e3, cursorOffset: r3, rangeStart: n, rangeEnd: u, endOfLine: o }) };
  }
  async function fu(t, e3) {
    let r3 = await Ue(e3);
    return !r3.hasPragma || r3.hasPragma(t);
  }
  async function hi(t, e3) {
    return (await Ue(e3)).hasIgnorePragma?.(t);
  }
  async function Dr(t, e3) {
    let { hasBOM: r3, text: n, options: u } = mu(t, await se(e3));
    if (u.rangeStart >= u.rangeEnd && n !== "" || u.requirePragma && !await fu(n, u) || u.checkIgnorePragma && await hi(n, u)) return { formatted: t, cursorOffset: e3.cursorOffset, comments: [] };
    let o;
    return u.rangeStart > 0 || u.rangeEnd < n.length ? o = await Ci(n, u) : (!u.requirePragma && u.insertPragma && u.printer.insertPragma && !await fu(n, u) && (n = u.printer.insertPragma(n)), o = await pu(n, u)), r3 && (o.formatted = lu + o.formatted, o.cursorOffset >= 0 && o.cursorOffset++), o;
  }
  async function du(t, e3, r3) {
    let { text: n, options: u } = mu(t, await se(e3)), o = await me(n, u);
    return r3 && (r3.preprocessForPrint && (o.ast = await ur(o.ast, u)), r3.massage && (o.ast = nu(o.ast, u))), o;
  }
  async function Fu(t, e3) {
    e3 = await se(e3);
    let r3 = await Ve(t, e3);
    return Ce(r3, e3);
  }
  async function Eu(t, e3) {
    let r3 = Ur(t), { formatted: n } = await Dr(r3, { ...e3, parser: "__js_expression" });
    return n;
  }
  async function Cu(t, e3) {
    e3 = await se(e3);
    let { ast: r3 } = await me(t, e3);
    return e3.cursorOffset >= 0 && (e3 = { ...e3, ...or(r3, e3) }), Ve(r3, e3);
  }
  async function hu(t, e3) {
    return Ce(t, await se(e3));
  }
  var ar = {};
  yt(ar, { builders: () => _i, printer: () => yi, utils: () => Ai });
  var _i = { join: be, line: Ze, softline: Mr, hardline: W, literalline: Je, group: wt, conditionalGroup: Ir, fill: kr, lineSuffix: Ie, lineSuffixBoundary: Yr, cursor: ee, breakParent: ae, ifBreak: Rr, trim: jr, indent: oe, indentIfBreak: vr, align: De, addAlignmentToDoc: Qe, markAsRoot: Xe, dedentToRoot: Sr, dedent: br, hardlineWithoutBreakParent: ke, literallineWithoutBreakParent: Ot, label: Lr, concat: (t) => t };
  var yi = { printDocToString: Ce };
  var Ai = { willBreak: xr, traverseDoc: Oe, findInDoc: Ke, mapDoc: Se, removeLines: Tr, stripTrailingHardline: He, replaceEndOfLine: Nr, canBreak: wr };
  var gu = "3.9.8";
  var fr = {};
  yt(fr, { addDanglingComment: () => re, addLeadingComment: () => ce, addTrailingComment: () => fe, getAlignmentSize: () => he, getIndentSize: () => _u2, getMaxContinuousCount: () => yu, getNextNonSpaceNonCommentCharacter: () => Au, getNextNonSpaceNonCommentCharacterIndex: () => vi, getPreferredQuote: () => Tu, getStringWidth: () => Re, hasNewline: () => H, hasNewlineInRange: () => Nu, hasSpaces: () => wu, isNextLineEmpty: () => Ui, isNextLineEmptyAfterIndex: () => gt, isPreviousLineEmpty: () => Mi, makeString: () => ji, skip: () => _e2, skipEverythingButNewLine: () => ut, skipInlineComment: () => Be, skipNewline: () => $, skipSpaces: () => j, skipToLineEnd: () => nt, skipTrailingComment: () => Te, skipWhitespace: () => tn });
  function xi(t, e3) {
    if (e3 === false) return false;
    if (t.charAt(e3) === "/" && t.charAt(e3 + 1) === "*") {
      for (let r3 = e3 + 2; r3 < t.length; ++r3) if (t.charAt(r3) === "*" && t.charAt(r3 + 1) === "/") return r3 + 2;
    }
    return e3;
  }
  var Be = xi;
  function Bi(t, e3) {
    return e3 === false ? false : t.charAt(e3) === "/" && t.charAt(e3 + 1) === "/" ? ut(t, e3) : e3;
  }
  var Te = Bi;
  function Ti(t, e3) {
    let r3 = null, n = e3;
    for (; n !== r3; ) r3 = n, n = j(t, n), n = Be(t, n), n = Te(t, n), n = $(t, n);
    return n;
  }
  var We = Ti;
  function Ni(t, e3) {
    let r3 = null, n = e3;
    for (; n !== r3; ) r3 = n, n = nt(t, n), n = Be(t, n), n = j(t, n);
    return n = Te(t, n), n = $(t, n), n !== false && H(t, n);
  }
  var gt = Ni;
  function wi(t, e3) {
    let r3 = t.lastIndexOf(`
`);
    return r3 === -1 ? 0 : he(t.slice(r3 + 1).match(/^[\t ]*/)[0], e3);
  }
  var _u2 = wi;
  function cr(t) {
    if (typeof t != "string") throw new TypeError("Expected a string");
    return t.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
  }
  function Oi(t, e3) {
    let r3 = t.matchAll(new RegExp(`(?:${cr(e3)})+`, "g"));
    return r3.reduce || (r3 = [...r3]), r3.reduce((n, [u]) => Math.max(n, u.length), 0) / e3.length;
  }
  var yu = Oi;
  function Pi(t, e3) {
    let r3 = We(t, e3);
    return r3 === false ? "" : t.charAt(r3);
  }
  var Au = Pi;
  var xu = Object.freeze({ character: "'", codePoint: 39 });
  var Bu = Object.freeze({ character: '"', codePoint: 34 });
  var Si = Object.freeze({ preferred: xu, alternate: Bu });
  var bi = Object.freeze({ preferred: Bu, alternate: xu });
  function Tu(t, e3) {
    let { preferred: r3, alternate: n } = e3 === true || e3 === "'" ? Si : bi, { length: u } = t, o = 0, i = 0;
    for (let D = 0; D < u; D++) {
      let s = t.charCodeAt(D);
      s === r3.codePoint ? o++ : s === n.codePoint && i++;
    }
    return (o > i ? n : r3).character;
  }
  function ki(t, e3, r3) {
    for (let n = e3; n < r3; ++n) if (t.charAt(n) === `
`) return true;
    return false;
  }
  var Nu = ki;
  function Ii(t, e3, r3 = {}) {
    return j(t, r3.backwards ? e3 - 1 : e3, r3) !== e3;
  }
  var wu = Ii;
  function Ri(t, e3, r3) {
    return We(t, r3(e3));
  }
  function vi(t, e3) {
    return arguments.length === 2 || typeof e3 == "number" ? We(t, e3) : Ri(...arguments);
  }
  function Li(t, e3, r3) {
    return ve(t, r3(e3));
  }
  function Mi(t, e3) {
    return arguments.length === 2 || typeof e3 == "number" ? ve(t, e3) : Li(...arguments);
  }
  function Yi(t, e3, r3) {
    return gt(t, r3(e3));
  }
  function ji(t, e3, r3) {
    let n = e3 === '"' ? "'" : '"', o = ne(0, t, /\\(.)|(["'])/gs, (i, D, s) => D === n ? D : s === e3 ? "\\" + s : s || (r3 && /^[^\n\r"'0-7\\bfnrt-vx\u2028\u2029]$/.test(D) ? D : "\\" + D));
    return e3 + o + e3;
  }
  function Ui(t, e3) {
    return arguments.length === 2 || typeof e3 == "number" ? gt(t, e3) : Yi(...arguments);
  }
  function de(t, e3 = 1) {
    return async (...r3) => {
      let n = r3[e3] ?? {}, u = n.plugins ?? [];
      return r3[e3] = { ...n, plugins: Array.isArray(u) ? u : Object.values(u) }, await t(...r3);
    };
  }
  var Ou = de(Dr);
  async function Pu(t, e3) {
    let { formatted: r3 } = await Ou(t, { ...e3, cursorOffset: -1 });
    return r3;
  }
  async function Vi(t, e3) {
    return await Pu(t, e3) === t;
  }
  var Wi = de(it, 0);
  var $i = { parse: de(du), formatAST: de(Fu), formatDoc: de(Eu), printToDoc: de(Cu), printDocToString: de(hu) };

  // ../package/plugins/meriyah.mjs
  var meriyah_exports = {};
  __export(meriyah_exports, {
    default: () => _2,
    parsers: () => rt2
  });
  var J2 = Object.defineProperty;
  var ht2 = (e3, t) => {
    for (var n in t) J2(e3, n, { get: t[n], enumerable: true });
  };
  var _2 = {};
  ht2(_2, { parsers: () => rt2 });
  var rt2 = {};
  ht2(rt2, { meriyah: () => ci2 });
  var j2 = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty);
  var ae2 = j2;
  var Z2 = (e3, t) => (n, u, ...o) => n | 1 && u == null ? void 0 : (t.call(u) ?? u[e3]).apply(u, o);
  var X2 = String.prototype.replaceAll ?? function(e3, t) {
    return e3.global ? this.replace(e3, t) : this.split(e3).join(t);
  };
  var H2 = Z2("replaceAll", function() {
    if (typeof this == "string") return X2;
  });
  var $2 = H2;
  var W2 = 55296;
  var z2 = 56319;
  var K2 = 56320;
  var $22 = String.prototype.isWellFormed ?? function() {
    let { length: e3 } = this;
    for (let t = 0; t < e3; t++) {
      let n = this.charCodeAt(t);
      if ((n & 64512) === W2 && (n > z2 || ++t >= e3 || (this.charCodeAt(t) & 64512) !== K2)) return false;
    }
    return true;
  };
  var Y2 = Z2("isWellFormed", function() {
    if (typeof this == "string") return $22;
  });
  var kt2 = Y2;
  var wt2 = ((e3, t) => {
    let n = new Uint32Array(69632), u = 0, o = 0;
    for (; u < 2597; ) {
      let i = e3[u++];
      if (i < 0) o -= i;
      else {
        let l3 = e3[u++];
        i & 2 && (l3 = t[l3]), i & 1 ? n.fill(l3, o, o += e3[u++]) : n[o++] = l3;
      }
    }
    return n;
  })([-1, 2, 26, 2, 27, 2, 5, -1, 0, 77595648, 3, 44, 2, 3, 0, 14, 2, 61, 2, 62, 3, 0, 3, 0, 3168796671, 0, 4294956992, 2, 1, 2, 0, 2, 41, 3, 0, 4, 0, 4294966523, 3, 0, 4, 2, 16, 2, 63, 2, 0, 0, 4294836735, 0, 3221225471, 0, 4294901942, 2, 64, 0, 134152192, 3, 0, 2, 0, 4294951935, 3, 0, 2, 0, 2683305983, 0, 2684354047, 2, 17, 2, 0, 0, 4294961151, 3, 0, 2, 2, 19, 2, 0, 0, 608174079, 2, 0, 2, 58, 2, 7, 2, 6, 0, 4286643967, 3, 0, 2, 2, 1, 3, 0, 3, 0, 4294901711, 2, 40, 0, 4089839103, 0, 2961209759, 0, 1342439375, 0, 4294543342, 0, 3547201023, 0, 1577204103, 0, 4194240, 0, 4294688750, 2, 2, 0, 80831, 0, 4261478351, 0, 4294549486, 2, 2, 0, 2967484831, 0, 196559, 0, 3594373100, 0, 3288319768, 0, 8469959, 0, 65472, 2, 3, 0, 4093640191, 0, 929054175, 0, 65487, 0, 4294828015, 0, 4092591615, 0, 1885355487, 0, 982991, 2, 3, 2, 0, 0, 2163244511, 0, 4227923919, 0, 4236247022, 2, 69, 0, 4284449919, 0, 851904, 2, 4, 2, 12, 0, 67076095, -1, 2, 70, 0, 1073741743, 0, 4093607775, -1, 0, 50331649, 0, 3265266687, 2, 33, 0, 4294844415, 0, 4278190047, 2, 20, 2, 137, -1, 3, 0, 2, 2, 23, 2, 0, 2, 9, 2, 0, 2, 15, 2, 22, 3, 0, 10, 2, 72, 2, 0, 2, 73, 2, 74, 2, 75, 2, 0, 2, 76, 2, 0, 2, 11, 0, 261632, 2, 25, 3, 0, 2, 2, 13, 2, 4, 3, 0, 18, 2, 77, 2, 5, 3, 0, 2, 2, 78, 0, 2151677951, 2, 29, 2, 10, 0, 909311, 3, 0, 2, 0, 814743551, 2, 48, 0, 67090432, 3, 0, 2, 2, 42, 2, 0, 2, 6, 2, 0, 2, 30, 2, 8, 0, 268374015, 2, 108, 2, 51, 2, 0, 2, 79, 0, 134153215, -1, 2, 7, 2, 0, 2, 8, 0, 2684354559, 0, 67044351, 0, 3221160064, 2, 9, 2, 18, 3, 0, 2, 2, 53, 0, 1046528, 3, 0, 3, 2, 10, 2, 0, 2, 127, 0, 4294960127, 2, 9, 2, 6, 2, 11, 0, 4294377472, 2, 12, 3, 0, 16, 2, 13, 2, 0, 2, 80, 2, 9, 2, 0, 2, 81, 2, 82, 2, 83, 0, 12288, 2, 54, 0, 1048577, 2, 84, 2, 14, -1, 2, 14, 0, 131042, 2, 85, 2, 86, 2, 87, 2, 0, 2, 34, -83, 3, 0, 7, 0, 1046559, 2, 0, 2, 15, 2, 0, 0, 2147516671, 2, 21, 3, 88, 2, 2, 0, -16, 2, 89, 0, 524222462, 2, 4, 2, 0, 0, 4269801471, 2, 4, 3, 0, 2, 2, 28, 2, 16, 3, 0, 2, 2, 49, 2, 0, -1, 2, 17, -16, 3, 0, 206, -2, 3, 0, 692, 2, 71, -1, 2, 17, 2, 9, 3, 0, 8, 2, 91, 2, 18, 2, 0, 0, 3220242431, 3, 0, 3, 2, 19, 2, 92, 2, 93, 3, 0, 2, 2, 94, 2, 0, 2, 20, 2, 95, 2, 0, 0, 4351, 2, 0, 2, 10, 3, 0, 2, 0, 67043391, 0, 3909091327, 2, 0, 2, 24, 2, 10, 2, 20, 3, 0, 2, 0, 67076097, 2, 8, 2, 0, 2, 21, 0, 67059711, 0, 4236247039, 3, 0, 2, 0, 939524103, 0, 8191999, 2, 99, 2, 100, 2, 22, 2, 23, 3, 0, 3, 0, 67057663, 3, 0, 349, 2, 101, 2, 102, 2, 7, -264, 3, 0, 11, 2, 24, 3, 0, 2, 2, 32, -1, 0, 3774349439, 2, 103, 2, 104, 3, 0, 2, 2, 19, 2, 105, 3, 0, 10, 2, 9, 2, 17, 2, 0, 2, 46, 2, 0, 2, 31, 2, 106, 2, 25, 0, 1638399, 0, 57344, 2, 107, 3, 0, 3, 2, 20, 2, 26, 2, 27, 2, 5, 2, 28, 2, 0, 2, 8, 2, 109, -1, 2, 110, 2, 111, 2, 112, -1, 3, 0, 3, 2, 12, -2, 2, 0, 2, 29, -3, 0, 536870912, -4, 2, 20, 2, 0, 2, 36, 0, 1, 2, 0, 2, 65, 2, 6, 2, 12, 2, 9, 2, 0, 2, 113, -1, 3, 0, 4, 2, 9, 2, 23, 2, 114, 2, 7, 2, 0, 2, 115, 2, 0, 2, 116, 2, 117, 2, 118, 2, 0, 2, 10, 3, 0, 9, 2, 21, 2, 30, 2, 31, 2, 119, 2, 120, -2, 2, 121, 2, 122, 2, 30, 2, 21, 2, 8, -2, 2, 123, 2, 30, 3, 32, 2, -1, 2, 0, 2, 39, -2, 0, 4277137519, 0, 2269118463, -1, 3, 20, 2, -1, 2, 33, 2, 38, 2, 0, 3, 30, 2, 2, 35, 2, 19, -3, 3, 0, 2, 2, 34, -1, 2, 0, 2, 35, 2, 0, 2, 35, 2, 0, 2, 47, 2, 0, 0, 4294950463, 2, 37, -7, 2, 0, 0, 203775, 2, 125, 0, 4227858432, 2, 20, 2, 43, 2, 36, 2, 17, 2, 37, 2, 17, 2, 124, 2, 21, 3, 0, 2, 2, 38, 0, 2151677888, 2, 0, 2, 12, 0, 4294901764, 2, 145, 2, 0, 2, 56, 2, 55, 0, 5242879, 3, 0, 2, 0, 402644511, -1, 2, 128, 2, 39, 0, 3, -1, 2, 129, 2, 130, 2, 0, 0, 67045375, 2, 40, 0, 4226678271, 0, 3766565279, 0, 2039759, 2, 132, 2, 41, 0, 1046437, 0, 6, 3, 0, 2, 0, 3288270847, 0, 3, 3, 0, 2, 0, 67043519, -5, 2, 0, 0, 4282384383, 0, 1056964609, -1, 3, 0, 2, 0, 67043345, -1, 2, 0, 2, 42, 2, 23, 2, 50, 2, 11, 2, 59, 2, 38, -5, 2, 0, 2, 12, -3, 3, 0, 2, 0, 2147484671, 2, 133, 0, 4190109695, 2, 52, -2, 2, 134, 0, 4244635647, 0, 27, 2, 0, 2, 8, 2, 43, 2, 0, 2, 66, 2, 17, 2, 0, 2, 42, -3, 2, 31, -2, 2, 0, 2, 45, 2, 57, 2, 44, 2, 45, 2, 135, 2, 46, 0, 8388351, -2, 2, 136, 0, 3028287487, 2, 47, 2, 138, 0, 33259519, 2, 23, 2, 7, 2, 48, -7, 2, 21, 0, 4294836223, 0, 3355443199, 0, 134152199, -2, 2, 67, -2, 3, 0, 28, 2, 32, -3, 3, 0, 3, 2, 49, 3, 0, 6, 2, 50, -81, 2, 17, 3, 0, 2, 2, 36, 3, 0, 33, 2, 25, 2, 30, 3, 0, 124, 2, 12, 3, 0, 18, 2, 38, -213, 2, 0, 2, 32, -54, 3, 0, 17, 2, 42, 2, 8, 2, 23, 2, 0, 2, 8, 2, 23, 2, 51, 2, 0, 2, 21, 2, 52, 2, 139, 2, 25, -13, 2, 0, 2, 53, -6, 3, 0, 2, -1, 2, 140, 2, 10, -1, 3, 0, 2, 0, 4294936575, 2, 0, 0, 4294934783, -2, 0, 8323099, 3, 0, 230, 2, 30, 2, 54, 2, 8, -3, 3, 0, 3, 2, 35, -271, 2, 141, 3, 0, 9, 2, 142, 2, 143, 2, 55, 3, 0, 11, 2, 7, -72, 3, 0, 3, 2, 144, 0, 1677656575, -130, 2, 26, -16, 2, 0, 2, 24, 2, 38, -16, 0, 4161266656, 0, 4071, 0, 15360, -4, 0, 28, -13, 3, 0, 2, 2, 56, 2, 0, 2, 146, 2, 147, 2, 60, 2, 0, 2, 148, 2, 149, 2, 150, 3, 0, 10, 2, 151, 2, 152, 2, 22, 3, 56, 2, 3, 153, 2, 3, 57, 2, 0, 4294954999, 2, 0, -16, 2, 0, 2, 90, 2, 0, 0, 2105343, 0, 4160749584, 0, 65534, -34, 2, 8, 2, 155, -6, 0, 4194303871, 0, 4294903771, 2, 0, 2, 58, 2, 98, -3, 2, 0, 0, 1073684479, 0, 17407, -9, 2, 17, 2, 49, 2, 0, 2, 32, -14, 2, 17, 2, 32, -6, 2, 17, 2, 12, -6, 2, 8, 0, 3225419775, -7, 2, 156, 3, 0, 6, 0, 8323103, -1, 3, 0, 2, 2, 59, -37, 2, 60, 2, 157, 2, 158, 2, 159, 2, 160, 2, 161, -105, 2, 26, -32, 3, 0, 1335, -1, 3, 0, 136, 2, 9, 3, 0, 180, 2, 24, 3, 0, 233, 2, 162, 3, 0, 18, 2, 9, -77, 3, 0, 16, 2, 9, -47, 3, 0, 154, 2, 6, 3, 0, 264, 2, 32, -22116, 3, 0, 7, 2, 25, -6130, 3, 5, 2, -1, 0, 69207040, 3, 44, 2, 3, 0, 14, 2, 61, 2, 62, -3, 0, 3168731136, 0, 4294956864, 2, 1, 2, 0, 2, 41, 3, 0, 4, 0, 4294966275, 3, 0, 4, 2, 16, 2, 63, 2, 0, 2, 34, -1, 2, 17, 2, 64, -1, 2, 0, 0, 2047, 0, 4294885376, 3, 0, 2, 0, 3145727, 0, 2617294944, 0, 4294770688, 2, 25, 2, 65, 3, 0, 2, 0, 131135, 2, 96, 0, 70256639, 0, 71303167, 0, 272, 2, 42, 2, 6, 0, 65279, 2, 0, 2, 48, -1, 2, 97, 2, 66, 0, 4278255616, 0, 4294836227, 0, 4294549473, 0, 600178175, 0, 2952806400, 0, 268632067, 0, 4294543328, 0, 57540095, 0, 1577058304, 0, 1835008, 0, 4294688736, 2, 68, 2, 67, 0, 33554435, 2, 131, 2, 68, 0, 2952790016, 0, 131075, 0, 3594373096, 0, 67094296, 2, 67, -1, 0, 4294828e3, 0, 603979263, 0, 922746880, 0, 3, 0, 4294828001, 0, 602930687, 0, 1879048192, 0, 393219, 0, 4294828016, 0, 671088639, 0, 2154840064, 0, 4227858435, 0, 4236247008, 2, 69, 2, 38, -1, 2, 4, 0, 917503, 2, 38, -1, 2, 70, 0, 537788335, 0, 4026531935, -1, 0, 1, -1, 2, 33, 2, 71, 0, 7936, -3, 2, 0, 0, 2147485695, 0, 1010761728, 0, 4292984930, 0, 16387, 2, 0, 2, 15, 2, 22, 3, 0, 10, 2, 72, 2, 0, 2, 73, 2, 74, 2, 75, 2, 0, 2, 76, 2, 0, 2, 12, -1, 2, 25, 3, 0, 2, 2, 13, 2, 4, 3, 0, 18, 2, 77, 2, 5, 3, 0, 2, 2, 78, 0, 2147745791, 3, 19, 2, 0, 122879, 2, 0, 2, 10, 0, 276824064, -2, 3, 0, 2, 2, 42, 2, 0, 0, 4294903295, 2, 0, 2, 30, 2, 8, -1, 2, 17, 2, 51, 2, 0, 2, 79, 2, 48, -1, 2, 21, 2, 0, 2, 29, -2, 0, 128, -2, 2, 28, 2, 10, 0, 8160, -1, 2, 126, 0, 4227907585, 2, 0, 2, 37, 2, 0, 2, 50, 0, 4227915776, 2, 9, 2, 6, 2, 11, -1, 0, 74440192, 3, 0, 6, -2, 3, 0, 8, 2, 13, 2, 0, 2, 80, 2, 9, 2, 0, 2, 81, 2, 82, 2, 83, -3, 2, 84, 2, 14, -3, 2, 85, 2, 86, 2, 87, 2, 0, 2, 34, -83, 3, 0, 7, 0, 817183, 2, 0, 2, 15, 2, 0, 0, 33023, 2, 21, 3, 88, 2, -17, 2, 89, 0, 524157950, 2, 4, 2, 0, 2, 90, 2, 4, 2, 0, 2, 22, 2, 28, 2, 16, 3, 0, 2, 2, 49, 2, 0, -1, 2, 17, -16, 3, 0, 206, -2, 3, 0, 692, 2, 71, -1, 2, 17, 2, 9, 3, 0, 8, 2, 91, 0, 3072, 2, 0, 0, 2147516415, 2, 9, 3, 0, 2, 2, 25, 2, 92, 2, 93, 3, 0, 2, 2, 94, 2, 0, 2, 20, 2, 95, 0, 4294965179, 0, 7, 2, 0, 2, 10, 2, 93, 2, 10, -1, 0, 1761345536, 2, 96, 0, 4294901823, 2, 38, 2, 20, 2, 97, 2, 35, 2, 98, 0, 2080440287, 2, 0, 2, 34, 2, 154, 0, 3296722943, 2, 0, 0, 1046675455, 0, 939524101, 0, 1837055, 2, 99, 2, 100, 2, 22, 2, 23, 3, 0, 3, 0, 7, 3, 0, 349, 2, 101, 2, 102, 2, 7, -264, 3, 0, 11, 2, 24, 3, 0, 2, 2, 32, -1, 0, 2700607615, 2, 103, 2, 104, 3, 0, 2, 2, 19, 2, 105, 3, 0, 10, 2, 9, 2, 17, 2, 0, 2, 46, 2, 0, 2, 31, 2, 106, -3, 2, 107, 3, 0, 3, 2, 20, -1, 3, 5, 2, 2, 108, 2, 0, 2, 8, 2, 109, -1, 2, 110, 2, 111, 2, 112, -1, 3, 0, 3, 2, 12, -2, 2, 0, 2, 29, -8, 2, 20, 2, 0, 2, 36, -1, 2, 0, 2, 65, 2, 6, 2, 30, 2, 9, 2, 0, 2, 113, -1, 3, 0, 4, 2, 9, 2, 17, 2, 114, 2, 7, 2, 0, 2, 115, 2, 0, 2, 116, 2, 117, 2, 118, 2, 0, 2, 10, 3, 0, 9, 2, 21, 2, 30, 2, 31, 2, 119, 2, 120, -2, 2, 121, 2, 122, 2, 30, 2, 21, 2, 8, -2, 2, 123, 2, 30, 3, 32, 2, -1, 2, 0, 2, 39, -2, 0, 4277075969, 2, 30, -1, 3, 20, 2, -1, 2, 33, 2, 124, 2, 0, 3, 30, 2, 2, 35, 2, 19, -3, 3, 0, 2, 2, 34, -1, 2, 0, 2, 35, 2, 0, 2, 35, 2, 0, 2, 50, 2, 96, 0, 4294934591, 2, 37, -7, 2, 0, 0, 197631, 2, 125, -1, 2, 20, 2, 43, 2, 37, 2, 17, 0, 3, 2, 17, 2, 124, 2, 21, 2, 126, 2, 127, -1, 0, 2490368, 2, 126, 2, 25, 2, 17, 2, 34, 2, 126, 2, 38, 0, 4294901904, 0, 4718591, 2, 126, 2, 35, 0, 335544350, -1, 2, 128, 0, 2147487743, 0, 1, -1, 2, 129, 2, 130, 2, 8, -1, 2, 131, 2, 68, 0, 3758161920, 0, 3, 2, 132, 0, 12582911, 0, 655360, -1, 2, 0, 2, 29, 0, 2147485568, 0, 3, 2, 0, 2, 25, 0, 176, -5, 2, 0, 2, 49, 0, 251658240, -1, 2, 0, 2, 25, 0, 16, -1, 2, 0, 0, 16779263, -2, 2, 12, -1, 2, 38, -5, 2, 0, 2, 18, -3, 3, 0, 2, 2, 54, 2, 133, 0, 2147549183, 0, 2, -2, 2, 134, 2, 36, 0, 10, 0, 4294965249, 0, 67633151, 0, 4026597376, 2, 0, 0, 536871935, 2, 17, 2, 0, 2, 42, -6, 2, 0, 0, 1, 2, 57, 2, 49, 0, 1, 2, 135, 2, 25, -3, 2, 136, 2, 36, 2, 137, 2, 138, 0, 16778239, 2, 17, 2, 7, -8, 2, 35, 0, 4294836212, 2, 10, -3, 2, 67, -2, 3, 0, 28, 2, 32, -3, 3, 0, 3, 2, 49, 3, 0, 6, 2, 50, -81, 2, 17, 3, 0, 2, 2, 36, 3, 0, 33, 2, 25, 0, 126, 3, 0, 124, 2, 12, 3, 0, 18, 2, 38, -213, 2, 9, -55, 3, 0, 17, 2, 42, 2, 8, 2, 17, 2, 0, 2, 8, 2, 17, 2, 58, 2, 0, 2, 25, 2, 50, 2, 139, 2, 25, -13, 2, 0, 2, 71, -6, 3, 0, 2, -1, 2, 140, 2, 10, -1, 3, 0, 2, 0, 67583, -1, 2, 105, -2, 0, 8126475, 3, 0, 230, 2, 30, 2, 54, 2, 8, -3, 3, 0, 3, 2, 35, -271, 2, 141, 3, 0, 9, 2, 142, 2, 143, 2, 55, 3, 0, 11, 2, 7, -72, 3, 0, 3, 2, 144, 2, 145, -187, 3, 0, 2, 2, 56, 2, 0, 2, 146, 2, 147, 2, 60, 2, 0, 2, 148, 2, 149, 2, 150, 3, 0, 10, 2, 151, 2, 152, 2, 22, 3, 56, 2, 3, 153, 2, 3, 57, 2, 2, 154, -57, 2, 8, 2, 155, -7, 2, 17, 2, 0, 2, 58, -4, 2, 0, 0, 1065361407, 0, 16384, -9, 2, 17, 2, 58, 2, 0, 2, 18, -14, 2, 17, 2, 18, -6, 2, 17, 0, 81919, -6, 2, 8, 0, 3223273399, -7, 2, 156, 3, 0, 6, 2, 124, -1, 3, 0, 2, 0, 2063, -37, 2, 60, 2, 157, 2, 158, 2, 159, 2, 160, 2, 161, -138, 3, 0, 1335, -1, 3, 0, 136, 2, 9, 3, 0, 180, 2, 24, 3, 0, 233, 2, 162, 3, 0, 18, 2, 9, -77, 3, 0, 16, 2, 9, -47, 3, 0, 154, 2, 6, 3, 0, 264, 2, 32, -28252], [4294967295, 4294967291, 4092460543, 4294828031, 4294967294, 134217726, 4294903807, 268435455, 2147483647, 1073741823, 1048575, 3892314111, 134217727, 1061158911, 536805376, 4294910143, 4294901759, 4294901760, 4095, 262143, 536870911, 8388607, 4160749567, 4294902783, 4294918143, 65535, 67043328, 2281701374, 4294967264, 2097151, 4194303, 255, 67108863, 4294967039, 511, 524287, 131071, 63, 127, 3238002687, 4294549487, 4290772991, 33554431, 4294901888, 4286578687, 67043329, 4294770687, 67043583, 1023, 32767, 15, 2047999, 67043343, 67051519, 2147483648, 4294902e3, 4292870143, 4294966783, 16383, 67047423, 4294967279, 262083, 20511, 41943039, 493567, 4294959104, 603979775, 65536, 602799615, 805044223, 4294965206, 8191, 1031749119, 4294917631, 2134769663, 4286578493, 4282253311, 4294942719, 33540095, 4294905855, 2868854591, 1608515583, 265232348, 534519807, 2147614720, 1060109444, 4093640016, 17376, 2139062143, 224, 4169138175, 4294909951, 4286578688, 4294967292, 4294965759, 4294836224, 4294966272, 4294967280, 32768, 8289918, 4294934399, 4294901775, 4294965375, 1602223615, 4294967259, 4294443008, 268369920, 4292804608, 4294967232, 486341884, 4294963199, 3087007615, 1073692671, 4128527, 4279238655, 4294902015, 4160684047, 4290246655, 469499899, 4294967231, 134086655, 4294966591, 2445279231, 3670015, 31, 252, 4294967288, 16777215, 4294705151, 3221208447, 4294902271, 4294549472, 4294921215, 4285526655, 4294966527, 4294705152, 4294966143, 64, 4294966719, 3774873592, 4194303999, 1877934080, 262151, 2555904, 536807423, 67043839, 3758096383, 3959414372, 3755993023, 2080374783, 4294835295, 4294967103, 4160749565, 4294934527, 4087, 2016, 2147446655, 184024726, 2862017156, 1593309078, 268434431, 268434414, 4294901761]);
  var Q2 = (e3) => (wt2[(e3 >>> 5) + 0] >>> e3 & 31 & 1) !== 0;
  var St2 = (e3) => (wt2[(e3 >>> 5) + 34816] >>> e3 & 31 & 1) !== 0;
  var S2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1032, 0, 0, 2056, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8192, 0, 3, 0, 0, 8192, 0, 0, 0, 256, 0, 33024, 0, 0, 242, 242, 114, 114, 114, 114, 114, 114, 594, 594, 0, 0, 16384, 0, 0, 0, 0, 67, 67, 67, 67, 67, 67, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 1, 0, 0, 4099, 0, 71, 71, 71, 71, 71, 71, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 16384, 0, 0, 0, 0];
  var Z22 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
  var Bt2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
  function Ne2(e3) {
    return e3 <= 127 ? Z22[e3] > 0 : St2(e3);
  }
  function we2(e3) {
    return e3 <= 127 ? Bt2[e3] > 0 : Q2(e3) || e3 === 8204 || e3 === 8205;
  }
  function m(e3) {
    return e3.column++, e3.currentChar = e3.source.charCodeAt(++e3.index);
  }
  function Qe2(e3) {
    let t = e3.currentChar;
    if ((t & 64512) !== 55296) return 0;
    let n = e3.source.charCodeAt(e3.index + 1);
    return (n & 64512) !== 56320 ? 0 : 65536 + ((t & 1023) << 10) + (n & 1023);
  }
  function Ze2(e3, t) {
    e3.currentChar = e3.source.charCodeAt(++e3.index), e3.flags |= 1, (t & 4) === 0 && (e3.column = 0, e3.line++);
  }
  function te2(e3) {
    e3.flags |= 1, e3.currentChar = e3.source.charCodeAt(++e3.index), e3.column = 0, e3.line++;
  }
  function G2(e3) {
    return e3 === 160 || e3 === 65279 || e3 === 133 || e3 === 5760 || e3 >= 8192 && e3 <= 8203 || e3 === 8239 || e3 === 8287 || e3 === 12288 || e3 === 8201 || e3 === 65519;
  }
  function _(e3) {
    return e3 < 65 ? e3 - 48 : e3 - 65 + 10 & 15;
  }
  function x2(e3) {
    switch (e3) {
      case 134283266:
        return "NumericLiteral";
      case 134283267:
        return "StringLiteral";
      case 86021:
      case 86022:
        return "BooleanLiteral";
      case 86023:
        return "NullLiteral";
      case 65540:
        return "RegularExpression";
      case 67174408:
      case 67174409:
      case 131:
        return "TemplateLiteral";
      default:
        return (e3 & 143360) === 143360 ? "Identifier" : (e3 & 4096) === 4096 ? "Keyword" : "Punctuator";
    }
  }
  var Ft2 = ["SingleLine", "MultiLine", "HTMLOpen", "HTMLClose", "HashbangComment"];
  function p2(e3) {
    let { source: t } = e3;
    e3.currentChar === 35 && t.charCodeAt(e3.index + 1) === 33 && (m(e3), m(e3), Ge2(e3, t, 0, 4, e3.tokenStart));
  }
  function yt2(e3, t, n, u, o, i) {
    return u & 2 && e3.report(0), Ge2(e3, t, n, o, i);
  }
  function Ge2(e3, t, n, u, o) {
    let { index: i } = e3;
    for (e3.tokenIndex = e3.index, e3.tokenLine = e3.line, e3.tokenColumn = e3.column; e3.index < e3.end; ) {
      if (S2[e3.currentChar] & 8) {
        let l3 = e3.currentChar === 13;
        te2(e3), l3 && e3.index < e3.end && e3.currentChar === 10 && (e3.currentChar = t.charCodeAt(++e3.index));
        break;
      } else if ((e3.currentChar ^ 8232) <= 1) {
        te2(e3);
        break;
      }
      m(e3), e3.tokenIndex = e3.index, e3.tokenLine = e3.line, e3.tokenColumn = e3.column;
    }
    if (e3.options.onComment) {
      let l3 = { start: { line: o.line, column: o.column }, end: { line: e3.tokenLine, column: e3.tokenColumn } };
      e3.options.onComment(Ft2[u & 255], t.slice(i, e3.tokenIndex), o.index, e3.tokenIndex, l3);
    }
    return n | 1;
  }
  function en2(e3, t, n) {
    let { index: u } = e3;
    for (; e3.index < e3.end; ) if (e3.currentChar < 43) {
      let o = false;
      for (; e3.currentChar === 42; ) if (o || (n &= -5, o = true), m(e3) === 47) {
        if (m(e3), e3.options.onComment) {
          let i = { start: { line: e3.tokenLine, column: e3.tokenColumn }, end: { line: e3.line, column: e3.column } };
          e3.options.onComment(Ft2[1], t.slice(u, e3.index - 2), u - 2, e3.index, i);
        }
        return e3.tokenIndex = e3.index, e3.tokenLine = e3.line, e3.tokenColumn = e3.column, n;
      }
      if (o) continue;
      S2[e3.currentChar] & 8 ? e3.currentChar === 13 ? (n |= 5, te2(e3)) : (Ze2(e3, n), n = n & -5 | 1) : m(e3);
    } else (e3.currentChar ^ 8232) <= 1 ? (n = n & -5 | 1, te2(e3)) : (n &= -5, m(e3));
    e3.report(18);
  }
  var tn2 = { 0: "Unexpected token", 30: "Unexpected token: '%0'", 1: "Octal escape sequences are not allowed in strict mode", 2: "Octal escape sequences are not allowed in template strings", 3: "\\8 and \\9 are not allowed in template strings", 4: "Private identifier #%0 is not defined", 5: "Illegal Unicode escape sequence", 6: "Invalid code point %0", 7: "Invalid hexadecimal escape sequence", 9: "Octal literals are not allowed in strict mode", 8: "Decimal integer literals with a leading zero are forbidden in strict mode", 10: "Expected number in radix %0", 151: "Invalid left-hand side assignment to a destructible right-hand side", 11: "Non-number found after exponent indicator", 12: "Invalid BigIntLiteral", 13: "No identifiers allowed directly after numeric literal", 14: "Escapes \\8 or \\9 are not syntactically valid escapes", 15: "Escapes \\8 or \\9 are not allowed in strict mode", 16: "Unterminated string literal", 17: "Unterminated template literal", 18: "Multiline comment was not closed properly", 19: "The identifier contained dynamic unicode escape that was not closed", 20: "Illegal character '%0'", 21: "Missing hexadecimal digits", 22: "Invalid implicit octal", 23: "Invalid line break in string literal", 24: "Only unicode escapes are legal in identifier names", 25: "Expected '%0'", 26: "Invalid left-hand side in assignment", 27: "Invalid left-hand side in async arrow", 28: 'Calls to super must be in the "constructor" method of a class expression or class declaration that has a superclass', 29: "Member access on super must be in a method", 31: "Await expression not allowed in formal parameter", 32: "Yield expression not allowed in formal parameter", 95: "Unexpected token: 'escaped keyword'", 33: "Unary expressions as the left operand of an exponentiation expression must be disambiguated with parentheses", 123: "Async functions can only be declared at the top level or inside a block", 34: "Unterminated regular expression", 35: "Unexpected regular expression flag", 36: "Duplicate regular expression flag '%0'", 37: "%0 functions must have exactly %1 argument%2", 38: "Setter function argument must not be a rest parameter", 39: "%0 declaration must have a name in this context", 40: "Function name may not contain any reserved words or be eval or arguments in strict mode", 41: "The rest operator is missing an argument", 42: "A getter cannot be a generator", 43: "A setter cannot be a generator", 44: "A computed property name must be followed by a colon or paren", 134: "Object literal keys that are strings or numbers must be a method or have a colon", 46: "Found `* async x(){}` but this should be `async * x(){}`", 45: "Getters and setters can not be generators", 47: "'%0' can not be generator method", 48: "No line break is allowed after '=>'", 49: "The left-hand side of the arrow can only be destructed through assignment", 50: "The binding declaration is not destructible", 51: "Async arrow can not be followed by new expression", 52: "Classes may not have a static property named 'prototype'", 53: "Class constructor may not be a %0", 54: "Duplicate constructor method in class", 55: "Invalid increment/decrement operand", 56: "Invalid use of `new` keyword on an increment/decrement expression", 57: "`=>` is an invalid assignment target", 58: "Rest element may not have a trailing comma", 59: "Missing initializer in %0 declaration", 60: "'for-%0' loop head declarations can not have an initializer", 61: "Invalid left-hand side in for-%0 loop: Must have a single binding", 62: "Invalid shorthand property initializer", 63: "Property name __proto__ appears more than once in object literal", 64: "Let is disallowed as a lexically bound name", 65: "Invalid use of '%0' inside new expression", 66: "Illegal 'use strict' directive in function with non-simple parameter list", 67: 'Identifier "let" disallowed as left-hand side expression in strict mode', 68: "Illegal continue statement", 69: "Illegal break statement", 70: "Cannot have `let[...]` as a var name in strict mode", 71: "Invalid destructuring assignment target", 72: "Rest parameter may not have a default initializer", 73: "The rest argument must the be last parameter", 74: "Invalid rest argument", 76: "In strict mode code, functions can only be declared at top level or inside a block", 77: "In non-strict mode code, functions can only be declared at top level, inside a block, or as the body of an if statement", 78: "Without web compatibility enabled functions can not be declared at top level, inside a block, or as the body of an if statement", 79: "Class declaration can't appear in single-statement context", 80: "Invalid left-hand side in for-%0", 81: "Invalid assignment in for-%0", 82: "for await (... of ...) is only valid in async functions and async generators", 83: "The first token after the template expression should be a continuation of the template", 85: "`let` declaration not allowed here and `let` cannot be a regular var name in strict mode", 84: "`let \n [` is a restricted production at the start of a statement", 86: "Catch clause requires exactly one parameter, not more (and no trailing comma)", 87: "Catch clause parameter does not support default values", 88: "Missing catch or finally after try", 89: "More than one default clause in switch statement", 90: "Illegal newline after throw", 91: "Strict mode code may not include a with statement", 92: "Illegal return statement", 93: "The left hand side of the for-header binding declaration is not destructible", 94: "new.target only allowed within functions or static blocks", 96: "'#' not followed by identifier", 102: "Invalid keyword", 101: "Can not use 'let' as a class name", 100: "'A lexical declaration can't define a 'let' binding", 99: "Can not use `let` as variable name in strict mode", 97: "'%0' may not be used as an identifier in this context", 98: "Await is only valid in async functions", 103: "The %0 keyword can only be used with the module goal", 104: "Unicode codepoint must not be greater than 0x10FFFF", 105: "%0 source must be string", 106: "Only a identifier or string can be used to indicate alias", 107: "Only '*' or '{...}' can be imported after default", 108: "Trailing decorator may be followed by method", 109: "Decorators can't be used with a constructor", 110: "Can not use `await` as identifier in module or async func", 111: "Can not use `await` as identifier in module", 112: "HTML comments are only allowed with web compatibility (Annex B)", 113: "The identifier 'let' must not be in expression position in strict mode", 114: "Cannot assign to `eval` and `arguments` in strict mode", 115: "The left-hand side of a for-of loop may not start with 'let'", 116: "Block body arrows can not be immediately invoked without a group", 117: "Block body arrows can not be immediately accessed without a group", 118: "Unexpected strict mode reserved word", 119: "Unexpected eval or arguments in strict mode", 120: "Decorators must not be followed by a semicolon", 121: "Calling delete on expression not allowed in strict mode", 122: "Pattern can not have a tail", 124: "Can not have a `yield` expression on the left side of a ternary", 125: "An arrow function can not have a postfix update operator", 126: "Invalid object literal key character after generator star", 127: "Private fields can not be deleted", 129: "Classes may not have a field called constructor", 128: "Classes may not have a private element named constructor", 130: "A class field initializer or static block may not contain arguments", 131: "Generators can only be declared at the top level or inside a block", 132: "Async methods are a restricted production and cannot have a newline following it", 133: "Unexpected character after object literal property name", 135: "Invalid key token", 136: "Label '%0' has already been declared", 137: "continue statement must be nested within an iteration statement", 138: "Undefined label '%0'", 139: "Trailing comma is disallowed inside import(...) arguments", 140: "Invalid binding in JSON import", 141: "import() requires exactly one argument", 142: "Cannot use new with import(...)", 143: "... is not allowed in import()", 144: "Expected '=>'", 145: "Duplicate binding '%0'", 146: "Duplicate private identifier #%0", 147: "Cannot export a duplicate name '%0'", 150: "Duplicate %0 for-binding", 148: "Exported binding '%0' needs to refer to a top-level declared variable", 149: "Unexpected private field", 153: "Numeric separators are not allowed at the end of numeric literals", 152: "Only one underscore is allowed as numeric separator", 154: "JSX value should be either an expression or a quoted JSX text", 155: "Expected corresponding JSX closing tag for %0", 156: "Adjacent JSX elements must be wrapped in an enclosing tag", 157: "JSX attributes must only be assigned a non-empty 'expression'", 158: "'%0' has already been declared", 159: "'%0' shadowed a catch clause binding", 160: "Dot property must be an identifier", 161: "Encountered invalid input after spread/rest argument", 162: "Catch without try", 163: "Finally without try", 164: "Expected corresponding closing tag for JSX fragment", 165: "Coalescing and logical operators used together in the same expression must be disambiguated with parentheses", 166: "Invalid tagged template on optional chain", 167: "Invalid optional chain from super property", 168: "Invalid optional chain from new expression", 169: 'Cannot use "import.meta" outside a module', 170: "Leading decorators must be attached to a class declaration", 171: "An export name cannot include a lone surrogate", 172: "A string literal cannot be used as an exported binding without `from`", 173: "Private fields can't be accessed on super", 174: "The only valid meta property for import is 'import.meta'", 175: "'import.meta' must not contain escaped characters", 176: 'cannot use "await" as identifier inside an async function', 177: 'cannot use "await" in static blocks' };
  var q2 = class extends SyntaxError {
    constructor(t, n, u, ...o) {
      let i = tn2[u].replace(/%(\d+)/g, (f, c) => o[c]), l3 = "[" + t.line + ":" + t.column + "-" + n.line + ":" + n.column + "]: " + i;
      super(l3);
      __publicField(this, "start");
      __publicField(this, "end");
      __publicField(this, "range");
      __publicField(this, "loc");
      __publicField(this, "description");
      this.start = t.index, this.end = n.index, this.range = [t.index, n.index], this.loc = { start: { line: t.line, column: t.column }, end: { line: n.line, column: n.column } }, this.description = i;
    }
  };
  function Nt2(e3, t) {
    return ae2(e3, t) ? e3[t] : void 0;
  }
  var B = ["end of source", "identifier", "number", "string", "regular expression", "false", "true", "null", "template continuation", "template tail", "=>", "(", "{", ".", "...", "}", ")", ";", ",", "[", "]", ":", "?", "'", '"', "++", "--", "=", "<<=", ">>=", ">>>=", "**=", "+=", "-=", "*=", "/=", "%=", "^=", "|=", "&=", "||=", "&&=", "??=", "typeof", "delete", "void", "!", "~", "+", "-", "in", "instanceof", "*", "%", "/", "**", "&&", "||", "===", "!==", "==", "!=", "<=", ">=", "<", ">", "<<", ">>", ">>>", "&", "|", "^", "var", "let", "const", "break", "case", "catch", "class", "continue", "debugger", "default", "do", "else", "export", "extends", "finally", "for", "function", "if", "import", "new", "return", "super", "switch", "this", "throw", "try", "while", "with", "implements", "interface", "package", "private", "protected", "public", "static", "yield", "as", "async", "await", "constructor", "get", "set", "accessor", "from", "of", "enum", "eval", "arguments", "escaped keyword", "escaped future reserved keyword", "reserved if strict", "#", "BigIntLiteral", "??", "?.", "WhiteSpace", "Illegal", "LineTerminator", "PrivateField", "Template", "@", "target", "meta", "LineFeed", "Escaped", "JSXText"];
  var It2 = { this: 86111, function: 86104, if: 20569, return: 20572, var: 86088, else: 20563, for: 20567, new: 86107, in: 8673330, typeof: 16863275, while: 20578, case: 20556, break: 20555, try: 20577, catch: 20557, delete: 16863276, throw: 86112, switch: 86110, continue: 20559, default: 20561, instanceof: 8411187, do: 20562, void: 16863277, finally: 20566, async: 209005, await: 209006, class: 86094, const: 86090, constructor: 12399, debugger: 20560, export: 20564, extends: 20565, false: 86021, from: 209011, get: 209008, implements: 36964, import: 86106, interface: 36965, let: 241737, null: 86023, of: 471156, package: 36966, private: 36967, protected: 36968, public: 36969, set: 209009, static: 36970, super: 86109, true: 86022, with: 20579, yield: 241771, enum: 86133, eval: 537079926, as: 77932, arguments: 537079927, target: 209029, meta: 209030, accessor: 12402 };
  function At2(e3, t, n) {
    for (; Bt2[m(e3)]; ) ;
    return e3.tokenValue = e3.source.slice(e3.tokenIndex, e3.index), e3.currentChar !== 92 && e3.currentChar <= 126 ? Nt2(It2, e3.tokenValue) ?? 208897 : xe2(e3, t, 0, n);
  }
  function nn2(e3, t) {
    let n = Lt2(e3);
    return Ne2(n) || e3.report(5), e3.tokenValue = String.fromCodePoint(n), xe2(e3, t, 1, S2[n] & 4);
  }
  function xe2(e3, t, n, u) {
    let o = e3.index;
    for (; e3.index < e3.end; ) if (e3.currentChar === 92) {
      e3.tokenValue += e3.source.slice(o, e3.index), n = 1;
      let l3 = Lt2(e3);
      we2(l3) || e3.report(5), u = u && S2[l3] & 4, e3.tokenValue += String.fromCodePoint(l3), o = e3.index;
    } else {
      let l3 = Qe2(e3);
      if (l3 > 0) we2(l3) || e3.report(20, String.fromCodePoint(l3)), e3.currentChar = l3, e3.index++, e3.column++;
      else if (!we2(e3.currentChar)) break;
      m(e3);
    }
    e3.index <= e3.end && (e3.tokenValue += e3.source.slice(o, e3.index));
    let { length: i } = e3.tokenValue;
    if (u && i >= 2 && i <= 11) {
      let l3 = Nt2(It2, e3.tokenValue);
      return l3 === void 0 ? 208897 | (n ? -2147483648 : 0) : n ? l3 === 209006 ? (t & 2050) === 0 ? l3 | -2147483648 : -2147483528 : t & 1 ? l3 === 36970 || (l3 & 36864) === 36864 ? -2147483527 : (l3 & 20480) === 20480 ? t & 262144 && (t & 8) === 0 ? l3 | -2147483648 : -2147483528 : -2147274630 : t & 262144 && (t & 8) === 0 && (l3 & 20480) === 20480 ? l3 | -2147483648 : l3 === 241771 ? t & 262144 ? -2147274630 : t & 1024 ? -2147483528 : l3 | -2147483648 : l3 === 209005 ? -2147274630 : (l3 & 36864) === 36864 ? l3 | 12288 | -2147483648 : -2147483528 : l3;
    }
    return 208897 | (n ? -2147483648 : 0);
  }
  function un2(e3) {
    let t = m(e3);
    if (t === 92) return 130;
    let n = Qe2(e3);
    return n && (t = n), Ne2(t) || e3.report(96), 130;
  }
  function Lt2(e3) {
    return e3.source.charCodeAt(e3.index + 1) !== 117 && e3.report(5), e3.currentChar = e3.source.charCodeAt(e3.index += 2), e3.column += 2, on2(e3);
  }
  function on2(e3) {
    let t = 0, n = e3.currentChar;
    if (n === 123) {
      let l3 = e3.index - 2;
      for (; S2[m(e3)] & 64; ) if (t = t << 4 | _(e3.currentChar), t > 1114111) throw new q2({ index: l3, line: e3.line, column: e3.column }, e3.currentLocation, 104);
      if (e3.currentChar !== 125) throw new q2({ index: l3, line: e3.line, column: e3.column }, e3.currentLocation, 7);
      return m(e3), t;
    }
    (S2[n] & 64) === 0 && e3.report(7);
    let u = e3.source.charCodeAt(e3.index + 1);
    (S2[u] & 64) === 0 && e3.report(7);
    let o = e3.source.charCodeAt(e3.index + 2);
    (S2[o] & 64) === 0 && e3.report(7);
    let i = e3.source.charCodeAt(e3.index + 3);
    return (S2[i] & 64) === 0 && e3.report(7), t = _(n) << 12 | _(u) << 8 | _(o) << 4 | _(i), e3.currentChar = e3.source.charCodeAt(e3.index += 4), e3.column += 4, t;
  }
  function Tt2(e3, t, n) {
    let u = e3.currentChar, o = 0, i = 9, l3 = n & 64 ? 0 : 1, f = 0, c = 0;
    if (n & 64) o = "." + Ce2(e3, u), u = e3.currentChar, u === 110 && e3.report(12);
    else {
      if (u === 48) if (u = m(e3), (u | 32) === 120) {
        for (n = 136, u = m(e3); S2[u] & 4160; ) {
          if (u === 95) {
            c || e3.report(152), c = 0, u = m(e3);
            continue;
          }
          c = 1, o = o * 16 + _(u), f++, u = m(e3);
        }
        (f === 0 || !c) && e3.report(f === 0 ? 21 : 153);
      } else if ((u | 32) === 111) {
        for (n = 132, u = m(e3); S2[u] & 4128; ) {
          if (u === 95) {
            c || e3.report(152), c = 0, u = m(e3);
            continue;
          }
          c = 1, o = o * 8 + (u - 48), f++, u = m(e3);
        }
        (f === 0 || !c) && e3.report(f === 0 ? 0 : 153);
      } else if ((u | 32) === 98) {
        for (n = 130, u = m(e3); S2[u] & 4224; ) {
          if (u === 95) {
            c || e3.report(152), c = 0, u = m(e3);
            continue;
          }
          c = 1, o = o * 2 + (u - 48), f++, u = m(e3);
        }
        (f === 0 || !c) && e3.report(f === 0 ? 0 : 153);
      } else if (S2[u] & 32) for (t & 1 && e3.report(1), n = 1; S2[u] & 16; ) {
        if (S2[u] & 512) {
          n = 32, l3 = 0;
          break;
        }
        o = o * 8 + (u - 48), u = m(e3);
      }
      else S2[u] & 512 ? (t & 1 && e3.report(1), e3.flags |= 64, n = 32) : u === 95 && e3.report(0);
      if (n & 48) {
        if (l3) {
          for (; i >= 0 && S2[u] & 4112; ) {
            if (u === 95) {
              if (u = m(e3), u === 95 || n & 32) throw new q2(e3.currentLocation, { index: e3.index + 1, line: e3.line, column: e3.column }, 152);
              c = 1;
              continue;
            }
            c = 0, o = 10 * o + (u - 48), u = m(e3), --i;
          }
          if (c) throw new q2(e3.currentLocation, { index: e3.index + 1, line: e3.line, column: e3.column }, 153);
          if (i >= 0 && !Ne2(u) && u !== 46) return e3.tokenValue = o, e3.options.raw && (e3.tokenRaw = e3.source.slice(e3.tokenIndex, e3.index)), 134283266;
        }
        o += Ce2(e3, u), u = e3.currentChar, u === 46 && (m(e3) === 95 && e3.report(0), n = 64, o += "." + Ce2(e3, e3.currentChar), u = e3.currentChar);
      }
    }
    let a = e3.index, s = 0;
    if (u === 110 && n & 128) s = 1, u = m(e3);
    else if ((u | 32) === 101) {
      u = m(e3), S2[u] & 256 && (u = m(e3));
      let { index: d3 } = e3;
      (S2[u] & 16) === 0 && e3.report(11), o += e3.source.substring(a, d3) + Ce2(e3, u), u = e3.currentChar;
    }
    return (e3.index < e3.end && S2[u] & 16 || Ne2(u)) && e3.report(13), s ? (e3.tokenRaw = e3.source.slice(e3.tokenIndex, e3.index), e3.tokenValue = BigInt($2(0, e3.tokenRaw.slice(0, -1), "_", "")), 134283388) : (e3.tokenValue = n & 15 ? o : n & 32 ? parseFloat(e3.source.substring(e3.tokenIndex, e3.index)) : +o, e3.options.raw && (e3.tokenRaw = e3.source.slice(e3.tokenIndex, e3.index)), 134283266);
  }
  function Ce2(e3, t) {
    let n = 0, u = e3.index, o = "";
    for (; S2[t] & 4112; ) {
      if (t === 95) {
        let { index: i } = e3;
        if (t = m(e3), t === 95) throw new q2(e3.currentLocation, { index: e3.index + 1, line: e3.line, column: e3.column }, 152);
        n = 1, o += e3.source.substring(u, i), u = e3.index;
        continue;
      }
      n = 0, t = m(e3);
    }
    if (n) throw new q2(e3.currentLocation, { index: e3.index + 1, line: e3.line, column: e3.column }, 153);
    return o + e3.source.substring(u, e3.index);
  }
  var G3;
  (function(e3) {
    e3[e3.Empty = 0] = "Empty", e3[e3.Escape = 1] = "Escape", e3[e3.Class = 2] = "Class";
  })(G3 || (G3 = {}));
  var P;
  (function(e3) {
    e3[e3.Empty = 0] = "Empty", e3[e3.IgnoreCase = 1] = "IgnoreCase", e3[e3.Global = 2] = "Global", e3[e3.Multiline = 4] = "Multiline", e3[e3.Unicode = 16] = "Unicode", e3[e3.Sticky = 8] = "Sticky", e3[e3.DotAll = 32] = "DotAll", e3[e3.Indices = 64] = "Indices", e3[e3.UnicodeSets = 128] = "UnicodeSets";
  })(P || (P = {}));
  function ln2(e3) {
    let t = e3.index, n = G3.Empty;
    e: for (; ; ) {
      let a = e3.currentChar;
      if (m(e3), n & G3.Escape) n &= ~G3.Escape;
      else switch (a) {
        case 47:
          if (n) break;
          break e;
        case 92:
          n |= G3.Escape;
          break;
        case 91:
          n |= G3.Class;
          break;
        case 93:
          n &= G3.Escape;
          break;
      }
      if ((a === 13 || a === 10 || a === 8232 || a === 8233) && e3.report(34), e3.index >= e3.source.length) return e3.report(34);
    }
    let u = e3.index - 1, o = P.Empty, i = e3.currentChar, { index: l3 } = e3;
    for (; we2(i); ) {
      switch (i) {
        case 103:
          o & P.Global && e3.report(36, "g"), o |= P.Global;
          break;
        case 105:
          o & P.IgnoreCase && e3.report(36, "i"), o |= P.IgnoreCase;
          break;
        case 109:
          o & P.Multiline && e3.report(36, "m"), o |= P.Multiline;
          break;
        case 117:
          o & P.Unicode && e3.report(36, "u"), o & P.UnicodeSets && e3.report(36, "vu"), o |= P.Unicode;
          break;
        case 118:
          o & P.Unicode && e3.report(36, "uv"), o & P.UnicodeSets && e3.report(36, "v"), o |= P.UnicodeSets;
          break;
        case 121:
          o & P.Sticky && e3.report(36, "y"), o |= P.Sticky;
          break;
        case 115:
          o & P.DotAll && e3.report(36, "s"), o |= P.DotAll;
          break;
        case 100:
          o & P.Indices && e3.report(36, "d"), o |= P.Indices;
          break;
        default:
          e3.report(35);
      }
      i = m(e3);
    }
    let f = e3.source.slice(l3, e3.index), c = e3.source.slice(t, u);
    return e3.tokenRegExp = { pattern: c, flags: f }, e3.options.raw && (e3.tokenRaw = e3.source.slice(e3.tokenIndex, e3.index)), e3.tokenValue = fn2(e3, c, f), 65540;
  }
  function fn2(e3, t, n) {
    try {
      return new RegExp(t, n);
    } catch {
      if (!e3.options.validateRegex) return null;
      e3.report(34);
    }
  }
  function cn2(e3, t, n) {
    let { index: u } = e3, o = "", i = m(e3), l3 = e3.index;
    for (; (S2[i] & 8) === 0; ) {
      if (i === n) return o += e3.source.slice(l3, e3.index), m(e3), e3.options.raw && (e3.tokenRaw = e3.source.slice(u, e3.index)), e3.tokenValue = o, 134283267;
      if ((i & 8) === 8 && i === 92) {
        if (o += e3.source.slice(l3, e3.index), i = m(e3), i < 127 || i === 8232 || i === 8233) {
          let f = qt2(e3, t, i);
          f >= 0 ? o += String.fromCodePoint(f) : Pt2(e3, f, 0);
        } else o += String.fromCodePoint(i);
        l3 = e3.index + 1;
      } else (i === 8232 || i === 8233) && (e3.column = -1, e3.line++);
      e3.index >= e3.end && e3.report(16), i = m(e3);
    }
    e3.report(16);
  }
  function qt2(e3, t, n, u = 0) {
    switch (n) {
      case 98:
        return 8;
      case 102:
        return 12;
      case 114:
        return 13;
      case 110:
        return 10;
      case 116:
        return 9;
      case 118:
        return 11;
      case 13:
        if (e3.index < e3.end) {
          let o = e3.source.charCodeAt(e3.index + 1);
          o === 10 && (e3.index = e3.index + 1, e3.currentChar = o);
        }
      case 10:
      case 8232:
      case 8233:
        return e3.column = -1, e3.line++, -1;
      case 48:
      case 49:
      case 50:
      case 51: {
        let o = n - 48, i = e3.index + 1, l3 = e3.column + 1;
        if (i < e3.end) {
          let f = e3.source.charCodeAt(i);
          if ((S2[f] & 32) === 0) {
            if (o !== 0 || S2[f] & 512) {
              if (t & 1 || u) return -2;
              e3.flags |= 64;
            }
          } else {
            if (t & 1 || u) return -2;
            if (e3.currentChar = f, o = o << 3 | f - 48, i++, l3++, i < e3.end) {
              let c = e3.source.charCodeAt(i);
              S2[c] & 32 && (e3.currentChar = c, o = o << 3 | c - 48, i++, l3++);
            }
            e3.flags |= 64;
          }
          e3.index = i - 1, e3.column = l3 - 1;
        }
        return o;
      }
      case 52:
      case 53:
      case 54:
      case 55: {
        if (u || t & 1) return -2;
        let o = n - 48, i = e3.index + 1, l3 = e3.column + 1;
        if (i < e3.end) {
          let f = e3.source.charCodeAt(i);
          S2[f] & 32 && (o = o << 3 | f - 48, e3.currentChar = f, e3.index = i, e3.column = l3);
        }
        return e3.flags |= 64, o;
      }
      case 120: {
        let o = m(e3);
        if ((S2[o] & 64) === 0) return -4;
        let i = _(o), l3 = m(e3);
        if ((S2[l3] & 64) === 0) return -4;
        let f = _(l3);
        return i << 4 | f;
      }
      case 117: {
        let o = m(e3);
        if (e3.currentChar === 123) {
          let i = 0;
          for (; (S2[m(e3)] & 64) !== 0; ) if (i = i << 4 | _(e3.currentChar), i > 1114111) return -5;
          return e3.currentChar < 1 || e3.currentChar !== 125 ? -4 : i;
        } else {
          if ((S2[o] & 64) === 0) return -4;
          let i = e3.source.charCodeAt(e3.index + 1);
          if ((S2[i] & 64) === 0) return -4;
          let l3 = e3.source.charCodeAt(e3.index + 2);
          if ((S2[l3] & 64) === 0) return -4;
          let f = e3.source.charCodeAt(e3.index + 3);
          return (S2[f] & 64) === 0 ? -4 : (e3.index += 3, e3.column += 3, e3.currentChar = e3.source.charCodeAt(e3.index), _(o) << 12 | _(i) << 8 | _(l3) << 4 | _(f));
        }
      }
      case 56:
      case 57:
        if (u || t & 1) return -3;
        e3.flags |= 4096;
      default:
        return n;
    }
  }
  function Pt2(e3, t, n) {
    switch (t) {
      case -1:
        return;
      case -2:
        e3.report(n ? 2 : 1);
      case -3:
        e3.report(n ? 3 : 14);
      case -4:
        e3.report(7);
      case -5:
        e3.report(104);
    }
  }
  function Ot2(e3, t) {
    let { index: n } = e3, u = 67174409, o = "", i = m(e3);
    for (; i !== 96; ) {
      if (i === 36 && e3.source.charCodeAt(e3.index + 1) === 123) {
        m(e3), u = 67174408;
        break;
      } else if (i === 92) if (i = m(e3), i > 126) o += String.fromCodePoint(i);
      else {
        let { index: l3, line: f, column: c } = e3, a = qt2(e3, t | 1, i, 1);
        if (a >= 0) o += String.fromCodePoint(a);
        else if (a !== -1 && t & 64) {
          e3.index = l3, e3.line = f, e3.column = c, o = null, i = sn2(e3, i), i < 0 && (u = 67174408);
          break;
        } else Pt2(e3, a, 1);
      }
      else e3.index < e3.end && (i === 13 && e3.source.charCodeAt(e3.index) === 10 && (o += String.fromCodePoint(i), e3.currentChar = e3.source.charCodeAt(++e3.index)), ((i & 83) < 3 && i === 10 || (i ^ 8232) <= 1) && (e3.column = -1, e3.line++), o += String.fromCodePoint(i));
      e3.index >= e3.end && e3.report(17), i = m(e3);
    }
    return m(e3), e3.tokenValue = o, e3.tokenRaw = e3.source.slice(n + 1, e3.index - (u === 67174409 ? 1 : 2)), u;
  }
  function sn2(e3, t) {
    for (; t !== 96; ) {
      switch (t) {
        case 36: {
          let n = e3.index + 1;
          if (n < e3.end && e3.source.charCodeAt(n) === 123) return e3.index = n, e3.column++, -t;
          break;
        }
        case 10:
        case 8232:
        case 8233:
          e3.column = -1, e3.line++;
      }
      e3.index >= e3.end && e3.report(17), t = m(e3);
    }
    return t;
  }
  function dn2(e3, t) {
    return e3.index >= e3.end && e3.report(0), e3.index--, e3.column--, Ot2(e3, t);
  }
  var an2 = [128, 128, 128, 128, 128, 128, 128, 128, 128, 127, 135, 127, 127, 129, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 127, 16842798, 134283267, 130, 208897, 8391477, 8390213, 134283267, 67174411, 16, 8391476, 25233968, 18, 25233969, 67108877, 8457014, 134283266, 134283266, 134283266, 134283266, 134283266, 134283266, 134283266, 134283266, 134283266, 134283266, 21, 1074790417, 8456256, 1077936155, 8390721, 22, 132, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 69271571, 136, 20, 8389959, 208897, 131, 4096, 4096, 4096, 4096, 4096, 4096, 4096, 208897, 4096, 208897, 208897, 4096, 208897, 4096, 208897, 4096, 208897, 4096, 4096, 4096, 208897, 4096, 4096, 208897, 4096, 4096, 2162700, 8389702, 1074790415, 16842799, 128];
  function r(e3, t) {
    e3.flags = (e3.flags | 1) ^ 1, e3.startIndex = e3.index, e3.startColumn = e3.column, e3.startLine = e3.line, e3.setToken(Rt2(e3, t, 0));
  }
  function Rt2(e3, t, n) {
    let u = e3.index === 0, { source: o } = e3;
    for (; e3.index < e3.end; ) {
      e3.tokenIndex = e3.index, e3.tokenColumn = e3.column, e3.tokenLine = e3.line;
      let i = e3.currentChar;
      if (i <= 126) {
        let l3 = an2[i];
        switch (l3) {
          case 67174411:
          case 16:
          case 2162700:
          case 1074790415:
          case 69271571:
          case 20:
          case 21:
          case 1074790417:
          case 18:
          case 16842799:
          case 132:
          case 128:
            return m(e3), l3;
          case 208897:
            return At2(e3, t, 0);
          case 4096:
            return At2(e3, t, 1);
          case 134283266:
            return Tt2(e3, t, 144);
          case 134283267:
            return cn2(e3, t, i);
          case 131:
            return Ot2(e3, t);
          case 136:
            return nn2(e3, t);
          case 130:
            return un2(e3);
          case 127:
            m(e3);
            break;
          case 129:
            n |= 5, te2(e3);
            break;
          case 135:
            Ze2(e3, n), n = n & -5 | 1;
            break;
          case 8456256: {
            let f = m(e3);
            if (e3.index < e3.end) {
              if (f === 60) return e3.index < e3.end && m(e3) === 61 ? (m(e3), 4194332) : 8390978;
              if (f === 61) return m(e3), 8390718;
              if (f === 33) {
                let c = e3.index + 1;
                if (c + 1 < e3.end && o.charCodeAt(c) === 45 && o.charCodeAt(c + 1) == 45) {
                  e3.column += 3, e3.currentChar = o.charCodeAt(e3.index += 3), n = yt2(e3, o, n, t, 2, e3.tokenStart);
                  continue;
                }
                return 8456256;
              }
            }
            return 8456256;
          }
          case 1077936155: {
            m(e3);
            let f = e3.currentChar;
            return f === 61 ? m(e3) === 61 ? (m(e3), 8390458) : 8390460 : f === 62 ? (m(e3), 10) : 1077936155;
          }
          case 16842798:
            return m(e3) !== 61 ? 16842798 : m(e3) !== 61 ? 8390461 : (m(e3), 8390459);
          case 8391477:
            return m(e3) !== 61 ? 8391477 : (m(e3), 4194340);
          case 8391476: {
            if (m(e3), e3.index >= e3.end) return 8391476;
            let f = e3.currentChar;
            return f === 61 ? (m(e3), 4194338) : f !== 42 ? 8391476 : m(e3) !== 61 ? 8391735 : (m(e3), 4194335);
          }
          case 8389959:
            return m(e3) !== 61 ? 8389959 : (m(e3), 4194341);
          case 25233968: {
            m(e3);
            let f = e3.currentChar;
            return f === 43 ? (m(e3), 33619993) : f === 61 ? (m(e3), 4194336) : 25233968;
          }
          case 25233969: {
            m(e3);
            let f = e3.currentChar;
            if (f === 45) {
              if (m(e3), (n & 1 || u) && e3.currentChar === 62) {
                e3.options.webcompat || e3.report(112), m(e3), n = yt2(e3, o, n, t, 3, e3.tokenStart);
                continue;
              }
              return 33619994;
            }
            return f === 61 ? (m(e3), 4194337) : 25233969;
          }
          case 8457014: {
            if (m(e3), e3.index < e3.end) {
              let f = e3.currentChar;
              if (f === 47) {
                m(e3), n = Ge2(e3, o, n, 0, e3.tokenStart);
                continue;
              }
              if (f === 42) {
                m(e3), n = en2(e3, o, n);
                continue;
              }
              if (t & 32) return ln2(e3);
              if (f === 61) return m(e3), 4259875;
            }
            return 8457014;
          }
          case 67108877: {
            let f = m(e3);
            if (f >= 48 && f <= 57) return Tt2(e3, t, 80);
            if (f === 46) {
              let c = e3.index + 1;
              if (c < e3.end && o.charCodeAt(c) === 46) return e3.column += 2, e3.currentChar = o.charCodeAt(e3.index += 2), 14;
            }
            return 67108877;
          }
          case 8389702: {
            m(e3);
            let f = e3.currentChar;
            return f === 124 ? (m(e3), e3.currentChar === 61 ? (m(e3), 4718632) : 8913465) : f === 61 ? (m(e3), 4194342) : 8389702;
          }
          case 8390721: {
            m(e3);
            let f = e3.currentChar;
            if (f === 61) return m(e3), 8390719;
            if (f !== 62) return 8390721;
            if (m(e3), e3.index < e3.end) {
              let c = e3.currentChar;
              if (c === 62) return m(e3) === 61 ? (m(e3), 4194334) : 8390980;
              if (c === 61) return m(e3), 4194333;
            }
            return 8390979;
          }
          case 8390213: {
            m(e3);
            let f = e3.currentChar;
            return f === 38 ? (m(e3), e3.currentChar === 61 ? (m(e3), 4718633) : 8913720) : f === 61 ? (m(e3), 4194343) : 8390213;
          }
          case 22: {
            let f = m(e3);
            if (f === 63) return m(e3), e3.currentChar === 61 ? (m(e3), 4718634) : 276824445;
            if (f === 46) {
              let c = e3.index + 1;
              if (c < e3.end && (f = o.charCodeAt(c), !(f >= 48 && f <= 57))) return m(e3), 67108990;
            }
            return 22;
          }
        }
      } else {
        if ((i ^ 8232) <= 1) {
          n = n & -5 | 1, te2(e3);
          continue;
        }
        let l3 = Qe2(e3);
        if (l3 > 0 && (i = l3), St2(i)) return e3.tokenValue = "", xe2(e3, t, 0, 0);
        if (G2(i)) {
          m(e3);
          continue;
        }
        e3.report(20, String.fromCodePoint(i));
      }
    }
    return 1048576;
  }
  function U2(e3, t) {
    (e3.flags & 1) === 0 && (e3.getToken() & 1048576) !== 1048576 && e3.report(30, B[e3.getToken() & 255]), C(e3, t, 1074790417) || e3.options.onInsertedSemicolon?.(e3.startIndex);
  }
  function Vt2(e3, t, n, u) {
    return t - n < 13 && u === "use strict" && ((e3.getToken() & 1048576) === 1048576 || e3.flags & 1) ? 1 : 0;
  }
  function pe2(e3, t, n) {
    return e3.getToken() !== n ? 0 : (r(e3, t), 1);
  }
  function C(e3, t, n) {
    return e3.getToken() !== n ? false : (r(e3, t), true);
  }
  function y2(e3, t, n) {
    e3.getToken() !== n && e3.report(25, B[n & 255]), r(e3, t);
  }
  function z3(e3, t) {
    switch (t.type) {
      case "ArrayExpression": {
        t.type = "ArrayPattern";
        let { elements: n } = t;
        for (let u = 0, o = n.length; u < o; ++u) {
          let i = n[u];
          i && z3(e3, i);
        }
        return;
      }
      case "ObjectExpression": {
        t.type = "ObjectPattern";
        let { properties: n } = t;
        for (let u = 0, o = n.length; u < o; ++u) z3(e3, n[u]);
        return;
      }
      case "AssignmentExpression":
        t.type = "AssignmentPattern", t.operator !== "=" && e3.report(71), delete t.operator, z3(e3, t.left);
        return;
      case "Property":
        z3(e3, t.value);
        return;
      case "SpreadElement":
        t.type = "RestElement", z3(e3, t.argument);
    }
  }
  function Ie2(e3, t, n, u, o) {
    t & 1 && ((u & 36864) === 36864 && e3.report(118), !o && (u & 537079808) === 537079808 && e3.report(119)), ((u & 20480) === 20480 || u === -2147483528) && e3.report(102), n & 24 && (u & 255) === 73 && e3.report(100), t & 2050 && u === 209006 && e3.report(110), t & 1025 && u === 241771 && e3.report(97, "yield");
  }
  function Mt2(e3, t, n) {
    t & 1 && ((n & 36864) === 36864 && e3.report(118), (n & 537079808) === 537079808 && e3.report(119), n === -2147483527 && e3.report(95), n === -2147483528 && e3.report(95)), (n & 20480) === 20480 && e3.report(102), t & 2050 && n === 209006 && e3.report(110), t & 1025 && n === 241771 && e3.report(97, "yield");
  }
  function vt2(e3, t, n) {
    return n === 209006 && (t & 2050 && e3.report(110), e3.destructible |= 128), n === 241771 && t & 1024 && e3.report(97, "yield"), (n & 20480) === 20480 || (n & 36864) === 36864 || n == -2147483527;
  }
  function gn2(e3) {
    return e3.property ? e3.property.type === "PrivateIdentifier" : false;
  }
  function Ut2(e3, t, n, u) {
    for (; t; ) {
      if (t["$" + n]) return u && e3.report(137), 1;
      u && t.loop && (u = 0), t = t.$;
    }
    return 0;
  }
  function mn2(e3, t, n) {
    let u = t;
    for (; u; ) u["$" + n] && e3.report(136, n), u = u.$;
    t["$" + n] = 1;
  }
  function Le2(e3) {
    switch (e3.type) {
      case "JSXIdentifier":
        return e3.name;
      case "JSXNamespacedName":
        return e3.namespace + ":" + e3.name;
      case "JSXMemberExpression":
        return Le2(e3.object) + "." + Le2(e3.property);
    }
  }
  function he2(e3, t) {
    return e3 & 1025 ? e3 & 2 && t === 209006 || e3 & 1024 && t === 241771 ? false : (t & 12288) === 12288 : (t & 12288) === 12288 || (t & 36864) === 36864;
  }
  function Oe2(e3, t, n) {
    (n & 537079808) === 537079808 && (t & 1 && e3.report(119), e3.flags |= 512), he2(t, n) || e3.report(0);
  }
  function rn2(e3, t) {
    return e3.startIndex = e3.tokenIndex = e3.index, e3.startColumn = e3.tokenColumn = e3.column, e3.startLine = e3.tokenLine = e3.line, e3.setToken(S2[e3.currentChar] & 8192 ? hn2(e3) : Rt2(e3, t, 0)), e3.getToken();
  }
  function hn2(e3) {
    let t = e3.currentChar, n = m(e3), u = e3.index;
    for (; n !== t; ) e3.index >= e3.end && e3.report(16), n = m(e3);
    return n !== t && e3.report(16), e3.tokenValue = e3.source.slice(u, e3.index), m(e3), e3.options.raw && (e3.tokenRaw = e3.source.slice(e3.tokenIndex, e3.index)), 134283267;
  }
  function ke2(e3) {
    if (e3.startIndex = e3.tokenIndex = e3.index, e3.startColumn = e3.tokenColumn = e3.column, e3.startLine = e3.tokenLine = e3.line, e3.index >= e3.end) {
      e3.setToken(1048576);
      return;
    }
    if (e3.currentChar === 60) {
      m(e3), e3.setToken(8456256);
      return;
    }
    if (e3.currentChar === 123) {
      m(e3), e3.setToken(2162700);
      return;
    }
    let t = 0;
    for (; e3.index < e3.end; ) {
      let u = S2[e3.source.charCodeAt(e3.index)];
      if (u & 1024 ? (t |= 5, te2(e3)) : u & 2048 ? (Ze2(e3, t), t = t & -5 | 1) : m(e3), S2[e3.currentChar] & 16384) break;
    }
    e3.tokenIndex === e3.index && e3.report(0);
    let n = e3.source.slice(e3.tokenIndex, e3.index);
    e3.options.raw && (e3.tokenRaw = n), e3.tokenValue = n, e3.setToken(137);
  }
  function Xe2(e3) {
    if ((e3.getToken() & 143360) === 143360) {
      let { index: t } = e3, n = e3.currentChar;
      for (; S2[n] & 32770; ) n = m(e3);
      e3.tokenValue += e3.source.slice(t, e3.index), e3.setToken(208897, true);
    }
    return e3.getToken();
  }
  function kn2(e3) {
    if (e3) return e3 === true ? { start: true, end: true, range: true } : { start: e3.start ?? false, end: e3.end ?? false, range: e3.range ?? false };
  }
  function yn2(e3) {
    let t = { validateRegex: true, ...e3, ranges: kn2(e3.ranges) };
    return t.module && !t.sourceType && (t.sourceType = "module"), t.globalReturn && (!t.sourceType || t.sourceType === "script") && (t.sourceType = "commonjs"), t;
  }
  var He2 = class {
    constructor(t, n) {
      __publicField(this, "parser");
      __publicField(this, "parent");
      __publicField(this, "refs", /* @__PURE__ */ Object.create(null));
      __publicField(this, "privateIdentifiers", /* @__PURE__ */ new Map());
      this.parser = t, this.parent = n;
    }
    addPrivateIdentifier(t, n) {
      let { privateIdentifiers: u } = this, o = n & 800;
      o & 768 || (o |= 768);
      let i = u.get(t);
      this.hasPrivateIdentifier(t) && ((i & 32) !== (o & 32) || i & o & 768) && this.parser.report(146, t), u.set(t, this.hasPrivateIdentifier(t) ? i | o : o);
    }
    addPrivateIdentifierRef(t) {
      var n;
      (n = this.refs)[t] ?? (n[t] = []), this.refs[t].push(this.parser.tokenStart);
    }
    isPrivateIdentifierDefined(t) {
      return this.hasPrivateIdentifier(t) || !!this.parent?.isPrivateIdentifierDefined(t);
    }
    validatePrivateIdentifierRefs() {
      for (let t in this.refs) if (!this.isPrivateIdentifierDefined(t)) {
        let { index: n, line: u, column: o } = this.refs[t][0];
        throw new q2({ index: n, line: u, column: o }, { index: n + t.length, line: u, column: o + t.length }, 4, t);
      }
    }
    hasPrivateIdentifier(t) {
      return this.privateIdentifiers.has(t);
    }
  };
  var We2 = class e {
    constructor(t, n = 2, u) {
      __publicField(this, "parser");
      __publicField(this, "type");
      __publicField(this, "parent");
      __publicField(this, "scopeError");
      __publicField(this, "variableBindings", /* @__PURE__ */ new Map());
      this.parser = t, this.type = n, this.parent = u;
    }
    createChildScope(t) {
      return new e(this.parser, t, this);
    }
    addVarOrBlock(t, n, u, o) {
      u & 4 ? this.addVarName(t, n, u) : this.addBlockName(t, n, u, o), o & 64 && this.parser.declareUnboundVariable(n);
    }
    addVarName(t, n, u) {
      let { parser: o } = this, i = this;
      for (; i && (i.type & 128) === 0; ) {
        let { variableBindings: l3 } = i, f = l3.get(n);
        f && f & 248 && (o.options.webcompat && (t & 1) === 0 && (u & 128 && f & 68 || f & 128 && u & 68) || o.report(145, n)), i === this && f && f & 1 && u & 1 && i.recordScopeError(145, n), f && (f & 256 || f & 512 && !o.options.webcompat) && o.report(145, n), i.variableBindings.set(n, u), i = i.parent;
      }
    }
    hasVariable(t) {
      return this.variableBindings.has(t);
    }
    addBlockName(t, n, u, o) {
      let { parser: i } = this, l3 = this.variableBindings.get(n);
      l3 && (l3 & 2) === 0 && (u & 1 ? this.recordScopeError(145, n) : i.options.webcompat && (t & 1) === 0 && o & 2 && l3 === 64 && u === 64 || i.report(145, n)), this.type & 64 && this.parent?.hasVariable(n) && (this.parent.variableBindings.get(n) & 2) === 0 && i.report(145, n), this.type & 512 && l3 && (l3 & 2) === 0 && u & 1 && this.recordScopeError(145, n), this.type & 32 && this.parent.variableBindings.get(n) & 768 && i.report(159, n), this.variableBindings.set(n, u);
    }
    recordScopeError(t, ...n) {
      this.scopeError = { type: t, params: n, start: this.parser.tokenStart, end: this.parser.currentLocation };
    }
    reportScopeError() {
      let { scopeError: t } = this;
      if (t) throw new q2(t.start, t.end, t.type, ...t.params);
    }
  };
  function Re2(e3, t, n) {
    let u = e3.createScope().createChildScope(512);
    return u.addBlockName(t, n, 1, 0), u;
  }
  var ze2 = class {
    constructor(t, n = {}) {
      __publicField(this, "source");
      __publicField(this, "lastOnToken", null);
      __publicField(this, "options");
      __publicField(this, "token", 1048576);
      __publicField(this, "flags", 0);
      __publicField(this, "index", 0);
      __publicField(this, "line", 1);
      __publicField(this, "column", 0);
      __publicField(this, "startIndex", 0);
      __publicField(this, "end", 0);
      __publicField(this, "tokenIndex", 0);
      __publicField(this, "startColumn", 0);
      __publicField(this, "tokenColumn", 0);
      __publicField(this, "tokenLine", 1);
      __publicField(this, "startLine", 1);
      __publicField(this, "tokenValue", "");
      __publicField(this, "tokenRaw", "");
      __publicField(this, "tokenRegExp");
      __publicField(this, "currentChar", 0);
      __publicField(this, "exportedNames", /* @__PURE__ */ new Set());
      __publicField(this, "exportedBindings", /* @__PURE__ */ new Set());
      __publicField(this, "assignable", 0);
      __publicField(this, "destructible", 0);
      __publicField(this, "strictReservedRange", null);
      __publicField(this, "leadingDecorators", { decorators: [] });
      this.source = t, this.end = t.length, this.currentChar = t.charCodeAt(0), this.options = yn2(n), Array.isArray(this.options.onComment) && (this.options.onComment = An2(this.options.onComment, this.options)), Array.isArray(this.options.onToken) && (this.options.onToken = Tn2(this.options.onToken, this.options));
    }
    getToken() {
      return this.token;
    }
    setToken(t, n = false) {
      this.token = t;
      let { onToken: u } = this.options;
      if (u) if (t !== 1048576) {
        let o = { start: { line: this.tokenLine, column: this.tokenColumn }, end: { line: this.line, column: this.column } };
        !n && this.lastOnToken && u(...this.lastOnToken), this.lastOnToken = [x2(t), this.tokenIndex, this.index, o];
      } else this.lastOnToken && (u(...this.lastOnToken), this.lastOnToken = null);
      return t;
    }
    get tokenStart() {
      return { index: this.tokenIndex, line: this.tokenLine, column: this.tokenColumn };
    }
    get currentLocation() {
      return { index: this.index, line: this.line, column: this.column };
    }
    finishNode(t, n, u) {
      let { ranges: o } = this.options;
      if (o) {
        let i = u ? u.index : this.startIndex;
        o.start && (t.start = n.index), o.end && (t.end = i), o.range && (t.range = [n.index, i]);
      }
      return this.options.loc && (t.loc = { start: { line: n.line, column: n.column }, end: u ? { line: u.line, column: u.column } : { line: this.startLine, column: this.startColumn } }, this.options.source && (t.loc.source = this.options.source)), t;
    }
    addBindingToExports(t) {
      this.exportedBindings.add(t);
    }
    declareUnboundVariable(t) {
      let { exportedNames: n } = this;
      n.has(t) && this.report(147, t), n.add(t);
    }
    report(t, ...n) {
      throw new q2(this.tokenStart, this.currentLocation, t, ...n);
    }
    createScopeIfLexical(t, n) {
      if (this.options.lexical) return this.createScope(t, n);
    }
    createScope(t, n) {
      return new We2(this, t, n);
    }
    createPrivateScopeIfLexical(t) {
      if (this.options.lexical) return new He2(this, t);
    }
    cloneIdentifier(t) {
      return this.cloneLocationInformation({ ...t }, t);
    }
    cloneStringLiteral(t) {
      return this.cloneLocationInformation({ ...t }, t);
    }
    cloneLocationInformation(t, n) {
      let { ranges: u } = this.options;
      return u && (u.start && (t.start = n.start), u.end && (t.end = n.end), u.range && (t.range = [...n.range])), this.options.loc && (t.loc = { ...n.loc, start: { ...n.loc.start }, end: { ...n.loc.end } }), t;
    }
  };
  function An2(e3, t) {
    return function(n, u, o, i, l3) {
      let f = { type: n, value: u }, { ranges: c } = t;
      c && (c.start && (f.start = o), c.end && (f.end = i), c.range && (f.range = [o, i])), t.loc && (f.loc = l3), e3.push(f);
    };
  }
  function Tn2(e3, t) {
    return function(n, u, o, i) {
      let l3 = { token: n }, { ranges: f } = t;
      f && (f.start && (l3.start = u), f.end && (l3.end = o), f.range && (l3.range = [u, o])), t.loc && (l3.loc = i), e3.push(l3);
    };
  }
  function bn2(e3, t = {}, n = 0) {
    let u = new ze2(e3, t);
    u.options.sourceType === "module" && (n |= 3), u.options.sourceType === "commonjs" && (n |= 69632), u.options.impliedStrict && (n |= 1), p2(u);
    let o = u.createScopeIfLexical(), i = [], l3 = "script";
    if (n & 2) {
      if (l3 = "module", i = Cn2(u, n | 8, o), o) for (let f of u.exportedBindings) o.hasVariable(f) || u.report(148, f);
    } else i = Dn2(u, n | 8, o);
    return u.finishNode({ type: "Program", sourceType: l3, body: i }, { index: 0, line: 1, column: 0 }, u.currentLocation);
  }
  function Dn2(e3, t, n) {
    r(e3, t | 32 | 262144);
    let u = [];
    for (; e3.getToken() === 134283267; ) {
      let { index: o, tokenValue: i, tokenStart: l3, tokenIndex: f } = e3, c = e3.getToken(), a = O2(e3, t);
      if (Vt2(e3, o, f, i)) {
        if (t |= 1, e3.flags & 64) throw new q2(e3.tokenStart, e3.currentLocation, 9);
        if (e3.flags & 4096) throw new q2(e3.tokenStart, e3.currentLocation, 15);
      }
      u.push(tt2(e3, t, a, c, l3));
    }
    for (; e3.getToken() !== 1048576; ) u.push(ye2(e3, t, n, void 0, 4, {}));
    return u;
  }
  function Cn2(e3, t, n) {
    r(e3, t | 32);
    let u = [];
    for (; e3.getToken() === 134283267; ) {
      let { tokenStart: o } = e3, i = e3.getToken();
      u.push(tt2(e3, t, O2(e3, t), i, o));
    }
    for (; e3.getToken() !== 1048576; ) u.push(En2(e3, t, n));
    return u;
  }
  function En2(e3, t, n) {
    e3.getToken() === 132 && Object.assign(e3.leadingDecorators, { start: e3.tokenStart, decorators: ve2(e3, t, void 0) });
    let u;
    switch (e3.getToken()) {
      case 20564:
        u = Hn2(e3, t, n);
        break;
      case 86106:
        u = jn2(e3, t, n);
        break;
      default:
        u = ye2(e3, t, n, void 0, 4, {});
    }
    return e3.leadingDecorators?.decorators.length && e3.report(170), u;
  }
  function ye2(e3, t, n, u, o, i) {
    let l3 = e3.tokenStart;
    switch (e3.getToken()) {
      case 86104:
        return p(e3, t, n, u, o, 1, 0, 0, l3);
      case 132:
      case 86094:
        return Ye2(e3, t, n, u, 0);
      case 86090:
        return Ke2(e3, t, n, u, 16, 0);
      case 241737:
        return _n3(e3, t, n, u, o);
      case 20564:
        e3.report(103, "export");
      case 86106:
        switch (r(e3, t), e3.getToken()) {
          case 67174411:
            return Ht2(e3, t, u, l3);
          case 67108877:
            return Xt2(e3, t, l3);
          default:
            e3.report(103, "import");
        }
      case 209005:
        return _t2(e3, t, n, u, o, i, 1);
      default:
        return Ae2(e3, t, n, u, o, i, 1);
    }
  }
  function Ae2(e3, t, n, u, o, i, l3) {
    switch (e3.getToken()) {
      case 86088:
        return Jt2(e3, t, n, u, 0);
      case 20572:
        return Sn2(e3, t, u);
      case 20569:
        return Nn2(e3, t, n, u, i);
      case 20567:
        return Jn2(e3, t, n, u, i);
      case 20562:
        return Un2(e3, t, n, u, i);
      case 20578:
        return Ln2(e3, t, n, u, i);
      case 86110:
        return In2(e3, t, n, u, i);
      case 1074790417:
        return Bn2(e3, t);
      case 2162700:
        return re2(e3, t, n?.createChildScope(), u, i, e3.tokenStart);
      case 86112:
        return Fn2(e3, t, u);
      case 20555:
        return Pn2(e3, t, i);
      case 20559:
        return qn2(e3, t, i);
      case 20577:
        return Vn2(e3, t, n, u, i);
      case 20579:
        return On2(e3, t, n, u, i);
      case 20560:
        return Rn2(e3, t);
      case 209005:
        return _t2(e3, t, n, u, o, i, 0);
      case 20557:
        e3.report(162);
      case 20566:
        e3.report(163);
      case 86104:
        e3.report(t & 1 ? 76 : e3.options.webcompat ? 77 : 78);
      case 86094:
        e3.report(79);
      default:
        return wn2(e3, t, n, u, o, i, l3);
    }
  }
  function wn2(e3, t, n, u, o, i, l3) {
    let { tokenValue: f, tokenStart: c } = e3, a = e3.getToken(), s;
    return a === 241737 ? (s = N2(e3, t), t & 1 && e3.report(85), e3.getToken() === 69271571 && e3.report(84)) : s = J(e3, t, u, 2, 0, 1, 0, 1, e3.tokenStart), a & 143360 && e3.getToken() === 21 ? et2(e3, t, n, u, o, i, f, s, a, l3, c) : (s = F(e3, t, u, s, 0, 0, c), s = L2(e3, t, u, 0, 0, c, s), e3.getToken() === 18 && (s = Y3(e3, t, u, 0, c, s)), oe2(e3, t, s, c));
  }
  function re2(e3, t, n, u, o, i = e3.tokenStart, l3 = "BlockStatement") {
    let f = [];
    for (y2(e3, t | 32, 2162700); e3.getToken() !== 1074790415; ) f.push(ye2(e3, t, n, u, 2, { $: o }));
    return y2(e3, t | 32, 1074790415), e3.finishNode({ type: l3, body: f }, i);
  }
  function Sn2(e3, t, n) {
    (t & 4096) === 0 && e3.report(92);
    let u = e3.tokenStart;
    r(e3, t | 32);
    let o = e3.flags & 1 || e3.getToken() & 1048576 ? null : M2(e3, t, n, 0, 1, e3.tokenStart);
    return U2(e3, t | 32), e3.finishNode({ type: "ReturnStatement", argument: o }, u);
  }
  function oe2(e3, t, n, u) {
    return U2(e3, t | 32), e3.finishNode({ type: "ExpressionStatement", expression: n }, u);
  }
  function et2(e3, t, n, u, o, i, l3, f, c, a, s) {
    Ie2(e3, t, 0, c, 1), mn2(e3, i, l3), r(e3, t | 32);
    let d3 = a && (t & 1) === 0 && e3.options.webcompat && e3.getToken() === 86104 ? p(e3, t, n?.createChildScope(), u, o, 0, 0, 0, e3.tokenStart) : Ae2(e3, t, n, u, o, i, a);
    return e3.finishNode({ type: "LabeledStatement", label: f, body: d3 }, s);
  }
  function _t2(e3, t, n, u, o, i, l3) {
    let { tokenValue: f, tokenStart: c } = e3, a = e3.getToken(), s = N2(e3, t);
    if (e3.getToken() === 21) return et2(e3, t, n, u, o, i, f, s, a, 1, c);
    let d3 = e3.flags & 1;
    if (!d3) {
      if (e3.getToken() === 86104) return l3 || e3.report(123), p(e3, t, n, u, o, 1, 0, 1, c);
      if (he2(t, e3.getToken())) return s = Zt2(e3, t, u, 1, c), e3.getToken() === 18 && (s = Y3(e3, t, u, 0, c, s)), oe2(e3, t, s, c);
    }
    return e3.getToken() === 67174411 ? s = ft2(e3, t, u, s, 1, 1, 0, d3, c) : (e3.getToken() === 10 && (Oe2(e3, t, a), (a & 36864) === 36864 && (e3.flags |= 256), s = Me2(e3, t | 2048, u, e3.tokenValue, s, 0, 1, 0, c)), e3.assignable = 1), s = F(e3, t, u, s, 0, 0, c), s = L2(e3, t, u, 0, 0, c, s), e3.assignable = 1, e3.getToken() === 18 && (s = Y3(e3, t, u, 0, c, s)), oe2(e3, t, s, c);
  }
  function tt2(e3, t, n, u, o) {
    let i = e3.startIndex;
    u !== 1074790417 && (e3.assignable = 2, n = F(e3, t, void 0, n, 0, 0, o), e3.getToken() !== 1074790417 && (n = L2(e3, t, void 0, 0, 0, o, n), e3.getToken() === 18 && (n = Y3(e3, t, void 0, 0, o, n))), U2(e3, t | 32));
    let l3 = { type: "ExpressionStatement", expression: n };
    return n.type === "Literal" && typeof n.value == "string" && (l3.directive = e3.source.slice(o.index + 1, i - 1)), e3.finishNode(l3, o);
  }
  function Bn2(e3, t) {
    let n = e3.tokenStart;
    return r(e3, t | 32), e3.finishNode({ type: "EmptyStatement" }, n);
  }
  function Fn2(e3, t, n) {
    let u = e3.tokenStart;
    r(e3, t | 32), e3.flags & 1 && e3.report(90);
    let o = M2(e3, t, n, 0, 1, e3.tokenStart);
    return U2(e3, t | 32), e3.finishNode({ type: "ThrowStatement", argument: o }, u);
  }
  function Nn2(e3, t, n, u, o) {
    let i = e3.tokenStart;
    r(e3, t), y2(e3, t | 32, 67174411), e3.assignable = 1;
    let l3 = M2(e3, t, u, 0, 1, e3.tokenStart);
    y2(e3, t | 32, 16);
    let f = bt2(e3, t, n, u, o), c = null;
    return e3.getToken() === 20563 && (r(e3, t | 32), c = bt2(e3, t, n, u, o)), e3.finishNode({ type: "IfStatement", test: l3, consequent: f, alternate: c }, i);
  }
  function bt2(e3, t, n, u, o) {
    let { tokenStart: i } = e3;
    return t & 1 || !e3.options.webcompat || e3.getToken() !== 86104 ? Ae2(e3, t, n, u, 0, { $: o }, 0) : p(e3, t, n?.createChildScope(), u, 0, 0, 0, 0, i);
  }
  function In2(e3, t, n, u, o) {
    let i = e3.tokenStart;
    r(e3, t), y2(e3, t | 32, 67174411);
    let l3 = M2(e3, t, u, 0, 1, e3.tokenStart);
    y2(e3, t, 16), y2(e3, t, 2162700);
    let f = [], c = 0;
    for (n = n?.createChildScope(8); e3.getToken() !== 1074790415; ) {
      let { tokenStart: a } = e3, s = null, d3 = [];
      for (C(e3, t | 32, 20556) ? s = M2(e3, t, u, 0, 1, e3.tokenStart) : (y2(e3, t | 32, 20561), c && e3.report(89), c = 1), y2(e3, t | 32, 21); e3.getToken() !== 20556 && e3.getToken() !== 1074790415 && e3.getToken() !== 20561; ) d3.push(ye2(e3, t | 4, n, u, 2, { $: o }));
      f.push(e3.finishNode({ type: "SwitchCase", test: s, consequent: d3 }, a));
    }
    return y2(e3, t | 32, 1074790415), e3.finishNode({ type: "SwitchStatement", discriminant: l3, cases: f }, i);
  }
  function Ln2(e3, t, n, u, o) {
    let i = e3.tokenStart;
    r(e3, t), y2(e3, t | 32, 67174411);
    let l3 = M2(e3, t, u, 0, 1, e3.tokenStart);
    y2(e3, t | 32, 16);
    let f = me2(e3, t, n, u, o);
    return e3.finishNode({ type: "WhileStatement", test: l3, body: f }, i);
  }
  function me2(e3, t, n, u, o) {
    return Ae2(e3, (t | 131072) ^ 131072 | 128, n, u, 0, { loop: 1, $: o }, 0);
  }
  function qn2(e3, t, n) {
    (t & 128) === 0 && e3.report(68);
    let u = e3.tokenStart;
    r(e3, t);
    let o = null;
    if ((e3.flags & 1) === 0 && e3.getToken() & 143360) {
      let { tokenValue: i } = e3;
      o = N2(e3, t | 32), Ut2(e3, n, i, 1) || e3.report(138, i);
    }
    return U2(e3, t | 32), e3.finishNode({ type: "ContinueStatement", label: o }, u);
  }
  function Pn2(e3, t, n) {
    let u = e3.tokenStart;
    r(e3, t | 32);
    let o = null;
    if ((e3.flags & 1) === 0 && e3.getToken() & 143360) {
      let { tokenValue: i } = e3;
      o = N2(e3, t | 32), Ut2(e3, n, i, 0) || e3.report(138, i);
    } else (t & 132) === 0 && e3.report(69);
    return U2(e3, t | 32), e3.finishNode({ type: "BreakStatement", label: o }, u);
  }
  function On2(e3, t, n, u, o) {
    let i = e3.tokenStart;
    r(e3, t), t & 1 && e3.report(91), y2(e3, t | 32, 67174411);
    let l3 = M2(e3, t, u, 0, 1, e3.tokenStart);
    y2(e3, t | 32, 16);
    let f = Ae2(e3, t, n, u, 2, o, 0);
    return e3.finishNode({ type: "WithStatement", object: l3, body: f }, i);
  }
  function Rn2(e3, t) {
    let n = e3.tokenStart;
    return r(e3, t | 32), U2(e3, t | 32), e3.finishNode({ type: "DebuggerStatement" }, n);
  }
  function Vn2(e3, t, n, u, o) {
    let i = e3.tokenStart;
    r(e3, t | 32);
    let l3 = n?.createChildScope(16), f = re2(e3, t, l3, u, { $: o }), { tokenStart: c } = e3, a = C(e3, t | 32, 20557) ? Mn2(e3, t, n, u, o, c) : null, s = null;
    if (e3.getToken() === 20566) {
      r(e3, t | 32);
      let d3 = n?.createChildScope(4);
      s = re2(e3, t, d3, u, { $: o });
    }
    return !a && !s && e3.report(88), e3.finishNode({ type: "TryStatement", block: f, handler: a, finalizer: s }, i);
  }
  function Mn2(e3, t, n, u, o, i) {
    let l3 = null, f = n;
    C(e3, t, 67174411) && (n = n?.createChildScope(4), l3 = pt2(e3, t, n, u, (e3.getToken() & 2097152) === 2097152 ? 256 : 512, 0), e3.getToken() === 18 ? e3.report(86) : e3.getToken() === 1077936155 && e3.report(87), y2(e3, t | 32, 16)), f = n?.createChildScope(32);
    let c = re2(e3, t, f, u, { $: o });
    return e3.finishNode({ type: "CatchClause", param: l3, body: c }, i);
  }
  function vn2(e3, t, n, u, o) {
    n = n?.createChildScope();
    let i = 5764;
    return t = (t | i) ^ i | 256 | 2048 | 524288 | 65536, re2(e3, t, n, u, {}, o, "StaticBlock");
  }
  function Un2(e3, t, n, u, o) {
    let i = e3.tokenStart;
    r(e3, t | 32);
    let l3 = me2(e3, t, n, u, o);
    y2(e3, t, 20578), y2(e3, t | 32, 67174411);
    let f = M2(e3, t, u, 0, 1, e3.tokenStart);
    return y2(e3, t | 32, 16), C(e3, t | 32, 1074790417), e3.finishNode({ type: "DoWhileStatement", body: l3, test: f }, i);
  }
  function _n3(e3, t, n, u, o) {
    let { tokenValue: i, tokenStart: l3 } = e3, f = e3.getToken(), c = N2(e3, t);
    if (e3.getToken() & 2240512) {
      let a = ie2(e3, t, n, u, 8, 0);
      return U2(e3, t | 32), e3.finishNode({ type: "VariableDeclaration", kind: "let", declarations: a }, l3);
    }
    if (e3.assignable = 1, t & 1 && e3.report(85), e3.getToken() === 21) return et2(e3, t, n, u, o, {}, i, c, f, 0, l3);
    if (e3.getToken() === 10) {
      let a;
      e3.options.lexical && (a = Re2(e3, t, i)), e3.flags = (e3.flags | 128) ^ 128, c = Te2(e3, t, a, u, [c], 0, l3);
    } else c = F(e3, t, u, c, 0, 0, l3), c = L2(e3, t, u, 0, 0, l3, c);
    return e3.getToken() === 18 && (c = Y3(e3, t, u, 0, l3, c)), oe2(e3, t, c, l3);
  }
  function Ke2(e3, t, n, u, o, i) {
    let l3 = e3.tokenStart;
    r(e3, t);
    let f = ie2(e3, t, n, u, o, i);
    return U2(e3, t | 32), e3.finishNode({ type: "VariableDeclaration", kind: o & 8 ? "let" : "const", declarations: f }, l3);
  }
  function Jt2(e3, t, n, u, o) {
    let i = e3.tokenStart;
    r(e3, t);
    let l3 = ie2(e3, t, n, u, 4, o);
    return U2(e3, t | 32), e3.finishNode({ type: "VariableDeclaration", kind: "var", declarations: l3 }, i);
  }
  function ie2(e3, t, n, u, o, i) {
    let l3 = 1, f = [Dt2(e3, t, n, u, o, i)];
    for (; C(e3, t, 18); ) l3++, f.push(Dt2(e3, t, n, u, o, i));
    return l3 > 1 && i & 32 && e3.getToken() & 262144 && e3.report(61, B[e3.getToken() & 255]), f;
  }
  function Dt2(e3, t, n, u, o, i) {
    let { tokenStart: l3 } = e3, f = e3.getToken(), c = null, a = pt2(e3, t, n, u, o, i);
    if (e3.getToken() === 1077936155) {
      if (r(e3, t | 32), c = I2(e3, t, u, 1, 0, e3.tokenStart), i & 32 && (e3.getToken() === 471156 || e3.getToken() === 8673330 && (f & 2097152 || (o & 4) === 0 || t & 1))) throw new q2(l3, e3.currentLocation, 60, e3.getToken() === 471156 ? "of" : "in");
    } else (o & 16 || (f & 2097152) > 0) && (e3.getToken() & 262144) !== 262144 && e3.report(59, o & 16 ? "const" : "destructuring");
    return e3.finishNode({ type: "VariableDeclarator", id: a, init: c }, l3);
  }
  function Jn2(e3, t, n, u, o) {
    let i = e3.tokenStart;
    r(e3, t);
    let l3 = ((t & 2048) > 0 || (t & 2) > 0 && (t & 8) > 0) && C(e3, t, 209006);
    y2(e3, t | 32, 67174411), n = n?.createChildScope(1);
    let f = null, c = null, a = 0, s = null, d3 = e3.getToken() === 86088 || e3.getToken() === 241737 || e3.getToken() === 86090, h, { tokenStart: A } = e3, b4 = e3.getToken();
    if (d3) b4 === 241737 ? (s = N2(e3, t), e3.getToken() & 2240512 ? (e3.getToken() === 8673330 ? t & 1 && e3.report(67) : s = e3.finishNode({ type: "VariableDeclaration", kind: "let", declarations: ie2(e3, t | 131072, n, u, 8, 32) }, A), e3.assignable = 1) : t & 1 ? e3.report(67) : (d3 = false, e3.assignable = 1, s = F(e3, t, u, s, 0, 0, A), e3.getToken() === 471156 && e3.report(115))) : (r(e3, t), s = e3.finishNode(b4 === 86088 ? { type: "VariableDeclaration", kind: "var", declarations: ie2(e3, t | 131072, n, u, 4, 32) } : { type: "VariableDeclaration", kind: "const", declarations: ie2(e3, t | 131072, n, u, 16, 32) }, A), e3.assignable = 1);
    else if (b4 === 1074790417) l3 && e3.report(82);
    else if ((b4 & 2097152) === 2097152) {
      let T4 = e3.tokenStart;
      s = b4 === 2162700 ? H3(e3, t, void 0, u, 1, 0, 0, 2, 32) : X3(e3, t, void 0, u, 1, 0, 0, 2, 32), a = e3.destructible, a & 64 && e3.report(63), e3.assignable = a & 16 ? 2 : 1, s = F(e3, t | 131072, u, s, 0, 0, T4);
    } else s = j3(e3, t | 131072, u, 1, 0, 1);
    if ((e3.getToken() & 262144) === 262144) {
      if (e3.getToken() === 471156) {
        e3.assignable & 2 && e3.report(80, l3 ? "await" : "of"), z3(e3, s), r(e3, t | 32), h = I2(e3, t, u, 1, 0, e3.tokenStart), y2(e3, t | 32, 16);
        let D = me2(e3, t, n, u, o);
        return e3.finishNode({ type: "ForOfStatement", left: s, right: h, body: D, await: l3 }, i);
      }
      e3.assignable & 2 && e3.report(80, "in"), z3(e3, s), r(e3, t | 32), l3 && e3.report(82), h = M2(e3, t, u, 0, 1, e3.tokenStart), y2(e3, t | 32, 16);
      let T4 = me2(e3, t, n, u, o);
      return e3.finishNode({ type: "ForInStatement", body: T4, left: s, right: h }, i);
    }
    l3 && e3.report(82), d3 || (a & 8 && e3.getToken() !== 1077936155 && e3.report(80, "loop"), s = L2(e3, t | 131072, u, 0, 0, A, s)), e3.getToken() === 18 && (s = Y3(e3, t, u, 0, A, s)), y2(e3, t | 32, 1074790417), e3.getToken() !== 1074790417 && (f = M2(e3, t, u, 0, 1, e3.tokenStart)), y2(e3, t | 32, 1074790417), e3.getToken() !== 16 && (c = M2(e3, t, u, 0, 1, e3.tokenStart)), y2(e3, t | 32, 16);
    let w4 = me2(e3, t, n, u, o);
    return e3.finishNode({ type: "ForStatement", init: s, test: f, update: c, body: w4 }, i);
  }
  function jt2(e3, t, n) {
    return he2(t, e3.getToken()) || e3.report(118), (e3.getToken() & 537079808) === 537079808 && e3.report(119), n?.addBlockName(t, e3.tokenValue, 8, 0), N2(e3, t);
  }
  function jn2(e3, t, n) {
    let u = e3.tokenStart;
    r(e3, t);
    let o = null, { tokenStart: i } = e3, l3 = [];
    if (e3.getToken() === 134283267) o = O2(e3, t);
    else {
      if (e3.getToken() & 143360) {
        let a = jt2(e3, t, n);
        if (l3 = [e3.finishNode({ type: "ImportDefaultSpecifier", local: a }, i)], C(e3, t, 18)) switch (e3.getToken()) {
          case 8391476:
            l3.push(Ct2(e3, t, n));
            break;
          case 2162700:
            Et2(e3, t, n, l3);
            break;
          default:
            e3.report(107);
        }
      } else switch (e3.getToken()) {
        case 8391476:
          l3 = [Ct2(e3, t, n)];
          break;
        case 2162700:
          Et2(e3, t, n, l3);
          break;
        case 67174411:
          return Ht2(e3, t, void 0, u);
        case 67108877:
          return Xt2(e3, t, u);
        default:
          e3.report(30, B[e3.getToken() & 255]);
      }
      o = Xn2(e3, t);
    }
    let f = $e(e3, t), c = { type: "ImportDeclaration", specifiers: l3, source: o, attributes: f };
    return U2(e3, t | 32), e3.finishNode(c, u);
  }
  function Ct2(e3, t, n) {
    let { tokenStart: u } = e3;
    if (r(e3, t), y2(e3, t, 77932), (e3.getToken() & 134217728) === 134217728) throw new q2(u, e3.currentLocation, 30, B[e3.getToken() & 255]);
    return e3.finishNode({ type: "ImportNamespaceSpecifier", local: jt2(e3, t, n) }, u);
  }
  function Xn2(e3, t) {
    return y2(e3, t, 209011), e3.getToken() !== 134283267 && e3.report(105, "Import"), O2(e3, t);
  }
  function Et2(e3, t, n, u) {
    for (r(e3, t); e3.getToken() & 143360 || e3.getToken() === 134283267; ) {
      let { tokenValue: o, tokenStart: i } = e3, l3 = e3.getToken(), f = Se2(e3, t), c;
      C(e3, t, 77932) ? ((e3.getToken() & 134217728) === 134217728 || e3.getToken() === 18 ? e3.report(106) : Ie2(e3, t, 16, e3.getToken(), 0), o = e3.tokenValue, c = N2(e3, t)) : f.type === "Identifier" ? (Ie2(e3, t, 16, l3, 0), c = e3.cloneIdentifier(f)) : e3.report(25, B[108]), n?.addBlockName(t, o, 8, 0), u.push(e3.finishNode({ type: "ImportSpecifier", local: c, imported: f }, i)), e3.getToken() !== 1074790415 && y2(e3, t, 18);
    }
    return y2(e3, t, 1074790415), u;
  }
  function Xt2(e3, t, n) {
    let u = Wt2(e3, t, e3.finishNode({ type: "Identifier", name: "import" }, n), n);
    return u = F(e3, t, void 0, u, 0, 0, n), u = L2(e3, t, void 0, 0, 0, n, u), e3.getToken() === 18 && (u = Y3(e3, t, void 0, 0, n, u)), oe2(e3, t, u, n);
  }
  function Ht2(e3, t, n, u) {
    let o = zt2(e3, t, n, 0, u);
    return o = F(e3, t, n, o, 0, 0, u), e3.getToken() === 18 && (o = Y3(e3, t, n, 0, u, o)), oe2(e3, t, o, u);
  }
  function Hn2(e3, t, n) {
    let u = e3.leadingDecorators.decorators.length ? e3.leadingDecorators.start : e3.tokenStart;
    r(e3, t | 32);
    let o = [], i = null, l3 = null, f = [];
    if (C(e3, t | 32, 20561)) {
      switch (e3.getToken()) {
        case 86104: {
          i = p(e3, t, n, void 0, 4, 1, 1, 0, e3.tokenStart);
          break;
        }
        case 132:
        case 86094:
          i = Ye2(e3, t, n, void 0, 1);
          break;
        case 209005: {
          let { tokenStart: a } = e3;
          i = N2(e3, t);
          let { flags: s } = e3;
          (s & 1) === 0 && (e3.getToken() === 86104 ? i = p(e3, t, n, void 0, 4, 1, 1, 1, a) : e3.getToken() === 67174411 ? (i = ft2(e3, t, void 0, i, 1, 1, 0, s, a), i = F(e3, t, void 0, i, 0, 0, a), i = L2(e3, t, void 0, 0, 0, a, i)) : e3.getToken() & 143360 && (n && (n = Re2(e3, t, e3.tokenValue)), i = N2(e3, t), i = Te2(e3, t, n, void 0, [i], 1, a)));
          break;
        }
        default:
          i = I2(e3, t, void 0, 1, 0, e3.tokenStart), U2(e3, t | 32);
      }
      return n && e3.declareUnboundVariable("default"), e3.finishNode({ type: "ExportDefaultDeclaration", declaration: i }, u);
    }
    switch (e3.getToken()) {
      case 8391476: {
        r(e3, t);
        let a = null;
        C(e3, t, 77932) && (n && e3.declareUnboundVariable(e3.tokenValue), a = Se2(e3, t)), y2(e3, t, 209011), e3.getToken() !== 134283267 && e3.report(105, "Export"), l3 = O2(e3, t);
        let d3 = $e(e3, t), h = { type: "ExportAllDeclaration", source: l3, exported: a, attributes: d3 };
        return U2(e3, t | 32), e3.finishNode(h, u);
      }
      case 2162700: {
        r(e3, t);
        let a = [], s = [], d3 = 0;
        for (; e3.getToken() & 143360 || e3.getToken() === 134283267; ) {
          let { tokenStart: h, tokenValue: A } = e3, b4 = Se2(e3, t);
          b4.type === "Literal" && (d3 = 1);
          let w4;
          e3.getToken() === 77932 ? (r(e3, t), (e3.getToken() & 143360) === 0 && e3.getToken() !== 134283267 && e3.report(106), n && (a.push(e3.tokenValue), s.push(A)), w4 = Se2(e3, t)) : (n && (a.push(e3.tokenValue), s.push(e3.tokenValue)), w4 = b4.type === "Literal" ? e3.cloneStringLiteral(b4) : e3.cloneIdentifier(b4)), o.push(e3.finishNode({ type: "ExportSpecifier", local: b4, exported: w4 }, h)), e3.getToken() !== 1074790415 && y2(e3, t, 18);
        }
        y2(e3, t, 1074790415), C(e3, t, 209011) ? (e3.getToken() !== 134283267 && e3.report(105, "Export"), l3 = O2(e3, t), f = $e(e3, t), n && a.forEach((h) => e3.declareUnboundVariable(h))) : (d3 && e3.report(172), n && (a.forEach((h) => e3.declareUnboundVariable(h)), s.forEach((h) => e3.addBindingToExports(h)))), U2(e3, t | 32);
        break;
      }
      case 132:
      case 86094:
        i = Ye2(e3, t, n, void 0, 2);
        break;
      case 86104:
        i = p(e3, t, n, void 0, 4, 1, 2, 0, e3.tokenStart);
        break;
      case 241737:
        i = Ke2(e3, t, n, void 0, 8, 64);
        break;
      case 86090:
        i = Ke2(e3, t, n, void 0, 16, 64);
        break;
      case 86088:
        i = Jt2(e3, t, n, void 0, 64);
        break;
      case 209005: {
        let { tokenStart: a } = e3;
        if (r(e3, t), (e3.flags & 1) === 0 && e3.getToken() === 86104) {
          i = p(e3, t, n, void 0, 4, 1, 2, 1, a);
          break;
        }
      }
      default:
        e3.report(30, B[e3.getToken() & 255]);
    }
    let c = { type: "ExportNamedDeclaration", declaration: i, specifiers: o, source: l3, attributes: f };
    return e3.finishNode(c, u);
  }
  function I2(e3, t, n, u, o, i) {
    let l3 = J(e3, t, n, 2, 0, u, o, 1, i);
    return l3 = F(e3, t, n, l3, o, 0, i), L2(e3, t, n, o, 0, i, l3);
  }
  function Y3(e3, t, n, u, o, i) {
    let l3 = [i];
    for (; C(e3, t | 32, 18); ) l3.push(I2(e3, t, n, 1, u, e3.tokenStart));
    return e3.finishNode({ type: "SequenceExpression", expressions: l3 }, o);
  }
  function M2(e3, t, n, u, o, i) {
    let l3 = I2(e3, t, n, o, u, i);
    return e3.getToken() === 18 ? Y3(e3, t, n, u, i, l3) : l3;
  }
  function L2(e3, t, n, u, o, i, l3) {
    let f = e3.getToken();
    if ((f & 4194304) === 4194304) {
      e3.assignable & 2 && e3.report(26), (f & 524288) === 524288 && e3.assignable & 4 && e3.report(26), (!o && f === 1077936155 && l3.type === "ArrayExpression" || l3.type === "ObjectExpression") && z3(e3, l3), r(e3, t | 32);
      let c = I2(e3, t, n, 1, u, e3.tokenStart);
      return e3.assignable = 2, e3.finishNode(o ? { type: "AssignmentPattern", left: l3, right: c } : { type: "AssignmentExpression", left: l3, operator: B[f & 255], right: c }, i);
    }
    return (f & 8388608) === 8388608 && (l3 = x3(e3, t, n, u, i, 4, f, l3)), C(e3, t | 32, 22) && (l3 = ee2(e3, t, n, l3, i)), l3;
  }
  function Ee2(e3, t, n, u, o, i, l3) {
    let f = e3.getToken();
    r(e3, t | 32);
    let c = I2(e3, t, n, 1, u, e3.tokenStart);
    return l3 = e3.finishNode(o ? { type: "AssignmentPattern", left: l3, right: c } : { type: "AssignmentExpression", left: l3, operator: B[f & 255], right: c }, i), e3.assignable = 2, l3;
  }
  function ee2(e3, t, n, u, o) {
    let i = I2(e3, (t | 131072) ^ 131072, n, 1, 0, e3.tokenStart);
    y2(e3, t | 32, 21), e3.assignable = 1;
    let l3 = I2(e3, t, n, 1, 0, e3.tokenStart);
    return e3.assignable = 2, e3.finishNode({ type: "ConditionalExpression", test: u, consequent: i, alternate: l3 }, o);
  }
  function x3(e3, t, n, u, o, i, l3, f) {
    let c = -((t & 131072) > 0) & 8673330, a, s;
    for (e3.assignable = 2; e3.getToken() & 8388608 && (a = e3.getToken(), s = a & 3840, (a & 524288 && l3 & 268435456 || l3 & 524288 && a & 268435456) && e3.report(165), !(s + ((a === 8391735) << 8) - ((c === a) << 12) <= i)); ) r(e3, t | 32), f = e3.finishNode({ type: a & 524288 || a & 268435456 ? "LogicalExpression" : "BinaryExpression", left: f, right: x3(e3, t, n, u, e3.tokenStart, s, a, j3(e3, t, n, 0, u, 1)), operator: B[a & 255] }, o);
    return e3.getToken() === 1077936155 && e3.report(26), f;
  }
  function Wn2(e3, t, n, u, o) {
    u || e3.report(0);
    let { tokenStart: i } = e3, l3 = e3.getToken();
    r(e3, t | 32);
    let f = j3(e3, t, n, 0, o, 1);
    return e3.getToken() === 8391735 && e3.report(33), t & 1 && l3 === 16863276 && (f.type === "Identifier" ? e3.report(121) : gn2(f) && e3.report(127)), e3.assignable = 2, e3.finishNode({ type: "UnaryExpression", operator: B[l3 & 255], argument: f, prefix: true }, i);
  }
  function zn2(e3, t, n, u, o, i, l3, f) {
    let c = e3.getToken(), a = N2(e3, t), { flags: s } = e3;
    if ((s & 1) === 0) {
      if (e3.getToken() === 86104) return $t2(e3, t, n, 1, u, f);
      if (he2(t, e3.getToken())) return o || e3.report(0), (e3.getToken() & 36864) === 36864 && (e3.flags |= 256), Zt2(e3, t, n, i, f);
    }
    return !l3 && e3.getToken() === 67174411 ? ft2(e3, t, n, a, i, 1, 0, s, f) : e3.getToken() === 10 ? (Oe2(e3, t, c), l3 && e3.report(51), (c & 36864) === 36864 && (e3.flags |= 256), Me2(e3, t, n, e3.tokenValue, a, l3, i, 0, f)) : (e3.assignable = 1, a);
  }
  function Kn2(e3, t, n, u, o, i) {
    if (u && (e3.destructible |= 256), t & 1024) {
      r(e3, t | 32), t & 8192 && e3.report(32), o || e3.report(26), e3.getToken() === 22 && e3.report(124);
      let l3 = null, f = false;
      return (e3.flags & 1) === 0 ? (f = C(e3, t | 32, 8391476), (e3.getToken() & 77824 || f) && (l3 = I2(e3, t, n, 1, 0, e3.tokenStart))) : e3.getToken() === 8391476 && e3.report(30, B[e3.getToken() & 255]), e3.assignable = 2, e3.finishNode({ type: "YieldExpression", argument: l3, delegate: f }, i);
    }
    return t & 1 && e3.report(97, "yield"), lt2(e3, t, n);
  }
  function $n2(e3, t, n, u, o, i) {
    o && (e3.destructible |= 128), t & 524288 && e3.report(177);
    let l3 = lt2(e3, t, n);
    if (l3.type === "ArrowFunctionExpression" || (e3.getToken() & 65536) === 0) {
      if (t & 2048) throw new q2(i, { index: e3.startIndex, line: e3.startLine, column: e3.startColumn }, 176);
      if (t & 2) throw new q2(i, { index: e3.startIndex, line: e3.startLine, column: e3.startColumn }, 110);
      if (t & 8192 && t & 2048) throw new q2(i, { index: e3.startIndex, line: e3.startLine, column: e3.startColumn }, 110);
      return l3;
    }
    if (t & 8192) throw new q2(i, { index: e3.startIndex, line: e3.startLine, column: e3.startColumn }, 31);
    if (t & 2048 || t & 2 && t & 8) {
      if (u) throw new q2(i, { index: e3.startIndex, line: e3.startLine, column: e3.startColumn }, 0);
      let c = j3(e3, t, n, 0, 0, 1);
      return e3.getToken() === 8391735 && e3.report(33), e3.assignable = 2, e3.finishNode({ type: "AwaitExpression", argument: c }, i);
    }
    if (t & 2) throw new q2(i, { index: e3.startIndex, line: e3.startLine, column: e3.startColumn }, 98);
    return l3;
  }
  function Ve2(e3, t, n, u, o, i, l3) {
    let { tokenStart: f } = e3;
    y2(e3, t | 32, 2162700);
    let c = [];
    if (e3.getToken() !== 1074790415) {
      for (; e3.getToken() === 134283267; ) {
        let { index: a, tokenStart: s, tokenIndex: d3, tokenValue: h } = e3, A = e3.getToken(), b4 = O2(e3, t);
        if (Vt2(e3, a, d3, h)) {
          if (t |= 1, e3.flags & 128) throw new q2(s, e3.currentLocation, 66);
          if (e3.flags & 64) throw new q2(s, e3.currentLocation, 9);
          if (e3.flags & 4096) throw new q2(s, e3.currentLocation, 15);
          l3?.reportScopeError();
        }
        c.push(tt2(e3, t, b4, A, s));
      }
      if (t & 1 && (i && ((i & 537079808) === 537079808 && e3.report(119), (i & 36864) === 36864 && e3.report(40)), e3.flags & 512 && e3.report(119), e3.flags & 256)) {
        if (e3.strictReservedRange) throw new q2(e3.strictReservedRange[0], e3.strictReservedRange[1], 118);
        e3.report(118);
      }
    }
    for (e3.flags = (e3.flags | 512 | 256 | 64 | 4096) ^ 4928, e3.destructible = (e3.destructible | 256) ^ 256; e3.getToken() !== 1074790415; ) c.push(ye2(e3, t, n, u, 4, {}));
    return y2(e3, o & 24 ? t | 32 : t, 1074790415), e3.flags &= -4289, e3.getToken() === 1077936155 && e3.report(26), e3.finishNode({ type: "BlockStatement", body: c }, f);
  }
  function Yn2(e3, t) {
    let { tokenStart: n } = e3;
    switch (r(e3, t), e3.getToken()) {
      case 67108990:
        e3.report(167);
      case 67174411: {
        (t & 512) === 0 && e3.report(28), e3.assignable = 2;
        break;
      }
      case 69271571:
      case 67108877: {
        (t & 256) === 0 && e3.report(29), e3.assignable = 1;
        break;
      }
      default:
        e3.report(30, "super");
    }
    return e3.finishNode({ type: "Super" }, n);
  }
  function j3(e3, t, n, u, o, i) {
    let l3 = e3.tokenStart, f = J(e3, t, n, 2, 0, u, o, i, l3);
    return F(e3, t, n, f, o, 0, l3);
  }
  function Qn2(e3, t, n, u) {
    e3.assignable & 2 && e3.report(55);
    let o = e3.getToken();
    return r(e3, t), e3.assignable = 2, e3.finishNode({ type: "UpdateExpression", argument: n, operator: B[o & 255], prefix: false }, u);
  }
  function F(e3, t, n, u, o, i, l3) {
    if ((e3.getToken() & 33619968) === 33619968 && (e3.flags & 1) === 0) u = Qn2(e3, t, u, l3);
    else if ((e3.getToken() & 67108864) === 67108864) {
      switch (t = (t | 131072) ^ 131072, e3.getToken()) {
        case 67108877: {
          r(e3, (t | 262144 | 8) ^ 8), t & 16 && e3.getToken() === 130 && e3.tokenValue === "super" && e3.report(173), e3.assignable = 1;
          let f = nt2(e3, t | 64, n);
          u = e3.finishNode({ type: "MemberExpression", object: u, computed: false, property: f, optional: false }, l3);
          break;
        }
        case 69271571: {
          if ((e3.flags & 8192) === 8192) return e3.flags = (e3.flags | 8192) ^ 8192, u;
          let f = false;
          (e3.flags & 2048) === 2048 && (f = true, e3.flags = (e3.flags | 2048) ^ 2048), r(e3, t | 32);
          let { tokenStart: c } = e3, a = M2(e3, t, n, o, 1, c);
          y2(e3, t, 20), e3.assignable = 1, u = e3.finishNode({ type: "MemberExpression", object: u, computed: true, property: a, optional: false }, l3), f && (e3.flags |= 2048);
          break;
        }
        case 67174411: {
          if ((e3.flags & 1024) === 1024) return e3.flags = (e3.flags | 1024) ^ 1024, u;
          let f = false;
          (e3.flags & 2048) === 2048 && (f = true, e3.flags = (e3.flags | 2048) ^ 2048);
          let c = ot2(e3, t, n, o);
          !(t & 1) && e3.options.webcompat ? e3.assignable = 4 : e3.assignable = 2, u = e3.finishNode({ type: "CallExpression", callee: u, arguments: c, optional: false }, l3), f && (e3.flags |= 2048);
          break;
        }
        case 67108990: {
          r(e3, (t | 262144 | 8) ^ 8), e3.flags |= 2048, e3.assignable = 2, u = Zn2(e3, t, n, u, l3);
          break;
        }
        default:
          (e3.flags & 2048) === 2048 && e3.report(166), e3.assignable = 2, u = e3.finishNode({ type: "TaggedTemplateExpression", tag: u, quasi: e3.getToken() === 67174408 ? it2(e3, t | 64, n) : ut2(e3, t) }, l3);
      }
      u = F(e3, t, n, u, 0, 1, l3);
    }
    return i === 0 && (e3.flags & 2048) === 2048 && (e3.flags = (e3.flags | 2048) ^ 2048, u = e3.finishNode({ type: "ChainExpression", expression: u }, l3)), u;
  }
  function Zn2(e3, t, n, u, o) {
    let i = false, l3;
    if ((e3.getToken() === 69271571 || e3.getToken() === 67174411) && (e3.flags & 2048) === 2048 && (i = true, e3.flags = (e3.flags | 2048) ^ 2048), e3.getToken() === 69271571) {
      r(e3, t | 32);
      let { tokenStart: f } = e3, c = M2(e3, t, n, 0, 1, f);
      y2(e3, t, 20), e3.assignable = 2, l3 = e3.finishNode({ type: "MemberExpression", object: u, computed: true, optional: true, property: c }, o);
    } else if (e3.getToken() === 67174411) {
      let f = ot2(e3, t, n, 0);
      !(t & 1) && e3.options.webcompat ? e3.assignable = 4 : e3.assignable = 2, l3 = e3.finishNode({ type: "CallExpression", callee: u, arguments: f, optional: true }, o);
    } else {
      let f = nt2(e3, t, n);
      e3.assignable = 2, l3 = e3.finishNode({ type: "MemberExpression", object: u, computed: false, optional: true, property: f }, o);
    }
    return i && (e3.flags |= 2048), l3;
  }
  function nt2(e3, t, n) {
    return (e3.getToken() & 143360) === 0 && e3.getToken() !== -2147483528 && e3.getToken() !== -2147483527 && e3.getToken() !== 130 && e3.report(160), e3.getToken() === 130 ? Pe2(e3, t, n, 0) : N2(e3, t);
  }
  function Gn2(e3, t, n, u, o, i) {
    u && e3.report(56), o || e3.report(0);
    let l3 = e3.getToken();
    r(e3, t | 32);
    let f = j3(e3, t, n, 0, 0, 1);
    return e3.assignable & 2 && e3.report(55), e3.assignable = 2, e3.finishNode({ type: "UpdateExpression", argument: f, operator: B[l3 & 255], prefix: true }, i);
  }
  function J(e3, t, n, u, o, i, l3, f, c) {
    if ((e3.getToken() & 143360) === 143360) {
      switch (e3.getToken()) {
        case 209006:
          return $n2(e3, t, n, o, l3, c);
        case 241771:
          return Kn2(e3, t, n, l3, i, c);
        case 209005:
          return zn2(e3, t, n, l3, f, i, o, c);
      }
      let { tokenValue: a } = e3, s = e3.getToken(), d3 = N2(e3, t | 64);
      return e3.getToken() === 10 ? (f || e3.report(0), Oe2(e3, t, s), (s & 36864) === 36864 && (e3.flags |= 256), Me2(e3, t, n, a, d3, o, i, 0, c)) : (t & 16 && !(t & 32768) && !(t & 8192) && e3.tokenValue === "arguments" && e3.report(130), (s & 255) === 73 && (t & 1 && e3.report(113), u & 24 && e3.report(100)), e3.assignable = t & 1 && (s & 537079808) === 537079808 ? 2 : 1, d3);
    }
    if ((e3.getToken() & 134217728) === 134217728) return O2(e3, t);
    switch (e3.getToken()) {
      case 33619993:
      case 33619994:
        return Gn2(e3, t, n, o, f, c);
      case 16863276:
      case 16842798:
      case 16842799:
      case 25233968:
      case 25233969:
      case 16863275:
      case 16863277:
        return Wn2(e3, t, n, f, l3);
      case 86104:
        return $t2(e3, t, n, 0, l3, c);
      case 2162700:
        return ou2(e3, t, n, i ? 0 : 1, l3);
      case 69271571:
        return iu2(e3, t, n, i ? 0 : 1, l3);
      case 67174411:
        return fu2(e3, t | 64, n, i, 1, 0, c);
      case 86021:
      case 86022:
      case 86023:
        return nu2(e3, t);
      case 86111:
        return uu2(e3, t);
      case 65540:
        return du2(e3, t);
      case 132:
      case 86094:
        return au2(e3, t, n, l3, c);
      case 86109:
        return Yn2(e3, t);
      case 67174409:
        return ut2(e3, t);
      case 67174408:
        return it2(e3, t, n);
      case 86107:
        return cu2(e3, t, n, l3);
      case 134283388:
        return Kt2(e3, t);
      case 130:
        return Pe2(e3, t, n, 0);
      case 86106:
        return xn2(e3, t, n, o, l3, c);
      case 8456256:
        if (e3.options.jsx) return Ue2(e3, t, n, 0, e3.tokenStart);
      default:
        if (he2(t, e3.getToken())) return lt2(e3, t, n);
        e3.report(30, B[e3.getToken() & 255]);
    }
  }
  function xn2(e3, t, n, u, o, i) {
    let l3 = N2(e3, t);
    return e3.getToken() === 67108877 ? Wt2(e3, t, l3, i) : (u && e3.report(142), l3 = zt2(e3, t, n, o, i), e3.assignable = 2, F(e3, t, n, l3, o, 0, i));
  }
  function Wt2(e3, t, n, u) {
    (t & 2) === 0 && e3.report(169), r(e3, t);
    let o = e3.getToken();
    return o !== 209030 && e3.tokenValue !== "meta" ? e3.report(174) : o & -2147483648 && e3.report(175), e3.assignable = 2, e3.finishNode({ type: "MetaProperty", meta: n, property: N2(e3, t) }, u);
  }
  function zt2(e3, t, n, u, o) {
    y2(e3, t | 32, 67174411), e3.getToken() === 14 && e3.report(143);
    let i = I2(e3, t, n, 1, u, e3.tokenStart), l3 = null;
    if (e3.getToken() === 18) {
      if (y2(e3, t, 18), e3.getToken() !== 16) {
        let c = (t | 131072) ^ 131072;
        l3 = I2(e3, c, n, 1, u, e3.tokenStart);
      }
      C(e3, t, 18);
    }
    let f = { type: "ImportExpression", source: i, options: l3 };
    return y2(e3, t, 16), e3.finishNode(f, o);
  }
  function $e(e3, t) {
    if (!C(e3, t, 20579)) return [];
    y2(e3, t, 2162700);
    let n = [], u = /* @__PURE__ */ new Set();
    for (; e3.getToken() !== 1074790415; ) {
      let o = e3.tokenStart, i = eu2(e3, t);
      y2(e3, t, 21);
      let l3 = pn2(e3, t), f = i.type === "Literal" ? i.value : i.name;
      u.has(f) && e3.report(145, `${f}`), u.add(f), n.push(e3.finishNode({ type: "ImportAttribute", key: i, value: l3 }, o)), e3.getToken() !== 1074790415 && y2(e3, t, 18);
    }
    return y2(e3, t, 1074790415), n;
  }
  function pn2(e3, t) {
    if (e3.getToken() === 134283267) return O2(e3, t);
    e3.report(30, B[e3.getToken() & 255]);
  }
  function eu2(e3, t) {
    if (e3.getToken() === 134283267) return O2(e3, t);
    if (e3.getToken() & 143360) return N2(e3, t);
    e3.report(30, B[e3.getToken() & 255]);
  }
  function Se2(e3, t) {
    if (e3.getToken() === 134283267) {
      let n = e3.tokenValue;
      return kt2(0, n) || e3.report(171), O2(e3, t);
    } else {
      if (e3.getToken() & 143360) return N2(e3, t);
      e3.report(30, B[e3.getToken() & 255]);
    }
  }
  function Kt2(e3, t) {
    let { tokenRaw: n, tokenValue: u, tokenStart: o } = e3;
    r(e3, t), e3.assignable = 2;
    let i = { type: "Literal", value: u, bigint: String(u) };
    return e3.options.raw && (i.raw = n), e3.finishNode(i, o);
  }
  function ut2(e3, t) {
    e3.assignable = 2;
    let { tokenValue: n, tokenRaw: u, tokenStart: o } = e3;
    y2(e3, t, 67174409);
    let i = [Be2(e3, n, u, o, true)];
    return e3.finishNode({ type: "TemplateLiteral", expressions: [], quasis: i }, o);
  }
  function it2(e3, t, n) {
    t = (t | 131072) ^ 131072;
    let { tokenValue: u, tokenRaw: o, tokenStart: i } = e3;
    y2(e3, t & -65 | 32, 67174408);
    let l3 = [Be2(e3, u, o, i, false)], f = [M2(e3, t & -65, n, 0, 1, e3.tokenStart)];
    for (e3.getToken() !== 1074790415 && e3.report(83); e3.setToken(dn2(e3, t), true) !== 67174409; ) {
      let { tokenValue: c, tokenRaw: a, tokenStart: s } = e3;
      y2(e3, t & -65 | 32, 67174408), l3.push(Be2(e3, c, a, s, false)), f.push(M2(e3, t, n, 0, 1, e3.tokenStart)), e3.getToken() !== 1074790415 && e3.report(83);
    }
    {
      let { tokenValue: c, tokenRaw: a, tokenStart: s } = e3;
      y2(e3, t, 67174409), l3.push(Be2(e3, c, a, s, true));
    }
    return e3.finishNode({ type: "TemplateLiteral", expressions: f, quasis: l3 }, i);
  }
  function Be2(e3, t, n, u, o) {
    let i = e3.finishNode({ type: "TemplateElement", value: { cooked: t, raw: n }, tail: o }, u), l3 = o ? 1 : 2, { ranges: f } = e3.options;
    return f && (f.start && (i.start += 1), f.end && (i.end -= l3), f.range && (i.range[0] += 1, i.range[1] -= l3)), e3.options.loc && (i.loc.start.column += 1, i.loc.end.column -= l3), i;
  }
  function tu2(e3, t, n) {
    let u = e3.tokenStart;
    t = (t | 131072) ^ 131072, y2(e3, t | 32, 14);
    let o = I2(e3, t, n, 1, 0, e3.tokenStart);
    return e3.assignable = 1, e3.finishNode({ type: "SpreadElement", argument: o }, u);
  }
  function ot2(e3, t, n, u) {
    r(e3, t | 32);
    let o = [];
    if (e3.getToken() === 16) return r(e3, t | 64), o;
    for (; e3.getToken() !== 16 && (e3.getToken() === 14 ? o.push(tu2(e3, t, n)) : o.push(I2(e3, t, n, 1, u, e3.tokenStart)), !(e3.getToken() !== 18 || (r(e3, t | 32), e3.getToken() === 16))); ) ;
    return y2(e3, t | 64, 16), o;
  }
  function N2(e3, t) {
    let { tokenValue: n, tokenStart: u } = e3, o = n === "await" && (e3.getToken() & -2147483648) === 0;
    return r(e3, t | (o ? 32 : 0)), e3.finishNode({ type: "Identifier", name: n }, u);
  }
  function O2(e3, t) {
    let { tokenValue: n, tokenRaw: u, tokenStart: o } = e3;
    if (e3.getToken() === 134283388) return Kt2(e3, t);
    let i = { type: "Literal", value: n };
    return e3.options.raw && (i.raw = u), r(e3, t), e3.assignable = 2, e3.finishNode(i, o);
  }
  function nu2(e3, t) {
    let n = e3.tokenStart, u = B[e3.getToken() & 255], i = { type: "Literal", value: e3.getToken() === 86023 ? null : u === "true" };
    return e3.options.raw && (i.raw = u), r(e3, t), e3.assignable = 2, e3.finishNode(i, n);
  }
  function uu2(e3, t) {
    let { tokenStart: n } = e3;
    return r(e3, t), e3.assignable = 2, e3.finishNode({ type: "ThisExpression" }, n);
  }
  function p(e3, t, n, u, o, i, l3, f, c) {
    r(e3, t | 32);
    let a = i ? pe2(e3, t, 8391476) : 0, s = null, d3, h = n ? e3.createScope() : void 0;
    if (e3.getToken() === 67174411) (l3 & 1) === 0 && e3.report(39, "Function");
    else {
      let T4 = o & 4 && ((t & 8) === 0 || (t & 2) === 0) ? 4 : 64 | (f ? 1024 : 0) | (a ? 1024 : 0);
      Mt2(e3, t, e3.getToken()), n && (T4 & 4 ? n.addVarName(t, e3.tokenValue, T4) : n.addBlockName(t, e3.tokenValue, T4, o), h = h?.createChildScope(128), l3 && l3 & 2 && e3.declareUnboundVariable(e3.tokenValue)), d3 = e3.getToken(), e3.getToken() & 143360 ? s = N2(e3, t) : e3.report(30, B[e3.getToken() & 255]);
    }
    t = (t | 28416) ^ 28416 | 65536 | (f ? 2048 : 0) | (a ? 1024 : 0) | (a ? 0 : 262144), h = h?.createChildScope(256);
    let A = Qt2(e3, (t | 8192) & -524289, h, u, 0, 1), b4 = 524428, w4 = Ve2(e3, (t | b4) ^ b4 | 32768 | 4096, h?.createChildScope(64), u, 8, d3, h);
    return e3.finishNode({ type: "FunctionDeclaration", id: s, params: A, body: w4, async: f === 1, generator: a === 1 }, c);
  }
  function $t2(e3, t, n, u, o, i) {
    r(e3, t | 32);
    let l3 = pe2(e3, t, 8391476), f = (u ? 2048 : 0) | (l3 ? 1024 : 0), c = null, a, s = e3.createScopeIfLexical(), d3 = 552704;
    e3.getToken() & 143360 && (Mt2(e3, (t | d3) ^ d3 | f, e3.getToken()), s = s?.createChildScope(128), a = e3.getToken(), c = N2(e3, t)), t = (t | d3) ^ d3 | 65536 | f | (l3 ? 0 : 262144), s = s?.createChildScope(256);
    let h = Qt2(e3, (t | 8192) & -524289, s, n, o, 1), A = Ve2(e3, t & -131229 | 32768 | 4096, s?.createChildScope(64), n, 0, a, s);
    return e3.assignable = 2, e3.finishNode({ type: "FunctionExpression", id: c, params: h, body: A, async: u === 1, generator: l3 === 1 }, i);
  }
  function iu2(e3, t, n, u, o) {
    let i = X3(e3, t, void 0, n, u, o, 0, 2, 0);
    return e3.destructible & 64 && e3.report(63), e3.destructible & 8 && e3.report(62), i;
  }
  function X3(e3, t, n, u, o, i, l3, f, c) {
    let { tokenStart: a } = e3;
    r(e3, t | 32);
    let s = [], d3 = 0;
    for (t = (t | 131072) ^ 131072; e3.getToken() !== 20; ) if (C(e3, t | 32, 18)) s.push(null);
    else {
      let A, { tokenStart: b4, tokenValue: w4 } = e3, T4 = e3.getToken();
      if (T4 & 143360) if (A = J(e3, t, u, f, 0, 1, i, 1, b4), e3.getToken() === 1077936155) {
        e3.assignable & 2 && e3.report(26), r(e3, t | 32), n?.addVarOrBlock(t, w4, f, c);
        let D = I2(e3, t, u, 1, i, e3.tokenStart);
        A = e3.finishNode(l3 ? { type: "AssignmentPattern", left: A, right: D } : { type: "AssignmentExpression", operator: "=", left: A, right: D }, b4), d3 |= e3.destructible & 256 ? 256 : 0 | e3.destructible & 128 ? 128 : 0;
      } else e3.getToken() === 18 || e3.getToken() === 20 ? (e3.assignable & 2 ? d3 |= 16 : n?.addVarOrBlock(t, w4, f, c), d3 |= e3.destructible & 256 ? 256 : 0 | e3.destructible & 128 ? 128 : 0) : (d3 |= f & 1 ? 32 : (f & 2) === 0 ? 16 : 0, A = F(e3, t, u, A, i, 0, b4), e3.getToken() !== 18 && e3.getToken() !== 20 ? (e3.getToken() !== 1077936155 && (d3 |= 16), A = L2(e3, t, u, i, l3, b4, A)) : e3.getToken() !== 1077936155 && (d3 |= e3.assignable & 1 ? 32 : 16));
      else T4 & 2097152 ? (A = e3.getToken() === 2162700 ? H3(e3, t, n, u, 0, i, l3, f, c) : X3(e3, t, n, u, 0, i, l3, f, c), d3 |= e3.destructible, e3.assignable = e3.destructible & 16 ? 2 : 1, e3.getToken() === 18 || e3.getToken() === 20 ? e3.assignable & 2 && (d3 |= 16) : e3.destructible & 8 ? e3.report(71) : (A = F(e3, t, u, A, i, 0, b4), d3 = e3.assignable & 2 ? 16 : 0, e3.getToken() !== 18 && e3.getToken() !== 20 ? A = L2(e3, t, u, i, l3, b4, A) : e3.getToken() !== 1077936155 && (d3 |= e3.assignable & 1 ? 32 : 16))) : T4 === 14 ? (A = le2(e3, t, n, u, 20, f, c, 0, i, l3), d3 |= e3.destructible, e3.getToken() !== 18 && e3.getToken() !== 20 && e3.report(30, B[e3.getToken() & 255])) : (A = j3(e3, t, u, 1, 0, 1), e3.getToken() !== 18 && e3.getToken() !== 20 ? (A = L2(e3, t, u, i, l3, b4, A), (f & 3) === 0 && T4 === 67174411 && (d3 |= 16)) : e3.assignable & 2 ? d3 |= 16 : T4 === 67174411 && (d3 |= e3.assignable & 1 && f & 3 ? 32 : 16));
      if (s.push(A), C(e3, t | 32, 18)) {
        if (e3.getToken() === 20) break;
      } else break;
    }
    y2(e3, t, 20);
    let h = e3.finishNode({ type: l3 ? "ArrayPattern" : "ArrayExpression", elements: s }, a);
    return !o && e3.getToken() & 4194304 ? Yt2(e3, t, u, d3, i, l3, a, h) : (e3.destructible = d3, h);
  }
  function Yt2(e3, t, n, u, o, i, l3, f) {
    e3.getToken() !== 1077936155 && e3.report(26), r(e3, t | 32), u & 16 && e3.report(26), i || z3(e3, f);
    let { tokenStart: c } = e3, a = I2(e3, t, n, 1, o, c);
    return e3.destructible = (u | 64 | 8) ^ 72 | (e3.destructible & 128 ? 128 : 0) | (e3.destructible & 256 ? 256 : 0), e3.finishNode(i ? { type: "AssignmentPattern", left: f, right: a } : { type: "AssignmentExpression", left: f, operator: "=", right: a }, l3);
  }
  function le2(e3, t, n, u, o, i, l3, f, c, a) {
    let { tokenStart: s } = e3;
    r(e3, t | 32);
    let d3 = null, h = 0, { tokenValue: A, tokenStart: b4 } = e3, w4 = e3.getToken();
    if (w4 & 143360) e3.assignable = 1, d3 = J(e3, t, u, i, 0, 1, c, 1, b4), w4 = e3.getToken(), d3 = F(e3, t, u, d3, c, 0, b4), e3.getToken() !== 18 && e3.getToken() !== o && (e3.assignable & 2 && e3.getToken() === 1077936155 && e3.report(71), h |= 16, d3 = L2(e3, t, u, c, a, b4, d3)), e3.assignable & 2 ? h |= 16 : w4 === o || w4 === 18 ? n?.addVarOrBlock(t, A, i, l3) : h |= 32, h |= e3.destructible & 128 ? 128 : 0;
    else if (w4 === o) e3.report(41);
    else if (w4 & 2097152) d3 = e3.getToken() === 2162700 ? H3(e3, t, n, u, 1, c, a, i, l3) : X3(e3, t, n, u, 1, c, a, i, l3), w4 = e3.getToken(), w4 !== 1077936155 && w4 !== o && w4 !== 18 ? (e3.destructible & 8 && e3.report(71), d3 = F(e3, t, u, d3, c, 0, b4), h |= e3.assignable & 1 ? 0 : 16, (e3.getToken() & 4194304) === 4194304 ? (e3.getToken() !== 1077936155 && (h |= 16), d3 = L2(e3, t, u, c, a, b4, d3)) : ((e3.getToken() & 8388608) === 8388608 && (d3 = x3(e3, t, u, 1, b4, 4, w4, d3)), C(e3, t | 32, 22) && (d3 = ee2(e3, t, u, d3, b4)), h |= e3.assignable & 1 ? 32 : 16)) : h |= o === 1074790415 && w4 !== 1077936155 ? 16 : e3.destructible;
    else {
      h |= 32, d3 = j3(e3, t, u, 1, c, 1);
      let { tokenStart: T4 } = e3, D = e3.getToken();
      return D === 1077936155 ? (e3.assignable & 2 && e3.report(26), d3 = L2(e3, t, u, c, a, T4, d3), h |= 16) : (D === 18 ? h |= 16 : D !== o && (d3 = L2(e3, t, u, c, a, T4, d3)), h |= e3.assignable & 1 ? 32 : 16), e3.destructible = h, e3.getToken() !== o && e3.getToken() !== 18 && e3.report(161), e3.finishNode({ type: a ? "RestElement" : "SpreadElement", argument: d3 }, s);
    }
    if (e3.getToken() !== o) if (i & 1 && (h |= f ? 16 : 32), C(e3, t | 32, 1077936155)) {
      h & 16 && e3.report(26), z3(e3, d3);
      let T4 = I2(e3, t, u, 1, c, e3.tokenStart);
      d3 = e3.finishNode(a ? { type: "AssignmentPattern", left: d3, right: T4 } : { type: "AssignmentExpression", left: d3, operator: "=", right: T4 }, b4), h = 16;
    } else h |= 16;
    return e3.destructible = h, e3.finishNode({ type: a ? "RestElement" : "SpreadElement", argument: d3 }, s);
  }
  function W3(e3, t, n, u, o, i) {
    let l3 = 11264 | ((u & 64) === 0 ? 16896 : 0);
    t = (t | l3) ^ l3 | (u & 8 ? 1024 : 0) | (u & 16 ? 2048 : 0) | (u & 64 ? 16384 : 0) | 256 | 32768 | 65536;
    let f = e3.createScopeIfLexical(256), c = lu2(e3, (t | 8192) & -524289, f, n, u, 1, o);
    f = f?.createChildScope(64);
    let a = Ve2(e3, t & -655373 | 32768 | 4096, f, n, 0, void 0, f?.parent);
    return e3.finishNode({ type: "FunctionExpression", params: c, body: a, async: (u & 16) > 0, generator: (u & 8) > 0, id: null }, i);
  }
  function ou2(e3, t, n, u, o) {
    let i = H3(e3, t, void 0, n, u, o, 0, 2, 0);
    return e3.destructible & 64 && e3.report(63), e3.destructible & 8 && e3.report(62), i;
  }
  function H3(e3, t, n, u, o, i, l3, f, c) {
    let { tokenStart: a } = e3;
    r(e3, t);
    let s = [], d3 = 0, h = 0;
    for (t = (t | 131072) ^ 131072; e3.getToken() !== 1074790415; ) {
      let { tokenValue: b4, tokenStart: w4 } = e3, T4 = e3.getToken();
      if (T4 === 14) s.push(le2(e3, t, n, u, 1074790415, f, c, 0, i, l3));
      else {
        let D = 0, v3 = null, k3;
        if (e3.getToken() & 143360 || e3.getToken() === -2147483528 || e3.getToken() === -2147483527) if (e3.getToken() === -2147483527 && (d3 |= 16), v3 = N2(e3, t), e3.getToken() === 18 || e3.getToken() === 1074790415 || e3.getToken() === 1077936155) if (D |= 4, t & 1 && (T4 & 537079808) === 537079808 ? d3 |= 16 : Ie2(e3, t, f, T4, 0), n?.addVarOrBlock(t, b4, f, c), C(e3, t | 32, 1077936155)) {
          d3 |= 8;
          let E = I2(e3, t, u, 1, i, e3.tokenStart);
          d3 |= e3.destructible & 256 ? 256 : 0 | e3.destructible & 128 ? 128 : 0, k3 = e3.finishNode({ type: "AssignmentPattern", left: e3.cloneIdentifier(v3), right: E }, w4);
        } else d3 |= (T4 === 209006 ? 128 : 0) | (T4 === -2147483528 ? 16 : 0), k3 = e3.cloneIdentifier(v3);
        else if (C(e3, t | 32, 21)) {
          let { tokenStart: E } = e3;
          if (b4 === "__proto__" && h++, e3.getToken() & 143360) {
            let de3 = e3.getToken(), Q4 = e3.tokenValue;
            k3 = J(e3, t, u, f, 0, 1, i, 1, E);
            let K4 = e3.getToken();
            k3 = F(e3, t, u, k3, i, 0, E), e3.getToken() === 18 || e3.getToken() === 1074790415 ? K4 === 1077936155 || K4 === 1074790415 || K4 === 18 ? (d3 |= e3.destructible & 128 ? 128 : 0, e3.assignable & 2 ? d3 |= 16 : (de3 & 143360) === 143360 && n?.addVarOrBlock(t, Q4, f, c)) : d3 |= e3.assignable & 1 ? 32 : 16 : (e3.getToken() & 4194304) === 4194304 ? (e3.assignable & 2 ? d3 |= 16 : K4 !== 1077936155 ? d3 |= 32 : n?.addVarOrBlock(t, Q4, f, c), k3 = L2(e3, t, u, i, l3, E, k3)) : (d3 |= 16, (e3.getToken() & 8388608) === 8388608 && (k3 = x3(e3, t, u, 1, E, 4, K4, k3)), C(e3, t | 32, 22) && (k3 = ee2(e3, t, u, k3, E)));
          } else (e3.getToken() & 2097152) === 2097152 ? (k3 = e3.getToken() === 69271571 ? X3(e3, t, n, u, 0, i, l3, f, c) : H3(e3, t, n, u, 0, i, l3, f, c), d3 = e3.destructible, e3.assignable = d3 & 16 ? 2 : 1, e3.getToken() === 18 || e3.getToken() === 1074790415 ? e3.assignable & 2 && (d3 |= 16) : e3.destructible & 8 ? e3.report(71) : (k3 = F(e3, t, u, k3, i, 0, E), d3 = e3.assignable & 2 ? 16 : 0, (e3.getToken() & 4194304) === 4194304 ? k3 = Ee2(e3, t, u, i, l3, E, k3) : ((e3.getToken() & 8388608) === 8388608 && (k3 = x3(e3, t, u, 1, E, 4, T4, k3)), C(e3, t | 32, 22) && (k3 = ee2(e3, t, u, k3, E)), d3 |= e3.assignable & 1 ? 32 : 16))) : (k3 = j3(e3, t, u, 1, i, 1), d3 |= e3.assignable & 1 ? 32 : 16, e3.getToken() === 18 || e3.getToken() === 1074790415 ? e3.assignable & 2 && (d3 |= 16) : (k3 = F(e3, t, u, k3, i, 0, E), d3 = e3.assignable & 2 ? 16 : 0, e3.getToken() !== 18 && T4 !== 1074790415 && (e3.getToken() !== 1077936155 && (d3 |= 16), k3 = L2(e3, t, u, i, l3, E, k3))));
        } else e3.getToken() === 69271571 ? (d3 |= 16, T4 === 209005 && (D |= 16), D |= (T4 === 209008 ? 256 : T4 === 209009 ? 512 : 1) | 2, v3 = ue2(e3, t, u, i), d3 |= e3.assignable, k3 = W3(e3, t, u, D, i, e3.tokenStart)) : e3.getToken() & 143360 ? (d3 |= 16, T4 === -2147483528 && e3.report(95), T4 === 209005 ? (e3.flags & 1 && e3.report(132), D |= 17) : T4 === 209008 ? D |= 256 : T4 === 209009 ? D |= 512 : e3.report(0), v3 = N2(e3, t), k3 = W3(e3, t, u, D, i, e3.tokenStart)) : e3.getToken() === 67174411 ? (d3 |= 16, D |= 1, k3 = W3(e3, t, u, D, i, e3.tokenStart)) : e3.getToken() === 8391476 ? (d3 |= 16, T4 === 209008 ? e3.report(42) : T4 === 209009 ? e3.report(43) : T4 !== 209005 && e3.report(30, B[52]), r(e3, t), D |= 9 | (T4 === 209005 ? 16 : 0), e3.getToken() & 143360 ? v3 = N2(e3, t) : (e3.getToken() & 134217728) === 134217728 ? v3 = O2(e3, t) : e3.getToken() === 69271571 ? (D |= 2, v3 = ue2(e3, t, u, i), d3 |= e3.assignable) : e3.report(30, B[e3.getToken() & 255]), k3 = W3(e3, t, u, D, i, e3.tokenStart)) : (e3.getToken() & 134217728) === 134217728 ? (T4 === 209005 && (D |= 16), D |= T4 === 209008 ? 256 : T4 === 209009 ? 512 : 1, d3 |= 16, v3 = O2(e3, t), k3 = W3(e3, t, u, D, i, e3.tokenStart)) : e3.report(133);
        else if ((e3.getToken() & 134217728) === 134217728) if (v3 = O2(e3, t), e3.getToken() === 21) {
          y2(e3, t | 32, 21);
          let { tokenStart: E } = e3;
          if (b4 === "__proto__" && h++, e3.getToken() & 143360) {
            k3 = J(e3, t, u, f, 0, 1, i, 1, E);
            let { tokenValue: de3 } = e3, Q4 = e3.getToken();
            k3 = F(e3, t, u, k3, i, 0, E), e3.getToken() === 18 || e3.getToken() === 1074790415 ? Q4 === 1077936155 || Q4 === 1074790415 || Q4 === 18 ? e3.assignable & 2 ? d3 |= 16 : n?.addVarOrBlock(t, de3, f, c) : d3 |= e3.assignable & 1 ? 32 : 16 : e3.getToken() === 1077936155 ? (e3.assignable & 2 && (d3 |= 16), k3 = L2(e3, t, u, i, l3, E, k3)) : (d3 |= 16, k3 = L2(e3, t, u, i, l3, E, k3));
          } else (e3.getToken() & 2097152) === 2097152 ? (k3 = e3.getToken() === 69271571 ? X3(e3, t, n, u, 0, i, l3, f, c) : H3(e3, t, n, u, 0, i, l3, f, c), d3 = e3.destructible, e3.assignable = d3 & 16 ? 2 : 1, e3.getToken() === 18 || e3.getToken() === 1074790415 ? e3.assignable & 2 && (d3 |= 16) : (e3.destructible & 8) !== 8 && (k3 = F(e3, t, u, k3, i, 0, E), d3 = e3.assignable & 2 ? 16 : 0, (e3.getToken() & 4194304) === 4194304 ? k3 = Ee2(e3, t, u, i, l3, E, k3) : ((e3.getToken() & 8388608) === 8388608 && (k3 = x3(e3, t, u, 1, E, 4, T4, k3)), C(e3, t | 32, 22) && (k3 = ee2(e3, t, u, k3, E)), d3 |= e3.assignable & 1 ? 32 : 16))) : (k3 = j3(e3, t, u, 1, 0, 1), d3 |= e3.assignable & 1 ? 32 : 16, e3.getToken() === 18 || e3.getToken() === 1074790415 ? e3.assignable & 2 && (d3 |= 16) : (k3 = F(e3, t, u, k3, i, 0, E), d3 = e3.assignable & 1 ? 0 : 16, e3.getToken() !== 18 && e3.getToken() !== 1074790415 && (e3.getToken() !== 1077936155 && (d3 |= 16), k3 = L2(e3, t, u, i, l3, E, k3))));
        } else e3.getToken() === 67174411 ? (D |= 1, k3 = W3(e3, t, u, D, i, e3.tokenStart), d3 = 16) : e3.report(134);
        else if (e3.getToken() === 69271571) if (v3 = ue2(e3, t, u, i), d3 |= e3.destructible & 256 ? 256 : 0, D |= 2, e3.getToken() === 21) {
          r(e3, t | 32);
          let { tokenStart: E, tokenValue: de3 } = e3, Q4 = e3.getToken();
          if (e3.getToken() & 143360) {
            k3 = J(e3, t, u, f, 0, 1, i, 1, E);
            let K4 = e3.getToken();
            k3 = F(e3, t, u, k3, i, 0, E), (e3.getToken() & 4194304) === 4194304 ? (d3 |= e3.assignable & 1 ? K4 === 1077936155 ? 0 : 32 : 16, k3 = Ee2(e3, t, u, i, l3, E, k3)) : e3.getToken() === 18 || e3.getToken() === 1074790415 ? K4 === 1077936155 || K4 === 1074790415 || K4 === 18 ? e3.assignable & 2 ? d3 |= 16 : (Q4 & 143360) === 143360 && n?.addVarOrBlock(t, de3, f, c) : d3 |= e3.assignable & 1 ? 32 : 16 : (d3 |= 16, k3 = L2(e3, t, u, i, l3, E, k3));
          } else (e3.getToken() & 2097152) === 2097152 ? (k3 = e3.getToken() === 69271571 ? X3(e3, t, n, u, 0, i, l3, f, c) : H3(e3, t, n, u, 0, i, l3, f, c), d3 = e3.destructible, e3.assignable = d3 & 16 ? 2 : 1, e3.getToken() === 18 || e3.getToken() === 1074790415 ? e3.assignable & 2 && (d3 |= 16) : d3 & 8 ? e3.report(62) : (k3 = F(e3, t, u, k3, i, 0, E), d3 = e3.assignable & 2 ? d3 | 16 : 0, (e3.getToken() & 4194304) === 4194304 ? (e3.getToken() !== 1077936155 && (d3 |= 16), k3 = Ee2(e3, t, u, i, l3, E, k3)) : ((e3.getToken() & 8388608) === 8388608 && (k3 = x3(e3, t, u, 1, E, 4, T4, k3)), C(e3, t | 32, 22) && (k3 = ee2(e3, t, u, k3, E)), d3 |= e3.assignable & 1 ? 32 : 16))) : (k3 = j3(e3, t, u, 1, 0, 1), d3 |= e3.assignable & 1 ? 32 : 16, e3.getToken() === 18 || e3.getToken() === 1074790415 ? e3.assignable & 2 && (d3 |= 16) : (k3 = F(e3, t, u, k3, i, 0, E), d3 = e3.assignable & 1 ? 0 : 16, e3.getToken() !== 18 && e3.getToken() !== 1074790415 && (e3.getToken() !== 1077936155 && (d3 |= 16), k3 = L2(e3, t, u, i, l3, E, k3))));
        } else e3.getToken() === 67174411 ? (D |= 1, k3 = W3(e3, t, u, D, i, e3.tokenStart), d3 = 16) : e3.report(44);
        else if (T4 === 8391476) if (y2(e3, t | 32, 8391476), D |= 8, e3.getToken() & 143360) {
          let E = e3.getToken();
          if (v3 = N2(e3, t), D |= 1, e3.getToken() === 67174411) d3 |= 16, k3 = W3(e3, t, u, D, i, e3.tokenStart);
          else throw new q2(e3.tokenStart, e3.currentLocation, E === 209005 ? 46 : E === 209008 || e3.getToken() === 209009 ? 45 : 47, B[E & 255]);
        } else (e3.getToken() & 134217728) === 134217728 ? (d3 |= 16, v3 = O2(e3, t), D |= 1, k3 = W3(e3, t, u, D, i, e3.tokenStart)) : e3.getToken() === 69271571 ? (d3 |= 16, D |= 3, v3 = ue2(e3, t, u, i), k3 = W3(e3, t, u, D, i, e3.tokenStart)) : e3.report(126);
        else e3.report(30, B[T4 & 255]);
        d3 |= e3.destructible & 128 ? 128 : 0, e3.destructible = d3, s.push(e3.finishNode({ type: "Property", key: v3, value: k3, kind: D & 768 ? D & 512 ? "set" : "get" : "init", computed: (D & 2) > 0, method: (D & 1) > 0, shorthand: (D & 4) > 0 }, w4));
      }
      if (d3 |= e3.destructible, e3.getToken() !== 18) break;
      r(e3, t);
    }
    y2(e3, t, 1074790415), h > 1 && (d3 |= 64);
    let A = e3.finishNode({ type: l3 ? "ObjectPattern" : "ObjectExpression", properties: s }, a);
    return !o && e3.getToken() & 4194304 ? Yt2(e3, t, u, d3, i, l3, a, A) : (e3.destructible = d3, A);
  }
  function lu2(e3, t, n, u, o, i, l3) {
    y2(e3, t, 67174411);
    let f = [];
    if (e3.flags = (e3.flags | 128) ^ 128, e3.strictReservedRange = null, e3.getToken() === 16) return o & 512 && e3.report(37, "Setter", "one", ""), r(e3, t), f;
    o & 256 && e3.report(37, "Getter", "no", "s"), o & 512 && e3.getToken() === 14 && e3.report(38), t = (t | 131072) ^ 131072;
    let c = 0, a = 0;
    for (; e3.getToken() !== 18; ) {
      let s = null, { tokenStart: d3 } = e3;
      if (e3.getToken() & 143360 ? ((t & 1) === 0 && ((e3.getToken() & 36864) === 36864 && (e3.flags |= 256, e3.strictReservedRange ?? (e3.strictReservedRange = [d3, e3.currentLocation])), (e3.getToken() & 537079808) === 537079808 && (e3.flags |= 512)), s = ct2(e3, t, n, o | 1, 0)) : (e3.getToken() === 2162700 ? s = H3(e3, t, n, u, 1, l3, 1, i, 0) : e3.getToken() === 69271571 ? s = X3(e3, t, n, u, 1, l3, 1, i, 0) : e3.getToken() === 14 && (s = le2(e3, t, n, u, 16, i, 0, 0, l3, 1)), a = 1, e3.destructible & 48 && e3.report(50)), e3.getToken() === 1077936155) {
        r(e3, t | 32), a = 1;
        let h = I2(e3, t, u, 1, 0, e3.tokenStart);
        s = e3.finishNode({ type: "AssignmentPattern", left: s, right: h }, d3);
      }
      if (c++, f.push(s), !C(e3, t, 18) || e3.getToken() === 16) break;
    }
    return o & 512 && c !== 1 && e3.report(37, "Setter", "one", ""), n?.reportScopeError(), a && (e3.flags |= 128), y2(e3, t, 16), f;
  }
  function ue2(e3, t, n, u) {
    r(e3, t | 32);
    let o = I2(e3, (t | 131072) ^ 131072, n, 1, u, e3.tokenStart);
    return y2(e3, t, 20), o;
  }
  function fu2(e3, t, n, u, o, i, l3) {
    e3.flags = (e3.flags | 128) ^ 128;
    let f = e3.tokenStart;
    r(e3, t | 32 | 262144);
    let c = e3.createScopeIfLexical()?.createChildScope(512);
    if (t = (t | 131072) ^ 131072, C(e3, t, 16)) return qe2(e3, t, c, n, [], u, 0, l3);
    let a = 0;
    e3.destructible &= -385;
    let s, d3 = [], h = 0, A = 0, b4 = 0, w4 = e3.tokenStart;
    for (e3.assignable = 1; e3.getToken() !== 16; ) {
      let { tokenStart: T4 } = e3, D = e3.getToken();
      if (D & 143360) c?.addBlockName(t, e3.tokenValue, 1, 0), (D & 537079808) === 537079808 ? A = 1 : (D & 36864) === 36864 && (b4 = 1), s = J(e3, t, n, o, 0, 1, 1, 1, T4), e3.getToken() === 16 || e3.getToken() === 18 ? e3.assignable & 2 && (a |= 16, A = 1) : (e3.getToken() === 1077936155 ? A = 1 : a |= 16, s = F(e3, t, n, s, 1, 0, T4), e3.getToken() !== 16 && e3.getToken() !== 18 && (s = L2(e3, t, n, 1, 0, T4, s)));
      else if ((D & 2097152) === 2097152) s = D === 2162700 ? H3(e3, t | 262144, c, n, 0, 1, 0, o, i) : X3(e3, t | 262144, c, n, 0, 1, 0, o, i), a |= e3.destructible, A = 1, e3.assignable = 2, e3.getToken() !== 16 && e3.getToken() !== 18 && (a & 8 && e3.report(122), s = F(e3, t, n, s, 0, 0, T4), a |= 16, e3.getToken() !== 16 && e3.getToken() !== 18 && (s = L2(e3, t, n, 0, 0, T4, s)));
      else if (D === 14) {
        s = le2(e3, t, c, n, 16, o, i, 0, 1, 0), e3.destructible & 16 && e3.report(74), A = 1, h && (e3.getToken() === 16 || e3.getToken() === 18) && d3.push(s), a |= 8;
        break;
      } else {
        if (a |= 16, s = I2(e3, t, n, 1, 1, T4), h && (e3.getToken() === 16 || e3.getToken() === 18) && d3.push(s), e3.getToken() === 18 && (h || (h = 1, d3 = [s])), h) {
          for (; C(e3, t | 32, 18); ) d3.push(I2(e3, t, n, 1, 1, e3.tokenStart));
          e3.assignable = 2, s = e3.finishNode({ type: "SequenceExpression", expressions: d3 }, w4);
        }
        return y2(e3, t, 16), e3.destructible = a, e3.options.preserveParens ? e3.finishNode({ type: "ParenthesizedExpression", expression: s }, f) : s;
      }
      if (h && (e3.getToken() === 16 || e3.getToken() === 18) && d3.push(s), !C(e3, t | 32, 18)) break;
      if (h || (h = 1, d3 = [s]), e3.getToken() === 16) {
        a |= 8;
        break;
      }
    }
    return h && (e3.assignable = 2, s = e3.finishNode({ type: "SequenceExpression", expressions: d3 }, w4)), y2(e3, t, 16), a & 16 && a & 8 && e3.report(151), a |= e3.destructible & 256 ? 256 : 0 | e3.destructible & 128 ? 128 : 0, e3.getToken() === 10 ? (a & 48 && e3.report(49), t & 2050 && a & 128 && e3.report(31), t & 1025 && a & 256 && e3.report(32), A && (e3.flags |= 128), b4 && (e3.flags |= 256), qe2(e3, t, c, n, h ? d3 : [s], u, 0, l3)) : (a & 64 && e3.report(63), a & 8 && e3.report(144), e3.destructible = (e3.destructible | 256) ^ 256 | a, e3.options.preserveParens ? e3.finishNode({ type: "ParenthesizedExpression", expression: s }, f) : s);
  }
  function lt2(e3, t, n) {
    let { tokenStart: u } = e3, { tokenValue: o } = e3, i = 0, l3 = 0;
    (e3.getToken() & 537079808) === 537079808 ? i = 1 : (e3.getToken() & 36864) === 36864 && (l3 = 1);
    let f = N2(e3, t);
    if (e3.assignable = 1, e3.getToken() === 10) {
      let c = e3.options.lexical ? Re2(e3, t, o) : void 0;
      return i && (e3.flags |= 128), l3 && (e3.flags |= 256), Te2(e3, t, c, n, [f], 0, u);
    }
    return f;
  }
  function Me2(e3, t, n, u, o, i, l3, f, c) {
    l3 || e3.report(57), i && e3.report(51), e3.flags &= -129;
    let a = e3.options.lexical ? Re2(e3, t, u) : void 0;
    return Te2(e3, t, a, n, [o], f, c);
  }
  function qe2(e3, t, n, u, o, i, l3, f) {
    i || e3.report(57);
    for (let c = 0; c < o.length; ++c) z3(e3, o[c]);
    return Te2(e3, t, n, u, o, l3, f);
  }
  function Te2(e3, t, n, u, o, i, l3) {
    e3.flags & 1 && e3.report(48), y2(e3, t | 32, 10);
    let f = 535552;
    t = (t | f) ^ f | (i ? 2048 : 0);
    let c = e3.getToken() !== 2162700, a;
    if (n?.reportScopeError(), c) e3.flags = (e3.flags | 512 | 256 | 64 | 4096) ^ 4928, a = I2(e3, t, u, 1, 0, e3.tokenStart);
    else {
      n = n?.createChildScope(64);
      let s = 131084;
      switch (a = Ve2(e3, (t | s) ^ s | 4096, n, u, 16, void 0, void 0), e3.getToken()) {
        case 69271571:
          (e3.flags & 1) === 0 && e3.report(116), e3.flags |= 8192;
          break;
        case 67108877:
        case 67174409:
        case 22:
          e3.report(117);
        case 67174411:
          (e3.flags & 1) === 0 && e3.report(116), e3.flags |= 1024;
          break;
      }
      (e3.getToken() & 8388608) === 8388608 && (e3.flags & 1) === 0 && e3.report(30, B[e3.getToken() & 255]), (e3.getToken() & 33619968) === 33619968 && e3.report(125);
    }
    return e3.assignable = 2, e3.finishNode({ type: "ArrowFunctionExpression", params: o, body: a, async: i === 1, expression: c, generator: false }, l3);
  }
  function Qt2(e3, t, n, u, o, i) {
    y2(e3, t, 67174411), e3.flags = (e3.flags | 128) ^ 128, e3.strictReservedRange = null;
    let l3 = [];
    if (C(e3, t, 16)) return l3;
    t = (t | 131072) ^ 131072;
    let f = 0;
    for (; e3.getToken() !== 18; ) {
      let c, { tokenStart: a } = e3, s = e3.getToken();
      if (s & 143360 ? ((t & 1) === 0 && ((s & 36864) === 36864 && (e3.flags |= 256, e3.strictReservedRange ?? (e3.strictReservedRange = [a, e3.currentLocation])), (s & 537079808) === 537079808 && (e3.flags |= 512)), c = ct2(e3, t, n, i | 1, 0)) : (s === 2162700 ? c = H3(e3, t, n, u, 1, o, 1, i, 0) : s === 69271571 ? c = X3(e3, t, n, u, 1, o, 1, i, 0) : s === 14 ? c = le2(e3, t, n, u, 16, i, 0, 0, o, 1) : e3.report(30, B[s & 255]), f = 1, e3.destructible & 48 && e3.report(50)), e3.getToken() === 1077936155) {
        r(e3, t | 32), f = 1;
        let d3 = I2(e3, t, u, 1, o, e3.tokenStart);
        c = e3.finishNode({ type: "AssignmentPattern", left: c, right: d3 }, a);
      }
      if (l3.push(c), !C(e3, t, 18) || e3.getToken() === 16) break;
    }
    return f && (e3.flags |= 128), (f || t & 1) && n?.reportScopeError(), y2(e3, t, 16), l3;
  }
  function Fe2(e3, t, n, u, o, i) {
    let l3 = e3.getToken();
    if (l3 & 67108864) {
      if (l3 === 67108877) {
        r(e3, t | 262144), e3.assignable = 1;
        let f = nt2(e3, t, n);
        return Fe2(e3, t, n, e3.finishNode({ type: "MemberExpression", object: u, computed: false, property: f, optional: false }, i), 0, i);
      } else if (l3 === 69271571) {
        r(e3, t | 32);
        let { tokenStart: f } = e3, c = M2(e3, t, n, o, 1, f);
        return y2(e3, t, 20), e3.assignable = 1, Fe2(e3, t, n, e3.finishNode({ type: "MemberExpression", object: u, computed: true, property: c, optional: false }, i), 0, i);
      } else if (l3 === 67174408 || l3 === 67174409) return e3.assignable = 2, Fe2(e3, t, n, e3.finishNode({ type: "TaggedTemplateExpression", tag: u, quasi: e3.getToken() === 67174408 ? it2(e3, t | 64, n) : ut2(e3, t | 64) }, i), 0, i);
    }
    return u;
  }
  function cu2(e3, t, n, u) {
    let { tokenStart: o } = e3, i = N2(e3, t | 32), { tokenStart: l3 } = e3;
    if (C(e3, t, 67108877)) {
      if (t & 65536 && e3.getToken() === 209029) return e3.assignable = 2, su2(e3, t, i, o);
      e3.report(94);
    }
    e3.assignable = 2, (e3.getToken() & 16842752) === 16842752 && e3.report(65, B[e3.getToken() & 255]);
    let f = J(e3, t, n, 2, 1, 0, u, 1, l3);
    t = (t | 131072) ^ 131072, e3.getToken() === 67108990 && e3.report(168);
    let c = Fe2(e3, t, n, f, u, l3);
    return e3.assignable = 2, e3.finishNode({ type: "NewExpression", callee: c, arguments: e3.getToken() === 67174411 ? ot2(e3, t, n, u) : [] }, o);
  }
  function su2(e3, t, n, u) {
    let o = N2(e3, t);
    return e3.finishNode({ type: "MetaProperty", meta: n, property: o }, u);
  }
  function Zt2(e3, t, n, u, o) {
    return e3.getToken() === 209006 && e3.report(31), t & 1025 && e3.getToken() === 241771 && e3.report(32), Oe2(e3, t, e3.getToken()), (e3.getToken() & 36864) === 36864 && (e3.flags |= 256), Me2(e3, t & -524289 | 2048, n, e3.tokenValue, N2(e3, t), 0, u, 1, o);
  }
  function ft2(e3, t, n, u, o, i, l3, f, c) {
    r(e3, t | 32);
    let a = e3.createScopeIfLexical()?.createChildScope(512);
    if (t = (t | 131072) ^ 131072, C(e3, t, 16)) return e3.getToken() === 10 ? (f & 1 && e3.report(48), qe2(e3, t, a, n, [], o, 1, c)) : (!(t & 1) && e3.options.webcompat ? e3.assignable = 4 : e3.assignable = 2, e3.finishNode({ type: "CallExpression", callee: u, arguments: [], optional: false }, c));
    let s = 0, d3 = null, h = 0;
    e3.destructible = (e3.destructible | 256 | 128) ^ 384;
    let A = [];
    for (; e3.getToken() !== 16; ) {
      let { tokenStart: b4 } = e3, w4 = e3.getToken();
      if (w4 & 143360) a?.addBlockName(t, e3.tokenValue, i, 0), (w4 & 537079808) === 537079808 ? e3.flags |= 512 : (w4 & 36864) === 36864 && (e3.flags |= 256), d3 = J(e3, t, n, i, 0, 1, 1, 1, b4), e3.getToken() === 16 || e3.getToken() === 18 ? e3.assignable & 2 && (s |= 16, h = 1) : (e3.getToken() === 1077936155 ? h = 1 : s |= 16, d3 = F(e3, t, n, d3, 1, 0, b4), e3.getToken() !== 16 && e3.getToken() !== 18 && (d3 = L2(e3, t, n, 1, 0, b4, d3)));
      else if (w4 & 2097152) d3 = w4 === 2162700 ? H3(e3, t, a, n, 0, 1, 0, i, l3) : X3(e3, t, a, n, 0, 1, 0, i, l3), s |= e3.destructible, h = 1, e3.getToken() !== 16 && e3.getToken() !== 18 && (s & 8 && e3.report(122), d3 = F(e3, t, n, d3, 0, 0, b4), s |= 16, (e3.getToken() & 8388608) === 8388608 && (d3 = x3(e3, t, n, 1, c, 4, w4, d3)), C(e3, t | 32, 22) && (d3 = ee2(e3, t, n, d3, c)));
      else if (w4 === 14) d3 = le2(e3, t, a, n, 16, i, l3, 1, 1, 0), s |= (e3.getToken() === 16 ? 0 : 16) | e3.destructible, h = 1;
      else {
        for (d3 = I2(e3, t, n, 1, 0, b4), s = 0, A.push(d3); C(e3, t | 32, 18); ) A.push(I2(e3, t, n, 1, 0, b4));
        return s |= e3.assignable, y2(e3, t, 16), e3.destructible = s | 16, !(t & 1) && e3.options.webcompat ? e3.assignable = 4 : e3.assignable = 2, e3.finishNode({ type: "CallExpression", callee: u, arguments: A, optional: false }, c);
      }
      if (A.push(d3), !C(e3, t | 32, 18)) break;
    }
    return y2(e3, t, 16), s |= e3.destructible & 256 ? 256 : 0 | e3.destructible & 128 ? 128 : 0, e3.getToken() === 10 ? (s & 48 && e3.report(27), (e3.flags & 1 || f & 1) && e3.report(48), s & 128 && e3.report(31), t & 1025 && s & 256 && e3.report(32), h && (e3.flags |= 128), qe2(e3, t | 2048, a, n, A, o, 1, c)) : (s & 64 && e3.report(63), s & 8 && e3.report(62), !(t & 1) && e3.options.webcompat ? e3.assignable = 4 : e3.assignable = 2, e3.finishNode({ type: "CallExpression", callee: u, arguments: A, optional: false }, c));
  }
  function du2(e3, t) {
    let { tokenRaw: n, tokenRegExp: u, tokenValue: o, tokenStart: i } = e3;
    r(e3, t), e3.assignable = 2;
    let l3 = { type: "Literal", value: o, regex: u };
    return e3.options.raw && (l3.raw = n), e3.finishNode(l3, i);
  }
  function Ye2(e3, t, n, u, o) {
    let i, l3;
    e3.leadingDecorators.decorators.length ? (e3.getToken() === 132 && e3.report(30, "@"), i = e3.leadingDecorators.start, l3 = [...e3.leadingDecorators.decorators], e3.leadingDecorators.decorators.length = 0) : (i = e3.tokenStart, l3 = ve2(e3, t, u)), t = (t | 16384 | 1) ^ 16384, r(e3, t);
    let f = null, c = null, { tokenValue: a } = e3;
    e3.getToken() & 4096 && e3.getToken() !== 20565 ? (vt2(e3, t, e3.getToken()) && e3.report(118), (e3.getToken() & 537079808) === 537079808 && e3.report(119), n && (n.addBlockName(t, a, 32, 0), o && o & 2 && e3.declareUnboundVariable(a)), f = N2(e3, t)) : (o & 1) === 0 && e3.report(39, "Class");
    let s = t;
    C(e3, t | 32, 20565) ? (c = j3(e3, t, u, 0, 0, 0), s |= 512) : s = (s | 512) ^ 512;
    let d3 = Gt2(e3, s, t, n, u, 2, 8, 0);
    return e3.finishNode({ type: "ClassDeclaration", id: f, superClass: c, body: d3, ...e3.options.next ? { decorators: l3 } : null }, i);
  }
  function au2(e3, t, n, u, o) {
    let i = null, l3 = null, f = ve2(e3, t, n);
    t = (t | 1 | 16384) ^ 16384, r(e3, t), e3.getToken() & 4096 && e3.getToken() !== 20565 && (vt2(e3, t, e3.getToken()) && e3.report(118), (e3.getToken() & 537079808) === 537079808 && e3.report(119), i = N2(e3, t));
    let c = t;
    C(e3, t | 32, 20565) ? (l3 = j3(e3, t, n, 0, u, 0), c |= 512) : c = (c | 512) ^ 512;
    let a = Gt2(e3, c, t, void 0, n, 2, 0, u);
    return e3.assignable = 2, e3.finishNode({ type: "ClassExpression", id: i, superClass: l3, body: a, ...e3.options.next ? { decorators: f } : null }, o);
  }
  function ve2(e3, t, n) {
    let u = [];
    if (e3.options.next) for (; e3.getToken() === 132; ) u.push(gu2(e3, t, n));
    return u;
  }
  function gu2(e3, t, n) {
    let u = e3.tokenStart;
    r(e3, t | 32);
    let o = e3.tokenStart, i = J(e3, t, n, 2, 0, 1, 0, 1, u);
    return i = F(e3, t, n, i, 0, 0, o), e3.finishNode({ type: "Decorator", expression: i }, u);
  }
  function Gt2(e3, t, n, u, o, i, l3, f) {
    let { tokenStart: c } = e3, a = e3.createPrivateScopeIfLexical(o);
    y2(e3, t | 32, 2162700);
    let s = 655360;
    t = (t | s) ^ s;
    let d3 = e3.flags & 32;
    e3.flags = (e3.flags | 32) ^ 32;
    let h = [];
    for (; e3.getToken() !== 1074790415; ) {
      let A = e3.tokenStart, b4 = ve2(e3, t, a);
      if (b4.length > 0 && e3.tokenValue === "constructor" && e3.report(109), e3.getToken() === 1074790415 && e3.report(108), C(e3, t, 1074790417)) {
        b4.length > 0 && e3.report(120);
        continue;
      }
      h.push(xt2(e3, t, u, a, n, i, b4, 0, f, b4.length > 0 ? A : e3.tokenStart));
    }
    return y2(e3, l3 & 8 ? t | 32 : t, 1074790415), a?.validatePrivateIdentifierRefs(), e3.flags = e3.flags & -33 | d3, e3.finishNode({ type: "ClassBody", body: h }, c);
  }
  function xt2(e3, t, n, u, o, i, l3, f, c, a) {
    let s = f ? 32 : 0, d3 = null, h = e3.getToken();
    if (h & 176128 || h === -2147483528) switch (d3 = N2(e3, t), h) {
      case 36970:
        if (!f && e3.getToken() !== 67174411 && (e3.getToken() & 1048576) !== 1048576 && e3.getToken() !== 1077936155) return xt2(e3, t, n, u, o, i, l3, 1, c, a);
        break;
      case 209005:
        if (e3.getToken() !== 67174411 && (e3.flags & 1) === 0) {
          if ((e3.getToken() & 1073741824) === 1073741824) return ge2(e3, t, u, d3, s, l3, a);
          s |= 16 | (pe2(e3, t, 8391476) ? 8 : 0);
        }
        break;
      case 209008:
        if (e3.getToken() !== 67174411) {
          if ((e3.getToken() & 1073741824) === 1073741824) return ge2(e3, t, u, d3, s, l3, a);
          s |= 256;
        }
        break;
      case 209009:
        if (e3.getToken() !== 67174411) {
          if ((e3.getToken() & 1073741824) === 1073741824) return ge2(e3, t, u, d3, s, l3, a);
          s |= 512;
        }
        break;
      case 12402:
        if (e3.getToken() !== 67174411 && (e3.flags & 1) === 0) {
          if ((e3.getToken() & 1073741824) === 1073741824) return ge2(e3, t, u, d3, s, l3, a);
          e3.options.next && (s |= 1024);
        }
        break;
    }
    else if (h === 69271571) s |= 2, d3 = ue2(e3, o, u, c);
    else if ((h & 134217728) === 134217728) d3 = O2(e3, t);
    else if (h === 8391476) s |= 8, r(e3, t);
    else if (e3.getToken() === 130) s |= 8192, d3 = Pe2(e3, t | 16, u, 768);
    else if ((e3.getToken() & 1073741824) === 1073741824) s |= 128;
    else {
      if (f && h === 2162700) return vn2(e3, t | 16, n, u, a);
      h === -2147483527 ? (d3 = N2(e3, t), e3.getToken() !== 67174411 && e3.report(30, B[e3.getToken() & 255])) : e3.report(30, B[e3.getToken() & 255]);
    }
    if (s & 1816 && (e3.getToken() & 143360 || e3.getToken() === -2147483528 || e3.getToken() === -2147483527 ? d3 = N2(e3, t) : (e3.getToken() & 134217728) === 134217728 ? d3 = O2(e3, t) : e3.getToken() === 69271571 ? (s |= 2, d3 = ue2(e3, t, u, 0)) : e3.getToken() === 130 ? (s |= 8192, d3 = Pe2(e3, t, u, s)) : e3.report(135)), (s & 2) === 0 && (e3.tokenValue === "constructor" ? ((e3.getToken() & 1073741824) === 1073741824 ? e3.report(129) : (s & 32) === 0 && e3.getToken() === 67174411 && (s & 920 ? e3.report(53, "accessor") : (t & 512) === 0 && (e3.flags & 32 ? e3.report(54) : e3.flags |= 32)), s |= 64) : (s & 8192) === 0 && s & 32 && e3.tokenValue === "prototype" && e3.report(52)), s & 1024 || e3.getToken() !== 67174411 && (s & 768) === 0) return ge2(e3, t, u, d3, s, l3, a);
    let A = W3(e3, t | 16, u, s, c, e3.tokenStart);
    return e3.finishNode({ type: "MethodDefinition", kind: (s & 32) === 0 && s & 64 ? "constructor" : s & 256 ? "get" : s & 512 ? "set" : "method", static: (s & 32) > 0, computed: (s & 2) > 0, key: d3, value: A, ...e3.options.next ? { decorators: l3 } : null }, a);
  }
  function Pe2(e3, t, n, u) {
    let { tokenStart: o } = e3;
    r(e3, t);
    let { tokenValue: i } = e3;
    return i === "constructor" && e3.report(128), e3.options.lexical && (n || e3.report(4, i), u ? n.addPrivateIdentifier(i, u) : n.addPrivateIdentifierRef(i)), r(e3, t), e3.finishNode({ type: "PrivateIdentifier", name: i }, o);
  }
  function ge2(e3, t, n, u, o, i, l3) {
    let f = null;
    if (o & 8 && e3.report(0), e3.getToken() === 1077936155) {
      r(e3, t | 32);
      let { tokenStart: c } = e3;
      e3.getToken() === 537079927 && e3.report(119);
      let a = 11264 | ((o & 64) === 0 ? 16896 : 0);
      t = (t | a) ^ a | (o & 8 ? 1024 : 0) | (o & 16 ? 2048 : 0) | (o & 64 ? 16384 : 0) | 256 | 65536, f = J(e3, t | 16, n, 2, 0, 1, 0, 1, c), ((e3.getToken() & 1073741824) !== 1073741824 || (e3.getToken() & 4194304) === 4194304) && (f = F(e3, t | 16, n, f, 0, 0, c), f = L2(e3, t | 16, n, 0, 0, c, f));
    }
    return U2(e3, t), e3.finishNode({ type: o & 1024 ? "AccessorProperty" : "PropertyDefinition", key: u, value: f, static: (o & 32) > 0, computed: (o & 2) > 0, ...e3.options.next ? { decorators: i } : null }, l3);
  }
  function pt2(e3, t, n, u, o, i) {
    if (e3.getToken() & 143360 || (t & 1) === 0 && e3.getToken() === -2147483527) return ct2(e3, t, n, o, i);
    (e3.getToken() & 2097152) !== 2097152 && e3.report(30, B[e3.getToken() & 255]);
    let l3 = e3.getToken() === 69271571 ? X3(e3, t, n, u, 1, 0, 1, o, i) : H3(e3, t, n, u, 1, 0, 1, o, i);
    return e3.destructible & 16 && e3.report(50), e3.destructible & 32 && e3.report(50), l3;
  }
  function ct2(e3, t, n, u, o) {
    let i = e3.getToken();
    t & 1 && ((i & 537079808) === 537079808 ? e3.report(119) : ((i & 36864) === 36864 || i === -2147483527) && e3.report(118)), (i & 20480) === 20480 && e3.report(102), i === 241771 && (t & 1024 && e3.report(32), t & 2 && e3.report(111)), (i & 255) === 73 && u & 24 && e3.report(100), i === 209006 && (t & 2048 && e3.report(176), t & 2 && e3.report(110));
    let { tokenValue: l3, tokenStart: f } = e3;
    return r(e3, t), n?.addVarOrBlock(t, l3, u, o), e3.finishNode({ type: "Identifier", name: l3 }, f);
  }
  function Ue2(e3, t, n, u, o) {
    if (u || y2(e3, t, 8456256), e3.getToken() === 8390721) {
      let c = mu2(e3, o), [a, s] = yu2(e3, t, n, u);
      return e3.finishNode({ type: "JSXFragment", openingFragment: c, children: a, closingFragment: s }, o);
    }
    e3.getToken() === 8457014 && e3.report(30, B[e3.getToken() & 255]);
    let i = null, l3 = [], f = bu(e3, t, n, u, o);
    if (!f.selfClosing) {
      [l3, i] = ku(e3, t, n, u);
      let c = Le2(i.name);
      Le2(f.name) !== c && e3.report(155, c);
    }
    return e3.finishNode({ type: "JSXElement", children: l3, openingElement: f, closingElement: i }, o);
  }
  function mu2(e3, t) {
    return ke2(e3), e3.finishNode({ type: "JSXOpeningFragment" }, t);
  }
  function ru2(e3, t, n, u) {
    y2(e3, t, 8457014);
    let o = t2(e3, t);
    return e3.getToken() !== 8390721 && e3.report(25, B[65]), n ? ke2(e3) : r(e3, t), e3.finishNode({ type: "JSXClosingElement", name: o }, u);
  }
  function hu2(e3, t, n, u) {
    return y2(e3, t, 8457014), e3.getToken() !== 8390721 && e3.report(25, B[65]), n ? ke2(e3) : r(e3, t), e3.finishNode({ type: "JSXClosingFragment" }, u);
  }
  function ku(e3, t, n, u) {
    let o = [];
    for (; ; ) {
      let i = Au2(e3, t, n, u);
      if (i.type === "JSXClosingElement") return [o, i];
      o.push(i);
    }
  }
  function yu2(e3, t, n, u) {
    let o = [];
    for (; ; ) {
      let i = Tu2(e3, t, n, u);
      if (i.type === "JSXClosingFragment") return [o, i];
      o.push(i);
    }
  }
  function Au2(e3, t, n, u) {
    if (e3.getToken() === 137) return e2(e3, t);
    if (e3.getToken() === 2162700) return st2(e3, t, n, 1, 0);
    if (e3.getToken() === 8456256) {
      let { tokenStart: o } = e3;
      return r(e3, t), e3.getToken() === 8457014 ? ru2(e3, t, u, o) : Ue2(e3, t, n, 1, o);
    }
    e3.report(0);
  }
  function Tu2(e3, t, n, u) {
    if (e3.getToken() === 137) return e2(e3, t);
    if (e3.getToken() === 2162700) return st2(e3, t, n, 1, 0);
    if (e3.getToken() === 8456256) {
      let { tokenStart: o } = e3;
      return r(e3, t), e3.getToken() === 8457014 ? hu2(e3, t, u, o) : Ue2(e3, t, n, 1, o);
    }
    e3.report(0);
  }
  function e2(e3, t) {
    let n = e3.tokenStart;
    r(e3, t);
    let u = { type: "JSXText", value: e3.tokenValue };
    return e3.options.raw && (u.raw = e3.tokenRaw), e3.finishNode(u, n);
  }
  function bu(e3, t, n, u, o) {
    (e3.getToken() & 143360) !== 143360 && (e3.getToken() & 4096) !== 4096 && e3.report(0);
    let i = t2(e3, t), l3 = Cu2(e3, t, n), f = e3.getToken() === 8457014;
    return f && y2(e3, t, 8457014), e3.getToken() !== 8390721 && e3.report(25, B[65]), u || !f ? ke2(e3) : r(e3, t), e3.finishNode({ type: "JSXOpeningElement", name: i, attributes: l3, selfClosing: f }, o);
  }
  function t2(e3, t) {
    let { tokenStart: n } = e3;
    Xe2(e3);
    let u = _e3(e3, t);
    if (e3.getToken() === 21) return n2(e3, t, u, n);
    for (; C(e3, t, 67108877); ) Xe2(e3), u = Du2(e3, t, u, n);
    return u;
  }
  function Du2(e3, t, n, u) {
    let o = _e3(e3, t);
    return e3.finishNode({ type: "JSXMemberExpression", object: n, property: o }, u);
  }
  function Cu2(e3, t, n) {
    let u = [];
    for (; e3.getToken() !== 8457014 && e3.getToken() !== 8390721 && e3.getToken() !== 1048576; ) u.push(wu2(e3, t, n));
    return u;
  }
  function Eu2(e3, t, n) {
    let u = e3.tokenStart;
    r(e3, t), y2(e3, t, 14);
    let o = I2(e3, t, n, 1, 0, e3.tokenStart);
    return y2(e3, t, 1074790415), e3.finishNode({ type: "JSXSpreadAttribute", argument: o }, u);
  }
  function wu2(e3, t, n) {
    let { tokenStart: u } = e3;
    if (e3.getToken() === 2162700) return Eu2(e3, t, n);
    Xe2(e3);
    let o = null, i = _e3(e3, t);
    if (e3.getToken() === 21 && (i = n2(e3, t, i, u)), e3.getToken() === 1077936155) switch (rn2(e3, t)) {
      case 134283267:
        o = O2(e3, t);
        break;
      case 8456256:
        o = Ue2(e3, t, n, 0, e3.tokenStart);
        break;
      case 2162700:
        o = st2(e3, t, n, 0, 1);
        break;
      default:
        e3.report(154);
    }
    return e3.finishNode({ type: "JSXAttribute", value: o, name: i }, u);
  }
  function n2(e3, t, n, u) {
    y2(e3, t, 21);
    let o = _e3(e3, t);
    return e3.finishNode({ type: "JSXNamespacedName", namespace: n, name: o }, u);
  }
  function st2(e3, t, n, u, o) {
    let { tokenStart: i } = e3;
    r(e3, t | 32);
    let { tokenStart: l3 } = e3;
    if (e3.getToken() === 14) return Su2(e3, t, n, i);
    let f = null;
    return e3.getToken() === 1074790415 ? (o && e3.report(157), f = Bu2(e3, { index: e3.startIndex, line: e3.startLine, column: e3.startColumn })) : f = I2(e3, t, n, 1, 0, l3), e3.getToken() !== 1074790415 && e3.report(25, B[15]), u ? ke2(e3) : r(e3, t), e3.finishNode({ type: "JSXExpressionContainer", expression: f }, i);
  }
  function Su2(e3, t, n, u) {
    y2(e3, t, 14);
    let o = I2(e3, t, n, 1, 0, e3.tokenStart);
    return y2(e3, t, 1074790415), e3.finishNode({ type: "JSXSpreadChild", expression: o }, u);
  }
  function Bu2(e3, t) {
    return e3.finishNode({ type: "JSXEmptyExpression" }, t, e3.tokenStart);
  }
  function _e3(e3, t) {
    let n = e3.tokenStart;
    e3.getToken() & 143360 || e3.report(30, B[e3.getToken() & 255]);
    let { tokenValue: u } = e3;
    return r(e3, t), e3.finishNode({ type: "JSXIdentifier", name: u }, n);
  }
  function u2(e3, t) {
    return bn2(e3, t);
  }
  function Fu2(e3, t) {
    let n = new SyntaxError(e3 + " (" + t.loc.start.line + ":" + t.loc.start.column + ")");
    return Object.assign(n, t);
  }
  var i2 = Fu2;
  function o2(e3) {
    let t = [];
    for (let n of e3) try {
      return n();
    } catch (u) {
      t.push(u);
    }
    throw Object.assign(new Error("All combinations failed"), { errors: t });
  }
  var Nu2 = Array.prototype.findLast ?? function(e3) {
    for (let t = this.length - 1; t >= 0; t--) {
      let n = this[t];
      if (e3(n, t, this)) return n;
    }
  };
  var Iu = Z2("findLast", function() {
    if (Array.isArray(this)) return Nu2;
  });
  var l2 = Iu;
  var Je2 = /* @__PURE__ */ Symbol.for("comments");
  function Lu2(e3) {
    return this[e3 < 0 ? this.length + e3 : e3];
  }
  var qu2 = Z2("at", function() {
    if (Array.isArray(this) || typeof this == "string") return Lu2;
  });
  var f2 = qu2;
  function ne2(e3) {
    let t = new Set(e3);
    return (n) => t.has(n?.type);
  }
  function fe2(e3) {
    return e3.range?.[1] ?? e3.end;
  }
  function R2(e3) {
    let t = e3.range?.[0] ?? e3.start, n = (e3.declaration?.decorators ?? e3.decorators)?.[0];
    return n ? Math.min(R2(n), t) : t;
  }
  var Pu2 = 5;
  var Ou2 = 8;
  var Ru2 = 8;
  var c2 = (e3) => (t) => t.label ? V2(t.label) : R2(t) + e3;
  var Vu2 = (e3) => e3.__contentEnd ?? fe2(e3);
  var s2 = ["ExpressionStatement", "Directive", "ImportDeclaration", "ExportDefaultDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration", "ReturnStatement", "ThrowStatement", "DoWhileStatement"];
  var Mu2 = new Map([["BreakStatement", c2(Pu2)], ["ContinueStatement", c2(Ou2)], ["DebuggerStatement", (e3) => R2(e3) + Ru2], ["VariableDeclaration", (e3) => V2(f2(0, e3.declarations, -1))], ...s2.map((e3) => [e3, Vu2])]);
  var dt2 = ne2(s2);
  function V2(e3) {
    let { type: t } = e3;
    return t === "IfStatement" ? V2(e3.alternate ?? e3.consequent) : t === "ForInStatement" || t === "ForOfStatement" || t === "ForStatement" || t === "LabeledStatement" || t === "WithStatement" || t === "WhileStatement" ? V2(e3.body) : Mu2.get(t)?.(e3) ?? fe2(e3);
  }
  var ce2 = ne2(["Block", "CommentBlock", "MultiLine"]);
  var d2 = ne2(["Line", "CommentLine", "SingleLine", "HashbangComment", "HTMLOpen", "HTMLClose", "Hashbang", "InterpreterDirective"]);
  function se2(e3, t, n) {
    if (!e3.has(t)) {
      let u = n(t);
      e3.set(t, u);
    }
    return e3.get(t);
  }
  var vu2 = /* @__PURE__ */ new WeakMap();
  function a2(e3) {
    return se2(vu2, e3, (t) => ce2(t) && t.value[0] === "*" && /@(?:type|satisfies)\b/.test(t.value));
  }
  function Uu2(e3) {
    return $2(0, e3, /[^\n]/g, " ");
  }
  var g2 = Uu2;
  function _u3(e3, t) {
    for (let n of t) {
      let u = R2(n), o = V2(n);
      e3 = e3.slice(0, u) + g2(e3.slice(u, o)) + e3.slice(o);
    }
    return e3;
  }
  var Ju2 = /* @__PURE__ */ new WeakMap();
  function m2(e3) {
    let t = e3[Je2];
    return se2(Ju2, t, (n) => _u3(e3.originalText, n));
  }
  function ju2(e3) {
    if (!ce2(e3)) return [];
    if (!e3.value.includes(`
`)) return [];
    let t = [];
    for (let n of `*${e3.value}*`.split(`
`)) {
      if (n = n.trimStart(), !n.startsWith("*")) return [];
      t.push(n);
    }
    return t;
  }
  var r2 = /* @__PURE__ */ new WeakMap();
  function Xu2(e3) {
    return se2(r2, e3, ju2);
  }
  function h2(e3) {
    r2.delete(e3);
  }
  function at2(e3) {
    return Xu2(e3).length > 0;
  }
  function k2(e3) {
    if (e3.length < 2) return;
    let t;
    for (let n = e3.length - 1; n >= 0; n--) {
      let u = e3[n];
      if (t && V2(u) === R2(t) && at2(u) && at2(t) && (e3.splice(n + 1, 1), u.value += "*//*" + t.value, u.range = [R2(u), V2(t)], h2(u)), !d2(u) && !ce2(u)) throw new TypeError(`Unknown comment type: "${u.type}".`);
      t = u;
    }
  }
  function Hu2(e3) {
    return e3 !== null && typeof e3 == "object";
  }
  var y22 = Hu2;
  var be2 = null;
  function De2(e3) {
    if (be2 !== null && typeof be2.property) {
      let t = be2;
      return be2 = De2.prototype = null, t;
    }
    return be2 = De2.prototype = e3 ?? /* @__PURE__ */ Object.create(null), new De2();
  }
  var Wu2 = 10;
  for (let e3 = 0; e3 <= Wu2; e3++) De2();
  function gt2(e3) {
    return De2(e3);
  }
  function zu2(e3, t = "type") {
    gt2(e3);
    function n(u) {
      let o = u[t], i = e3[o];
      if (!Array.isArray(i)) throw Object.assign(new Error(`Missing visitor keys for '${o}'.`), { node: u });
      return i;
    }
    return n;
  }
  var A2 = zu2;
  var g3 = [["elements"], ["left", "right"], ["value"], ["directives", "body"], ["label"], ["callee", "typeArguments", "arguments"], ["test", "consequent", "alternate"], ["body", "test"], ["expression"], ["left", "right", "body"], ["id", "typeParameters", "params", "predicate", "returnType", "body"], ["object", "property"], ["properties"], ["decorators", "key", "typeParameters", "params", "returnType", "body"], ["decorators", "key", "value"], ["argument"], ["expressions"], ["id", "init"], ["body"], ["decorators", "id", "typeParameters", "superClass", "superTypeArguments", "mixins", "implements", "body"], ["declaration", "specifiers", "source", "attributes"], ["local"], ["exported"], ["decorators", "variance", "key", "typeAnnotation", "value"], ["id"], ["key", "value"], ["elementType"], ["id", "typeParameters"], ["id", "typeParameters", "extends", "body"], ["id", "body"], ["typeAnnotation"], ["id", "typeParameters", "right"], ["name", "typeAnnotation"], ["types"], ["qualification", "id"], ["elementTypes"], ["expression", "typeAnnotation"], ["params"], ["members"], ["objectType", "indexType"], ["decorators", "key", "typeAnnotation", "value"], ["id", "typeParameters", "params", "returnType", "body"], ["key", "typeParameters", "params", "returnType"], ["typeParameters", "params", "returnType"], ["parameterName", "typeAnnotation"], ["checkType", "extendsType", "trueType", "falseType"], ["typeParameter"], ["literal"], ["expression", "typeArguments"], ["decorators", "key", "typeAnnotation"], ["argument", "cases"], ["pattern", "body", "guard"], ["properties", "rest"], ["node"]];
  var T2 = { ArrayExpression: g3[0], AssignmentExpression: g3[1], BinaryExpression: g3[1], InterpreterDirective: [], Directive: g3[2], DirectiveLiteral: [], BlockStatement: g3[3], BreakStatement: g3[4], CallExpression: g3[5], CatchClause: ["param", "body"], ConditionalExpression: g3[6], ContinueStatement: g3[4], DebuggerStatement: [], DoWhileStatement: g3[7], EmptyStatement: [], ExpressionStatement: g3[8], File: ["program"], ForInStatement: g3[9], ForStatement: ["init", "test", "update", "body"], FunctionDeclaration: g3[10], FunctionExpression: g3[10], Identifier: ["typeAnnotation", "decorators"], IfStatement: g3[6], LabeledStatement: ["label", "body"], StringLiteral: [], NumericLiteral: [], NullLiteral: [], BooleanLiteral: [], RegExpLiteral: [], LogicalExpression: g3[1], MemberExpression: g3[11], NewExpression: g3[5], Program: g3[3], ObjectExpression: g3[12], ObjectMethod: g3[13], ObjectProperty: g3[14], RestElement: ["argument", "typeAnnotation", "decorators"], ReturnStatement: g3[15], SequenceExpression: g3[16], ParenthesizedExpression: g3[8], SwitchCase: ["test", "consequent"], SwitchStatement: ["discriminant", "cases"], ThisExpression: [], ThrowStatement: g3[15], TryStatement: ["block", "handler", "finalizer"], UnaryExpression: g3[15], UpdateExpression: g3[15], VariableDeclaration: ["declarations"], VariableDeclarator: g3[17], WhileStatement: g3[7], WithStatement: ["object", "body"], AssignmentPattern: ["left", "right", "decorators", "typeAnnotation"], ArrayPattern: ["elements", "typeAnnotation", "decorators"], ArrowFunctionExpression: ["typeParameters", "params", "predicate", "returnType", "body"], ClassBody: g3[18], ClassExpression: g3[19], ClassDeclaration: g3[19], ExportAllDeclaration: ["source", "attributes", "exported"], ExportDefaultDeclaration: ["declaration"], ExportNamedDeclaration: g3[20], ExportSpecifier: ["local", "exported"], ForOfStatement: g3[9], ImportDeclaration: ["specifiers", "source", "attributes"], ImportDefaultSpecifier: g3[21], ImportNamespaceSpecifier: g3[21], ImportSpecifier: ["imported", "local"], MetaProperty: ["meta", "property"], ClassMethod: g3[13], ObjectPattern: ["decorators", "properties", "typeAnnotation"], SpreadElement: g3[15], Super: [], TaggedTemplateExpression: ["tag", "typeArguments", "quasi"], TemplateElement: [], TemplateLiteral: ["quasis", "expressions"], YieldExpression: g3[15], AwaitExpression: g3[15], ImportExpression: ["source", "options"], BigIntLiteral: [], ExportNamespaceSpecifier: g3[22], OptionalMemberExpression: g3[11], OptionalCallExpression: g3[5], ClassProperty: g3[23], ClassPrivateProperty: g3[23], ClassPrivateMethod: g3[13], PrivateName: g3[24], StaticBlock: g3[18], ImportAttribute: g3[25], AnyTypeAnnotation: [], ArrayTypeAnnotation: g3[26], BooleanTypeAnnotation: [], BooleanLiteralTypeAnnotation: [], NullLiteralTypeAnnotation: [], ClassImplements: g3[27], DeclareClass: ["id", "typeParameters", "extends", "mixins", "implements", "body"], DeclareFunction: ["id", "predicate"], DeclareInterface: g3[28], DeclareModule: g3[29], DeclareModuleExports: g3[30], DeclareTypeAlias: g3[31], DeclareOpaqueType: ["id", "typeParameters", "supertype", "lowerBound", "upperBound"], DeclareVariable: ["id", "declarations"], DeclareExportDeclaration: g3[20], DeclareExportAllDeclaration: ["source", "attributes"], DeclaredPredicate: g3[2], ExistsTypeAnnotation: [], FunctionTypeAnnotation: ["typeParameters", "this", "params", "rest", "returnType"], FunctionTypeParam: g3[32], GenericTypeAnnotation: g3[27], InferredPredicate: [], InterfaceExtends: g3[27], InterfaceDeclaration: g3[28], InterfaceTypeAnnotation: ["extends", "body"], IntersectionTypeAnnotation: g3[33], MixedTypeAnnotation: [], EmptyTypeAnnotation: [], NullableTypeAnnotation: g3[30], NumberLiteralTypeAnnotation: [], BigIntLiteralTypeAnnotation: [], NumberTypeAnnotation: [], ObjectTypeAnnotation: ["properties", "indexers", "callProperties", "internalSlots"], ObjectTypeInternalSlot: ["id", "value"], ObjectTypeCallProperty: g3[2], ObjectTypeIndexer: ["variance", "id", "key", "value"], ObjectTypeProperty: ["key", "value", "variance"], ObjectTypeSpreadProperty: g3[15], OpaqueType: ["id", "typeParameters", "supertype", "impltype", "lowerBound", "upperBound"], QualifiedTypeIdentifier: g3[34], StringLiteralTypeAnnotation: [], StringTypeAnnotation: [], SymbolTypeAnnotation: [], ThisTypeAnnotation: [], TupleTypeAnnotation: g3[35], TypeofTypeAnnotation: ["argument", "typeArguments"], TypeAlias: g3[31], TypeAnnotation: g3[30], TypeCastExpression: g3[36], TypeParameter: ["bound", "default", "variance"], TypeParameterDeclaration: g3[37], TypeParameterInstantiation: g3[37], UnionTypeAnnotation: g3[33], Variance: [], VoidTypeAnnotation: [], EnumDeclaration: g3[29], EnumBooleanBody: g3[38], EnumNumberBody: g3[38], EnumStringBody: g3[38], EnumSymbolBody: g3[38], EnumBooleanMember: g3[17], EnumNumberMember: g3[17], EnumStringMember: g3[17], EnumDefaultedMember: g3[24], IndexedAccessType: g3[39], OptionalIndexedAccessType: g3[39], JSXAttribute: ["name", "value"], JSXClosingElement: ["name"], JSXElement: ["openingElement", "children", "closingElement"], JSXEmptyExpression: [], JSXExpressionContainer: g3[8], JSXSpreadChild: g3[8], JSXIdentifier: [], JSXMemberExpression: g3[11], JSXNamespacedName: ["namespace", "name"], JSXOpeningElement: ["name", "typeArguments", "attributes"], JSXSpreadAttribute: g3[15], JSXText: [], JSXFragment: ["openingFragment", "children", "closingFragment"], JSXOpeningFragment: [], JSXClosingFragment: [], Placeholder: [], V8IntrinsicIdentifier: [], ArgumentPlaceholder: [], BindExpression: ["object", "callee"], ClassAccessorProperty: g3[40], Decorator: g3[8], DoExpression: g3[18], ExportDefaultSpecifier: g3[22], ModuleExpression: g3[18], TopicReference: [], VoidPattern: [], TSParameterProperty: ["parameter", "decorators"], TSDeclareFunction: g3[41], TSDeclareMethod: g3[42], TSQualifiedName: g3[1], TSCallSignatureDeclaration: g3[43], TSConstructSignatureDeclaration: g3[43], TSPropertySignature: ["key", "typeAnnotation"], TSMethodSignature: g3[42], TSIndexSignature: ["parameters", "typeAnnotation"], TSAnyKeyword: [], TSBooleanKeyword: [], TSBigIntKeyword: [], TSIntrinsicKeyword: [], TSNeverKeyword: [], TSNullKeyword: [], TSNumberKeyword: [], TSObjectKeyword: [], TSStringKeyword: [], TSSymbolKeyword: [], TSUndefinedKeyword: [], TSUnknownKeyword: [], TSVoidKeyword: [], TSThisType: [], TSFunctionType: g3[43], TSConstructorType: g3[43], TSTypeReference: ["typeName", "typeArguments"], TSTypePredicate: g3[44], TSTypeQuery: ["exprName", "typeArguments"], TSTypeLiteral: g3[38], TSArrayType: g3[26], TSTupleType: g3[35], TSOptionalType: g3[30], TSRestType: g3[30], TSNamedTupleMember: ["label", "elementType"], TSUnionType: g3[33], TSIntersectionType: g3[33], TSConditionalType: g3[45], TSInferType: g3[46], TSParenthesizedType: g3[30], TSTypeOperator: g3[30], TSIndexedAccessType: g3[39], TSMappedType: ["key", "constraint", "nameType", "typeAnnotation"], TSTemplateLiteralType: ["quasis", "types"], TSLiteralType: g3[47], TSClassImplements: g3[48], TSInterfaceHeritage: g3[48], TSInterfaceDeclaration: g3[28], TSInterfaceBody: g3[18], TSTypeAliasDeclaration: ["id", "typeParameters", "typeAnnotation"], TSInstantiationExpression: g3[48], TSAsExpression: g3[36], TSSatisfiesExpression: g3[36], TSTypeAssertion: g3[36], TSEnumBody: g3[38], TSEnumDeclaration: g3[29], TSEnumMember: ["id", "initializer"], TSModuleDeclaration: g3[29], TSModuleBlock: g3[18], TSImportType: ["source", "options", "qualifier", "typeArguments"], TSImportEqualsDeclaration: ["id", "moduleReference"], TSExternalModuleReference: g3[8], TSNonNullExpression: g3[8], TSExportAssignment: g3[8], TSNamespaceExportDeclaration: g3[24], TSTypeAnnotation: g3[30], TSTypeParameterInstantiation: g3[37], TSTypeParameterDeclaration: g3[37], TSTypeParameter: ["name", "constraint", "default"], ChainExpression: g3[8], Literal: [], MethodDefinition: g3[14], PrivateIdentifier: [], Property: g3[25], PropertyDefinition: g3[23], AccessorProperty: g3[40], TSAbstractAccessorProperty: g3[49], TSAbstractKeyword: [], TSAbstractMethodDefinition: g3[25], TSAbstractPropertyDefinition: g3[49], TSAsyncKeyword: [], TSDeclareKeyword: [], TSEmptyBodyFunctionExpression: ["id", "typeParameters", "params", "returnType"], TSExportKeyword: [], TSPrivateKeyword: [], TSProtectedKeyword: [], TSPublicKeyword: [], TSReadonlyKeyword: [], TSStaticKeyword: [], AsConstExpression: g3[8], AsExpression: g3[36], BigIntTypeAnnotation: [], ComponentDeclaration: ["id", "params", "body", "typeParameters", "rendersType"], ComponentParameter: ["name", "local"], ComponentTypeAnnotation: ["params", "rest", "typeParameters", "rendersType"], ComponentTypeParameter: g3[32], ConditionalTypeAnnotation: g3[45], DeclareComponent: ["id", "params", "rest", "typeParameters", "rendersType"], DeclareEnum: g3[29], DeclareHook: g3[24], DeclareNamespace: g3[29], EnumBigIntBody: g3[38], EnumBigIntMember: g3[17], EnumBody: g3[38], HookDeclaration: g3[41], HookTypeAnnotation: ["params", "returnType", "rest", "typeParameters"], InferTypeAnnotation: g3[46], KeyofTypeAnnotation: g3[15], MatchArrayPattern: ["elements", "rest"], MatchAsPattern: ["pattern", "target"], MatchBindingPattern: g3[24], MatchExpression: g3[50], MatchExpressionCase: g3[51], MatchIdentifierPattern: g3[24], MatchInstanceObjectPattern: g3[52], MatchInstancePattern: ["targetConstructor", "properties"], MatchLiteralPattern: g3[47], MatchMemberPattern: ["base", "property"], MatchObjectPattern: g3[52], MatchObjectPatternProperty: ["key", "pattern"], MatchOrPattern: ["patterns"], MatchRestPattern: g3[15], MatchStatement: g3[50], MatchStatementCase: g3[51], MatchUnaryPattern: g3[15], MatchWildcardPattern: [], NeverTypeAnnotation: [], ObjectTypeMappedTypeProperty: ["keyTparam", "propType", "sourceType", "variance"], QualifiedTypeofIdentifier: g3[34], RecordDeclaration: ["id", "typeParameters", "implements", "body"], RecordDeclarationBody: g3[0], RecordDeclarationImplements: ["id", "typeArguments"], RecordDeclarationProperty: ["key", "typeAnnotation", "defaultValue"], RecordDeclarationStaticProperty: ["key", "typeAnnotation", "value"], RecordExpression: ["recordConstructor", "typeArguments", "properties"], RecordExpressionProperties: g3[12], SatisfiesExpression: g3[36], TupleTypeLabeledElement: ["label", "elementType", "variance"], TupleTypeSpreadElement: ["label", "typeAnnotation"], TypeOperator: g3[30], TypePredicate: g3[44], UndefinedTypeAnnotation: [], UnknownTypeAnnotation: [], NGChainedExpression: g3[16], NGEmptyExpression: [], NGPipeExpression: ["left", "right", "arguments"], NGMicrosyntax: g3[18], NGMicrosyntaxAs: ["key", "alias"], NGMicrosyntaxExpression: ["expression", "alias"], NGMicrosyntaxKey: [], NGMicrosyntaxKeyedExpression: ["key", "expression"], NGMicrosyntaxLet: g3[25], NGRoot: g3[53], JsExpressionRoot: g3[53], JsonRoot: g3[53], TSJSDocAllType: [], TSJSDocUnknownType: [], TSJSDocNullableType: g3[30], TSJSDocNonNullableType: g3[30] };
  var Ku2 = A2(T2);
  var b2 = Ku2;
  function je2(e3, t) {
    if (!y22(e3)) return e3;
    if (Array.isArray(e3)) {
      for (let u = 0; u < e3.length; u++) e3[u] = je2(e3[u], t);
      return e3;
    }
    if (t.onEnter) {
      let u = t.onEnter(e3) ?? e3;
      if (u !== e3) return je2(u, t);
      e3 = u;
    }
    let n = b2(e3);
    for (let u = 0; u < n.length; u++) e3[n[u]] = je2(e3[n[u]], t);
    return t.onLeave && (e3 = t.onLeave(e3) || e3), e3;
  }
  var D2 = je2;
  var Bo2 = ne2(["RegExpLiteral", "BigIntLiteral", "NumericLiteral", "StringLiteral", "DirectiveLiteral", "Literal", "JSXText", "TemplateElement", "StringLiteralTypeAnnotation", "NumberLiteralTypeAnnotation", "BigIntLiteralTypeAnnotation"]);
  function $u2(e3, t) {
    let { text: n, astType: u } = t, { comments: o } = e3;
    k2(o);
    let i = e3.type === "File" ? e3.program : e3;
    i.interpreter && (o.unshift(i.interpreter), delete i.interpreter), e3.hashbang && ((u === "oxc-ts" || u === "yuku-js" || u === "yuku-ts") && o.unshift(e3.hashbang), delete e3.hashbang), e3.type === "Program" && (e3.range = [0, n.length]);
    let l3;
    return e3 = D2(e3, { onEnter(f) {
      switch (Yu2(f, o, n), f.type) {
        case "ParenthesizedExpression": {
          let { expression: c } = f, a = R2(f);
          if (c.type === "TypeCastExpression") return c.range = [a, V2(f)], c;
          let s = false;
          if (u !== "oxc-ts") {
            if (!l3) {
              l3 = [];
              for (let h of o) a2(h) && l3.push(V2(h));
            }
            let d3 = l2(0, l3, (h) => h <= a);
            s = d3 && n.slice(d3, a).trim().length === 0;
          }
          return s ? void 0 : (c.extra = { ...c.extra, parenthesized: true }, c);
        }
        case "TemplateLiteral":
          if (f.expressions.length !== f.quasis.length - 1) throw new Error("Malformed template literal.");
          break;
        case "TemplateElement":
          if (u === "flow" || u === "hermes" || u === "espree" || u === "typescript" || u === "oxc-ts" || u === "yuku-ts") {
            let c = R2(f) + 1, a = V2(f) - (f.tail ? 1 : 2);
            f.range = [c, a];
          }
          break;
        case "TSParenthesizedType":
          return f.typeAnnotation;
        case "TopicReference":
          e3.extra = { ...e3.extra, __isUsingHackPipeline: true };
          break;
        case "TSUnionType":
        case "TSIntersectionType":
          if (f.types.length === 1) return f.types[0];
          break;
        case "TupleTypeAnnotation":
          f.types && !f.elementTypes && (f.elementTypes = f.types);
          break;
        case "ImportDeclaration":
          u === "hermes" && f.assertions && !f.attributes && (f.attributes = f.assertions, delete f.assertions);
          break;
      }
    }, onLeave(f) {
      switch (f.type) {
        case "LogicalExpression":
          if (C2(f)) return mt2(f);
          break;
      }
    } }), e3;
  }
  function C2(e3) {
    return e3.type === "LogicalExpression" && e3.right.type === "LogicalExpression" && e3.operator === e3.right.operator;
  }
  function mt2(e3) {
    return C2(e3) ? mt2({ type: "LogicalExpression", operator: e3.operator, left: mt2({ type: "LogicalExpression", operator: e3.operator, left: e3.left, right: e3.right.left, range: [R2(e3.left), V2(e3.right.left)] }), right: e3.right.right, range: [R2(e3), V2(e3)] }) : e3;
  }
  function Yu2(e3, t, n) {
    if (!dt2(e3)) return;
    let u = fe2(e3);
    if (n[u - 1] !== ";") return;
    let o = m2({ [Je2]: t, originalText: n });
    u -= 1;
    let i = o.slice(R2(e3), u), l3 = i.trimEnd();
    e3.__contentEnd = u - (i.length - l3.length);
  }
  var E2 = $u2;
  var Qu2 = /\*\/$/;
  var Zu2 = /^\/\*\*?/;
  var Gu2 = /^\s*(\/\*\*?(.|\r?\n)*?\*\/)/;
  var xu2 = /(^|\s+)\/\/([^\n\r]*)/g;
  var w2 = /^(\r?\n)+/;
  var pu2 = /(?:^|\r?\n) *(@[^\n\r]*?) *\r?\n *(?![^\n\r@]*\/\/[^]*)([^\s@][^\n\r@]+?) *\r?\n/g;
  var S22 = /(?:^|\r?\n) *@(\S+) *([^\n\r]*)/g;
  var ei2 = /(\r?\n|^) *\* ?/g;
  var ti2 = [];
  function B2(e3) {
    let t = e3.match(Gu2);
    return t ? t[0].trimStart() : "";
  }
  function F2(e3) {
    e3 = $2(0, e3.replace(Zu2, "").replace(Qu2, ""), ei2, "$1");
    let n = "";
    for (; n !== e3; ) n = e3, e3 = $2(0, e3, pu2, `
$1 $2
`);
    e3 = e3.replace(w2, "").trimEnd();
    let u = /* @__PURE__ */ Object.create(null), o = $2(0, e3, S22, "").replace(w2, "").trimEnd(), i;
    for (; i = S22.exec(e3); ) {
      let l3 = $2(0, i[2], xu2, "");
      if (typeof u[i[1]] == "string" || Array.isArray(u[i[1]])) {
        let f = u[i[1]];
        u[i[1]] = [...ti2, ...Array.isArray(f) ? f : [f], l3];
      } else u[i[1]] = l3;
    }
    return { comments: o, pragmas: u };
  }
  var N22 = ["noformat", "noprettier"];
  var I22 = ["format", "prettier"];
  function ni2(e3) {
    if (!e3.startsWith("#!")) return "";
    let t = e3.indexOf(`
`);
    return t === -1 ? e3 : e3.slice(0, t);
  }
  var L22 = ni2;
  function q22(e3) {
    let t = L22(e3);
    t && (e3 = e3.slice(t.length + 1));
    let n = B2(e3), { pragmas: u, comments: o } = F2(n);
    return { shebang: t, text: e3, pragmas: u, comments: o };
  }
  function P2(e3) {
    let { pragmas: t } = q22(e3);
    return I22.some((n) => ae2(t, n));
  }
  function O22(e3) {
    let { pragmas: t } = q22(e3);
    return N22.some((n) => ae2(t, n));
  }
  function ui2(e3) {
    return e3 = typeof e3 == "function" ? { parse: e3 } : e3, { astFormat: "estree", hasPragma: P2, hasIgnorePragma: O22, locStart: R2, locEnd: V2, ...e3 };
  }
  var R22 = ui2;
  var V22 = "module";
  var M22 = "commonjs";
  var v2 = [V22, M22];
  function U22(e3) {
    if (typeof e3 == "string") {
      if (e3 = e3.toLowerCase(), /\.(?:mjs|mts)$/i.test(e3)) return V22;
      if (/\.(?:cjs|cts)$/i.test(e3)) return M22;
    }
  }
  var ii2 = { next: true, ranges: true, webcompat: true, loc: false, raw: true, directives: true, impliedStrict: false, preserveParens: true, lexical: false, jsx: true, validateRegex: false };
  function oi2(e3, t) {
    let n = [], u = u2(e3, { ...ii2, sourceType: t, onComment: n });
    return u.comments = n, u;
  }
  function li2(e3) {
    let { description: t, loc: n } = e3;
    return n ? i2(t, { loc: { start: { line: n.start.line, column: n.start.column + 1 }, end: { line: n.end.line, column: n.end.column + 1 } }, cause: e3 }) : e3;
  }
  function fi2(e3, t) {
    let n = U22(t?.filepath), u = (n ? [n] : v2).map((i) => () => oi2(e3, i)), o;
    try {
      o = o2(u);
    } catch ({ errors: [i] }) {
      throw li2(i);
    }
    return E2(o, { text: e3, astType: "meriyah" });
  }
  var ci2 = R22(fi2);

  // ../package/plugins/estree.mjs
  var estree_exports = {};
  __export(estree_exports, {
    default: () => $p,
    languages: () => my,
    options: () => Kp,
    printers: () => ly
  });
  var tc = Object.defineProperty;
  var Co2 = (e3, t) => {
    for (var r3 in t) tc(e3, r3, { get: t[r3], enumerable: true });
  };
  var $p = {};
  Co2($p, { languages: () => my, options: () => Kp, printers: () => ly });
  var Mi2 = [{ name: "JavaScript", type: "programming", aceMode: "javascript", extensions: [".js", "._js", ".bones", ".cjs", ".es", ".es6", ".gs", ".jake", ".javascript", ".jsb", ".jscad", ".jsfl", ".jslib", ".jsm", ".jspre", ".jss", ".mjs", ".njs", ".pac", ".sjs", ".ssjs", ".xsjs", ".xsjslib", ".start.frag", ".end.frag", ".wxs"], filenames: ["Jakefile", "start.frag", "end.frag"], tmScope: "source.js", aliases: ["js", "node"], codemirrorMode: "javascript", codemirrorMimeType: "text/javascript", interpreters: ["bun", "chakra", "d8", "deno", "gjs", "js", "node", "nodejs", "qjs", "rhino", "v8", "v8-shell", "zx"], parsers: ["babel", "acorn", "espree", "meriyah", "babel-flow", "babel-ts", "flow", "typescript"], vscodeLanguageIds: ["javascript", "mongo"], linguistLanguageId: 183 }, { name: "Flow", type: "programming", aceMode: "javascript", extensions: [".js.flow"], filenames: [], tmScope: "source.js", aliases: [], codemirrorMode: "javascript", codemirrorMimeType: "text/javascript", interpreters: ["bun", "chakra", "d8", "deno", "gjs", "js", "node", "nodejs", "qjs", "rhino", "v8", "v8-shell"], parsers: ["flow", "babel-flow"], vscodeLanguageIds: ["javascript"], linguistLanguageId: 183 }, { name: "JSX", type: "programming", aceMode: "javascript", extensions: [".jsx"], filenames: void 0, tmScope: "source.js.jsx", aliases: void 0, codemirrorMode: "jsx", codemirrorMimeType: "text/jsx", interpreters: void 0, parsers: ["babel", "babel-flow", "babel-ts", "flow", "typescript", "espree", "meriyah"], vscodeLanguageIds: ["javascriptreact"], group: "JavaScript", linguistLanguageId: 183 }, { name: "TypeScript", type: "programming", aceMode: "typescript", extensions: [".ts", ".cts", ".mts"], tmScope: "source.ts", aliases: ["ts"], codemirrorMode: "javascript", codemirrorMimeType: "application/typescript", interpreters: ["bun", "deno", "ts-node", "tsx"], parsers: ["typescript", "babel-ts"], vscodeLanguageIds: ["typescript"], linguistLanguageId: 378 }, { name: "TSX", type: "programming", aceMode: "tsx", extensions: [".tsx"], tmScope: "source.tsx", aliases: ["typescriptreact"], codemirrorMode: "jsx", codemirrorMimeType: "text/typescript-jsx", group: "TypeScript", parsers: ["typescript", "babel-ts"], vscodeLanguageIds: ["typescriptreact"], linguistLanguageId: 94901924 }];
  var Bi2 = {};
  Co2(Bi2, { estree: () => Si2 });
  function rc(e3) {
    return Array.isArray(e3) && e3.length > 0;
  }
  var j4 = rc;
  var nc = () => {
  };
  var Re3 = nc;
  function B3(e3) {
    let t = new Set(e3);
    return (r3) => t.has(r3?.type);
  }
  var $t3 = (e3, t) => (r3, n, ...o) => r3 | 1 && n == null ? void 0 : (t.call(n) ?? n[e3]).apply(n, o);
  function oc(e3) {
    return this[e3 < 0 ? this.length + e3 : e3];
  }
  var ic = $t3("at", function() {
    if (Array.isArray(this) || typeof this == "string") return oc;
  });
  var w3 = ic;
  function Z3(e3, t, r3) {
    if (!e3.has(t)) {
      let n = r3(t);
      e3.set(t, n);
    }
    return e3.get(t);
  }
  function sc(e3) {
    let t = [];
    return e3.this && t.push(e3.this), t.push(...e3.params), e3.rest && t.push(e3.rest), t;
  }
  var uc = /* @__PURE__ */ new WeakMap();
  function ee3(e3) {
    return Z3(uc, e3, sc);
  }
  function _i2(e3, t) {
    let { node: r3 } = e3, n = 0, o = () => t(e3, n++);
    r3.this && e3.call(o, "this"), e3.each(o, "params"), r3.rest && e3.call(o, "rest");
  }
  function Ni2(e3) {
    if (e3.rest) return true;
    let t = ee3(e3);
    return w3(0, t, -1)?.type === "RestElement";
  }
  var ji2 = (e3) => e3?.type === "TSAsExpression" && e3.typeAnnotation.type === "TSTypeReference" && e3.typeAnnotation.typeName.type === "Identifier" && e3.typeAnnotation.typeName.name === "const";
  function Qt3({ node: e3, parent: t }) {
    return e3?.type !== "EmptyStatement" ? false : t.type === "IfStatement" ? t.consequent === e3 || t.alternate === e3 : t.type === "DoWhileStatement" || t.type === "ForInStatement" || t.type === "ForOfStatement" || t.type === "ForStatement" || t.type === "LabeledStatement" || t.type === "WithStatement" || t.type === "WhileStatement" ? t.body === e3 : false;
  }
  function $e2(e3) {
    return e3.method && e3.kind === "init" || e3.kind === "get" || e3.kind === "set";
  }
  var xo2 = (e3) => Number.isSafeInteger(e3) && e3 >= 0;
  function It3(e3) {
    return e3.range?.[1] ?? e3.end;
  }
  function b3(e3) {
    let t = e3.range?.[0] ?? e3.start, r3 = (e3.declaration?.decorators ?? e3.decorators)?.[0];
    return r3 ? Math.min(b3(r3), t) : t;
  }
  var ac = 5;
  var pc = 8;
  var cc = 8;
  var vi2 = (e3) => (t) => t.label ? S3(t.label) : b3(t) + e3;
  var lc = (e3) => e3.__contentEnd ?? It3(e3);
  var Ri2 = ["ExpressionStatement", "Directive", "ImportDeclaration", "ExportDefaultDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration", "ReturnStatement", "ThrowStatement", "DoWhileStatement"];
  var mc = new Map([["BreakStatement", vi2(ac)], ["ContinueStatement", vi2(pc)], ["DebuggerStatement", (e3) => b3(e3) + cc], ["VariableDeclaration", (e3) => S3(w3(0, e3.declarations, -1))], ...Ri2.map((e3) => [e3, lc])]);
  var Wi2 = B3(Ri2);
  var Pr2 = (e3) => {
    if (Wi2(e3) && e3.__contentEnd) return true;
    let { type: t } = e3;
    return t === "BreakStatement" || t === "ContinueStatement" || t === "DebuggerStatement" || t === "VariableDeclaration" ? true : t === "IfStatement" ? Pr2(e3.alternate ?? e3.consequent) : t === "ForInStatement" || t === "ForOfStatement" || t === "ForStatement" || t === "LabeledStatement" || t === "WithStatement" || t === "WhileStatement" ? Pr2(e3.body) : false;
  };
  function S3(e3) {
    let { type: t } = e3;
    return t === "IfStatement" ? S3(e3.alternate ?? e3.consequent) : t === "ForInStatement" || t === "ForOfStatement" || t === "ForStatement" || t === "LabeledStatement" || t === "WithStatement" || t === "WhileStatement" ? S3(e3.body) : mc.get(t)?.(e3) ?? It3(e3);
  }
  function kt3(e3, t) {
    let r3 = b3(e3);
    return xo2(r3) && r3 === b3(t);
  }
  function fc(e3, t) {
    let r3 = S3(e3);
    return xo2(r3) && r3 === S3(t);
  }
  function Ao2(e3, t) {
    return kt3(e3, t) && fc(e3, t);
  }
  function ye3(e3) {
    return e3.extra?.raw ?? e3.raw;
  }
  function Ji(e3) {
    return e3.type === "BigIntLiteral" || e3.type === "Literal" && !!e3.bigint;
  }
  function Gi(e3) {
    return e3.type === "BooleanLiteral" || e3.type === "Literal" && typeof e3.value == "boolean";
  }
  function Ee3(e3) {
    return e3.type === "NumericLiteral" || e3.type === "Literal" && typeof e3.value == "number";
  }
  function Xr2(e3) {
    return e3.type === "RegExpLiteral" || e3.type === "Literal" && !!e3.regex;
  }
  function q3(e3) {
    return e3?.type === "StringLiteral" || e3?.type === "Literal" && typeof e3.value == "string";
  }
  var de2 = B3(["TSAsExpression", "TSSatisfiesExpression", "AsExpression", "AsConstExpression", "SatisfiesExpression"]);
  var Ui2 = B3(["SatisfiesExpression", "TSSatisfiesExpression"]);
  var pe3 = B3(["TSUnionType", "UnionTypeAnnotation"]);
  var At3 = B3(["TSIntersectionType", "IntersectionTypeAnnotation"]);
  var zt3 = B3(["TupleTypeAnnotation", "TSTupleType"]);
  var Qe3 = B3(["TSConditionalType", "ConditionalTypeAnnotation"]);
  var Vr2 = B3(["TSTypeAliasDeclaration", "TypeAlias"]);
  var ut3 = B3(["ReturnStatement", "ThrowStatement"]);
  var qi = B3(["ExportDefaultDeclaration", "DeclareExportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration", "DeclareExportAllDeclaration"]);
  var Y4 = B3(["ArrayExpression"]);
  var ie3 = B3(["ObjectExpression"]);
  var Zt3 = B3(["Literal", "BooleanLiteral", "BigIntLiteral", "DirectiveLiteral", "NullLiteral", "NumericLiteral", "RegExpLiteral", "StringLiteral"]);
  var Ye3 = B3(["ObjectTypeAnnotation", "TSTypeLiteral", "TSMappedType"]);
  var wt3 = B3(["FunctionExpression", "ArrowFunctionExpression"]);
  var H4 = B3(["JSXElement", "JSXFragment"]);
  var be3 = B3(["BinaryExpression", "LogicalExpression", "NGPipeExpression"]);
  var M3 = B3(["CallExpression", "OptionalCallExpression"]);
  var N3 = B3(["MemberExpression", "OptionalMemberExpression"]);
  var Tt3 = B3(["CallExpression", "OptionalCallExpression", "NewExpression"]);
  var Dt3 = B3(["CallExpression", "OptionalCallExpression", "NewExpression", "ImportExpression"]);
  var We3 = B3(["ChainExpression", "TSNonNullExpression"]);
  var Yi2 = B3(["TSArrayType", "ArrayTypeAnnotation"]);
  var Hi = B3(["TSTypeParameterInstantiation", "TypeParameterInstantiation"]);
  function Ir2(e3) {
    if (e3.type !== "ImportSpecifier" && e3.type !== "ExportSpecifier") return false;
    let { local: t, [e3.type === "ImportSpecifier" ? "imported" : "exported"]: r3 } = e3;
    return t.type !== r3.type || !Ao2(t, r3) ? false : q3(t) ? t.value === r3.value && ye3(t) === ye3(r3) : t.type === "Identifier" ? t.name === r3.name : false;
  }
  var Dc = B3(["File", "TemplateElement", "TSEmptyBodyFunctionExpression", "ChainExpression"]);
  var yc = (e3, [t]) => t?.type === "ComponentParameter" && t.shorthand && t.name === e3 && t.local !== t.name || t?.type === "MatchObjectPatternProperty" && t.shorthand && t.key === e3 || t?.type === "ObjectProperty" && t.shorthand && t.key === e3 && t.value !== t.key || t?.type === "Property" && t.shorthand && t.key === e3 && !$e2(t) && t.value !== t.key || t?.type === "ImportSpecifier" && Ir2(t) && t.local === e3 && t.local !== t.imported || t?.type === "ExportSpecifier" && Ir2(t) && t.exported === e3 && t.local !== t.exported;
  var Ec = (e3, [t]) => !!(e3.type === "FunctionExpression" && t.type === "MethodDefinition" && t.value === e3 && ee3(e3).length === 0 && !e3.returnType && !j4(e3.typeParameters) && e3.body);
  var Xi = (e3, [t]) => t?.typeAnnotation === e3 && ji2(t);
  var dc = (e3, [t, ...r3]) => Xi(e3, [t]) || t?.typeName === e3 && Xi(t, r3);
  function Cc(e3, t) {
    return Dc(e3) || yc(e3, t) || Ec(e3, t) ? false : e3.type === "EmptyStatement" ? Qt3({ node: e3, parent: t[0] }) : !(dc(e3, t) || e3.type === "TSTypeAnnotation" && t[0].type === "TSPropertySignature");
  }
  var Vi2 = Cc;
  function Fc(e3) {
    let t = e3.type || e3.kind || "(unknown type)", r3 = String(e3.name || e3.id && (typeof e3.id == "object" ? e3.id.name : e3.id) || e3.key && (typeof e3.key == "object" ? e3.key.name : e3.key) || e3.value && (typeof e3.value == "object" ? "" : String(e3.value)) || e3.operator || "");
    return r3.length > 20 && (r3 = r3.slice(0, 19) + "\u2026"), t + (r3 ? " " + r3 : "");
  }
  function To2(e3, t) {
    (e3.comments ?? (e3.comments = [])).push(t), t.printed = false, t.nodeDescription = Fc(e3);
  }
  function K3(e3, t) {
    t.leading = true, t.trailing = false, To2(e3, t);
  }
  function ge3(e3, t, r3) {
    t.leading = false, t.trailing = false, r3 && (t.marker = r3), To2(e3, t);
  }
  function X4(e3, t) {
    t.leading = false, t.trailing = true, To2(e3, t);
  }
  function Kr2(e3) {
    return (t, r3, n) => {
      if (r3 === false) return false;
      let o = !!n?.backwards, { length: i } = t, s = r3;
      for (; s >= 0 && s < i; ) {
        let u = t.charAt(s);
        if (e3 instanceof RegExp) {
          if (!e3.test(u)) return s;
        } else if (!e3.includes(u)) return s;
        o ? s-- : s++;
      }
      return s === -1 || s === i ? s : false;
    };
  }
  var lE = Kr2(/\s/);
  var at3 = Kr2(" 	");
  var Ki = Kr2(",; 	");
  var $i2 = Kr2(/[^\n\r]/);
  function xc(e3, t) {
    if (t === false) return false;
    if (e3.charAt(t) === "/" && e3.charAt(t + 1) === "*") {
      for (let r3 = t + 2; r3 < e3.length; ++r3) if (e3.charAt(r3) === "*" && e3.charAt(r3 + 1) === "/") return r3 + 2;
    }
    return t;
  }
  var er2 = xc;
  var Qi = (e3) => e3 === `
` || e3 === "\r" || e3 === "\u2028" || e3 === "\u2029";
  function Ac(e3, t, r3) {
    if (t === false) return false;
    let n = !!r3?.backwards, o = e3.charAt(t);
    if (n) {
      if (e3.charAt(t - 1) === "\r" && o === `
`) return t - 2;
      if (Qi(o)) return t - 1;
    } else {
      if (o === "\r" && e3.charAt(t + 1) === `
`) return t + 2;
      if (Qi(o)) return t + 1;
    }
    return t;
  }
  var pt3 = Ac;
  function Tc(e3, t) {
    return t === false ? false : e3.charAt(t) === "/" && e3.charAt(t + 1) === "/" ? $i2(e3, t) : t;
  }
  var tr2 = Tc;
  function gc(e3, t) {
    let r3 = null, n = t;
    for (; n !== r3; ) r3 = n, n = at3(e3, n), n = er2(e3, n), n = tr2(e3, n), n = pt3(e3, n);
    return n;
  }
  var Rt3 = gc;
  function hc(e3, t) {
    let r3 = Rt3(e3, t);
    return r3 === false ? "" : e3.charAt(r3);
  }
  var Je3 = hc;
  function Sc(e3, t, r3 = {}) {
    let n = at3(e3, r3.backwards ? t - 1 : t, r3), o = pt3(e3, n, r3);
    return n !== o;
  }
  var J3 = Sc;
  function Bc(e3, t, r3) {
    for (let n = t; n < r3; ++n) if (e3.charAt(n) === `
`) return true;
    return false;
  }
  var te3 = Bc;
  var bc = /* @__PURE__ */ new WeakMap();
  function Pc(e3) {
    let t;
    return e3.type === "ImportExpression" || e3.type === "TSImportType" ? (t = [e3.source], e3.options && t.push(e3.options)) : e3.type === "TSExternalModuleReference" ? t = [e3.expression] : t = e3.arguments, t;
  }
  function se3(e3) {
    return Z3(bc, e3, Pc);
  }
  function kr2(e3, t) {
    let { node: r3 } = e3;
    r3.type === "ImportExpression" || r3.type === "TSImportType" ? (e3.call(() => t(e3, 0), "source"), r3.options && e3.call(() => t(e3, 1), "options")) : r3.type === "TSExternalModuleReference" ? e3.call(() => t(e3, 0), "expression") : e3.each(t, "arguments");
  }
  function go2(e3, t) {
    if (e3.type === "ImportExpression" || e3.type === "TSImportType") {
      if (t === 0 || t === (e3.options ? -2 : -1)) return ["source"];
      if (e3.options && (t === 1 || t === -1)) return ["options"];
      throw new RangeError("Invalid argument index");
    }
    if (e3.type === "TSExternalModuleReference") {
      if (t === 0 || t === -1) return ["expression"];
    } else if (t < 0 && (t = e3.arguments.length + t), t >= 0 && t < e3.arguments.length) return ["arguments", t];
    throw new RangeError("Invalid argument index");
  }
  var zi = /* @__PURE__ */ Symbol.for("comments");
  var Ic = String.prototype.replaceAll ?? function(e3, t) {
    return e3.global ? this.replace(e3, t) : this.split(e3).join(t);
  };
  var kc = $t3("replaceAll", function() {
    if (typeof this == "string") return Ic;
  });
  var V3 = kc;
  function wc(e3) {
    return V3(0, e3, /[^\n]/g, " ");
  }
  var Zi = wc;
  function Lc(e3, t) {
    for (let r3 of t) {
      let n = b3(r3), o = S3(r3);
      e3 = e3.slice(0, n) + Zi(e3.slice(n, o)) + e3.slice(o);
    }
    return e3;
  }
  var Oc = /* @__PURE__ */ new WeakMap();
  function ce3(e3) {
    let t = e3[zi];
    return Z3(Oc, t, (r3) => Lc(e3.originalText, r3));
  }
  function es(e3, t) {
    let r3 = S3(e3) - 1;
    if (t.originalText[r3] === ")") return r3;
  }
  function Mc(e3, t) {
    if (es(e3, t) === void 0) return;
    let n = ce3(t), o = S3(e3.typeArguments ?? e3.callee), i = n.indexOf("(", o);
    if (i !== -1) return i;
  }
  function ts(e3, t, r3) {
    let n = es(e3, r3);
    if (n === void 0 || S3(t) > n) return false;
    let o = Mc(e3, r3);
    return o === void 0 ? false : b3(t) > o;
  }
  var le3 = B3(["Block", "CommentBlock", "MultiLine"]);
  var Le3 = B3(["Line", "CommentLine", "SingleLine", "HashbangComment", "HTMLOpen", "HTMLClose", "Hashbang", "InterpreterDirective"]);
  function Ge3(e3) {
    return e3?.type === "ObjectProperty" || e3?.type === "Property" && !$e2(e3);
  }
  function yt3(e3) {
    return e3.value.trim() === "prettier-ignore" && !e3.unignore;
  }
  var _c = /* @__PURE__ */ new WeakMap();
  function rr2(e3) {
    return Z3(_c, e3, (t) => le3(t) && t.value[0] === "*" && /@(?:type|satisfies)\b/.test(t.value));
  }
  function $r2({ comment: e3, enclosingNode: t, followingNode: r3, options: n }) {
    if ((t?.type === "ForInStatement" || t?.type === "ForOfStatement" || t?.type === "ForStatement") && r3 && r3 === t.body) {
      let o = ce3(n).lastIndexOf(")", b3(r3));
      if (b3(e3) > o) return K3(r3, e3), true;
    }
    return false;
  }
  var ho2 = (e3, t) => le3(e3) && !te3(t, b3(e3), S3(e3));
  var wr2 = (e3, t) => Le3(e3) || ho2(e3, t);
  function Qr2(e3, t) {
    e3.type === "BlockStatement" ? nr2(e3, t) : K3(e3, t);
  }
  function nr2(e3, t) {
    let r3 = (e3.body || e3.properties).find(({ type: n }) => n !== "EmptyStatement");
    r3 ? K3(r3, t) : ge3(e3, t);
  }
  function zr2({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n, text: o, options: i }) {
    return r3?.type !== "IfStatement" || !n ? false : Je3(o, S3(e3)) === ")" ? (X4(t, e3), true) : n === r3.consequent ? (K3(n, e3), true) : t === r3.consequent && n === r3.alternate ? Nc({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n, text: o, options: i }) : false;
  }
  function Nc({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n, text: o, options: i }) {
    let s = ce3(i).indexOf("else", S3(r3.consequent));
    return b3(e3) >= s ? (K3(n, e3), true) : !(t.type === "BlockStatement") && wr2(e3, o) && !te3(o, S3(t), b3(e3)) ? (X4(t, e3), true) : (ge3(r3, e3), true);
  }
  function Zr2({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n, text: o }) {
    return r3?.type === "SwitchStatement" && r3.cases.length === 0 && !n && t === r3.discriminant && Je3(o, S3(e3)) === "}" ? (ge3(r3, e3), true) : false;
  }
  function en3({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n, text: o }) {
    return (r3?.type === "WhileStatement" || r3?.type === "WithStatement") && n ? Je3(o, S3(e3)) === ")" ? (X4(t, e3), true) : r3.body === n ? (K3(n, e3), true) : false : false;
  }
  function So2(e3, { comment: t, text: r3, options: n }) {
    if (pe3(e3) && ho2(t, r3) && !yt3(t)) {
      let i = ce3(n).slice(S3(t), b3(e3));
      return /^[ \t]*$/.test(i);
    }
    return false;
  }
  function Bo3(e3, t) {
    return K3(So2(e3, t) ? e3.types[0] : e3, t.comment), true;
  }
  function jc(e3) {
    return [bo2, fs, is, ps, Jc, zr2, en3, Zr2, os, ss, $r2, Vc, Kc, Po2, ls, Qc, us, cs, Gc, ol, Io2, ko2, ys].some((t) => t(e3));
  }
  function vc(e3) {
    return [bo2, Wc, ps, is, ls, zr2, en3, Zr2, os, ss, $r2, cs, Xc, $c, Po2, ms, rl, nl, il, Io2, al, Ds, sl, ko2].some((t) => t(e3));
  }
  function Rc(e3) {
    return [bo2, fs, zr2, en3, Zr2, $r2, us, Po2, ms, Io2, Yc, qc, el, Ds, ko2, ys].some((t) => t(e3));
  }
  function Wc({ comment: e3, followingNode: t }) {
    return t && rr2(e3) ? (K3(t, e3), true) : false;
  }
  function os({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n }) {
    return r3?.type !== "TryStatement" && r3?.type !== "CatchClause" || !n ? false : r3.type === "CatchClause" && t ? (X4(t, e3), true) : n.type === "BlockStatement" ? (nr2(n, e3), true) : n.type === "TryStatement" ? (Qr2(n.finalizer, e3), true) : n.type === "CatchClause" ? (Qr2(n.body, e3), true) : false;
  }
  function Jc({ comment: e3, enclosingNode: t, followingNode: r3 }) {
    return N3(t) && r3?.type === "Identifier" ? (K3(t, e3), true) : false;
  }
  function Gc({ comment: e3, enclosingNode: t, followingNode: r3, options: n }) {
    return !n.experimentalTernaries || !(t?.type === "ConditionalExpression" || Qe3(t)) ? false : r3?.type === "ConditionalExpression" || Qe3(r3) ? (ge3(t, e3), true) : false;
  }
  function is({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n, text: o, options: i }) {
    let s = t && !te3(o, S3(t), b3(e3));
    return (!t || !s) && (r3?.type === "ConditionalExpression" || Qe3(r3)) && n ? i.experimentalTernaries && r3.alternate === n && !(le3(e3) && !te3(i.originalText, b3(e3), S3(e3))) ? (ge3(r3, e3), true) : (K3(n, e3), true) : false;
  }
  var Uc = B3(["ClassDeclaration", "ClassExpression", "DeclareClass", "DeclareInterface", "InterfaceDeclaration", "TSInterfaceDeclaration"]);
  function ss({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n }) {
    if (Uc(r3)) {
      let { decorators: o } = r3;
      if (j4(o) && n?.type !== "Decorator") return X4(w3(0, o, -1), e3), true;
      if (r3.body && n === r3.body) return nr2(r3.body, e3), true;
      if (n) {
        let { superClass: i } = r3;
        if (i && n === i && t && (t === r3.id || t === r3.typeParameters)) return X4(t, e3), true;
        for (let s of ["implements", "extends", "mixins"]) if (r3[s] && n === r3[s][0]) return t && (t === r3.id || t === r3.typeParameters || t === i) ? X4(t, e3) : ge3(r3, e3, s), true;
      }
    }
    return false;
  }
  var rs = B3(["ClassMethod", "ClassProperty", "PropertyDefinition", "TSAbstractPropertyDefinition", "TSAbstractMethodDefinition", "TSDeclareMethod", "MethodDefinition", "ClassAccessorProperty", "AccessorProperty", "TSAbstractAccessorProperty", "TSParameterProperty"]);
  function us({ placement: e3, comment: t, precedingNode: r3, enclosingNode: n, followingNode: o, text: i }) {
    return n && r3 && Je3(i, S3(t)) === "(" && (n.type === "Property" || n.type === "TSDeclareMethod" || n.type === "TSAbstractMethodDefinition") && r3.type === "Identifier" && n.key === r3 && Je3(i, S3(r3)) !== ":" ? (X4(r3, t), true) : rs(n) && !o && e3 === "remaining" ? (X4(Je3(i, S3(t)) === "(" ? r3 : n, t), true) : r3?.type === "Decorator" && rs(n) && (Le3(t) || e3 === "ownLine") ? (X4(r3, t), true) : false;
  }
  var as = B3(["FunctionDeclaration", "FunctionExpression", "ClassMethod", "MethodDefinition", "ObjectMethod"]);
  function qc({ comment: e3, precedingNode: t, enclosingNode: r3, text: n }) {
    return Je3(n, S3(e3)) !== "(" ? false : t && as(r3) ? (X4(t, e3), true) : false;
  }
  function Yc({ comment: e3, enclosingNode: t, text: r3 }) {
    if (t?.type !== "ArrowFunctionExpression") return false;
    let n = Rt3(r3, S3(e3));
    return n !== false && r3.slice(n, n + 2) === "=>" ? (ge3(t, e3, "commentBeforeArrow"), true) : false;
  }
  function ns(e3, t, r3) {
    let n = b3(t), o = S3(e3);
    if (n >= o) return false;
    let i = S3(t), s = b3(e3);
    if (i <= s) return false;
    let u = ce3(r3);
    return u.slice(0, b3(t)).trimEnd().endsWith("(") && u.slice(S3(t)).trimStart().startsWith(")");
  }
  var Hc = B3(["ComponentDeclaration", "DeclareComponent", "ComponentTypeAnnotation"]);
  function bo2({ comment: e3, enclosingNode: t, options: r3 }) {
    if (!t) return false;
    if (Dt3(t) && se3(t).length === 0 && ns(t, e3, r3)) return ge3(t, e3), true;
    let n = Es(t) || Hc(t) || t.type === "HookTypeAnnotation" ? t : t.type === "MethodDefinition" || t.type === "TSAbstractMethodDefinition" || t.type === "Property" && $e2(t) ? t.value : void 0;
    return n && ee3(n).length === 0 && ns(n, e3, r3) ? (ge3(n, e3), true) : false;
  }
  function ps({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n, text: o }) {
    return t?.type === "FunctionTypeParam" && r3?.type === "FunctionTypeAnnotation" && n?.type !== "FunctionTypeParam" ? (X4(t, e3), true) : t?.type === "ComponentTypeParameter" && (r3?.type === "DeclareComponent" || r3?.type === "ComponentTypeAnnotation") && n?.type !== "ComponentTypeParameter" ? (X4(t, e3), true) : (t?.type === "Identifier" || t?.type === "AssignmentPattern" || t?.type === "ObjectPattern" || t?.type === "ArrayPattern" || t?.type === "RestElement" || t?.type === "TSParameterProperty") && (Es(r3) || (r3?.type === "TSAbstractMethodDefinition" || r3?.type === "MethodDefinition") && r3.value.type === "TSEmptyBodyFunctionExpression") && Je3(o, S3(e3)) === ")" ? (X4(t, e3), true) : (t?.type === "ComponentParameter" || t?.type === "RestElement") && (r3?.type === "ComponentDeclaration" || r3?.type === "DeclareComponent") && Je3(o, S3(e3)) === ")" ? (X4(t, e3), true) : !le3(e3) && n?.type === "BlockStatement" && as(r3) && (r3.type === "MethodDefinition" ? r3.value.body : r3.body) === n && Rt3(o, S3(e3)) === b3(n) ? (nr2(n, e3), true) : false;
  }
  function cs({ comment: e3, enclosingNode: t }) {
    return t?.type === "LabeledStatement" ? (K3(t, e3), true) : false;
  }
  function Xc({ comment: e3, precedingNode: t, enclosingNode: r3, options: n }) {
    return Tt3(r3) && r3.callee === t && r3.arguments.length > 0 && ts(r3, e3, n) ? (K3(r3.arguments[0], e3), true) : false;
  }
  function Vc({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n }) {
    return pe3(r3) ? (yt3(e3) && (n.prettierIgnore = true, e3.unignore = true), t ? (X4(t, e3), true) : false) : (pe3(n) && yt3(e3) && (n.types[0].prettierIgnore = true, e3.unignore = true), false);
  }
  function Kc({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n }) {
    return r3 && r3.type === "MatchOrPattern" ? (yt3(e3) && (n.prettierIgnore = true, e3.unignore = true), t ? (X4(t, e3), true) : false) : (n && n.type === "MatchOrPattern" && yt3(e3) && (n.types[0].prettierIgnore = true, e3.unignore = true), false);
  }
  function $c({ comment: e3, enclosingNode: t }) {
    return Ge3(t) ? (K3(t, e3), true) : false;
  }
  function Po2({ comment: e3, enclosingNode: t, ast: r3, isLastComment: n }) {
    return r3?.body?.length === 0 ? (n ? ge3(r3, e3) : K3(r3, e3), true) : t?.type === "Program" && t.body.length === 0 && !j4(t.directives) ? (n ? ge3(t, e3) : K3(t, e3), true) : false;
  }
  function ls({ comment: e3, precedingNode: t, enclosingNode: r3, text: n }) {
    if (r3?.type === "ImportSpecifier" || r3?.type === "ExportSpecifier") return K3(r3, e3), true;
    let o = t?.type === "ImportSpecifier" && r3?.type === "ImportDeclaration", i = t?.type === "ExportSpecifier" && r3?.type === "ExportNamedDeclaration";
    return (o || i) && J3(n, S3(e3)) ? (X4(t, e3), true) : false;
  }
  function Qc({ comment: e3, enclosingNode: t }) {
    return t?.type === "AssignmentPattern" ? (K3(t, e3), true) : false;
  }
  var zc = B3(["VariableDeclarator", "AssignmentExpression", "TypeAlias", "TSTypeAliasDeclaration"]);
  var Zc = B3(["ObjectExpression", "ArrayExpression", "TemplateLiteral", "TaggedTemplateExpression", "ObjectTypeAnnotation", "TSTypeLiteral"]);
  function ms(e3) {
    let { comment: t, enclosingNode: r3, followingNode: n, options: o, placement: i } = e3;
    if (zc(r3) && n && i === "endOfLine" && (Zc(n) || le3(t))) return Bo3(n, e3);
    if (Vr2(r3) && n) {
      let s = r3.id, u = ce3(o).indexOf("=", S3(s));
      if (b3(t) >= u) return Bo3(n, e3);
    }
    return false;
  }
  function el({ comment: e3, enclosingNode: t, precedingNode: r3, followingNode: n, text: o }) {
    return !n && (t?.type === "TSMethodSignature" || t?.type === "TSDeclareFunction" || t?.type === "TSAbstractMethodDefinition") && (!r3 || r3 !== t.returnType) && Je3(o, S3(e3)) === ";" ? (X4(t, e3), true) : false;
  }
  function fs({ comment: e3, enclosingNode: t, followingNode: r3 }) {
    if (yt3(e3) && t?.type === "TSMappedType" && r3 === t.key) return t.prettierIgnore = true, e3.unignore = true, true;
  }
  function tl(e3, t, r3) {
    let n = ce3(r3).indexOf("[", b3(e3));
    return S3(t) < n;
  }
  function Io2({ comment: e3, enclosingNode: t, options: r3 }) {
    if (t?.type === "TSMappedType" && tl(t, e3, r3)) return ge3(t, e3), true;
  }
  function rl({ comment: e3, enclosingNode: t, followingNode: r3 }) {
    return !t || t.type !== "SwitchCase" || t.test || !r3 || r3 !== t.consequent[0] ? false : (r3.type === "BlockStatement" && Le3(e3) ? nr2(r3, e3) : ge3(t, e3), true);
  }
  function nl({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n }) {
    return pe3(t) && (Yi2(r3) && !n || At3(r3) || pe3(r3)) ? (X4(w3(0, t.types, -1), e3), true) : false;
  }
  function ol({ comment: e3, enclosingNode: t, precedingNode: r3, followingNode: n }) {
    if ((t?.type === "ObjectPattern" || t?.type === "ArrayPattern") && n?.type === "TSTypeAnnotation") return r3 ? X4(r3, e3) : ge3(t, e3), true;
  }
  function il({ comment: e3, precedingNode: t, enclosingNode: r3, followingNode: n, text: o }) {
    return !n && r3?.type === "UnaryExpression" && (t?.type === "LogicalExpression" || t?.type === "BinaryExpression") && te3(o, b3(r3.argument), b3(t.right)) && wr2(e3, o) && !te3(o, b3(t.right), b3(e3)) ? (X4(t.right, e3), true) : false;
  }
  function sl({ enclosingNode: e3, followingNode: t, comment: r3 }) {
    if (e3 && (e3.type === "TSPropertySignature" || e3.type === "ObjectTypeProperty") && (pe3(t) || At3(t))) return K3(t, r3), true;
  }
  function ko2({ enclosingNode: e3, precedingNode: t, followingNode: r3, comment: n, text: o }) {
    if (de2(e3) && t === e3.expression && !wr2(n, o)) return r3 ? K3(r3, n) : X4(e3, n), true;
  }
  function ul(e3, t, r3) {
    let n = ce3(r3).lastIndexOf("=>", b3(t.body));
    return S3(e3) < n;
  }
  function al({ comment: e3, enclosingNode: t, followingNode: r3, precedingNode: n, options: o }) {
    return t?.type !== "ArrowFunctionExpression" || !r3 || !n || ul(e3, t, o) ? false : (Qr2(r3, e3), true);
  }
  function Ds({ comment: e3, enclosingNode: t, precedingNode: r3, followingNode: n }) {
    if (!n && t && r3) {
      if (t.type === "ExpressionStatement" && t.expression === r3) return X4(t, e3), true;
      let o = r3.type === "SequenceExpression", i = r3.type === "AssignmentExpression";
      if ((o || i) && (t.type === "ArrowFunctionExpression" && t.body === r3 || t.type === "VariableDeclarator" && t.init === r3 || t.type === "ReturnStatement" && t.argument === r3 || t.type === "AssignmentExpression" && t.right === r3)) return X4(o ? w3(0, r3.expressions, -1) : r3.right, e3), true;
    }
    return false;
  }
  function ys(e3) {
    let { followingNode: t, comment: r3 } = e3;
    return So2(t, e3) ? (K3(t.types[0], r3), true) : false;
  }
  var Es = B3(["ArrowFunctionExpression", "FunctionExpression", "FunctionDeclaration", "ObjectMethod", "ClassMethod", "TSDeclareFunction", "TSCallSignatureDeclaration", "TSConstructSignatureDeclaration", "TSMethodSignature", "TSConstructorType", "TSFunctionType", "TSDeclareMethod", "HookDeclaration"]);
  var pl = { endOfLine: vc, ownLine: jc, remaining: Rc };
  var ds = pl;
  function cl(e3, { parser: t }) {
    if (t === "flow" || t === "hermes" || t === "babel-flow") return e3 = V3(0, e3, /[\s(]/g, ""), e3 === "" || e3 === "/*" || e3 === "/*::";
  }
  var Cs = cl;
  var g4 = { Leading: 2, Trailing: 4, Dangling: 8, Block: 16, Line: 32, PrettierIgnore: 64, First: 128, Last: 256 };
  var Fs = (e3, t) => {
    if (typeof e3 == "function" && (t = e3, e3 = 0), e3 || t) return (r3, n, o) => !(e3 & g4.Leading && !r3.leading || e3 & g4.Trailing && !r3.trailing || e3 & g4.Dangling && (r3.leading || r3.trailing) || e3 & g4.Block && !le3(r3) || e3 & g4.Line && !Le3(r3) || e3 & g4.First && n !== 0 || e3 & g4.Last && n !== o.length - 1 || e3 & g4.PrettierIgnore && !yt3(r3) || t && !t(r3));
  };
  function x4(e3, t, r3) {
    if (!j4(e3?.comments)) return false;
    let n = Fs(t, r3);
    return n ? e3.comments.some(n) : true;
  }
  function re3(e3, t, r3) {
    if (!Array.isArray(e3?.comments)) return [];
    let n = Fs(t, r3);
    return n ? e3.comments.filter(n) : e3.comments;
  }
  function Lt3(e3) {
    return e3?.prettierIgnore || x4(e3, g4.PrettierIgnore);
  }
  function tn3(e3) {
    let { node: t } = e3;
    return (t.type === "FunctionExpression" || t.type === "ArrowFunctionExpression") && (e3.key === "callee" && M3(e3.parent) || e3.key === "tag" && e3.parent.type === "TaggedTemplateExpression");
  }
  var ll = new Map([["|>"], ["??"], ["||"], ["&&"], ["|"], ["^"], ["&"], ["==", "===", "!=", "!=="], ["<", ">", "<=", ">=", "in", "instanceof"], [">>", "<<", ">>>"], ["+", "-"], ["*", "/", "%"], ["**"]].flatMap((e3, t) => e3.map((r3) => [r3, t])));
  function or2(e3) {
    return ll.get(e3);
  }
  var xs = { "==": true, "!=": true, "===": true, "!==": true };
  var rn3 = { "*": true, "/": true, "%": true };
  var nn3 = { ">>": true, ">>>": true, "<<": true };
  function Lr2(e3, t) {
    return !(or2(t) !== or2(e3) || e3 === "**" || xs[e3] && xs[t] || t === "%" && rn3[e3] || e3 === "%" && rn3[t] || t !== e3 && rn3[t] && rn3[e3] || nn3[e3] && nn3[t]);
  }
  function As(e3) {
    return !!nn3[e3] || e3 === "|" || e3 === "^" || e3 === "&";
  }
  function Ts(e3) {
    return e3.type === "LogicalExpression" && e3.operator === "??";
  }
  function Ce3(e3, t) {
    switch (e3.type) {
      case "BinaryExpression":
      case "LogicalExpression":
      case "AssignmentExpression":
      case "NGPipeExpression":
        return Ce3(e3.left, t);
      case "MemberExpression":
      case "OptionalMemberExpression":
        return Ce3(e3.object, t);
      case "TaggedTemplateExpression":
        return e3.tag.type === "FunctionExpression" ? false : Ce3(e3.tag, t);
      case "CallExpression":
      case "OptionalCallExpression":
        return e3.callee.type === "FunctionExpression" ? false : Ce3(e3.callee, t);
      case "ConditionalExpression":
        return Ce3(e3.test, t);
      case "UpdateExpression":
        return !e3.prefix && Ce3(e3.argument, t);
      case "BindExpression":
        return e3.object && Ce3(e3.object, t);
      case "SequenceExpression":
        return Ce3(e3.expressions[0], t);
      case "ChainExpression":
      case "TSNonNullExpression":
      case "TSSatisfiesExpression":
      case "TSAsExpression":
      case "AsExpression":
      case "AsConstExpression":
      case "SatisfiesExpression":
        return Ce3(e3.expression, t);
      default:
        return t(e3);
    }
  }
  function ml(e3) {
    let { key: t, parent: r3 } = e3;
    return t === "expression" && r3.type === "TSNonNullExpression" || t === "object" && r3.type === "MemberExpression" && !r3.optional || t === "callee" && r3.type === "CallExpression" && !r3.optional || t === "callee" && r3.type === "NewExpression" || t === "tag" && r3.type === "TaggedTemplateExpression";
  }
  var gs = (e3) => e3.extra?.parenthesized;
  var fl = B3(["OptionalCallExpression", "OptionalMemberExpression"]);
  function Dl(e3) {
    let { node: t } = e3, r3 = t;
    for (; r3.type === "TSNonNullExpression"; ) if (r3 = r3.expression, gs(r3)) return false;
    return fl(r3) ? gs(t) ? true : !(e3.key === "expression" && e3.parent.type === "TSNonNullExpression") : false;
  }
  function hs(e3) {
    return (e3.node.type === "ChainExpression" || Dl(e3)) && ml(e3);
  }
  function Ss(e3) {
    let { node: t } = e3;
    if (t.type !== "Identifier") return false;
    if (t.extra?.parenthesized && /^PRETTIER_HTML_PLACEHOLDER_\d+_\d+_IN_JS$/.test(t.name)) return true;
    let { key: r3, parent: n } = e3;
    if (r3 === "left" && (t.name === "async" && !n.await || t.name === "let") && n.type === "ForOfStatement") return true;
    if (t.name === "let") {
      let o = e3.findAncestor((i) => i.type === "ForOfStatement" || i.type === "ForInStatement")?.left;
      if (o && Ce3(o, (i) => i === t)) return true;
    }
    if (r3 === "object" && t.name === "let" && n.type === "MemberExpression" && n.computed && !n.optional) {
      let o = e3.findAncestor((s) => s.type === "ExpressionStatement" || s.type === "ForStatement" || s.type === "ForInStatement"), i = o ? o.type === "ExpressionStatement" ? o.expression : o.type === "ForStatement" ? o.init : o.left : void 0;
      if (i && Ce3(i, (s) => s === t)) return true;
    }
    if (r3 === "expression") switch (t.name) {
      case "await":
      case "interface":
      case "module":
      case "using":
      case "yield":
      case "let":
      case "component":
      case "hook":
      case "type": {
        let o = e3.findAncestor((i) => !de2(i));
        if (o !== n && o.type === "ExpressionStatement") return true;
      }
    }
    return false;
  }
  function yl(e3) {
    return e3 !== null && typeof e3 == "object";
  }
  var on3 = yl;
  function* El(e3, t) {
    let { getVisitorKeys: r3, filter: n = () => true } = t, o = (i) => on3(i) && n(i);
    for (let i of r3(e3)) {
      let s = e3[i];
      if (Array.isArray(s)) for (let u of s) o(u) && (yield u);
      else o(s) && (yield s);
    }
  }
  function* dl(e3, t) {
    let r3 = [e3];
    for (let n = 0; n < r3.length; n++) {
      let o = r3[n];
      for (let i of El(o, t)) yield i, r3.push(i);
    }
  }
  function Bs(e3, { getVisitorKeys: t, predicate: r3 }) {
    for (let n of dl(e3, { getVisitorKeys: t })) if (r3(n)) return true;
    return false;
  }
  var Or2 = null;
  function Mr2(e3) {
    if (Or2 !== null && typeof Or2.property) {
      let t = Or2;
      return Or2 = Mr2.prototype = null, t;
    }
    return Or2 = Mr2.prototype = e3 ?? /* @__PURE__ */ Object.create(null), new Mr2();
  }
  var Cl = 10;
  for (let e3 = 0; e3 <= Cl; e3++) Mr2();
  function wo2(e3) {
    return Mr2(e3);
  }
  function Fl(e3, t = "type") {
    wo2(e3);
    function r3(n) {
      let o = n[t], i = e3[o];
      if (!Array.isArray(i)) throw Object.assign(new Error(`Missing visitor keys for '${o}'.`), { node: n });
      return i;
    }
    return r3;
  }
  var sn3 = Fl;
  var l = [["elements"], ["left", "right"], ["value"], ["directives", "body"], ["label"], ["callee", "typeArguments", "arguments"], ["test", "consequent", "alternate"], ["body", "test"], ["expression"], ["left", "right", "body"], ["id", "typeParameters", "params", "predicate", "returnType", "body"], ["object", "property"], ["properties"], ["decorators", "key", "typeParameters", "params", "returnType", "body"], ["decorators", "key", "value"], ["argument"], ["expressions"], ["id", "init"], ["body"], ["decorators", "id", "typeParameters", "superClass", "superTypeArguments", "mixins", "implements", "body"], ["declaration", "specifiers", "source", "attributes"], ["local"], ["exported"], ["decorators", "variance", "key", "typeAnnotation", "value"], ["id"], ["key", "value"], ["elementType"], ["id", "typeParameters"], ["id", "typeParameters", "extends", "body"], ["id", "body"], ["typeAnnotation"], ["id", "typeParameters", "right"], ["name", "typeAnnotation"], ["types"], ["qualification", "id"], ["elementTypes"], ["expression", "typeAnnotation"], ["params"], ["members"], ["objectType", "indexType"], ["decorators", "key", "typeAnnotation", "value"], ["id", "typeParameters", "params", "returnType", "body"], ["key", "typeParameters", "params", "returnType"], ["typeParameters", "params", "returnType"], ["parameterName", "typeAnnotation"], ["checkType", "extendsType", "trueType", "falseType"], ["typeParameter"], ["literal"], ["expression", "typeArguments"], ["decorators", "key", "typeAnnotation"], ["argument", "cases"], ["pattern", "body", "guard"], ["properties", "rest"], ["node"]];
  var bs = { ArrayExpression: l[0], AssignmentExpression: l[1], BinaryExpression: l[1], InterpreterDirective: [], Directive: l[2], DirectiveLiteral: [], BlockStatement: l[3], BreakStatement: l[4], CallExpression: l[5], CatchClause: ["param", "body"], ConditionalExpression: l[6], ContinueStatement: l[4], DebuggerStatement: [], DoWhileStatement: l[7], EmptyStatement: [], ExpressionStatement: l[8], File: ["program"], ForInStatement: l[9], ForStatement: ["init", "test", "update", "body"], FunctionDeclaration: l[10], FunctionExpression: l[10], Identifier: ["typeAnnotation", "decorators"], IfStatement: l[6], LabeledStatement: ["label", "body"], StringLiteral: [], NumericLiteral: [], NullLiteral: [], BooleanLiteral: [], RegExpLiteral: [], LogicalExpression: l[1], MemberExpression: l[11], NewExpression: l[5], Program: l[3], ObjectExpression: l[12], ObjectMethod: l[13], ObjectProperty: l[14], RestElement: ["argument", "typeAnnotation", "decorators"], ReturnStatement: l[15], SequenceExpression: l[16], ParenthesizedExpression: l[8], SwitchCase: ["test", "consequent"], SwitchStatement: ["discriminant", "cases"], ThisExpression: [], ThrowStatement: l[15], TryStatement: ["block", "handler", "finalizer"], UnaryExpression: l[15], UpdateExpression: l[15], VariableDeclaration: ["declarations"], VariableDeclarator: l[17], WhileStatement: l[7], WithStatement: ["object", "body"], AssignmentPattern: ["left", "right", "decorators", "typeAnnotation"], ArrayPattern: ["elements", "typeAnnotation", "decorators"], ArrowFunctionExpression: ["typeParameters", "params", "predicate", "returnType", "body"], ClassBody: l[18], ClassExpression: l[19], ClassDeclaration: l[19], ExportAllDeclaration: ["source", "attributes", "exported"], ExportDefaultDeclaration: ["declaration"], ExportNamedDeclaration: l[20], ExportSpecifier: ["local", "exported"], ForOfStatement: l[9], ImportDeclaration: ["specifiers", "source", "attributes"], ImportDefaultSpecifier: l[21], ImportNamespaceSpecifier: l[21], ImportSpecifier: ["imported", "local"], MetaProperty: ["meta", "property"], ClassMethod: l[13], ObjectPattern: ["decorators", "properties", "typeAnnotation"], SpreadElement: l[15], Super: [], TaggedTemplateExpression: ["tag", "typeArguments", "quasi"], TemplateElement: [], TemplateLiteral: ["quasis", "expressions"], YieldExpression: l[15], AwaitExpression: l[15], ImportExpression: ["source", "options"], BigIntLiteral: [], ExportNamespaceSpecifier: l[22], OptionalMemberExpression: l[11], OptionalCallExpression: l[5], ClassProperty: l[23], ClassPrivateProperty: l[23], ClassPrivateMethod: l[13], PrivateName: l[24], StaticBlock: l[18], ImportAttribute: l[25], AnyTypeAnnotation: [], ArrayTypeAnnotation: l[26], BooleanTypeAnnotation: [], BooleanLiteralTypeAnnotation: [], NullLiteralTypeAnnotation: [], ClassImplements: l[27], DeclareClass: ["id", "typeParameters", "extends", "mixins", "implements", "body"], DeclareFunction: ["id", "predicate"], DeclareInterface: l[28], DeclareModule: l[29], DeclareModuleExports: l[30], DeclareTypeAlias: l[31], DeclareOpaqueType: ["id", "typeParameters", "supertype", "lowerBound", "upperBound"], DeclareVariable: ["id", "declarations"], DeclareExportDeclaration: l[20], DeclareExportAllDeclaration: ["source", "attributes"], DeclaredPredicate: l[2], ExistsTypeAnnotation: [], FunctionTypeAnnotation: ["typeParameters", "this", "params", "rest", "returnType"], FunctionTypeParam: l[32], GenericTypeAnnotation: l[27], InferredPredicate: [], InterfaceExtends: l[27], InterfaceDeclaration: l[28], InterfaceTypeAnnotation: ["extends", "body"], IntersectionTypeAnnotation: l[33], MixedTypeAnnotation: [], EmptyTypeAnnotation: [], NullableTypeAnnotation: l[30], NumberLiteralTypeAnnotation: [], BigIntLiteralTypeAnnotation: [], NumberTypeAnnotation: [], ObjectTypeAnnotation: ["properties", "indexers", "callProperties", "internalSlots"], ObjectTypeInternalSlot: ["id", "value"], ObjectTypeCallProperty: l[2], ObjectTypeIndexer: ["variance", "id", "key", "value"], ObjectTypeProperty: ["key", "value", "variance"], ObjectTypeSpreadProperty: l[15], OpaqueType: ["id", "typeParameters", "supertype", "impltype", "lowerBound", "upperBound"], QualifiedTypeIdentifier: l[34], StringLiteralTypeAnnotation: [], StringTypeAnnotation: [], SymbolTypeAnnotation: [], ThisTypeAnnotation: [], TupleTypeAnnotation: l[35], TypeofTypeAnnotation: ["argument", "typeArguments"], TypeAlias: l[31], TypeAnnotation: l[30], TypeCastExpression: l[36], TypeParameter: ["bound", "default", "variance"], TypeParameterDeclaration: l[37], TypeParameterInstantiation: l[37], UnionTypeAnnotation: l[33], Variance: [], VoidTypeAnnotation: [], EnumDeclaration: l[29], EnumBooleanBody: l[38], EnumNumberBody: l[38], EnumStringBody: l[38], EnumSymbolBody: l[38], EnumBooleanMember: l[17], EnumNumberMember: l[17], EnumStringMember: l[17], EnumDefaultedMember: l[24], IndexedAccessType: l[39], OptionalIndexedAccessType: l[39], JSXAttribute: ["name", "value"], JSXClosingElement: ["name"], JSXElement: ["openingElement", "children", "closingElement"], JSXEmptyExpression: [], JSXExpressionContainer: l[8], JSXSpreadChild: l[8], JSXIdentifier: [], JSXMemberExpression: l[11], JSXNamespacedName: ["namespace", "name"], JSXOpeningElement: ["name", "typeArguments", "attributes"], JSXSpreadAttribute: l[15], JSXText: [], JSXFragment: ["openingFragment", "children", "closingFragment"], JSXOpeningFragment: [], JSXClosingFragment: [], Placeholder: [], V8IntrinsicIdentifier: [], ArgumentPlaceholder: [], BindExpression: ["object", "callee"], ClassAccessorProperty: l[40], Decorator: l[8], DoExpression: l[18], ExportDefaultSpecifier: l[22], ModuleExpression: l[18], TopicReference: [], VoidPattern: [], TSParameterProperty: ["parameter", "decorators"], TSDeclareFunction: l[41], TSDeclareMethod: l[42], TSQualifiedName: l[1], TSCallSignatureDeclaration: l[43], TSConstructSignatureDeclaration: l[43], TSPropertySignature: ["key", "typeAnnotation"], TSMethodSignature: l[42], TSIndexSignature: ["parameters", "typeAnnotation"], TSAnyKeyword: [], TSBooleanKeyword: [], TSBigIntKeyword: [], TSIntrinsicKeyword: [], TSNeverKeyword: [], TSNullKeyword: [], TSNumberKeyword: [], TSObjectKeyword: [], TSStringKeyword: [], TSSymbolKeyword: [], TSUndefinedKeyword: [], TSUnknownKeyword: [], TSVoidKeyword: [], TSThisType: [], TSFunctionType: l[43], TSConstructorType: l[43], TSTypeReference: ["typeName", "typeArguments"], TSTypePredicate: l[44], TSTypeQuery: ["exprName", "typeArguments"], TSTypeLiteral: l[38], TSArrayType: l[26], TSTupleType: l[35], TSOptionalType: l[30], TSRestType: l[30], TSNamedTupleMember: ["label", "elementType"], TSUnionType: l[33], TSIntersectionType: l[33], TSConditionalType: l[45], TSInferType: l[46], TSParenthesizedType: l[30], TSTypeOperator: l[30], TSIndexedAccessType: l[39], TSMappedType: ["key", "constraint", "nameType", "typeAnnotation"], TSTemplateLiteralType: ["quasis", "types"], TSLiteralType: l[47], TSClassImplements: l[48], TSInterfaceHeritage: l[48], TSInterfaceDeclaration: l[28], TSInterfaceBody: l[18], TSTypeAliasDeclaration: ["id", "typeParameters", "typeAnnotation"], TSInstantiationExpression: l[48], TSAsExpression: l[36], TSSatisfiesExpression: l[36], TSTypeAssertion: l[36], TSEnumBody: l[38], TSEnumDeclaration: l[29], TSEnumMember: ["id", "initializer"], TSModuleDeclaration: l[29], TSModuleBlock: l[18], TSImportType: ["source", "options", "qualifier", "typeArguments"], TSImportEqualsDeclaration: ["id", "moduleReference"], TSExternalModuleReference: l[8], TSNonNullExpression: l[8], TSExportAssignment: l[8], TSNamespaceExportDeclaration: l[24], TSTypeAnnotation: l[30], TSTypeParameterInstantiation: l[37], TSTypeParameterDeclaration: l[37], TSTypeParameter: ["name", "constraint", "default"], ChainExpression: l[8], Literal: [], MethodDefinition: l[14], PrivateIdentifier: [], Property: l[25], PropertyDefinition: l[23], AccessorProperty: l[40], TSAbstractAccessorProperty: l[49], TSAbstractKeyword: [], TSAbstractMethodDefinition: l[25], TSAbstractPropertyDefinition: l[49], TSAsyncKeyword: [], TSDeclareKeyword: [], TSEmptyBodyFunctionExpression: ["id", "typeParameters", "params", "returnType"], TSExportKeyword: [], TSPrivateKeyword: [], TSProtectedKeyword: [], TSPublicKeyword: [], TSReadonlyKeyword: [], TSStaticKeyword: [], AsConstExpression: l[8], AsExpression: l[36], BigIntTypeAnnotation: [], ComponentDeclaration: ["id", "params", "body", "typeParameters", "rendersType"], ComponentParameter: ["name", "local"], ComponentTypeAnnotation: ["params", "rest", "typeParameters", "rendersType"], ComponentTypeParameter: l[32], ConditionalTypeAnnotation: l[45], DeclareComponent: ["id", "params", "rest", "typeParameters", "rendersType"], DeclareEnum: l[29], DeclareHook: l[24], DeclareNamespace: l[29], EnumBigIntBody: l[38], EnumBigIntMember: l[17], EnumBody: l[38], HookDeclaration: l[41], HookTypeAnnotation: ["params", "returnType", "rest", "typeParameters"], InferTypeAnnotation: l[46], KeyofTypeAnnotation: l[15], MatchArrayPattern: ["elements", "rest"], MatchAsPattern: ["pattern", "target"], MatchBindingPattern: l[24], MatchExpression: l[50], MatchExpressionCase: l[51], MatchIdentifierPattern: l[24], MatchInstanceObjectPattern: l[52], MatchInstancePattern: ["targetConstructor", "properties"], MatchLiteralPattern: l[47], MatchMemberPattern: ["base", "property"], MatchObjectPattern: l[52], MatchObjectPatternProperty: ["key", "pattern"], MatchOrPattern: ["patterns"], MatchRestPattern: l[15], MatchStatement: l[50], MatchStatementCase: l[51], MatchUnaryPattern: l[15], MatchWildcardPattern: [], NeverTypeAnnotation: [], ObjectTypeMappedTypeProperty: ["keyTparam", "propType", "sourceType", "variance"], QualifiedTypeofIdentifier: l[34], RecordDeclaration: ["id", "typeParameters", "implements", "body"], RecordDeclarationBody: l[0], RecordDeclarationImplements: ["id", "typeArguments"], RecordDeclarationProperty: ["key", "typeAnnotation", "defaultValue"], RecordDeclarationStaticProperty: ["key", "typeAnnotation", "value"], RecordExpression: ["recordConstructor", "typeArguments", "properties"], RecordExpressionProperties: l[12], SatisfiesExpression: l[36], TupleTypeLabeledElement: ["label", "elementType", "variance"], TupleTypeSpreadElement: ["label", "typeAnnotation"], TypeOperator: l[30], TypePredicate: l[44], UndefinedTypeAnnotation: [], UnknownTypeAnnotation: [], NGChainedExpression: l[16], NGEmptyExpression: [], NGPipeExpression: ["left", "right", "arguments"], NGMicrosyntax: l[18], NGMicrosyntaxAs: ["key", "alias"], NGMicrosyntaxExpression: ["expression", "alias"], NGMicrosyntaxKey: [], NGMicrosyntaxKeyedExpression: ["key", "expression"], NGMicrosyntaxLet: l[25], NGRoot: l[53], JsExpressionRoot: l[53], JsonRoot: l[53], TSJSDocAllType: [], TSJSDocUnknownType: [], TSJSDocNullableType: l[30], TSJSDocNonNullableType: l[30] };
  var xl = sn3(bs);
  var un3 = xl;
  function _r3(e3, t) {
    return t(e3) || Bs(e3, { getVisitorKeys: un3, predicate: t });
  }
  function ir2(e3) {
    return e3.type === "AssignmentExpression" || e3.type === "BinaryExpression" || e3.type === "LogicalExpression" || e3.type === "NGPipeExpression" || e3.type === "ConditionalExpression" || M3(e3) || N3(e3) || e3.type === "SequenceExpression" || e3.type === "TaggedTemplateExpression" || e3.type === "BindExpression" || e3.type === "UpdateExpression" && !e3.prefix || de2(e3) || We3(e3);
  }
  function Ps(e3) {
    return e3.expressions ? e3.expressions[0] : e3.left ?? e3.test ?? e3.callee ?? e3.object ?? e3.tag ?? e3.argument ?? e3.expression;
  }
  function an3(e3) {
    if (e3.expressions) return ["expressions", 0];
    if (e3.left) return ["left"];
    if (e3.test) return ["test"];
    if (e3.object) return ["object"];
    if (e3.callee) return ["callee"];
    if (e3.tag) return ["tag"];
    if (e3.argument) return ["argument"];
    if (e3.expression) return ["expression"];
    throw new Error("Unexpected node has no left side.");
  }
  function Oe3(e3, t) {
    return H4(t) ? Lt3(t) : x4(t, g4.Leading, (r3) => J3(e3, S3(r3)));
  }
  function Al(e3, t) {
    if (Oe3(t.originalText, e3) || x4(e3, g4.Leading, (r3) => te3(t.originalText, b3(r3), S3(r3))) && !H4(e3)) return true;
    if (ir2(e3)) {
      let r3 = e3, n;
      for (; n = Ps(r3); ) if (r3 = n, Oe3(t.originalText, r3)) return true;
    }
    return false;
  }
  var Tl = /* @__PURE__ */ new WeakMap();
  function pn3(e3, t) {
    return Z3(Tl, e3, (r3) => Al(r3, t));
  }
  function Pe3(e3) {
    for (; We3(e3); ) e3 = e3.expression;
    return e3;
  }
  function Is(e3, t, r3) {
    let { node: n, key: o, parent: i } = e3;
    switch (i.type) {
      case "ReturnStatement":
      case "ThrowStatement":
        if (gl(e3, t)) return false;
        break;
      case "ParenthesizedExpression":
        return false;
      case "ClassDeclaration":
      case "ClassExpression":
        if (o === "superClass") {
          let s = Pe3(n);
          if (s.type === "ArrowFunctionExpression" || s.type === "AssignmentExpression" || s.type === "AwaitExpression" || s.type === "BinaryExpression" || s.type === "ConditionalExpression" || s.type === "LogicalExpression" || s.type === "NewExpression" || s.type === "ObjectExpression" || s.type === "SequenceExpression" || s.type === "TaggedTemplateExpression" || s.type === "UnaryExpression" || s.type === "UpdateExpression" || s.type === "YieldExpression" || s.type === "ClassExpression" && j4(s.decorators)) return true;
        }
        break;
      case "ExportDefaultDeclaration":
        if (ks(e3, t, r3)) return true;
        break;
      case "Decorator":
        if (o === "expression" && !hl(n)) return true;
        break;
      case "TypeAnnotation":
        if (e3.match(void 0, void 0, (s, u) => u === "returnType" && s.type === "ArrowFunctionExpression") && !(n.type === "NullableTypeAnnotation" && e3.call(() => r3(e3, t), "typeAnnotation")) && Sl(n)) return true;
        break;
      case "VariableDeclarator":
        if (o === "init" && e3.match(void 0, void 0, (s, u) => u === "declarations" && s.type === "VariableDeclaration", (s, u) => u === "left" && s.type === "ForInStatement")) return true;
        break;
      case "TSInstantiationExpression":
        if (o === "expression" && (n.type === "AwaitExpression" || n.type === "YieldExpression")) return true;
        break;
    }
  }
  function gl(e3, t) {
    let { key: r3, parent: n } = e3;
    if (!(r3 === "argument" && ut3(n))) return false;
    let { node: o } = e3;
    return !!((o.type === "SequenceExpression" || o.type === "AssignmentExpression") && pn3(o, t));
  }
  function ks(e3, t, r3) {
    let { node: n, parent: o } = e3;
    return n.type === "FunctionExpression" || n.type === "ClassExpression" ? o.type === "ExportDefaultDeclaration" || !r3(e3, t) : !ir2(n) || o.type !== "ExportDefaultDeclaration" && r3(e3, t) ? false : e3.call(() => ks(e3, t, r3), ...an3(n));
  }
  function hl(e3) {
    return e3.type === "ChainExpression" && (e3 = e3.expression), Lo2(e3) || M3(e3) && !e3.optional && Lo2(e3.callee);
  }
  function Lo2(e3) {
    return e3.type === "Identifier" ? true : N3(e3) ? !e3.computed && !e3.optional && e3.property.type === "Identifier" && Lo2(e3.object) : false;
  }
  function Sl(e3) {
    return _r3(e3, (t) => t.type === "ObjectTypeAnnotation" && _r3(t, (r3) => r3.type === "FunctionTypeAnnotation"));
  }
  function ws(e3, t) {
    if (e3.isRoot) return false;
    let { node: r3, key: n, parent: o } = e3;
    if (t.__isInHtmlInterpolation && !t.bracketSpacing && Pl(r3) && Nr2(e3)) return true;
    if (Bl(r3)) return false;
    if (r3.type === "Identifier") return Ss(e3);
    if (r3.type === "ObjectExpression" || r3.type === "FunctionExpression" || r3.type === "ClassExpression" || r3.type === "DoExpression") {
      let s = e3.findAncestor((u) => u.type === "ExpressionStatement")?.expression;
      if (s && Ce3(s, (u) => u === r3)) return true;
    }
    if (r3.type === "ObjectExpression") {
      let s = e3.findAncestor((u) => u.type === "ArrowFunctionExpression")?.body;
      if (s && s.type !== "SequenceExpression" && s.type !== "AssignmentExpression" && Ce3(s, (u) => u === r3)) return true;
    }
    let i = Is(e3, t, ws);
    if (typeof i == "boolean") return i;
    switch (r3.type) {
      case "UpdateExpression":
        if (o.type === "UnaryExpression") return r3.prefix && (r3.operator === "++" && o.operator === "+" || r3.operator === "--" && o.operator === "-");
      case "UnaryExpression":
        switch (o.type) {
          case "UnaryExpression":
            return r3.operator === o.operator && (r3.operator === "+" || r3.operator === "-");
          case "BindExpression":
            return true;
          case "MemberExpression":
          case "OptionalMemberExpression":
            return n === "object";
          case "TaggedTemplateExpression":
            return true;
          case "NewExpression":
          case "CallExpression":
          case "OptionalCallExpression":
            return n === "callee";
          case "BinaryExpression":
            return n === "left" && r3.type === "UnaryExpression" && (o.operator === "in" || o.operator === "instanceof") ? true : n === "left" && o.operator === "**";
          case "TSNonNullExpression":
            return true;
          default:
            return false;
        }
      case "BinaryExpression":
        if (o.type === "UpdateExpression" || r3.operator === "in" && bl(e3)) return true;
        if (r3.operator === "|>" && r3.extra?.parenthesized) {
          let s = e3.grandparent;
          if (s.type === "BinaryExpression" && s.operator === "|>") return true;
        }
      case "TSTypeAssertion":
      case "TSAsExpression":
      case "TSSatisfiesExpression":
      case "AsExpression":
      case "AsConstExpression":
      case "SatisfiesExpression":
      case "LogicalExpression":
        switch (o.type) {
          case "TSAsExpression":
          case "TSSatisfiesExpression":
          case "AsExpression":
          case "AsConstExpression":
          case "SatisfiesExpression":
            return !de2(r3);
          case "ConditionalExpression":
            return de2(r3) || Ts(r3);
          case "CallExpression":
          case "NewExpression":
          case "OptionalCallExpression":
            return n === "callee";
          case "ClassExpression":
          case "ClassDeclaration":
            return n === "superClass";
          case "TSTypeAssertion":
          case "TaggedTemplateExpression":
          case "JSXSpreadAttribute":
          case "SpreadElement":
          case "BindExpression":
          case "AwaitExpression":
          case "TSNonNullExpression":
          case "UpdateExpression":
            return true;
          case "UnaryExpression":
            if (!x4(r3)) return true;
            break;
          case "MemberExpression":
          case "OptionalMemberExpression":
            return n === "object";
          case "AssignmentExpression":
          case "AssignmentPattern":
            return n === "left" && (r3.type === "TSTypeAssertion" || de2(r3));
          case "LogicalExpression":
            if (r3.type === "LogicalExpression") return o.operator !== r3.operator;
          case "BinaryExpression": {
            let { operator: s, type: u } = r3;
            if (!s && u !== "TSTypeAssertion") return true;
            let a = or2(s), c = o.operator, f = or2(c);
            return !!(f > a || n === "right" && f === a || f === a && !Lr2(c, s) || f < a && s === "%" && (c === "+" || c === "-") || As(c));
          }
          default:
            return false;
        }
        break;
      case "SequenceExpression":
        return o.type !== "ForStatement";
      case "YieldExpression":
        if (o.type === "AwaitExpression" || o.type === "TSTypeAssertion") return true;
      case "AwaitExpression":
        switch (o.type) {
          case "TaggedTemplateExpression":
          case "UnaryExpression":
          case "LogicalExpression":
          case "SpreadElement":
          case "TSAsExpression":
          case "TSSatisfiesExpression":
          case "TSNonNullExpression":
          case "AsExpression":
          case "AsConstExpression":
          case "SatisfiesExpression":
          case "BindExpression":
            return true;
          case "MemberExpression":
          case "OptionalMemberExpression":
            return n === "object";
          case "NewExpression":
          case "CallExpression":
          case "OptionalCallExpression":
            return n === "callee";
          case "ConditionalExpression":
            return n === "test";
          case "BinaryExpression":
            return !(!r3.argument && o.operator === "|>");
          default:
            return false;
        }
      case "TSFunctionType":
        if (e3.match((s) => s.type === "TSFunctionType", (s, u) => u === "typeAnnotation" && s.type === "TSTypeAnnotation", (s, u) => u === "returnType" && s.type === "ArrowFunctionExpression")) return true;
      case "TSConditionalType":
      case "TSConstructorType":
      case "ConditionalTypeAnnotation":
        if (n === "extendsType" && Qe3(r3) && o.type === r3.type || n === "constraint" && r3.type === "TSConditionalType" && o.type === "TSTypeParameter" || n === "typeAnnotation" && r3.type === "ConditionalTypeAnnotation" && o.type === "TypeAnnotation" && e3.grandparent.type === "TypeParameter" && e3.grandparent.bound === o && e3.grandparent.usesExtendsBound || n === "checkType" && Qe3(o)) return true;
        if (n === "extendsType" && o.type === "TSConditionalType") {
          let { typeAnnotation: s } = r3.returnType || r3.typeAnnotation;
          if (s.type === "TSTypePredicate" && s.typeAnnotation && (s = s.typeAnnotation.typeAnnotation), s.type === "TSInferType" && s.typeParameter.constraint) return true;
        }
      case "TSUnionType":
      case "TSIntersectionType":
        if (pe3(o) || At3(o)) return true;
      case "TSInferType":
        if (r3.type === "TSInferType") {
          if (o.type === "TSRestType") return false;
          if (n === "types" && (o.type === "TSUnionType" || o.type === "TSIntersectionType") && r3.typeParameter.type === "TSTypeParameter" && r3.typeParameter.constraint) return true;
        }
      case "TSTypeOperator":
        return o.type === "TSArrayType" || o.type === "TSOptionalType" || o.type === "TSRestType" || n === "objectType" && o.type === "TSIndexedAccessType" || o.type === "TSTypeOperator" || o.type === "TSTypeAnnotation" && e3.grandparent.type.startsWith("TSJSDoc");
      case "TSTypeQuery":
        return n === "objectType" && o.type === "TSIndexedAccessType" || n === "elementType" && o.type === "TSArrayType";
      case "TypeOperator":
        return o.type === "ArrayTypeAnnotation" || o.type === "NullableTypeAnnotation" || n === "objectType" && (o.type === "IndexedAccessType" || o.type === "OptionalIndexedAccessType") || o.type === "TypeOperator";
      case "TypeofTypeAnnotation":
      case "KeyofTypeAnnotation":
        return n === "objectType" && (o.type === "IndexedAccessType" || o.type === "OptionalIndexedAccessType") || n === "elementType" && o.type === "ArrayTypeAnnotation";
      case "ArrayTypeAnnotation":
        return o.type === "NullableTypeAnnotation";
      case "IntersectionTypeAnnotation":
      case "UnionTypeAnnotation":
        return o.type === "TypeOperator" || o.type === "KeyofTypeAnnotation" || o.type === "ArrayTypeAnnotation" || o.type === "NullableTypeAnnotation" || o.type === "IntersectionTypeAnnotation" || o.type === "UnionTypeAnnotation" || n === "objectType" && (o.type === "IndexedAccessType" || o.type === "OptionalIndexedAccessType");
      case "InferTypeAnnotation":
      case "NullableTypeAnnotation":
        if (o.type === "ArrayTypeAnnotation" || n === "objectType" && (o.type === "IndexedAccessType" || o.type === "OptionalIndexedAccessType")) return true;
        break;
      case "ComponentTypeAnnotation":
      case "FunctionTypeAnnotation": {
        if (r3.type === "ComponentTypeAnnotation" && (r3.rendersType === null || r3.rendersType === void 0)) return false;
        if (e3.match(void 0, (u, a) => a === "typeAnnotation" && u.type === "TypeAnnotation", (u, a) => a === "returnType" && u.type === "ArrowFunctionExpression") || e3.match(void 0, (u, a) => a === "typeAnnotation" && u.type === "NullableTypeAnnotation", (u, a) => a === "typeAnnotation" && u.type === "TypeAnnotation", (u, a) => a === "returnType" && u.type === "ArrowFunctionExpression") || e3.match(void 0, (u, a) => a === "typeAnnotation" && u.type === "TypePredicate", (u, a) => a === "typeAnnotation" && u.type === "TypeAnnotation", (u, a) => a === "returnType" && u.type === "ArrowFunctionExpression")) return true;
        let s = o.type === "NullableTypeAnnotation" ? e3.grandparent : o;
        return s.type === "UnionTypeAnnotation" || s.type === "IntersectionTypeAnnotation" || s.type === "ArrayTypeAnnotation" || n === "objectType" && (s.type === "IndexedAccessType" || s.type === "OptionalIndexedAccessType") || n === "checkType" && o.type === "ConditionalTypeAnnotation" || n === "extendsType" && o.type === "ConditionalTypeAnnotation" && r3.returnType?.type === "InferTypeAnnotation" && r3.returnType.typeParameter.bound || s.type === "NullableTypeAnnotation" || o.type === "FunctionTypeParam" && o.name === null && ee3(r3).some((u) => u.typeAnnotation?.type === "NullableTypeAnnotation");
      }
      case "OptionalIndexedAccessType":
        return n === "objectType" && o.type === "IndexedAccessType";
      case "StringLiteral":
      case "NumericLiteral":
      case "Literal":
        if (typeof r3.value == "string" && o.type === "ExpressionStatement" && typeof o.directive != "string") {
          let s = e3.grandparent;
          return s.type === "Program" || s.type === "BlockStatement";
        }
        return n === "object" && N3(o) && Ee3(r3);
      case "AssignmentExpression":
        return !((n === "init" || n === "update") && o.type === "ForStatement" || n === "expression" && r3.left.type !== "ObjectPattern" && o.type === "ExpressionStatement" || n === "key" && o.type === "TSPropertySignature" || o.type === "AssignmentExpression" || n === "expressions" && o.type === "SequenceExpression" && e3.match(void 0, void 0, (s, u) => (u === "init" || u === "update") && s.type === "ForStatement") || n === "value" && o.type === "Property" && e3.match(void 0, void 0, (s, u) => u === "properties" && s.type === "ObjectPattern") || o.type === "NGChainedExpression" || n === "node" && o.type === "JsExpressionRoot");
      case "ConditionalExpression":
        switch (o.type) {
          case "TaggedTemplateExpression":
          case "UnaryExpression":
          case "SpreadElement":
          case "BinaryExpression":
          case "LogicalExpression":
          case "NGPipeExpression":
          case "AwaitExpression":
          case "JSXSpreadAttribute":
          case "TSTypeAssertion":
          case "TypeCastExpression":
          case "TSAsExpression":
          case "TSSatisfiesExpression":
          case "AsExpression":
          case "AsConstExpression":
          case "SatisfiesExpression":
          case "TSNonNullExpression":
            return true;
          case "NewExpression":
          case "CallExpression":
          case "OptionalCallExpression":
            return n === "callee";
          case "ConditionalExpression":
            return t.experimentalTernaries ? false : n === "test";
          case "MemberExpression":
          case "OptionalMemberExpression":
            return n === "object";
          default:
            return false;
        }
      case "FunctionExpression":
        switch (o.type) {
          case "NewExpression":
          case "CallExpression":
          case "OptionalCallExpression":
            return n === "callee";
          case "TaggedTemplateExpression":
            return true;
          case "ExportDefaultDeclaration":
            return n === "declaration";
          default:
            return false;
        }
      case "ArrowFunctionExpression":
        switch (o.type) {
          case "BinaryExpression":
            return o.operator !== "|>" || r3.extra?.parenthesized;
          case "NewExpression":
          case "CallExpression":
          case "OptionalCallExpression":
            return n === "callee";
          case "MemberExpression":
          case "OptionalMemberExpression":
            return n === "object";
          case "TSAsExpression":
          case "TSSatisfiesExpression":
          case "AsExpression":
          case "AsConstExpression":
          case "SatisfiesExpression":
          case "TSNonNullExpression":
          case "BindExpression":
          case "TaggedTemplateExpression":
          case "UnaryExpression":
          case "LogicalExpression":
          case "AwaitExpression":
          case "TSTypeAssertion":
          case "MatchExpressionCase":
            return true;
          case "TSInstantiationExpression":
            return n === "expression";
          case "ConditionalExpression":
            return n === "test";
          default:
            return false;
        }
      case "ClassExpression":
        switch (o.type) {
          case "NewExpression":
            return n === "callee";
          case "ExportDefaultDeclaration":
            return n === "declaration";
          default:
            return false;
        }
      case "OptionalMemberExpression":
      case "OptionalCallExpression":
      case "ChainExpression":
      case "TSNonNullExpression":
        if (hs(e3)) return true;
      case "CallExpression":
      case "MemberExpression":
      case "TaggedTemplateExpression":
      case "ImportExpression":
        if (n === "callee" && (o.type === "BindExpression" || o.type === "NewExpression")) {
          let s = r3;
          for (; s; ) switch (s.type) {
            case "CallExpression":
            case "ImportExpression":
              return true;
            case "MemberExpression":
            case "OptionalMemberExpression":
            case "BindExpression":
              s = s.object;
              break;
            case "TaggedTemplateExpression":
              s = s.tag;
              break;
            case "TSNonNullExpression":
              s = s.expression;
              break;
            default:
              return false;
          }
        }
        return false;
      case "BindExpression":
        return n === "callee" && (o.type === "BindExpression" || o.type === "NewExpression") || n === "object" && N3(o);
      case "NGPipeExpression":
        return !(o.type === "NGRoot" || o.type === "NGMicrosyntaxExpression" || o.type === "ObjectProperty" && !r3.extra?.parenthesized || Y4(o) || n === "arguments" && M3(o) || n === "right" && o.type === "NGPipeExpression" || n === "property" && o.type === "MemberExpression" || o.type === "AssignmentExpression");
      case "JSXFragment":
      case "JSXElement":
        return n === "callee" || n === "left" && o.type === "BinaryExpression" && o.operator === "<" || !Y4(o) && o.type !== "ArrowFunctionExpression" && o.type !== "AssignmentExpression" && o.type !== "AssignmentPattern" && o.type !== "BinaryExpression" && o.type !== "ConditionalExpression" && o.type !== "ExpressionStatement" && o.type !== "JsExpressionRoot" && o.type !== "JSXAttribute" && o.type !== "JSXElement" && o.type !== "JSXExpressionContainer" && o.type !== "JSXFragment" && o.type !== "LogicalExpression" && !Tt3(o) && !Ge3(o) && !ut3(o) && o.type !== "TypeCastExpression" && o.type !== "VariableDeclarator" && o.type !== "YieldExpression" && o.type !== "MatchExpressionCase" && !(n === "declaration" && o.type === "ExportDefaultDeclaration");
      case "TSInstantiationExpression":
        return n === "object" && N3(o);
      case "MatchOrPattern":
        return o.type === "MatchAsPattern";
    }
    return false;
  }
  var Bl = B3(["BlockStatement", "BreakStatement", "ComponentDeclaration", "ClassBody", "ClassDeclaration", "ClassMethod", "ClassProperty", "PropertyDefinition", "ClassPrivateProperty", "ContinueStatement", "DebuggerStatement", "DeclareComponent", "DeclareClass", "DeclareExportAllDeclaration", "DeclareExportDeclaration", "DeclareFunction", "DeclareHook", "DeclareInterface", "DeclareModule", "DeclareModuleExports", "DeclareNamespace", "DeclareVariable", "DeclareEnum", "DoWhileStatement", "EnumDeclaration", "ExportAllDeclaration", "ExportDefaultDeclaration", "ExportNamedDeclaration", "ExpressionStatement", "ForInStatement", "ForOfStatement", "ForStatement", "FunctionDeclaration", "HookDeclaration", "IfStatement", "ImportDeclaration", "InterfaceDeclaration", "LabeledStatement", "MethodDefinition", "ReturnStatement", "SwitchStatement", "ThrowStatement", "TryStatement", "TSDeclareFunction", "TSEnumDeclaration", "TSImportEqualsDeclaration", "TSInterfaceDeclaration", "TSModuleDeclaration", "TSNamespaceExportDeclaration", "TypeAlias", "VariableDeclaration", "WhileStatement", "WithStatement"]);
  function bl(e3) {
    let t = 0, { node: r3 } = e3;
    for (; r3; ) {
      let n = e3.getParentNode(t++);
      if (n?.type === "ForStatement" && n.init === r3) return true;
      r3 = n;
    }
    return false;
  }
  function Pl(e3) {
    return ie3(e3);
  }
  function Nr2(e3) {
    let { parent: t, key: r3 } = e3;
    switch (t.type) {
      case "NGPipeExpression":
        if (r3 === "arguments" && e3.isLast) return e3.callParent(Nr2);
        break;
      case "ObjectProperty":
        if (r3 === "value") return e3.callParent(() => e3.key === "properties" && e3.isLast);
        break;
      case "BinaryExpression":
      case "LogicalExpression":
        if (r3 === "right") return e3.callParent(Nr2);
        break;
      case "ConditionalExpression":
        if (r3 === "alternate") return e3.callParent(Nr2);
        break;
      case "UnaryExpression":
        if (t.prefix && e3.callParent(Nr2)) return true;
        break;
    }
    return false;
  }
  var oe3 = ws;
  var ze3 = "string";
  var Me3 = "array";
  var ct3 = "cursor";
  var Ze3 = "indent";
  var et3 = "align";
  var lt3 = "trim";
  var he3 = "group";
  var Ue3 = "fill";
  var _e4 = "if-break";
  var tt3 = "indent-if-break";
  var rt3 = "line-suffix";
  var He3 = "line-suffix-boundary";
  var Fe3 = "line";
  var Ne3 = "label";
  var qe3 = "break-parent";
  var cn3 = /* @__PURE__ */ new Set([ct3, Ze3, et3, lt3, he3, Ue3, _e4, tt3, rt3, He3, Fe3, Ne3, qe3]);
  function Il(e3) {
    if (typeof e3 == "string") return ze3;
    if (Array.isArray(e3)) return Me3;
    if (!e3) return;
    let { type: t } = e3;
    if (cn3.has(t)) return t;
  }
  var Xe3 = Il;
  var kl = (e3) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(e3);
  function wl(e3) {
    let t = e3 === null ? "null" : typeof e3;
    if (t !== "string" && t !== "object") return `Unexpected doc '${t}', 
Expected it to be 'string' or 'object'.`;
    if (Xe3(e3)) throw new Error("doc is valid.");
    let r3 = Object.prototype.toString.call(e3);
    if (r3 !== "[object Object]") return `Unexpected doc '${r3}'.`;
    let n = kl([...cn3].map((o) => `'${o}'`));
    return `Unexpected doc.type '${e3.type}'.
Expected it to be ${n}.`;
  }
  var Oo2 = class extends Error {
    constructor(t) {
      super(wl(t));
      __publicField(this, "name", "InvalidDocError");
      this.doc = t;
    }
  };
  var Ot3 = Oo2;
  var Ls = {};
  function Ll(e3, t, r3, n) {
    let o = [e3];
    for (; o.length > 0; ) {
      let i = o.pop();
      if (i === Ls) {
        r3(o.pop());
        continue;
      }
      r3 && o.push(i, Ls);
      let s = Xe3(i);
      if (!s) throw new Ot3(i);
      if (t?.(i) !== false) switch (s) {
        case Me3:
        case Ue3: {
          let u = s === Me3 ? i : i.parts;
          for (let a = u.length, c = a - 1; c >= 0; --c) o.push(u[c]);
          break;
        }
        case _e4:
          o.push(i.flatContents, i.breakContents);
          break;
        case he3:
          if (n && i.expandedStates) for (let u = i.expandedStates.length, a = u - 1; a >= 0; --a) o.push(i.expandedStates[a]);
          else o.push(i.contents);
          break;
        case et3:
        case Ze3:
        case tt3:
        case Ne3:
        case rt3:
          o.push(i.contents);
          break;
        case ze3:
        case ct3:
        case lt3:
        case He3:
        case Fe3:
        case qe3:
          break;
        default:
          throw new Ot3(i);
      }
    }
  }
  var ln3 = Ll;
  function gt3(e3, t) {
    if (typeof e3 == "string") return t(e3);
    let r3 = /* @__PURE__ */ new Map();
    return n(e3);
    function n(i) {
      return Z3(r3, i, o);
    }
    function o(i) {
      switch (Xe3(i)) {
        case Me3:
          return t(i.map(n));
        case Ue3:
          return t({ ...i, parts: i.parts.map(n) });
        case _e4:
          return t({ ...i, breakContents: n(i.breakContents), flatContents: n(i.flatContents) });
        case he3: {
          let { expandedStates: s, contents: u } = i;
          return s ? (s = s.map(n), u = s[0]) : u = n(u), t({ ...i, contents: u, expandedStates: s });
        }
        case et3:
        case Ze3:
        case tt3:
        case Ne3:
        case rt3:
          return t({ ...i, contents: n(i.contents) });
        case ze3:
        case ct3:
        case lt3:
        case He3:
        case Fe3:
        case qe3:
          return t(i);
        default:
          throw new Ot3(i);
      }
    }
  }
  function Ms(e3, t, r3) {
    let n = r3, o = false;
    function i(s) {
      if (o) return false;
      let u = t(s);
      u !== void 0 && (o = true, n = u);
    }
    return ln3(e3, i), n;
  }
  function Ol(e3) {
    if (e3.type === he3 && e3.break || e3.type === Fe3 && e3.hard || e3.type === qe3) return true;
  }
  function ue3(e3) {
    return Ms(e3, Ol, false);
  }
  function Os(e3) {
    if (e3.length > 0) {
      let t = w3(0, e3, -1);
      !t.expandedStates && !t.break && (t.break = "propagated");
    }
    return null;
  }
  function _s(e3) {
    let t = /* @__PURE__ */ new Set(), r3 = [];
    function n(i) {
      if (i.type === qe3 && Os(r3), i.type === he3) {
        if (r3.push(i), t.has(i)) return false;
        t.add(i);
      }
    }
    function o(i) {
      i.type === he3 && r3.pop().break && Os(r3);
    }
    ln3(e3, n, o, true);
  }
  function Ml(e3) {
    return e3.type === Fe3 && !e3.hard ? e3.soft ? "" : " " : e3.type === _e4 ? e3.flatContents : e3;
  }
  function Wt3(e3) {
    return gt3(e3, Ml);
  }
  function _l(e3) {
    switch (Xe3(e3)) {
      case Ue3: {
        let { parts: t } = e3;
        if (t.every((r3) => r3 === "")) return "";
        if (t.length === 1) return t[0];
        break;
      }
      case he3:
        if (!e3.contents && !e3.id && !e3.break && !e3.expandedStates) return "";
        if (e3.contents.type === he3 && e3.contents.id === e3.id && e3.contents.break === e3.break && e3.contents.expandedStates === e3.expandedStates) return e3.contents;
        break;
      case et3:
      case Ze3:
      case tt3:
      case rt3:
        if (!e3.contents) return "";
        break;
      case _e4:
        if (!e3.flatContents && !e3.breakContents) return "";
        break;
      case Me3: {
        let t = [];
        for (let r3 of e3) {
          if (!r3) continue;
          let [n, ...o] = Array.isArray(r3) ? r3 : [r3];
          typeof n == "string" && typeof w3(0, t, -1) == "string" ? t[t.length - 1] += n : t.push(n), t.push(...o);
        }
        return t.length === 0 ? "" : t.length === 1 ? t[0] : t;
      }
      case ze3:
      case ct3:
      case lt3:
      case He3:
      case Fe3:
      case Ne3:
      case qe3:
        break;
      default:
        throw new Ot3(e3);
    }
    return e3;
  }
  function sr2(e3) {
    return gt3(e3, (t) => _l(t));
  }
  function Ve3(e3, t = ur2) {
    return gt3(e3, (r3) => typeof r3 == "string" ? L3(t, r3.split(`
`)) : r3);
  }
  function Nl(e3) {
    if (e3.type === Fe3) return true;
  }
  function Ns(e3) {
    return Ms(e3, Nl, false);
  }
  function mn3(e3, t) {
    return e3.type === Ne3 ? { ...e3, contents: t(e3.contents) } : t(e3);
  }
  function js(e3) {
    let t = true;
    return ln3(e3, (r3) => {
      switch (Xe3(r3)) {
        case ze3:
          if (r3 === "") break;
        case lt3:
        case He3:
        case Fe3:
        case qe3:
          return t = false, false;
      }
    }), t;
  }
  var Se3 = Re3;
  var fn3 = Re3;
  var vs = Re3;
  var Rs = Re3;
  function m3(e3) {
    return Se3(e3), { type: Ze3, contents: e3 };
  }
  function Be3(e3, t) {
    return Rs(e3), Se3(t), { type: et3, contents: t, n: e3 };
  }
  function Ws(e3) {
    return Be3(Number.NEGATIVE_INFINITY, e3);
  }
  function Js(e3) {
    return Be3({ type: "root" }, e3);
  }
  function Dn3(e3) {
    return Be3(-1, e3);
  }
  function Gs(e3, t, r3) {
    Se3(e3);
    let n = e3;
    if (t > 0) {
      for (let o = 0; o < Math.floor(t / r3); ++o) n = m3(n);
      n = Be3(t % r3, n), n = Be3(Number.NEGATIVE_INFINITY, n);
    }
    return n;
  }
  var je3 = { type: qe3 };
  var jr2 = { type: ct3 };
  function yn3(e3) {
    return vs(e3), { type: Ue3, parts: e3 };
  }
  function p3(e3, t = {}) {
    return Se3(e3), fn3(t.expandedStates, true), { type: he3, id: t.id, contents: e3, break: !!t.shouldBreak, expandedStates: t.expandedStates };
  }
  function mt3(e3, t) {
    return p3(e3[0], { ...t, expandedStates: e3 });
  }
  function O3(e3, t = "", r3 = {}) {
    return Se3(e3), t !== "" && Se3(t), { type: _e4, breakContents: e3, flatContents: t, groupId: r3.groupId };
  }
  function ht3(e3, t) {
    return Se3(e3), { type: tt3, contents: e3, groupId: t.groupId, negate: t.negate };
  }
  function L3(e3, t) {
    Se3(e3), fn3(t);
    let r3 = [];
    for (let n = 0; n < t.length; n++) n !== 0 && r3.push(e3), r3.push(t[n]);
    return r3;
  }
  function Et3(e3, t) {
    return Se3(t), e3 ? { type: Ne3, label: e3, contents: t } : t;
  }
  var T3 = { type: Fe3 };
  var y3 = { type: Fe3, soft: true };
  var Mo2 = { type: Fe3, hard: true };
  var d = [Mo2, je3];
  var jl = { type: Fe3, hard: true, literal: true };
  var ur2 = [jl, je3];
  function _o2(e3) {
    return Se3(e3), { type: rt3, contents: e3 };
  }
  var xe3 = { type: He3 };
  var vl = "cr";
  var Rl = "crlf";
  var Wl = "\r";
  var Jl = `\r
`;
  var Gl = `
`;
  var Ul = Gl;
  function Us(e3) {
    return e3 === vl ? Wl : e3 === Rl ? Jl : Ul;
  }
  var qs = () => /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
  var Ys = 12288;
  var Hs = 65510;
  var Xs = [12288, 12288, 65281, 65376, 65504, 65510];
  var Vs = 4352;
  var Ks = 262141;
  var No2 = [4352, 4447, 8986, 8987, 9001, 9002, 9193, 9196, 9200, 9200, 9203, 9203, 9725, 9726, 9748, 9749, 9776, 9783, 9800, 9811, 9855, 9855, 9866, 9871, 9875, 9875, 9889, 9889, 9898, 9899, 9917, 9918, 9924, 9925, 9934, 9934, 9940, 9940, 9962, 9962, 9970, 9971, 9973, 9973, 9978, 9978, 9981, 9981, 9989, 9989, 9994, 9995, 10024, 10024, 10060, 10060, 10062, 10062, 10067, 10069, 10071, 10071, 10133, 10135, 10160, 10160, 10175, 10175, 11035, 11036, 11088, 11088, 11093, 11093, 11904, 11929, 11931, 12019, 12032, 12245, 12272, 12287, 12289, 12350, 12353, 12438, 12441, 12543, 12549, 12591, 12593, 12686, 12688, 12773, 12783, 12830, 12832, 12871, 12880, 42124, 42128, 42182, 43360, 43388, 44032, 55203, 63744, 64255, 65040, 65049, 65072, 65106, 65108, 65126, 65128, 65131, 94176, 94180, 94192, 94198, 94208, 101589, 101631, 101662, 101760, 101874, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110882, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110951, 110960, 111355, 119552, 119638, 119648, 119670, 126980, 126980, 127183, 127183, 127374, 127374, 127377, 127386, 127488, 127490, 127504, 127547, 127552, 127560, 127568, 127569, 127584, 127589, 127744, 127776, 127789, 127797, 127799, 127868, 127870, 127891, 127904, 127946, 127951, 127955, 127968, 127984, 127988, 127988, 127992, 128062, 128064, 128064, 128066, 128252, 128255, 128317, 128331, 128334, 128336, 128359, 128378, 128378, 128405, 128406, 128420, 128420, 128507, 128591, 128640, 128709, 128716, 128716, 128720, 128722, 128725, 128728, 128732, 128735, 128747, 128748, 128756, 128764, 128992, 129003, 129008, 129008, 129292, 129338, 129340, 129349, 129351, 129535, 129648, 129660, 129664, 129674, 129678, 129734, 129736, 129736, 129741, 129756, 129759, 129770, 129775, 129784, 131072, 196605, 196608, 262141];
  var jo2 = (e3, t) => {
    let r3 = 0, n = Math.floor(e3.length / 2) - 1;
    for (; r3 <= n; ) {
      let o = Math.floor((r3 + n) / 2), i = o * 2;
      if (t < e3[i]) n = o - 1;
      else if (t > e3[i + 1]) r3 = o + 1;
      else return true;
    }
    return false;
  };
  var $s = 19968;
  var [ql, Yl] = Hl(No2);
  function Hl(e3) {
    let t = e3[0], r3 = e3[1];
    for (let n = 0; n < e3.length; n += 2) {
      let o = e3[n], i = e3[n + 1];
      if ($s >= o && $s <= i) return [o, i];
      i - o > r3 - t && (t = o, r3 = i);
    }
    return [t, r3];
  }
  var vo2 = (e3) => e3 < Ys || e3 > Hs ? false : jo2(Xs, e3);
  var Ro2 = (e3) => e3 >= ql && e3 <= Yl ? true : e3 < Vs || e3 > Ks ? false : jo2(No2, e3);
  var Xl = /^(?:[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u2764\u27A1\u2934\u2935\u2B05-\u2B07]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF3\uDFF5\uDFF7]|\uD83D[\uDC3F\uDC41\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])$/;
  var Qs = (e3) => Xl.test(e3);
  var Vl = /[^\x20-\x7F]/;
  function Kl(e3) {
    if (!e3) return 0;
    if (!Vl.test(e3)) return e3.length;
    let t = 0;
    e3 = e3.replace(qs(), (r3) => (t += Qs(r3) ? 1 : 2, ""));
    for (let r3 of e3) {
      let n = r3.codePointAt(0);
      n <= 31 || n >= 127 && n <= 159 || n >= 768 && n <= 879 || n >= 65024 && n <= 65039 || (t += vo2(n) || Ro2(n) ? 2 : 1);
    }
    return t;
  }
  var dt3 = Kl;
  var $l = { type: 0 };
  var Ql = { type: 1 };
  var Wo2 = { value: "", length: 0, queue: [], get root() {
    return Wo2;
  } };
  function zs(e3, t, r3) {
    let n = t.type === 1 ? e3.queue.slice(0, -1) : [...e3.queue, t], o = "", i = 0, s = 0, u = 0;
    for (let D of n) switch (D.type) {
      case 0:
        f(), r3.useTabs ? a(1) : c(r3.tabWidth);
        break;
      case 3: {
        let { string: P3 } = D;
        f(), o += P3, i += P3.length;
        break;
      }
      case 2: {
        let { width: P3 } = D;
        s += 1, u += P3;
        break;
      }
      default:
        throw new Error(`Unexpected indent comment '${D.type}'.`);
    }
    return C3(), { ...e3, value: o, length: i, queue: n };
    function a(D) {
      o += "	".repeat(D), i += r3.tabWidth * D;
    }
    function c(D) {
      o += " ".repeat(D), i += D;
    }
    function f() {
      r3.useTabs ? E() : C3();
    }
    function E() {
      s > 0 && a(s), A();
    }
    function C3() {
      u > 0 && c(u), A();
    }
    function A() {
      s = 0, u = 0;
    }
  }
  function Zs(e3, t, r3) {
    if (!t) return e3;
    if (t.type === "root") return { ...e3, root: e3 };
    if (t === Number.NEGATIVE_INFINITY) return e3.root;
    let n;
    return typeof t == "number" ? t < 0 ? n = Ql : n = { type: 2, width: t } : n = { type: 3, string: t }, zs(e3, n, r3);
  }
  function eu3(e3, t) {
    return zs(e3, $l, t);
  }
  function zl(e3) {
    let t = 0;
    for (let r3 = e3.length - 1; r3 >= 0; r3--) {
      let n = e3[r3];
      if (n === " " || n === "	") t++;
      else break;
    }
    return t;
  }
  function En3(e3) {
    let t = zl(e3);
    return { text: t === 0 ? e3 : e3.slice(0, e3.length - t), count: t };
  }
  var _e5, _t3, _n4, _o3, _r4, _Jo_instances, i_fn, _a3;
  var Jo2 = (_a3 = class {
    constructor() {
      __privateAdd(this, _Jo_instances);
      __privateAdd(this, _e5, []);
      __privateAdd(this, _t3, "");
      __privateAdd(this, _n4, 0);
      __privateAdd(this, _o3, []);
      __privateAdd(this, _r4, []);
    }
    markPosition() {
      if (__privateGet(this, _o3).length + __privateGet(this, _r4).length >= 2) throw new Error("There are too many 'cursor' in doc.");
      __privateGet(this, _r4).push(__privateGet(this, _n4) + __privateGet(this, _t3).length);
    }
    write(t) {
      __privateSet(this, _t3, __privateGet(this, _t3) + t);
    }
    trim() {
      let { text: t, count: r3 } = En3(__privateGet(this, _t3));
      return __privateSet(this, _t3, t), __privateMethod(this, _Jo_instances, i_fn).call(this), r3;
    }
    finish() {
      return __privateMethod(this, _Jo_instances, i_fn).call(this), { text: __privateGet(this, _e5).join(""), positions: __privateGet(this, _o3) };
    }
  }, _e5 = new WeakMap(), _t3 = new WeakMap(), _n4 = new WeakMap(), _o3 = new WeakMap(), _r4 = new WeakMap(), _Jo_instances = new WeakSet(), i_fn = function() {
    let t = __privateGet(this, _t3);
    t !== "" && (__privateGet(this, _e5).push(t), __privateSet(this, _n4, __privateGet(this, _n4) + t.length), __privateSet(this, _t3, ""));
    for (let r3 of __privateGet(this, _r4)) __privateGet(this, _o3).push(Math.min(r3, __privateGet(this, _n4)));
    __privateGet(this, _r4).length = 0;
  }, _a3);
  var tu3 = Jo2;
  var nt3 = /* @__PURE__ */ Symbol("MODE_BREAK");
  var Ct3 = /* @__PURE__ */ Symbol("MODE_FLAT");
  var Go2 = /* @__PURE__ */ Symbol("DOC_FILL_PRINTED_LENGTH");
  function dn3(e3, t, r3, n, o, i) {
    if (r3 === Number.POSITIVE_INFINITY) return true;
    let s = t.length, u = false, a = [e3], c = "";
    for (; r3 >= 0; ) {
      if (a.length === 0) {
        if (s === 0) return true;
        a.push(t[--s]);
        continue;
      }
      let { mode: f, doc: E } = a.pop(), C3 = Xe3(E);
      switch (C3) {
        case ze3:
          E && (u && (c += " ", r3 -= 1, u = false), c += E, r3 -= dt3(E));
          break;
        case Me3:
        case Ue3: {
          let A = C3 === Me3 ? E : E.parts, D = E[Go2] ?? 0;
          for (let P3 = A.length - 1; P3 >= D; P3--) a.push({ mode: f, doc: A[P3] });
          break;
        }
        case Ze3:
        case et3:
        case tt3:
        case Ne3:
          a.push({ mode: f, doc: E.contents });
          break;
        case lt3: {
          let { text: A, count: D } = En3(c);
          c = A, r3 += D;
          break;
        }
        case he3: {
          if (i && E.break) return false;
          let A = E.break ? nt3 : f, D = E.expandedStates && A === nt3 ? w3(0, E.expandedStates, -1) : E.contents;
          a.push({ mode: A, doc: D });
          break;
        }
        case _e4: {
          let D = (E.groupId ? o[E.groupId] || Ct3 : f) === nt3 ? E.breakContents : E.flatContents;
          D && a.push({ mode: f, doc: D });
          break;
        }
        case Fe3:
          if (f === nt3 || E.hard) return true;
          E.soft || (u = true);
          break;
        case rt3:
          n = true;
          break;
        case He3:
          if (n) return false;
          break;
      }
    }
    return false;
  }
  function Uo2(e3, t) {
    let r3 = /* @__PURE__ */ Object.create(null), n = t.printWidth, o = Us(t.endOfLine), i = 0, s = [{ indent: Wo2, mode: nt3, doc: e3 }], u = false, a = [], c = new tu3();
    for (_s(e3); s.length > 0; ) {
      let { indent: D, mode: P3, doc: F3 } = s.pop();
      switch (Xe3(F3)) {
        case ze3: {
          let I3 = o !== `
` ? V3(0, F3, `
`, o) : F3;
          I3 && (c.write(I3), s.length > 0 && (i += dt3(I3)));
          break;
        }
        case Me3:
          for (let I3 = F3.length - 1; I3 >= 0; I3--) s.push({ indent: D, mode: P3, doc: F3[I3] });
          break;
        case ct3:
          c.markPosition();
          break;
        case Ze3:
          s.push({ indent: eu3(D, t), mode: P3, doc: F3.contents });
          break;
        case et3:
          s.push({ indent: Zs(D, F3.n, t), mode: P3, doc: F3.contents });
          break;
        case lt3:
          i -= c.trim();
          break;
        case he3: {
          let I3 = (function() {
            if (P3 === Ct3 && !u) return { indent: D, mode: F3.break ? nt3 : Ct3, doc: F3.contents };
            u = false;
            let h = n - i, v3 = a.length > 0, U3 = { indent: D, mode: Ct3, doc: F3.contents };
            if (!F3.break && dn3(U3, s, h, v3, r3)) return U3;
            if (!F3.expandedStates) return { indent: D, mode: nt3, doc: F3.contents };
            if (!F3.break) for (let ae3 = 1; ae3 < F3.expandedStates.length - 1; ae3++) {
              let fe3 = { indent: D, mode: Ct3, doc: F3.expandedStates[ae3] };
              if (dn3(fe3, s, h, v3, r3)) return fe3;
            }
            return { indent: D, mode: nt3, doc: w3(0, F3.expandedStates, -1) };
          })();
          s.push(I3), F3.id && (r3[F3.id] = I3.mode);
          break;
        }
        case Ue3: {
          let I3 = n - i, k3 = F3[Go2] ?? 0, { parts: h } = F3, v3 = h.length - k3;
          if (v3 === 0) break;
          let U3 = h[k3 + 0], ae3 = h[k3 + 1], fe3 = { indent: D, mode: Ct3, doc: U3 }, z4 = { indent: D, mode: nt3, doc: U3 }, Ae3 = dn3(fe3, [], I3, a.length > 0, r3, true);
          if (v3 === 1) {
            Ae3 ? s.push(fe3) : s.push(z4);
            break;
          }
          let De3 = { indent: D, mode: Ct3, doc: ae3 }, xt3 = { indent: D, mode: nt3, doc: ae3 };
          if (v3 === 2) {
            Ae3 ? s.push(De3, fe3) : s.push(xt3, z4);
            break;
          }
          let bt3 = h[k3 + 2], _3 = { indent: D, mode: P3, doc: { ...F3, [Go2]: k3 + 2 } }, we3 = dn3({ indent: D, mode: Ct3, doc: [U3, ae3, bt3] }, [], I3, a.length > 0, r3, true);
          s.push(_3), we3 ? s.push(De3, fe3) : Ae3 ? s.push(xt3, fe3) : s.push(xt3, z4);
          break;
        }
        case _e4:
        case tt3: {
          let I3 = F3.groupId ? r3[F3.groupId] : P3;
          if (I3 === nt3) {
            let k3 = F3.type === _e4 ? F3.breakContents : F3.negate ? F3.contents : m3(F3.contents);
            k3 && s.push({ indent: D, mode: P3, doc: k3 });
          }
          if (I3 === Ct3) {
            let k3 = F3.type === _e4 ? F3.flatContents : F3.negate ? m3(F3.contents) : F3.contents;
            k3 && s.push({ indent: D, mode: P3, doc: k3 });
          }
          break;
        }
        case rt3:
          a.push({ indent: D, mode: P3, doc: F3.contents });
          break;
        case He3:
          a.length > 0 && s.push({ indent: D, mode: P3, doc: Mo2 });
          break;
        case Fe3:
          switch (P3) {
            case Ct3:
              if (!F3.hard) {
                F3.soft || (c.write(" "), i += 1);
                break;
              }
              u = true;
            case nt3:
              if (a.length > 0) {
                s.push({ indent: D, mode: P3, doc: F3 }, ...a.reverse()), a.length = 0;
                break;
              }
              F3.literal ? (c.write(o), i = 0, D.root && (D.root.value && c.write(D.root.value), i = D.root.length)) : (c.trim(), c.write(o + D.value), i = D.length);
              break;
          }
          break;
        case Ne3:
          s.push({ indent: D, mode: P3, doc: F3.contents });
          break;
        case qe3:
          break;
        default:
          throw new Ot3(F3);
      }
      s.length === 0 && a.length > 0 && (s.push(...a.reverse()), a.length = 0);
    }
    let { text: f, positions: E } = c.finish();
    if (E.length !== 2) return { formatted: f };
    let [C3, A] = E;
    return { formatted: f, cursorNodeStart: C3, cursorNodeText: f.slice(C3, A) };
  }
  var St3 = class extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "ArgExpansionBailout");
    }
  };
  function ar2(e3) {
    return (e3.type === "ObjectTypeProperty" || e3.type === "ObjectTypeInternalSlot") && !e3.static && !e3.method && e3.kind !== "get" && e3.kind !== "set" && e3.value.type === "FunctionTypeAnnotation";
  }
  function Zl(e3, t) {
    let r3 = null, n = t;
    for (; n !== r3; ) r3 = n, n = Ki(e3, n), n = er2(e3, n), n = at3(e3, n);
    return n = tr2(e3, n), n = pt3(e3, n), n !== false && J3(e3, n);
  }
  var Jt3 = Zl;
  var me3 = (e3, { originalText: t }) => {
    let r3 = S3(e3);
    if (Jt3(t, r3)) return true;
    let n = It3(e3);
    return n === r3 ? false : Jt3(t, n);
  };
  var em = B3(["AnyTypeAnnotation", "ThisTypeAnnotation", "NumberTypeAnnotation", "VoidTypeAnnotation", "BooleanTypeAnnotation", "BigIntTypeAnnotation", "SymbolTypeAnnotation", "StringTypeAnnotation", "NeverTypeAnnotation", "UndefinedTypeAnnotation", "UnknownTypeAnnotation", "EmptyTypeAnnotation", "MixedTypeAnnotation"]);
  var Cn3 = em;
  var ru3 = B3(["TSThisType", "NullLiteralTypeAnnotation", "BooleanLiteralTypeAnnotation", "StringLiteralTypeAnnotation", "BigIntLiteralTypeAnnotation", "NumberLiteralTypeAnnotation", "TSLiteralType", "TSTemplateLiteralType"]);
  function tm({ type: e3 }) {
    return e3.startsWith("TS") && e3.endsWith("Keyword");
  }
  var Fn3 = tm;
  function pr2(e3) {
    return Fn3(e3) || Cn3(e3) || ru3(e3) || e3.type === "GenericTypeAnnotation" && !e3.typeParameters || e3.type === "TSTypeReference" && !e3.typeArguments;
  }
  function nu3(e3) {
    return (e3.type === "TypeAnnotation" || e3.type === "TSTypeAnnotation") && e3.typeAnnotation.type === "FunctionTypeAnnotation" && !e3.static && !kt3(e3, e3.typeAnnotation);
  }
  function rm(e3, t) {
    let r3 = t.split(".");
    for (let n = r3.length - 1; n >= 0; n--) {
      let o = r3[n];
      if (n === 0) return e3.type === "Identifier" && e3.name === o;
      if (n === 1 && e3.type === "MetaProperty" && e3.property.type === "Identifier" && e3.property.name === o) {
        e3 = e3.meta;
        continue;
      }
      if (e3.type === "MemberExpression" && !e3.optional && !e3.computed && e3.property.type === "Identifier" && e3.property.name === o) {
        e3 = e3.object;
        continue;
      }
      return false;
    }
  }
  function cr2(e3, t) {
    return t.some((r3) => rm(e3, r3));
  }
  var nm = ["it", "it.only", "it.skip", "describe", "describe.only", "describe.skip", "test", "test.only", "test.skip", "test.fixme", "test.step", "test.describe", "test.describe.only", "test.describe.skip", "test.describe.fixme", "test.describe.parallel", "test.describe.parallel.only", "test.describe.serial", "test.describe.serial.only", "skip", "xit", "xdescribe", "xtest", "fit", "fdescribe", "ftest"];
  function om(e3) {
    return cr2(e3, nm);
  }
  function im(e3) {
    return e3.type === "Identifier" && (e3.name === "beforeEach" || e3.name === "beforeAll" || e3.name === "afterEach" || e3.name === "afterAll");
  }
  function qo2(e3) {
    return M3(e3) && e3.callee.type === "Identifier" && ["async", "inject", "fakeAsync", "waitForAsync"].includes(e3.callee.name);
  }
  function sm(e3) {
    return e3.type === "FunctionExpression" || e3.type === "ArrowFunctionExpression" && e3.body.type === "BlockStatement";
  }
  function Gt3(e3, t) {
    if (e3?.type !== "CallExpression" || e3.optional) return false;
    let r3 = se3(e3);
    if (r3.length === 1) {
      if (qo2(e3) && Gt3(t)) return wt3(r3[0]);
      if (im(e3.callee)) return qo2(r3[0]);
    } else if ((r3.length === 2 || r3.length === 3) && (r3[0].type === "TemplateLiteral" || q3(r3[0])) && om(e3.callee)) return r3[2] && !Ee3(r3[2]) ? false : (r3.length === 2 ? wt3(r3[1]) : sm(r3[1]) && ee3(r3[1]).length <= 1) || qo2(r3[1]);
    return false;
  }
  function um(e3, t) {
    let r3 = t - 1;
    r3 = at3(e3, r3, { backwards: true }), r3 = pt3(e3, r3, { backwards: true }), r3 = at3(e3, r3, { backwards: true });
    let n = pt3(e3, r3, { backwards: true });
    return r3 !== n;
  }
  var xn3 = um;
  var Yo2 = () => true;
  function Ho2(e3, t) {
    let r3 = e3.node;
    return r3.printed = true, t.printer.printComment(e3, t);
  }
  function am(e3, t) {
    let r3 = e3.node, n = [Ho2(e3, t)], { printer: o, originalText: i, locStart: s, locEnd: u } = t;
    if (o.isBlockComment?.(r3)) {
      let f = " ";
      J3(i, u(r3)) && (J3(i, s(r3), { backwards: true }) ? f = d : f = T3), n.push(f);
    } else n.push(d);
    let c = pt3(i, at3(i, u(r3)));
    return c !== false && J3(i, c) && n.push(d), n;
  }
  function pm(e3, t, r3) {
    let n = e3.node, o = Ho2(e3, t), { printer: i, originalText: s, locStart: u } = t, a = i.isBlockComment?.(n);
    if (r3?.hasLineSuffix && !r3?.isBlock || J3(s, u(n), { backwards: true })) {
      let c = xn3(s, u(n));
      return { doc: _o2([d, c ? d : "", o]), isBlock: a, hasLineSuffix: true };
    }
    return !a || r3?.hasLineSuffix ? { doc: [_o2([" ", o]), je3], isBlock: a, hasLineSuffix: true } : { doc: [" ", o], isBlock: a, hasLineSuffix: false };
  }
  function W4(e3, t, r3 = {}) {
    let { indent: n = false, marker: o, filter: i = Yo2 } = r3, s = new Set(e3.node?.comments?.filter((c) => !(c.leading || c.trailing || c.marker !== o || !i(c))));
    if (s.size === 0) return "";
    let u = e3.map(({ node: c }) => s.has(c) ? Ho2(e3, t) : "", "comments").filter(Boolean), a = L3(d, u);
    return n ? m3([d, a]) : a;
  }
  function An3(e3, t, r3) {
    let n = t[/* @__PURE__ */ Symbol.for("printedComments")], o = r3?.filter ?? Yo2, i = new Set(e3.node?.comments?.filter((s) => !n?.has(s) && s.leading && o(s)));
    return i.size === 0 ? "" : e3.map(({ node: s }) => i.has(s) ? am(e3, t) : "", "comments").filter(Boolean);
  }
  function ou3(e3, t, r3) {
    let n = e3.node?.comments, o = new Set(n?.filter((f) => f.trailing)), i = t[/* @__PURE__ */ Symbol.for("printedComments")], s = r3?.filter ?? Yo2, u = new Set(n?.filter((f) => o.has(f) && !i?.has(f) && s(f)));
    if (u.size === 0) return "";
    let a = [], c;
    return e3.each(({ node: f }) => {
      o.has(f) && (c = pm(e3, t, c), u.has(f) && a.push(c.doc));
    }, "comments"), a;
  }
  function Tn3(e3, t, r3) {
    return { leading: An3(e3, t, r3), trailing: ou3(e3, t, r3) };
  }
  function Q3(e3, t, r3, n) {
    let o = An3(e3, r3, n), i = ou3(e3, r3, n);
    return o || i ? mn3(t, (s) => [o, s, i]) : t;
  }
  function gn3(e3, t = "es5") {
    return e3.trailingComma === "es5" && t === "es5" || e3.trailingComma === "all" && (t === "all" || t === "es5");
  }
  function $3(e3) {
    let { node: t } = e3;
    return !t.optional || t.type === "Identifier" && t === e3.parent.key ? "" : M3(t) || N3(t) && t.computed || t.type === "OptionalIndexedAccessType" ? "?." : "?";
  }
  function hn3(e3) {
    return e3.node.definite || e3.match(void 0, (t, r3) => r3 === "id" && t.type === "VariableDeclarator" && t.definite) ? "!" : "";
  }
  var cm = B3(["DeclareClass", "DeclareComponent", "DeclareFunction", "DeclareHook", "DeclareVariable", "DeclareExportDeclaration", "DeclareExportAllDeclaration", "DeclareOpaqueType", "DeclareTypeAlias", "DeclareEnum", "DeclareInterface"]);
  var lm = (e3) => {
    let { node: t } = e3;
    return cm(t) ? e3.parent.type !== "DeclareExportDeclaration" && !t.implicitDeclare : t.declare;
  };
  function ne3(e3) {
    return lm(e3) ? "declare " : "";
  }
  var mm = B3(["TSAbstractMethodDefinition", "TSAbstractPropertyDefinition", "TSAbstractAccessorProperty"]);
  function lr({ node: e3 }) {
    return e3.abstract || mm(e3) ? "abstract " : "";
  }
  function Ut3(e3) {
    return e3.accessibility ? e3.accessibility + " " : "";
  }
  var iu3 = (e3) => e3.type === "UnaryExpression" && e3.operator === "!";
  function fm(e3) {
    return x4(e3) || !iu3(e3) ? false : (e3 = e3.argument, e3 = iu3(e3) ? e3.argument : e3, e3.type === "LogicalExpression");
  }
  function mr(e3, t, r3) {
    let { node: n } = e3, o = n.type === "WithStatement" ? "object" : "test", i = r3(o);
    return fm(n[o]) ? i : p3([m3([y3, i]), y3]);
  }
  function Mt3(e3, t, r3) {
    let { node: n } = e3;
    return x4(n, g4.Dangling, r3) ? [m3([y3, W4(e3, t, { filter: r3 })]), x4(n, g4.Dangling | g4.Line, r3) ? d : y3] : "";
  }
  function Ie3(e3, t = "es5") {
    return gn3(e3, t) ? O3(",") : "";
  }
  function R3(e3) {
    return e3.semi ? ";" : "";
  }
  var Dm = (e3) => e3.mark !== "commentBeforeArrow";
  function Ke3(e3, t, r3, n, o) {
    let i = e3.node, s = ee3(i), u = o && i.typeParameters ? r3("typeParameters") : "";
    if (s.length === 0) return [u, "(", Mt3(e3, t, Dm), ")"];
    let { parent: a } = e3, c = Gt3(a), f = su3(i), E = [];
    if (_i2(e3, (D, P3) => {
      let F3 = P3 === s.length - 1;
      F3 && i.rest && E.push("..."), E.push(r3()), !F3 && (E.push(","), c || f ? E.push(" ") : me3(s[P3], t) ? E.push(d, d) : E.push(T3));
    }), n && !Em(e3)) {
      if (ue3(u) || ue3(E)) throw new St3();
      return p3([Wt3(u), "(", Wt3(E), ")"]);
    }
    let C3 = s.every((D) => !j4(D.decorators));
    return f && C3 ? [u, "(", ...E, ")"] : c ? [u, "(", ...E, ")"] : (ar2(a) || nu3(a) || a.type === "TypeAlias" || a.type === "UnionTypeAnnotation" || a.type === "IntersectionTypeAnnotation" || a.type === "FunctionTypeAnnotation" && a.returnType === i) && s.length === 1 && s[0].name === null && i.this !== s[0] && s[0].typeAnnotation && i.typeParameters === null && pr2(s[0].typeAnnotation) && !i.rest ? t.arrowParens === "always" || i.type === "HookTypeAnnotation" ? ["(", ...E, ")"] : E : [u, "(", m3([y3, ...E]), !Ni2(i) && e3.root.type !== "NGRoot" ? Ie3(t, "all") : "", y3, ")"];
  }
  function su3(e3) {
    if (!e3) return false;
    let t = ee3(e3);
    if (t.length !== 1) return false;
    let [r3] = t;
    return !x4(r3) && (r3.type === "ObjectPattern" || r3.type === "ArrayPattern" || r3.type === "Identifier" && r3.typeAnnotation && (r3.typeAnnotation.type === "TypeAnnotation" || r3.typeAnnotation.type === "TSTypeAnnotation") && Ye3(r3.typeAnnotation.typeAnnotation) || r3.type === "FunctionTypeParam" && Ye3(r3.typeAnnotation) && r3 !== e3.rest || r3.type === "AssignmentPattern" && (r3.left.type === "ObjectPattern" || r3.left.type === "ArrayPattern") && (r3.right.type === "Identifier" || ie3(r3.right) && r3.right.properties.length === 0 || Y4(r3.right) && r3.right.elements.length === 0));
  }
  function ym(e3) {
    let t;
    return e3.returnType ? (t = e3.returnType, t.typeAnnotation && (t = t.typeAnnotation)) : e3.typeAnnotation && (t = e3.typeAnnotation), t;
  }
  function Bt3(e3, t) {
    let r3 = ym(e3);
    if (!r3) return false;
    let n = e3.typeParameters?.params;
    if (n) {
      if (n.length > 1) return false;
      if (n.length === 1) {
        let o = n[0];
        if (o.constraint || o.default) return false;
      }
    }
    return ee3(e3).length === 1 && (Ye3(r3) || ue3(t));
  }
  function Em(e3) {
    return e3.match((t) => t.type === "ArrowFunctionExpression" && t.body.type === "BlockStatement", (t, r3) => {
      if (t.type === "CallExpression" && r3 === "arguments" && t.arguments.length === 1 && t.callee.type === "CallExpression") {
        let n = t.callee.callee;
        return n.type === "Identifier" || n.type === "MemberExpression" && !n.computed && n.object.type === "Identifier" && n.property.type === "Identifier";
      }
      return false;
    }, (t, r3) => t.type === "VariableDeclarator" && r3 === "init" || t.type === "ExportDefaultDeclaration" && r3 === "declaration" || t.type === "TSExportAssignment" && r3 === "expression" || t.type === "AssignmentExpression" && r3 === "right" && t.left.type === "MemberExpression" && t.left.object.type === "Identifier" && t.left.object.name === "module" && t.left.property.type === "Identifier" && t.left.property.name === "exports", (t) => t.type !== "VariableDeclaration" || t.kind === "const" && t.declarations.length === 1);
  }
  function uu3(e3) {
    let t = ee3(e3);
    return t.length > 1 && t.some((r3) => r3.type === "TSParameterProperty");
  }
  function qt3(e3, t) {
    return (t === "params" || t === "this" || t === "rest") && su3(e3);
  }
  var dm = /^[\$A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC][\$0-9A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]*$/;
  var Cm = (e3) => dm.test(e3);
  var au3 = Cm;
  function Fm(e3) {
    return e3.length === 1 ? e3 : e3.toLowerCase().replace(/^([+-]?[\d.]+e)(?:\+|(-))?0*(?=\d)/, "$1$2").replace(/^([+-]?[\d.]+)e[+-]?0+$/, "$1").replace(/^([+-])?\./, "$10.").replace(/(\.\d+?)0+(?=e|$)/, "$1").replace(/\.(?=e|$)/, "");
  }
  var _t4 = Fm;
  var pu3 = Object.freeze({ character: "'", codePoint: 39 });
  var cu3 = Object.freeze({ character: '"', codePoint: 34 });
  var xm = Object.freeze({ preferred: pu3, alternate: cu3 });
  var Am = Object.freeze({ preferred: cu3, alternate: pu3 });
  function Sn3(e3, t) {
    let { preferred: r3, alternate: n } = t === true || t === "'" ? xm : Am, { length: o } = e3, i = 0, s = 0;
    for (let u = 0; u < o; u++) {
      let a = e3.charCodeAt(u);
      a === r3.codePoint ? i++ : a === n.codePoint && s++;
    }
    return (i > s ? n : r3).character;
  }
  var Tm = /\\(["'\\])|(["'])/g;
  function gm(e3, t) {
    let r3 = t === '"' ? "'" : '"', n = V3(0, e3, Tm, (o, i, s) => i ? i === r3 ? r3 : o : s === t ? "\\" + s : s);
    return t + n + t;
  }
  var mu3 = gm;
  function hm(e3, t) {
    Re3(/^(?<quote>["']).*\k<quote>$/s.test(e3));
    let r3 = e3.slice(1, -1), n;
    return t.parser === "json" || t.parser === "jsonc" || t.parser === "json-stringify" || t.parser === "json5" && t.quoteProps === "preserve" && !t.singleQuote ? n = '"' : t.__isInHtmlAttribute ? n = "'" : n = Sn3(r3, t.singleQuote), e3.charAt(0) === n ? e3 : mu3(r3, n);
  }
  var ot3 = hm;
  var fu3 = (e3) => e3.type === "TSEnumMember";
  var Du3 = (e3) => fu3(e3) ? "id" : "key";
  var vr2 = (e3) => e3[Du3(e3)];
  var yu3 = (e3) => !fu3(e3) && e3.computed;
  function Eu3(e3) {
    return /^(?:\d+|\d+\.\d+)$/.test(e3);
  }
  var Sm = ({ parser: e3 }) => e3 === "typescript" || e3 === "babel-ts" || e3 === "oxc-ts" || e3 === "yuku-ts";
  function Bm(e3, t) {
    let r3 = vr2(e3);
    if (r3.type === "Identifier") return true;
    if (!Ee3(r3) || Sm(t)) return false;
    let n = _t4(ye3(r3));
    return String(r3.value) === n && Eu3(n);
  }
  function du3(e3, t) {
    let { parser: r3 } = t;
    if (r3 === "json" || r3 === "jsonc") return false;
    let n = vr2(e3);
    if (!q3(n)) return false;
    let { value: o } = n;
    return ot3(ye3(n), t).slice(1, -1) !== o || e3.type === "TSMethodSignature" && o === "new" ? false : !!(!(r3 === "babel-ts" && e3.type === "ClassProperty" || (r3 === "typescript" || r3 === "oxc-ts" || r3 === "yuku-ts") && e3.type === "PropertyDefinition") && au3(o) || (r3 === "babel" || r3 === "acorn" || r3 === "oxc" || r3 === "yuku" || r3 === "espree" || r3 === "meriyah" || r3 === "__babel_estree") && e3.type !== "ImportAttribute" && Eu3(o) && String(Number(o)) === o);
  }
  var bm = /* @__PURE__ */ new WeakMap();
  function Cu3(e3, t) {
    return Z3(bm, e3.parent, () => e3.siblings.some((r3) => {
      if (yu3(r3)) return false;
      let n = vr2(r3);
      return q3(n) && !du3(r3, t);
    }));
  }
  function Pm(e3, t) {
    return (t.parser === "json" || t.parser === "jsonc" || t.quoteProps === "consistent" && Cu3(e3, t)) && Bm(e3.node, t);
  }
  function Im(e3, t) {
    return (t.quoteProps === "as-needed" || t.quoteProps === "consistent" && !Cu3(e3, t)) && du3(e3.node, t);
  }
  function ve3(e3, t, r3) {
    let { node: n } = e3, o = Du3(n);
    if (yu3(n)) return ["[", r3(o), "]"];
    if (Pm(e3, t)) {
      let i = vr2(n), s = ot3(JSON.stringify(i.type === "Identifier" ? i.name : String(i.value)), t);
      return e3.call(() => Q3(e3, s, t), o);
    }
    if (Im(e3, t)) {
      let { value: i } = vr2(n), s = /^\d/.test(i) ? _t4(i) : i;
      return e3.call(() => Q3(e3, s, t), o);
    }
    return r3(o);
  }
  var km = B3(["VoidTypeAnnotation", "TSVoidKeyword", "NullLiteralTypeAnnotation", "TSNullKeyword"]);
  var wm = B3(["ObjectTypeAnnotation", "TSTypeLiteral", "GenericTypeAnnotation", "TSTypeReference"]);
  function Vo2(e3) {
    return e3.key === "elementTypes" && zt3(e3.parent) && e3.parent.elementTypes.length > 1;
  }
  function Yt3(e3) {
    let { types: t } = e3;
    if (t.some((n) => x4(n))) return false;
    let r3 = t.find((n) => wm(n));
    return r3 ? t.every((n) => n === r3 || km(n)) : false;
  }
  function Bn3(e3) {
    let { key: t, node: r3, parent: n } = e3;
    return !(Yt3(r3) || t === "types" && pe3(n) || t === "types" && At3(n) || Vo2(e3));
  }
  function bn3(e3, t, r3, n) {
    let { node: o } = e3;
    if (Yt3(o)) return L3(" | ", e3.map(r3, "types"));
    let i = p3(e3.map(({ isFirst: s }) => {
      let u = s ? O3("| ") : [T3, "| "], a = r3();
      return x4(e3.node, g4.Leading) ? [u, Be3(2, Q3(e3, a, t))] : [u, Q3(e3, Be3(2, a), t)];
    }, "types"));
    return Bn3(e3) && (i = Q3(e3, i, t)), oe3(e3, t) ? p3([m3([y3, i]), y3]) : Vo2(e3) ? p3([m3([O3(["(", y3]), i]), y3, O3(")")]) : n?.assignmentLayout === "break-after-operator" || !Lm(e3) ? i : p3(m3([y3, i]));
  }
  function Lm(e3) {
    let { key: t, parent: r3 } = e3;
    return !(t === "typeAnnotation" && r3.type === "TSTypeAssertion" || t === "elementTypes" && zt3(r3) || (t === "trueType" || t === "falseType") && Qe3(r3) || t === "params" && Hi(r3) || t === "typeAnnotation" && r3.type === "FunctionTypeParam" && !r3.name && e3.grandparent.this !== r3 || e3.match(void 0, (n, o) => o === "typeAnnotation" && n.type === "FunctionTypeParam", (n, o) => o === "params" && n.type === "FunctionTypeAnnotation", (n, o) => o === "value" && n.type === "ObjectTypeProperty" && ar2(n)));
  }
  function Fu3(e3) {
    return pr2(e3) || Ye3(e3) ? true : pe3(e3) ? Yt3(e3) : false;
  }
  var Om = /* @__PURE__ */ new WeakSet();
  function G4(e3, t, r3 = "typeAnnotation") {
    let { node: { [r3]: n } } = e3;
    if (!n) return "";
    let o = false;
    if (n.type === "TSTypeAnnotation" || n.type === "TypeAnnotation") {
      let i = e3.call(xu3, r3);
      (i === "=>" || i === ":" && x4(n, g4.Leading)) && (o = true), Om.add(n);
    }
    return o ? [" ", t(r3)] : t(r3);
  }
  var xu3 = (e3) => e3.match((t) => t.type === "TSTypeAnnotation", (t, r3) => (r3 === "returnType" || r3 === "typeAnnotation") && (t.type === "TSFunctionType" || t.type === "TSConstructorType")) ? "=>" : e3.match((t) => t.type === "TSTypeAnnotation", (t, r3) => r3 === "typeAnnotation" && (t.type === "TSJSDocNullableType" || t.type === "TSJSDocNonNullableType" || t.type === "TSTypePredicate")) || e3.match((t) => t.type === "TypeAnnotation", (t, r3) => r3 === "typeAnnotation" && t.type === "Identifier", (t, r3) => r3 === "id" && t.type === "DeclareFunction") || e3.match((t) => t.type === "TypeAnnotation", (t, r3) => r3 === "typeAnnotation" && t.type === "Identifier", (t, r3) => r3 === "id" && t.type === "DeclareHook") || e3.match((t) => t.type === "TypeAnnotation", (t, r3) => r3 === "bound" && t.type === "TypeParameter" && t.usesExtendsBound) ? "" : ":";
  function Pn3(e3, t, r3) {
    let n = xu3(e3);
    return n ? [n, " ", r3("typeAnnotation")] : r3("typeAnnotation");
  }
  var Mm = ({ node: e3, key: t, parent: r3 }) => t === "value" && e3.type === "FunctionExpression" && (r3.type === "ObjectMethod" || r3.type === "ClassMethod" || r3.type === "ClassPrivateMethod" || r3.type === "MethodDefinition" || r3.type === "TSAbstractMethodDefinition" || r3.type === "TSDeclareMethod" || r3.type === "Property" && $e2(r3));
  function fr2(e3, t, r3, n) {
    if (Mm(e3)) return In3(e3, t, r3);
    let { node: o } = e3, i = false;
    if (o.type === "FunctionExpression" && n?.expandLastArg) {
      let { parent: E } = e3;
      M3(E) && (se3(E).length > 1 || ee3(o).every((C3) => C3.type === "Identifier" && !C3.typeAnnotation)) && (i = true);
    }
    let s = Ke3(e3, t, r3, i), u = wn3(e3, r3), a = Bt3(o, u), f = o.type === "HookDeclaration" ? "hook" : "function";
    return [ne3(e3), o.async ? "async " : "", f, o.generator ? "*" : "", " ", o.id ? r3("id") : "", r3("typeParameters"), p3([a ? p3(s) : s, u]), o.body ? " " : "", r3("body"), o.declare || !o.body ? R3(t) : ""];
  }
  function Rr2(e3, t, r3) {
    let { node: n } = e3, { kind: o } = n, i = n.value || n, s = [];
    return !o || o === "init" || o === "method" || o === "constructor" ? i.async && s.push("async ") : (Re3(o === "get" || o === "set"), s.push(o, " ")), i.generator && s.push("*"), s.push(ve3(e3, t, r3), n.optional ? "?" : "", n === i ? In3(e3, t, r3) : r3("value")), s;
  }
  function In3(e3, t, r3) {
    let { node: n } = e3, o = Ke3(e3, t, r3), i = wn3(e3, r3), s = uu3(n), u = Bt3(n, i), a = [r3("typeParameters"), p3([s ? p3(o, { shouldBreak: true }) : u ? p3(o) : o, i])];
    return n.body ? a.push(" ", r3("body")) : a.push(R3(t)), a;
  }
  function _m(e3) {
    let t = ee3(e3);
    return t.length === 1 && !e3.typeParameters && !x4(e3, g4.Dangling) && t[0].type === "Identifier" && !t[0].typeAnnotation && !x4(t[0]) && !t[0].optional && !e3.predicate && !e3.returnType;
  }
  function kn3(e3, t) {
    if (t.arrowParens === "always") return false;
    if (t.arrowParens === "avoid") {
      let { node: r3 } = e3;
      return _m(r3);
    }
    return false;
  }
  function wn3(e3, t) {
    let { node: r3 } = e3, o = [G4(e3, t, "returnType")];
    return r3.predicate && o.push(t("predicate")), o;
  }
  function Dr2(e3, t) {
    if (t.semi) return false;
    let { node: r3 } = e3;
    if (r3.type !== "ExpressionStatement" || $o2(e3, t) || zo2(e3, t) || Qo2(e3, t)) return false;
    let { key: n, parent: o } = e3;
    return !!((n === "body" && (o.type === "Program" || o.type === "BlockStatement" || o.type === "StaticBlock" || o.type === "TSModuleBlock") || n === "consequent" && o.type === "SwitchCase") && e3.call(() => Au3(e3, t), "expression"));
  }
  function Au3(e3, t) {
    let { node: r3 } = e3;
    switch (r3.type) {
      case "ParenthesizedExpression":
      case "TypeCastExpression":
      case "TSTypeAssertion":
      case "ArrayExpression":
      case "ArrayPattern":
      case "TemplateLiteral":
      case "TemplateElement":
      case "RegExpLiteral":
        return true;
      case "ArrowFunctionExpression":
        if (!kn3(e3, t)) return true;
        break;
      case "UnaryExpression": {
        let { prefix: n, operator: o } = r3;
        if (n && (o === "+" || o === "-")) return true;
        break;
      }
      case "BindExpression":
        if (!r3.object) return true;
        break;
      case "Literal":
        if (r3.regex) return true;
        break;
      default:
        if (H4(r3)) return true;
    }
    return oe3(e3, t) ? true : ir2(r3) ? e3.call(() => Au3(e3, t), ...an3(r3)) : false;
  }
  var Ko2 = ({ node: e3, parent: t }) => e3.type === "ExpressionStatement" && t.type === "Program" && t.body.length === 1 && (Array.isArray(t.directives) && t.directives.length === 0 || !t.directives);
  function $o2(e3, t) {
    return (t.parentParser === "markdown" || t.parentParser === "mdx") && Ko2(e3) && H4(e3.node.expression);
  }
  function Qo2(e3, t) {
    return t.__isHtmlInlineEventHandler && Ko2(e3);
  }
  function zo2(e3, t) {
    return (t.parser === "__vue_event_binding" || t.parser === "__vue_ts_event_binding") && Ko2(e3);
  }
  function Ln3(e3, t) {
    if (!Dr2(e3, t)) return false;
    let r3 = w3(0, re3(e3.node, g4.Leading), -1);
    return !!(r3 && rr2(r3));
  }
  var Nm = B3(["ClassDeclaration", "ClassExpression", "DeclareClass", "DeclareInterface", "InterfaceDeclaration", "TSInterfaceDeclaration"]);
  function jm(e3, t) {
    let { key: r3, parent: n } = e3;
    if (r3 === "types" && pe3(n) || r3 === "argument" && n.type === "JSXSpreadAttribute" || r3 === "expression" && n.type === "JSXSpreadChild" || r3 === "superClass" && (n.type === "ClassDeclaration" || n.type === "ClassExpression") || (r3 === "id" || r3 === "typeParameters") && Nm(n) || r3 === "patterns" && n.type === "MatchOrPattern" || tn3(e3)) return true;
    let { node: o } = e3;
    return Lt3(o) ? false : o.type === "ExpressionStatement" ? Ln3(e3, t) : pe3(o) ? Bn3(e3) : !!H4(o);
  }
  var Tu3 = jm;
  function vm(e3, t, r3 = 0) {
    let n = 0;
    for (let o = r3; o < e3.length; ++o) e3[o] === "	" ? n = n + t - n % t : n++;
    return n;
  }
  var gu3 = vm;
  function Rm(e3, t) {
    let r3 = e3.lastIndexOf(`
`);
    return r3 === -1 ? 0 : gu3(e3.slice(r3 + 1).match(/^[\t ]*/)[0], t);
  }
  var hu3 = Rm;
  function On3(e3, t, r3) {
    if (Um(e3)) {
      let i = Wm(e3, t, r3);
      if (i) return i;
    }
    let n = Pu3(e3, t, r3), o = e3.map(({ isLast: i, index: s }) => [r3(), i ? "" : n[s]], "quasis");
    return [xe3, "`", ...o, "`"];
  }
  function Bu3(e3, t, r3) {
    let n = r3("quasi"), { node: o } = e3, i = "", s = re3(o.quasi, g4.Leading)[0];
    return s && (te3(t.originalText, S3(o.typeArguments ?? o.tag), b3(s)) ? i = y3 : i = " "), Et3(n.label && { tagged: true, ...n.label }, [r3("tag"), r3("typeArguments"), i, xe3, n]);
  }
  function Wm(e3, t, r3) {
    let { node: n } = e3, o = n.quasis[0].value.raw.trim().split(/\s*\|\s*/);
    if (o.length > 1 || o.some((i) => i.length > 0)) {
      t.__inJestEach = true;
      let i = Pu3(e3, t, r3);
      t.__inJestEach = false;
      let s = i.map((E) => Uo2(E, { ...t, printWidth: Number.POSITIVE_INFINITY, endOfLine: "lf" }).formatted), u = [{ hasLineBreak: false, cells: [] }];
      for (let E = 1; E < n.quasis.length; E++) {
        let C3 = w3(0, u, -1), A = s[E - 1];
        C3.cells.push(A), A.includes(`
`) && (C3.hasLineBreak = true), n.quasis[E].value.raw.includes(`
`) && u.push({ hasLineBreak: false, cells: [] });
      }
      let a = Math.max(o.length, ...u.map((E) => E.cells.length)), c = Array.from({ length: a }, () => 0), f = [{ cells: o }, ...u.filter((E) => E.cells.length > 0)];
      for (let E of f) if (!E.hasLineBreak) for (let [C3, A] of E.cells.entries()) c[C3] = Math.max(c[C3], dt3(A));
      return [xe3, "`", m3([d, L3(d, f.map((E) => L3(" | ", E.cells.map((C3, A) => E.hasLineBreak ? C3 : C3 + " ".repeat(c[A] - dt3(C3))))))]), d, "`"];
    }
  }
  var Jm = /* @__PURE__ */ new WeakMap();
  function Gm(e3, t) {
    let { parent: r3, index: n } = e3;
    return Z3(Jm, r3, (i) => {
      let { tabWidth: s } = t, u = 0;
      return i.quasis.map((c) => {
        let f = c.value.raw, E = f.includes(`
`) ? hu3(f, s) : u;
        return u = E, { indentSize: E, previousQuasiText: f };
      });
    })[n];
  }
  function bu2(e3, t, r3, n = true) {
    let { node: o, index: i } = e3, s = r3(), u = e3.parent, { quasis: a } = u, c = S3(a[i]), f = b3(a[i + 1]), E = te3(t.originalText, c, f);
    if (!E) {
      let D = Uo2(s, { ...t, printWidth: Number.POSITIVE_INFINITY }).formatted;
      D.includes(`
`) ? E = true : s = D;
    }
    if (E && (x4(o) || o.type === "Identifier" || N3(Pe3(o)) || o.type === "ConditionalExpression" || o.type === "SequenceExpression" || de2(o) || be3(o)) && (s = [m3([y3, s]), y3]), !n) return p3(["${", s, xe3, "}"]);
    let { indentSize: C3, previousQuasiText: A } = Gm(e3, t);
    return t.__inJestEach && (C3 = Math.max(C3, t.tabWidth)), s = C3 === 0 && A.endsWith(`
`) ? Be3(Number.NEGATIVE_INFINITY, s) : Gs(s, C3, t.tabWidth), p3(["${", s, xe3, "}"]);
  }
  function Pu3(e3, t, r3) {
    return e3.map(() => bu2(e3, t, r3), e3.node.type === "TSTemplateLiteralType" ? "types" : "expressions");
  }
  function yr2(e3, t, r3) {
    return e3.map(() => bu2(e3, t, r3, false), "expressions");
  }
  function Mn3(e3, t) {
    return gt3(e3, (r3) => typeof r3 == "string" ? t ? V3(0, r3, /(\\*)`/g, "$1$1\\`") : Zo2(r3) : r3);
  }
  function Zo2(e3) {
    return V3(0, e3, /([\\`]|\$\{)/g, "\\$1");
  }
  var Su3 = /^[fx]?(?:describe|it|test)$/;
  function Um({ node: e3, parent: t }) {
    return e3.type === "TemplateLiteral" && t.type === "TaggedTemplateExpression" && t.quasi === e3 && t.tag.type === "MemberExpression" && t.tag.property.type === "Identifier" && t.tag.property.name === "each" && (t.tag.object.type === "Identifier" && Su3.test(t.tag.object.name) || t.tag.object.type === "MemberExpression" && t.tag.object.property.type === "Identifier" && (t.tag.object.property.name === "only" || t.tag.object.property.name === "skip") && t.tag.object.object.type === "Identifier" && Su3.test(t.tag.object.object.name));
  }
  var ti3 = [(e3, t) => t === "properties" && e3.type === "ObjectExpression", (e3, t) => t === "arguments" && e3.type === "CallExpression" && e3.callee.type === "Identifier" && e3.callee.name === "Component", (e3, t) => t === "expression" && e3.type === "Decorator"];
  function Iu2(e3) {
    let t = (n) => n.type === "TemplateLiteral", r3 = (n, o) => Ge3(n) && !n.computed && n.key.type === "Identifier" && n.key.name === "styles" && o === "value";
    return e3.match(t, (n, o) => Y4(n) && o === "elements", r3, ...ti3) || e3.match(t, r3, ...ti3);
  }
  function ri2(e3) {
    return e3.match((t) => t.type === "TemplateLiteral", (t, r3) => Ge3(t) && !t.computed && t.key.type === "Identifier" && t.key.name === "template" && r3 === "value", ...ti3);
  }
  function ei3(e3, t) {
    return x4(e3, g4.Block | g4.Leading, ({ value: r3 }) => r3 === ` ${t} `);
  }
  function _n5({ node: e3, parent: t }, r3) {
    return ei3(e3, r3) || qm(t) && ei3(t, r3) || t.type === "ExpressionStatement" && ei3(t, r3);
  }
  function qm(e3) {
    return e3.type === "AsConstExpression" || e3.type === "TSAsExpression" && e3.typeAnnotation.type === "TSTypeReference" && e3.typeAnnotation.typeName.type === "Identifier" && e3.typeAnnotation.typeName.name === "const";
  }
  async function wu3(e3, t, r3, n) {
    let { node: o } = r3, i = "";
    for (let [c, f] of o.quasis.entries()) {
      let { raw: E } = f.value;
      c > 0 && (i += "@prettier-placeholder-" + (c - 1) + "-id"), i += E;
    }
    let s = await e3(i, { parser: "scss" }), u = yr2(r3, n, t), a = Ym(s, u);
    if (!a) throw new Error("Couldn't insert all the expressions");
    return ["`", m3([d, a]), y3, "`"];
  }
  function Ym(e3, t) {
    if (!j4(t)) return e3;
    let r3 = 0, n = gt3(sr2(e3), (o) => typeof o != "string" || !o.includes("@prettier-placeholder") ? o : o.split(/@prettier-placeholder-(\d+)-id/).map((i, s) => s % 2 === 0 ? Ve3(i) : (r3++, t[i])));
    return t.length === r3 ? n : null;
  }
  function Hm(e3) {
    return e3.match(void 0, (t, r3) => r3 === "quasi" && t.type === "TaggedTemplateExpression" && cr2(t.tag, ["css", "css.global", "css.resolve"])) || e3.match(void 0, (t, r3) => r3 === "expression" && t.type === "JSXExpressionContainer", (t, r3) => r3 === "children" && t.type === "JSXElement" && t.openingElement.name.type === "JSXIdentifier" && t.openingElement.name.name === "style" && t.openingElement.attributes.some((n) => n.type === "JSXAttribute" && n.name.type === "JSXIdentifier" && n.name.name === "jsx"));
  }
  function Nn3(e3) {
    return e3.type === "Identifier" && e3.name === "styled";
  }
  function ku2(e3) {
    return /^[A-Z]/.test(e3.object.name) && e3.property.name === "extend";
  }
  function Xm({ parent: e3 }) {
    if (!e3 || e3.type !== "TaggedTemplateExpression") return false;
    let t = e3.tag.type === "ParenthesizedExpression" ? e3.tag.expression : e3.tag;
    switch (t.type) {
      case "MemberExpression":
        return Nn3(t.object) || ku2(t);
      case "CallExpression":
        return Nn3(t.callee) || t.callee.type === "MemberExpression" && (t.callee.object.type === "MemberExpression" && (Nn3(t.callee.object.object) || ku2(t.callee.object)) || t.callee.object.type === "CallExpression" && Nn3(t.callee.object.callee));
      case "Identifier":
        return t.name === "css";
      default:
        return false;
    }
  }
  function Vm({ parent: e3, grandparent: t }) {
    return t?.type === "JSXAttribute" && e3.type === "JSXExpressionContainer" && t.name.type === "JSXIdentifier" && t.name.name === "css";
  }
  var Lu3 = (e3) => Hm(e3) || Xm(e3) || Vm(e3) || Iu2(e3);
  async function Ou3(e3, t, r3, n) {
    let { node: o } = r3, i = o.quasis.length, s = yr2(r3, n, t), u = [];
    for (let a = 0; a < i; a++) {
      let c = o.quasis[a], f = a === 0, E = a === i - 1, C3 = c.value.cooked, A = C3.split(`
`), D = A.length;
      if (!E && /#[^\n\r]*$/.test(A[D - 1])) return null;
      let P3 = D > 2 && A[0].trim() === "" && A[1].trim() === "", F3 = D > 2 && A[D - 1].trim() === "" && A[D - 2].trim() === "", I3 = A.every((h) => /^\s*(?:#[^\n\r]*)?$/.test(h)), k3;
      I3 ? k3 = Km(A) : k3 = await e3(C3, { parser: "graphql" }), k3 ? (k3 = Mn3(k3, false), !f && P3 && u.push(""), u.push(k3), !E && F3 && u.push("")) : !f && !E && P3 && u.push(""), E || u.push(s[a]);
    }
    return ["`", m3([d, L3(d, u)]), d, "`"];
  }
  function Km(e3) {
    let t = [], r3 = false, n = e3.map((o) => o.trim());
    for (let [o, i] of n.entries()) i !== "" && (n[o - 1] === "" && r3 ? t.push([d, i]) : t.push(i), r3 = true);
    return t.length === 0 ? null : L3(d, t);
  }
  function Mu3({ node: e3, parent: t }) {
    return _n5({ node: e3, parent: t }, "GraphQL") || t && (t.type === "TaggedTemplateExpression" && (t.tag.type === "MemberExpression" && t.tag.object.name === "graphql" && t.tag.property.name === "experimental" || t.tag.type === "Identifier" && (t.tag.name === "gql" || t.tag.name === "graphql")) || t.type === "CallExpression" && t.callee.type === "Identifier" && t.callee.name === "graphql");
  }
  var ni3 = 0;
  async function _u4(e3, t, r3, n, o) {
    let { node: i } = n, s = ni3;
    ni3 = ni3 + 1 >>> 0;
    let u = (I3) => `PRETTIER_HTML_PLACEHOLDER_${I3}_${s}_IN_JS`, a = i.quasis.map((I3, k3, h) => k3 === h.length - 1 ? I3.value.cooked : I3.value.cooked + u(k3)).join(""), c = yr2(n, o, r3), f = new RegExp(u("(\\d+)"), "g"), E = 0, C3 = await t(a, { parser: e3, __onHtmlRoot(I3) {
      E = I3.children.length;
    } }), A = gt3(C3, (I3) => {
      if (typeof I3 != "string") return I3;
      let k3 = [], h = I3.split(f);
      for (let v3 = 0; v3 < h.length; v3++) {
        let U3 = h[v3];
        if (v3 % 2 === 0) {
          U3 && (U3 = Zo2(U3), o.__embeddedInHtml && (U3 = V3(0, U3, /<\/(?=script\b)/gi, "<\\/")), k3.push(U3));
          continue;
        }
        let ae3 = Number(U3);
        k3.push(c[ae3]);
      }
      return k3;
    }), D = /^\s/.test(a) ? " " : "", P3 = /\s$/.test(a) ? " " : "", F3 = o.htmlWhitespaceSensitivity === "ignore" ? d : D && P3 ? T3 : null;
    return F3 ? p3(["`", m3([F3, p3(A)]), F3, "`"]) : Et3({ hug: false }, p3(["`", D, E > 1 ? m3(p3(A)) : p3(A), P3, "`"]));
  }
  function Nu3(e3) {
    return _n5(e3, "HTML") || e3.match((t) => t.type === "TemplateLiteral", (t, r3) => t.type === "TaggedTemplateExpression" && t.tag.type === "Identifier" && t.tag.name === "html" && r3 === "quasi");
  }
  var ju3 = _u4.bind(void 0, "html");
  var vu3 = _u4.bind(void 0, "angular");
  async function Ru3(e3, t, r3) {
    let { node: n } = r3, o = V3(0, n.quasis[0].value.raw, /((?:\\\\)*)\\`/g, (a, c) => "\\".repeat(c.length / 2) + "`"), i = $m(o), s = i !== "";
    s && (o = V3(0, o, new RegExp(`^${i}`, "gm"), ""));
    let u = Mn3(await e3(o, { parser: "markdown", __inJsTemplate: true }), true);
    return ["`", s ? m3([y3, u]) : [ur2, Ws(u)], y3, "`"];
  }
  function $m(e3) {
    let t = e3.match(/^([^\S\n]*)\S/m);
    return t === null ? "" : t[1];
  }
  function Wu3({ node: e3, parent: t }) {
    return t?.type === "TaggedTemplateExpression" && e3.quasis.length === 1 && t.tag.type === "Identifier" && (t.tag.name === "md" || t.tag.name === "markdown");
  }
  var Qm = [{ test: Lu3, print: wu3 }, { test: Mu3, print: Ou3 }, { test: Nu3, print: ju3 }, { test: ri2, print: vu3 }, { test: Wu3, print: Ru3 }].map(({ test: e3, print: t }) => ({ test: e3, print: Zm(t) }));
  function zm(e3) {
    let { node: t } = e3;
    if (t.type !== "TemplateLiteral" || ef(t)) return;
    let r3 = Qm.find(({ test: n }) => n(e3));
    if (r3) return t.quasis.length === 1 && t.quasis[0].value.raw.trim() === "" ? "``" : r3.print;
  }
  function Zm(e3) {
    return async (...t) => {
      let r3 = await e3(...t);
      return r3 && Et3({ embed: true, ...r3.label }, r3);
    };
  }
  function ef({ quasis: e3 }) {
    return e3.some(({ value: { cooked: t } }) => t === null);
  }
  var Ju3 = zm;
  function Gu3(e3, t) {
    e3.type === "ChainExpression" ? tf(t) : (e3.type === "OptionalMemberExpression" || e3.type === "OptionalCallExpression") && rf(t);
  }
  function Uu3(e3) {
    if (N3(e3)) return "object";
    if (M3(e3)) return "callee";
    if (We3(e3)) return "expression";
  }
  function jn3(e3) {
    let t = Uu3(e3);
    if (t) return e3[t];
  }
  function tf(e3) {
    for (e3 = jn3(e3); e3.type === "MemberExpression" || e3.type === "CallExpression" || e3.type === "TSNonNullExpression"; e3 = jn3(e3)) {
      let t = Uu3(e3), r3 = e3[t];
      r3.type === "ChainExpression" && (e3[t] = r3.expression);
    }
  }
  function rf(e3) {
    for (e3 = jn3(e3); e3.type === "MemberExpression" || e3.type === "CallExpression"; e3 = jn3(e3)) e3.type = `Optional${e3.type}`;
  }
  function qu3(e3, t, r3) {
    let n = t[r3];
    (q3(n) || Ee3(n)) && (e3[r3] = String(n.value)), n.type === "Identifier" && (e3[r3] = n.name);
  }
  function Yu3(e3, t) {
    (e3.type === "Property" || e3.type === "ObjectProperty" || e3.type === "MethodDefinition" || e3.type === "ClassProperty" || e3.type === "ClassMethod" || e3.type === "PropertyDefinition" || e3.type === "TSDeclareMethod" || e3.type === "TSPropertySignature" || e3.type === "TSMethodSignature" || e3.type === "ObjectTypeProperty" || e3.type === "ImportAttribute" || e3.type === "RecordDeclarationProperty" || e3.type === "RecordDeclarationStaticProperty") && !e3.computed && qu3(t, e3, "key"), e3.type === "TSEnumMember" && qu3(t, e3, "id");
  }
  function Hu3(e3, t) {
    e3.type === "RegExpLiteral" && (t.flags = [...e3.flags].sort().join("")), e3.type === "Literal" && "regex" in e3 && (t.regex.flags = [...e3.regex.flags].sort().join(""));
  }
  var nf = /* @__PURE__ */ new Set(["range", "raw", "comments", "extra", "start", "end", "loc", "errors", "tokens", "trailingComma", "docblock", "__contentEnd"]);
  var Er2 = (e3) => {
    for (let t of e3.quasis) delete t.value;
  };
  function oi3(e3, t, r3) {
    if (e3.type === "Program" && delete t.sourceType, Gu3(e3, t), Yu3(e3, t), Hu3(e3, t), (Ji(e3) || e3.type === "BigIntLiteralTypeAnnotation") && "bigint" in e3 && (t.bigint = e3.bigint.toLowerCase()), e3.type === "EmptyStatement" && !Qt3({ node: e3, parent: r3 }) || e3.type === "JSXText" || e3.type === "JSXExpressionContainer" && (e3.expression.type === "Literal" || e3.expression.type === "StringLiteral") && e3.expression.value === " ") return null;
    if (e3.type === "JSXElement" && e3.openingElement.name.type === "JSXIdentifier" && e3.openingElement.name.name === "style" && e3.openingElement.attributes.some((o) => o.type === "JSXAttribute" && o.name.name === "jsx")) for (let { type: o, expression: i } of t.children) o === "JSXExpressionContainer" && i.type === "TemplateLiteral" && Er2(i);
    e3.type === "JSXAttribute" && e3.name.name === "css" && e3.value.type === "JSXExpressionContainer" && e3.value.expression.type === "TemplateLiteral" && Er2(t.value.expression), e3.type === "JSXAttribute" && q3(e3.value) && /["']|&quot;|&apos;/.test(e3.value.value) && (t.value.value = V3(0, e3.value.value, /["']|&quot;|&apos;/g, '"'));
    let n = e3.expression || e3.callee;
    if (e3.type === "Decorator" && n.type === "CallExpression" && n.callee.name === "Component" && n.arguments.length === 1) {
      let o = e3.expression.arguments[0].properties;
      for (let [i, s] of t.expression.arguments[0].properties.entries()) switch (o[i].key.name) {
        case "styles":
          Y4(s.value) && Er2(s.value.elements[0]);
          break;
        case "template":
          s.value.type === "TemplateLiteral" && Er2(s.value);
          break;
      }
    }
    e3.type === "TaggedTemplateExpression" && (e3.tag.type === "MemberExpression" || e3.tag.type === "Identifier" && (e3.tag.name === "gql" || e3.tag.name === "graphql" || e3.tag.name === "css" || e3.tag.name === "md" || e3.tag.name === "markdown" || e3.tag.name === "html") || e3.tag.type === "CallExpression") && Er2(t.quasi), (e3.type === "CallExpression" || e3.type === "MemberExpression") && !e3.optional && delete t.optional, e3.type === "TemplateLiteral" && Er2(t);
  }
  oi3.ignoredProperties = nf;
  var of = /\*\/$/;
  var sf = /^\/\*\*?/;
  var $u3 = /^\s*(\/\*\*?(.|\r?\n)*?\*\/)/;
  var uf = /(^|\s+)\/\/([^\n\r]*)/g;
  var Xu3 = /^(\r?\n)+/;
  var af = /(?:^|\r?\n) *(@[^\n\r]*?) *\r?\n *(?![^\n\r@]*\/\/[^]*)([^\s@][^\n\r@]+?) *\r?\n/g;
  var Vu3 = /(?:^|\r?\n) *@(\S+) *([^\n\r]*)/g;
  var pf = /(\r?\n|^) *\* ?/g;
  var Qu3 = [];
  function zu3(e3) {
    let t = e3.match($u3);
    return t ? t[0].trimStart() : "";
  }
  function Zu3(e3) {
    let r3 = e3.match($u3)?.[0];
    return r3 == null ? e3 : e3.slice(r3.length);
  }
  function ea(e3) {
    e3 = V3(0, e3.replace(sf, "").replace(of, ""), pf, "$1");
    let r3 = "";
    for (; r3 !== e3; ) r3 = e3, e3 = V3(0, e3, af, `
$1 $2
`);
    e3 = e3.replace(Xu3, "").trimEnd();
    let n = /* @__PURE__ */ Object.create(null), o = V3(0, e3, Vu3, "").replace(Xu3, "").trimEnd(), i;
    for (; i = Vu3.exec(e3); ) {
      let s = V3(0, i[2], uf, "");
      if (typeof n[i[1]] == "string" || Array.isArray(n[i[1]])) {
        let u = n[i[1]];
        n[i[1]] = [...Qu3, ...Array.isArray(u) ? u : [u], s];
      } else n[i[1]] = s;
    }
    return { comments: o, pragmas: n };
  }
  function ta({ comments: e3 = "", pragmas: t = {} }) {
    let s = Object.keys(t), u = s.flatMap((c) => Ku3(c, t[c])).map((c) => ` * ${c}
`).join("");
    if (!e3) {
      if (s.length === 0) return "";
      if (s.length === 1 && !Array.isArray(t[s[0]])) {
        let c = t[s[0]];
        return `/** ${Ku3(s[0], c)[0]} */`;
      }
    }
    let a = e3.split(`
`).map((c) => ` * ${c}`).join(`
`) + `
`;
    return `/**
` + (e3 ? a : "") + (e3 && s.length > 0 ? ` *
` : "") + u + " */";
  }
  function Ku3(e3, t) {
    return [...Qu3, ...Array.isArray(t) ? t : [t]].map((r3) => `@${e3} ${r3}`.trim());
  }
  var ra = "format";
  function cf(e3) {
    if (!e3.startsWith("#!")) return "";
    let t = e3.indexOf(`
`);
    return t === -1 ? e3 : e3.slice(0, t);
  }
  var na = cf;
  function lf(e3) {
    let t = na(e3);
    t && (e3 = e3.slice(t.length + 1));
    let r3 = zu3(e3), { pragmas: n, comments: o } = ea(r3);
    return { shebang: t, text: e3, pragmas: n, comments: o };
  }
  function oa(e3) {
    let { shebang: t, text: r3, pragmas: n, comments: o } = lf(e3), i = Zu3(r3), s = ta({ pragmas: { [ra]: "", ...n }, comments: o.trimStart() });
    return (t ? `${t}
` : "") + s + (i.startsWith(`
`) ? `
` : `

`) + i;
  }
  function mf(e3) {
    if (!le3(e3)) return [];
    if (!e3.value.includes(`
`)) return [];
    let t = [];
    for (let r3 of `*${e3.value}*`.split(`
`)) {
      if (r3 = r3.trimStart(), !r3.startsWith("*")) return [];
      t.push(r3);
    }
    return t;
  }
  var ff = /* @__PURE__ */ new WeakMap();
  function ii3(e3) {
    return Z3(ff, e3, mf);
  }
  function vn3(e3) {
    return ii3(e3).length > 0;
  }
  function ia(e3, t) {
    let r3 = e3.node;
    if (Le3(r3)) return t.originalText.slice(b3(r3), S3(r3)).trimEnd();
    if (vn3(r3)) return Df(r3);
    if (le3(r3)) return ["/*", Ve3(r3.value), "*/"];
    throw new Error("Not a comment: " + JSON.stringify(r3));
  }
  function Df(e3) {
    let t = ii3(e3), r3 = e3.value[0] === "*" && e3.value[1] !== "*";
    return ["/", t.map((n, o) => {
      if (o === 0) return [n.trimEnd(), d];
      if (o === t.length - 1) return [" ", n];
      let i = n.trimEnd(), s = [" ", i];
      return r3 && i !== "*" && n.endsWith("  ") ? [s, "  ", Js(ur2)] : [s, d];
    }), "/"];
  }
  function si2(e3) {
    if (typeof e3 != "string") throw new TypeError("Expected a string");
    return e3.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
  }
  var _e6, _ui_instances, t_fn2, _a4;
  var ui3 = (_a4 = class {
    constructor(t) {
      __privateAdd(this, _ui_instances);
      __privateAdd(this, _e6);
      __privateSet(this, _e6, new Set(t));
    }
    getLeadingWhitespaceCount(t) {
      let r3 = __privateGet(this, _e6), n = 0;
      for (let o = 0; o < t.length && r3.has(t.charAt(o)); o++) n++;
      return n;
    }
    getTrailingWhitespaceCount(t) {
      let r3 = __privateGet(this, _e6), n = 0;
      for (let o = t.length - 1; o >= 0 && r3.has(t.charAt(o)); o--) n++;
      return n;
    }
    getLeadingWhitespace(t) {
      let r3 = this.getLeadingWhitespaceCount(t);
      return t.slice(0, r3);
    }
    getTrailingWhitespace(t) {
      let r3 = this.getTrailingWhitespaceCount(t);
      return t.slice(t.length - r3);
    }
    hasLeadingWhitespace(t) {
      return __privateGet(this, _e6).has(t.charAt(0));
    }
    hasTrailingWhitespace(t) {
      return __privateGet(this, _e6).has(w3(0, t, -1));
    }
    trimStart(t) {
      let r3 = this.getLeadingWhitespaceCount(t);
      return t.slice(r3);
    }
    trimEnd(t) {
      let r3 = this.getTrailingWhitespaceCount(t);
      return t.slice(0, t.length - r3);
    }
    trim(t) {
      return this.trimEnd(this.trimStart(t));
    }
    split(t, r3 = false) {
      let n = `[${si2([...__privateGet(this, _e6)].join(""))}]+`, o = new RegExp(r3 ? `(${n})` : n);
      return t.split(o);
    }
    hasWhitespaceCharacter(t) {
      let r3 = __privateGet(this, _e6);
      return Array.prototype.some.call(t, (n) => r3.has(n));
    }
    hasNonWhitespaceCharacter(t) {
      let r3 = __privateGet(this, _e6);
      return Array.prototype.some.call(t, (n) => !r3.has(n));
    }
    isWhitespaceOnly(t) {
      let r3 = __privateGet(this, _e6);
      return Array.prototype.every.call(t, (n) => r3.has(n));
    }
    dedentString(t) {
      let r3 = __privateMethod(this, _ui_instances, t_fn2).call(this, t);
      return r3 === 0 ? t : t.split(`
`).map((n) => n.slice(r3)).join(`
`);
    }
  }, _e6 = new WeakMap(), _ui_instances = new WeakSet(), t_fn2 = function(t) {
    let r3 = Number.POSITIVE_INFINITY;
    for (let n of t.split(`
`)) {
      if (n.length === 0) continue;
      let o = this.getLeadingWhitespaceCount(n);
      if (o === 0) return 0;
      n.length !== o && o < r3 && (r3 = o);
    }
    return r3 === Number.POSITIVE_INFINITY ? 0 : r3;
  }, _a4);
  var sa = ui3;
  var dr2 = new sa(` 
\r	`);
  function Ht3(e3) {
    return e3.type === "JSXText" && (dr2.hasNonWhitespaceCharacter(ye3(e3)) || !/\n/.test(ye3(e3)));
  }
  function ua(e3) {
    let { node: t, parent: r3 } = e3;
    if (!H4(t) || !H4(r3)) return false;
    let { index: n, siblings: o } = e3, i;
    for (let s = n; s > 0; s--) {
      let u = o[s - 1];
      if (!(u.type === "JSXText" && !Ht3(u))) {
        i = u;
        break;
      }
    }
    return i?.type === "JSXExpressionContainer" && i.expression.type === "JSXEmptyExpression" && Lt3(i.expression);
  }
  function yf(e3) {
    return Lt3(e3.node) || ua(e3);
  }
  var Cr2 = yf;
  var ai2 = class extends Error {
    constructor(t, r3, n = "type") {
      super(`Unexpected ${r3} node ${n}: ${JSON.stringify(t[n])}.`);
      __publicField(this, "name", "UnexpectedNodeError");
      this.node = t;
    }
  };
  var it3 = ai2;
  function aa(e3) {
    return e3.type === "CallExpression" && !e3.optional && e3.arguments.length === 1 && e3.callee.type === "Identifier" && e3.callee.name === "Boolean";
  }
  var Ef = 0;
  function Rn3(e3, t, r3) {
    let { node: n, parent: o, grandparent: i, key: s } = e3, u = s !== "body" && (o.type === "IfStatement" || o.type === "WhileStatement" || o.type === "SwitchStatement" || o.type === "DoWhileStatement"), a = n.operator === "|>" && e3.root.extra?.__isUsingHackPipeline, c = pi2(e3, t, r3, false, u);
    if (u) return c;
    if (a) return p3(c);
    if (s === "callee" && Tt3(o) || o.type === "UnaryExpression" && !x4(n) || N3(o) && !o.computed) return p3([m3([y3, ...c]), y3]);
    let f = ut3(o) || o.type === "JSXExpressionContainer" && i.type === "JSXAttribute" || n.operator !== "|" && o.type === "JsExpressionRoot" || n.type !== "NGPipeExpression" && (o.type === "NGRoot" && t.parser === "__ng_binding" || o.type === "NGMicrosyntaxExpression" && i.type === "NGMicrosyntax" && i.body.length === 1) || n === o.body && o.type === "ArrowFunctionExpression" || n !== o.body && o.type === "ForStatement" || o.type === "ConditionalExpression" && !ut3(i) && !Tt3(i) || o.type === "TemplateLiteral" || s === "argument" && o.type === "UnaryExpression" || s === "arguments" && aa(o), E = o.type === "AssignmentExpression" || o.type === "VariableDeclarator" || o.type === "ClassProperty" || o.type === "PropertyDefinition" || o.type === "TSAbstractPropertyDefinition" || o.type === "ClassPrivateProperty" || Ge3(o), C3 = be3(n.left) && Lr2(n.operator, n.left.operator);
    if (f || Fr2(n) && !C3 || !Fr2(n) && E) return p3(c);
    if (c.length === 0) return "";
    let A = H4(n.right), D = c.findIndex((v3) => typeof v3 != "string" && !Array.isArray(v3) && v3.type === he3), P3 = c.slice(0, D === -1 ? 1 : D + 1), F3 = c.slice(P3.length, A ? -1 : void 0), I3 = /* @__PURE__ */ Symbol("logicalChain-" + ++Ef), k3 = p3([...P3, m3(F3)], { id: I3 });
    if (!A) return k3;
    let h = w3(0, c, -1);
    return p3([k3, ht3(h, { groupId: I3 })]);
  }
  function pi2(e3, t, r3, n, o) {
    let { node: i } = e3;
    if (!be3(i)) return [p3(r3())];
    let s = [];
    Lr2(i.operator, i.left.operator) ? s = e3.call(() => pi2(e3, t, r3, true, o), "left") : s.push(p3(r3("left")));
    let u = Fr2(i), a = i.right.type === "ChainExpression" ? i.right.expression : i.right, c = (i.type === "NGPipeExpression" || i.operator === "|>" || df(e3, t)) && !Oe3(t.originalText, a), E = !x4(a, g4.Leading, rr2) && Oe3(t.originalText, a), C3 = i.type === "NGPipeExpression" ? "|" : i.operator, A = i.type === "NGPipeExpression" && i.arguments.length > 0 ? p3(m3([y3, ": ", L3([T3, ": "], e3.map(() => Be3(2, p3(r3())), "arguments"))])) : "", D;
    if (u) D = [C3, Oe3(t.originalText, a) ? m3([T3, r3("right"), A]) : [" ", r3("right"), A]];
    else {
      let h = C3 === "|>" && e3.root.extra?.__isUsingHackPipeline ? e3.call(() => pi2(e3, t, r3, true, o), "right") : r3("right");
      if (t.experimentalOperatorPosition === "start") {
        let v3 = "";
        if (E) switch (Xe3(h)) {
          case Me3:
            v3 = h[0], h.shift();
            break;
          case Ne3:
            v3 = h.contents[0], h.contents.shift();
            break;
        }
        D = [T3, v3, C3, " ", h, A];
      } else D = [c ? T3 : "", C3, c ? " " : T3, h, A];
    }
    let { parent: P3 } = e3, F3 = x4(i.left, g4.Trailing | g4.Line);
    if ((F3 || !(o && i.type === "LogicalExpression") && P3.type !== i.type && i.left.type !== i.type && i.right.type !== i.type) && (D = p3(D, { shouldBreak: F3 })), t.experimentalOperatorPosition === "start" ? s.push(u || E ? " " : "", D) : s.push(c ? "" : " ", D), n && x4(i)) {
      let k3 = sr2(Q3(e3, s, t));
      return k3.type === Ue3 ? k3.parts : Array.isArray(k3) ? k3 : [k3];
    }
    return s;
  }
  function Fr2(e3) {
    return e3.type !== "LogicalExpression" ? false : !!(ie3(e3.right) && e3.right.properties.length > 0 || Y4(e3.right) && e3.right.elements.length > 0 || H4(e3.right));
  }
  var pa = (e3) => e3.type === "BinaryExpression" && e3.operator === "|";
  function df(e3, t) {
    return (t.parser === "__vue_expression" || t.parser === "__vue_ts_expression") && pa(e3.node) && !e3.hasAncestor((r3) => !pa(r3) && r3.type !== "JsExpressionRoot");
  }
  function la(e3, t, r3) {
    let { node: n } = e3;
    if (n.type.startsWith("NG")) switch (n.type) {
      case "NGRoot":
        return r3("node");
      case "NGPipeExpression":
        return Rn3(e3, t, r3);
      case "NGChainedExpression":
        return p3(L3([";", T3], e3.map(() => xf(e3) ? r3() : ["(", r3(), ")"], "expressions")));
      case "NGEmptyExpression":
        return "";
      case "NGMicrosyntax":
        return e3.map(() => [e3.isFirst ? "" : ca(e3) ? " " : [";", T3], r3()], "body");
      case "NGMicrosyntaxKey":
        return /^[$_a-z][\w$]*(?:-[$_a-z][\w$])*$/i.test(n.name) ? n.name : JSON.stringify(n.name);
      case "NGMicrosyntaxExpression":
        return [r3("expression"), n.alias === null ? "" : [" as ", r3("alias")]];
      case "NGMicrosyntaxKeyedExpression": {
        let { index: o, parent: i } = e3, s = ca(e3) || Cf(e3) || (o === 1 && (n.key.name === "then" || n.key.name === "else" || n.key.name === "as") || o === 2 && (n.key.name === "else" && i.body[o - 1].type === "NGMicrosyntaxKeyedExpression" && i.body[o - 1].key.name === "then" || n.key.name === "track")) && i.body[0].type === "NGMicrosyntaxExpression";
        return [r3("key"), s ? " " : ": ", r3("expression")];
      }
      case "NGMicrosyntaxLet":
        return ["let ", r3("key"), n.value === null ? "" : [" = ", r3("value")]];
      case "NGMicrosyntaxAs":
        return [r3("key"), " as ", r3("alias")];
      default:
        throw new it3(n, "Angular");
    }
  }
  function ca({ node: e3, index: t }) {
    return e3.type === "NGMicrosyntaxKeyedExpression" && e3.key.name === "of" && t === 1;
  }
  function Cf(e3) {
    let { node: t } = e3;
    return e3.parent.body[1].key.name === "of" && t.type === "NGMicrosyntaxKeyedExpression" && t.key.name === "track" && t.key.type === "NGMicrosyntaxKey";
  }
  var Ff = B3(["CallExpression", "OptionalCallExpression", "AssignmentExpression"]);
  function xf({ node: e3 }) {
    return _r3(e3, Ff);
  }
  function ci3(e3, t, r3) {
    let { node: n } = e3;
    return p3([L3(T3, e3.map(r3, "decorators")), fa(n, t) ? d : T3]);
  }
  function ma(e3, t, r3) {
    return Da(e3.node) ? [L3(d, e3.map(r3, "declaration", "decorators")), d] : "";
  }
  function Wn3(e3, t, r3) {
    let { node: n, parent: o } = e3, { decorators: i } = n;
    if (!j4(i) || Da(o) || Cr2(e3)) return "";
    let s = n.type === "ClassExpression" || n.type === "ClassDeclaration" || fa(n, t);
    return [e3.key === "declaration" && qi(o) ? d : s ? je3 : "", L3(T3, e3.map(r3, "decorators")), T3];
  }
  function fa(e3, t) {
    return e3.decorators.some((r3) => J3(t.originalText, S3(r3)));
  }
  function Da(e3) {
    if (e3.type !== "ExportDefaultDeclaration" && e3.type !== "ExportNamedDeclaration" && e3.type !== "DeclareExportDeclaration") return false;
    let t = e3.declaration?.decorators;
    return j4(t) && kt3(e3, t[0]);
  }
  function Jn3(e3) {
    return e3.type === "UnaryExpression" && (e3.operator === "+" || e3.operator === "-") && Ee3(e3.argument);
  }
  function xr2(e3, t, r3) {
    let { node: n } = e3, o = [], i = zt3(n) ? "elementTypes" : "elements", s = n[i];
    if (s.length === 0 && !n.inexact) o.push(p3(["[", Mt3(e3, t), "]"]));
    else {
      let u = w3(0, s, -1), a = u?.type !== "RestElement" && !n.inexact, c = u === null, f = /* @__PURE__ */ Symbol("array"), E = !t.__inJestEach && s.length > 1 && s.every((D, P3, F3) => {
        if (!Y4(D) && !ie3(D)) return false;
        let I3 = D?.type, k3 = F3[P3 + 1];
        if (k3 && I3 !== k3.type) return false;
        let h = Y4(D) ? "elements" : "properties";
        return D[h] && D[h].length > 1;
      }) || x4(n, g4.Dangling | g4.Line), C3 = li3(n, t), A = a ? c ? "," : gn3(t) ? C3 ? O3(",", "", { groupId: f }) : O3(",") : "" : "";
      o.push(p3(["[", m3([y3, C3 ? Tf(e3, t, r3, A) : [Af(e3, t, r3, i, n.inexact), A], W4(e3, t)]), y3, "]"], { shouldBreak: E, id: f }));
    }
    return o.push($3(e3), G4(e3, r3)), o;
  }
  function li3(e3, t) {
    return Y4(e3) && e3.elements.length > 0 && e3.elements.every((r3) => r3 && (Ee3(r3) || Jn3(r3) && !x4(r3.argument)) && !x4(r3, g4.Trailing | g4.Line, (n) => !J3(t.originalText, b3(n), { backwards: true })));
  }
  function ya({ node: e3 }, { originalText: t }) {
    let r3 = S3(e3);
    if (r3 === b3(e3)) return false;
    let { length: n } = t;
    for (; r3 < n && t[r3] !== ","; ) r3 = er2(t, tr2(t, r3 + 1));
    return Jt3(t, r3);
  }
  function Af(e3, t, r3, n, o) {
    let i = [];
    return e3.each(({ node: s, isLast: u }) => {
      i.push(s ? p3(r3()) : ""), (!u || o) && i.push([",", T3, s && ya(e3, t) ? y3 : ""]);
    }, n), o && i.push("..."), i;
  }
  function Tf(e3, t, r3, n) {
    let o = [];
    return e3.each(({ isLast: i, next: s }) => {
      o.push([r3(), i ? n : ","]), i || o.push(ya(e3, t) ? [d, d] : x4(s, g4.Leading | g4.Line) ? d : T3);
    }, "elements"), yn3(o);
  }
  function mi2(e3) {
    return e3.quasis.some((t) => t.value.raw.includes(`
`));
  }
  function Gn3(e3, t) {
    return (e3.type === "TemplateLiteral" && mi2(e3) || e3.type === "TaggedTemplateExpression" && mi2(e3.quasi)) && !J3(t, b3(e3), { backwards: true });
  }
  var gf = /* @__PURE__ */ new WeakMap();
  function Ea(e3) {
    return Z3(gf, e3, (t) => t.type === "ConditionalExpression" && !Ce3(t, (r3) => r3.type === "ObjectExpression"));
  }
  var hf = (e3) => e3.type === "SequenceExpression";
  function da(e3, t, r3, n = {}) {
    let o = [], i, s = [], u = false, a = !n.expandLastArg && e3.node.body.type === "ArrowFunctionExpression", c;
    (function I3() {
      let { node: k3 } = e3, h = Sf(e3, t, r3, n);
      if (o.length === 0) o.push(h);
      else {
        let { leading: v3, trailing: U3 } = Tn3(e3, t);
        o.push([v3, h]), s.unshift(U3);
      }
      a && (u || (u = k3.returnType && ee3(k3).length > 0 || k3.typeParameters || ee3(k3).some((v3) => v3.type !== "Identifier"))), !a || k3.body.type !== "ArrowFunctionExpression" ? (i = r3("body", n), c = k3.body) : e3.call(I3, "body");
    })();
    let f = !Oe3(t.originalText, c) && (hf(c) || Bf(c, i, t) || !u && Ea(c)), E = e3.key === "callee" && Dt3(e3.parent), C3 = /* @__PURE__ */ Symbol("arrow-chain"), A = bf(e3, n, { signatureDocs: o, shouldBreak: u }), D = false, P3 = false, F3 = false;
    return a && (E || n.assignmentLayout) && (P3 = true, F3 = !x4(e3.node, g4.Leading & g4.Line), D = n.assignmentLayout === "chain-tail-arrow-chain" || E && !f), i = Pf(e3, t, n, { bodyDoc: i, bodyComments: s, functionBody: c, shouldPutBodyOnSameLine: f }), p3([p3(P3 ? m3([F3 ? y3 : "", A]) : A, { shouldBreak: D, id: C3 }), " =>", a ? ht3(i, { groupId: C3 }) : p3(i), a && E ? O3(y3, "", { groupId: C3 }) : ""]);
  }
  function Sf(e3, t, r3, n) {
    let { node: o } = e3, i = [];
    if (o.async && i.push("async "), kn3(e3, t)) i.push(r3(["params", 0]));
    else {
      let u = n.expandLastArg || n.expandFirstArg, a = wn3(e3, r3);
      if (u) {
        if (ue3(a)) throw new St3();
        a = p3(Wt3(a));
      }
      i.push(p3([Ke3(e3, t, r3, u, true), a]));
    }
    let s = W4(e3, t, { marker: "commentBeforeArrow" });
    return s && i.push(" ", s), i;
  }
  function Bf(e3, t, r3) {
    return Y4(e3) || ie3(e3) || e3.type === "ArrowFunctionExpression" || e3.type === "DoExpression" || e3.type === "BlockStatement" || H4(e3) || t.label?.hug !== false && (t.label?.embed || Gn3(e3, r3.originalText));
  }
  function bf(e3, t, { signatureDocs: r3, shouldBreak: n }) {
    if (r3.length === 1) return r3[0];
    let { parent: o, key: i } = e3;
    return i !== "callee" && Dt3(o) || be3(o) ? p3([r3[0], " =>", m3([T3, L3([" =>", T3], r3.slice(1))])], { shouldBreak: n }) : i === "callee" && Dt3(o) || t.assignmentLayout ? p3(L3([" =>", T3], r3), { shouldBreak: n }) : p3(m3(L3([" =>", T3], r3)), { shouldBreak: n });
  }
  function Pf(e3, t, r3, { bodyDoc: n, bodyComments: o, functionBody: i, shouldPutBodyOnSameLine: s }) {
    let { node: u, parent: a } = e3, c = r3.expandLastArg ? Ie3(t, "all") : "", f = (r3.expandLastArg || a.type === "JSXExpressionContainer") && !x4(u) ? y3 : "";
    return s && Ea(i) ? [" ", p3([O3("", "("), m3([y3, n]), O3("", ")"), c, f]), o] : s ? [" ", n, o] : [m3([T3, n, o]), c, f];
  }
  var If = 0.25;
  function Wr2(e3, t) {
    let { printWidth: r3 } = t;
    if (x4(e3)) return false;
    let n = r3 * If;
    if (e3.type === "ThisExpression" || e3.type === "Identifier" && e3.name.length <= n || Jn3(e3) && !x4(e3.argument)) return true;
    let o = e3.type === "Literal" && "regex" in e3 && e3.regex.pattern || e3.type === "RegExpLiteral" && e3.pattern;
    return o ? o.length <= n : q3(e3) ? ot3(ye3(e3), t).length <= n : e3.type === "TemplateLiteral" ? e3.expressions.length === 0 && e3.quasis[0].value.raw.length <= n && !e3.quasis[0].value.raw.includes(`
`) : e3.type === "UnaryExpression" ? Wr2(e3.argument, { printWidth: r3 }) : e3.type === "CallExpression" && e3.arguments.length === 0 && e3.callee.type === "Identifier" ? e3.callee.name.length <= n - 2 : Zt3(e3);
  }
  function Nt3(e3) {
    return N3(e3) || e3.type === "BindExpression" && !!e3.object;
  }
  function Ca(e3) {
    if (e3.length <= 1) return false;
    let t = 0;
    for (let r3 of e3) if (wt3(r3)) {
      if (t += 1, t > 1) return true;
    } else if (r3 = Pe3(r3), M3(r3)) {
      for (let n of se3(r3)) if (wt3(n)) return true;
    }
    return false;
  }
  function Un3(e3) {
    let { node: t, parent: r3, key: n } = e3;
    return n === "callee" && M3(t) && M3(r3) && r3.arguments.length > 0 && t.arguments.length > r3.arguments.length;
  }
  var kf = /* @__PURE__ */ new Set(["!", "-", "+", "~"]);
  var wf = B3(["Identifier", "ThisExpression", "Super", "PrivateName", "PrivateIdentifier"]);
  function st3(e3, t = 2) {
    if (t <= 0) return false;
    let r3 = (n) => st3(n, t - 1);
    if (e3 = Pe3(e3), Xr2(e3)) return dt3(e3.pattern ?? e3.regex.pattern) <= 5;
    if (Zt3(e3) || wf(e3) || e3.type === "ArgumentPlaceholder") return true;
    if (e3.type === "TemplateLiteral") return e3.quasis.every((n) => !n.value.raw.includes(`
`)) && e3.expressions.every(r3);
    if (ie3(e3)) return e3.properties.every((n) => !n.computed && (n.shorthand || n.value && r3(n.value)));
    if (Y4(e3)) return e3.elements.every((n) => n === null || r3(n));
    if (Dt3(e3)) {
      if (e3.type === "ImportExpression" || st3(e3.callee, t)) {
        let n = se3(e3);
        return n.length <= t && n.every(r3);
      }
      return false;
    }
    return N3(e3) ? st3(e3.object, t) && st3(e3.property, t) : e3.type === "UnaryExpression" && kf.has(e3.operator) || e3.type === "UpdateExpression" ? st3(e3.argument, t) : false;
  }
  function Lf(e3, t, r3) {
    let { node: n } = e3, o = se3(n);
    if (o.length === 0) return p3(["(", Mt3(e3, t), ")"]);
    let i = o.length - 1;
    if (_f(o)) {
      let E = ["("];
      return kr2(e3, (C3, A) => {
        E.push(r3()), A !== i && E.push(", ");
      }), E.push(")"), E;
    }
    let s = false, u = [];
    kr2(e3, ({ node: E }, C3) => {
      let A = r3();
      C3 === i || (me3(E, t) ? (s = true, A = [A, ",", d, d]) : A = [A, ",", T3]), u.push(A);
    });
    let a = e3.root.type !== "NGRoot" && n.type !== "ImportExpression" && n.type !== "TSImportType" && n.type !== "TSExternalModuleReference" ? Ie3(t, "all") : "";
    function c() {
      return p3(["(", m3([T3, ...u]), a, T3, ")"], { shouldBreak: true });
    }
    if (s || e3.parent.type !== "Decorator" && Ca(o)) return c();
    if (Mf(o)) {
      let E = u.slice(1);
      if (E.some(ue3)) return c();
      let C3;
      try {
        C3 = r3(go2(n, 0), { expandFirstArg: true });
      } catch (A) {
        if (A instanceof St3) return c();
        throw A;
      }
      return ue3(C3) ? [je3, mt3([["(", p3(C3, { shouldBreak: true }), ", ", ...E, ")"], c()])] : mt3([["(", C3, ", ", ...E, ")"], ["(", p3(C3, { shouldBreak: true }), ", ", ...E, ")"], c()]);
    }
    if (Of(o, u, t)) {
      let E = u.slice(0, -1);
      if (E.some(ue3)) return c();
      let C3;
      try {
        C3 = r3(go2(n, -1), { expandLastArg: true });
      } catch (A) {
        if (A instanceof St3) return c();
        throw A;
      }
      return ue3(C3) ? [je3, mt3([["(", ...E, p3(C3, { shouldBreak: true }), ")"], c()])] : mt3([["(", ...E, C3, ")"], ["(", ...E, p3(C3, { shouldBreak: true }), ")"], c()]);
    }
    let f = ["(", m3([y3, ...u]), a, y3, ")"];
    return Un3(e3) ? f : p3(f, { shouldBreak: u.some(ue3) || s });
  }
  function qn3(e3, t = false) {
    if (ie3(e3) && (e3.properties.length > 0 || x4(e3)) || Y4(e3) && (e3.elements.length > 0 || x4(e3)) || (de2(e3) || e3.type === "TSTypeAssertion") && qn3(e3.expression) || e3.type === "FunctionExpression" || e3.type === "DoExpression" || e3.type === "ModuleExpression") return true;
    if (e3.type === "ArrowFunctionExpression") {
      let { body: r3 } = e3;
      if (r3.type === "BlockStatement" || H4(r3) || ie3(r3) || Y4(r3) || r3.type === "ArrowFunctionExpression" && qn3(r3, true) || !t && (r3.type === "ConditionalExpression" || M3(Pe3(r3)))) return true;
    }
    return false;
  }
  function Of(e3, t, r3) {
    if (e3.length === 1) {
      let i = w3(0, t, -1);
      if (i.label?.embed && i.label?.hug !== false) return true;
    }
    let n = w3(0, e3, -1), o = w3(0, e3, -2);
    return !x4(n, g4.Leading) && !x4(n, g4.Trailing) && qn3(n) && (!o || o.type !== n.type) && (e3.length !== 2 || o.type !== "ArrowFunctionExpression" || !Y4(n)) && !(e3.length > 1 && li3(n, r3));
  }
  function Mf(e3) {
    if (e3.length !== 2) return false;
    let [t, r3] = e3;
    return t.type === "ModuleExpression" && Nf(r3) ? true : !x4(t) && (t.type === "FunctionExpression" || t.type === "ArrowFunctionExpression" && t.body.type === "BlockStatement") && r3.type !== "FunctionExpression" && r3.type !== "ArrowFunctionExpression" && r3.type !== "ConditionalExpression" && xa(r3) && !qn3(r3);
  }
  function xa(e3) {
    if (e3.type === "ParenthesizedExpression") return xa(e3.expression);
    if (de2(e3) || e3.type === "TypeCastExpression") {
      let { typeAnnotation: t } = e3;
      if (t.type === "TypeAnnotation" && (t = t.typeAnnotation), t.type === "TSArrayType" && (t = t.elementType, t.type === "TSArrayType" && (t = t.elementType)), t.type === "GenericTypeAnnotation" || t.type === "TSTypeReference") {
        let r3 = t.type === "GenericTypeAnnotation" ? t.typeParameters : t.typeArguments;
        r3?.params.length === 1 && (t = r3.params[0]);
      }
      return pr2(t) && st3(e3.expression, 1);
    }
    return Dt3(e3) && se3(e3).length > 1 ? false : be3(e3) ? st3(e3.left, 1) && st3(e3.right, 1) : Xr2(e3) || st3(e3);
  }
  function _f(e3) {
    return e3.length === 2 ? Fa(e3, 0) : e3.length === 3 ? e3[0].type === "Identifier" && Fa(e3, 1) : false;
  }
  function Fa(e3, t) {
    let r3 = e3[t], n = e3[t + 1];
    return r3.type === "ArrowFunctionExpression" && ee3(r3).length === 0 && r3.body.type === "BlockStatement" && n.type === "ArrayExpression" && e3.every((o) => !x4(o));
  }
  function Nf(e3) {
    if (!(e3.type === "ObjectExpression" && e3.properties.length === 1)) return false;
    let [t] = e3.properties;
    return Ge3(t) ? !t.computed && (t.key.type === "Identifier" && t.key.name === "type" || q3(t.key) && t.key.value === "type") && q3(t.value) && t.value.value === "module" : false;
  }
  var Jr2 = Lf;
  function Aa(e3, t, r3) {
    return [r3("object"), p3(m3([y3, fi3(e3, t, r3)]))];
  }
  function fi3(e3, t, r3) {
    return ["::", r3("callee")];
  }
  var jf = (e3) => M3(e3) && se3(e3).length > 0;
  function vf(e3) {
    let { node: t, ancestors: r3 } = e3;
    for (let n of r3) {
      if (!(N3(n) && n.object === t || n.type === "TSNonNullExpression" && n.expression === t)) return n.type === "NewExpression" && n.callee === t;
      t = n;
    }
    return false;
  }
  function Ta(e3, t, r3) {
    let n = r3("object"), o = Di2(e3, t, r3), { node: i } = e3, s = e3.findAncestor((c) => !(N3(c) || c.type === "TSNonNullExpression")), u = e3.findAncestor((c) => !We3(c)), a = s.type === "BindExpression" || s.type === "AssignmentExpression" && s.left.type !== "Identifier" || vf(e3) || i.computed || i.object.type === "Identifier" && i.property.type === "Identifier" && !N3(u) || (u.type === "AssignmentExpression" || u.type === "VariableDeclarator") && (jf(Pe3(i.object)) || n.label?.memberChain);
    return Et3(n.label, [n, xe3, a ? o : p3(m3([y3, o]))]);
  }
  function Di2(e3, t, r3) {
    let n = r3("property"), { node: o } = e3, i = $3(e3);
    return o.computed ? !o.property || Ee3(o.property) ? [i, "[", n, "]"] : p3([i, "[", m3([y3, n]), y3, "]"]) : [i, ".", n];
  }
  function Rf(e3, t, r3) {
    let n = (e3.parent.type === "ChainExpression" ? e3.grandparent : e3.parent).type === "ExpressionStatement", o = [];
    function i(_3) {
      let { originalText: Te3 } = t, we3 = Rt3(Te3, S3(_3));
      return Te3.charAt(we3) === ")" ? we3 !== false && Jt3(Te3, we3 + 1) : me3(_3, t);
    }
    function s() {
      let { node: _3 } = e3;
      if (M3(_3) && (Nt3(_3.callee) || M3(_3.callee)) && !oe3(e3, t)) {
        let Te3 = i(_3);
        o.unshift({ node: _3, hasTrailingEmptyLine: Te3, printed: [Q3(e3, [$3(e3), r3("typeArguments"), Jr2(e3, t, r3)], t), Te3 ? d : ""] }), e3.call(s, "callee");
      } else Nt3(_3) && !oe3(e3, t) ? (o.unshift({ node: _3, printed: Q3(e3, N3(_3) ? Di2(e3, t, r3) : fi3(e3, t, r3), t) }), e3.call(s, "object")) : _3.type === "ChainExpression" && !oe3(e3, t) ? e3.call(s, "expression") : _3.type === "TSNonNullExpression" && !oe3(e3, t) ? (o.unshift({ node: _3, printed: Q3(e3, "!", t) }), e3.call(s, "expression")) : o.unshift({ node: _3, printed: r3() });
    }
    let { node: u } = e3;
    o.unshift({ node: u, printed: [$3(e3), r3("typeArguments"), Jr2(e3, t, r3)] }), u.callee && e3.call(s, "callee");
    let a = [], c = [o[0]], f = 1;
    for (; f < o.length && (o[f].node.type === "TSNonNullExpression" || o[f].node.type === "ChainExpression" || M3(o[f].node) || N3(o[f].node) && o[f].node.computed && Ee3(o[f].node.property)); ++f) c.push(o[f]);
    if (!M3(o[0].node)) for (; f + 1 < o.length && (Nt3(o[f].node) && Nt3(o[f + 1].node)); ++f) c.push(o[f]);
    a.push(c), c = [];
    let E = false;
    for (; f < o.length; ++f) {
      if (E && Nt3(o[f].node)) {
        if (o[f].node.computed && Ee3(o[f].node.property)) {
          c.push(o[f]);
          continue;
        }
        a.push(c), c = [], E = false;
      }
      (M3(o[f].node) || o[f].node.type === "ImportExpression") && (E = true), c.push(o[f]), x4(o[f].node, g4.Trailing) && (a.push(c), c = [], E = false);
    }
    c.length > 0 && a.push(c);
    function C3(_3) {
      return /^[A-Z]|^[$_]+$/.test(_3);
    }
    function A(_3) {
      return _3.length <= t.tabWidth;
    }
    function D(_3) {
      let Te3 = _3[1][0]?.node.computed;
      if (_3[0].length === 1) {
        let Pt3 = _3[0][0].node;
        return Pt3.type === "ThisExpression" || Pt3.type === "Identifier" && (C3(Pt3.name) || n && A(Pt3.name) || Te3);
      }
      let we3 = w3(0, _3[0], -1).node;
      return N3(we3) && we3.property.type === "Identifier" && (C3(we3.property.name) || Te3);
    }
    let P3 = a.length >= 2 && !x4(a[1][0].node) && D(a);
    function F3(_3) {
      return _3.map((Te3) => Te3.printed);
    }
    function I3(_3) {
      return _3.length === 0 ? "" : m3([d, L3(d, _3.map(F3))]);
    }
    let k3 = a.map(F3), h = k3, v3 = P3 ? 3 : 2, U3 = a.flat(), ae3 = U3.slice(1, -1).some((_3) => x4(_3.node, g4.Leading)) || U3.slice(0, -1).some((_3) => x4(_3.node, g4.Trailing)) || a[v3] && x4(a[v3][0].node, g4.Leading);
    if (a.length <= v3 && !ae3 && a.every((_3) => !w3(0, _3, -1).hasTrailingEmptyLine)) return Un3(e3) ? h : p3(h);
    let fe3 = w3(0, a[P3 ? 1 : 0], -1).node, z4 = !M3(fe3) && i(fe3), Ae3 = [F3(a[0]), P3 ? a.slice(1, 2).map(F3) : "", z4 ? d : "", I3(a.slice(P3 ? 2 : 1))], De3 = o.map(({ node: _3 }) => _3).filter(M3);
    function xt3() {
      let _3 = w3(0, w3(0, a, -1), -1).node, Te3 = w3(0, k3, -1);
      return M3(_3) && ue3(Te3) && De3.slice(0, -1).some((we3) => we3.arguments.some(wt3));
    }
    let bt3;
    return ae3 || De3.length > 2 && De3.some((_3) => _3.arguments.some((Te3) => !st3(Te3))) || k3.slice(0, -1).some(ue3) || xt3() ? bt3 = p3(Ae3) : bt3 = [ue3(h) || z4 ? je3 : "", mt3([h, Ae3])], Et3({ memberChain: true }, bt3);
  }
  var ga = Rf;
  function Xt3(e3, t, r3) {
    let { node: n } = e3, o = n.type === "NewExpression", i = $3(e3), s = se3(n), u = n.type !== "TSImportType" && n.typeArguments ? [r3("typeArguments"), xe3] : "", a = s.length === 1 && Gn3(s[0], t.originalText);
    if (a || Jf(e3) || Gf(e3) || Gt3(n, e3.parent)) {
      let E = [];
      if (kr2(e3, () => {
        E.push(r3());
      }), !(a && E[0].label?.embed)) return [ha(e3, r3), i, u, "(", L3(", ", E), ")"];
    }
    let c = n.type === "ImportExpression" || n.type === "TSImportType" || n.type === "TSExternalModuleReference";
    if (!c && !o && Nt3(n.callee) && !e3.call(() => oe3(e3, t), "callee", ...n.callee.type === "ChainExpression" ? ["expression"] : [])) return ga(e3, t, r3);
    let f = [ha(e3, r3), i, u, Jr2(e3, t, r3)];
    return c || M3(n.callee) ? p3(f) : f;
  }
  function ha(e3, t) {
    let { node: r3 } = e3;
    return r3.type === "ImportExpression" ? `import${r3.phase ? `.${r3.phase}` : ""}` : r3.type === "TSImportType" ? "import" : r3.type === "TSExternalModuleReference" ? "require" : [r3.type === "NewExpression" ? "new " : "", t("callee"), xe3];
  }
  var Wf = ["require", "require.resolve", "require.resolve.paths", "import.meta.resolve"];
  function Jf(e3) {
    let { node: t } = e3;
    if (!(t.type === "ImportExpression" || t.type === "TSImportType" || t.type === "TSExternalModuleReference" || t.type === "CallExpression" && !t.optional && cr2(t.callee, Wf))) return false;
    let r3 = se3(t);
    return r3.length === 1 && q3(r3[0]) && !x4(r3[0]);
  }
  function Gf(e3) {
    let { node: t } = e3;
    if (t.type !== "CallExpression" || t.optional || t.callee.type !== "Identifier") return false;
    let r3 = se3(t);
    return t.callee.name === "require" ? (r3.length === 1 && q3(r3[0]) || r3.length > 1) && !x4(r3[0]) : t.callee.name === "define" && e3.parent.type === "ExpressionStatement" ? r3.length === 1 || r3.length === 2 && r3[0].type === "ArrayExpression" || r3.length === 3 && q3(r3[0]) && r3[1].type === "ArrayExpression" : false;
  }
  function jt3(e3, t, r3, n, o, i) {
    let s = Uf(e3, t, r3, n, i), u = i ? r3(i, { assignmentLayout: s }) : "";
    switch (s) {
      case "break-after-operator":
        return p3([p3(n), o, p3(m3([T3, u]))]);
      case "never-break-after-operator":
        return p3([p3(n), o, " ", u]);
      case "fluid": {
        let a = /* @__PURE__ */ Symbol("assignment");
        return p3([p3(n), o, p3(m3(T3), { id: a }), xe3, ht3(u, { groupId: a })]);
      }
      case "break-lhs":
        return p3([n, o, " ", p3(u)]);
      case "chain":
        return [p3(n), o, T3, u];
      case "chain-tail":
        return [p3(n), o, m3([T3, u])];
      case "chain-tail-arrow-chain":
        return [p3(n), o, u];
      case "only-left":
        return n;
    }
  }
  function ba(e3, t, r3) {
    let { node: n } = e3;
    return jt3(e3, t, r3, r3("left"), [" ", n.operator], "right");
  }
  function Pa(e3, t, r3) {
    return jt3(e3, t, r3, r3("id"), " =", "init");
  }
  function Uf(e3, t, r3, n, o) {
    let { node: i } = e3, s = i[o];
    if (!s) return "only-left";
    let u = !Yn3(s);
    if (e3.match(Yn3, Ia, (C3) => !u || C3.type !== "ExpressionStatement" && C3.type !== "VariableDeclaration")) return u ? s.type === "ArrowFunctionExpression" && s.body.type === "ArrowFunctionExpression" ? "chain-tail-arrow-chain" : "chain-tail" : "chain";
    if (!u && Yn3(s.right) || pe3(s) && !Yt3(s) || Oe3(t.originalText, s) || x4(s, g4.Leading, vn3)) return "break-after-operator";
    if (i.type === "ImportAttribute" || s.type === "CallExpression" && s.callee.name === "require" || e3.root.type === "JsonRoot") return "never-break-after-operator";
    let f = Ns(n);
    if (Yf(i) || Vf(i) || yi2(i) && f) return "break-lhs";
    let E = Kf(i, n, t);
    return e3.call(() => qf(e3, t, r3, E), o) ? "break-after-operator" : Hf(i) ? "break-lhs" : !f && (E || s.type === "TemplateLiteral" || s.type === "TaggedTemplateExpression" || Gi(s) || Ee3(s) || s.type === "ClassExpression") ? "never-break-after-operator" : "fluid";
  }
  function qf(e3, t, r3, n) {
    let o = e3.node;
    if (be3(o) && !Fr2(o)) return true;
    switch (o.type) {
      case "StringLiteralTypeAnnotation":
      case "SequenceExpression":
        return true;
      case "TSConditionalType":
      case "ConditionalTypeAnnotation":
        if (!t.experimentalTernaries && !Qf(o)) break;
        return true;
      case "ConditionalExpression": {
        if (!t.experimentalTernaries) {
          let { test: c } = o;
          return be3(c) && !Fr2(c);
        }
        let { consequent: u, alternate: a } = o;
        return u.type === "ConditionalExpression" || a.type === "ConditionalExpression";
      }
      case "ClassExpression":
        return j4(o.decorators);
    }
    if (n) return false;
    let i = o, s = [];
    for (; ; ) if (i.type === "UnaryExpression" || i.type === "AwaitExpression" || i.type === "YieldExpression" && i.argument !== null) i = i.argument, s.push("argument");
    else if (i.type === "TSNonNullExpression") i = i.expression, s.push("expression");
    else break;
    return !!(q3(i) || e3.call(() => ka(e3, t, r3), ...s));
  }
  function Yf(e3) {
    if (Ia(e3)) {
      let t = e3.left || e3.id;
      return t.type === "ObjectPattern" && t.properties.length > 2 && t.properties.some((r3) => Ge3(r3) && (!r3.shorthand || r3.value?.type === "AssignmentPattern"));
    }
    return false;
  }
  function Yn3(e3) {
    return e3.type === "AssignmentExpression";
  }
  function Ia(e3) {
    return Yn3(e3) || e3.type === "VariableDeclarator";
  }
  function Hf(e3) {
    let t = Xf(e3);
    if (j4(t)) {
      let r3 = e3.type === "TSTypeAliasDeclaration" ? "constraint" : "bound";
      if (t.length > 1 && t.some((n) => n[r3] || n.default)) return true;
    }
    return false;
  }
  function Xf(e3) {
    if (Vr2(e3)) return e3.typeParameters?.params;
  }
  function Vf(e3) {
    if (e3.type !== "VariableDeclarator") return false;
    let { typeAnnotation: t } = e3.id;
    if (!t || !t.typeAnnotation) return false;
    let r3 = Sa(t.typeAnnotation);
    return j4(r3) && r3.length > 1 && r3.some((n) => j4(Sa(n)) || n.type === "TSConditionalType");
  }
  function yi2(e3) {
    return e3.type === "VariableDeclarator" && e3.init?.type === "ArrowFunctionExpression";
  }
  function Sa(e3) {
    let t;
    switch (e3.type) {
      case "GenericTypeAnnotation":
        t = e3.typeParameters;
        break;
      case "TSTypeReference":
        t = e3.typeArguments;
        break;
    }
    return t?.params;
  }
  function ka(e3, t, r3, n = false) {
    let { node: o } = e3, i = () => ka(e3, t, r3, true);
    if (We3(o)) return e3.call(i, "expression");
    if (M3(o)) {
      if (Xt3(e3, t, r3).label?.memberChain) return false;
      let u = se3(o);
      return !(u.length === 0 || u.length === 1 && Wr2(u[0], t)) || $f(o, r3) ? false : e3.call(i, "callee");
    }
    return N3(o) ? e3.call(i, "object") : n && (o.type === "Identifier" || o.type === "ThisExpression");
  }
  function Kf(e3, t, r3) {
    return Ge3(e3) ? (t = sr2(t), typeof t == "string" && dt3(t) < r3.tabWidth + 3) : false;
  }
  function $f(e3, t) {
    let r3 = e3.typeArguments?.params;
    if (j4(r3)) {
      if (r3.length > 1) return true;
      if (r3.length === 1) {
        let n = r3[0];
        if (pe3(n) || At3(n) || n.type === "TSTypeLiteral" || n.type === "ObjectTypeAnnotation") return true;
      }
      if (ue3(t("typeArguments"))) return true;
    }
    return false;
  }
  function Ba(e3) {
    switch (e3.type) {
      case "FunctionTypeAnnotation":
      case "GenericTypeAnnotation":
      case "TSFunctionType":
        return !!e3.typeParameters;
      case "TSTypeReference":
        return !!e3.typeArguments;
      default:
        return false;
    }
  }
  function Qf(e3) {
    return Ba(e3.checkType) || Ba(e3.extendsType);
  }
  function wa(e3, t, r3) {
    let { node: n } = e3, o = ["await"];
    if (n.argument) {
      o.push(" ", r3("argument"));
      let { parent: i } = e3;
      if (M3(i) && i.callee === n || N3(i) && i.object === n) {
        o = [m3([y3, ...o]), y3];
        let s = e3.findAncestor((u) => u.type === "AwaitExpression" || u.type === "BlockStatement");
        if (s?.type !== "AwaitExpression" || !Ce3(s.argument, (u) => u === n)) return p3(o);
      }
    }
    return o;
  }
  var zf = Array.prototype.findLast ?? function(e3) {
    for (let t = this.length - 1; t >= 0; t--) {
      let r3 = this[t];
      if (e3(r3, t, this)) return r3;
    }
  };
  var Zf = $t3("findLast", function() {
    if (Array.isArray(this)) return zf;
  });
  var La = Zf;
  function Gr2(e3, t, r3, n) {
    let { node: o } = e3, i = [], s = La(0, o[n], (u) => u.type !== "EmptyStatement");
    return e3.each(({ node: u }) => {
      u.type !== "EmptyStatement" && (i.push(r3()), u !== s && (i.push(d), me3(u, t) && i.push(d)));
    }, n), i;
  }
  function Hn3(e3, t, r3) {
    let n = eD(e3, t, r3), { node: o, parent: i } = e3;
    if (o.type === "Program" && i?.type !== "ModuleExpression") return n ? [n, d] : "";
    let s = [];
    if (o.type === "StaticBlock" && s.push("static "), s.push("{"), n) s.push(m3([d, n]), d);
    else {
      let u = e3.grandparent;
      i.type === "ArrowFunctionExpression" || i.type === "FunctionExpression" || i.type === "FunctionDeclaration" || i.type === "ComponentDeclaration" || i.type === "HookDeclaration" || i.type === "ObjectMethod" || i.type === "ClassMethod" || i.type === "ClassPrivateMethod" || i.type === "ForStatement" || i.type === "WhileStatement" || i.type === "DoWhileStatement" || i.type === "DoExpression" || i.type === "ModuleExpression" || i.type === "CatchClause" && !u.finalizer || i.type === "TSModuleDeclaration" || i.type === "DeclareModule" || i.type === "MatchStatementCase" || o.type === "StaticBlock" || s.push(d);
    }
    return s.push("}"), s;
  }
  function eD(e3, t, r3) {
    let { node: n } = e3, o = j4(n.directives), i = n.body.some((a) => a.type !== "EmptyStatement"), s = x4(n, g4.Dangling);
    if (!o && !i && !s) return "";
    let u = [];
    return o && (u.push(Gr2(e3, t, r3, "directives")), (i || s) && (u.push(d), me3(w3(0, n.directives, -1), t) && u.push(d))), i && u.push(Gr2(e3, t, r3, "body")), s && u.push(W4(e3, t)), u;
  }
  function tD(e3) {
    let t = /* @__PURE__ */ new WeakMap();
    return (r3) => Z3(t, r3, () => Symbol(e3));
  }
  var Oa = tD;
  var Ma = ["properties", "indexers", "callProperties", "internalSlots"];
  function _a5(e3, t) {
    let { node: r3 } = e3;
    if (r3.type === "ClassBody" || r3.type === "TSInterfaceBody") {
      e3.each(t, "body");
      return;
    }
    if (r3.type === "TSTypeLiteral") {
      e3.each(t, "members");
      return;
    }
    if (r3.type === "RecordDeclarationBody") {
      e3.each(t, "elements");
      return;
    }
    if (r3.type === "ObjectTypeAnnotation") {
      let n = Ma.flatMap((o) => e3.map(({ node: i, index: s }) => ({ node: i, loc: b3(i), selector: [o, s] }), o)).sort((o, i) => o.loc - i.loc);
      for (let [o, { node: i, selector: s }] of n.entries()) e3.call(() => t({ node: i, next: n[o + 1]?.node, isLast: o === n.length - 1 }), ...s);
    }
  }
  function Na(e3) {
    if (e3.type === "ObjectTypeAnnotation") return Ma.some((r3) => j4(e3[r3]));
    let t = e3.type === "RecordDeclarationBody" ? e3.elements : e3.body;
    return j4(t);
  }
  function Vt3(e3, t, r3) {
    let { node: n } = e3, o = [], i = n.type === "ObjectTypeAnnotation", s = n.type === "RecordDeclarationBody", u = !va(e3), a = u ? T3 : d, c = x4(n, g4.Dangling), [f, E] = i && n.exact ? ["{|", "|}"] : "{}", C3 = true, A;
    if (_a5(e3, ({ node: D, next: P3, isLast: F3 }) => {
      if (A ?? (A = D), C3 && (C3 = false), o.push(r3()), !s && u && i) {
        let { parent: I3 } = e3;
        I3.inexact || !F3 ? o.push(",") : o.push(Ie3(t));
      }
      s && D.type !== "MethodDefinition" && o.push(","), !s && !u && (rD({ node: D, next: P3 }, t) || Wa({ node: D, next: P3 }, t)) && o.push(";"), F3 || (o.push(a), me3(D, t) && o.push(d));
    }), c && o.push(W4(e3, t)), n.type === "ObjectTypeAnnotation" && n.inexact) {
      C3 && (C3 = false);
      let D;
      x4(n, g4.Dangling) ? D = [x4(n, g4.Line) || J3(t.originalText, S3(w3(0, re3(n), -1))) ? d : T3, "..."] : D = [A ? T3 : "", "..."], o.push(D);
    }
    if (u) {
      let D = x4(n, g4.Dangling | g4.Line) || t.objectWrap === "preserve" && A && te3(t.originalText, b3(n), b3(A)), P3;
      if (o.length === 0) P3 = f + E;
      else {
        let F3 = !t.bracketSpacing || C3 && !D ? y3 : T3;
        P3 = [f, m3([F3, ...o]), F3, E];
      }
      return e3.match(void 0, (F3, I3) => I3 === "typeAnnotation", (F3, I3) => I3 === "typeAnnotation", qt3) || e3.match(void 0, (F3, I3) => F3.type === "FunctionTypeParam" && I3 === "typeAnnotation", qt3) ? P3 : p3(P3, { shouldBreak: D });
    }
    return [f, o.length > 0 ? [m3([d, o]), d] : "", E];
  }
  function va(e3) {
    let { node: t } = e3;
    if (t.type === "ObjectTypeAnnotation") {
      let { key: r3, parent: n } = e3;
      return r3 === "body" && (n.type === "InterfaceDeclaration" || n.type === "DeclareInterface" || n.type === "DeclareClass");
    }
    return t.type === "ClassBody" || t.type === "TSInterfaceBody" || t.type === "RecordDeclarationBody";
  }
  function ke3(e3, t) {
    let { parent: r3 } = e3;
    return e3.callParent(va) ? r3.type === "ObjectTypeAnnotation" ? ";" : R3(t) : r3.type === "TSTypeLiteral" ? e3.isLast ? t.semi ? O3(";") : "" : t.semi || Wa({ node: e3.node, next: e3.next }, t) ? ";" : O3("", ";") : "";
  }
  var ja = B3(["ClassProperty", "PropertyDefinition", "ClassPrivateProperty", "ClassAccessorProperty", "AccessorProperty", "TSAbstractPropertyDefinition", "TSAbstractAccessorProperty"]);
  var Ra = (e3) => {
    if (e3.computed || e3.typeAnnotation) return false;
    let { type: t, name: r3 } = e3.key;
    return t === "Identifier" && (r3 === "static" || r3 === "get" || r3 === "set");
  };
  function rD({ node: e3, next: t }, r3) {
    if (r3.semi || !ja(e3)) return false;
    if (!e3.value && Ra(e3)) return true;
    if (!t || t.static || t.accessibility || t.readonly) return false;
    if (!t.computed) {
      let n = t.key?.name;
      if (n === "in" || n === "instanceof") return true;
    }
    if (ja(t) && !t.static && t.variance && !t.declare) return true;
    switch (t.type) {
      case "ClassProperty":
      case "PropertyDefinition":
      case "TSAbstractPropertyDefinition":
        return t.computed;
      case "MethodDefinition":
      case "TSAbstractMethodDefinition":
      case "ClassMethod":
      case "ClassPrivateMethod": {
        if ((t.value ? t.value.async : t.async) || t.kind === "get" || t.kind === "set") return false;
        let o = t.value ? t.value.generator : t.generator;
        return !!(t.computed || o);
      }
      case "TSIndexSignature":
        return true;
    }
    return false;
  }
  var nD = B3(["TSPropertySignature"]);
  function Wa({ node: e3, next: t }, r3) {
    return r3.semi || !nD(e3) ? false : Ra(e3) ? true : t && t.type === "TSCallSignatureDeclaration" ? !(e3.type === "TSPropertySignature" && e3.typeAnnotation) : false;
  }
  var oD = Oa("heritageGroup");
  var iD = B3(["TSInterfaceDeclaration", "DeclareInterface", "InterfaceDeclaration", "InterfaceTypeAnnotation"]);
  function Ar2(e3, t, r3) {
    let n = sD(e3, t, r3), { node: o } = e3;
    if (o.type === "ClassExpression" && j4(o.decorators)) {
      let i = Wn3(e3, t, r3);
      return oe3(e3, t) ? [m3([y3, i, n]), y3] : [i, n];
    }
    return n;
  }
  function sD(e3, t, r3) {
    let { node: n } = e3, o = iD(n), i = n.type === "RecordDeclaration", s = o ? "interface" : i ? "record" : "class", u = [ne3(e3), lr(e3), s], a = Ga(e3), c = [], f = [];
    if (n.type !== "InterfaceTypeAnnotation") {
      n.id && c.push(" ");
      for (let C3 of ["id", "typeParameters"]) if (n[C3]) {
        let { leading: A, trailing: D } = e3.call(() => Tn3(e3, t), C3);
        c.push(A, r3(C3), m3(D));
      }
    }
    if (n.superClass) {
      let C3 = [pD(e3, t, r3), r3("superTypeArguments")], A = e3.call(() => ["extends ", Q3(e3, C3, t)], "superClass");
      a ? f.push(T3, p3(A)) : f.push(" ", A);
    } else f.push(Ei2(e3, t, r3, "extends"));
    f.push(Ei2(e3, t, r3, "mixins"), Ei2(e3, t, r3, "implements"));
    let E;
    return a ? (E = oD(n), u.push(p3([...c, m3(f)], { id: E }))) : u.push(...c, ...f), !o && a && Na(n.body) ? u.push(O3(d, " ", { groupId: E })) : u.push(" "), u.push(r3("body")), u;
  }
  function Ja(e3) {
    let t = e3.superClass ? 1 : 0;
    for (let r3 of ["extends", "mixins", "implements"]) if (Array.isArray(e3[r3]) && (t += e3[r3].length), t > 1) return true;
    return t > 1;
  }
  function uD(e3) {
    let { node: t } = e3;
    if (x4(t.id, g4.Trailing) || x4(t.typeParameters, g4.Trailing) || x4(t.superClass) || Ja(t)) return true;
    if (t.superClass) return e3.parent.type === "AssignmentExpression" ? false : !t.superTypeArguments && N3(Pe3(t.superClass));
    let r3 = t.extends?.[0] ?? t.mixins?.[0] ?? t.implements?.[0];
    return r3 ? r3.type === "InterfaceExtends" && r3.id.type === "QualifiedTypeIdentifier" && !r3.typeParameters || (r3.type === "TSClassImplements" || r3.type === "TSInterfaceHeritage") && N3(r3.expression) && !r3.typeArguments : false;
  }
  var aD = /* @__PURE__ */ new WeakMap();
  function Ga(e3) {
    return Z3(aD, e3.node, () => uD(e3));
  }
  function Ei2(e3, t, r3, n) {
    let { node: o } = e3;
    if (!j4(o[n])) return "";
    let i = W4(e3, t, { marker: n }), s = L3([",", T3], e3.map(r3, n));
    if (!Ja(o)) {
      let u = [`${n} `, i, s];
      return Ga(e3) ? [T3, p3(u)] : [" ", u];
    }
    return [T3, i, i && d, n, p3(m3([T3, s]))];
  }
  function pD(e3, t, r3) {
    let n = r3("superClass"), { parent: o } = e3;
    return o.type === "AssignmentExpression" ? p3(O3(["(", m3([y3, n]), y3, ")"], n)) : n;
  }
  function Xn3(e3, t, r3) {
    let { node: n } = e3, o = [];
    return j4(n.decorators) && o.push(ci3(e3, t, r3)), o.push(Ut3(n)), n.static && o.push("static "), o.push(lr(e3)), n.override && o.push("override "), o.push(Rr2(e3, t, r3)), o;
  }
  function Vn3(e3, t, r3) {
    let { node: n } = e3, o = [];
    j4(n.decorators) && o.push(ci3(e3, t, r3)), o.push(ne3(e3), Ut3(n)), n.static && o.push("static "), o.push(lr(e3)), n.override && o.push("override "), n.readonly && o.push("readonly "), n.variance && o.push(r3("variance")), (n.type === "ClassAccessorProperty" || n.type === "AccessorProperty" || n.type === "TSAbstractAccessorProperty") && o.push("accessor "), o.push(ve3(e3, t, r3), $3(e3), hn3(e3), G4(e3, r3));
    let i = n.type === "TSAbstractPropertyDefinition" || n.type === "TSAbstractAccessorProperty";
    return [jt3(e3, t, r3, o, " =", i ? void 0 : "value"), R3(t)];
  }
  function cD(e3, t) {
    let r3 = re3(e3, g4.Leading);
    if (r3.length === 0) return false;
    let [n] = r3, o = t.originalText, i = b3(n);
    return te3(o, i, S3(n)) || J3(o, i, { backwards: true });
  }
  function Ft3(e3, t, r3, n = "body") {
    return e3.call(({ node: o }) => {
      let i = r3();
      if (o.type === "EmptyStatement") return x4(o, g4.Leading) ? [" ", i] : i;
      let s = o.type === "BlockStatement";
      return cD(o, t) ? s ? [d, i] : m3([d, i]) : s || o.type === "IfStatement" && e3.parent.type === "IfStatement" && e3.key === "alternate" ? [" ", i] : m3([T3, i]);
    }, n);
  }
  var Ua = (e3, t, r3) => Ft3(e3, t, r3, "consequent");
  var qa = (e3, t, r3) => Ft3(e3, t, r3, "alternate");
  function Ya(e3, t, r3) {
    return [p3(["do", Ft3(e3, t, r3)]), e3.node.body.type === "BlockStatement" ? " " : d, "while (", mr(e3, t, r3), ")", R3(t)];
  }
  var lD = B3(["TSAsExpression", "TSTypeAssertion", "TSNonNullExpression", "TSInstantiationExpression", "TSSatisfiesExpression"]);
  function di2(e3) {
    return lD(e3) ? di2(e3.expression) : e3;
  }
  var Ha = B3(["FunctionExpression", "ArrowFunctionExpression"]);
  function Xa(e3) {
    return e3.type === "MemberExpression" || e3.type === "OptionalMemberExpression" || e3.type === "Identifier" && e3.name !== "undefined";
  }
  function mD(e3, t) {
    if (zo2(e3, t)) {
      let r3 = di2(e3.node.expression);
      return Ha(r3) || Xa(r3);
    }
    return !(!t.semi || $o2(e3, t) || Qo2(e3, t));
  }
  function Va(e3, t, r3) {
    let n = [r3("expression")];
    if (Dr2(e3, t)) {
      if (Ln3(e3, t)) {
        let { node: o } = e3, i = w3(0, re3(o, g4.Leading), -1), s = An3(e3, t, { filter: (u) => u === i });
        return Q3(e3, [";", s, ...n], t, { filter: (u) => u !== i });
      }
      n.unshift(";");
    } else mD(e3, t) && n.push(";");
    return n;
  }
  function Ka(e3, t, r3) {
    let { node: n } = e3, o = Ft3(e3, t, r3), i = W4(e3, t), s = i ? [i, y3] : "";
    return !n.init && !n.test && !n.update ? [s, p3(["for (;;)", o])] : [s, p3(["for (", p3([m3([y3, r3("init"), ";", T3, r3("test"), ";", n.update ? [T3, r3("update")] : ""]), y3]), ")", o])];
  }
  function $a(e3, t, r3) {
    let { node: n } = e3, o = n.type === "ForOfStatement";
    return p3(["for", o && n.await ? " await" : "", " (", r3("left"), " ", o ? "of" : "in", " ", r3("right"), ")", Ft3(e3, t, r3)]);
  }
  function Qa(e3, t, r3) {
    if (t.__isVueBindings || t.__isVueForBindingLeft) {
      let n = e3.map(r3, "program", "body", 0, "params");
      if (n.length === 1) return n[0];
      let o = L3([",", T3], n);
      return t.__isVueForBindingLeft ? ["(", m3([y3, p3(o)]), y3, ")"] : o;
    }
    if (t.__isEmbeddedTypescriptGenericParameters) {
      let n = e3.map(r3, "program", "body", 0, "typeParameters", "params");
      return L3([",", T3], n);
    }
  }
  var za = (e3, { originalText: t }) => xn3(t, b3(e3));
  function Kn3(e3) {
    return Le3(w3(0, re3(e3, g4.Dangling), -1));
  }
  function Za(e3, t, r3) {
    let { node: n } = e3, o = p3(["if (", mr(e3, t, r3), ")", Ua(e3, t, r3)]);
    if (!n.alternate) return o;
    let { consequent: i } = n, s = i.type === "BlockStatement", u = [o], a = s;
    s || (u.push(d), a = false);
    let c = re3(n, g4.Dangling);
    if (c.length > 0) {
      let [f] = c;
      za(f, t) ? u.push(s ? [d, d] : d) : J3(t.originalText, b3(f), { backwards: true }) ? u.push(s ? d : "") : u.push(" "), u.push(W4(e3, t), Kn3(n) || J3(t.originalText, S3(w3(0, c, -1))) ? d : " "), a = false;
    }
    return u.push(a ? " " : "", "else", p3(qa(e3, t, r3))), u;
  }
  function rp(e3, t) {
    let { node: r3 } = e3;
    switch (r3.type) {
      case "RegExpLiteral":
        return ep(r3);
      case "BigIntLiteral":
        return $n3(r3.extra.raw);
      case "NumericLiteral":
        return _t4(r3.extra.raw);
      case "StringLiteral":
        return Ve3(ot3(r3.extra.raw, t));
      case "NullLiteral":
        return "null";
      case "BooleanLiteral":
        return String(r3.value);
      case "DirectiveLiteral":
        return tp(r3.extra.raw, t);
      case "Literal": {
        if (r3.regex) return ep(r3.regex);
        if (r3.bigint) return $n3(r3.raw);
        let { value: n } = r3;
        return typeof n == "number" ? _t4(r3.raw) : typeof n == "string" ? fD(e3) ? tp(r3.raw, t) : Ve3(ot3(r3.raw, t)) : String(n);
      }
    }
  }
  function fD(e3) {
    if (e3.key !== "expression") return;
    let { parent: t } = e3;
    return t.type === "ExpressionStatement" && typeof t.directive == "string";
  }
  function $n3(e3) {
    return e3.toLowerCase();
  }
  function ep({ pattern: e3, flags: t }) {
    return t = [...t].sort().join(""), `/${e3}/${t}`;
  }
  var DD = "use strict";
  function tp(e3, t) {
    let r3 = e3.slice(1, -1);
    if (r3 === DD || !(r3.includes('"') || r3.includes("'"))) {
      let n = t.singleQuote ? "'" : '"';
      return n + r3 + n;
    }
    return e3;
  }
  var np = B3(["ImportDeclaration", "ExportDefaultDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration", "DeclareExportDeclaration", "DeclareExportAllDeclaration"]);
  var yD = B3(["EnumBody", "EnumBooleanBody", "EnumNumberBody", "EnumBigIntBody", "EnumStringBody", "EnumSymbolBody"]);
  function ft3(e3, t, r3) {
    let { node: n, parent: o } = e3, i = yD(n), s = n.type === "TSEnumBody" || i, u = np(n), a = i && n.hasUnknownMembers, c = s ? "members" : u ? "attributes" : "properties", f = n[c], E = s || n.type === "ObjectPattern" && o.type !== "FunctionDeclaration" && o.type !== "FunctionExpression" && o.type !== "ArrowFunctionExpression" && o.type !== "ObjectMethod" && o.type !== "ClassMethod" && o.type !== "ClassPrivateMethod" && o.type !== "AssignmentPattern" && o.type !== "CatchClause" && n.properties.some((F3) => F3.value && (F3.value.type === "ObjectPattern" || F3.value.type === "ArrayPattern")) || n.type !== "ObjectPattern" && t.objectWrap === "preserve" && f.length > 0 && ED(n, f[0], t), C3 = [], A = e3.map(({ node: F3 }) => {
      let I3 = [...C3, r3()];
      return C3 = [",", T3], me3(F3, t) && C3.push(d), I3;
    }, c);
    if (a) {
      let F3;
      if (x4(n, g4.Dangling)) {
        let I3 = x4(n, g4.Line);
        F3 = [W4(e3, t), I3 || J3(t.originalText, S3(w3(0, re3(n), -1))) ? d : T3, "..."];
      } else F3 = ["..."];
      A.push([...C3, ...F3]);
    }
    let D = !(a || w3(0, f, -1)?.type === "RestElement"), P3;
    if (A.length === 0) P3 = p3(["{", Mt3(e3, t), "}", $3(e3), G4(e3, r3)]);
    else {
      let F3 = t.bracketSpacing ? T3 : y3;
      P3 = ["{", m3([F3, ...A]), D ? Ie3(t) : "", F3, "}", $3(e3), G4(e3, r3)];
    }
    return e3.match((F3) => F3.type === "ObjectPattern" && !j4(F3.decorators), qt3) || Ye3(n) && (e3.match(void 0, (F3, I3) => I3 === "typeAnnotation", (F3, I3) => I3 === "typeAnnotation", qt3) || e3.match(void 0, (F3, I3) => F3.type === "FunctionTypeParam" && I3 === "typeAnnotation", qt3)) || !E && e3.match((F3) => F3.type === "ObjectPattern", (F3) => F3.type === "AssignmentExpression" || F3.type === "VariableDeclarator") ? P3 : p3(P3, { shouldBreak: E });
  }
  function ED(e3, t, r3) {
    let n = r3.originalText, o = b3(t), i = b3(e3);
    return np(e3) && (i = ce3(r3).lastIndexOf("{", o)), te3(n, i, o);
  }
  function op(e3, t, r3) {
    let { node: n } = e3;
    return ["import", n.phase ? ` ${n.phase}` : "", Fi2(n), up(e3, t, r3), sp(e3, t, r3), pp(e3, t, r3), R3(t)];
  }
  var ip = (e3) => e3.type === "ExportDefaultDeclaration" || e3.type === "DeclareExportDeclaration" && e3.default;
  function Qn3(e3, t, r3) {
    let { node: n } = e3, o = [ma(e3, t, r3), ne3(e3), "export", ip(n) ? " default" : ""], { declaration: i, exported: s } = n;
    return x4(n, g4.Dangling) && (o.push(" ", W4(e3, t)), Kn3(n) && o.push(d)), i ? o.push(" ", r3("declaration")) : (o.push(FD(n)), n.type === "ExportAllDeclaration" || n.type === "DeclareExportAllDeclaration" ? (o.push(" *"), s && o.push(" as ", r3("exported"))) : o.push(up(e3, t, r3)), o.push(sp(e3, t, r3), pp(e3, t, r3))), o.push(CD(n, t)), o;
  }
  var dD = B3(["ClassDeclaration", "ComponentDeclaration", "FunctionDeclaration", "TSInterfaceDeclaration", "DeclareClass", "DeclareComponent", "DeclareFunction", "DeclareHook", "HookDeclaration", "TSDeclareFunction", "EnumDeclaration"]);
  function CD(e3, t) {
    return !e3.declaration || ip(e3) && !dD(e3.declaration) ? R3(t) : "";
  }
  function Ci2(e3, t = true) {
    return e3 && e3 !== "value" ? `${t ? " " : ""}${e3}${t ? "" : " "}` : "";
  }
  function Fi2(e3, t) {
    return Ci2(e3.importKind, t);
  }
  function FD(e3) {
    return Ci2(e3.exportKind);
  }
  function sp(e3, t, r3) {
    let { node: n } = e3;
    return n.source ? [ap(n, t) ? " from" : "", " ", r3("source")] : "";
  }
  function up(e3, t, r3) {
    let { node: n } = e3;
    if (!ap(n, t)) return "";
    let o = [" "];
    if (j4(n.specifiers)) {
      let i = [], s = [];
      e3.each(() => {
        let u = e3.node.type;
        if (u === "ExportNamespaceSpecifier" || u === "ExportDefaultSpecifier" || u === "ImportNamespaceSpecifier" || u === "ImportDefaultSpecifier") i.push(r3());
        else if (u === "ExportSpecifier" || u === "ImportSpecifier") s.push(r3());
        else throw new it3(n, "specifier");
      }, "specifiers"), o.push(L3(", ", i)), s.length > 0 && (i.length > 0 && o.push(", "), s.length > 1 || i.length > 0 || n.specifiers.some((a) => x4(a)) ? o.push(p3(["{", m3([t.bracketSpacing ? T3 : y3, L3([",", T3], s)]), Ie3(t), t.bracketSpacing ? T3 : y3, "}"])) : o.push(["{", t.bracketSpacing ? " " : "", ...s, t.bracketSpacing ? " " : "", "}"]));
    } else o.push("{}");
    return o;
  }
  function ap(e3, t) {
    return e3.type !== "ImportDeclaration" || j4(e3.specifiers) || e3.importKind === "type" ? true : ce3(t).slice(b3(e3), b3(e3.source)).trimEnd().endsWith("from");
  }
  function xD(e3, t) {
    let r3 = ce3(t).slice(S3(e3.source), e3.attributes?.[0] ? b3(e3.attributes[0]) : S3(e3)).trimStart();
    return r3.startsWith("assert") ? "assert" : r3.startsWith("with") || j4(e3.attributes) ? "with" : void 0;
  }
  var AD = (e3) => {
    let { attributes: t } = e3;
    if (t.length !== 1) return false;
    let [r3] = t, { type: n, key: o, value: i } = r3;
    return n === "ImportAttribute" && (o.type === "Identifier" && o.name === "type" || q3(o) && o.value === "type") && q3(i) && !x4(r3) && !x4(o) && !x4(i);
  };
  function pp(e3, t, r3) {
    let { node: n } = e3;
    if (!n.source) return "";
    let o = xD(n, t);
    if (!o) return "";
    let i = ft3(e3, t, r3);
    return AD(n) && (i = Wt3(i)), [` ${o} `, i];
  }
  function cp(e3, t, r3) {
    let { node: n } = e3, { type: o } = n, i = o.startsWith("Import"), s = i ? "imported" : "local", u = i ? "local" : "exported", a = n[s], c = n[u], f = "", E = "";
    return o === "ExportNamespaceSpecifier" || o === "ImportNamespaceSpecifier" ? f = "*" : a && (f = r3(s)), c && !Ir2(n) && (E = r3(u)), [Ci2(o === "ImportSpecifier" ? n.importKind : n.exportKind, false), f, f && E ? " as " : "", E];
  }
  function zn3(e3, t, r3) {
    let { node: n } = e3;
    return n.shorthand ? r3("value") : jt3(e3, t, r3, ve3(e3, t, r3), ":", "value");
  }
  function Tr2(e3, t) {
    return ["...", t("argument"), G4(e3, t)];
  }
  function TD(e3, t, r3) {
    let { node: n } = e3, o = r3();
    return pn3(n, t) ? ["(", m3([d, o]), d, ")"] : be3(n) || t.experimentalTernaries && n.type === "ConditionalExpression" && (n.consequent.type === "ConditionalExpression" || n.alternate.type === "ConditionalExpression") ? p3([O3("("), m3([y3, o]), y3, O3(")")]) : o;
  }
  function Zn3(e3, t, r3) {
    let { node: n } = e3;
    return [n.type === "ThrowStatement" ? "throw" : "return", n.argument ? [" ", e3.call(() => TD(e3, t, r3), "argument")] : "", R3(t)];
  }
  function gD(e3, t) {
    let { key: r3, parent: n } = e3;
    return !!(r3 === "argument" && ut3(n) && oe3(e3, t) || r3 === "body" && n.type === "ArrowFunctionExpression");
  }
  function lp(e3, t, r3) {
    let { parent: n } = e3;
    if (n.type === "ExpressionStatement" || n.type === "ForStatement") {
      let i = [];
      return e3.each(({ isFirst: s }) => {
        s ? i.push(r3()) : i.push(",", m3([T3, r3()]));
      }, "expressions"), p3(i);
    }
    let o = L3([",", T3], e3.map(r3, "expressions"));
    return gD(e3, t) ? p3(O3([m3([y3, o]), y3], o)) : p3(o);
  }
  function mp(e3, t, r3) {
    return [p3(["switch (", m3([y3, r3("discriminant")]), y3, ")"]), " {", e3.node.cases.length > 0 ? m3([d, L3(d, e3.map(({ node: n, isLast: o }) => [r3(), !o && me3(n, t) ? d : ""], "cases"))]) : W4(e3, t, { indent: true }), d, "}"];
  }
  function fp(e3, t, r3) {
    let { node: n } = e3, o = [];
    n.test ? o.push("case ", r3("test"), ":") : o.push("default:"), x4(n, g4.Dangling) && o.push(" ", W4(e3, t));
    let i = n.consequent.filter((s) => s.type !== "EmptyStatement");
    if (i.length > 0) {
      let s = Gr2(e3, t, r3, "consequent");
      o.push(i.length === 1 && i[0].type === "BlockStatement" ? [" ", s] : m3([d, s]));
    }
    return o;
  }
  function Dp(e3, t) {
    let r3 = 0;
    for (let n in e3) {
      let o = e3[n];
      if (on3(o) && typeof o.type == "string" && (r3++, r3 += Dp(o, t - r3)), r3 > t) return r3;
    }
    return r3;
  }
  function xi2(e3, t = 5) {
    return Dp(e3, t) <= t;
  }
  function hD(e3) {
    let t = [e3];
    for (let r3 = 0; r3 < t.length; r3++) {
      let n = t[r3];
      for (let o of ["test", "consequent", "alternate"]) {
        let i = n[o];
        if (H4(i)) return true;
        i.type === "ConditionalExpression" && t.push(i);
      }
    }
    return false;
  }
  function SD(e3, t, r3) {
    let { node: n } = e3, o = n.type === "ConditionalExpression", i = o ? "alternate" : "falseType", { parent: s } = e3, u = o ? r3("test") : [r3("checkType"), " ", "extends", " ", r3("extendsType")];
    return s.type === n.type && s[i] === n ? Be3(2, u) : u;
  }
  var BD = /* @__PURE__ */ new Map([["AssignmentExpression", "right"], ["VariableDeclarator", "init"], ["ReturnStatement", "argument"], ["ThrowStatement", "argument"], ["UnaryExpression", "argument"], ["YieldExpression", "argument"], ["AwaitExpression", "argument"]]);
  function bD(e3) {
    let { node: t } = e3;
    if (t.type !== "ConditionalExpression") return false;
    let r3, n = t;
    for (let o = 0; !r3; o++) {
      let i = e3.getParentNode(o);
      if (We3(i) && i.expression === n || M3(i) && i.callee === n || N3(i) && i.object === n) {
        n = i;
        continue;
      }
      i.type === "NewExpression" && i.callee === n || de2(i) && i.expression === n ? (r3 = e3.getParentNode(o + 1), n = i) : r3 = i;
    }
    return n === t ? false : r3[BD.get(r3.type)] === n;
  }
  function yp(e3, t, r3) {
    let { node: n } = e3, o = n.type === "ConditionalExpression", i = o ? "consequent" : "trueType", s = o ? "alternate" : "falseType", u = o ? ["test"] : ["checkType", "extendsType"], a = n[i], c = n[s], f = [], E = false, { parent: C3 } = e3, A = C3.type === n.type && u.some((z4) => C3[z4] === n), D = C3.type === n.type && !A, P3, F3, I3 = 0;
    do
      F3 = P3 || n, P3 = e3.getParentNode(I3), I3++;
    while (P3 && P3.type === n.type && u.every((z4) => P3[z4] !== F3));
    let k3 = P3 || C3, h = F3;
    if (o && (H4(n[u[0]]) || H4(a) || H4(c) || hD(h))) {
      E = true, D = true;
      let z4 = (De3) => [O3("("), m3([y3, De3]), y3, O3(")")], Ae3 = (De3) => De3.type === "NullLiteral" || De3.type === "Literal" && De3.value === null || De3.type === "Identifier" && De3.name === "undefined";
      f.push(" ? ", Ae3(a) ? r3(i) : z4(r3(i)), " : ", c.type === n.type || Ae3(c) ? r3(s) : z4(r3(s)));
    } else {
      let z4 = (De3) => t.useTabs ? m3(r3(De3)) : Be3(2, r3(De3)), Ae3 = [T3, "? ", a.type === n.type ? O3("", "(") : "", z4(i), a.type === n.type ? O3("", ")") : "", T3, ": ", z4(s)];
      f.push(C3.type !== n.type || C3[s] === n || A ? Ae3 : t.useTabs ? Dn3(m3(Ae3)) : Be3(Math.max(0, t.tabWidth - 2), Ae3));
    }
    let v3 = (z4) => C3 === k3 ? p3(z4) : z4, U3 = !E && (N3(C3) || C3.type === "NGPipeExpression" && C3.left === n) && !C3.computed, ae3 = bD(e3), fe3 = v3([SD(e3, t, r3), D ? f : m3(f), o && U3 && !ae3 ? y3 : ""]);
    return A || ae3 ? p3([m3([y3, fe3]), y3]) : fe3;
  }
  function PD(e3, t) {
    return (N3(t) || t.type === "NGPipeExpression" && t.left === e3) && !t.computed;
  }
  function ID(e3, t, r3, n) {
    return [...e3.map((i) => re3(i)), re3(t), re3(r3)].flat().some((i) => le3(i) && te3(n.originalText, b3(i), S3(i)));
  }
  var kD = /* @__PURE__ */ new Map([["AssignmentExpression", "right"], ["VariableDeclarator", "init"], ["ReturnStatement", "argument"], ["ThrowStatement", "argument"], ["UnaryExpression", "argument"], ["YieldExpression", "argument"], ["AwaitExpression", "argument"]]);
  function wD(e3) {
    let { node: t } = e3;
    if (t.type !== "ConditionalExpression") return false;
    let r3, n = t;
    for (let o = 0; !r3; o++) {
      let i = e3.getParentNode(o);
      if (We3(i) && i.expression === n || M3(i) && i.callee === n || N3(i) && i.object === n) {
        n = i;
        continue;
      }
      i.type === "NewExpression" && i.callee === n || de2(i) && i.expression === n ? (r3 = e3.getParentNode(o + 1), n = i) : r3 = i;
    }
    return n === t ? false : r3[kD.get(r3.type)] === n;
  }
  var Ai2 = (e3) => [O3("("), m3([y3, e3]), y3, O3(")")];
  function gr2(e3, t, r3, n) {
    if (!t.experimentalTernaries) return yp(e3, t, r3);
    let { node: o } = e3, i = o.type === "ConditionalExpression", s = Qe3(o), u = i ? "consequent" : "trueType", a = i ? "alternate" : "falseType", c = i ? ["test"] : ["checkType", "extendsType"], f = o[u], E = o[a], C3 = c.map((br2) => o[br2]), { parent: A } = e3, D = A.type === o.type, P3 = D && c.some((br2) => A[br2] === o), F3 = D && A[a] === o, I3 = f.type === o.type, k3 = E.type === o.type, h = k3 || F3, v3 = t.tabWidth > 2 || t.useTabs, U3, ae3, fe3 = 0;
    do
      ae3 = U3 || o, U3 = e3.getParentNode(fe3), fe3++;
    while (U3 && U3.type === o.type && c.every((br2) => U3[br2] !== ae3));
    let z4 = U3 || A, Ae3 = n && n.assignmentLayout && n.assignmentLayout !== "break-after-operator" && (A.type === "AssignmentExpression" || A.type === "VariableDeclarator" || A.type === "ClassProperty" || A.type === "PropertyDefinition" || A.type === "ClassPrivateProperty" || A.type === "ObjectProperty" || A.type === "Property"), De3 = ut3(A) && !(I3 || k3), xt3 = i && z4.type === "JSXExpressionContainer" && e3.grandparent.type !== "JSXAttribute", bt3 = wD(e3), _3 = PD(o, A), Te3 = s && oe3(e3, t), we3 = v3 ? t.useTabs ? "	" : " ".repeat(t.tabWidth - 1) : "", Pt3 = ID(C3, f, E, t) || I3 || k3, Sr2 = !h && !D && !s && (xt3 ? f.type === "NullLiteral" || f.type === "Literal" && f.value === null : Wr2(f, t) && xi2(o.test, 3)), ki2 = h || F3 || s && !D || D && i && xi2(o.test, 1) || Sr2, qr2 = [];
    x4(o.test, g4.Dangling) && e3.call(() => {
      qr2.push(W4(e3, t));
    }, "test"), x4(o, g4.Dangling) && qr2.push(W4(e3, t));
    let wi2 = /* @__PURE__ */ Symbol("test"), Qp = /* @__PURE__ */ Symbol("consequent"), Yr2 = /* @__PURE__ */ Symbol("test-and-consequent"), zp = i ? [Ai2(r3("test")), o.test.type === "ConditionalExpression" ? je3 : ""] : [r3("checkType"), " ", "extends", " ", Qe3(o.extendsType) || o.extendsType.type === "TSMappedType" ? r3("extendsType") : p3(Ai2(r3("extendsType")))], Li2 = p3([zp, " ?"], { id: wi2 }), Zp = r3(u), Hr2 = m3([I3 || xt3 && (H4(f) || D || h) ? d : T3, Zp]), ec = ki2 ? p3([Li2, h ? Hr2 : O3(Hr2, p3(Hr2, { id: Qp }), { groupId: wi2 })], { id: Yr2 }) : [Li2, Hr2], Eo2 = r3(a), Oi2 = Sr2 ? O3(Eo2, Dn3(Ai2(Eo2)), { groupId: Yr2 }) : Eo2, Br2 = [ec, qr2.length > 0 ? [m3([d, qr2]), d] : k3 ? d : Sr2 ? O3(T3, " ", { groupId: Yr2 }) : T3, ":", k3 || !v3 ? " " : ki2 ? O3(we3, O3(h || Sr2 ? " " : we3, " "), { groupId: Yr2 }) : O3(we3, " "), k3 ? Oi2 : p3([m3(Oi2), xt3 && !Sr2 ? y3 : ""]), _3 && !bt3 ? y3 : "", Pt3 ? je3 : ""];
    return Ae3 && !Pt3 ? p3(m3([y3, p3(Br2)])) : Ae3 || De3 ? p3(m3(Br2)) : bt3 || s && P3 ? p3([m3([y3, Br2]), Te3 ? y3 : ""]) : A === z4 ? p3(Br2) : Br2;
  }
  function Ep(e3, t, r3) {
    let { node: n } = e3;
    return ["try ", r3("block"), n.handler ? [" ", r3("handler")] : "", n.finalizer ? [" finally ", r3("finalizer")] : ""];
  }
  function dp(e3, t, r3) {
    let { node: n } = e3;
    if (n.param) {
      let o = x4(n.param, (s) => !le3(s) || s.leading && J3(t.originalText, S3(s)) || s.trailing && J3(t.originalText, b3(s), { backwards: true })), i = r3("param");
      return ["catch ", o ? ["(", m3([y3, i]), y3, ") "] : ["(", i, ") "], r3("body")];
    }
    return ["catch ", r3("body")];
  }
  function eo2(e3, t, r3) {
    let { node: n } = e3, o = e3.map(r3, "declarations"), i = e3.key === "init" && e3.parent.type === "ForStatement" || e3.key === "left" && (e3.parent.type === "ForInStatement" || e3.parent.type === "ForOfStatement"), s = n.declarations.some((a) => a.init), u;
    return o.length === 1 && !x4(n.declarations[0]) ? u = o[0] : u = m3(o[0]), p3([ne3(e3), n.kind, u ? [" ", u] : "", m3(o.slice(1).map((a) => [",", s && !i ? d : T3, a])), i ? "" : R3(t)]);
  }
  function Cp(e3, t, r3) {
    let { node: n } = e3, o = n.type === "WithStatement" ? "with" : "while";
    return p3([o, " (", mr(e3, t, r3), ")", Ft3(e3, t, r3)]);
  }
  function Fp(e3, t, r3, n) {
    let { node: o } = e3;
    if (Zt3(o)) return rp(e3, t);
    switch (o.type) {
      case "JsExpressionRoot":
        return r3("node");
      case "JsonRoot":
        return [W4(e3, t), r3("node"), d];
      case "File":
        return Qa(e3, t, r3) ?? r3("program");
      case "ExpressionStatement":
        return Va(e3, t, r3);
      case "ChainExpression":
        return r3("expression");
      case "ParenthesizedExpression":
        return !x4(o.expression) && (ie3(o.expression) || Y4(o.expression)) ? ["(", r3("expression"), ")"] : p3(["(", m3([y3, r3("expression")]), y3, ")"]);
      case "AssignmentExpression":
        return ba(e3, t, r3);
      case "VariableDeclarator":
        return Pa(e3, t, r3);
      case "BinaryExpression":
      case "LogicalExpression":
        return Rn3(e3, t, r3);
      case "AssignmentPattern":
        return [r3("left"), " = ", r3("right")];
      case "OptionalMemberExpression":
      case "MemberExpression":
        return Ta(e3, t, r3);
      case "MetaProperty":
        return [r3("meta"), ".", r3("property")];
      case "BindExpression":
        return Aa(e3, t, r3);
      case "Identifier":
        return [o.name, $3(e3), hn3(e3), G4(e3, r3)];
      case "V8IntrinsicIdentifier":
        return ["%", o.name];
      case "SpreadElement":
        return Tr2(e3, r3);
      case "RestElement":
        return Tr2(e3, r3);
      case "FunctionDeclaration":
      case "FunctionExpression":
        return fr2(e3, t, r3, n);
      case "ArrowFunctionExpression":
        return da(e3, t, r3, n);
      case "YieldExpression":
        return [`yield${o.delegate ? "*" : ""}`, o.argument ? [" ", r3("argument")] : ""];
      case "AwaitExpression":
        return wa(e3, t, r3);
      case "ExportDefaultDeclaration":
      case "ExportNamedDeclaration":
      case "ExportAllDeclaration":
        return Qn3(e3, t, r3);
      case "ImportDeclaration":
        return op(e3, t, r3);
      case "ImportSpecifier":
      case "ExportSpecifier":
      case "ImportNamespaceSpecifier":
      case "ExportNamespaceSpecifier":
      case "ImportDefaultSpecifier":
      case "ExportDefaultSpecifier":
        return cp(e3, t, r3);
      case "ImportAttribute":
        return zn3(e3, t, r3);
      case "Program":
      case "BlockStatement":
      case "StaticBlock":
        return Hn3(e3, t, r3);
      case "ClassBody":
        return Vt3(e3, t, r3);
      case "ThrowStatement":
        return Zn3(e3, t, r3);
      case "ReturnStatement":
        return Zn3(e3, t, r3);
      case "NewExpression":
      case "ImportExpression":
      case "OptionalCallExpression":
      case "CallExpression":
        return Xt3(e3, t, r3);
      case "ObjectExpression":
      case "ObjectPattern":
        return ft3(e3, t, r3);
      case "Property":
        return $e2(o) ? Rr2(e3, t, r3) : zn3(e3, t, r3);
      case "ObjectProperty":
        return zn3(e3, t, r3);
      case "ObjectMethod":
        return Rr2(e3, t, r3);
      case "Decorator":
        return ["@", r3("expression")];
      case "ArrayExpression":
      case "ArrayPattern":
        return xr2(e3, t, r3);
      case "SequenceExpression":
        return lp(e3, t, r3);
      case "ThisExpression":
        return "this";
      case "Super":
        return "super";
      case "Directive":
        return [r3("value"), R3(t)];
      case "UnaryExpression": {
        let i = [o.operator];
        /[a-z]$/.test(o.operator) && i.push(" ");
        let s = r3("argument");
        return x4(o.argument) ? i.push(p3(["(", m3([y3, s]), y3, ")"])) : i.push(s), i;
      }
      case "UpdateExpression":
        return [o.prefix ? o.operator : "", r3("argument"), o.prefix ? "" : o.operator];
      case "ConditionalExpression":
        return gr2(e3, t, r3, n);
      case "VariableDeclaration":
        return eo2(e3, t, r3);
      case "IfStatement":
        return Za(e3, t, r3);
      case "ForStatement":
        return Ka(e3, t, r3);
      case "WithStatement":
      case "WhileStatement":
        return Cp(e3, t, r3);
      case "DoWhileStatement":
        return Ya(e3, t, r3);
      case "ForInStatement":
      case "ForOfStatement":
        return $a(e3, t, r3);
      case "DoExpression":
        return [o.async ? "async " : "", "do ", r3("body")];
      case "BreakStatement":
      case "ContinueStatement":
        return [o.type === "BreakStatement" ? "break" : "continue", o.label ? [" ", r3("label")] : "", R3(t)];
      case "LabeledStatement":
        return [r3("label"), `:${o.body.type === "EmptyStatement" && !x4(o.body, g4.Leading) ? "" : " "}`, r3("body")];
      case "TryStatement":
        return Ep(e3, t, r3);
      case "CatchClause":
        return dp(e3, t, r3);
      case "SwitchStatement":
        return mp(e3, t, r3);
      case "SwitchCase":
        return fp(e3, t, r3);
      case "DebuggerStatement":
        return ["debugger", R3(t)];
      case "ClassDeclaration":
      case "ClassExpression":
        return Ar2(e3, t, r3);
      case "ClassMethod":
      case "ClassPrivateMethod":
      case "MethodDefinition":
        return Xn3(e3, t, r3);
      case "ClassProperty":
      case "PropertyDefinition":
      case "ClassPrivateProperty":
      case "ClassAccessorProperty":
      case "AccessorProperty":
        return Vn3(e3, t, r3);
      case "TemplateElement":
        return Ve3(o.value.raw);
      case "TemplateLiteral":
        return On3(e3, t, r3);
      case "TaggedTemplateExpression":
        return Bu3(e3, t, r3);
      case "PrivateIdentifier":
        return ["#", o.name];
      case "PrivateName":
        return ["#", r3("id")];
      case "TopicReference":
        return "%";
      case "ArgumentPlaceholder":
        return "?";
      case "ModuleExpression":
        return ["module ", r3("body")];
      case "VoidPattern":
        return "void";
      case "EmptyStatement":
        if (Qt3(e3)) return ";";
      default:
        throw new it3(o, "ESTree");
    }
  }
  function to2(e3) {
    return [e3("elementType"), "[]"];
  }
  function ro2(e3, t, r3) {
    let { parent: n, node: o, key: i } = e3, u = o.type === "AsConstExpression" ? "const" : r3("typeAnnotation"), a = [r3("expression"), " ", Ui2(o) ? "satisfies" : "as", " ", u];
    return i === "callee" && Tt3(n) || i === "object" && N3(n) ? p3([m3([y3, ...a]), y3]) : a;
  }
  function xp(e3, t, r3) {
    let { node: n } = e3, o = [ne3(e3), n.async ? "async " : "", "component"];
    n.id && o.push(" ", r3("id")), o.push(r3("typeParameters"));
    let i = Ke3(e3, t, r3);
    return n.rendersType ? o.push(p3([i, " ", r3("rendersType")])) : o.push(p3([i])), n.body && o.push(" ", r3("body")), n.type === "DeclareComponent" && o.push(R3(t)), o;
  }
  function Ap(e3, t, r3) {
    let { node: n } = e3;
    return n.shorthand ? r3("local") : [r3("name"), " as ", r3("local")];
  }
  function Tp(e3, t, r3) {
    let { node: n } = e3, o = [];
    return n.name && o.push(r3("name"), n.optional ? "?: " : ": "), o.push(r3("typeAnnotation")), o;
  }
  function gp(e3, t, r3) {
    let { node: n } = e3;
    return [n.explicitType ? `of ${n.explicitType} ` : "", ft3(e3, t, r3)];
  }
  function hp(e3, t, r3) {
    let { node: n } = e3;
    return [n.type === "EnumSymbolBody" || n.explicitType ? `of ${n.type.slice(4, -4).toLowerCase()} ` : "", ft3(e3, t, r3)];
  }
  function no2(e3, t, r3) {
    let { node: n } = e3, o = n.type === "TSEnumMember", i = o ? ve3(e3, t, r3) : r3("id"), s = o ? "initializer" : "init";
    return n[s] ? [i, " = ", r3(s)] : i;
  }
  function oo2(e3, t) {
    let { node: r3 } = e3;
    return [ne3(e3), r3.const ? "const " : "", "enum ", t("id"), " ", t("body")];
  }
  function io2(e3, t, r3) {
    let { node: n } = e3, o = [lr(e3)];
    (n.type === "TSConstructorType" || n.type === "TSConstructSignatureDeclaration") && o.push("new ");
    let i = Ke3(e3, t, r3, false, true), s = [];
    return n.type === "FunctionTypeAnnotation" ? s.push(LD(e3) ? " => " : ": ", r3("returnType")) : s.push(G4(e3, r3, "returnType")), Bt3(n, s) && (i = p3(i)), o.push(i, s), [p3(o), n.type === "TSConstructSignatureDeclaration" || n.type === "TSCallSignatureDeclaration" ? ke3(e3, t) : ""];
  }
  function LD(e3) {
    let { node: t, parent: r3 } = e3;
    return t.type === "FunctionTypeAnnotation" && (ar2(r3) || !((r3.type === "ObjectTypeProperty" || r3.type === "ObjectTypeInternalSlot") && !r3.variance && !r3.optional && kt3(r3, t) || r3.type === "ObjectTypeCallProperty" || e3.getParentNode(2)?.type === "DeclareFunction"));
  }
  function Bp(e3, t, r3) {
    return [ne3(e3), "hook", e3.node.id ? [" ", r3("id")] : "", R3(t)];
  }
  function Sp(e3) {
    let { node: t } = e3;
    return t.type === "HookTypeAnnotation" && e3.getParentNode(2)?.type === "DeclareHook";
  }
  function bp(e3, t, r3) {
    let { node: n } = e3, o = Ke3(e3, t, r3, false, true), i = [Sp(e3) ? ": " : " => ", r3("returnType")];
    return p3([Sp(e3) ? "" : "hook ", Bt3(n, i) ? p3(o) : o, i]);
  }
  function so2(e3, t, r3) {
    return [r3("objectType"), $3(e3), "[", r3("indexType"), "]"];
  }
  function uo2(e3, t, r3) {
    return ["infer ", r3("typeParameter")];
  }
  function ao2(e3, t, r3) {
    let n = false;
    return p3(e3.map(({ isFirst: o, previous: i, node: s, index: u }) => {
      let a = r3();
      if (o) return a;
      let c = Ye3(s), f = Ye3(i);
      return f && c ? [" & ", n ? m3(a) : a] : !f && !c || Oe3(t.originalText, s) ? t.experimentalOperatorPosition === "start" ? m3([T3, "& ", a]) : m3([" &", T3, a]) : (u > 1 && (n = true), [" & ", u > 1 ? m3(a) : a]);
    }, "types"));
  }
  function OD(e3) {
    switch (e3) {
      case null:
        return "";
      case "PlusOptional":
        return "+?";
      case "MinusOptional":
        return "-?";
      case "Optional":
        return "?";
    }
  }
  function Ip(e3, t, r3) {
    let { node: n } = e3;
    return [p3([n.variance ? r3("variance") : "", p3(["[", m3([y3, r3("keyTparam"), " in ", r3("sourceType")]), y3, "]"]), OD(n.optional), ": ", r3("propType")]), ke3(e3, t)];
  }
  function Pp(e3, t) {
    return e3 === "+" || e3 === "-" ? e3 + t : t;
  }
  function kp(e3, t, r3) {
    let { node: n } = e3, o = false;
    if (t.objectWrap === "preserve") {
      let u = ce3(t), a = b3(n) + 1, c = u.slice(a), f = a + c.search(/\S/);
      te3(t.originalText, a, f) && (o = true);
    }
    let i = [], s = re3(n, g4.Dangling);
    if (s.length > 0) {
      let u = w3(0, s, -1), a = W4(e3, t);
      i.push(...a.slice(0, -1), p3([w3(0, a, -1), Le3(u) || J3(t.originalText, S3(u)) ? d : T3]));
    }
    return p3(["{", m3([t.bracketSpacing ? T3 : y3, ...i, n.readonly ? [Pp(n.readonly, "readonly"), " "] : "", p3(["[", m3([y3, r3("key"), " in ", r3("constraint"), n.nameType ? [" as ", r3("nameType")] : ""]), y3, "]"]), n.optional ? Pp(n.optional, "?") : "", n.typeAnnotation ? ": " : "", r3("typeAnnotation"), t.semi ? O3(";") : ""]), t.bracketSpacing ? T3 : y3, "}"], { shouldBreak: o });
  }
  function wp(e3, t, r3) {
    let { node: n } = e3;
    return [p3(["match (", m3([y3, r3("argument")]), y3, ")"]), " {", n.cases.length > 0 ? m3([d, L3(d, e3.map(({ node: o, isLast: i }) => [r3(), !i && me3(o, t) ? d : ""], "cases"))]) : "", d, "}"];
  }
  function Lp(e3, t, r3) {
    let { node: n } = e3, o = x4(n, g4.Dangling) ? [" ", W4(e3, t)] : [], i = n.type === "MatchStatementCase" ? [" ", r3("body")] : m3([T3, r3("body"), ","]);
    return [r3("pattern"), n.guard ? p3([m3([T3, "if (", r3("guard"), ")"])]) : "", p3([" =>", o, i])];
  }
  function Op(e3, t, r3) {
    let { node: n } = e3;
    switch (n.type) {
      case "MatchOrPattern":
        return jD(e3, t, r3);
      case "MatchAsPattern":
        return [r3("pattern"), " as ", r3("target")];
      case "MatchWildcardPattern":
        return ["_"];
      case "MatchLiteralPattern":
        return r3("literal");
      case "MatchUnaryPattern":
        return [n.operator, r3("argument")];
      case "MatchIdentifierPattern":
        return r3("id");
      case "MatchMemberPattern": {
        let o = n.property.type === "Identifier" ? [".", r3("property")] : ["[", m3([y3, r3("property")]), y3, "]"];
        return p3([r3("base"), o]);
      }
      case "MatchBindingPattern":
        return [n.kind, " ", r3("id")];
      case "MatchObjectPattern":
      case "MatchInstanceObjectPattern":
        return MD(e3, t, r3);
      case "MatchInstancePattern":
        return p3([r3("targetConstructor"), " ", r3("properties")]);
      case "MatchArrayPattern": {
        let o = e3.map(r3, "elements");
        return n.rest && o.push(r3("rest")), p3(["[", m3([y3, L3([",", T3], o)]), n.rest ? "" : O3(","), y3, "]"]);
      }
      case "MatchObjectPatternProperty":
        return n.shorthand ? r3("pattern") : p3([r3("key"), ":", m3([T3, r3("pattern")])]);
      case "MatchRestPattern": {
        let o = ["..."];
        return n.argument && o.push(r3("argument")), o;
      }
    }
  }
  function MD(e3, t, r3) {
    let { node: n } = e3, o = e3.map(r3, "properties");
    return n.rest && o.push(r3("rest")), p3(["{", m3([y3, L3([",", T3], o)]), n.rest ? "" : O3(","), y3, "}"]);
  }
  var Mp = B3(["MatchWildcardPattern", "MatchLiteralPattern", "MatchUnaryPattern", "MatchIdentifierPattern"]);
  function _D(e3) {
    let { patterns: t } = e3;
    if (t.some((n) => x4(n))) return false;
    let r3 = t.find((n) => n.type === "MatchObjectPattern");
    return r3 ? t.every((n) => n === r3 || Mp(n)) : false;
  }
  function ND(e3) {
    return Mp(e3) || e3.type === "MatchObjectPattern" ? true : e3.type === "MatchOrPattern" ? _D(e3) : false;
  }
  function jD(e3, t, r3) {
    let { node: n } = e3, { parent: o } = e3, i = o.type !== "MatchStatementCase" && o.type !== "MatchExpressionCase" && o.type !== "MatchArrayPattern" && o.type !== "MatchObjectPatternProperty" && !Oe3(t.originalText, n), s = ND(n), u = e3.map(() => {
      let c = r3();
      return s || (c = Be3(2, c)), Q3(e3, c, t);
    }, "patterns");
    if (s) return L3(" | ", u);
    let a = [O3(["| "]), L3([T3, "| "], u)];
    return oe3(e3, t) ? p3([m3([O3([y3]), a]), y3]) : o.type === "MatchArrayPattern" && o.elements.length > 1 ? p3([m3([O3(["(", y3]), a]), y3, O3(")")]) : p3(i ? m3(a) : a);
  }
  function _p(e3, t, r3) {
    let { node: n } = e3, o = [ne3(e3), "opaque type ", r3("id"), r3("typeParameters")];
    if (n.supertype && o.push(": ", r3("supertype")), n.lowerBound || n.upperBound) {
      let i = [];
      n.lowerBound && i.push(m3([T3, "super ", r3("lowerBound")])), n.upperBound && i.push(m3([T3, "extends ", r3("upperBound")])), o.push(p3(i));
    }
    return n.impltype && o.push(" = ", r3("impltype")), o.push(R3(t)), o;
  }
  function po2(e3, t, r3) {
    let { node: n } = e3;
    return ["...", ...n.type === "TupleTypeSpreadElement" && n.label ? [r3("label"), ": "] : [], r3("typeAnnotation")];
  }
  function co2(e3, t, r3) {
    let { node: n } = e3;
    return [n.variance ? r3("variance") : "", r3("label"), n.optional ? "?" : "", ": ", r3("elementType")];
  }
  function lo2(e3, t, r3) {
    let { node: n } = e3, o = [ne3(e3), "type ", r3("id"), r3("typeParameters")], i = n.type === "TSTypeAliasDeclaration" ? "typeAnnotation" : "right";
    return [jt3(e3, t, r3, o, " =", i), R3(t)];
  }
  function vD(e3, t, r3) {
    let { node: n } = e3;
    return ee3(n).length === 1 && n.type.startsWith("TS") && !n[r3][0].constraint && e3.parent.type === "ArrowFunctionExpression" && !(t.filepath && /\.ts$/.test(t.filepath));
  }
  function Kt3(e3, t, r3, n) {
    let { node: o } = e3, i = o[n];
    if (!i) return "";
    if (!Array.isArray(i)) return r3(n);
    let s = Gt3(e3.grandparent), u = e3.match((f) => !(f[n].length === 1 && Ye3(f[n][0])), void 0, (f, E) => E === "typeAnnotation", (f) => f.type === "Identifier", yi2);
    if (i.length === 0 || !u && (s || i.length === 1 && (i[0].type === "NullableTypeAnnotation" || Fu3(i[0]))) && !i.some((f) => {
      let E = re3(f, (C3) => C3.leading || C3.trailing);
      return E.length > 0 && (E.some((C3) => Le3(C3)) || J3(t.originalText, S3(w3(0, E, -1))));
    })) return ["<", L3(", ", e3.map(r3, n)), RD(e3, t), ">"];
    let c = o.type === "TSTypeParameterInstantiation" ? "" : vD(e3, t, n) ? "," : Ie3(t);
    return p3(["<", m3([y3, L3([",", T3], e3.map(r3, n))]), c, y3, ">"]);
  }
  function RD(e3, t) {
    let { node: r3 } = e3;
    if (!x4(r3, g4.Dangling)) return "";
    let n = !x4(r3, g4.Line), o = W4(e3, t, { indent: !n });
    return n ? o : [o, d];
  }
  function mo2(e3, t, r3) {
    let { node: n } = e3, o = [n.const ? "const " : ""], i = n.type === "TSTypeParameter" ? r3("name") : n.name;
    if (n.variance && o.push(r3("variance")), n.in && o.push("in "), n.out && o.push("out "), o.push(i), n.bound && (n.usesExtendsBound && o.push(" extends "), o.push(G4(e3, r3, "bound"))), n.constraint) {
      let s = /* @__PURE__ */ Symbol("constraint");
      o.push(" extends", p3(m3(T3), { id: s }), xe3, ht3(r3("constraint"), { groupId: s }));
    }
    if (n.default) {
      let s = /* @__PURE__ */ Symbol("default");
      o.push(" =", p3(m3(T3), { id: s }), xe3, ht3(r3("default"), { groupId: s }));
    }
    return p3(o);
  }
  function fo2(e3, t) {
    let { node: r3 } = e3;
    return [r3.type === "TSTypePredicate" && r3.asserts ? "asserts " : r3.type === "TypePredicate" && r3.kind ? `${r3.kind} ` : "", t("parameterName"), r3.typeAnnotation ? [" is ", G4(e3, t)] : ""];
  }
  function Do2({ node: e3 }, t) {
    let r3 = e3.type === "TSTypeQuery" ? "exprName" : "argument";
    return ["typeof ", t(r3), t("typeArguments")];
  }
  function Np(e3, t, r3, n) {
    let { node: o } = e3;
    if (Cn3(o)) return o.type.slice(0, -14).toLowerCase();
    switch (o.type) {
      case "ComponentDeclaration":
      case "DeclareComponent":
      case "ComponentTypeAnnotation":
        return xp(e3, t, r3);
      case "ComponentParameter":
        return Ap(e3, t, r3);
      case "ComponentTypeParameter":
        return Tp(e3, t, r3);
      case "HookDeclaration":
        return fr2(e3, t, r3);
      case "DeclareHook":
        return Bp(e3, t, r3);
      case "HookTypeAnnotation":
        return bp(e3, t, r3);
      case "DeclareFunction":
        return [ne3(e3), "function ", r3("id"), r3("predicate"), R3(t)];
      case "DeclareModule":
        return ["declare module ", r3("id"), " ", r3("body")];
      case "DeclareModuleExports":
        return ["declare module.exports", G4(e3, r3), R3(t)];
      case "DeclareNamespace":
        return ["declare namespace ", r3("id"), " ", r3("body")];
      case "DeclareVariable":
        return Array.isArray(o.declarations) ? eo2(e3, t, r3) : [ne3(e3), o.kind ?? "var", " ", r3("id"), R3(t)];
      case "DeclareExportDeclaration":
      case "DeclareExportAllDeclaration":
        return Qn3(e3, t, r3);
      case "DeclareOpaqueType":
      case "OpaqueType":
        return _p(e3, t, r3);
      case "DeclareTypeAlias":
      case "TypeAlias":
        return lo2(e3, t, r3);
      case "IntersectionTypeAnnotation":
        return ao2(e3, t, r3);
      case "UnionTypeAnnotation":
        return bn3(e3, t, r3, n);
      case "ConditionalTypeAnnotation":
        return gr2(e3, t, r3);
      case "InferTypeAnnotation":
        return uo2(e3, t, r3);
      case "FunctionTypeAnnotation":
        return io2(e3, t, r3);
      case "TupleTypeAnnotation":
        return xr2(e3, t, r3);
      case "TupleTypeLabeledElement":
        return co2(e3, t, r3);
      case "TupleTypeSpreadElement":
        return po2(e3, t, r3);
      case "GenericTypeAnnotation":
        return [r3("id"), Kt3(e3, t, r3, "typeParameters")];
      case "IndexedAccessType":
      case "OptionalIndexedAccessType":
        return so2(e3, t, r3);
      case "TypeAnnotation":
        return Pn3(e3, t, r3);
      case "TypeParameter":
        return mo2(e3, t, r3);
      case "TypeofTypeAnnotation":
        return Do2(e3, r3);
      case "ExistsTypeAnnotation":
        return "*";
      case "ArrayTypeAnnotation":
        return to2(r3);
      case "DeclareEnum":
      case "EnumDeclaration":
        return oo2(e3, r3);
      case "EnumBody":
        return gp(e3, t, r3);
      case "EnumBooleanBody":
      case "EnumNumberBody":
      case "EnumBigIntBody":
      case "EnumStringBody":
      case "EnumSymbolBody":
        return hp(e3, t, r3);
      case "EnumBooleanMember":
      case "EnumNumberMember":
      case "EnumBigIntMember":
      case "EnumStringMember":
      case "EnumDefaultedMember":
        return no2(e3, t, r3);
      case "FunctionTypeParam": {
        let i = o.name ? r3("name") : e3.parent.this === o ? "this" : "";
        return [i, $3(e3), i ? ": " : "", r3("typeAnnotation")];
      }
      case "DeclareClass":
      case "DeclareInterface":
      case "InterfaceDeclaration":
      case "InterfaceTypeAnnotation":
      case "RecordDeclaration":
        return Ar2(e3, t, r3);
      case "ObjectTypeAnnotation":
      case "RecordDeclarationBody":
        return Vt3(e3, t, r3);
      case "ClassImplements":
      case "InterfaceExtends":
        return [r3("id"), r3("typeParameters")];
      case "RecordDeclarationImplements":
        return [r3("id"), r3("typeArguments")];
      case "NullableTypeAnnotation":
        return ["?", r3("typeAnnotation")];
      case "Variance": {
        let { kind: i } = o;
        return Re3(i === "plus" || i === "minus" || i === "readonly" || i === "writeonly" || i === "in" || i === "out"), i === "plus" ? "+" : i === "minus" ? "-" : `${i} `;
      }
      case "KeyofTypeAnnotation":
        return ["keyof ", r3("argument")];
      case "ObjectTypeCallProperty":
        return [o.static ? "static " : "", r3("value"), ke3(e3, t)];
      case "ObjectTypeMappedTypeProperty":
        return Ip(e3, t, r3);
      case "ObjectTypeIndexer":
        return [o.static ? "static " : "", o.variance ? r3("variance") : "", "[", r3("id"), o.id ? ": " : "", r3("key"), "]: ", r3("value"), ke3(e3, t)];
      case "ObjectTypeProperty": {
        let i = "";
        return o.proto ? i = "proto " : o.static && (i = "static "), [i, o.kind !== "init" ? o.kind + " " : "", o.variance ? r3("variance") : "", ve3(e3, t, r3), $3(e3), $e2(o) ? "" : ": ", r3("value"), ke3(e3, t)];
      }
      case "ObjectTypeInternalSlot":
        return [o.static ? "static " : "", "[[", r3("id"), "]]", $3(e3), o.method ? "" : ": ", r3("value"), ke3(e3, t)];
      case "ObjectTypeSpreadProperty":
        return Tr2(e3, r3);
      case "QualifiedTypeofIdentifier":
      case "QualifiedTypeIdentifier":
        return [r3("qualification"), ".", r3("id")];
      case "NullLiteralTypeAnnotation":
        return "null";
      case "BooleanLiteralTypeAnnotation":
        return String(o.value);
      case "StringLiteralTypeAnnotation":
        return Ve3(ot3(ye3(o), t));
      case "NumberLiteralTypeAnnotation":
        return _t4(ye3(o));
      case "BigIntLiteralTypeAnnotation":
        return $n3(ye3(o));
      case "TypeCastExpression":
        return ["(", r3("expression"), G4(e3, r3), ")"];
      case "TypePredicate":
        return fo2(e3, r3);
      case "TypeOperator":
        return [o.operator, " ", r3("typeAnnotation")];
      case "TypeParameterDeclaration":
      case "TypeParameterInstantiation":
        return Kt3(e3, t, r3, "params");
      case "InferredPredicate":
      case "DeclaredPredicate":
        return [e3.key === "predicate" && e3.parent.type !== "DeclareFunction" && !e3.parent.returnType ? ": " : " ", "%checks", ...o.type === "DeclaredPredicate" ? ["(", r3("value"), ")"] : []];
      case "AsExpression":
      case "AsConstExpression":
      case "SatisfiesExpression":
        return ro2(e3, t, r3);
      case "MatchExpression":
      case "MatchStatement":
        return wp(e3, t, r3);
      case "MatchExpressionCase":
      case "MatchStatementCase":
        return Lp(e3, t, r3);
      case "MatchOrPattern":
      case "MatchAsPattern":
      case "MatchWildcardPattern":
      case "MatchLiteralPattern":
      case "MatchUnaryPattern":
      case "MatchIdentifierPattern":
      case "MatchInstancePattern":
      case "MatchInstanceObjectPattern":
      case "MatchMemberPattern":
      case "MatchBindingPattern":
      case "MatchObjectPattern":
      case "MatchObjectPatternProperty":
      case "MatchRestPattern":
      case "MatchArrayPattern":
        return Op(e3, t, r3);
      case "RecordExpression":
        return [r3("recordConstructor"), r3("typeArguments"), " ", r3("properties")];
      case "RecordExpressionProperties":
        return ft3(e3, t, r3);
      case "RecordDeclarationProperty":
      case "RecordDeclarationStaticProperty": {
        let i = o.type === "RecordDeclarationStaticProperty", s = i ? "value" : "defaultValue";
        return [i ? "static " : "", ve3(e3, t, r3), G4(e3, r3), o[s] ? [" = ", r3(s)] : ""];
      }
    }
  }
  function jp(e3, t) {
    let { node: r3 } = e3, n = t.originalText.slice(b3(r3), S3(r3));
    return t.semi && Pr2(r3) ? n += ";" : Dr2(e3, t) && (n = `;${n}`), r3.type === "ClassExpression" && j4(r3.decorators) ? [m3([y3, n]), y3] : n;
  }
  var Ti2 = (e3) => e3 === "" || e3 === T3 || e3 === d || e3 === y3;
  function WD(e3, t, r3) {
    let { node: n } = e3;
    if (n.type === "JSXElement" && ty(n)) return [r3("openingElement"), r3("closingElement")];
    let o = n.type === "JSXElement" ? r3("openingElement") : r3("openingFragment"), i = n.type === "JSXElement" ? r3("closingElement") : r3("closingFragment");
    if (n.children.length === 1 && n.children[0].type === "JSXExpressionContainer" && (n.children[0].expression.type === "TemplateLiteral" || n.children[0].expression.type === "TaggedTemplateExpression")) return [o, ...e3.map(r3, "children"), i];
    n.children = n.children.map((h) => ry(h) ? { type: "JSXText", value: " ", raw: " " } : h);
    let s = n.children.some(H4), u = n.children.filter((h) => h.type === "JSXExpressionContainer").length > 1, a = n.type === "JSXElement" && n.openingElement.attributes.length > 1, c = ue3(o) || s || a || u, f = e3.parent.rootMarker === "mdx", E = t.singleQuote ? "{' '}" : '{" "}', C3 = f ? T3 : O3([E, y3], " "), A = n.openingElement?.name?.name === "fbt", D = JD(e3, t, r3, C3, A), P3 = n.children.some((h) => Ht3(h));
    for (let h = D.length - 2; h >= 0; h--) {
      let v3 = D[h] === "" && D[h + 1] === "", U3 = D[h] === d && D[h + 1] === "" && D[h + 2] === d, ae3 = (D[h] === y3 || D[h] === d) && D[h + 1] === "" && D[h + 2] === C3, fe3 = D[h] === C3 && D[h + 1] === "" && (D[h + 2] === y3 || D[h + 2] === d), z4 = D[h] === C3 && D[h + 1] === "" && D[h + 2] === C3, Ae3 = D[h] === y3 && D[h + 1] === "" && D[h + 2] === d || D[h] === d && D[h + 1] === "" && D[h + 2] === y3;
      U3 && P3 || v3 || ae3 || z4 || Ae3 ? D.splice(h, 2) : fe3 && D.splice(h + 1, 2);
    }
    for (; D.length > 0 && Ti2(w3(0, D, -1)); ) D.pop();
    for (; D.length > 1 && Ti2(D[0]) && Ti2(D[1]); ) D.shift(), D.shift();
    let F3 = [""];
    for (let [h, v3] of D.entries()) {
      if (v3 === C3) {
        if (h === 1 && js(D[h - 1])) {
          if (D.length === 2) {
            F3.push([F3.pop(), E]);
            continue;
          }
          F3.push([E, d], "");
          continue;
        }
        if (h === D.length - 1) {
          F3.push([F3.pop(), E]);
          continue;
        }
        if (D[h - 1] === "" && D[h - 2] === d) {
          F3.push([F3.pop(), E]);
          continue;
        }
      }
      h % 2 === 0 ? F3.push([F3.pop(), v3]) : F3.push(v3, ""), ue3(v3) && (c = true);
    }
    let I3 = P3 ? yn3(F3) : p3(F3, { shouldBreak: true });
    if (t.cursorNode?.type === "JSXText" && n.children.includes(t.cursorNode) ? I3 = [jr2, I3, jr2] : t.nodeBeforeCursor?.type === "JSXText" && n.children.includes(t.nodeBeforeCursor) ? I3 = [jr2, I3] : t.nodeAfterCursor?.type === "JSXText" && n.children.includes(t.nodeAfterCursor) && (I3 = [I3, jr2]), f) return I3;
    let k3 = p3([o, m3([d, I3]), d, i]);
    return c ? k3 : mt3([p3([o, ...D, i]), k3]);
  }
  function JD(e3, t, r3, n, o) {
    let i = "", s = [i];
    function u(c) {
      i = c, s.push([s.pop(), c]);
    }
    function a(c) {
      c !== "" && (i = c, s.push(c, ""));
    }
    return e3.each(({ node: c, next: f }) => {
      if (c.type === "JSXText") {
        let E = ye3(c);
        if (Ht3(c)) {
          let C3 = dr2.split(E, true);
          C3[0] === "" && (C3.shift(), /\n/.test(C3[0]) ? a(Rp(o, C3[1], c, f)) : a(n), C3.shift());
          let A;
          if (w3(0, C3, -1) === "" && (C3.pop(), A = C3.pop()), C3.length === 0) return;
          for (let [D, P3] of C3.entries()) D % 2 === 1 ? a(T3) : u(P3);
          A !== void 0 ? /\n/.test(A) ? a(Rp(o, i, c, f)) : a(n) : a(vp(o, i, c, f));
        } else /\n/.test(E) ? E.match(/\n/g).length > 1 && a(d) : a(n);
      } else {
        let E = r3();
        if (u(E), f && Ht3(f)) {
          let A = dr2.trim(ye3(f)), [D] = dr2.split(A);
          a(vp(o, D, c, f));
        } else a(d);
      }
    }, "children"), s;
  }
  function vp(e3, t, r3, n) {
    return e3 ? "" : r3.type === "JSXElement" && !r3.closingElement || n?.type === "JSXElement" && !n.closingElement ? t.length === 1 ? y3 : d : y3;
  }
  function Rp(e3, t, r3, n) {
    return e3 ? d : t.length === 1 ? r3.type === "JSXElement" && !r3.closingElement || n?.type === "JSXElement" && !n.closingElement ? d : y3 : d;
  }
  var GD = B3(["ArrayExpression", "JSXAttribute", "JSXElement", "JSXExpressionContainer", "JSXFragment", "ExpressionStatement", "NewExpression", "CallExpression", "OptionalCallExpression", "ConditionalExpression", "JsExpressionRoot", "MatchExpressionCase"]);
  function UD(e3, t, r3) {
    let { parent: n } = e3;
    if (GD(n)) return t;
    let o = qD(e3), i = oe3(e3, r3);
    return p3([i ? "" : O3("("), m3([y3, t]), y3, i ? "" : O3(")")], { shouldBreak: o });
  }
  function qD(e3) {
    return e3.match(void 0, (t, r3) => r3 === "body" && t.type === "ArrowFunctionExpression", (t, r3) => r3 === "arguments" && M3(t)) && (e3.match(void 0, void 0, void 0, (t, r3) => r3 === "expression" && t.type === "JSXExpressionContainer") || e3.match(void 0, void 0, void 0, (t, r3) => r3 === "expression" && t.type === "ChainExpression", (t, r3) => r3 === "expression" && t.type === "JSXExpressionContainer"));
  }
  function YD(e3, t, r3) {
    let { node: n } = e3, o = [r3("name")];
    if (n.value) {
      let i;
      if (q3(n.value)) {
        let s = ye3(n.value), u = V3(0, V3(0, s.slice(1, -1), "&apos;", "'"), "&quot;", '"'), a = Sn3(u, t.jsxSingleQuote);
        u = a === '"' ? V3(0, u, '"', "&quot;") : V3(0, u, "'", "&apos;"), i = e3.call(() => Q3(e3, Ve3(a + u + a), t), "value");
      } else i = r3("value");
      o.push("=", i);
    }
    return o;
  }
  function HD(e3, t, r3) {
    let { node: n } = e3, o = (i, s) => i.type === "JSXEmptyExpression" || !x4(i) && (Y4(i) || ie3(i) || i.type === "ArrowFunctionExpression" || i.type === "AwaitExpression" && (o(i.argument, i) || i.argument.type === "JSXElement") || M3(Pe3(i)) || i.type === "FunctionExpression" || i.type === "TemplateLiteral" || i.type === "TaggedTemplateExpression" || i.type === "DoExpression" || H4(s) && (i.type === "ConditionalExpression" || be3(i)));
    return o(n.expression, e3.parent) ? p3(["{", r3("expression"), xe3, "}"]) : p3(["{", m3([y3, r3("expression")]), y3, xe3, "}"]);
  }
  function XD(e3, t, r3) {
    let { node: n } = e3, o = x4(n.name) || x4(n.typeArguments);
    if (n.selfClosing && n.attributes.length === 0 && !o) return ["<", r3("name"), r3("typeArguments"), " />"];
    if (n.attributes?.length === 1 && q3(n.attributes[0].value) && !n.attributes[0].value.value.includes(`
`) && !o && !x4(n.attributes[0])) return p3(["<", r3("name"), r3("typeArguments"), " ", ...e3.map(r3, "attributes"), n.selfClosing ? " />" : ">"]);
    let i = n.attributes?.some((u) => q3(u.value) && u.value.value.includes(`
`)), s = t.singleAttributePerLine && n.attributes.length > 1 ? d : T3;
    return p3(["<", r3("name"), r3("typeArguments"), m3(e3.map(({ isFirst: u, previous: a }) => [u ? s : me3(a, t) ? [d, d] : s, r3()], "attributes")), ...VD(n, t, o)], { shouldBreak: i });
  }
  function VD(e3, t, r3) {
    return e3.selfClosing ? [T3, "/>"] : KD(e3, t, r3) ? [">"] : [y3, ">"];
  }
  function KD(e3, t, r3) {
    let n = e3.attributes.length > 0 && x4(w3(0, e3.attributes, -1), g4.Trailing);
    return e3.attributes.length === 0 && !r3 || (t.bracketSameLine || t.jsxBracketSameLine) && (!r3 || e3.attributes.length > 0) && !n;
  }
  function $D(e3, t, r3) {
    let { node: n } = e3, o = ["</"], i = r3("name");
    return x4(n.name, g4.Leading | g4.Line) ? o.push(m3([d, i]), d) : x4(n.name, g4.Leading | g4.Block) ? o.push(" ", i) : o.push(i), o.push(">"), o;
  }
  function QD(e3, t) {
    let { node: r3 } = e3, n = x4(r3), o = x4(r3, g4.Line), i = r3.type === "JSXOpeningFragment";
    return [i ? "<" : "</", m3([o ? d : n && !i ? " " : "", W4(e3, t)]), o ? d : "", ">"];
  }
  function zD(e3, t, r3) {
    let n = Q3(e3, WD(e3, t, r3), t);
    return UD(e3, n, t);
  }
  function ZD(e3, t) {
    let { node: r3 } = e3, n = x4(r3, g4.Line);
    return [W4(e3, t, { indent: n }), n ? d : ""];
  }
  function ey(e3, t, r3) {
    let { node: n } = e3;
    return ["{", e3.call(({ node: o }) => {
      let i = ["...", r3()];
      return x4(o) ? [m3([y3, Q3(e3, i, t)]), y3] : i;
    }, n.type === "JSXSpreadAttribute" ? "argument" : "expression"), "}"];
  }
  function Wp(e3, t, r3) {
    let { node: n } = e3;
    if (n.type.startsWith("JSX")) switch (n.type) {
      case "JSXAttribute":
        return YD(e3, t, r3);
      case "JSXIdentifier":
        return n.name;
      case "JSXNamespacedName":
        return L3(":", [r3("namespace"), r3("name")]);
      case "JSXMemberExpression":
        return L3(".", [r3("object"), r3("property")]);
      case "JSXSpreadAttribute":
      case "JSXSpreadChild":
        return ey(e3, t, r3);
      case "JSXExpressionContainer":
        return HD(e3, t, r3);
      case "JSXFragment":
      case "JSXElement":
        return zD(e3, t, r3);
      case "JSXOpeningElement":
        return XD(e3, t, r3);
      case "JSXClosingElement":
        return $D(e3, t, r3);
      case "JSXOpeningFragment":
      case "JSXClosingFragment":
        return QD(e3, t);
      case "JSXEmptyExpression":
        return ZD(e3, t);
      case "JSXText":
        throw new Error("JSXText should be handled by JSXElement");
      default:
        throw new it3(n, "JSX");
    }
  }
  function ty(e3) {
    if (e3.children.length === 0) return true;
    if (e3.children.length > 1) return false;
    let t = e3.children[0];
    return t.type === "JSXText" && !Ht3(t);
  }
  function ry(e3) {
    return e3.type === "JSXExpressionContainer" && q3(e3.expression) && e3.expression.value === " " && !x4(e3.expression);
  }
  function Jp(e3, t, r3) {
    let { node: n } = e3, o = n.parameters.length > 1 ? Ie3(t) : "", i = p3([m3([y3, L3([", ", y3], e3.map(r3, "parameters"))]), o, y3]);
    return [e3.key === "body" && e3.parent.type === "ClassBody" && n.static ? "static " : "", n.readonly ? "readonly " : "", "[", n.parameters ? i : "", "]", G4(e3, r3), ke3(e3, t)];
  }
  function gi(e3, t, r3) {
    let { node: n } = e3;
    return [n.postfix ? "" : r3, G4(e3, t), n.postfix ? r3 : ""];
  }
  function Gp(e3, t, r3) {
    let { node: n } = e3, o = [], i = n.kind && n.kind !== "method" ? `${n.kind} ` : "";
    o.push(Ut3(n), i, ve3(e3, t, r3), $3(e3));
    let s = Ke3(e3, t, r3, false, true), u = G4(e3, r3, "returnType"), a = Bt3(n, u);
    return o.push(a ? p3(s) : s), n.returnType && o.push(p3(u)), [p3(o), ke3(e3, t)];
  }
  function Up(e3, t, r3) {
    let { node: n } = e3;
    return [ne3(e3), n.kind === "global" ? "" : `${n.kind} `, r3("id"), n.body ? [" ", p3(r3("body"))] : R3(t)];
  }
  function qp(e3, t, r3) {
    let { node: n } = e3, o = !(Y4(n.expression) || ie3(n.expression)), i = p3(["<", m3([y3, r3("typeAnnotation")]), y3, ">"]), s = [O3("("), m3([y3, r3("expression")]), y3, O3(")")];
    return o ? mt3([[i, r3("expression")], [i, p3(s, { shouldBreak: true })], [i, r3("expression")]]) : p3([i, r3("expression")]);
  }
  function Yp(e3, t, r3, n) {
    let { node: o } = e3;
    if (o.type.startsWith("TS")) {
      if (Fn3(o)) return o.type.slice(2, -7).toLowerCase();
      switch (o.type) {
        case "TSThisType":
          return "this";
        case "TSTypeAssertion":
          return qp(e3, t, r3);
        case "TSDeclareFunction":
          return fr2(e3, t, r3);
        case "TSExportAssignment":
          return ["export = ", r3("expression"), R3(t)];
        case "TSModuleBlock":
          return Hn3(e3, t, r3);
        case "TSInterfaceBody":
        case "TSTypeLiteral":
          return Vt3(e3, t, r3);
        case "TSTypeAliasDeclaration":
          return lo2(e3, t, r3);
        case "TSQualifiedName":
          return [r3("left"), ".", r3("right")];
        case "TSAbstractMethodDefinition":
        case "TSDeclareMethod":
          return Xn3(e3, t, r3);
        case "TSAbstractAccessorProperty":
        case "TSAbstractPropertyDefinition":
          return Vn3(e3, t, r3);
        case "TSInterfaceHeritage":
        case "TSClassImplements":
        case "TSInstantiationExpression":
          return [r3("expression"), r3("typeArguments")];
        case "TSTemplateLiteralType":
          return On3(e3, t, r3);
        case "TSNamedTupleMember":
          return co2(e3, t, r3);
        case "TSRestType":
          return po2(e3, t, r3);
        case "TSOptionalType":
          return [r3("typeAnnotation"), "?"];
        case "TSInterfaceDeclaration":
          return Ar2(e3, t, r3);
        case "TSTypeParameterDeclaration":
        case "TSTypeParameterInstantiation":
          return Kt3(e3, t, r3, "params");
        case "TSTypeParameter":
          return mo2(e3, t, r3);
        case "TSAsExpression":
        case "TSSatisfiesExpression":
          return ro2(e3, t, r3);
        case "TSArrayType":
          return to2(r3);
        case "TSPropertySignature":
          return [o.readonly ? "readonly " : "", ve3(e3, t, r3), $3(e3), G4(e3, r3), ke3(e3, t)];
        case "TSParameterProperty":
          return [Ut3(o), o.static ? "static " : "", o.override ? "override " : "", o.readonly ? "readonly " : "", r3("parameter")];
        case "TSTypeQuery":
          return Do2(e3, r3);
        case "TSIndexSignature":
          return Jp(e3, t, r3);
        case "TSTypePredicate":
          return fo2(e3, r3);
        case "TSNonNullExpression":
          return [r3("expression"), "!"];
        case "TSImportType":
          return [Xt3(e3, t, r3), o.qualifier ? [".", r3("qualifier")] : "", Kt3(e3, t, r3, "typeArguments")];
        case "TSLiteralType":
          return r3("literal");
        case "TSIndexedAccessType":
          return so2(e3, t, r3);
        case "TSTypeOperator":
          return [o.operator, " ", r3("typeAnnotation")];
        case "TSMappedType":
          return kp(e3, t, r3);
        case "TSMethodSignature":
          return Gp(e3, t, r3);
        case "TSNamespaceExportDeclaration":
          return ["export as namespace ", r3("id"), R3(t)];
        case "TSEnumDeclaration":
          return oo2(e3, r3);
        case "TSEnumBody":
          return ft3(e3, t, r3);
        case "TSEnumMember":
          return no2(e3, t, r3);
        case "TSImportEqualsDeclaration":
          return ["import ", Fi2(o, false), r3("id"), " = ", r3("moduleReference"), R3(t)];
        case "TSExternalModuleReference":
          return Xt3(e3, t, r3);
        case "TSModuleDeclaration":
          return Up(e3, t, r3);
        case "TSConditionalType":
          return gr2(e3, t, r3);
        case "TSInferType":
          return uo2(e3, t, r3);
        case "TSIntersectionType":
          return ao2(e3, t, r3);
        case "TSUnionType":
          return bn3(e3, t, r3, n);
        case "TSFunctionType":
        case "TSCallSignatureDeclaration":
        case "TSConstructorType":
        case "TSConstructSignatureDeclaration":
          return io2(e3, t, r3);
        case "TSTupleType":
          return xr2(e3, t, r3);
        case "TSTypeReference":
          return [r3("typeName"), Kt3(e3, t, r3, "typeArguments")];
        case "TSTypeAnnotation":
          return Pn3(e3, t, r3);
        case "TSEmptyBodyFunctionExpression":
          return In3(e3, t, r3);
        case "TSJSDocAllType":
          return "*";
        case "TSJSDocUnknownType":
          return "?";
        case "TSJSDocNullableType":
          return gi(e3, r3, "?");
        case "TSJSDocNonNullableType":
          return gi(e3, r3, "!");
        default:
          throw new it3(o, "TypeScript");
      }
    }
  }
  function ny(e3, t, r3, n) {
    for (let o of [la, Wp, Np, Yp, Fp]) {
      let i = o(e3, t, r3, n);
      if (i !== void 0) return i;
    }
  }
  var oy = B3(["ClassMethod", "ClassPrivateMethod", "ClassProperty", "ClassAccessorProperty", "AccessorProperty", "TSAbstractAccessorProperty", "PropertyDefinition", "TSAbstractPropertyDefinition", "ClassPrivateProperty", "MethodDefinition", "TSAbstractMethodDefinition", "TSDeclareMethod"]);
  function hi2(e3, t, r3, n) {
    e3.isRoot && t.__onHtmlBindingRoot?.(e3.node, t);
    let { node: o } = e3, i = Cr2(e3) ? jp(e3, t) : ny(e3, t, r3, n);
    if (!i) return "";
    if (oy(o)) return i;
    i = iy(e3, t, i);
    let s = o.type !== "ClassExpression" && j4(o.decorators) ? Wn3(e3, t, r3) : "", u = oe3(e3, t);
    return !s && !u ? i : mn3(i, (a) => [u ? "(" : "", s ? p3([s, a]) : a, u ? ")" : ""]);
  }
  function iy(e3, t, r3) {
    let { node: n } = e3;
    return (x4(n, g4.Leading) || x4(n, g4.Trailing)) && tn3(e3) ? [m3([y3, Q3(e3, r3, t)]), y3] : r3;
  }
  var sy = { experimental_avoidAstMutation: true, experimental_locForRangeFormat: { locStart: b3, locEnd: It3 } };
  var Si2 = { features: sy, massageAstNode: oi3, canAttachComment: Vi2, handleComments: ds, isGap: Cs, willPrintOwnComments: Tu3, embed: Ju3, insertPragma: oa, printComment: ia, printPrettierIgnored: hi2, print: hi2, getVisitorKeys: un3, isBlockComment: le3, hasPrettierIgnore: Cr2 };
  var bi2 = [{ name: "JSON.stringify", type: "data", aceMode: "json", extensions: [".importmap"], filenames: ["package.json", "package-lock.json", "composer.json"], tmScope: "source.json", aliases: ["geojson", "jsonl", "sarif", "topojson"], codemirrorMode: "javascript", codemirrorMimeType: "application/json", parsers: ["json-stringify"], vscodeLanguageIds: ["json"], linguistLanguageId: 174 }, { name: "JSON", type: "data", aceMode: "json", extensions: [".json", ".4DForm", ".4DProject", ".avsc", ".geojson", ".gltf", ".har", ".ice", ".JSON-tmLanguage", ".json.example", ".mcmeta", ".sarif", ".slnlaunch", ".tact", ".tfstate", ".tfstate.backup", ".topojson", ".webapp", ".webmanifest", ".yy", ".yyp"], filenames: [".all-contributorsrc", ".arcconfig", ".auto-changelog", ".c8rc", ".htmlhintrc", ".imgbotconfig", ".nycrc", ".tern-config", ".tern-project", ".watchmanconfig", ".babelrc", ".jscsrc", ".jshintrc", ".jslintrc", ".swcrc"], tmScope: "source.json", aliases: ["geojson", "jsonl", "sarif", "topojson"], codemirrorMode: "javascript", codemirrorMimeType: "application/json", parsers: ["json"], vscodeLanguageIds: ["json"], linguistLanguageId: 174 }, { name: "JSON with Comments", type: "data", aceMode: "javascript", extensions: [".jsonc", ".code-snippets", ".code-workspace", ".sublime-build", ".sublime-color-scheme", ".sublime-commands", ".sublime-completions", ".sublime-keymap", ".sublime-macro", ".sublime-menu", ".sublime-mousemap", ".sublime-project", ".sublime-settings", ".sublime-theme", ".sublime-workspace", ".sublime_metrics", ".sublime_session"], filenames: [], tmScope: "source.json.comments", aliases: ["jsonc"], codemirrorMode: "javascript", codemirrorMimeType: "text/javascript", group: "JSON", parsers: ["jsonc"], vscodeLanguageIds: ["jsonc"], linguistLanguageId: 423 }, { name: "JSON5", type: "data", aceMode: "json5", extensions: [".json5"], tmScope: "source.js", codemirrorMode: "javascript", codemirrorMimeType: "application/json", parsers: ["json5"], vscodeLanguageIds: ["json5"], linguistLanguageId: 175 }];
  var yo2 = {};
  Co2(yo2, { estree: () => Si2, "estree-json": () => py });
  var Hp = { JsonRoot: ["node"], ArrayExpression: ["elements"], ObjectExpression: ["properties"], ObjectProperty: ["key", "value"], UnaryExpression: ["argument"], NullLiteral: [], BooleanLiteral: [], StringLiteral: [], NumericLiteral: [], Identifier: [], TemplateLiteral: ["quasis"], TemplateElement: [] };
  var uy = sn3(Hp);
  var Xp = uy;
  function Ur2(e3) {
    return e3.extra.raw;
  }
  var ay = /* @__PURE__ */ new Set(["start", "end", "loc", "comments", "leadingComments", "trailingComments", "innerComments", "errors", "range", "tokens"]);
  function Pi2(e3, t) {
    let { type: r3 } = e3;
    if (r3 === "ObjectProperty") {
      let { key: n } = e3;
      if (n.type === "Identifier") {
        let { name: o } = n;
        t.key = { type: "StringLiteral", value: o, extra: { rawValue: o } };
      } else if (n.type === "NumericLiteral") {
        let o = Ur2(n);
        String(Number(o)) === o && (t.key = { type: "StringLiteral", value: o, extra: { rawValue: o } });
      }
    }
    if (r3 === "StringLiteral" && delete t.extra.raw, r3 === "UnaryExpression" && e3.operator === "+") return t.argument;
    if ((r3 === "ArrayExpression" || r3 === "ObjectExpression") && (t.extra ?? (t.extra = {}), e3.extra?.trailingComma && delete t.extra.trailingComma), r3 === "ArrayExpression") {
      for (let [n, o] of e3.elements.entries()) o === null && t.elements.splice(n, 0, { type: "NullLiteral" });
      return;
    }
    if (r3 === "TemplateLiteral") {
      let n = e3.quasis[0].value.cooked;
      return { type: "StringLiteral", value: n, extra: { rawValue: n } };
    }
  }
  Pi2.ignoredProperties = ay;
  function Ii2(e3, t, r3) {
    let { node: n } = e3;
    switch (n.type) {
      case "JsonRoot":
        return [r3("node"), d];
      case "ArrayExpression": {
        if (n.elements.length === 0) return "[]";
        let o = e3.map(() => e3.node === null ? "null" : r3(), "elements");
        return ["[", m3([d, L3([",", d], o)]), d, "]"];
      }
      case "ObjectExpression":
        return n.properties.length === 0 ? "{}" : ["{", m3([d, L3([",", d], e3.map(r3, "properties"))]), d, "}"];
      case "ObjectProperty":
        return [r3("key"), ": ", r3("value")];
      case "UnaryExpression":
        return [n.operator === "+" ? "" : n.operator, r3("argument")];
      case "NullLiteral":
        return "null";
      case "BooleanLiteral":
        return n.value ? "true" : "false";
      case "StringLiteral":
        return ot3(Ur2(n), t);
      case "NumericLiteral": {
        let o = Ur2(n);
        return Vp(e3) && String(Number(o)) === o ? `"${o}"` : o;
      }
      case "Identifier":
        return Vp(e3) ? JSON.stringify(n.name) : n.name;
      case "TemplateLiteral":
        return r3(["quasis", 0]);
      case "TemplateElement":
        return JSON.stringify(n.value.cooked);
      default:
        throw new it3(n, "JSON");
    }
  }
  function Vp(e3) {
    return e3.key === "key" && e3.parent.type === "ObjectProperty";
  }
  var py = { massageAstNode: Pi2, print: Ii2, getVisitorKeys: Xp };
  var hr2 = { bracketSpacing: { category: "Common", type: "boolean", default: true, description: "Print spaces between brackets.", oppositeDescription: "Do not print spaces between brackets." }, objectWrap: { category: "Common", type: "choice", default: "preserve", description: "How to wrap object literals.", choices: [{ value: "preserve", description: "Keep as multi-line, if there is a newline between the opening brace and first property." }, { value: "collapse", description: "Fit to a single line when possible." }] }, singleQuote: { category: "Common", type: "boolean", default: false, description: "Use single quotes instead of double quotes." }, proseWrap: { category: "Common", type: "choice", default: "preserve", description: "How to wrap prose.", choices: [{ value: "always", description: "Wrap prose if it exceeds the print width." }, { value: "never", description: "Do not wrap prose." }, { value: "preserve", description: "Wrap prose as-is." }] }, bracketSameLine: { category: "Common", type: "boolean", default: false, description: "Put > of opening tags on the last line instead of on a new line." }, singleAttributePerLine: { category: "Common", type: "boolean", default: false, description: "Enforce single attribute per line in HTML, Vue and JSX." } };
  var vt3 = "JavaScript";
  var cy = { arrowParens: { category: vt3, type: "choice", default: "always", description: "Include parentheses around a sole arrow function parameter.", choices: [{ value: "always", description: "Always include parens. Example: `(x) => x`" }, { value: "avoid", description: "Omit parens when possible. Example: `x => x`" }] }, bracketSameLine: hr2.bracketSameLine, objectWrap: hr2.objectWrap, bracketSpacing: hr2.bracketSpacing, jsxBracketSameLine: { category: vt3, type: "boolean", description: "Put > on the last line instead of at a new line.", deprecated: "2.4.0" }, semi: { category: vt3, type: "boolean", default: true, description: "Print semicolons.", oppositeDescription: "Do not print semicolons, except at the beginning of lines which may need them." }, experimentalOperatorPosition: { category: vt3, type: "choice", default: "end", description: "Where to print operators when binary expressions wrap lines.", choices: [{ value: "start", description: "Print operators at the start of new lines." }, { value: "end", description: "Print operators at the end of previous lines." }] }, experimentalTernaries: { category: vt3, type: "boolean", default: false, description: "Use curious ternaries, with the question mark after the condition.", oppositeDescription: "Default behavior of ternaries; keep question marks on the same line as the consequent." }, singleQuote: hr2.singleQuote, jsxSingleQuote: { category: vt3, type: "boolean", default: false, description: "Use single quotes in JSX." }, quoteProps: { category: vt3, type: "choice", default: "as-needed", description: "Change when properties in objects are quoted.", choices: [{ value: "as-needed", description: "Only add quotes around object properties where required." }, { value: "consistent", description: "If at least one property in an object requires quotes, quote all properties." }, { value: "preserve", description: "Respect the input use of quotes in object properties." }] }, trailingComma: { category: vt3, type: "choice", default: "all", description: "Print trailing commas wherever possible when multi-line.", choices: [{ value: "all", description: "Trailing commas wherever possible (including function arguments)." }, { value: "es5", description: "Trailing commas where valid in ES5 (objects, arrays, etc.)" }, { value: "none", description: "No trailing commas." }] }, singleAttributePerLine: hr2.singleAttributePerLine };
  var Kp = cy;
  var ly = { ...Bi2, ...yo2 };
  var my = [...Mi2, ...bi2];

  // entry.js
  globalThis.__konsupuFormat = (source) => Pu(source, { parser: "meriyah", plugins: [meriyah_exports, estree_exports] });
})();
