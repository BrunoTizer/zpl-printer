// frontend-nextjs/app/page.tsx
"use client";

import { useState } from "react";

const AGENT_DEFAULT_PORT = 9200; // Porta padrão do agente

export default function HomePage() {
  // States para os dados do produto
  const [productName, setProductName] = useState("Produto Exemplo");
  const [productBatch, setProductBatch] = useState("LOTE789");
  const [productExpiry, setProductExpiry] = useState("2025-12-31");

  // States para configuração da impressão via agente
  const [agentIp, setAgentIp] = useState("192.168.1.102"); // IP do PC onde o AGENTE está rodando
  const [targetPrinterIp, setTargetPrinterIp] = useState("192.168.1.102"); // IP do MOCK ou da IMPRESSORA REAL

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
    if (!agentIp) {
      alert("Informe o IP do Agente Local.");
      return;
    }
    if (!targetPrinterIp) {
      alert("Informe o IP da Impressora Alvo (Mock ou Real).");
      return;
    }

    setIsLoading(true);
    setMessage("Enviando para agente...");
    const zplCode = generateZPL();
    const agentUrl = `http://${agentIp}:${AGENT_DEFAULT_PORT}/print?printerIp=${targetPrinterIp}`;

    try {
      const response = await fetch(agentUrl, {
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
        "Falha ao conectar ao agente. Verifique o IP e se o agente está rodando.";
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        errorMsg =
          "Falha ao conectar ao agente. O IP está correto? O agente está rodando e acessível na rede? Há um firewall bloqueando?";
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
          <label htmlFor="agentIp">IP do Agente Local (PC na sua rede):</label>
          <br />
          <input
            type="text"
            id="agentIp"
            value={agentIp}
            onChange={(e) => setAgentIp(e.target.value)}
            style={{ width: "90%", padding: "8px", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label htmlFor="targetPrinterIp">
            IP da Impressora Alvo (Mock ou Real):
          </label>
          <br />
          <input
            type="text"
            id="targetPrinterIp"
            value={targetPrinterIp}
            onChange={(e) => setTargetPrinterIp(e.target.value)}
            style={{ width: "90%", padding: "8px" }}
          />
        </div>
      </div>

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
