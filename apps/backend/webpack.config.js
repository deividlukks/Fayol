const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = function (options, webpack) {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    ...options,

    // ==========================================
    // External Dependencies
    // ==========================================
    externals: [
      nodeExternals({
        // ✅ CORREÇÃO APLICADA:
        // A allowlist DEVE estar ativa para compilar os pacotes do monorepo (@fayol/*)
        // Se estiver comentada, o backend quebra com "SyntaxError: Unexpected identifier 'as'"
        allowlist: [/^@fayol/],
      }),
    ],

    // ==========================================
    // Performance Optimizations
    // ==========================================
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
      buildDependencies: {
        config: [__filename],
      },
      // Cache invalidation based on package-lock changes
      version: require('./package.json').version,
    },

    // ==========================================
    // Optimization Settings
    // ==========================================
    optimization: {
      ...options.optimization,
      moduleIds: 'deterministic',
      removeAvailableModules: isProduction,
      removeEmptyChunks: isProduction,
      minimize: false, // Backend não precisa de minificação
    },

    // ==========================================
    // Module Resolution
    // ==========================================
    resolve: {
      ...options.resolve,
      // Cache module resolution
      cache: true,
      // Optimize extensions order
      extensions: ['.ts', '.js', '.json'],
      // Symlinks for monorepo
      symlinks: true,
    },

    // ==========================================
    // Build Performance
    // ==========================================
    performance: {
      hints: false, // Disable warnings for large bundles
    },

    // ==========================================
    // Development Optimizations
    // ==========================================
    ...(isProduction
      ? {}
      : {
          // Faster rebuilds in watch mode
          snapshot: {
            managedPaths: [path.resolve(__dirname, '../../node_modules')],
            immutablePaths: [],
            buildDependencies: {
              hash: true,
              timestamp: true,
            },
            module: {
              timestamp: true,
            },
            resolve: {
              timestamp: true,
            },
          },
        }),
  };
};
