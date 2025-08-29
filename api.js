'use strict';
const fetch = require('node-fetch');

module.exports = function (app) {
  const likesDB = {}; // { stock: Set of IPs }

  function getClientIP(req) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return ip.split(',')[0].trim(); // Anonimizado
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
 app.get('/api/stock-prices', async (req, res) => {
  const { stock, like } = req.query;
  const ip = req.ip;

  const fetchStockData = async (symbol) => {
    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
    const data = await response.json();
    return { stock: data.symbol, price: data.latestPrice };
  };

  const updateLikes = async (symbol) => {
    const doc = await Stock.findOne({ stock: symbol }) || new Stock({ stock: symbol, likes: [] });
    if (like === 'true' && !doc.likes.includes(ip)) {
      doc.likes.push(ip);
      await doc.save();
    }
    return doc.likes.length;
  };

  if (Array.isArray(stock)) {
    const [stock1, stock2] = stock;

    const [data1, data2] = await Promise.all([
      fetchStockData(stock1),
      fetchStockData(stock2)
    ]);

    const [likes1, likes2] = await Promise.all([
      updateLikes(stock1),
      updateLikes(stock2)
    ]);

    res.json({
      stockData: [
        { ...data1, rel_likes: likes1 - likes2 },
        { ...data2, rel_likes: likes2 - likes1 }
      ]
    });
  } else {
    const data = await fetchStockData(stock);
    const likes = await updateLikes(stock);

    res.json({
      stockData: { ...data, likes }
    });
  }
});
      }
    } catch (err) {
      res.status(500).json({ error: 'Error fetching stock data' });
    }
  });
};
