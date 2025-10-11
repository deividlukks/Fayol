"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurrenceType = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["INCOME"] = "INCOME";
    TransactionType["EXPENSE"] = "EXPENSE";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var RecurrenceType;
(function (RecurrenceType) {
    RecurrenceType["NONE"] = "NONE";
    RecurrenceType["DAILY"] = "DAILY";
    RecurrenceType["WEEKLY"] = "WEEKLY";
    RecurrenceType["MONTHLY"] = "MONTHLY";
    RecurrenceType["YEARLY"] = "YEARLY";
})(RecurrenceType || (exports.RecurrenceType = RecurrenceType = {}));
