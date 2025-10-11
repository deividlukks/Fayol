"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const compress_1 = require("@fastify/compress");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({ logger: true }));
    app.setGlobalPrefix('api/v1');
    await app.register(compress_1.default, {
        encodings: ['gzip', 'deflate', 'br'],
        threshold: 1024,
    });
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : ['http://localhost:3001', 'http://localhost:3000'];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
        exposedHeaders: ['X-Correlation-ID'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Fayol API')
        .setDescription('Sistema Multiplataforma de Gestão Financeira Pessoal com IA')
        .setVersion('0.1.0')
        .addBearerAuth()
        .addTag('auth', 'Autenticação e autorização')
        .addTag('users', 'Gestão de usuários')
        .addTag('accounts', 'Gestão de contas financeiras')
        .addTag('categories', 'Gestão de categorias e subcategorias')
        .addTag('transactions', 'Gestão de transações')
        .addTag('dashboard', 'Dashboard e métricas')
        .addTag('reports', 'Relatórios e análises')
        .addTag('ai', 'Inteligência Artificial')
        .addTag('export', 'Exportação de dados')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Fayol API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map