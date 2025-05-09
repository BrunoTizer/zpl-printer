// local-print-agent.js

import http from "http";
import net from "net";
import { URL } from "url"; // Para parsear query params

const AGENT_PORT = 9200; // Porta que este agente vai escutar

const server = http.createServer(async (req, res) => {
  // Configurar CORS Headers para permitir requisições do seu PWA/WebApp
  res.setHeader("Access-Control-Allow-Origin", "*"); // Para teste, permite qualquer origem
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Lidar com requisições pre-flight OPTIONS do CORS
  if (req.method === "OPTIONS") {
    res.writeHead(204); // No Content
    res.end();
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/print")) {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const printerIp = requestUrl.searchParams.get("printerIp");
    const printerPort = parseInt(
      requestUrl.searchParams.get("printerPort") || "9100",
      10
    );

    if (!printerIp) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "IP da impressora (printerIp) não fornecido como query parameter.",
        })
      );
      return;
    }

    let zplData = "";
    req.on("data", (chunk) => {
      zplData += chunk.toString();
    });

    req.on("end", async () => {
      if (!zplData) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Nenhum dado ZPL recebido no corpo da requisição.",
          })
        );
        return;
      }

      console.log(
        `Agente: Recebido ZPL para impressora ${printerIp}:${printerPort}`
      );
      // console.log('ZPL:\n', zplData); // Descomente para ver o ZPL

      try {
        await new Promise((resolve, reject) => {
          const client = new net.Socket();
          client.setTimeout(5000); // 5 segundos de timeout

          client.connect(printerPort, printerIp, () => {
            console.log(
              `Agente: Conectado à impressora ${printerIp}:${printerPort}`
            );
            client.write(zplData, "utf8", (err) => {
              if (err) {
                console.error("Agente: Erro ao enviar ZPL:", err);
                client.destroy();
                return reject(err);
              }
              console.log("Agente: ZPL enviado com sucesso.");
              client.end();
              resolve();
            });
          });

          client.on("error", (err) => {
            console.error(
              `Agente: Erro de conexão com impressora ${printerIp}:${printerPort} -`,
              err.message
            );
            client.destroy();
            reject(err);
          });

          client.on("timeout", () => {
            console.error(
              `Agente: Timeout conectando à impressora ${printerIp}:${printerPort}`
            );
            client.destroy();
            reject(new Error("Timeout da conexão com a impressora"));
          });
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "ZPL enviado para a impressora pela agente.",
          })
        );
      } catch (error) {
        console.error("Agente: Falha ao processar impressão:", error.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: `Falha ao imprimir na agente: ${error.message}`,
          })
        );
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error:
          "Endpoint não encontrado. Use POST /print?printerIp=IP_DA_IMPRESSORA",
      })
    );
  }
});

server.listen(AGENT_PORT, () => {
  console.log(
    `Agente de Impressão Local "Bosta" rodando na porta ${AGENT_PORT}`
  );
  console.log(
    `Para imprimir, envie um POST para http://SEU_IP_LOCAL:${AGENT_PORT}/print?printerIp=IP_DA_IMPRESSORA_REAL`
  );
  console.log(
    "O corpo da requisição POST deve ser o código ZPL em texto puro."
  );
});

server.on("error", (err) => {
  console.error("Agente: Erro no servidor:", err);
});
