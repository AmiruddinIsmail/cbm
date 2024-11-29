"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CurlecService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurlecService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const promises_1 = require("fs/promises");
const axios_1 = __importDefault(require("axios"));
const https = __importStar(require("https"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../logger/logger.service");
let CurlecService = exports.CurlecService = CurlecService_1 = class CurlecService {
    logger;
    baseURL;
    checksumKey;
    merchantId;
    constructor(configService, logger) {
        this.logger = logger;
        this.baseURL = configService.get("curlec_url") ?? "";
        this.checksumKey = configService.get("curlec_checksum") ?? "";
        this.merchantId = configService.get("merchant_id") ?? "";
        this.logger.label = CurlecService_1.name;
        this.logger.log("using %s", this.baseURL);
    }
    agent = null;
    async loadAgent() {
        if (this.agent) {
            return this.agent;
        }
        const cert = await (0, promises_1.readFile)("./certs/DigiCertCA.crt", "utf-8");
        this.agent ??= new https.Agent({
            rejectUnauthorized: false,
            cert,
        });
        return this.agent;
    }
    hashSHA256 = (value) => {
        try {
            const hashing = crypto_1.default.createHash("sha256").update(value).digest("hex");
            return {
                status: true,
                value: hashing,
            };
        }
        catch (error) {
            return {
                status: false,
                value: null,
            };
        }
    };
    createUrlParam = (data) => {
        const ret = [];
        for (let d in data)
            ret.push(d + "=" + data[d]);
        return ret.join("&");
    };
    appendChecksum(payload) {
        // note: cannot use URLSearchParams :/,
        // curlec (seem to) parse URL differently
        // when the query param is encoded (perchance..)
        //
        // update: 21 Sept: now URLSearchParams is required...
        const params = new URLSearchParams(payload);
        const paramsString = params.toString();
        // const paramsString = this.createUrlParam(payload);
        const checksumPayload = `${this.checksumKey}|${paramsString}`;
        const hash = this.hashSHA256(checksumPayload).value;
        return `${paramsString}&checksum=${hash}`;
    }
    async collectionStatus(payload) {
        const body = {
            method: "05",
            merchantId: this.merchantId,
            ...payload,
        };
        const httpsAgent = await this.loadAgent();
        const requestBody = this.appendChecksum(body);
        const requestConfig = {
            baseURL: this.baseURL,
            url: `/curlec-services?${requestBody}`,
            method: "POST",
            httpsAgent,
        };
        this.logger.log("requesting curlec", {
            url: new URL(requestConfig.url ?? "", requestConfig.baseURL).toString(),
            method: requestConfig.method,
        });
        const response = await (0, axios_1.default)(requestConfig);
        this.logger.log("curlec responded", response.data);
        return {
            response: response.data,
            config: requestConfig,
        };
    }
};
exports.CurlecService = CurlecService = CurlecService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], CurlecService);
//# sourceMappingURL=curlec.service.js.map