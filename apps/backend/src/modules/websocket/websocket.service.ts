import { Injectable, Logger } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

export interface WebSocketNotification {
  id?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  actionUrl?: string;
  timestamp?: Date;
}

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);

  constructor(private readonly gateway: WebsocketGateway) {}

  /**
   * Envia notificação para um usuário
   */
  sendNotification(userId: string, notification: WebSocketNotification) {
    const sent = this.gateway.sendNotificationToUser(userId, {
      ...notification,
      timestamp: notification.timestamp || new Date(),
    });

    if (!sent) {
      this.logger.debug(
        `Notificação não enviada (usuário ${userId} offline): ${notification.title}`
      );
    }

    return sent;
  }

  /**
   * Envia evento personalizado para um usuário
   */
  sendEvent(userId: string, event: string, data: any) {
    return this.gateway.sendEventToUser(userId, event, data);
  }

  /**
   * Envia evento para uma sala
   */
  sendToRoom(room: string, event: string, data: any) {
    this.gateway.sendToRoom(room, event, data);
  }

  /**
   * Broadcast para todos
   */
  broadcast(event: string, data: any) {
    this.gateway.broadcast(event, data);
  }

  /**
   * Notifica sobre conclusão de processamento de IA
   */
  notifyAiProcessingComplete(
    userId: string,
    type: 'categorization' | 'insights' | 'forecast',
    result: any
  ) {
    return this.sendEvent(userId, 'ai-processing-complete', {
      type,
      result,
      timestamp: new Date(),
    });
  }

  /**
   * Notifica sobre nova transação
   */
  notifyNewTransaction(userId: string, transaction: any) {
    return this.sendEvent(userId, 'transaction-created', {
      transaction,
      timestamp: new Date(),
    });
  }

  /**
   * Notifica sobre atualização de orçamento
   */
  notifyBudgetUpdate(userId: string, budget: any) {
    return this.sendEvent(userId, 'budget-updated', {
      budget,
      timestamp: new Date(),
    });
  }

  /**
   * Notifica sobre limite de orçamento atingido
   */
  notifyBudgetLimitReached(userId: string, budget: any, percentage: number) {
    this.sendNotification(userId, {
      title: 'Limite de Orçamento',
      message: `Você atingiu ${percentage}% do orçamento "${budget.name}"`,
      type: 'WARNING',
      actionUrl: `/dashboard/budgets/${budget.id}`,
    });

    return this.sendEvent(userId, 'budget-limit-reached', {
      budget,
      percentage,
      timestamp: new Date(),
    });
  }

  /**
   * Notifica sobre meta atingida
   */
  notifyGoalReached(userId: string, goal: any) {
    this.sendNotification(userId, {
      title: 'Meta Atingida!',
      message: `Parabéns! Você atingiu a meta "${goal.title}"`,
      type: 'SUCCESS',
      actionUrl: `/dashboard/goals/${goal.id}`,
    });

    return this.sendEvent(userId, 'goal-reached', {
      goal,
      timestamp: new Date(),
    });
  }

  /**
   * Obtém estatísticas de conexões
   */
  getConnectionStats() {
    return this.gateway.getConnectionStats();
  }

  /**
   * Desconecta usuário forçadamente
   */
  disconnectUser(userId: string) {
    return this.gateway.disconnectUser(userId);
  }
}
