import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class AppointmentsGateway {
  @WebSocketServer()
  server: Server;

  emitQueueUpdate(doctorId: string, queueData: any) {
    this.server.emit(`queue:${doctorId}`, queueData);
  }

  @SubscribeMessage('joinDoctorQueue')
  handleJoinQueue(client: any, doctorId: string) {
    client.join(`doctor-${doctorId}`);
  }
}
