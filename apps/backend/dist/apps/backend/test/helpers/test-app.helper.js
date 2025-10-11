"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = createTestApp;
const common_1 = require("@nestjs/common");
const platform_fastify_1 = require("@nestjs/platform-fastify");
async function createTestApp(moduleFixture) {
    const app = moduleFixture.createNestApplication(new platform_fastify_1.FastifyAdapter());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    return app;
}
//# sourceMappingURL=test-app.helper.js.map