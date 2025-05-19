import Head from "next/head";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [theme, setTheme] = useState("light");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "E aí, futura mestre da Administração Pública! Pronta pra gente detonar nesse TCC? Sei que parece um monstro de sete cabeças, mas relaxa, tô aqui pra te ajudar a domar a fera. Pode perguntar, não se acanhe! 😉",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages([...messages, { sender: "user", text: userMessage }]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: `Ops! Deu ruim na comunicação com meus superpoderes. ${error.message}. O Sil saberia o que fazer!` },
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white font-sans">
      <Head>
        <title>NikoleGPT</title>
      </Head>
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">NikoleGPT</h1>
        <button
          className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          Trocar Tema
        </button>
      </header>
      <main className="max-w-4xl mx-auto p-4">
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-2">
             Nikole! olhá só! como posso te ajudar hoje?
          </h2>
          <div className="h-96 overflow-y-auto border rounded p-4 space-y-3 bg-gray-100 dark:bg-gray-800" id="chat-box">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.sender === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "mr-auto bg-gray-300 dark:bg-gray-700 dark:text-white"
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="mt-4 flex gap-2">
            <textarea
              rows="1"
              className="flex-grow p-2 border rounded resize-none text-black"
              placeholder="Digite sua pergunta aqui..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={sendMessage}
            >
              Enviar
            </button>
          </div>
        </section>
      </main>
      <footer className="text-center text-xs text-gray-500 p-4 border-t border-gray-300">
        &copy; {new Date().getFullYear()} NikoleGPT — Powered by Sil Enterprises
      </footer>
    </div>
  );
}
