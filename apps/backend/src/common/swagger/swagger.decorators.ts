import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
  getSchemaPath,
} from '@nestjs/swagger';

/**
 * Decorators Swagger customizados para padronização
 *
 * Facilita a documentação consistente de endpoints
 */

/**
 * Documenta endpoint de criação (POST)
 */
export function ApiCreate(resource: string, dto?: Type<any>, description?: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Cria um novo ${resource}`,
      description: description || `Endpoint para criar um novo ${resource}`,
    }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 201,
      description: `${resource} criado com sucesso`,
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ...(dto ? [ApiBody({ type: dto })] : [])
  );
}

/**
 * Documenta endpoint de listagem (GET)
 */
export function ApiList(resource: string, dto?: Type<any>, description?: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Lista ${resource}`,
      description: description || `Retorna uma lista paginada de ${resource}`,
    }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 200,
      description: 'Lista retornada com sucesso',
      ...(dto
        ? {
            schema: {
              allOf: [
                { $ref: getSchemaPath('PaginatedResponse') },
                {
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: getSchemaPath(dto.name) },
                    },
                  },
                },
              ],
            },
          }
        : {}),
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número da página (padrão: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Itens por página (padrão: 10)',
      example: 10,
    })
  );
}

/**
 * Documenta endpoint de detalhes (GET /:id)
 */
export function ApiGetById(resource: string, dto?: Type<any>) {
  return applyDecorators(
    ApiOperation({
      summary: `Obtém detalhes de ${resource}`,
      description: `Retorna os detalhes completos de um ${resource} específico`,
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      type: 'string',
      description: `ID do ${resource}`,
      example: 'clp1234567890abcdef',
    }),
    ApiResponse({
      status: 200,
      description: `${resource} encontrado`,
      ...(dto ? { type: dto } : {}),
    }),
    ApiResponse({
      status: 404,
      description: `${resource} não encontrado`,
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    })
  );
}

/**
 * Documenta endpoint de atualização (PATCH/PUT)
 */
export function ApiUpdate(resource: string, dto?: Type<any>, description?: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Atualiza ${resource}`,
      description: description || `Atualiza parcialmente um ${resource}`,
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      type: 'string',
      description: `ID do ${resource}`,
    }),
    ApiResponse({
      status: 200,
      description: `${resource} atualizado com sucesso`,
    }),
    ApiResponse({
      status: 400,
      description: 'Dados inválidos',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiResponse({
      status: 404,
      description: `${resource} não encontrado`,
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ...(dto ? [ApiBody({ type: dto })] : [])
  );
}

/**
 * Documenta endpoint de remoção (DELETE)
 */
export function ApiDelete(resource: string, description?: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Remove ${resource}`,
      description: description || `Remove permanentemente um ${resource}`,
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      type: 'string',
      description: `ID do ${resource}`,
    }),
    ApiResponse({
      status: 200,
      description: `${resource} removido com sucesso`,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: `${resource} removido com sucesso`,
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: `${resource} não encontrado`,
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    })
  );
}

/**
 * Documenta endpoint público (sem autenticação)
 */
export function ApiPublic(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiResponse({ status: 200, description: 'Sucesso' }),
    ApiResponse({
      status: 400,
      description: 'Requisição inválida',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    })
  );
}

/**
 * Documenta endpoint de exportação
 */
export function ApiExport(format: string, description?: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Exporta dados em formato ${format.toUpperCase()}`,
      description: description || `Exporta dados em formato ${format}`,
    }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 200,
      description: `Arquivo ${format.toUpperCase()} gerado com sucesso`,
      content: {
        'application/octet-stream': {},
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    })
  );
}

/**
 * Documenta endpoint de importação
 */
export function ApiImport(format: string, description?: string) {
  return applyDecorators(
    ApiOperation({
      summary: `Importa dados de arquivo ${format.toUpperCase()}`,
      description: description || `Importa dados de arquivo ${format}`,
    }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 200,
      description: 'Importação concluída',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'number', example: 45 },
          failed: { type: 'number', example: 2 },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                line: { type: 'number' },
                error: { type: 'string' },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Arquivo inválido',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    })
  );
}

/**
 * Documenta endpoint administrativo (apenas ADMIN)
 */
export function ApiAdmin(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({ status: 200, description: 'Sucesso' }),
    ApiResponse({
      status: 401,
      description: 'Não autenticado',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    }),
    ApiResponse({
      status: 403,
      description: 'Sem permissão (apenas ADMIN)',
      schema: { $ref: getSchemaPath('ErrorResponse') },
    })
  );
}
