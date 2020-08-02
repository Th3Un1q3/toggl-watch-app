/* eslint-disable no-extend-native,max-len */
Array.prototype.includes||Object.defineProperty(Array.prototype, 'includes', {value: function(r, e) {
  if (null==this) throw new TypeError('"this" is null or not defined'); const t=Object(this); const n=t.length>>>0; if (0===n) return !1; let i; let o; const a=0|e; let u=Math.max(0<=a?a:n-Math.abs(a), 0); for (;u<n;) {
    if ((i=t[u])===(o=r)||'number'==typeof i&&'number'==typeof o&&isNaN(i)&&isNaN(o)) return !0; u++;
  } return !1;
}});
