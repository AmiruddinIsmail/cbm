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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const logger_module_1 = require("./logger/logger.module");
const logger_service_1 = require("./logger/logger.service");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
let HelloLogger = class HelloLogger {
    logger;
    constructor(logger) {
        this.logger = logger;
        this.logger.label = "hello";
    }
};
HelloLogger = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], HelloLogger);
let ByeLogger = class ByeLogger {
    logger;
    constructor(logger) {
        this.logger = logger;
        this.logger.label = "bye";
    }
};
ByeLogger = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], ByeLogger);
let TestModule = class TestModule {
    helloLogger;
    byeLogger;
    constructor(helloLogger, byeLogger) {
        this.helloLogger = helloLogger;
        this.byeLogger = byeLogger;
    }
    onApplicationBootstrap() {
        this.helloLogger.logger.log("this is the start of logger");
        this.helloLogger.logger.breadcrumb("database operation", {
            sql: "DROP DATABASE HEHHEH",
        });
        this.byeLogger.logger.breadcrumb("API Request", {
            url: "https://google.com",
        });
        this.byeLogger.logger.error(`oh no, something happened: %s`, "data");
        this.byeLogger.logger.error(`oh no, something happened again: ${5}`);
        this.byeLogger.logger.error(`ok one last error with formatting: %d`, 122, new Error("no error"));
        this.byeLogger.logger.log("bye");
    }
};
TestModule = __decorate([
    (0, common_1.Module)({
        imports: [
            logger_module_1.LoggerModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
        ],
        providers: [HelloLogger, ByeLogger],
    }),
    __metadata("design:paramtypes", [HelloLogger,
        ByeLogger])
], TestModule);
async function go() {
    const app = await core_1.NestFactory.create(TestModule, {
        logger: logger_service_1.LoggerService.getNestLogger(),
    });
    await app.init();
    await app.close();
}
go().then(() => logger_service_1.LoggerService.getNestLogger().log("Done!"));
//# sourceMappingURL=test-logger.js.map