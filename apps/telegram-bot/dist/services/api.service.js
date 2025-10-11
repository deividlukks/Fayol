"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiService = exports.ApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class ApiService {
    client;
    constructor() {
        this.client = axios_1.default.create({
            baseURL: config_1.config.api.baseUrl,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    // Auth
    async register(data) {
        const response = await this.client.post('/auth/register', data);
        return response.data;
    }
    async login(email, password) {
        const response = await this.client.post('/auth/login', { email, password });
        return {
            userId: response.data.user.id,
            accessToken: response.data.accessToken,
            email: response.data.user.email,
            name: response.data.user.name,
        };
    }
    // Accounts
    async getAccounts(token) {
        const response = await this.client.get('/accounts', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    async createAccount(token, data) {
        const response = await this.client.post('/accounts', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    async updateAccount(token, accountId, data) {
        const response = await this.client.patch(`/accounts/${accountId}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    async deleteAccount(token, accountId) {
        const response = await this.client.delete(`/accounts/${accountId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    // Categories
    async getCategories(token) {
        const response = await this.client.get('/categories', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    async getSubcategories(token, categoryId) {
        const response = await this.client.get(`/categories/${categoryId}/subcategories`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    // Transactions
    async createTransaction(token, data) {
        const response = await this.client.post('/transactions', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    async getTransactions(token, params) {
        const response = await this.client.get('/transactions', {
            headers: { Authorization: `Bearer ${token}` },
            params,
        });
        return response.data;
    }
    // Dashboard
    async getBalance(token) {
        const response = await this.client.get('/dashboard/balance', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    async getSummaryCards(token) {
        const response = await this.client.get('/dashboard/summary-cards', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    async getSpendingByCategory(token) {
        const response = await this.client.get('/dashboard/spending-by-category', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    }
    // Reports
    async getMonthlyReport(token, year, month) {
        const response = await this.client.get('/reports/monthly', {
            headers: { Authorization: `Bearer ${token}` },
            params: { year, month },
        });
        return response.data;
    }
    // AI
    async suggestCategory(token, description) {
        const response = await this.client.post('/ai/suggest-category', { description }, { headers: { Authorization: `Bearer ${token}` } });
        return response.data;
    }
}
exports.ApiService = ApiService;
exports.apiService = new ApiService();
//# sourceMappingURL=api.service.js.map