"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const curlec_service_1 = require("./curlec/curlec.service");
const core_1 = require("@nestjs/core");
const logger_module_1 = require("./logger/logger.module");
const logger_service_1 = require("./logger/logger.service");
const normalize_single_item_array_util_1 = require("./curlec/utils/normalize-single-item-array.util");
const curlec_date_util_1 = require("./curlec/utils/curlec-date.util");
const promises_1 = __importDefault(require("fs/promises"));
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            logger_module_1.LoggerModule,
        ],
        providers: [curlec_service_1.CurlecService],
    })
], AppModule);
async function bootstrap() {
    const app = await core_1.NestFactory.create(AppModule);
    await app.init();
    const configService = app.get(config_1.ConfigService);
    const loggerService = await app.resolve(logger_service_1.LoggerService);
    const order_no = configService.get("DEBUG_ORDER_NO");
    if (!order_no) {
        throw new Error(`Missing order no in .env, e.g.: DEBUG_ORDER_NO=Ac3-jfU-iw9`);
    }
    const curlecService = app.get(curlec_service_1.CurlecService);
    // const curlecResponse = await curlecService.collectionInfo({
    //   order_no,
    //   action: "get",
    // });
    const dateUtil = new curlec_date_util_1.CurlecDateUtil();
    const curlecResponse = await curlecService.collectionStatus({
        mandate_reference: order_no,
        collection_from: dateUtil.toParam(new Date("2023-08-01T00:00:00.000Z")),
        collection_to: dateUtil.toParam(new Date("2023-10-01T00:00:00.000Z")),
    });
    const response = (0, normalize_single_item_array_util_1.normalizeSingleItemArray)(curlecResponse.response);
    const info = (0, normalize_single_item_array_util_1.normalizeSingleItemArray)(response.Response);
    promises_1.default.writeFile('payment-history.json', JSON.stringify(Object.values(info).map(normalize_single_item_array_util_1.normalizeSingleItemArray), null, 4));
    loggerService.log("response:", Object.values(info));
    await app.close();
}
bootstrap();
//# sourceMappingURL=get-collection-info.module.js.map