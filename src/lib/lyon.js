// ═══════════════════════════════════════════
// LYON PROTOCOL — Cálculos de macros
// ═══════════════════════════════════════════

export function calcularMacros(perfil) {
  const { peso, altura, idade, genero, objetivo, atividade, pesoMeta } = perfil
  const pesoCalculo = pesoMeta || peso
  const pesoLbs = pesoCalculo * 2.2046
  const proteina = Math.round(pesoLbs)
  const gordura = Math.round(pesoLbs * 0.4)
  const carb = 130
  const kcal = proteina * 4 + gordura * 9 + carb * 4
  const tmb = calcularTMB(peso, altura, idade, genero)
  const fatorAtividade = getFatorAtividade(atividade)
  const gastoTotal = Math.round(tmb * fatorAtividade)
  const margemLivre = Math.max(0, gastoTotal - kcal)

  return {
    proteina, gordura, carb, kcal,
    gastoEstimado: gastoTotal,
    margemLivre,
    pesoAlvo: pesoCalculo,
    refeicoesPorDia: 3,
    proteinaPorRefeicao: Math.round(proteina / 3),
  }
}

export function calcularTMB(peso, altura, idade, genero) {
  if (genero === 'masculino') return 10 * peso + 6.25 * altura - 5 * idade + 5
  return 10 * peso + 6.25 * altura - 5 * idade - 161
}

export function getFatorAtividade(atividade) {
  const fatores = { sedentario: 1.2, leve: 1.375, moderado: 1.55, ativo: 1.725, muito_ativo: 1.9 }
  return fatores[atividade] || 1.55
}

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

export function estimarPesoMeta(peso, altura, objetivo) {
  const imc = peso / Math.pow(altura / 100, 2)
  if (objetivo === 'perder' && imc > 25) {
    const pesoMeta = Math.round(23 * Math.pow(altura / 100, 2))
    return Math.max(pesoMeta, peso - 30)
  }
  return peso
}

