"use strict";
// noinspection JSUnusedGlobalSymbols
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformLabelTimestamp = void 0;
const util_1 = __importDefault(require("util"));
exports.transformLabelTimestamp = {
    transform(info) {
        const { label: _label, context: _context, timestamp: _timestamp, format: _format, ...infoWithoutBc } = info;
        const context = _context || _label;
        const format = _format || [];
        const label = _label === "nest" ? context : _label || "app";
        const timestamp = new Date(_timestamp);
        infoWithoutBc.level = `${timestamp.toLocaleString()} ${info.level}`;
        infoWithoutBc.message = util_1.default.format(`[${label}] ${info.message}`, ...format);
        return infoWithoutBc;
    },
};
//# sourceMappingURL=label-timestamp.transform.js.map