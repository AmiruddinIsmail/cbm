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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FetchPaymentHistoryJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchPaymentHistoryJob = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const curlec_payment_history_entity_1 = require("../entities/curlec-payment-history.entity");
const typeorm_2 = require("typeorm");
const logger_service_1 = require("../../logger/logger.service");
const schedule_1 = require("@nestjs/schedule");
const cronjob_status_entity_1 = require("../entities/cronjob-status.entity");
const cron_1 = require("cron");
const curlec_service_1 = require("../curlec.service");
const normalize_single_item_array_util_1 = require("../utils/normalize-single-item-array.util");
const spider_payment_entity_1 = require("../entities/spider-payment.entity");
const curlec_date_util_1 = require("../utils/curlec-date.util");
const serialized_date_interface_1 = require("../types/serialized-date.interface");
const min_1 = __importDefault(require("date-fns/min"));
const health_service_1 = require("../../health/health.service");
const crypto_1 = require("crypto");
let FetchPaymentHistoryJob = exports.FetchPaymentHistoryJob = FetchPaymentHistoryJob_1 = class FetchPaymentHistoryJob {
    paymentHistoryRepo;
    paymentRepo;
    cronjobInfoRepo;
    datasource;
    logger;
    schedulerRegistry;
    curlecService;
    curlecDateUtil;
    dryRunOnce;
    collectionHistoryStart;
    constructor(paymentHistoryRepo, paymentRepo, cronjobInfoRepo, datasource, logger, schedulerRegistry, curlecService, curlecDateUtil, healthService) {
        this.paymentHistoryRepo = paymentHistoryRepo;
        this.paymentRepo = paymentRepo;
        this.cronjobInfoRepo = cronjobInfoRepo;
        this.datasource = datasource;
        this.logger = logger;
        this.schedulerRegistry = schedulerRegistry;
        this.curlecService = curlecService;
        this.curlecDateUtil = curlecDateUtil;
        this.collectionHistoryStart = this.curlecDateUtil.fromObject({
            year: 2023,
            month: serialized_date_interface_1.Month.MAR,
            date: 1,
        });
        this.logger.label = FetchPaymentHistoryJob_1.name;
        this.dryRunOnce = !!process.argv.find((e) => e === "--dry-run-once");
        healthService.registerPatient(FetchPaymentHistoryJob_1.name, this.healthCheck);
    }
    async onApplicationBootstrap() {
        if (this.dryRunOnce) {
            this.logger.warn("A dry run was requested. Application should exit immediately.");
            await this.run();
            process.exit(0);
            return;
        }
        // const frequency = CronExpression.EVERY_10_SECONDS;
        const frequency = schedule_1.CronExpression.EVERY_DAY_AT_7AM;
        const cronJob = new cron_1.CronJob(frequency, () => {
            this.run();
        });
        this.schedulerRegistry.addCronJob(FetchPaymentHistoryJob_1.name, cronJob);
        cronJob.start();
    }
    lastError;
    async run() {
        const jobId = (0, crypto_1.randomUUID)();
        this.logger.log("job started", { jobId });
        const startedAt = new Date();
        try {
            const dateRange = await this.getQueryDateRange();
            if (this.shouldNotQueryFutureDates(dateRange)) {
                this.logger.warn("aborting. date ranges are only until today, see config", { dateRange, jobId });
                delete this.lastError;
                return;
            }
            const apiResponse = await this.fetchPaymentHistoryFromAPI(dateRange, jobId);
            const { config, collectionStatus } = apiResponse;
            await this.insertIntoDatabase(collectionStatus, config, jobId);
            await this.cronjobInfoRepo.save({
                name: FetchPaymentHistoryJob_1.name,
                startedAt,
                endedAt: new Date(),
                config: this.curlecDateUtil.toObjectRecords(dateRange),
                apiResponse: apiResponse.collectionStatus,
                jobId,
            });
            delete this.lastError;
        }
        catch (error) {
            this.logger.error("Error at finishing tasks", error);
            this.lastError =
                error instanceof Error
                    ? error
                    : new Error("unparseable error", { cause: error });
        }
    }
    async fetchPaymentHistoryFromAPI(dateRange, jobId) {
        const { collectionFrom, collectionTo } = dateRange;
        const { response: queryResult, config } = await this.curlecService.collectionStatus({
            collection_from: this.curlecDateUtil.toParam(collectionFrom),
            collection_to: this.curlecDateUtil.toParam(collectionTo),
        });
        const [collectionStatusDirty] = queryResult.Response ?? [];
        const collectionStatus = collectionStatusDirty?.map(normalize_single_item_array_util_1.normalizeSingleItemArray);
        this.logger.log("got collection status", collectionStatus);
        return { config, collectionStatus };
    }
    async insertIntoDatabase(collectionStatus, config, jobId) {
        const successfulCollectionStatus = collectionStatus.filter((e) => e.collection_status_code === "00");
        const uniqueMandateReference = Object.keys(successfulCollectionStatus.reduce((a, b) => {
            a[b.mandate_reference] = true;
            return a;
        }, {}));
        const mandateCustomerIdDistinct = await this.paymentRepo
            .createQueryBuilder()
            .select(["referenceNumber", "customer_id"])
            .where({
            referenceNumber: (0, typeorm_2.In)(uniqueMandateReference),
        })
            .distinct(true)
            .execute();
        const customerIds = mandateCustomerIdDistinct
            .map((e) => Number(e.customer_id))
            .filter(isFinite);
        const mandateToCustomerIdMap = mandateCustomerIdDistinct.reduce((a, { referenceNumber, customer_id }) => {
            a[referenceNumber] = Number(customer_id);
            return a;
        }, {});
        const orderInfo = await this.datasource.query(`
          SELECT c.email            as \`email\`
               , c.id               as \`customerId\`
               , c.name_as_per_nric as \`nameAsPerNRIC\`
               , c.nric             as \`nric\`
               , c.phone_number     as \`phoneNumber\`
               , o.sku              as \`sku\`
          FROM spider.\`order\` o
                   LEFT JOIN spider.customer c
                             ON o.customer_id = c.id
          WHERE o.customer_id in (?)`, [customerIds]);
        const orderInfoByCustomerId = orderInfo.reduce((a, b) => {
            a[b.customerId] = b;
            return a;
        }, {});
        const CUSTOMER_ID_NOT_FOUND = -1;
        const curlecPaymentHistoryObjects = successfulCollectionStatus.map((e) => {
            const customerId = mandateToCustomerIdMap[e.mandate_reference] ?? CUSTOMER_ID_NOT_FOUND;
            const customerOrderInfo = customerId !== CUSTOMER_ID_NOT_FOUND
                ? orderInfoByCustomerId[customerId]
                : null;
            const paymentHistoryEntity = {
                // to ensure parsed in malaysia timezone, add timezone suffix Z+0800
                collectionDate: new Date(e.collection_date + "Z+0800"),
                collectionDateStr: e.collection_date,
                collectionAmount: Number(e.collection_amount) || 0,
                collectionAmountStr: `${e.collection_amount ?? ""}`,
                collectionStatus: e.collection_status,
                collectionStatusCode: e.collection_status_code,
                customerId: customerId,
                mandateReference: e.mandate_reference,
                maxAmount: Number(e.max_amount) || 0,
                maxAmountStr: `${e.max_amount ?? ""}`,
                email: customerOrderInfo?.email,
                nameAsPerNRIC: customerOrderInfo?.nameAsPerNRIC,
                nric: customerOrderInfo?.nric,
                phoneNumber: customerOrderInfo?.phoneNumber,
                sku: customerOrderInfo?.sku,
                referenceNumber: e.mandate_reference,
                url: new URL(config.url ?? "", config.baseURL).toString(),
                jobId,
                createdAt: new Date(),
            };
            return paymentHistoryEntity;
        });
        const customerIdNotFoundRecords = curlecPaymentHistoryObjects.filter((e) => e.customerId === CUSTOMER_ID_NOT_FOUND);
        if (customerIdNotFoundRecords.length) {
            this.logger.error("the following mandate ID cannot be mapped into their respective customer ID, " +
                "remediation action: insert customer id as -1", customerIdNotFoundRecords.map((e) => e.mandateReference), new Error("customer id not found for mandate references"));
        }
        await this.paymentHistoryRepo.save(curlecPaymentHistoryObjects);
        if (curlecPaymentHistoryObjects.length) {
            this.logger.log("inserted %d records", curlecPaymentHistoryObjects.length);
        }
    }
    /**
     * Returns date range of at most one month apart
     */
    async getQueryDateRange() {
        const latestCronjobInfo = await this.cronjobInfoRepo.findOne({
            where: {
                name: FetchPaymentHistoryJob_1.name,
            },
            order: {
                id: "desc",
            },
        });
        this.logger.log("got cronjob config:", latestCronjobInfo);
        const previousCollectionTo = latestCronjobInfo?.config?.collectionTo
            ? this.curlecDateUtil.fromObject(latestCronjobInfo?.config?.collectionTo)
            : null;
        // resume from last collectionTo
        const collectionFrom = previousCollectionTo
            ? this.curlecDateUtil.clone(previousCollectionTo)
            : this.collectionHistoryStart;
        // don't choose date more than today
        const collectionToUnchecked = this.curlecDateUtil.clone(collectionFrom);
        collectionToUnchecked.setMonth(collectionToUnchecked.getMonth() + 1);
        const collectionTo = (0, min_1.default)([
            collectionToUnchecked,
            this.curlecDateUtil.nowHourZero(),
        ]);
        return { collectionFrom, collectionTo };
    }
    shouldNotQueryFutureDates({ collectionFrom, collectionTo }) {
        return this.curlecDateUtil.equalsDateOnly(collectionFrom, collectionTo);
    }
    healthCheck = async () => {
        if (this.lastError) {
            throw this.lastError;
        }
        const lastCronjobInfo = await this.cronjobInfoRepo.findOne({
            where: {
                name: FetchPaymentHistoryJob_1.name,
            },
            order: {
                id: "desc",
            },
        });
        return {
            status: "up",
            lastCronjobInfo: lastCronjobInfo,
        };
    };
};
exports.FetchPaymentHistoryJob = FetchPaymentHistoryJob = FetchPaymentHistoryJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(curlec_payment_history_entity_1.CurlecPaymentHistoryEntity, "spider")),
    __param(1, (0, typeorm_1.InjectRepository)(spider_payment_entity_1.SpiderPaymentEntity, "spider")),
    __param(2, (0, typeorm_1.InjectRepository)(cronjob_status_entity_1.CronjobStatusEntity, "local")),
    __param(3, (0, typeorm_1.InjectDataSource)("spider")),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        logger_service_1.LoggerService,
        schedule_1.SchedulerRegistry,
        curlec_service_1.CurlecService,
        curlec_date_util_1.CurlecDateUtil,
        health_service_1.HealthService])
], FetchPaymentHistoryJob);
//# sourceMappingURL=fetch-payment-history.job.js.map