"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformStackTrace = void 0;
// noinspection JSUnusedGlobalSymbols
exports.transformStackTrace = {
    transform(info) {
        if (!info.stack)
            return info;
        const { stack: _stack, causedBy: _causedBy, causedByMessage: _causedByMessage, ...infoWithoutBc } = info;
        const causedByMessage = _causedByMessage;
        const stack = _stack;
        const causedBy = _causedBy;
        infoWithoutBc.message += "\n";
        infoWithoutBc.message += "Stacktrace:";
        infoWithoutBc.message += "\n";
        infoWithoutBc.message += stack.map((e) => `  - ${e}`).join("\n");
        if (causedBy.length) {
            infoWithoutBc.message += "\n\n";
            infoWithoutBc.message += "Caused by: ";
            infoWithoutBc.message += causedByMessage ?? "";
            infoWithoutBc.message += "\n";
            infoWithoutBc.message += causedBy.map((e) => `  - ${e}`).join("\n");
        }
        return infoWithoutBc;
    },
};
//# sourceMappingURL=stack.transform.js.map