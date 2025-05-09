// frontend-nextjs/app/page.tsx
"use client";

import { useState } from "react";

// const AGENT_DEFAULT_PORT = 9200; // Não é mais necessário se a URL do ngrok já for completa

export default function HomePage() {
  // States para os dados do produto
  const [productName, setProductName] = useState("Produto Exemplo");
  const [productBatch, setProductBatch] = useState("LOTE789");
  const [productExpiry, setProductExpiry] = useState("2025-12-31");

  // State para a URL completa do agente via ngrok
  const [ngrokAgentUrl, setNgrokAgentUrl] = useState(
    "https://2f9c-2804-7f0-9bc0-5f3-b87b-4b29-a3e1-ca0d.ngrok-free.app" // SUA URL ATUAL DO NGROK
  );
  // State para o IP da impressora que será passado como query param para o agente
  const [targetPrinterIp, setTargetPrinterIp] = useState("127.0.0.1"); // Para o mock server local

  // States de UI
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generateZPL = () => {
    let formattedExpiry = productExpiry;
    if (productExpiry && productExpiry.includes("-")) {
      const parts = productExpiry.split("-");
      if (parts.length === 3)
        formattedExpiry = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return `
^XA
^CI28
^FO50,50^A0N,35,35^FDProd: ${
      productName ? productName.substring(0, 20) : "N/A"
    }^FS
^FO50,100^A0N,30,30^FDLote: ${
      productBatch ? productBatch.substring(0, 15) : "N/A"
    }^FS
^FO50,150^A0N,30,30^FDVal: ${formattedExpiry || "N/A"}^FS
^XZ
`;
  };

  const handlePrintViaAgent = async () => {
    // Validação usando ngrokAgentUrl
    if (!ngrokAgentUrl) {
      // <<--- CORRIGIDO
      alert("Informe a URL do Agente (ngrok).");
      return;
    }
    if (!targetPrinterIp) {
      alert("Informe o IP da Impressora Alvo (Mock ou Real).");
      return;
    }

    setIsLoading(true);
    setMessage("Enviando para agente...");
    const zplCode = generateZPL();

    // Constrói a URL completa para o agente, incluindo o endpoint /print e o query parameter
    const fullAgentUrl = `${ngrokAgentUrl}/print?printerIp=${targetPrinterIp}`; // <<--- CORRIGIDO

    try {
      const response = await fetch(fullAgentUrl, {
        // <<--- CORRIGIDO (usa fullAgentUrl)
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: zplCode,
      });
      const result = await response.json();
      if (response.ok) {
        setMessage(`Agente: ${result.message}`);
      } else {
        setMessage(
          `Erro Agente (${response.status}): ${result.error || result.message}`
        );
      }
    } catch (error: unknown) {
      let errorMsg =
        "Falha ao conectar ao agente. Verifique a URL e se o agente/túnel ngrok está rodando."; // Mensagem de erro ajustada
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        errorMsg =
          "Falha ao conectar ao agente. A URL do ngrok está correta e ativa? O agente local está rodando?";
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      setMessage(`Erro: ${errorMsg}`);
      console.error("Erro ao enviar para o agente:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial",
        maxWidth: "600px",
        margin: "auto",
      }}
    >
      <h1>Impressão ZPL via Agente Local</h1>

      <div
        style={{
          marginBottom: "15px",
          border: "1px solid #eee",
          padding: "10px",
        }}
      >
        <h2>Configuração do Agente e Impressora</h2>
        <div>
          {/* Input para a URL do ngrok */}
          <label htmlFor="ngrokAgentUrl">URL do Agente (via ngrok):</label>{" "}
          {/* <<--- CORRIGIDO */}
          <br />
          <input
            type="text"
            id="ngrokAgentUrl" // <<--- CORRIGIDO
            value={ngrokAgentUrl} // <<--- CORRIGIDO
            onChange={(e) => setNgrokAgentUrl(e.target.value)} // <<--- CORRIGIDO
            style={{ width: "90%", padding: "8px", marginBottom: "10px" }}
            placeholder="Ex: https://xxxxxx.ngrok-free.app"
          />
        </div>
        <div>
          <label htmlFor="targetPrinterIp">
            IP da Impressora Alvo (Mock ou Real, para o agente usar):
          </label>
          <br />
          <input
            type="text"
            id="targetPrinterIp"
            value={targetPrinterIp}
            onChange={(e) => setTargetPrinterIp(e.target.value)}
            style={{ width: "90%", padding: "8px" }}
            placeholder="Ex: 127.0.0.1 (para mock local)"
          />
        </div>
      </div>

      {/* ... (Restante do JSX para Dados do Produto, Botão e Mensagem permanece o mesmo) ... */}
      <div
        style={{
          marginBottom: "15px",
          border: "1px solid #eee",
          padding: "10px",
        }}
      >
        <h2>Dados do Produto</h2>
        <div>
          <label htmlFor="productName">Nome do Produto:</label>
          <br />
          <input
            type="text"
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={{ width: "90%", padding: "8px", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label htmlFor="productBatch">Lote:</label>
          <br />
          <input
            type="text"
            id="productBatch"
            value={productBatch}
            onChange={(e) => setProductBatch(e.target.value)}
            style={{ width: "90%", padding: "8px", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label htmlFor="productExpiry">Data de Validade:</label>
          <br />
          <input
            type="date"
            id="productExpiry"
            value={productExpiry}
            onChange={(e) => setProductExpiry(e.target.value)}
            style={{ width: "90%", padding: "8px" }}
          />
        </div>
      </div>

      <button
        onClick={handlePrintViaAgent}
        disabled={isLoading}
        style={{
          padding: "12px 25px",
          backgroundColor: isLoading ? "grey" : "dodgerblue",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        {isLoading ? "Enviando..." : "Imprimir via Agente"}
      </button>

      {message && (
        <p
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: message.startsWith("Erro") ? "#ffebee" : "#e8f5e9",
            color: message.startsWith("Erro") ? "#c62828" : "#2e7d32",
            border: `1px solid ${
              message.startsWith("Erro") ? "#c62828" : "#2e7d32"
            }`,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
