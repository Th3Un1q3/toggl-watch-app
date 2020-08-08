/* eslint-disable no-extend-native,max-len,new-cap,no-var,prefer-rest-params */
Array.prototype.includes||Object.defineProperty(Array.prototype, 'includes', {value: function(r, e) {
  if (null==this) throw new TypeError('"this" is null or not defined'); const t=Object(this); const n=t.length>>>0; if (0===n) return !1; let i; let o; const a=0|e; let u=Math.max(0<=a?a:n-Math.abs(a), 0); for (;u<n;) {
    if ((i=t[u])===(o=r)||'number'==typeof i&&'number'==typeof o&&isNaN(i)&&isNaN(o)) return !0; u++;
  } return !1;
}});


// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    },
    configurable: true,
    writable: true,
  });
}
