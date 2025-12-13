/**
 * Mock completo do Telegraf para testes
 */

export const createMockContext = (overrides: any = {}) => {
  const mockCtx: any = {
    // Mensagem
    message: {
      text: '',
      from: {
        id: 123456789,
        first_name: 'Test',
        username: 'testuser',
      },
      chat: {
        id: 123456789,
        type: 'private',
      },
      ...overrides.message,
    },

    // Session
    session: {
      token: undefined,
      user: undefined,
      ...overrides.session,
    },

    // Scene
    scene: {
      enter: jest.fn(),
      leave: jest.fn(),
      reenter: jest.fn(),
      current: overrides.scene?.current || null,
    },

    // Wizard (para cenas)
    wizard: {
      state: {},
      next: jest.fn(),
      back: jest.fn(),
      selectStep: jest.fn(),
      ...overrides.wizard,
    },

    // Métodos de resposta
    reply: jest.fn().mockResolvedValue({}),
    replyWithMarkdown: jest.fn().mockResolvedValue({}),
    replyWithHTML: jest.fn().mockResolvedValue({}),
    replyWithDocument: jest.fn().mockResolvedValue({}),
    replyWithPhoto: jest.fn().mockResolvedValue({}),
    sendChatAction: jest.fn().mockResolvedValue({}),
    deleteMessage: jest.fn().mockResolvedValue({}),

    // Callback query
    callbackQuery: overrides.callbackQuery || null,
    answerCbQuery: jest.fn().mockResolvedValue({}),

    // Update
    update: {
      update_id: 1,
      ...overrides.update,
    },

    // From
    from: {
      id: 123456789,
      first_name: 'Test',
      username: 'testuser',
      ...overrides.from,
    },

    // Chat
    chat: {
      id: 123456789,
      type: 'private',
      ...overrides.chat,
    },

    // Outros
    ...overrides,
  };

  return mockCtx;
};

export const createMockBot = () => {
  const handlers: Map<string, Function[]> = new Map();

  const bot: any = {
    // Registro de handlers
    use: jest.fn((middleware) => {
      const key = 'middleware';
      if (!handlers.has(key)) handlers.set(key, []);
      handlers.get(key)!.push(middleware);
    }),

    start: jest.fn((handler) => {
      handlers.set('start', [handler]);
    }),

    help: jest.fn((handler) => {
      handlers.set('help', [handler]);
    }),

    command: jest.fn((command, handler) => {
      const key = Array.isArray(command) ? command.join('|') : command;
      handlers.set(`command:${key}`, [handler]);
    }),

    on: jest.fn((filter, handler) => {
      const key = `on:${JSON.stringify(filter)}`;
      handlers.set(key, [handler]);
    }),

    action: jest.fn((action, handler) => {
      handlers.set(`action:${action}`, [handler]);
    }),

    launch: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),

    // Métodos para simular chamadas
    _handlers: handlers,

    _simulateCommand: async (command: string, ctx: any) => {
      const handler = handlers.get(`command:${command}`)?.[0];
      if (handler) await handler(ctx);
    },

    _simulateStart: async (ctx: any) => {
      const handler = handlers.get('start')?.[0];
      if (handler) await handler(ctx);
    },

    _simulateMessage: async (ctx: any, type: string = 'text') => {
      const handler = handlers.get(`on:${JSON.stringify({ message: type })}`)?.[0];
      if (handler) await handler(ctx);
    },
  };

  return bot;
};

export class MockTelegraf {
  public handlers: Map<string, Function[]> = new Map();

  use(middleware: Function) {
    const key = 'middleware';
    if (!this.handlers.has(key)) this.handlers.set(key, []);
    this.handlers.get(key)!.push(middleware);
    return this;
  }

  start(handler: Function) {
    this.handlers.set('start', [handler]);
    return this;
  }

  help(handler: Function) {
    this.handlers.set('help', [handler]);
    return this;
  }

  command(command: string | string[], handler: Function) {
    const key = Array.isArray(command) ? command.join('|') : command;
    this.handlers.set(`command:${key}`, [handler]);
    return this;
  }

  on(filter: any, handler: Function) {
    const key = `on:${JSON.stringify(filter)}`;
    this.handlers.set(key, [handler]);
    return this;
  }

  action(action: string, handler: Function) {
    this.handlers.set(`action:${action}`, [handler]);
    return this;
  }

  launch() {
    return Promise.resolve();
  }

  stop() {
    return;
  }

  // Helper para testar handlers
  async simulateCommand(command: string, ctx: any) {
    const handler = this.handlers.get(`command:${command}`)?.[0];
    if (handler) await handler(ctx);
  }

  async simulateStart(ctx: any) {
    const handler = this.handlers.get('start')?.[0];
    if (handler) await handler(ctx);
  }

  async simulateMessage(ctx: any) {
    // Simula mensagem de texto
    const handler = this.handlers.get(`on:${JSON.stringify({ message: 'text' })}`)?.[0];
    if (handler) await handler(ctx);
  }
}
