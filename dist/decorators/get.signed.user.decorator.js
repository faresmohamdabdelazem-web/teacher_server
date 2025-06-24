"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSignedUser = void 0;
const common_1 = require("@nestjs/common");
exports.GetSignedUser = (0, common_1.createParamDecorator)((data, req) => {
    return {
        id: req.args[0]['id'],
        role: req.args[0]['role'],
        email: req.args[0]['email'],
    };
});
//# sourceMappingURL=get.signed.user.decorator.js.map