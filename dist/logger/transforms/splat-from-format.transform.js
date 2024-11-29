"use strict";
// noinspection JSUnusedGlobalSymbols
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSplatFromFormat = void 0;
const util_1 = __importDefault(require("util"));
exports.transformSplatFromFormat = {
    transform(info) {
        const { format: _format, ...infoWithoutBc } = info;
        const format = _format || [];
        infoWithoutBc.message = util_1.default.format(info.message, ...format);
        return infoWithoutBc;
    },
};
//# sourceMappingURL=splat-from-format.transform.js.map