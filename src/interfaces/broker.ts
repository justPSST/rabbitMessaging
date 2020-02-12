import { Exchange, Message, Queue } from 'amqp-ts';

export interface IBroker {
  callbackQueue: string;
  initialize(prefetch?: number): Promise<void>;
  subscribe(queueName: string, callback: Function, exchange: Exchange, ack: boolean): Promise<void>;
  sendRequest(code: number, body: object, targetService: string): Promise<any>;
  sendResponse(action: Function, body: object, message: Message, queueName: string): Promise<Message>;
  declareQueue(name: string, options?: Queue.DeclarationOptions): Queue;
  declareExchange(name: string, type: string, options?: Exchange.DeclarationOptions): Exchange;
  sendToExchange(code: number, body: any, exchangeName: string): void;
  publishMessage(msg: string, queueName: string): void;
  publishMessageWithCode(code: number, body: any, queueName: string): void;
  isConnected(): boolean;
}