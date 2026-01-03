import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket Gateway para comunicação real-time
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, configurar apenas origens permitidas
    credentials: true,
  },
  namespace: '/events',
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Inicialização do Gateway
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway inicializado');
  }

  /**
   * Cliente conectou
   */
  async handleConnection(client: Socket) {
    try {
      // Extrai token do handshake
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Cliente ${client.id} tentou conectar sem token`);
        client.disconnect();
        return;
      }

      // Valida token
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      // Armazena associação userId -> socketId
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);

      // Adiciona userId ao socket para uso posterior
      client.data.userId = userId;

      this.logger.log(`Cliente ${client.id} conectado (User: ${userId})`);
    } catch (error) {
      this.logger.error(
        `Erro na autenticação do cliente ${client.id}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      client.disconnect();
    }
  }

  /**
   * Cliente desconectou
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(client.id);

      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.logger.log(`Cliente ${client.id} desconectado (User: ${userId})`);
  }

  /**
   * Envia notificação para um usuário específico
   */
  sendNotificationToUser(userId: string, notification: any) {
    const socketIds = this.userSockets.get(userId);

    if (!socketIds || socketIds.size === 0) {
      this.logger.debug(`Usuário ${userId} não tem conexões ativas`);
      return false;
    }

    socketIds.forEach((socketId) => {
      this.server.to(socketId).emit('notification', notification);
    });

    this.logger.debug(
      `Notificação enviada para ${socketIds.size} conexão(ões) do usuário ${userId}`
    );
    return true;
  }

  /**
   * Envia evento para um usuário específico
   */
  sendEventToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);

    if (!socketIds || socketIds.size === 0) {
      return false;
    }

    socketIds.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });

    return true;
  }

  /**
   * Broadcast para todos os clientes conectados
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast do evento "${event}" enviado`);
  }

  /**
   * Retorna informações sobre conexões ativas
   */
  getConnectionStats() {
    const totalUsers = this.userSockets.size;
    const totalConnections = Array.from(this.userSockets.values()).reduce(
      (acc, sockets) => acc + sockets.size,
      0
    );

    return {
      totalUsers,
      totalConnections,
      users: Array.from(this.userSockets.entries()).map(([userId, sockets]) => ({
        userId,
        connections: sockets.size,
      })),
    };
  }

  /**
   * Desconecta todos os sockets de um usuário
   */
  disconnectUser(userId: string) {
    const socketIds = this.userSockets.get(userId);

    if (!socketIds) {
      return false;
    }

    socketIds.forEach((socketId) => {
      const socket = this.server.sockets.sockets.get(socketId);
      socket?.disconnect(true);
    });

    this.userSockets.delete(userId);
    this.logger.log(`Usuário ${userId} desconectado forçadamente`);
    return true;
  }

  /**
   * Handler para mensagem de ping do cliente
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  /**
   * Handler para cliente se juntar a uma sala específica
   */
  @SubscribeMessage('join-room')
  handleJoinRoom(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    client.join(data.room);
    this.logger.debug(`Cliente ${client.id} entrou na sala ${data.room}`);
    return { event: 'joined-room', data: { room: data.room } };
  }

  /**
   * Handler para cliente sair de uma sala específica
   */
  @SubscribeMessage('leave-room')
  handleLeaveRoom(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.room);
    this.logger.debug(`Cliente ${client.id} saiu da sala ${data.room}`);
    return { event: 'left-room', data: { room: data.room } };
  }

  /**
   * Envia mensagem para uma sala específica
   */
  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
    this.logger.debug(`Evento "${event}" enviado para sala ${room}`);
  }
}
