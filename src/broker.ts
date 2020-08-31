import { Exchange, Message, Connection, Queue } from 'amqp-ts';
import { IBroker } from './interfaces/broker';
import { v4 } from 'uuid';
import { IRequestPromise } from './interfaces/requestPromise';
import { IActionResult } from './interfaces/actionResult';
import { IBrokerConfig } from './interfaces/brokerConfig';

export class Broker implements IBroker {
  
  /**
   * @param prefetch
   * The maximum number of messages sent over the channel that can be awaiting acknowledgement
   */
  private prefetch: number;

  /**
   * @param requestPromise
   * The collection of requests
   */
  private requestPromise: IRequestPromise = {};

  public callbackQueue: string | undefined;

  private connection: Connection;

  constructor(configuration: IBrokerConfig) {
    this.connection = new Connection(configuration.host || 'amqp://localhost');
    this.prefetch = configuration.prefetch || 100;
  }

  public async initialize(): Promise<void> {
    await this.connection.completeConfiguration();
  }

  public async subscribe(queueName: string, callback: Function, exchange?: Exchange, ack: boolean = true): Promise<void> {
    const queue = this.connection.declareQueue(queueName, {
      prefetch: this.prefetch
    });

    if (exchange) {
      await queue.bind(exchange);
    }

    queue.activateConsumer(async message => {
      const body = message.getContent() as IActionResult;

      const correlationId = message.properties.correlationId;
      const def = this.requestPromise[correlationId];

      if (correlationId && def) {
        if (!body.error) {
            def.resolve(body.response);
        } else {
            def.reject(body.response);
        }
        delete this.requestPromise[correlationId];
      } else {
        if (callback === null) {
          return new Message();
        } else {
          const response = await this.sendResponse(callback, body, message, queueName);
          if (ack) {
            message.ack();
          }
          return response;
        }
      }
    },
    { noAck: !ack })
  }

  public sendRequest<T>(code: number, body: object, targetService: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = v4();
      this.requestPromise[requestId] = { resolve, reject };
      const message = new Message({ code, body });
      message.properties.replyTo = this.callbackQueue;
      message.properties.correlationId = requestId;
      return this.connection.declareQueue(targetService, { noCreate: true}).send(message);
    });
  }

  public async sendResponse(action: Function, body: object, message: Message, queueName: string): Promise<Message> {
    const reply = await this.executeAction(action, body, queueName);
    const replyMessage = new Message(reply);
    replyMessage.properties.correlationId = message.properties.correlationId;
    return replyMessage;
  }

  public sendToExchange(code: number, body: any, exchangeName: string): void {
    const message = new Message({ code, body });
    const exchange = this.connection.declareExchange(exchangeName, undefined, { noCreate: true });
    exchange.send(message);
  }

  public publishMessage(msg: string, queueName: string): void {
    const message = new Message(msg);
    const queue = this.connection.declareQueue(queueName);
    queue.send(message);
  }

  public publishMessageWithCode(code: number, body: any, queueName: string): void {
      const message = new Message({ code, body });
      const queue = this.connection.declareQueue(queueName);
      queue.send(message);
  }

  public declareQueue(name: string, options?: Queue.DeclarationOptions): Queue {
    return this.connection.declareQueue(name, options);
  }

  public declareExchange(name: string, type: string, options?: Exchange.DeclarationOptions): Exchange {
      return this.connection.declareExchange(name, type, options);
  }

  private async executeAction(action: Function, body: object, queueName: string): Promise<IActionResult> {
    try {
      const result = await action(body);
      return {
        error: false,
        response: result
      };
    } catch (error) {
      // TODO log error with queueName
      this.sendError(error, body, queueName);
      return {
        error: true,
        response: error.message || error
      };
    }
  }

  private sendError(error: any, body: any, queueName: string): void {
    const errorMessage = new Message({
        exception: error.message,
        stack: error.stack,
        onMessage: body,
        to: queueName,
        date: new Date().toUTCString()
    });

    this.connection.declareQueue(queueName).send(errorMessage);
  }

  public isConnected(): boolean {
    return this.connection.isConnected;
  }
}
