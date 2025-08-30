'use strict';
const fetch = require('node-fetch');

module.exports = function (app) {
  const likesDB = {}; // { stock: Set of IPs }

function getClientIP(req) {
  const rawIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  const ip = rawIP.split(',')[0].trim();

  // Si la IP fue simulada manualmente, no la trunques
  if (req.headers['x-forwarded-for']) return ip;

  // Truncamiento solo para IPs reales
  if (ip === '::1' || ip.startsWith('::ffff:127')) return '127.0.0.0';
  const blocks = ip.split('.');
  if (blocks.length === 4) {
    return `${blocks[0]}.${blocks[1]}.${blocks[2]}.0`;
  }
  return ip;
}

  async function fetchStock(stock) {
  const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`;

    const res = await fetch(url);
    const data = await res.json();
    return {
      stock: data.symbol,
      price: data.latestPrice
    };
  }
 

  app.get('/api/stock-prices', async function (req, res) {
    try {
      let { stock, like } = req.query;
      const ip = getClientIP(req);
      like = like === 'true';

      if (Array.isArray(stock)) {
        const [stock1, stock2] = stock.map(s => s.toUpperCase());
        const [data1, data2] = await Promise.all([
          fetchStock(stock1),
          fetchStock(stock2)
        ]);

        if (like) {
          likesDB[stock1] = likesDB[stock1] || new Set();
          likesDB[stock2] = likesDB[stock2] || new Set();

        if (!likesDB[stock1].has(ip)) {
          likesDB[stock1].add(ip);
  }
        if (!likesDB[stock2].has(ip)) {
          likesDB[stock2].add(ip);
  }
}

        const likes1 = likesDB[stock1] ? likesDB[stock1].size : 0;
        const likes2 = likesDB[stock2] ? likesDB[stock2].size : 0;

        res.json({
          stockData: [
            { stock: data1.stock, price: data1.price, rel_likes: likes1 - likes2 },
            { stock: data2.stock, price: data2.price, rel_likes: likes2 - likes1 }
          ]
        });
      } else {
        stock = stock.toUpperCase();
        const data = await fetchStock(stock);

        if (like) {
          likesDB[stock] = likesDB[stock] || new Set();
        if (!likesDB[stock].has(ip)) {
          likesDB[stock].add(ip);
  }
}

        const likes = likesDB[stock] ? likesDB[stock].size : 0;
        console.log(typeof data.stock, typeof data.price, typeof likes)
        res.json({
          stockData: {
            stock: String(data.stock),       // Asegura que sea cadena
              price: Number(data.price),       // Asegura que sea número
              likes: Number(likes)
          }
        });
      }
    } catch (err) {
      res.status(500).json({ error: 'Error fetching stock data' });
    }
  });
};
