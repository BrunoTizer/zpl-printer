// app/page.js
"use client"; // Necessário para useState e event handlers

import { useState } from "react";

export default function HomePage() {
  const [printerIp, setPrinterIp] = useState("192.168.1.100");
  const [productName, setProductName] = useState("Produto Teste");
  const [productBatch, setProductBatch] = useState("LOTE123");
  const [productExpiry, setProductExpiry] = useState("2024-12-31"); // Formato YYYY-MM-DD
  const [isLoading, setIsLoading] = useState(false); // Estado para feedback de carregamento
  const [message, setMessage] = useState(""); // Estado para mensagens de sucesso/erro

  const handlePrint = async () => {
    if (!printerIp) {
      setMessage("Erro: Por favor, informe o IP da impressora.");
      alert("Erro: Por favor, informe o IP da impressora."); // Manter alert por enquanto para visibilidade
      return;
    }
    if (!productName || !productExpiry) {
      setMessage("Erro: Nome do Produto e Data de Validade são obrigatórios.");
      alert("Erro: Nome do Produto e Data de Validade são obrigatórios."); // Manter alert
      return;
    }

    setIsLoading(true);
    setMessage("Enviando para impressora...");

    try {
      const response = await fetch("/api/print-simple", {
        // Endpoint da sua API
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          printerIp,
          productName,
          productBatch,
          productExpiry,
        }),
      });

      const result = await response.json(); // Tenta parsear a resposta como JSON

      if (response.ok) {
        setMessage(`Sucesso: ${result.message}`);
        alert(`Sucesso: ${result.message}`); // Manter alert
      } else {
        // A API já deve retornar um JSON com { message: "...", error: "..." }
        const errorMsg =
          result.error || result.message || "Erro desconhecido da API.";
        setMessage(`Erro (${response.status}): ${errorMsg}`);
        alert(`Erro (${response.status}): ${errorMsg}`); // Manter alert
      }
    } catch (error: unknown) {
      console.error("Erro no fetch:", error);
      let errorMsg = "Erro ao tentar comunicar com a API.";
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      setMessage(`Erro de comunicação: ${errorMsg}`);
      alert(`Erro de comunicação: ${errorMsg}`); // Manter alert
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Impressão ZPL Simples</h1>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="printerIp">IP da Impressora:</label>
        <br />
        <input
          type="text"
          id="printerIp"
          value={printerIp}
          onChange={(e) => setPrinterIp(e.target.value)}
          disabled={isLoading}
          style={{ border: "1px solid #ccc", padding: "8px", width: "200px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="productName">Nome do Produto:</label>
        <br />
        <input
          type="text"
          id="productName"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          disabled={isLoading}
          style={{ border: "1px solid #ccc", padding: "8px", width: "300px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="productBatch">Lote:</label>
        <br />
        <input
          type="text"
          id="productBatch"
          value={productBatch}
          onChange={(e) => setProductBatch(e.target.value)}
          disabled={isLoading}
          style={{ border: "1px solid #ccc", padding: "8px", width: "200px" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="productExpiry">Data de Validade (YYYY-MM-DD):</label>
        <br />
        <input
          type="date" // Usa o seletor de data do navegador
          id="productExpiry"
          value={productExpiry}
          onChange={(e) => setProductExpiry(e.target.value)}
          disabled={isLoading}
          style={{ border: "1px solid #ccc", padding: "8px", width: "200px" }}
        />
      </div>

      <button
        onClick={handlePrint}
        disabled={isLoading} // Desabilita o botão durante o carregamento
        style={{
          padding: "10px 20px",
          backgroundColor: isLoading ? "grey" : "blue", // Muda a cor quando carregando
          color: "white",
          border: "none",
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "Imprimindo..." : "IMPRIMIR ETIQUETA"}
      </button>
      {/* Exibe a mensagem de status/erro */}
      {message && (
        <p
          style={{
            marginTop: "15px",
            color: message.startsWith("Erro") ? "red" : "green",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
