"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurlecDateUtil = void 0;
const format_1 = __importDefault(require("date-fns/format"));
/**
 * Date that can be transformed into Curlec date format
 * aka YYYY-MM-DD HH:MM (e.g. 2023-01-02 15:16)
 */
class CurlecDateUtil {
    nowHourZero() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    toParam(date) {
        return (0, format_1.default)(date, "yyyy-MM-dd HH:mm");
    }
    fromObject({ year, month, date }) {
        return new Date(year, month, date);
    }
    toObject(date) {
        return {
            year: date.getFullYear(),
            month: date.getMonth(),
            date: date.getDate(),
        };
    }
    clone(collectionToUnchecked) {
        return new Date(collectionToUnchecked.getTime());
    }
    equalsDateOnly(collectionFrom, collectionTo) {
        return (collectionFrom.getFullYear() === collectionTo.getFullYear() &&
            collectionFrom.getMonth() === collectionTo.getMonth() &&
            collectionFrom.getDate() === collectionTo.getDate());
    }
    toObjectRecords(dateRange) {
        return Object.keys(dateRange).reduce((a, b) => {
            if (dateRange[b] instanceof Date) {
                a[b] = this.toObject(dateRange[b]);
            }
            else {
                a[b] = dateRange[b];
            }
            return a;
        }, {});
    }
}
exports.CurlecDateUtil = CurlecDateUtil;
//# sourceMappingURL=curlec-date.util.js.map