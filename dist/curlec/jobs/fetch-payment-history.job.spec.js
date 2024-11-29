"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const fetch_payment_history_job_1 = require("./fetch-payment-history.job");
const logger_service_1 = require("../../logger/logger.service");
const schedule_1 = require("@nestjs/schedule");
const curlec_service_1 = require("../curlec.service");
const curlec_payment_history_entity_1 = require("../entities/curlec-payment-history.entity");
const spider_payment_entity_1 = require("../entities/spider-payment.entity");
const cronjob_status_entity_1 = require("../entities/cronjob-status.entity");
const repo_mocker_util_1 = require("../../common/repo-mocker/repo-mocker.util");
const curlec_date_util_1 = require("../utils/curlec-date.util");
const serialized_date_interface_1 = require("../types/serialized-date.interface");
jest.mock("../../logger/logger.service");
jest.mock("@nestjs/schedule");
jest.mock("../curlec.service");
describe("FetchPaymentHistoryJob", () => {
    let job;
    const repoMocker = new repo_mocker_util_1.RepoMockerUtil();
    beforeEach(async () => {
        repoMocker.reset();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                fetch_payment_history_job_1.FetchPaymentHistoryJob,
                repoMocker.provide(curlec_payment_history_entity_1.CurlecPaymentHistoryEntity),
                repoMocker.provide(spider_payment_entity_1.SpiderPaymentEntity),
                repoMocker.provide(cronjob_status_entity_1.CronjobStatusEntity),
                logger_service_1.LoggerService,
                schedule_1.SchedulerRegistry,
                curlec_service_1.CurlecService,
                curlec_date_util_1.CurlecDateUtil,
            ],
        }).compile();
        job = module.get(fetch_payment_history_job_1.FetchPaymentHistoryJob);
    });
    it("should be defined", () => {
        expect(job).toBeDefined();
    });
    describe("getQueryDateRange", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(2023, serialized_date_interface_1.Month.JUN, 5));
        });
        it("should return range at most one month", async () => {
            const repo = repoMocker.getRepo(cronjob_status_entity_1.CronjobStatusEntity);
            const cronjobConfig = {
                config: {
                    collectionFrom: {
                        year: 2023,
                        month: serialized_date_interface_1.Month.MAY,
                        date: 30,
                    },
                    collectionTo: {
                        year: 2023,
                        month: serialized_date_interface_1.Month.MAY,
                        date: 31,
                    },
                },
            };
            repo.findOne = jest.fn().mockReturnValue(cronjobConfig);
            const range = await job.getQueryDateRange();
            const collectionFromString = job.curlecDateUtil.toParam(range.collectionFrom);
            const collectionToString = job.curlecDateUtil.toParam(range.collectionTo);
            expect(collectionFromString).toEqual("2023-05-31 00:00");
            expect(collectionToString).toEqual("2023-06-05 00:00");
        });
        it("should return list of dates", async () => {
            const expectedRanges = [
                {
                    collectionFrom: "2023-03-01 00:00",
                    collectionTo: "2023-04-01 00:00",
                },
                {
                    collectionFrom: "2023-04-01 00:00",
                    collectionTo: "2023-05-01 00:00",
                },
                {
                    collectionFrom: "2023-05-01 00:00",
                    collectionTo: "2023-06-01 00:00",
                },
                {
                    collectionFrom: "2023-06-01 00:00",
                    collectionTo: "2023-06-05 00:00",
                },
            ];
            const repo = repoMocker.getRepo(cronjob_status_entity_1.CronjobStatusEntity);
            const cronjobConfig = {
                config: null,
            };
            repo.findOne = jest.fn().mockReturnValue(cronjobConfig);
            const actualRanges = new Array();
            for (let i = 0; i < 10; i++) {
                if (i === 9) {
                    throw new Error(`too many iterations, expected ${expectedRanges.length} iterations only: ${JSON.stringify(actualRanges)}`);
                }
                const range = await job.getQueryDateRange();
                cronjobConfig.config = job.curlecDateUtil.toObjectRecords(range);
                if (job.shouldNotQueryFutureDates(range))
                    break;
                actualRanges.push({
                    collectionFrom: job.curlecDateUtil.toParam(range.collectionFrom),
                    collectionTo: job.curlecDateUtil.toParam(range.collectionTo),
                });
            }
            expect(actualRanges).toStrictEqual(expectedRanges);
        });
    });
});
//# sourceMappingURL=fetch-payment-history.job.spec.js.map