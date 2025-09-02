import express, { type Request, type Response} from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import z from "zod";
import { generateFeedback } from "./feedback";
import { deepResearch } from "./deep-research";
import dotenv from "dotenv"

dotenv.config();


const app = express();
app.use(express.json());

const port = process.env.MCP_PORT || 3052;

app.post('/mcp', async (req: Request, res: Response) => {
  // In stateless mode, create a new instance of transport and server for each request
  // to ensure complete isolation. A single instance would cause request ID collisions
  // when multiple clients connect concurrently.
  
  try {
    const server = new McpServer({
      name: "example-server",
      version: "1.0.0"
    });


    server.registerTool('start_research', {
        description: 'Erstellt einen neuen Forschungsplan und sendet Fragen zurück',
        inputSchema: {
            query: z.string().min(5).max(1000)
        }
    },
    async ({ query }) => {
       const followUpQuestions = await generateFeedback({
             query: query,
           });

        return {
            content: [
                {
                    type: "text",
                    text: followUpQuestions.join("\n")
                }
            ]
        }
    });

    server.registerTool('deep_research', {
      description: 'Führt eine tiefgehende Recherche durch',
      inputSchema: {
        query: z.string().min(5).max(1000).describe("Kombiniert aus ursprünglicher Anfrage sowie den Antworten auf die Follow-up Fragen"),
        breadth: z.number().min(1).max(10).describe("Die Breite der Recherche").default(4),
        depth: z.number().min(1).max(5).describe("Die Tiefe der Recherche").default(2)
      }
    },
    async ({ query, breadth, depth }) => {
      const { learnings, visitedUrls } = await deepResearch({
        query: query,
        breadth: breadth,
        depth: depth
      });

      

      return {
        content: [
          {
            type: "text",
            text: `\n\nLearnings:\n\n${learnings.join('\n')} \n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`
          }
        ]
      }
    });

    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// SSE notifications not supported in stateless mode
app.get('/mcp', async (_: Request, res: Response) => {
  console.log('Received GET MCP request');
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
});

app.delete('/mcp', async (_: Request, res: Response) => {
    console.log('Received DELETE MCP request');
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      }),
    );
  });



  app.listen(port, () => {
    console.log(`MCP Stateless Streamable HTTP Server listening on port ${port}`);
  });
