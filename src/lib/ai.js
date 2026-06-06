// ═══════════════════════════════════════════
// MÓDULO DE IA — troque aqui entre Claude e OpenAI
// ═══════════════════════════════════════════

const AI_PROVIDER = 'claude' // 'claude' ou 'openai'

const CLAUDE_CONFIG = {
  endpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-sonnet-4-20250514',
  headers: (key) => ({
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
  }),
}

const OPENAI_CONFIG = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  headers: (key) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  }),
}

// Chave da IA — configure aqui quando decidir qual usar
const AI_KEY = import.meta.env.VITE_AI_KEY || ''

async function callAI(systemPrompt, userMessage) {
  if (!AI_KEY) {
    // Modo demo sem IA — retorna resposta simulada
    return simulateAI(userMessage)
  }

  const config = AI_PROVIDER === 'claude' ? CLAUDE_CONFIG : OPENAI_CONFIG

  const body =
    AI_PROVIDER === 'claude'
      ? {
          model: config.model,
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }
      : {
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }

  const res = await fetch(config.endpoint, {
    method: 'POST',
    headers: config.headers(AI_KEY),
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (AI_PROVIDER === 'claude') {
    return data.content?.[0]?.text || ''
  } else {
    return data.choices?.[0]?.message?.content || ''
  }
}

// ═══════════════════════════════════════════
// Interpretar refeição em texto livre
// ═══════════════════════════════════════════
export async function interpretarRefeicao(texto, perfil) {
  const system = `Você é um nutricionista especializado em calcular macronutrientes de alimentos brasileiros.
Use como referência a Tabela TACO (Tabela Brasileira de Composição de Alimentos) e USDA.
Responda APENAS com JSON válido, sem texto adicional, sem markdown.`

  const prompt = `Calcule os macronutrientes desta refeição: "${texto}"
  
Retorne EXATAMENTE neste formato JSON:
{
  "descricao": "descrição resumida da refeição",
  "itens": [
    {"nome": "nome do alimento", "quantidade": "quantidade com unidade", "proteina": 0, "carb": 0, "gordura": 0, "kcal": 0}
  ],
  "total": {"proteina": 0, "carb": 0, "gordura": 0, "kcal": 0},
  "confianca": "alta|media|baixa"
}`

  try {
    const raw = await callAI(system, prompt)
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════
// Gerar sugestões para fechar macros do dia
// ═══════════════════════════════════════════
export async function gerarSugestoes(faltam, biblioteca, horario) {
  const system = `Você é um nutricionista do Lyon Protocol. Sugira refeições práticas e realistas para brasileiros.
Responda APENAS com JSON válido, sem texto adicional.`

  const prompt = `O usuário ainda precisa consumir hoje:
- Proteína: ${faltam.proteina}g
- Carboidrato: ${faltam.carb}g  
- Gordura: ${faltam.gordura}g
- Calorias: ${faltam.kcal} kcal
- Horário atual: ${horario}

Refeições salvas na biblioteca do usuário: ${JSON.stringify(biblioteca.slice(0, 10))}

Sugira 3 opções de refeições que ajudem a fechar esses macros.
Priorize itens da biblioteca se fizerem sentido.
Retorne EXATAMENTE neste formato:
{
  "sugestoes": [
    {
      "nome": "nome da refeição",
      "descricao": "descrição curta e prática",
      "macros": {"proteina": 0, "carb": 0, "gordura": 0, "kcal": 0},
      "daBiblioteca": true
    }
  ],
  "mensagem": "mensagem motivacional curta"
}`

  try {
    const raw = await callAI(system, prompt)
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════
// Modo demo — simula IA quando não há chave
// ═══════════════════════════════════════════
function simulateAI(msg) {
  return JSON.stringify({
    descricao: 'Refeição registrada (modo demo)',
    itens: [{ nome: 'Alimento', quantidade: '100g', proteina: 25, carb: 10, gordura: 5, kcal: 185 }],
    total: { proteina: 25, carb: 10, gordura: 5, kcal: 185 },
    confianca: 'media',
  })
}
