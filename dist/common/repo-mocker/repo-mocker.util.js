"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepoMockerUtil = void 0;
const MySQLConfig = __importStar(require("../../database/mysql.module"));
const SQLiteConfig = __importStar(require("../../database/sqlite3.module"));
const typeorm_1 = require("@nestjs/typeorm");
class RepoMockerUtil {
    repos = {};
    entitiesToConnectionName = {};
    constructor() {
        for (let entity of MySQLConfig.entities) {
            this.entitiesToConnectionName[entity] = MySQLConfig.connectionName;
        }
        for (let entity of SQLiteConfig.entities) {
            this.entitiesToConnectionName[entity] =
                SQLiteConfig.connectionName;
        }
    }
    provide(EntityClass) {
        const connectionName = this.entitiesToConnectionName[EntityClass];
        this.repos[EntityClass] = {};
        return {
            provide: (0, typeorm_1.getRepositoryToken)(EntityClass, connectionName),
            useValue: this.repos[EntityClass],
        };
    }
    getRepo(EntityClass) {
        return this.repos[EntityClass];
    }
    reset() {
        this.repos = {};
    }
}
exports.RepoMockerUtil = RepoMockerUtil;
//# sourceMappingURL=repo-mocker.util.js.map