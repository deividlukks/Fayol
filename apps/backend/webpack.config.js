const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      nodeExternals({
        // Esta linha é o segredo: diz para o Webpack NÃO externalizar
        // (ou seja, incluir no bundle) qualquer pacote que comece com @fayol
        allowlist: [/^@fayol/],
      }),
    ],
  };
};