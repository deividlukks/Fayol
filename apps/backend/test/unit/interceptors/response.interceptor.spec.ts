import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from '../../../src/common/interceptors/response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockExecutionContext = {} as ExecutionContext;
    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap response in ApiResponse format', (done) => {
    const testData = { id: '123', name: 'Test' };
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('data', testData);
        expect(result).toHaveProperty('timestamp');
        expect(typeof result.timestamp).toBe('string');
        done();
      },
      error: done,
    });
  });

  it('should include timestamp in ISO format', (done) => {
    const testData = { message: 'Hello' };
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.timestamp).toBeDefined();
        const timestamp = new Date(result.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.toISOString()).toBe(result.timestamp);
        done();
      },
      error: done,
    });
  });

  it('should wrap array data correctly', (done) => {
    const testData = [{ id: '1' }, { id: '2' }];
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(testData);
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(2);
        done();
      },
      error: done,
    });
  });

  it('should wrap null data correctly', (done) => {
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
        expect(result.timestamp).toBeDefined();
        done();
      },
      error: done,
    });
  });

  it('should wrap undefined data correctly', (done) => {
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(undefined));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.success).toBe(true);
        expect(result.data).toBeUndefined();
        expect(result.timestamp).toBeDefined();
        done();
      },
      error: done,
    });
  });

  it('should wrap string data correctly', (done) => {
    const testData = 'Simple string response';
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.success).toBe(true);
        expect(result.data).toBe(testData);
        expect(typeof result.data).toBe('string');
        done();
      },
      error: done,
    });
  });

  it('should wrap number data correctly', (done) => {
    const testData = 42;
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.success).toBe(true);
        expect(result.data).toBe(42);
        expect(typeof result.data).toBe('number');
        done();
      },
      error: done,
    });
  });

  it('should wrap boolean data correctly', (done) => {
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(true));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.success).toBe(true);
        expect(result.data).toBe(true);
        expect(typeof result.data).toBe('boolean');
        done();
      },
      error: done,
    });
  });

  it('should wrap nested object data correctly', (done) => {
    const testData = {
      user: {
        id: '123',
        profile: {
          name: 'Test',
          settings: {
            theme: 'dark',
          },
        },
      },
    };
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.success).toBe(true);
        expect(result.data).toEqual(testData);
        expect(result.data.user.profile.settings.theme).toBe('dark');
        done();
      },
      error: done,
    });
  });

  it('should maintain data structure integrity', (done) => {
    const complexData = {
      items: [1, 2, 3],
      metadata: {
        total: 3,
        page: 1,
      },
      nested: {
        deep: {
          value: 'test',
        },
      },
    };
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(complexData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.data).toEqual(complexData);
        expect(result.data.items).toHaveLength(3);
        expect(result.data.metadata.total).toBe(3);
        expect(result.data.nested.deep.value).toBe('test');
        done();
      },
      error: done,
    });
  });
});
