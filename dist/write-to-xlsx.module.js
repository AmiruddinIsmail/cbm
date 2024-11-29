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
const config_1 = require("@nestjs/config");
const logger_module_1 = require("./logger/logger.module");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const curlec_service_1 = require("./curlec/curlec.service");
const normalize_single_item_array_util_1 = require("./curlec/utils/normalize-single-item-array.util");
const xlsx_1 = __importDefault(require("xlsx"));
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
const headers = [
    "customer_id",
    "referenceNumber",
    "name_as_per_nric",
    "sku",
    "email",
    "nric",
    "phone_number",
    "collection_date",
    "collection_amount",
    "collection_status",
    "max_amount",
    "transaction_type",
    "mandate_reference",
    "url",
    "response_batch",
    "transaction_notes",
    "batch_id",
    "response_date",
    "batch_collection_status_code",
    "batch_collection_date",
    "transaction_reference",
    "collection_status_code",
    "batch_collection_event",
    "invoice_no",
    "collection_description",
    "collection_notes",
    "collection_reference",
];
async function go() {
    const app = await core_1.NestFactory.create(AppModule);
    await app.init();
    const curlec = await app.get(curlec_service_1.CurlecService);
    const [, , startDate, endDate] = process.argv;
    if (!startDate)
        throw new Error("startDate is empty");
    if (!endDate)
        throw new Error("endDate is empty");
    const { response, config } = await curlec.collectionStatus({
        collection_from: `${startDate} 00:00:00`,
        collection_to: `${endDate} 00:00:00`,
    });
    const collectionStatusMeta = (0, normalize_single_item_array_util_1.normalizeSingleItemArray)(response);
    const collectionStatus = collectionStatusMeta.Response.map(normalize_single_item_array_util_1.normalizeSingleItemArray);
    const referenceIdsPath = "reference-ids.json";
    const savedReferenceIds = await (async () => {
        try {
            const json = await promises_1.default.readFile(referenceIdsPath, "utf-8");
            return JSON.parse(json);
        }
        catch (ignored) {
            return new Array();
        }
    })();
    const referenceIdsSet = collectionStatus.reduce((a, b) => {
        a.add(b.mandate_reference);
        return a;
    }, new Set(savedReferenceIds));
    const referenceIds = [...referenceIdsSet];
    const referenceNumbers = referenceIds.map((e) => `'${e}'`).join(",\n");
    console.log("referenceNumbers:");
    console.log(referenceNumbers);
    try {
        await promises_1.default.writeFile(referenceIdsPath, JSON.stringify(referenceIds));
    }
    catch (error) {
        console.error("cannot save to " + referenceIdsPath, error);
    }
    const excelData = collectionStatus.map((e) => {
        return {
            customer_id: "",
            referenceNumber: e.mandate_reference,
            name_as_per_nric: "",
            sku: "",
            email: "",
            nric: "",
            phone_number: "",
            collection_date: e.collection_date,
            collection_amount: e.collection_amount,
            collection_status: e.collection_status,
            max_amount: e.max_amount,
            transaction_type: e.transaction_type,
            mandate_reference: e.mandate_reference,
            url: config.url,
            response_batch: e.response_batch,
            transaction_notes: e.transaction_notes,
            batch_id: e.batch_id,
            response_date: e.response_date,
            batch_collection_status_code: e.batch_collection_status_code,
            batch_collection_date: e.batch_collection_date,
            transaction_reference: e.transaction_reference,
            collection_status_code: e.collection_status_code,
            batch_collection_event: e.batch_collection_event,
            invoice_no: e.invoice_no,
            collection_description: e.collection_description,
            collection_notes: e.collection_notes,
            collection_reference: e.collection_reference,
        };
    });
    const workbook = xlsx_1.default.utils.book_new();
    const worksheet = xlsx_1.default.utils.json_to_sheet(excelData);
    xlsx_1.default.utils.book_append_sheet(workbook, worksheet, `${startDate}-${endDate}`);
    await xlsx_1.default.writeFileXLSX(workbook, `${startDate}-${endDate}.xlsx`, {
        compression: true,
    });
    await app.close();
}
go();
//# sourceMappingURL=write-to-xlsx.module.js.map