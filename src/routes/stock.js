/**
 * 해외 주식 데이터 프록시 라우트
 * Yahoo Finance API를 프록시하여 CORS 문제 해결
 */

export default async function stockRoutes(fastify, opts) {
  // Yahoo Finance API 프록시
  fastify.get('/stock/price/:symbol', async (request, reply) => {
    const { symbol } = request.params
    
    try {
      // 캐시 방지를 위해 타임스탬프 추가
      const timestamp = Date.now()
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d&_=${timestamp}`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        return reply.code(404).send({ error: 'No data found' })
      }

      const result = data.chart.result[0]
      const meta = result.meta
      
      // 실시간 가격 우선순위: regularMarketPrice > currentPrice > previousClose
      const price = meta.regularMarketPrice || meta.currentPrice || meta.previousClose || 0
      const previousClose = meta.previousClose || price
      const change = price - previousClose
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

      // 실시간 데이터 확인
      const now = new Date()
      const marketTime = meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : null
      const isMarketOpen = meta.marketState === 'REGULAR' || meta.marketState === 'PRE' || meta.marketState === 'POST'

      return {
        price: price,
        priceString: price.toFixed(2),
        priceChange: change,
        priceChangePercent: changePercent,
        high24h: meta.regularMarketDayHigh || meta.dayHigh || price,
        low24h: meta.regularMarketDayLow || meta.dayLow || price,
        volume24h: meta.regularMarketVolume || meta.volume || 0,
        marketTime: marketTime ? marketTime.toISOString() : now.toISOString(),
        isMarketOpen: isMarketOpen
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message })
    }
  })

  // Yahoo Finance 차트 데이터 프록시
  fastify.get('/stock/chart/:symbol', async (request, reply) => {
    const { symbol } = request.params
    const { interval = '1m', range = '1d' } = request.query
    
    try {
      // 캐시 방지를 위해 타임스탬프 추가
      const timestamp = Date.now()
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&_=${timestamp}`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        return reply.code(404).send({ error: 'No data found' })
      }

      const result = data.chart.result[0]
      const timestamps = result.timestamp || []
      const quote = result.indicators.quote[0]
      
      if (!quote || !quote.open || quote.open.length === 0) {
        return reply.code(404).send({ error: 'No quote data found' })
      }

      const candles = []
      for (let i = 0; i < timestamps.length; i++) {
        // Yahoo Finance 타임스탬프는 초 단위 (Unix timestamp)
        // 하지만 10자리 이상이면 밀리초일 수 있으므로 확인
        let timestamp = timestamps[i]
        let time
        if (timestamp > 1e12) {
          // 밀리초 단위인 경우 (13자리)
          time = Math.floor(timestamp / 1000)
        } else {
          // 초 단위인 경우 (10자리)
          time = Math.floor(timestamp)
        }
        
        const open = quote.open[i] || 0
        const high = quote.high[i] || 0
        const low = quote.low[i] || 0
        const close = quote.close[i] || 0
        const volume = quote.volume[i] || 0
        
        if (open > 0 && high > 0 && low > 0 && close > 0) {
          candles.push({
            time: time,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume
          })
        }
      }

      candles.sort((a, b) => a.time - b.time)

      return { candles }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message })
    }
  })

  // Binance Futures 차트 데이터 프록시
  fastify.get('/futures/chart/:symbol', async (request, reply) => {
    const { symbol } = request.params
    const { interval = '1m', limit = 500 } = request.query
    
    try {
      // 코인 선물 심볼 변환
      const cryptoFutures = ['BTC', 'ETH', 'XRP', 'BNB', 'SOL', 'ADA', 'DOGE', 'DOT']
      const futuresSymbol = cryptoFutures.includes(symbol) ? `${symbol}USDT` : symbol
      
      const binanceInterval = interval === '1m' ? '1m' : interval === '5m' ? '5m' : interval === '15m' ? '15m' : interval === '1h' ? '1h' : '1d'
      const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${futuresSymbol}&interval=${binanceInterval}&limit=${limit}`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      const candles = data.map(kline => ({
        time: Math.floor(kline[0] / 1000), // 밀리초를 초로 변환
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }))

      return { candles }
    } catch (error) {
      fastify.log.error(error)
      return reply.code(500).send({ error: error.message })
    }
  })
}

