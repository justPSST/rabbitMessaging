import { IBroker } from './interfaces/broker';
import { Broker } from './broker';
import { v4 } from 'uuid';

class BrokerUtil {

  private static broker: IBroker;

  public static getBroker(): IBroker {
    if (!this.broker) {
      this.broker = new Broker();
    }
    return this.broker;
  }
}

const broker = BrokerUtil.getBroker();

export const configureService = async (serviceName: string, callback: Function, connectionString?: string) => {
  await broker.initialize();
  const queueName = serviceName;
  const callBackQueue = `${queueName}-${v4()}`;
  broker.declareQueue(callBackQueue, { autoDelete: true });
  broker.callbackQueue = callBackQueue;
  broker.subscribe(callBackQueue, callback, undefined, false);
  broker.subscribe(queueName, callback, undefined, true);
  setTimeout(() => {
    const isConnected = broker.isConnected();
    console.log(isConnected ? 'Broker succesfully connected' : 'Broker connection failed. Check configuration');
  }, 5000);
}

export const sendRequest = async (code: number, body: any, queueName: string) => {
  try {
    const result = await broker.sendRequest(code, body, queueName);
    return result;
  } catch (error) {
    return error;
  }
}
