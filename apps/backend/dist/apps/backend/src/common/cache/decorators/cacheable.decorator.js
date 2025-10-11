"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cacheable = exports.CACHEABLE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.CACHEABLE_KEY = 'cacheable';
const Cacheable = (options = {}) => {
    return (0, common_1.SetMetadata)(exports.CACHEABLE_KEY, options);
};
exports.Cacheable = Cacheable;
//# sourceMappingURL=cacheable.decorator.js.map