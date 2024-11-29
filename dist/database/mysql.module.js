"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlModule = exports.connectionName = exports.entities = void 0;
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const database_logger_1 = require("../logger/breadcrumbs/database.logger");
const curlec_payment_history_entity_1 = require("../curlec/entities/curlec-payment-history.entity");
const spider_payment_entity_1 = require("../curlec/entities/spider-payment.entity");
exports.entities = [curlec_payment_history_entity_1.CurlecPaymentHistoryEntity, spider_payment_entity_1.SpiderPaymentEntity];
exports.connectionName = "spider";
exports.MysqlModule = typeorm_1.TypeOrmModule.forRootAsync({
    name: exports.connectionName,
    useFactory(configService, dbLogger) {
        const host = configService.get("DB_HOST");
        const port = configService.get("DB_PORT");
        const username = configService.get("DB_USERNAME");
        const password = configService.get("DB_PASSWORD");
        const database = configService.get("DB_DATABASE");
        const dbConfig = {
            type: "mysql",
            host,
            port,
            username,
            password,
            database,
        };
        const options = {
            ...dbConfig,
            logger: dbLogger.getDatabaseLogger(),
            entities: exports.entities,
        };
        return options;
    },
    inject: [config_1.ConfigService, database_logger_1.DatabaseLogger],
});
//# sourceMappingURL=mysql.module.js.map