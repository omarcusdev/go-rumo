import { useState, useEffect } from 'react'
import useMouseGlow from '../hooks/useMouseGlow'

const QUOTES = [
  { text: 'Só quem se arrisca merece viver o extraordinário', artist: 'Filipe Ret' },
  { text: 'Só o impossível me interessa', artist: 'Filipe Ret' },
  { text: 'Na crise que eu encontro a calma', artist: 'Filipe Ret' },
  { text: 'O monstro avança, quem tem um sonho não dança', artist: 'Filipe Ret' },
  { text: 'Pra ser bom é preciso sentir raiva da mediocridade', artist: 'Filipe Ret' },
  { text: 'Muitos vivem pra deixar bens, mas eu vivo pra deixar saudades', artist: 'Filipe Ret' },
  { text: 'Estamos anos luz daquele lugar, nem sei como vim parar aqui', artist: 'Matuê' },
  { text: 'Ganhar pra mim é fácil, eu nasci vencedor', artist: 'Matuê' },
  { text: 'Se coibir é uma prisão, se permitir é a solução', artist: 'Matuê' },
  { text: 'Reina quem tem visão entre os cegos', artist: 'Matuê' },
  { text: 'Pra doença do vacilo, eu tomei vacina', artist: 'Matuê' },
  { text: 'Mas quem que acreditaria que eu ia dominar um dia?', artist: 'Matuê' },
  { text: 'Eu cheguei onde cheguei sem padrinho, abri a mata, eu criei o meu caminho', artist: 'Alee' },
  { text: 'Ninguém vence o homem paciente, quem pula na frente pula ciente', artist: 'Alee' },
  { text: 'Várias batalha vencida, de baixo tu enxerga a tua subida', artist: 'Alee' },
  { text: 'Tu tá numa tempestade, o pior momento pra ter medo é agora', artist: 'Alee' },
  { text: 'Você nunca vai entender o peso de ser um vagabundo de luxo', artist: 'Wiu' },
  { text: 'O preço de uma lágrima só o olho que chorou é que sabe o custo', artist: 'Wiu' },
  { text: 'Agora eu tô namorando com as minhas nota, eu casei com o dinheiro', artist: 'Wiu' },
  { text: 'Problemas de um milionário, só eu que posso resolver', artist: 'Wiu' },
  { text: 'De anjo, eu só tenho a cara', artist: 'Veigh' },
  { text: 'O pouco, com Deus, sempre é muito', artist: 'Veigh' },
  { text: 'É que eu sou teimoso desde pequeno', artist: 'Veigh' },
  { text: 'Perfume La Vie Est Belle, mas eu só sinto o cheiro da maldade no ar', artist: 'Veigh' },
  { text: '90% esforço meu mano, o resto talvez seja dom', artist: 'Niink' },
  { text: 'Todos nós somos líderes, no meu bonde não existe discípulo', artist: 'Niink' },
  { text: 'Ainda no mesmo bairro mas dirigindo outro veículo', artist: 'Niink' },
  { text: 'Se acostume em ver os menor vencendo, é só o primeiro capítulo', artist: 'Niink' }
]

const getQuoteForCurrentHour = () => {
  const currentHour = new Date().getHours()
  return QUOTES[currentHour % QUOTES.length]
}

const MotivationalQuote = () => {
  const [quote, setQuote] = useState(getQuoteForCurrentHour)
  const glowRef = useMouseGlow()

  useEffect(() => {
    const checkHourChange = () => {
      const newQuote = getQuoteForCurrentHour()
      setQuote(newQuote)
    }

    const interval = setInterval(checkHourChange, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="motivational-quote" ref={glowRef}>
      <div className="section-glow" />
      <span className="quote-text">"{quote.text}"</span>
      <span className="quote-artist"> — {quote.artist}</span>
    </div>
  )
}

export default MotivationalQuote
