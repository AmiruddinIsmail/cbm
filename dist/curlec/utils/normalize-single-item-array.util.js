"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSingleItemArray = void 0;
function normalizeSingleItemArray(obj) {
    const keys = Object.keys(obj);
    return keys.reduce((a, b) => {
        const value = obj[b];
        a[b] = Array.isArray(value) ? value[0] : value;
        return a;
    }, {});
}
exports.normalizeSingleItemArray = normalizeSingleItemArray;
//# sourceMappingURL=normalize-single-item-array.util.js.map