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
exports.CurlecPaymentHistoryEntity = void 0;
const typeorm_1 = require("typeorm");
let CurlecPaymentHistoryEntity = exports.CurlecPaymentHistoryEntity = class CurlecPaymentHistoryEntity {
    id;
    mandateReference;
    customerId;
    referenceNumber;
    nameAsPerNRIC;
    sku;
    email;
    nric;
    phoneNumber;
    collectionDate;
    collectionDateStr;
    collectionAmount;
    collectionAmountStr;
    collectionStatus;
    collectionStatusCode;
    maxAmount;
    maxAmountStr;
    url;
    jobId;
    createdAt;
    deletedAt;
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: "id" }),
    __metadata("design:type", Number)
], CurlecPaymentHistoryEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "mandate_reference",
    }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "mandateReference", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: "customer_id",
    }),
    __metadata("design:type", Number)
], CurlecPaymentHistoryEntity.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "reference_number" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "referenceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "name_as_per_nric" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "nameAsPerNRIC", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "sku" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "email" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "nric" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "nric", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "phone_number" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "collection_date" }),
    __metadata("design:type", Date)
], CurlecPaymentHistoryEntity.prototype, "collectionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "collection_date_str" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "collectionDateStr", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "collection_amount", type: "double" }),
    __metadata("design:type", Number)
], CurlecPaymentHistoryEntity.prototype, "collectionAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "collection_amount_str" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "collectionAmountStr", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "collection_status" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "collectionStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "collection_status_code" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "collectionStatusCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "max_amount", type: "double" }),
    __metadata("design:type", Number)
], CurlecPaymentHistoryEntity.prototype, "maxAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "max_amount_str" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "maxAmountStr", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "url" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "job_id" }),
    __metadata("design:type", String)
], CurlecPaymentHistoryEntity.prototype, "jobId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], CurlecPaymentHistoryEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "deleted_at" }),
    __metadata("design:type", Date)
], CurlecPaymentHistoryEntity.prototype, "deletedAt", void 0);
exports.CurlecPaymentHistoryEntity = CurlecPaymentHistoryEntity = __decorate([
    (0, typeorm_1.Entity)({ name: "curlec_payment_history" })
], CurlecPaymentHistoryEntity);
// create table SQL
`
    create table curlec_payment_history
    (
        id                     bigint unsigned auto_increment
            primary key,
        mandate_reference      text,
        customer_id            bigint,
        reference_number       text,
        name_as_per_nric       text,
        sku                    text,
        email                  text,
        nric                   text,
        phone_number           text,
        collection_date        datetime,
        collection_date_str    text,
        collection_amount      double,
        collection_amount_str  text,
        collection_status      text,
        collection_status_code text,
        max_amount             double,
        max_amount_str         text,
        created_at             text,
        url                    text,
        job_id                 text
    )
`;
//# sourceMappingURL=curlec-payment-history.entity.js.map