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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const categories_service_1 = require("./categories.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let CategoriesController = class CategoriesController {
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    create(user, createCategoryDto) {
        return this.categoriesService.create(user.id, createCategoryDto);
    }
    findAll(user) {
        return this.categoriesService.findAll(user.id);
    }
    findAllTree(user) {
        return this.categoriesService.findAllTree(user.id);
    }
    findOne(id, user) {
        return this.categoriesService.findOne(id, user.id);
    }
    findWithChildren(id, user) {
        return this.categoriesService.findCategoryWithChildren(id, user.id);
    }
    getCategoryPath(id, user) {
        return this.categoriesService.getCategoryPath(id, user.id);
    }
    update(id, user, updateCategoryDto) {
        return this.categoriesService.update(id, user.id, updateCategoryDto);
    }
    remove(id, user) {
        return this.categoriesService.remove(id, user.id);
    }
    createSubcategory(user, createSubcategoryDto) {
        return this.categoriesService.createSubcategory(user.id, createSubcategoryDto);
    }
    findSubcategories(id, user) {
        return this.categoriesService.findSubcategories(id, user.id);
    }
    updateSubcategory(id, user, updateData) {
        return this.categoriesService.updateSubcategory(id, user.id, updateData);
    }
    removeSubcategory(id, user) {
        return this.categoriesService.removeSubcategory(id, user.id);
    }
};
exports.CategoriesController = CategoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar categoria personalizada' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar categorias (sistema + personalizadas)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('tree/hierarchy'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar categorias em formato de árvore hierárquica' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "findAllTree", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar categoria por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/children'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar categoria com toda a árvore de filhos' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "findWithChildren", null);
__decorate([
    (0, common_1.Get)(':id/path'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar caminho completo da categoria até a raiz' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "getCategoryPath", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar categoria (apenas personalizadas)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover categoria (apenas personalizadas)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('subcategories'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar subcategoria' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "createSubcategory", null);
__decorate([
    (0, common_1.Get)(':id/subcategories'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar subcategorias de uma categoria' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "findSubcategories", null);
__decorate([
    (0, common_1.Patch)('subcategories/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar subcategoria' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "updateSubcategory", null);
__decorate([
    (0, common_1.Delete)('subcategories/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover subcategoria' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "removeSubcategory", null);
exports.CategoriesController = CategoriesController = __decorate([
    (0, swagger_1.ApiTags)('categories'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('categories'),
    __metadata("design:paramtypes", [categories_service_1.CategoriesService])
], CategoriesController);
//# sourceMappingURL=categories.controller.js.map