"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DatabaseLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseLogger = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../logger.service");
let DatabaseLogger = exports.DatabaseLogger = DatabaseLogger_1 = class DatabaseLogger {
    logger;
    constructor(logger) {
        this.logger = logger;
        this.logger.label = DatabaseLogger_1.name;
    }
    getDatabaseLogger() {
        const logger = this.logger;
        return {
            log(level, message) {
                level = level === "info" ? "log" : "warn";
                logger[level](message);
            },
            logMigration(message) {
                logger.log(message, { context: "migration" });
            },
            logQuery(query, parameters) {
                // init
                if (query.includes("SELECT VERSION() AS `version`"))
                    return;
                // health check
                if (query.includes("SELECT 1"))
                    return;
                logger.breadcrumb(query, parameters);
            },
            logQueryError(error, query, parameters) {
                const message = typeof error === "string" ? error : error.message;
                logger.error(message, { query, parameters }, typeof error === "string" ? null : error);
            },
            logQuerySlow(time, query, parameters) {
                logger.warn(query, { context: "slow query", parameters, time });
            },
            logSchemaBuild(message) {
                logger.log(message, { context: "schema" });
            },
        };
    }
};
exports.DatabaseLogger = DatabaseLogger = DatabaseLogger_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], DatabaseLogger);
//# sourceMappingURL=database.logger.js.map