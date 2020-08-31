import { Exchange, Message, Queue } from 'amqp-ts';

export interface IBroker {
  callbackQueue: string | undefined;
  initialize(): Promise<void>;
  subscribe(queueName: string, callback: Function, exchange: Exchange | undefined, ack: boolean): Promise<void>;
  sendRequest<T>(code: number, body: object, targetService: string): Promise<T>;
  sendResponse(action: Function, body: object, message: Message, queueName: string): Promise<Message>;
  declareQueue(name: string, options?: Queue.DeclarationOptions): Queue;
  declareExchange(name: string, type: string, options?: Exchange.DeclarationOptions): Exchange;
  sendToExchange(code: number, body: any, exchangeName: string): void;
  publishMessage(msg: string, queueName: string): void;
  publishMessageWithCode(code: number, body: any, queueName: string): void;
  isConnected(): boolean;
}