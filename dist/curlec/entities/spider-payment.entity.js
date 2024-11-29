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
exports.SpiderPaymentEntity = void 0;
const typeorm_1 = require("typeorm");
let SpiderPaymentEntity = exports.SpiderPaymentEntity = class SpiderPaymentEntity {
    id;
    customerId;
    instantPayAmount;
    type;
    attempt;
    bankCode;
    bankId;
    bankName;
    requestMandate;
    requestTimeDateMandate;
    responseMandate;
    responseDateTimeMandate;
    requestInstantPay;
    requestDateTimeInstantPay;
    responseInstantPay;
    responseDateTimeInstantPay;
    status;
    createdAt;
    updatedAt;
    referenceNumber;
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: "id" }),
    __metadata("design:type", Number)
], SpiderPaymentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "customer_id" }),
    __metadata("design:type", Number)
], SpiderPaymentEntity.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "instantPayAmount" }),
    __metadata("design:type", Number)
], SpiderPaymentEntity.prototype, "instantPayAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "type" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "attempt" }),
    __metadata("design:type", Number)
], SpiderPaymentEntity.prototype, "attempt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "bankCode" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "bankCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "bankId" }),
    __metadata("design:type", Number)
], SpiderPaymentEntity.prototype, "bankId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "bankName" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "requestMandate" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "requestMandate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "requestTimeDateMandate" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "requestTimeDateMandate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "responseMandate" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "responseMandate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "responseDateTimeMandate" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "responseDateTimeMandate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "requestInstantPay" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "requestInstantPay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "requestDateTimeInstantPay" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "requestDateTimeInstantPay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "responseInstantPay" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "responseInstantPay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "responseDateTimeInstantPay" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "responseDateTimeInstantPay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "status" }),
    __metadata("design:type", Number)
], SpiderPaymentEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], SpiderPaymentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "updated_at" }),
    __metadata("design:type", Date)
], SpiderPaymentEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "referenceNumber" }),
    __metadata("design:type", String)
], SpiderPaymentEntity.prototype, "referenceNumber", void 0);
exports.SpiderPaymentEntity = SpiderPaymentEntity = __decorate([
    (0, typeorm_1.Entity)({ name: "payment" })
], SpiderPaymentEntity);
//# sourceMappingURL=spider-payment.entity.js.map