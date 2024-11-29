"use strict";
// noinspection JSUnusedGlobalSymbols
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformBreadcrumbs = void 0;
exports.transformBreadcrumbs = {
    transform(info) {
        if (!info.breadcrumbs)
            return info;
        const { breadcrumbs: _breadcrumbs, ...infoWithoutBc } = info;
        const breadcrumbs = _breadcrumbs;
        const mappedBc = breadcrumbs.map(({ action, timestamp, label, ...context }) => `  > ${timestamp.toLocaleTimeString()} [${label}] ${action} ${JSON.stringify(context)}`);
        infoWithoutBc.message += "\n";
        infoWithoutBc.message += "Breadcrumbs:";
        infoWithoutBc.message += "\n";
        infoWithoutBc.message += mappedBc.join("\n");
        return infoWithoutBc;
    },
};
//# sourceMappingURL=breadcrumb.transform.js.map