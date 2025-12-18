const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.ssrmindkindler84fcf = onRequest({"region":"europe-west3"}, (req, res) => server.then(it => it.handle(req, res)));
  