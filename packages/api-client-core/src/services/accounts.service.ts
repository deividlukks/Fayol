import { BaseService } from './base.service';
import { Account } from '@fayol/shared-types';
import { IStorageAdapter } from '../storage.interface';

/**
 * Accounts Service
 *
 * Gerencia contas bancárias (checking, savings, investment, etc)
 */
export class AccountsService extends BaseService<Account> {
  constructor(storage: IStorageAdapter, baseURL: string = 'http://localhost:3333/api/accounts') {
    super(storage, baseURL, true); // Com cache
  }
}
