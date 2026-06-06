// ═══════════════════════════════════════════
// LYON PROTOCOL — Cálculos de macros
// ═══════════════════════════════════════════

export function calcularMacros(perfil) {
  const { peso, altura, idade, genero, objetivo, atividade, pesoMeta } = perfil

  // Peso alvo para cálculo
  const pesoCalculo = pesoMeta || peso

  // 1g de proteína por libra de peso-alvo
  const pesoLbs = pesoCalculo * 2.2046
  const proteina = Math.round(pesoLbs)

  // 0.4g de gordura por libra de peso-alvo
  const gordura = Math.round(pesoLbs * 0.4)

  // 130g de carb base (RDA)
  const carb = 130

  // Calorias totais
  const kcal = proteina * 4 + gordura * 9 + carb * 4

  // Margem livre (~280 kcal abaixo do gasto estimado)
  const tmb = calcularTMB(peso, altura, idade, genero)
  const fatorAtividade = getFatorAtividade(atividade)
  const gastoTotal = Math.round(tmb * fatorAtividade)
  const margemLivre = Math.max(0, gastoTotal - kcal)

  return {
    proteina,
    gordura,
    carb,
    kcal,
    gastoEstimado: gastoTotal,
    margemLivre,
    pesoAlvo: pesoCalculo,
    refeicoesPorDia: 3,
    proteinaPorRefeicao: Math.round(proteina / 3),
  }
}

// Fórmula de Mifflin-St Jeor (padrão médico atual)
export function calcularTMB(peso, altura, idade, genero) {
  if (genero === 'masculino') {
    return 10 * peso + 6.25 * altura - 5 * idade + 5
  } else {
    return 10 * peso + 6.25 * altura - 5 * idade - 161
  }
}

export function getFatorAtividade(atividade) {
  const fatores = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    ativo: 1.725,
    muito_ativo: 1.9,
  }
  return fatores[atividade] || 1.55
}

// Calcular saldo do dia
export function calcularSaldo(macrosMeta, refeicoes) {
  const consumido = refeicoes.reduce(
    (acc, r) => ({
      proteina: acc.proteina + (r.proteina || 0),
      carb: acc.carb + (r.carb || 0),
      gordura: acc.gordura + (r.gordura || 0),
      kcal: acc.kcal + (r.kcal || 0),
    }),
    { proteina: 0, carb: 0, gordura: 0, kcal: 0 }
  )

  const falta = {
    proteina: Math.max(0, macrosMeta.proteina - consumido.proteina),
    carb: Math.max(0, macrosMeta.carb - consumido.carb),
    gordura: Math.max(0, macrosMeta.gordura - consumido.gordura),
    kcal: Math.max(0, macrosMeta.kcal - consumido.kcal),
  }

  const progresso = {
    proteina: Math.min(100, Math.round((consumido.proteina / macrosMeta.proteina) * 100)),
    carb: Math.min(100, Math.round((consumido.carb / macrosMeta.carb) * 100)),
    gordura: Math.min(100, Math.round((consumido.gordura / macrosMeta.gordura) * 100)),
    kcal: Math.min(100, Math.round((consumido.kcal / macrosMeta.kcal) * 100)),
  }

  return { consumido, falta, progresso }
}

// Estimar peso meta baseado no objetivo
export function estimarPesoMeta(peso, altura, objetivo) {
  const imc = peso / Math.pow(altura / 100, 2)

  if (objetivo === 'perder' && imc > 25) {
    // Sugere IMC 23 como alvo
    const pesoMeta = Math.round(23 * Math.pow(altura / 100, 2))
    return Math.max(pesoMeta, peso - 30) // máximo 30kg de diferença
  }

  return peso
}

