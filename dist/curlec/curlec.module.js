"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurlecModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const curlec_service_1 = require("./curlec.service");
const logger_module_1 = require("../logger/logger.module");
const typeorm_1 = require("@nestjs/typeorm");
const curlec_payment_history_entity_1 = require("./entities/curlec-payment-history.entity");
const cronjob_status_entity_1 = require("./entities/cronjob-status.entity");
const fetch_payment_history_job_1 = require("./jobs/fetch-payment-history.job");
const spider_payment_entity_1 = require("./entities/spider-payment.entity");
const curlec_date_util_1 = require("./utils/curlec-date.util");
const health_module_1 = require("../health/health.module");
const cronJobs = [
    fetch_payment_history_job_1.FetchPaymentHistoryJob,
];
let CurlecModule = exports.CurlecModule = class CurlecModule {
};
exports.CurlecModule = CurlecModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            logger_module_1.LoggerModule,
            typeorm_1.TypeOrmModule.forFeature([curlec_payment_history_entity_1.CurlecPaymentHistoryEntity, spider_payment_entity_1.SpiderPaymentEntity], "spider"),
            typeorm_1.TypeOrmModule.forFeature([cronjob_status_entity_1.CronjobStatusEntity], "local"),
            health_module_1.HealthModule,
        ],
        providers: [curlec_service_1.CurlecService, curlec_date_util_1.CurlecDateUtil, ...cronJobs],
        exports: [curlec_service_1.CurlecService],
    })
], CurlecModule);
//# sourceMappingURL=curlec.module.js.map