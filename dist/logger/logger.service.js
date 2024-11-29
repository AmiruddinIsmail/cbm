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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var LoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const winston_1 = __importDefault(require("winston"));
const util_1 = __importDefault(require("util"));
const error_stack_parser_1 = __importDefault(require("error-stack-parser"));
const breadcrumb_transform_1 = require("./transforms/breadcrumb.transform");
const stack_transform_1 = require("./transforms/stack.transform");
const label_timestamp_transform_1 = require("./transforms/label-timestamp.transform");
require("winston-daily-rotate-file");
const safe_stable_stringify_1 = __importDefault(require("safe-stable-stringify"));
const splat_from_format_transform_1 = require("./transforms/splat-from-format.transform");
let LoggerService = exports.LoggerService = class LoggerService {
    static { LoggerService_1 = this; }
    label = "logger";
    logger;
    static nestLogger;
    out = null;
    static breadcrumbs = [];
    static cwd = process.cwd();
    constructor(configService) {
        this.out = configService.get("WINSTON_OUT") || null;
        this.logger = winston_1.default.createLogger({
            level: "info",
            format: this.getWinstonFormat(),
            transports: this.getLoggerTransports(),
        });
    }
    getWinstonFormat(label) {
        return this.out
            ? winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.label(label ? { label } : this), winston_1.default.format.simple(), winston_1.default.format.json())
            : winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.label(label ? { label } : this), winston_1.default.format.colorize(), label_timestamp_transform_1.transformLabelTimestamp, breadcrumb_transform_1.transformBreadcrumbs, stack_transform_1.transformStackTrace, splat_from_format_transform_1.transformSplatFromFormat, winston_1.default.format.simple());
    }
    static getNestLogger() {
        if (LoggerService_1.nestLogger)
            return LoggerService_1.nestLogger;
        const logger = winston_1.default.createLogger({
            level: "info",
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.label({ label: "nest" }), winston_1.default.format.colorize(), label_timestamp_transform_1.transformLabelTimestamp, winston_1.default.format.simple()),
            transports: [new winston_1.default.transports.Console()],
        });
        LoggerService_1.nestLogger = {
            error(message, ...format) {
                const context = format.pop() ?? "nest";
                return logger.error({
                    message,
                    context,
                    format,
                });
            },
            log(message, ...format) {
                const context = format.pop() ?? "nest";
                return logger.info({
                    message,
                    context,
                    format,
                });
            },
            warn(message, ...format) {
                const context = format.pop() ?? "nest";
                return logger.warn({
                    message,
                    context,
                    format,
                });
            },
            debug(message, context, ...format) {
                return logger.debug({
                    message,
                    context,
                    format,
                });
            },
            verbose(message, context, ...format) {
                return logger.verbose({
                    message,
                    context,
                    format,
                });
            },
            setLogLevels(levels) {
                return logger.warn({
                    message: "setting logger level is not supported! requested: %s",
                    context: LoggerService_1.name,
                    format: levels,
                });
            },
        };
        return LoggerService_1.nestLogger;
    }
    getLoggerTransports() {
        return this.out
            ? [
                new winston_1.default.transports.DailyRotateFile({
                    json: true,
                    filename: this.out,
                }),
            ]
            : [new winston_1.default.transports.Console()];
    }
    formatFileName(fileName, lineNumber) {
        return `${fileName.replace(LoggerService_1.cwd, "").slice(1)}:${lineNumber}`;
    }
    formatStackTrace(stack) {
        return stack.map((e) => {
            if (e.fileName) {
                return `${e.functionName ?? "<anon>"} ${this.formatFileName(e.fileName, e.lineNumber ?? 0)}`;
            }
            return `${e.functionName ?? "<anon>"} <no location>`;
        });
    }
    error(message, ...format) {
        const breadcrumbs = LoggerService_1.breadcrumbs;
        const causedBy = format.at(-1) instanceof Error ? format.pop() : null;
        const formattedMessage = util_1.default.format(message, ...format);
        const error = new Error(formattedMessage);
        const stackTrace = error_stack_parser_1.default.parse(error).slice(1);
        const causedByStackTrace = causedBy ? error_stack_parser_1.default.parse(causedBy) : [];
        this.logger.error(error.message, {
            breadcrumbs: breadcrumbs.length ? breadcrumbs : undefined,
            stack: this.formatStackTrace(stackTrace),
            causedByMessage: causedBy?.message,
            causedBy: this.formatStackTrace(causedByStackTrace),
        });
        LoggerService_1.onBreadcrumbsLogged();
        return this;
    }
    log(message, ...format) {
        this.logger.info({
            message,
            format,
        });
        return this;
    }
    warn(message, ...format) {
        this.logger.warn({
            message,
            format,
        });
        return this;
    }
    breadcrumb(action, context = {}) {
        LoggerService_1.breadcrumbs.push({
            ...context,
            action,
            label: this.label,
            timestamp: new Date(),
        });
        if (LoggerService_1.breadcrumbs.length > 20) {
            LoggerService_1.breadcrumbs.shift();
        }
    }
    static onBreadcrumbsLogged() {
        LoggerService_1.breadcrumbs.length = 0;
    }
    static bootstrapOnce = false;
    onApplicationBootstrap() {
        if (LoggerService_1.bootstrapOnce)
            return;
        LoggerService_1.bootstrapOnce = true;
        if (this.out) {
            LoggerService_1.getNestLogger().log("Outputting json logs at: %s", this.out, "LoggerService");
        }
        const exitLogger = winston_1.default.createLogger({
            level: "info",
            format: this.getWinstonFormat(LoggerService_1.name),
            transports: this.getLoggerTransports(),
        });
        process.once("exit", () => {
            if (!LoggerService_1.breadcrumbs.length) {
                return;
            }
            console.info(":: Application exiting... Dumping leftover events");
            const stringifiedBreadcrumbs = (0, safe_stable_stringify_1.default)(LoggerService_1.breadcrumbs);
            console.info(stringifiedBreadcrumbs);
            exitLogger.info({
                message: ":: Application exiting... Dumping leftover events",
                breadcrumbs: LoggerService_1.breadcrumbs,
            });
        });
    }
};
exports.LoggerService = LoggerService = LoggerService_1 = __decorate([
    (0, common_1.Injectable)({
        scope: common_1.Scope.TRANSIENT,
    }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LoggerService);
//# sourceMappingURL=logger.service.js.map