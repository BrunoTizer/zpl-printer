// mock-printer-server.js
import net from "net";
const port = 9100;

const server = net.createServer((socket) => {
  console.log("Impressora Mock: Cliente conectado!");
  socket.on("data", (data) => {
    console.log("Impressora Mock: Recebeu dados:");
    console.log("-------------------------------------------");
    console.log(data.toString()); // Mostra o ZPL recebido
    console.log("-------------------------------------------");
  });

  socket.on("end", () => {
    console.log("Impressora Mock: Cliente desconectado.");
  });

  socket.on("error", (err) => {
    console.error("Impressora Mock: Erro no socket:", err.message);
  });

  // Simula uma resposta ou apenas fecha a conexão
  // socket.write('Dados recebidos pela impressora mock!\r\n');
  // socket.end(); // Descomente se quiser que ele feche a conexão após receber dados
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Impressora Mock: Porta ${port} já está em uso.`);
  } else {
    console.error("Impressora Mock: Erro no servidor:", err.message);
  }
  process.exit(1);
});

server.listen(port, "0.0.0.0", () => {
  // Escuta em todas as interfaces de rede
  console.log(`Impressora Mock escutando em 0.0.0.0:${port}`);
});
