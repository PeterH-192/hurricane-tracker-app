"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let globalSocket: TypedSocket | null = null;

function getSocket(): TypedSocket {
  if (!globalSocket) {
    globalSocket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      { autoConnect: false }
    );
  }
  return globalSocket;
}

export function useSocket(restaurantId?: string) {
  const socketRef = useRef<TypedSocket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }

    if (restaurantId) {
      socket.emit("join:restaurant", { restaurantId });
    }

    return () => {
      if (restaurantId) {
        socket.emit("leave:restaurant", { restaurantId });
      }
    };
  }, [restaurantId]);

  return socketRef.current;
}

export function useWaitlistTracker(trackingToken: string) {
  const socketRef = useRef<TypedSocket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join:waitlistTrack", { trackingToken });

    return () => {
      // Socket will leave room on disconnect
    };
  }, [trackingToken]);

  return socketRef.current;
}
