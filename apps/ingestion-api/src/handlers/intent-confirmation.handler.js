"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentConfirmationHandler = void 0;
var whatsapp_adapter_1 = require("../adapters/communication/whatsapp.adapter");
// import { SovereignBus } from '../core/event-bus';
// import { SovereignVault } from '../core/crm'; // Gelecekteki CRM modülümüz
var IntentConfirmationHandler = /** @class */ (function () {
    function IntentConfirmationHandler() {
        this.whatsappAdapter = new whatsapp_adapter_1.WhatsAppAdapter();
    }
    IntentConfirmationHandler.prototype.handle = function (eventPayload) {
        return __awaiter(this, void 0, void 0, function () {
            var guestId, ritualTitle, guestProfile, isDelivered, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log("[SOVEREIGN KERNEL] Niyet onayland\u0131. Trace ID: ".concat(eventPayload.traceId));
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        guestId = ((_a = eventPayload.intent) === null || _a === void 0 ? void 0 : _a.guestId) || "VIP-001";
                        ritualTitle = ((_b = eventPayload.payload) === null || _b === void 0 ? void 0 : _b.intent) || "Sovereign Choice";
                        if (!guestId) {
                            throw new Error("Kritik Güvenlik İhlali: Kiosk fısıltısında 'guestId' bulunamadı. Erişim reddedildi.");
                        }
                        // 2. VERİ ZENGİNLEŞTİRME (Data Enrichment - SSOT)
                        console.log("[SOVEREIGN VAULT] Kriptografik m\u00FCh\u00FCr \u00E7\u00F6z\u00FCl\u00FCyor. Veri zenginle\u015Ftirme ba\u015Flat\u0131ld\u0131... Misafir ID: ".concat(guestId));
                        guestProfile = {
                            fullName: "Alexander Pierce", // VIP Misafirimizin gerçek adı
                            phoneNumber: process.env.TEST_TARGET_PHONE || "+38200000000",
                            locale: "en"
                        };
                        return [4 /*yield*/, this.whatsappAdapter.sendNeuralWhisper({
                                targetPhoneNumber: guestProfile.phoneNumber,
                                templateName: "sovereign_handover",
                                languageCode: guestProfile.locale,
                                variables: [guestProfile.fullName, ritualTitle]
                            })];
                    case 2:
                        isDelivered = _c.sent();
                        // 4. BAŞARI DURUMU: GodMode Radarı İçin Yeni Fısıltı
                        if (isDelivered) {
                            console.log("[SOVEREIGN KERNEL] M\u00FCh\u00FCr misafire teslim edildi. GodMode'a Z\u00FCmr\u00FCt Ye\u015Fili sinyal g\u00F6nderiliyor.");
                            /* Otonom Yayın:
                            await SovereignBus.publish({
                              eventType: "communication.whatsapp.delivered",
                              traceId: eventPayload.traceId,
                              payload: { status: "success", channel: "whatsapp" }
                            });
                            */
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _c.sent();
                        console.error("[SOVEREIGN ZIRHI] Teslimat s\u0131ras\u0131nda statik parazit:", error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return IntentConfirmationHandler;
}());
exports.IntentConfirmationHandler = IntentConfirmationHandler;
