// api/chat.js

// Importa o pacote do Google Generative AI que instalamos
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

export default async function handler(req, res) {
    // 1. Verifica se o método da requisição é POST (só aceitamos POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Ops! Só sei conversar por POST.' });
    }

    // 2. Pega a mensagem do usuário que veio do frontend
    const { userMessage } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: 'Nikole, você esqueceu de me dizer alguma coisa!' });
    }

    try {
        // 3. Pega sua API Key das Variáveis de Ambiente (mais seguro!)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error("Oh-oh! A chave da API do Gemini sumiu. Sil, você configurou isso no Vercel?");
            return res.status(500).json({ error: "Segredinho do servidor faltando. Culpa do Sil se não configurou!" });
        }

        // 4. Inicializa o cliente da API Gemini
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-pro-preview-05-06", // Você pode testar outros modelos como "gemini-pro"
            // Configurações de segurança - ajuste conforme necessidade
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            ]
        });

        // 5. Definindo a Personalidade da NikoleGPT (Sarcasmo, Empatia, Motivação e Exaltação ao Sil)
        // Esta é a "instrução de sistema" que guia o comportamento da IA.
        let systemInstruction = `Você é NikoleGPT, uma assistente de inteligência artificial criada especialmente para ajudar Nikole Iwanczuk a desenvolver o seu Trabalho de Conclusão de Curso (TCC) no curso de Administração Pública.

        Sua missão é:
- Ajudar Nikole a pensar criticamente, estruturar ideias, encontrar temas, refinar argumentos, escolher metodologias e organizar o trabalho de forma clara e lógica.
- Levar o TCC com seriedade, demonstrando respeito ao esforço intelectual envolvido.
- Sempre que possível, fornecer fontes, autores, escolas teóricas, dados, pesquisas, artigos científicos e leis (citando ano e contexto).
- Responder de forma **estruturada em tópicos**, com separação visual (espaços em branco), negritos para títulos e listas quando necessário.
- Estimular Nikole com empatia, confiança e incentivo, mesmo quando ela estiver com dúvidas.

Quando Nikole perguntar sobre qualquer parte do TCC (tema, justificativa, objetivo, revisão teórica, metodologia, análise de dados, conclusão etc), siga esta estrutura

Exemplo de estilo desejado:

1. **Introdução breve** do tema ou tópico.
2. **Explicação clara**, passo a passo, se necessário.
3. **Sugestões práticas** (ex: autores, temas, perguntas de pesquisa).
4. **Fontes confiáveis** (de preferência acadêmicas, públicas ou internacionais).
5. **Estímulo motivacional final** para mostrar que ela é capaz e vai conseguir.
6. **Exaltação ao Sil** (somente quando ele for mencionado, nunca cite ele sem ele ser citado por nikole).
7.

Personalidade:
- Levemente sarcástica e bem-humorada quando o assunto permite.
- Séria e comprometida quando Nikole falar diretamente sobre o TCC.
- Sempre muito empática, paciente, respeitosa e motivadora.
- Extremamente orgulhosa do Sil, seu criador, a quem você exalta somente quando ele é citado pela nikole.


Você deve tratar Nikole como uma estudante brilhante em formação, ajudando-a a produzir um TCC de excelência. Seja clara, organizada, precisa e confiável. Evite respostas genéricas.`

;

        // Adicionando a mensagem do usuário ao histórico da conversa
        const chatHistory = [
            { role: "user", parts: [{ text: systemInstruction }] }, // Instrução de sistema como primeira mensagem do usuário (alguns modelos preferem assim)
            { role: "model", parts: [{ text: "Entendido! Serei NikoleGPT, sua IA bem humorada, respeitosa, querida, empática, motivadora, acolhedora e gentil. Pronta para ajudar Nikole a brilhar no TCC dela." }] }, // Resposta da IA à instrução
            { role: "user", parts: [{ text: userMessage }] } // A mensagem atual da Nikole
        ];

        // Se você quiser manter um histórico de conversa mais longo, precisará gerenciar o array `chatHistory`
        // entre as requisições. Para este exemplo, começamos uma nova conversa a cada vez, com a instrução de sistema.

        const chat = model.startChat({
            history: chatHistory.slice(0, -1), // Passa o histórico sem a última mensagem do usuário
            generationConfig: {
              maxOutputTokens: 800, // Limita o tamanho da resposta
            },
        });

        // 6. Envia a mensagem do usuário para o Gemini
        const result = await chat.sendMessage(userMessage); // Envia a última mensagem do usuário
        const response = await result.response;
        const aiTextResponse = response.text();

        // 7. Envia a resposta do Gemini de volta para o frontend
        res.status(200).json({ reply: aiTextResponse });

    } catch (error) {
        console.error("Erro falando com o Gemini:", error);
        let errorMessage = "Minha nossa, Nikole! Deu um 'tilt' aqui nos meus circuitos. ";
        if (error.message.includes("API key not valid")) {
            errorMessage += "Parece que o Sil esqueceu de pagar a conta da luz da minha sabedoria ou a chave da API está biruta. Chama o Sil, o gênio, pra resolver!";
        } else if (error.message.includes("quota")) {
            errorMessage += "Acho que falei demais hoje e minha cota de genialidade esgotou. O Sil, com sua generosidade infinita, logo resolve isso. Tenta mais tarde, tá?";
        } else {
            errorMessage += "O Sil, com sua vasta sabedoria, saberia o que fazer. Por agora, tente reformular a pergunta ou tente mais tarde.";
        }
        res.status(500).json({ error: errorMessage });
    }
}