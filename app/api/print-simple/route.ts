// app/api/print-simple/route.ts
import net from "net";
import { NextRequest, NextResponse } from "next/server";

// Função ZPL super simples, direto na API route
function generateSimpleZPL(
  name?: string,
  batch?: string,
  expiry?: string
): string {
  // Formatar data de YYYY-MM-DD para DD/MM/YYYY se necessário
  let formattedExpiry = expiry;
  if (expiry && expiry.includes("-")) {
    const parts = expiry.split("-"); // YYYY-MM-DD
    if (parts.length === 3) {
      formattedExpiry = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
  }

  // Uso de template literals para o ZPL
  // ^CI28 para tentar habilitar UTF-8 (bom para acentos)
  // Ajuste ^FO (posição) e ^A0N (fonte, tamanho) conforme sua etiqueta
  return `
^XA
^CI28 
^FO50,50^A0N,35,35^FDProd: ${name ? name.substring(0, 20) : "N/A"}^FS
^FO50,100^A0N,30,30^FDLote: ${batch ? batch.substring(0, 15) : "N/A"}^FS
^FO50,150^A0N,30,30^FDVal: ${formattedExpiry || "N/A"}^FS
^XZ
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productName, productBatch, productExpiry, printerIp } = body;

    if (!printerIp) {
      return NextResponse.json(
        { message: "IP da impressora é obrigatório" },
        { status: 400 }
      );
    }
    // Podemos tornar nome e validade opcionais no ZPL, mas vamos manter a validação por enquanto
    if (!productName || !productExpiry) {
      return NextResponse.json(
        { message: "Nome e Validade são obrigatórios para a etiqueta" },
        { status: 400 }
      );
    }

    const zplCode = generateSimpleZPL(productName, productBatch, productExpiry);
    console.log("Enviando ZPL para IP:", printerIp);
    console.log("Código ZPL:\n", zplCode); // Log para debug

    await new Promise<void>((resolve, reject) => {
      const client = new net.Socket();
      client.setTimeout(5000); // 5 segundos de timeout

      // Conecta na porta 9100, padrão para impressoras Zebra via TCP/IP
      client.connect({ port: 9100, host: printerIp }, () => {
        // console.log(`Conectado a ${printerIp}:9100`);
        client.write(zplCode, "utf8", (err) => {
          if (err) {
            console.error("Erro ao enviar ZPL:", err);
            client.destroy(); // Garante que o socket seja fechado em caso de erro
            return reject(err);
          }
          // console.log('ZPL enviado com sucesso.');
          client.end(); // Fecha a conexão após o envio
          resolve();
        });
      });

      client.on("error", (err) => {
        console.error("Erro de conexão com a impressora:", err.message);
        client.destroy();
        reject(err); // Rejeita a promise se houver erro de conexão
      });

      client.on("timeout", () => {
        console.error("Timeout da conexão com a impressora.");
        client.destroy();
        reject(new Error("Timeout da conexão com a impressora"));
      });

      client.on("close", (hadError) => {
        if (hadError) {
          // console.error('Conexão fechada devido a um erro.');
          // Se a promise ainda não foi rejeitada, fazemos isso agora.
          // Isso pode ser redundante se 'error' ou 'timeout' já a rejeitaram.
        } else {
          // console.log('Conexão com a impressora fechada normalmente.');
        }
      });
    });

    return NextResponse.json({ message: "Etiqueta enviada para impressora!" });
  } catch (error: unknown) {
    console.error("Erro na API de impressão:", error);

    let errorMessage = "Ocorreu um erro inesperado.";
    let errorCode: string | undefined = undefined;
    let status = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Verifica se o erro tem uma propriedade 'code' (comum em erros de sistema como os do 'net')
      // NodeJS.ErrnoException é um tipo que estende Error e tem 'code'
      if ("code" in error && typeof (error as any).code === "string") {
        errorCode = (error as any).code;
      }
    } else {
      // Se não for uma instância de Error, tenta converter para string
      errorMessage = String(error);
    }

    // Lógica para definir o status baseado no tipo de erro
    if (
      errorMessage.toLowerCase().includes("timeout") ||
      (errorCode &&
        (errorCode === "ECONNREFUSED" ||
          errorCode === "EHOSTUNREACH" ||
          errorCode === "ENOTFOUND"))
    ) {
      status = 400; // Erro do cliente (IP errado, impressora desligada) ou 503 (serviço indisponível)
    }
    // Se for um erro de JSON parsing, por exemplo, também poderia ser 400
    // if (error instanceof SyntaxError && errorMessage.toLowerCase().includes("json")) {
    //   status = 400;
    //   errorMessage = "Corpo da requisição inválido (JSON malformado)."
    // }

    return NextResponse.json(
      { message: "Falha ao imprimir", error: errorMessage },
      { status }
    );
  }
}
