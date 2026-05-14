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
exports.WhatsAppAdapter = void 0;
var WhatsAppAdapter = /** @class */ (function () {
    function WhatsAppAdapter() {
        // Sovereign OS Çevresel Değişkenleri (Environment Variables)
        this.accessToken = process.env.META_WA_ACCESS_TOKEN || '';
        this.phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID || '';
        // Meta Graph API v18.0 (veya güncel sürüm) doğrudan bağlantı noktası
        this.apiUrl = "https://graph.facebook.com/v18.0/".concat(this.phoneNumberId, "/messages");
    }
    /**
     * Kriptografik mührü ve elçi mesajını hedefe fısıldar.
     */
    WhatsAppAdapter.prototype.sendNeuralWhisper = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var requestBody, response, errorData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Güvenlik kalkanı: Token yoksa (örn: Local ortam), sessizce simüle et.
                        if (!this.accessToken || !this.phoneNumberId) {
                            console.warn("[SOVEREIGN KONSOL] Meta Token bulunamad\u0131. F\u0131s\u0131lt\u0131 sim\u00FCle ediliyor -> Numara: ".concat(payload.targetPhoneNumber));
                            return [2 /*return*/, true];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        requestBody = {
                            messaging_product: "whatsapp",
                            to: payload.targetPhoneNumber,
                            type: "template",
                            template: {
                                name: payload.templateName,
                                language: { code: payload.languageCode || "tr" },
                                // Eğer şablonda dinamik değişkenler varsa, Meta'nın katı formatına göre diz
                                components: payload.variables && payload.variables.length > 0 ? [
                                    {
                                        type: "body",
                                        parameters: payload.variables.map(function (variable) { return ({
                                            type: "text",
                                            text: variable
                                        }); })
                                    }
                                ] : []
                            }
                        };
                        return [4 /*yield*/, fetch(this.apiUrl, {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(this.accessToken),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(requestBody),
                            })];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        errorData = _a.sent();
                        console.error('[SOVEREIGN ZIRHI] Meta Graph API Reddi:', JSON.stringify(errorData, null, 2));
                        throw new Error('Nöral Fısıltı hedefe iletilemedi.');
                    case 4:
                        console.log("[SOVEREIGN OS] N\u00F6ral F\u0131s\u0131lt\u0131 ba\u015Far\u0131yla iletildi. Hedef: ".concat(payload.targetPhoneNumber));
                        return [2 /*return*/, true];
                    case 5:
                        error_1 = _a.sent();
                        console.error('[SOVEREIGN ZIRHI] WhatsApp İletişim Zırhı hasar gördü:', error_1);
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return WhatsAppAdapter;
}());
exports.WhatsAppAdapter = WhatsAppAdapter;
