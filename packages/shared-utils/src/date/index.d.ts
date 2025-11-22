import { addDays, subDays, isAfter, isBefore } from 'date-fns';
export declare const DateUtils: {
    formatDate: (date: Date | string) => string;
    formatDateTime: (date: Date | string) => string;
    toISO: (date: Date) => string;
    getStartOfMonth: (date?: Date) => Date;
    getEndOfMonth: (date?: Date) => Date;
    addDays: typeof addDays;
    subDays: typeof subDays;
    isAfter: typeof isAfter;
    isBefore: typeof isBefore;
};
//# sourceMappingURL=index.d.ts.map