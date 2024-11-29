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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AxiosLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AxiosLogger = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../logger.service");
const axios_1 = __importDefault(require("axios"));
let AxiosLogger = exports.AxiosLogger = AxiosLogger_1 = class AxiosLogger {
    logger;
    constructor(logger) {
        this.logger = logger;
        this.logger.label = AxiosLogger_1.name;
    }
    onApplicationBootstrap() {
        const logger = this.logger;
        axios_1.default.interceptors.request.use(function logAxiosRequest(config) {
            const { adapter, httpsAgent, httpAgent, validateStatus, ...otherConfig } = config;
            logger.breadcrumb(`${config.method} ` +
                `${new URL(config.url ?? "/", config.baseURL).toString()}`, {
                config: otherConfig,
                usingHttps: !!httpsAgent,
                agentConfig: httpsAgent?.options ?? httpAgent?.options,
            });
            return config;
        });
    }
};
exports.AxiosLogger = AxiosLogger = AxiosLogger_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logger_service_1.LoggerService])
], AxiosLogger);
//# sourceMappingURL=axios.logger.js.map