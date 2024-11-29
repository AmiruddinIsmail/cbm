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
var HealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../logger/logger.service");
const terminus_1 = require("@nestjs/terminus");
let HealthService = exports.HealthService = HealthService_1 = class HealthService {
    logger;
    patients = new Array();
    constructor(logger) {
        this.logger = logger;
        this.logger.label = HealthService_1.name;
    }
    registerPatient(name, callback, timeout = 10000) {
        this.patients.push({
            name,
            isHealthy: callback,
            timeout,
        });
    }
    async createCallbackPromise(info) {
        return {
            name: info.name,
            result: await new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        status: "down",
                        message: "health check has timed out",
                    });
                });
                info
                    .isHealthy()
                    .then((result) => {
                    resolve(result);
                })
                    .catch((error) => {
                    if (error instanceof Error) {
                        resolve({
                            status: "down",
                            message: error?.stack ?? error.message,
                        });
                    }
                });
            }),
        };
    }
    awaitOrTimeout(info) {
        const timeout = info.timeout;
        return Promise.race([
            info
                .isHealthy()
                .then((e) => ({
                [info.name]: e,
            }))
                .catch((error) => {
                if (error instanceof Error) {
                    throw new terminus_1.HealthCheckError(error.stack ?? error.message, error.cause);
                }
                else {
                    throw new terminus_1.HealthCheckError("unparseable error", error);
                }
            }),
            new Promise((_, reject) => {
                setTimeout(() => reject(new terminus_1.TimeoutError(timeout, { name: info.name })), timeout);
            }),
        ]);
    }
    getHealthCallbacks() {
        return this.patients.map((e) => () => this.awaitOrTimeout(e));
    }
};
exports.HealthService = HealthService = HealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], HealthService);
//# sourceMappingURL=health.service.js.map