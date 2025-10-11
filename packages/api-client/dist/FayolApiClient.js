"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FayolApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
class FayolApiClient {
    constructor(config) {
        this.accessToken = null;
        this.client = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.onTokenExpired = config.onTokenExpired;
        // Interceptor para adicionar token nas requisições
        this.client.interceptors.request.use((config) => {
            if (this.accessToken) {
                config.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Interceptor para tratar erros
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401 && this.onTokenExpired) {
                this.accessToken = null;
                this.onTokenExpired();
            }
            return Promise.reject(error);
        });
    }
    // ==================== AUTH ====================
    async login(credentials) {
        const response = await this.client.post('/auth/login', credentials);
        this.accessToken = response.data.accessToken;
        return response.data;
    }
    async register(data) {
        const response = await this.client.post('/auth/register', data);
        this.accessToken = response.data.accessToken;
        return response.data;
    }
    async refresh() {
        const response = await this.client.post('/auth/refresh');
        this.accessToken = response.data.accessToken;
        return response.data;
    }
    logout() {
        this.accessToken = null;
    }
    setAccessToken(token) {
        this.accessToken = token;
    }
    getAccessToken() {
        return this.accessToken;
    }
    isAuthenticated() {
        return this.accessToken !== null;
    }
    // ==================== TRANSACTIONS ====================
    async getTransactions(filters, pagination) {
        const response = await this.client.get('/transactions', {
            params: { ...filters, ...pagination },
        });
        return response.data;
    }
    async getTransaction(id) {
        const response = await this.client.get(`/transactions/${id}`);
        return response.data;
    }
    async createTransaction(data) {
        const response = await this.client.post('/transactions', data);
        return response.data;
    }
    async updateTransaction(id, data) {
        const response = await this.client.patch(`/transactions/${id}`, data);
        return response.data;
    }
    async deleteTransaction(id) {
        await this.client.delete(`/transactions/${id}`);
    }
    async getTransactionSummary(filters) {
        const response = await this.client.get('/transactions/summary', {
            params: filters,
        });
        return response.data;
    }
    // ==================== ACCOUNTS ====================
    async getAccounts() {
        const response = await this.client.get('/accounts');
        return response.data;
    }
    async getAccount(id) {
        const response = await this.client.get(`/accounts/${id}`);
        return response.data;
    }
    async createAccount(data) {
        const response = await this.client.post('/accounts', data);
        return response.data;
    }
    async updateAccount(id, data) {
        const response = await this.client.patch(`/accounts/${id}`, data);
        return response.data;
    }
    async deleteAccount(id) {
        await this.client.delete(`/accounts/${id}`);
    }
    // ==================== CATEGORIES ====================
    async getCategories() {
        const response = await this.client.get('/categories');
        return response.data;
    }
    async getCategory(id) {
        const response = await this.client.get(`/categories/${id}`);
        return response.data;
    }
    async createCategory(data) {
        const response = await this.client.post('/categories', data);
        return response.data;
    }
    async updateCategory(id, data) {
        const response = await this.client.patch(`/categories/${id}`, data);
        return response.data;
    }
    async deleteCategory(id) {
        await this.client.delete(`/categories/${id}`);
    }
    // ==================== DASHBOARD ====================
    async getDashboardData() {
        const response = await this.client.get('/dashboard');
        return response.data;
    }
    // ==================== REPORTS ====================
    async getMonthlyReport(year, month) {
        const response = await this.client.get('/reports/monthly', {
            params: { year, month },
        });
        return response.data;
    }
    async getYearlyReport(year) {
        const response = await this.client.get('/reports/yearly', {
            params: { year },
        });
        return response.data;
    }
}
exports.FayolApiClient = FayolApiClient;
