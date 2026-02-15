import { createServer } from "http";
import { Server } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../src/types/index";

const httpServer = createServer((req, res) => {
  // Internal emit endpoint for API routes to trigger broadcasts
  if (req.method === "POST" && req.url === "/emit") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { event, room, data } = JSON.parse(body);
        if (room) {
          io.to(room).emit(event, data);
        } else {
          io.emit(event, data);
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on("join:restaurant", ({ restaurantId }) => {
    socket.join(`restaurant:${restaurantId}`);
    console.log(`[Socket.IO] ${socket.id} joined restaurant:${restaurantId}`);
  });

  socket.on("leave:restaurant", ({ restaurantId }) => {
    socket.leave(`restaurant:${restaurantId}`);
  });

  socket.on("join:waitlistTrack", ({ trackingToken }) => {
    socket.join(`waitlist:${trackingToken}`);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
});
