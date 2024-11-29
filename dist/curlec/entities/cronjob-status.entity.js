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
exports.CronjobStatusEntity = void 0;
const typeorm_1 = require("typeorm");
/**
 * This is an SQLite3 table
 */
let CronjobStatusEntity = exports.CronjobStatusEntity = class CronjobStatusEntity {
    id;
    name;
    startedAt;
    endedAt;
    createdAt;
    config;
    apiResponse;
    jobId;
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CronjobStatusEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CronjobStatusEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], CronjobStatusEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], CronjobStatusEntity.prototype, "endedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CronjobStatusEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json" }),
    __metadata("design:type", Object)
], CronjobStatusEntity.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json" }),
    __metadata("design:type", Object)
], CronjobStatusEntity.prototype, "apiResponse", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CronjobStatusEntity.prototype, "jobId", void 0);
exports.CronjobStatusEntity = CronjobStatusEntity = __decorate([
    (0, typeorm_1.Entity)({ name: "cronjob_status" })
], CronjobStatusEntity);
//# sourceMappingURL=cronjob-status.entity.js.map