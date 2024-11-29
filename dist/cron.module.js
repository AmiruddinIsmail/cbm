"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const curlec_module_1 = require("./curlec/curlec.module");
const logger_service_1 = require("./logger/logger.service");
const logger_module_1 = require("./logger/logger.module");
const schedule_1 = require("@nestjs/schedule");
const sqlite3_module_1 = require("./database/sqlite3.module");
const mysql_module_1 = require("./database/mysql.module");
const health_module_1 = require("./health/health.module");
let CronModule = exports.CronModule = class CronModule {
    onApplicationBootstrap() { }
};
exports.CronModule = CronModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            logger_module_1.LoggerModule,
            mysql_module_1.MysqlModule,
            sqlite3_module_1.SQLite3Module,
            curlec_module_1.CurlecModule,
            schedule_1.ScheduleModule.forRoot(),
            health_module_1.HealthModule,
        ],
    })
], CronModule);
async function bootstrap() {
    const app = await core_1.NestFactory.create(CronModule, {
        logger: logger_service_1.LoggerService.getNestLogger(),
    });
    app.enableShutdownHooks();
    const configService = await app.get(config_1.ConfigService);
    const port = configService.get("CRON_PORT") ?? "3000";
    await app.listen(port);
    logger_service_1.LoggerService.getNestLogger().log("Listening at port %d", port, "NestApplication");
}
bootstrap();
//# sourceMappingURL=cron.module.js.map