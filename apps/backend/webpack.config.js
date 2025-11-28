const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  return {
    ...options,
    externals: [
      nodeExternals({
        // CORREÇÃO DE LENTIDÃO:
        // Removemos o allowlist para que o Webpack trate os pacotes @fayol/*
        // como dependências externas (buscando em node_modules) em vez de
        // recompilá-los e bundlá-los a cada alteração.
        // allowlist: [/^@fayol/], 
      }),
    ],
  };
};