const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      nodeExternals({
        // ✅ CORREÇÃO APLICADA:
        // A allowlist DEVE estar ativa para compilar os pacotes do monorepo (@fayol/*)
        // Se estiver comentada, o backend quebra com "SyntaxError: Unexpected identifier 'as'"
        allowlist: [/^@fayol/],
      }),
    ],
  };
};