// Biblioteca padrão de refeições (pré-populada)
export const BIBLIOTECA_PADRAO = [
  // Café da manhã
  { nome: 'Omelete 2 ovos + mussarela', categoria: 'cafe', proteina: 22, carb: 2, gordura: 16, kcal: 240 },
  { nome: 'Pão francês com ovo + mussarela', categoria: 'cafe', proteina: 20, carb: 28, gordura: 12, kcal: 300 },
  { nome: 'Whey com leite 2%', categoria: 'cafe', proteina: 32, carb: 14, gordura: 5, kcal: 233 },
  { nome: 'Ovos mexidos (4 ovos)', categoria: 'cafe', proteina: 28, carb: 2, gordura: 20, kcal: 296 },

  // Almoço / Janta
  { nome: 'Frango grelhado 200g', categoria: 'almoco', proteina: 46, carb: 0, gordura: 4, kcal: 220 },
  { nome: 'Frango grelhado 300g', categoria: 'almoco', proteina: 69, carb: 0, gordura: 6, kcal: 330 },
  { nome: 'Bife de alcatra 200g', categoria: 'almoco', proteina: 46, carb: 0, gordura: 14, kcal: 314 },
  { nome: 'Bife de alcatra 300g', categoria: 'almoco', proteina: 69, carb: 0, gordura: 21, kcal: 471 },
  { nome: 'Acém moído 200g', categoria: 'almoco', proteina: 40, carb: 0, gordura: 18, kcal: 330 },
  { nome: 'Acém picado na panela 200g', categoria: 'almoco', proteina: 38, carb: 4, gordura: 16, kcal: 312 },
  { nome: 'Coração de frango 200g', categoria: 'almoco', proteina: 34, carb: 0, gordura: 14, kcal: 270 },
  { nome: 'Filé mignon suíno 200g', categoria: 'almoco', proteina: 42, carb: 0, gordura: 8, kcal: 244 },
  { nome: 'Carré suíno 200g', categoria: 'almoco', proteina: 38, carb: 0, gordura: 20, kcal: 336 },

  // Acompanhamentos
  { nome: 'Arroz branco 4 col. sopa (100g)', categoria: 'acomp', proteina: 3, carb: 28, gordura: 0, kcal: 124 },
  { nome: 'Feijão carioca 1 concha (80g)', categoria: 'acomp', proteina: 5, carb: 14, gordura: 1, kcal: 85 },
  { nome: 'Batata-doce 100g', categoria: 'acomp', proteina: 2, carb: 24, gordura: 0, kcal: 104 },
  { nome: 'Salada verde à vontade', categoria: 'acomp', proteina: 2, carb: 5, gordura: 2, kcal: 45 },

  // Pratos completos
  { nome: 'Frango + arroz + feijão + salada', categoria: 'completo', proteina: 55, carb: 42, gordura: 7, kcal: 455 },
  { nome: 'Bife + arroz + feijão + salada', categoria: 'completo', proteina: 52, carb: 42, gordura: 16, kcal: 524 },
  { nome: 'Estrogonofe de frango (200g)', categoria: 'completo', proteina: 35, carb: 12, gordura: 18, kcal: 346 },
  { nome: 'Estrogonofe de carne (200g)', categoria: 'completo', proteina: 32, carb: 12, gordura: 22, kcal: 374 },
  { nome: 'Macarrão com carne moída (300g)', categoria: 'completo', proteina: 28, carb: 55, gordura: 14, kcal: 462 },

  // Lanches
  { nome: 'Hambúrguer artesanal (pão + 180g carne + queijo)', categoria: 'lanche', proteina: 45, carb: 32, gordura: 28, kcal: 564 },
  { nome: 'Pão francês com bife + mussarela', categoria: 'lanche', proteina: 38, carb: 28, gordura: 18, kcal: 422 },
  { nome: 'Rap 10 de frango (200g)', categoria: 'lanche', proteina: 40, carb: 30, gordura: 10, kcal: 370 },
  { nome: 'Rap 10 de carne moída (200g)', categoria: 'lanche', proteina: 36, carb: 30, gordura: 16, kcal: 408 },

  // Lanches leves
  { nome: 'Iogurte grego natural 200g', categoria: 'leve', proteina: 18, carb: 8, gordura: 4, kcal: 140 },
  { nome: 'Melão (200g)', categoria: 'leve', proteina: 1, carb: 14, gordura: 0, kcal: 60 },
  { nome: 'Banana (1 unidade)', categoria: 'leve', proteina: 1, carb: 27, gordura: 0, kcal: 112 },
  { nome: 'Maçã (1 unidade)', categoria: 'leve', proteina: 0, carb: 25, gordura: 0, kcal: 95 },
]
