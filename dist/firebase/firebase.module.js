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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseModule = exports.FIREBASE = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = __importStar(require("firebase-admin"));
const firebase_provider_1 = require("./firebase.provider");
exports.FIREBASE = 'FIREBASE_APP';
const firebaseProvider = {
    provide: exports.FIREBASE,
    inject: [config_1.ConfigService],
    useFactory: (configService) => {
        const firebaseConfig = {
            type: configService.get('TYPE'),
            project_id: configService.get('PROJECT_ID'),
            private_key_id: configService.get('PRIVATE_KEY_ID'),
            private_key: configService.get('PRIVATE_KEY'),
            client_email: configService.get('CLIENT_EMAIL'),
            client_id: configService.get('CLIENT_ID'),
            auth_uri: configService.get('AUTH_URI'),
            token_uri: configService.get('TOKEN_URI'),
            auth_provider_x509_cert_url: configService.get('AUTH_CERT_URL'),
            client_x509_cert_url: configService.get('CLIENT_CERT_URL'),
            universe_domain: configService.get('UNIVERSAL_DOMAIN'),
        };
        return admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
            projectId: configService.get('FIREBASE_PROJECT_ID'),
        });
    },
};
let FirebaseModule = class FirebaseModule {
};
exports.FirebaseModule = FirebaseModule;
exports.FirebaseModule = FirebaseModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [firebaseProvider, firebase_provider_1.FirebaseRepository],
        exports: [firebase_provider_1.FirebaseRepository],
    })
], FirebaseModule);
//# sourceMappingURL=firebase.module.js.map