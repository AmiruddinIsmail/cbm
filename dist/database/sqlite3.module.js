"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLite3Module = exports.connectionName = exports.entities = void 0;
const typeorm_1 = require("@nestjs/typeorm");
const cronjob_status_entity_1 = require("../curlec/entities/cronjob-status.entity");
exports.entities = [cronjob_status_entity_1.CronjobStatusEntity];
exports.connectionName = "local";
exports.SQLite3Module = typeorm_1.TypeOrmModule.forRootAsync({
    name: exports.connectionName,
    useFactory() {
        return {
            type: "better-sqlite3",
            database: "./data/cronjob.sqlite3",
            entities: exports.entities,
            synchronize: true,
        };
    },
});
//# sourceMappingURL=sqlite3.module.js.map