// ═══════════════════════════════════════════
// BIBLIOTECA — itens individuais com unidades próprias
// unidade: 'g' | 'unidade' | 'fatia' | 'colher' | 'concha' | 'copo' | 'scoop'
// qtd_base: quantidade de referência para os macros
// ═══════════════════════════════════════════
export const BIBLIOTECA_PADRAO = [

  // ── PROTEÍNAS ──────────────────────────────
  // Aves
  { nome: 'Peito de frango grelhado', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 23, carb: 0, gordura: 2, kcal: 110 },
  { nome: 'Frango desfiado', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 22, carb: 0, gordura: 3, kcal: 115 },
  { nome: 'Coração de frango', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 17, carb: 0, gordura: 7, kcal: 135 },

  // Bovinos
  { nome: 'Bife de alcatra', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 23, carb: 0, gordura: 7, kcal: 157 },
  { nome: 'Patinho / Chã / Baby beef', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 22, carb: 0, gordura: 5, kcal: 137 },
  { nome: 'Acém moído', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 20, carb: 0, gordura: 9, kcal: 165 },
  { nome: 'Acém picado na panela', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 19, carb: 2, gordura: 8, kcal: 156 },
  { nome: 'Filé mignon suíno', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 21, carb: 0, gordura: 4, kcal: 122 },
  { nome: 'Carré suíno', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 19, carb: 0, gordura: 10, kcal: 168 },

  // Ovos (por unidade)
  { nome: 'Ovo inteiro', categoria: 'proteina', unidade: 'unidade', qtd_base: 1, proteina: 7, carb: 0, gordura: 5, kcal: 74 },
  { nome: 'Clara de ovo', categoria: 'proteina', unidade: 'unidade', qtd_base: 1, proteina: 4, carb: 0, gordura: 0, kcal: 17 },

  // Peixes
  { nome: 'Tilápia grelhada', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 21, carb: 0, gordura: 3, kcal: 111 },
  { nome: 'Salmão grelhado', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 20, carb: 0, gordura: 13, kcal: 197 },
  { nome: 'Atum natural (lata)', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 26, carb: 0, gordura: 2, kcal: 122 },

  // Lácteos
  { nome: 'Iogurte grego natural', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 9, carb: 4, gordura: 2, kcal: 70 },
  { nome: 'Queijo cottage', categoria: 'proteina', unidade: 'g', qtd_base: 100, proteina: 11, carb: 3, gordura: 4, kcal: 90 },
  { nome: 'Leite 2%', categoria: 'proteina', unidade: 'copo', qtd_base: 1, proteina: 8, carb: 12, gordura: 5, kcal: 125 },
  { nome: 'Whey protein', categoria: 'proteina', unidade: 'scoop', qtd_base: 1, proteina: 25, carb: 3, gordura: 2, kcal: 128 },

  // ── QUEIJOS (por fatia) ───────────────────
  { nome: 'Mussarela', categoria: 'queijo', unidade: 'fatia', qtd_base: 1, proteina: 5, carb: 0, gordura: 5, kcal: 65 },
  { nome: 'Queijo prato', categoria: 'queijo', unidade: 'fatia', qtd_base: 1, proteina: 5, carb: 0, gordura: 6, kcal: 74 },
  { nome: 'Requeijão', categoria: 'queijo', unidade: 'colher', qtd_base: 1, proteina: 2, carb: 1, gordura: 4, kcal: 46 },

  // ── PÃES E MASSAS ─────────────────────────
  { nome: 'Pão francês', categoria: 'pao', unidade: 'unidade', qtd_base: 1, proteina: 5, carb: 28, gordura: 1, kcal: 145 },
  { nome: 'Pão integral (fatia)', categoria: 'pao', unidade: 'fatia', qtd_base: 1, proteina: 3, carb: 13, gordura: 1, kcal: 69 },
  { nome: 'Wrap / Rap 10', categoria: 'pao', unidade: 'unidade', qtd_base: 1, proteina: 4, carb: 22, gordura: 3, kcal: 131 },
  { nome: 'Macarrão cozido', categoria: 'pao', unidade: 'g', qtd_base: 100, proteina: 5, carb: 25, gordura: 1, kcal: 129 },

  // ── ARROZ E GRÃOS ─────────────────────────
  { nome: 'Arroz branco', categoria: 'acomp', unidade: 'colher', qtd_base: 1, proteina: 1, carb: 7, gordura: 0, kcal: 31 },
  { nome: 'Arroz integral', categoria: 'acomp', unidade: 'colher', qtd_base: 1, proteina: 1, carb: 6, gordura: 0, kcal: 28 },
  { nome: 'Feijão carioca', categoria: 'acomp', unidade: 'concha', qtd_base: 1, proteina: 5, carb: 14, gordura: 1, kcal: 85 },
  { nome: 'Feijão preto', categoria: 'acomp', unidade: 'concha', qtd_base: 1, proteina: 6, carb: 13, gordura: 1, kcal: 85 },
  { nome: 'Lentilha cozida', categoria: 'acomp', unidade: 'g', qtd_base: 100, proteina: 9, carb: 20, gordura: 0, kcal: 116 },

  // ── TUBÉRCULOS ────────────────────────────
  { nome: 'Batata-doce', categoria: 'acomp', unidade: 'g', qtd_base: 100, proteina: 2, carb: 24, gordura: 0, kcal: 104 },
  { nome: 'Batata inglesa', categoria: 'acomp', unidade: 'g', qtd_base: 100, proteina: 2, carb: 17, gordura: 0, kcal: 77 },
  { nome: 'Mandioca / Macaxeira', categoria: 'acomp', unidade: 'g', qtd_base: 100, proteina: 1, carb: 30, gordura: 0, kcal: 125 },

  // ── VEGETAIS ──────────────────────────────
  { nome: 'Salada verde (folhas)', categoria: 'vegetal', unidade: 'g', qtd_base: 100, proteina: 2, carb: 3, gordura: 0, kcal: 20 },
  { nome: 'Brócolis', categoria: 'vegetal', unidade: 'g', qtd_base: 100, proteina: 3, carb: 5, gordura: 0, kcal: 34 },
  { nome: 'Abobrinha', categoria: 'vegetal', unidade: 'g', qtd_base: 100, proteina: 1, carb: 4, gordura: 0, kcal: 20 },
  { nome: 'Cenoura', categoria: 'vegetal', unidade: 'g', qtd_base: 100, proteina: 1, carb: 10, gordura: 0, kcal: 41 },
  { nome: 'Tomate', categoria: 'vegetal', unidade: 'unidade', qtd_base: 1, proteina: 1, carb: 5, gordura: 0, kcal: 22 },
  { nome: 'Vagem', categoria: 'vegetal', unidade: 'g', qtd_base: 100, proteina: 2, carb: 7, gordura: 0, kcal: 35 },

  // ── FRUTAS ────────────────────────────────
  { nome: 'Banana', categoria: 'fruta', unidade: 'unidade', qtd_base: 1, proteina: 1, carb: 27, gordura: 0, kcal: 112 },
  { nome: 'Maçã', categoria: 'fruta', unidade: 'unidade', qtd_base: 1, proteina: 0, carb: 25, gordura: 0, kcal: 95 },
  { nome: 'Melão', categoria: 'fruta', unidade: 'g', qtd_base: 100, proteina: 1, carb: 7, gordura: 0, kcal: 30 },
  { nome: 'Laranja', categoria: 'fruta', unidade: 'unidade', qtd_base: 1, proteina: 1, carb: 18, gordura: 0, kcal: 72 },

  // ── GORDURAS ──────────────────────────────
  { nome: 'Azeite de oliva', categoria: 'gordura', unidade: 'colher', qtd_base: 1, proteina: 0, carb: 0, gordura: 14, kcal: 126 },
  { nome: 'Manteiga', categoria: 'gordura', unidade: 'colher', qtd_base: 1, proteina: 0, carb: 0, gordura: 11, kcal: 100 },
  { nome: 'Abacate', categoria: 'gordura', unidade: 'g', qtd_base: 100, proteina: 2, carb: 6, gordura: 15, kcal: 160 },

  // ── BEBIDAS / OUTROS ──────────────────────
  { nome: 'Gatorade / Isotônico', categoria: 'bebida', unidade: 'unidade', qtd_base: 1, proteina: 0, carb: 36, gordura: 0, kcal: 140 },
  { nome: 'Suco de laranja natural', categoria: 'bebida', unidade: 'copo', qtd_base: 1, proteina: 1, carb: 26, gordura: 0, kcal: 112 },
  { nome: 'Farofa (colher)', categoria: 'acomp', unidade: 'colher', qtd_base: 1, proteina: 1, carb: 8, gordura: 3, kcal: 63 },
]
